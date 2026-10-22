const express = require("express");
const { pool } = require("../db");

const router = express.Router();

/**
 * GET /api/v1/media-proposals — Lista todas as propostas salvas na central corporativa
 */
router.get("/media-proposals", async (req, res) => {
  const query = (req.query.q || "").trim().toLowerCase();
  try {
    let sql = `
      SELECT id, cliente, agencia, projeto, usuario_criador, usuario_id, 
             valor_total, desconto, grade_json, data_criacao, created_at
      FROM tabelas_propostas_midia
    `;
    const params = [];

    if (query) {
      sql += `
        WHERE LOWER(cliente) LIKE $1 
           OR LOWER(COALESCE(agencia, '')) LIKE $1 
           OR LOWER(COALESCE(projeto, '')) LIKE $1
           OR LOWER(COALESCE(usuario_criador, '')) LIKE $1
           OR LOWER(id) LIKE $1
      `;
      params.push(`%${query}%`);
    }

    sql += ` ORDER BY data_criacao DESC LIMIT 200`;

    const result = await pool.query(sql, params);
    return res.json(result.rows);
  } catch (err) {
    console.error("Erro ao listar propostas de mídia:", err);
    return res.status(500).json({ error: "Erro ao buscar histórico de propostas de mídia." });
  }
});

/**
 * GET /api/v1/media-proposals/:id — Obtém uma proposta específica para reabrir no Valoração Online
 */
router.get("/media-proposals/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT id, cliente, agencia, projeto, usuario_criador, usuario_id, 
              valor_total, desconto, grade_json, data_criacao, created_at
       FROM tabelas_propostas_midia 
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Proposta de mídia não encontrada." });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error("Erro ao obter proposta de mídia:", err);
    return res.status(500).json({ error: "Erro ao carregar detalhes da proposta." });
  }
});

/**
 * POST /api/v1/media-proposals — Salva ou atualiza uma proposta no banco central corporativo
 */
router.post("/media-proposals", async (req, res) => {
  const { id, cliente, agencia, projeto, valor_total, desconto, grade_json } = req.body;

  if (!cliente || !grade_json) {
    return res.status(400).json({ error: "Cliente e grade_json são obrigatórios." });
  }

  const propId = (id && String(id).trim()) || `PROP-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
  const usuarioCriador = req.user?.nome || req.user?.email || "Administrador";
  const usuarioId = req.user?.id || null;
  const valorTotal = !isNaN(Number(valor_total)) ? Number(valor_total) : 0;
  const descontoNum = !isNaN(Number(desconto)) ? Number(desconto) : 70.0;

  try {
    await pool.query(
      `INSERT INTO tabelas_propostas_midia 
       (id, cliente, agencia, projeto, usuario_criador, usuario_id, valor_total, desconto, grade_json, data_criacao, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
       ON CONFLICT (id) DO UPDATE SET
         cliente = EXCLUDED.cliente,
         agencia = EXCLUDED.agencia,
         projeto = EXCLUDED.projeto,
         usuario_criador = EXCLUDED.usuario_criador,
         usuario_id = EXCLUDED.usuario_id,
         valor_total = EXCLUDED.valor_total,
         desconto = EXCLUDED.desconto,
         grade_json = EXCLUDED.grade_json,
         created_at = NOW()`,
      [
        propId,
        cliente.trim(),
        (agencia || "").trim(),
        (projeto || "").trim(),
        usuarioCriador,
        usuarioId,
        valorTotal,
        descontoNum,
        JSON.stringify(grade_json),
      ]
    );

    return res.status(201).json({
      success: true,
      id: propId,
      message: `Proposta "${projeto || cliente}" salva com sucesso no banco corporativo!`,
    });
  } catch (err) {
    console.error("Erro ao salvar proposta de mídia:", err);
    return res.status(500).json({ error: "Não foi possível salvar a proposta no servidor." });
  }
});

/**
 * DELETE /api/v1/media-proposals/:id — Exclui uma proposta do banco central
 */
router.delete("/media-proposals/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `DELETE FROM tabelas_propostas_midia WHERE id = $1 RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Proposta não encontrada para exclusão." });
    }

    return res.json({ success: true, message: "Proposta excluída com sucesso." });
  } catch (err) {
    console.error("Erro ao excluir proposta de mídia:", err);
    return res.status(500).json({ error: "Não foi possível excluir a proposta." });
  }
});

module.exports = router;
