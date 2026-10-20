const express = require("express");
const { pool } = require("../db");

const router = express.Router();

// Middleware de autorização exclusiva para a fase de piloto / homologação
const ALLOWED_EMAILS = ["vitor.mardegan@redetv.com.br"];

function requireVitorAccess(req, res, next) {
  const userEmail = req.user?.email?.toLowerCase();
  if (!userEmail || !ALLOWED_EMAILS.includes(userEmail)) {
    return res.status(403).json({ error: "Acesso restrito ao Pipeline Estratégico." });
  }
  next();
}

// Aplica a restrição a todas as rotas deste router
router.use(requireVitorAccess);

// GET /api/v1/pipeline-estrategico
router.get("/pipeline-estrategico", async (req, res) => {
  const { segmento } = req.query;

  try {
    let query = `
      SELECT pe.*, 
             c.nome_fantasia as client_nome_fantasia, 
             c.razao_social as client_razao_social,
             c.segmento as client_segmento
      FROM pipeline_estrategico pe
      LEFT JOIN clients c ON c.id = pe.client_id
      WHERE 1=1
    `;
    const params = [];

    if (segmento) {
      params.push(segmento);
      query += ` AND pe.segmento = $${params.length}`;
    }

    query += " ORDER BY pe.segmento, pe.tipo, pe.posicao ASC";

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("Erro ao listar marcas do Pipeline Estratégico:", err);
    res.status(500).json({ error: "Erro interno ao carregar Pipeline Estratégico." });
  }
});

// POST /api/v1/pipeline-estrategico
router.post("/pipeline-estrategico", async (req, res) => {
  const {
    segmento,
    tipo,
    posicao,
    client_id,
    nome_marca,
    holding,
    holding_id,
    sub_marcas,
    agencia_nome,
    agencia_id,
    racional,
    ultima_reuniao,
    iniciativas,
    investimento_estimado,
  } = req.body;

  if (!segmento || !tipo || !nome_marca) {
    return res.status(400).json({ error: "Segmento, grupo e nome da marca são obrigatórios." });
  }

  try {
    let resolvedPos = posicao;
    if (!resolvedPos) {
      const posRes = await pool.query(
        "SELECT COALESCE(MAX(posicao), 0) + 1 AS next_pos FROM pipeline_estrategico WHERE segmento = $1 AND tipo = $2",
        [segmento, tipo]
      );
      resolvedPos = parseInt(posRes.rows[0].next_pos, 10);
    }

    const result = await pool.query(
      `INSERT INTO pipeline_estrategico 
       (segmento, tipo, posicao, client_id, nome_marca, holding, holding_id, sub_marcas, agencia_nome, agencia_id, racional, ultima_reuniao, iniciativas, investimento_estimado, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
       ON CONFLICT (segmento, tipo, nome_marca) 
       DO UPDATE SET 
         client_id = EXCLUDED.client_id,
         holding = EXCLUDED.holding,
         holding_id = EXCLUDED.holding_id,
         agencia_nome = EXCLUDED.agencia_nome,
         agencia_id = EXCLUDED.agencia_id,
         racional = COALESCE(EXCLUDED.racional, pipeline_estrategico.racional),
         investimento_estimado = EXCLUDED.investimento_estimado,
         updated_at = NOW()
       RETURNING *`,
      [
        segmento,
        tipo,
        resolvedPos,
        client_id || null,
        nome_marca,
        holding || null,
        holding_id || null,
        sub_marcas || [],
        agencia_nome || null,
        agencia_id || null,
        racional || null,
        ultima_reuniao || null,
        JSON.stringify(iniciativas || []),
        investimento_estimado ? Number(investimento_estimado) : 0,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Erro ao criar/atualizar marca no Pipeline Estratégico:", err);
    res.status(500).json({ error: "Erro interno ao salvar marca no Pipeline Estratégico." });
  }
});

// PUT /api/v1/pipeline-estrategico/:id
router.put("/pipeline-estrategico/:id", async (req, res) => {
  const { id } = req.params;
  const {
    tipo,
    client_id,
    nome_marca,
    holding,
    holding_id,
    sub_marcas,
    agencia_nome,
    agencia_id,
    racional,
    ultima_reuniao,
    iniciativas,
    investimento_estimado,
  } = req.body;

  try {
    const updates = [];
    const values = [];
    let pIndex = 1;

    if (tipo !== undefined) {
      updates.push(`tipo = $${pIndex++}`);
      values.push(tipo);
    }
    if (client_id !== undefined) {
      updates.push(`client_id = $${pIndex++}`);
      values.push(client_id || null);
    }
    if (nome_marca !== undefined) {
      updates.push(`nome_marca = $${pIndex++}`);
      values.push(nome_marca);
    }
    if (holding !== undefined) {
      updates.push(`holding = $${pIndex++}`);
      values.push(holding || null);
    }
    if (holding_id !== undefined) {
      updates.push(`holding_id = $${pIndex++}`);
      values.push(holding_id || null);
    }
    if (sub_marcas !== undefined) {
      updates.push(`sub_marcas = $${pIndex++}`);
      values.push(sub_marcas || []);
    }
    if (agencia_nome !== undefined) {
      updates.push(`agencia_nome = $${pIndex++}`);
      values.push(agencia_nome || null);
    }
    if (agencia_id !== undefined) {
      updates.push(`agencia_id = $${pIndex++}`);
      values.push(agencia_id || null);
    }
    if (racional !== undefined) {
      updates.push(`racional = $${pIndex++}`);
      values.push(racional || null);
    }
    if (ultima_reuniao !== undefined) {
      updates.push(`ultima_reuniao = $${pIndex++}`);
      values.push(ultima_reuniao || null);
    }
    if (iniciativas !== undefined) {
      updates.push(`iniciativas = $${pIndex++}`);
      values.push(JSON.stringify(iniciativas || []));
    }
    if (investimento_estimado !== undefined) {
      updates.push(`investimento_estimado = $${pIndex++}`);
      values.push(Number(investimento_estimado) || 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "Nenhum campo fornecido para atualização." });
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const query = `UPDATE pipeline_estrategico SET ${updates.join(", ")} WHERE id = $${pIndex} RETURNING *`;
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Registro não encontrado." });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Erro ao atualizar marca no Pipeline Estratégico:", err);
    res.status(500).json({ error: err.message || "Erro interno ao atualizar registro." });
  }
});

// DELETE /api/v1/pipeline-estrategico/:id
router.delete("/pipeline-estrategico/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query("DELETE FROM pipeline_estrategico WHERE id = $1 RETURNING *", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Registro não encontrado." });
    }
    res.json({ success: true, removed: result.rows[0] });
  } catch (err) {
    console.error("Erro ao deletar marca do Pipeline Estratégico:", err);
    res.status(500).json({ error: "Erro interno ao remover registro." });
  }
});

module.exports = router;
