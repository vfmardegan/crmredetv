const express = require("express");
const { pool } = require("../db");
const { requirePermission } = require("../utils/acl");

const router = express.Router();

// GET /api/v1/intelligence/news — Lista notícias do radar com filtros
router.get("/intelligence/news", async (req, res) => {
  const { segmento, search, limit = 50 } = req.query;

  try {
    let query = "SELECT * FROM market_news WHERE 1=1";
    const params = [];

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

    query += " ORDER BY data_publicacao DESC, created_at DESC";
    params.push(parseInt(limit, 10) || 50);
    query += ` LIMIT $${params.length}`;

    const result = await pool.query(query, params);

    // Contadores por segmento para badges
    const countRes = await pool.query(
      "SELECT segmento_crm, COUNT(*) as total FROM market_news GROUP BY segmento_crm ORDER BY total DESC"
    );

    res.json({
      news: result.rows,
      segmentCounts: countRes.rows,
      total: result.rows.length,
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

// DELETE /api/v1/intelligence/news/:id — Excluir notícia do radar (admin)
router.delete("/intelligence/news/:id", requirePermission("can_manage_users"), async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM market_news WHERE id = $1", [id]);
    res.json({ success: true, message: "Notícia removida do radar." });
  } catch (err) {
    console.error("Erro ao remover notícia:", err);
    res.status(500).json({ error: "Não foi possível remover a notícia." });
  }
});

module.exports = router;
