const express = require("express");
const { pool } = require("../db");
const { requirePermission } = require("../utils/acl");
const intelligenceScheduler = require("../services/intelligenceScheduler");

const router = express.Router();

// GET /api/v1/intelligence/news — Lista notícias do radar com filtros
router.get("/intelligence/news", async (req, res) => {
  const { segmento, search, today, limit } = req.query;
  const user = req.user;


  try {
    let query = "SELECT * FROM market_news WHERE 1=1";
    const params = [];

    // Se o usuário for perfil executivo, restringe o escopo à sua carteira e notícias gerais de agências
    if (user && user.perfil === "executivo") {
      let resolvedExecId = user.executivo_id;
      if (!resolvedExecId) {
        resolvedExecId = `e_${user.id}`;
      }

      // 1. Segmentos da carteira do executivo
      const segRes = await pool.query(
        "SELECT segmento FROM segmento_executivo WHERE executivo_id = $1",
        [resolvedExecId]
      );
      const allowedSegments = segRes.rows.map((r) => r.segmento);

      // 2. Marcas em Key Accounts da carteira
      const kaRes = await pool.query(
        `SELECT c.nome_fantasia, c.razao_social 
         FROM carteira_key_accounts ka 
         JOIN clients c ON c.id = ka.client_id 
         WHERE ka.executivo_id = $1`,
        [resolvedExecId]
      );
      const keyAccountNames = kaRes.rows
        .flatMap((r) => [r.nome_fantasia, r.razao_social])
        .filter(Boolean)
        .map((n) => n.trim().toLowerCase());

      const scopeConditions = [];

      // Notícias do segmento comercial do executivo
      if (allowedSegments.length > 0) {
        params.push(allowedSegments);
        scopeConditions.push(`segmento_crm = ANY($${params.length})`);
      }

      // Notícias gerais de agências (segmento de agência, sem anunciante específico ou tag Agências)
      scopeConditions.push(`(
        segmento_crm IN ('Agências de Publicidade', 'Agências') OR 
        (COALESCE(anunciante_mencionado, 'N/A') = 'N/A' AND COALESCE(agencia_mencionada, 'N/A') != 'N/A') OR
        'Agências' = ANY(tags)
      )`);

      // Notícias de marcas/anunciantes da carteira Key Accounts do executivo
      if (keyAccountNames.length > 0) {
        const kaPatterns = keyAccountNames.map((n) => `%${n}%`);
        params.push(kaPatterns);
        scopeConditions.push(`LOWER(COALESCE(anunciante_mencionado, '')) LIKE ANY($${params.length})`);
      }

      query += ` AND (${scopeConditions.join(" OR ")})`;
    }

    if (segmento && segmento.trim() !== "" && segmento !== "Todos") {
      params.push(segmento.trim());
      query += ` AND segmento_crm = $${params.length}`;
    }

    if (search && search.trim() !== "") {
      params.push(`%${search.trim().toLowerCase()}%`);
      const pIdx = params.length;
      query += ` AND (
        LOWER(titulo_original) LIKE $${pIdx} OR 
        LOWER(resumo_executivo) LIKE $${pIdx} OR 
        LOWER(gatilho_comercial) LIKE $${pIdx} OR 
        LOWER(COALESCE(anunciante_mencionado, '')) LIKE $${pIdx} OR 
        LOWER(COALESCE(agencia_mencionada, '')) LIKE $${pIdx}
      )`;
    }

    if (today === "true" || today === "1") {
      query += " AND data_publicacao = (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')::date";
    }

    query += " ORDER BY data_publicacao DESC, created_at DESC";
    if (limit && parseInt(limit, 10) > 0) {
      params.push(parseInt(limit, 10));
      query += ` LIMIT $${params.length}`;
    }

    const result = await pool.query(query, params);

    // Contadores por segmento para badges (respeitando o mesmo escopo do perfil)
    let countQuery = "SELECT segmento_crm, COUNT(*) as total FROM market_news WHERE 1=1";
    let todayCountQuery = "SELECT COUNT(*) as total_today FROM market_news WHERE data_publicacao = (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')::date";
    const countParams = [];

    if (user && user.perfil === "executivo") {
      let resolvedExecId = user.executivo_id || `e_${user.id}`;
      const segRes = await pool.query(
        "SELECT segmento FROM segmento_executivo WHERE executivo_id = $1",
        [resolvedExecId]
      );
      const allowedSegments = segRes.rows.map((r) => r.segmento);

      const kaRes = await pool.query(
        `SELECT c.nome_fantasia, c.razao_social 
         FROM carteira_key_accounts ka 
         JOIN clients c ON c.id = ka.client_id 
         WHERE ka.executivo_id = $1`,
        [resolvedExecId]
      );
      const keyAccountNames = kaRes.rows
        .flatMap((r) => [r.nome_fantasia, r.razao_social])
        .filter(Boolean)
        .map((n) => n.trim().toLowerCase());

      const scopeConditions = [];
      if (allowedSegments.length > 0) {
        countParams.push(allowedSegments);
        scopeConditions.push(`segmento_crm = ANY($${countParams.length})`);
      }
      scopeConditions.push(`(
        segmento_crm IN ('Agências de Publicidade', 'Agências') OR 
        (COALESCE(anunciante_mencionado, 'N/A') = 'N/A' AND COALESCE(agencia_mencionada, 'N/A') != 'N/A') OR
        'Agências' = ANY(tags)
      )`);
      if (keyAccountNames.length > 0) {
        const kaPatterns = keyAccountNames.map((n) => `%${n}%`);
        countParams.push(kaPatterns);
        scopeConditions.push(`LOWER(COALESCE(anunciante_mencionado, '')) LIKE ANY($${countParams.length})`);
      }
      countQuery += ` AND (${scopeConditions.join(" OR ")})`;
      todayCountQuery += ` AND (${scopeConditions.join(" OR ")})`;
    }

    countQuery += " GROUP BY segmento_crm ORDER BY total DESC";
    const countRes = await pool.query(countQuery, countParams);
    const todayRes = await pool.query(todayCountQuery, countParams);
    const todayCount = parseInt(todayRes.rows[0]?.total_today || 0, 10);

    const schedule = intelligenceScheduler.getScheduleStatus();

    res.json({
      news: result.rows,
      segmentCounts: countRes.rows,
      total: result.rows.length,
      todayCount,
      schedule,
    });
  } catch (err) {
    console.error("Erro ao listar notícias de inteligência:", err);
    res.status(500).json({ error: "Erro interno ao buscar notícias do radar de mercado." });

  }
});

