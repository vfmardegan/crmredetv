const express = require("express");
const { pool } = require("../db");
const { requirePermission } = require("../utils/acl");

const router = express.Router();

/**
 * GET /api/v1/engajamento
 * Retorna os indicadores de engajamento da equipe comercial para Diretores e Admins.
 * Parâmetros de query:
 *  - periodo: '7d' | '30d' | '90d' | 'total' (padrão: '30d')
 *  - diretor_id: opcional (somente utilizado por admins para filtrar por diretor)
 */
router.get("/engajamento", requirePermission("can_view_engajamento"), async (req, res) => {
  try {
    const user = req.user;
    const { periodo = "30d", diretor_id } = req.query;

    // 1. Resolução do intervalo de data
    let startDate = null;
    const now = new Date();
    if (periodo === "7d") {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      startDate = d.toISOString().split("T")[0];
    } else if (periodo === "30d") {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      startDate = d.toISOString().split("T")[0];
    } else if (periodo === "90d") {
      const d = new Date(now);
      d.setDate(d.getDate() - 90);
      startDate = d.toISOString().split("T")[0];
    }
    // se periodo === 'total', startDate permanece null

    // 2. Determina a lista de diretores (para dropdown de filtros do Admin)
    let diretores = [];
    if (user.perfil === "admin") {
      const dirRes = await pool.query(
        "SELECT id, nome, email FROM usuarios WHERE perfil = 'diretor' AND ativo = true ORDER BY nome ASC"
      );
      diretores = dirRes.rows;
    }

    // 3. Determina o escopo de executivos permitidos
    let allowedExecIds = null;

    if (user.perfil === "diretor") {
      // Diretor só pode ver executivos vinculados a ele na tabela diretor_executivos
      const dirExecRes = await pool.query(
        "SELECT executivo_id FROM diretor_executivos WHERE diretor_id = $1",
        [user.id]
      );
      allowedExecIds = dirExecRes.rows.map((r) => r.executivo_id).filter(Boolean);
      if (allowedExecIds.length === 0) {
        return res.json({
          periodo,
          startDate,
          diretores: [],
          executivos: [],
        });
      }
    } else if (user.perfil === "admin") {
      // Se admin passou filtro de diretor específico
      if (diretor_id && String(diretor_id).trim() !== "") {
        const dirExecRes = await pool.query(
          "SELECT executivo_id FROM diretor_executivos WHERE diretor_id = $1",
          [diretor_id]
        );
        allowedExecIds = dirExecRes.rows.map((r) => r.executivo_id).filter(Boolean);
        if (allowedExecIds.length === 0) {
          return res.json({
            periodo,
            startDate,
            diretores,
            executivos: [],
          });
        }
      }
      // Se não passou diretor_id, allowedExecIds = null (todos os executivos)
    } else {
      return res.status(403).json({ error: "Acesso restrito a administradores e diretores." });
    }

    // 4. Busca os executivos dentro do escopo
    let execQuery = `
      SELECT e.id, e.nome, u.email, u.foto_url, u.id AS usuario_id
      FROM executivos e
      LEFT JOIN usuarios u ON (u.executivo_id = e.id OR LOWER(TRIM(u.nome)) = LOWER(TRIM(e.nome)))
    `;
    const execParams = [];
    if (allowedExecIds !== null) {
      execQuery += ` WHERE e.id = ANY($1::varchar[])`;
      execParams.push(allowedExecIds);
    }
    execQuery += ` ORDER BY e.nome ASC`;

    const execListRes = await pool.query(execQuery, execParams);
    const executivosList = execListRes.rows;

    if (executivosList.length === 0) {
      return res.json({
        periodo,
        startDate,
        diretores,
        executivos: [],
      });
    }

    // 5. Cálculo dos 8 indicadores para cada executivo em paralelo
    const results = await Promise.all(
      executivosList.map(async (exec) => {
        const execId = exec.id;
        const execNome = exec.nome;
        const usuarioId = exec.usuario_id || null;

        // Query agregada com as 8 métricas
        const metricQuery = `
          WITH
          -- 1. Oportunidades Criadas, Volume Criado, Volume Fechado e Conversão no Período
          opp_periodo AS (
            SELECT
              COUNT(*)::int AS criadas,
              COUNT(*) FILTER (WHERE briefing ILIKE '%Radar de Mercado%' OR title ILIKE '%Radar de Mercado%')::int AS radar_criadas,
              COALESCE(SUM(value), 0)::numeric(14,2) AS volume_criado,
              COALESCE(SUM(value) FILTER (WHERE stage = 'Fechado'), 0)::numeric(14,2) AS volume_fechado,
              COUNT(*) FILTER (WHERE stage = 'Fechado')::int AS fechadas,
              COUNT(*) FILTER (WHERE stage IN ('Negado', 'Cancelado'))::int AS perdidas
            FROM opportunities o
            WHERE (o.executivo_id = $1 OR LOWER(TRIM(o.executivo)) = LOWER(TRIM($2)))
              AND ($3::date IS NULL OR COALESCE(o.data_criacao, o.created_at::date) >= $3::date)
          ),

          -- 2. Oportunidades Estagnadas (> 15 dias sem interação em estágio aberto)
          opp_estagnadas AS (
            SELECT COUNT(*)::int AS estagnadas
            FROM opportunities o
            WHERE (o.executivo_id = $1 OR LOWER(TRIM(o.executivo)) = LOWER(TRIM($2)))
              AND o.stage IN ('Desenvolvimento', 'Frio', 'Morno', 'Quente')
              AND COALESCE(o.data_criacao, o.created_at::date) <= CURRENT_DATE - INTERVAL '15 days'
              AND NOT EXISTS (
                SELECT 1 FROM client_interactions ci
                WHERE ci.client_id = o.advertiser_id
                  AND ci.date >= CURRENT_DATE - INTERVAL '15 days'
              )
          ),

          -- 3. Contatos Completos (carteira do executivo com todos os 7 campos)
          contatos_completos AS (
            SELECT COUNT(DISTINCT cnt.id)::int AS completos
            FROM contacts cnt
            JOIN clients cl ON cl.id = cnt.client_id
            WHERE (
              (cl.type = 'Anunciante' AND (
                cl.segmento IN (SELECT segmento FROM segmento_executivo WHERE executivo_id = $1)
                OR cl.id IN (SELECT client_id FROM carteira_key_accounts WHERE executivo_id = $1)
              ))
              OR
              (cl.type = 'Agência' AND cl.id IN (
                SELECT al.agency_id FROM agency_links al
                JOIN clients adv ON adv.id = al.advertiser_id
                WHERE (adv.segmento IN (SELECT segmento FROM segmento_executivo WHERE executivo_id = $1)
                   OR adv.id IN (SELECT client_id FROM carteira_key_accounts WHERE executivo_id = $1))
              ))
            )
            AND NULLIF(TRIM(cnt.name), '') IS NOT NULL
            AND NULLIF(TRIM(cnt.client_id), '') IS NOT NULL
            AND NULLIF(TRIM(cnt.cargo), '') IS NOT NULL
            AND NULLIF(TRIM(cnt.departamento), '') IS NOT NULL
            AND NULLIF(TRIM(cnt.nivel_decisao), '') IS NOT NULL
            AND NULLIF(TRIM(cnt.celular), '') IS NOT NULL
            AND NULLIF(TRIM(cnt.email), '') IS NOT NULL
          ),

          -- 4. Atividades nos Cards dos Clientes no Período
          atividades_cards AS (
            SELECT COUNT(*)::int AS total_atividades
            FROM client_interactions ci
            WHERE (
              ($4::int IS NOT NULL AND ci.user_id = $4::int)
              OR ci.client_id IN (
                SELECT cl.id FROM clients cl
                WHERE (
                  (cl.type = 'Anunciante' AND (
                    cl.segmento IN (SELECT segmento FROM segmento_executivo WHERE executivo_id = $1)
                    OR cl.id IN (SELECT client_id FROM carteira_key_accounts WHERE executivo_id = $1)
                  ))
                  OR
                  (cl.type = 'Agência' AND cl.id IN (
                    SELECT al.agency_id FROM agency_links al
                    JOIN clients adv ON adv.id = al.advertiser_id
                    WHERE (adv.segmento IN (SELECT segmento FROM segmento_executivo WHERE executivo_id = $1)
                       OR adv.id IN (SELECT client_id FROM carteira_key_accounts WHERE executivo_id = $1))
                  ))
                )
              )
            )
            AND ($3::date IS NULL OR ci.date >= $3::date)
          )

          SELECT
            op.criadas,
            op.radar_criadas,
            op.volume_criado,
            op.volume_fechado,
            op.fechadas,
            op.perdidas,
            es.estagnadas,
            cc.completos,
            at.total_atividades
          FROM opp_periodo op
          CROSS JOIN opp_estagnadas es
          CROSS JOIN contatos_completos cc
          CROSS JOIN atividades_cards at;
        `;

        const mRes = await pool.query(metricQuery, [execId, execNome, startDate, usuarioId]);
        const m = mRes.rows[0] || {};

        const fechadas = m.fechadas || 0;
        const perdidas = m.perdidas || 0;
        const totalConcluidas = fechadas + perdidas;
        const taxaConversao =
          totalConcluidas > 0 ? Number(((fechadas / totalConcluidas) * 100).toFixed(1)) : 0;

        return {
          id: execId,
          nome: execNome,
          email: exec.email || "",
          foto_url: exec.foto_url || null,
          oportunidadesCriadas: m.criadas || 0,
          oportunidadesEstagnadas: m.estagnadas || 0,
          contatosCompletos: m.completos || 0,
          oportunidadesRadar: m.radar_criadas || 0,
          atividadesCards: m.total_atividades || 0,
          volumeCriado: Number(m.volume_criado || 0),
          volumeFechado: Number(m.volume_fechado || 0),
          taxaConversao: taxaConversao,
          fechadas,
          perdidas,
        };
      })
    );

    res.json({
      periodo,
      startDate,
      diretores,
      executivos: results,
    });
  } catch (err) {
    console.error("Erro em GET /api/v1/engajamento:", err);
    res.status(500).json({ error: "Erro interno ao carregar indicadores de engajamento." });
  }
});

module.exports = router;