// POST /api/v1/intelligence/news — Inserir nova notícia (admin ou automação)
router.post("/intelligence/news", requirePermission("can_manage_users"), async (req, res) => {
  const {
    id,
    data_publicacao,
    fonte,
    url,
    titulo_original,
    segmento_crm,
    anunciante_mencionado,
    agencia_mencionada,
    resumo_executivo,
    gatilho_comercial,
    acao_sugerida,
    tags,
  } = req.body;

  if (!titulo_original || !segmento_crm || !resumo_executivo || !gatilho_comercial) {
    return res.status(400).json({ error: "Campos obrigatórios ausentes." });
  }

  const newsId = id || `noticia_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const pubDate = data_publicacao || new Date().toISOString().split("T")[0];

  try {
    const insertRes = await pool.query(
      `INSERT INTO market_news (
        id, data_publicacao, fonte, url, titulo_original, segmento_crm,
        anunciante_mencionado, agencia_mencionada, resumo_executivo,
        gatilho_comercial, acao_sugerida, tags
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        newsId,
        pubDate,
        fonte || "Radar Comercial",
        url || "",
        titulo_original,
        segmento_crm,
        anunciante_mencionado || "N/A",
        agencia_mencionada || "N/A",
        resumo_executivo,
        gatilho_comercial,
        acao_sugerida || "",
        Array.isArray(tags) ? tags : [],
      ]
    );

    res.status(201).json(insertRes.rows[0]);
  } catch (err) {
    console.error("Erro ao inserir notícia de inteligência:", err);
    res.status(500).json({ error: "Não foi possível salvar a notícia no radar." });
  }
});

// DELETE /api/v1/intelligence/news/:id — Excluir notícia do radar (Apenas Administrador)
router.delete("/intelligence/news/:id", requirePermission("can_manage_users"), async (req, res) => {
  const { id } = req.params;
  const user = req.user;
  if (!user || user.perfil !== "admin") {
    return res.status(403).json({ error: "Apenas administradores têm permissão para excluir notícias do Radar de Mercado." });
  }
  try {
    const result = await pool.query("DELETE FROM market_news WHERE id = $1 RETURNING id", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Notícia não encontrada ou já removida." });
    }
    res.json({ success: true, id, message: "Notícia removida do radar com sucesso." });
  } catch (err) {
    console.error("Erro ao remover notícia:", err);
    res.status(500).json({ error: "Não foi possível remover a notícia." });
  }
});

// GET /api/v1/intelligence/schedule — Retorna o status da grade de 4 varreduras diárias (08h, 12h, 16h, 20h)
router.get("/intelligence/schedule", (req, res) => {
  res.json(intelligenceScheduler.getScheduleStatus());
});

// GET /api/v1/intelligence/sources — Retorna a curadoria completa das fontes monitoradas
const marketSources = require("../services/marketSources");
router.get("/intelligence/sources", (req, res) => {
  const all = marketSources.getAllActiveSources();
  res.json({
    total: all.length,
    publicidade_marketing: marketSources.MARKET_SOURCES.publicidade_marketing,
    economia_negocios: marketSources.MARKET_SOURCES.economia_negocios,
    setoriais: marketSources.MARKET_SOURCES.setoriais,
    sources: all,
  });
});

// POST /api/v1/intelligence/scrape — Força varredura sob demanda (admin, diretor ou especialista)
router.post("/intelligence/scrape", requirePermission("can_manage_proposal_templates"), async (req, res) => {
  try {
    const result = await intelligenceScheduler.runMarketScrape(`manual_by_${req.user.id}`);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Erro ao executar varredura manual." });
  }
});

// GET /api/v1/intelligence/logs — Retorna o log de auditoria da última varredura
router.get("/intelligence/logs", requirePermission("can_manage_proposal_templates"), (req, res) => {
  const fs = require("fs");
  const path = require("path");
  const logFile = path.join(__dirname, "../logs/latest_scan.json");
  if (!fs.existsSync(logFile)) {
    return res.status(404).json({ error: "Nenhum log de varredura encontrado ainda." });
  }
  try {
    const data = JSON.parse(fs.readFileSync(logFile, "utf8"));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Erro ao ler log de auditoria." });
  }
});

module.exports = router;

