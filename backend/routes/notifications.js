const express = require("express");
const { pool } = require("../db");

const router = express.Router();

// GET /api/v1/notifications — lista notificações do usuário autenticado
router.get("/notifications", async (req, res) => {
  try {
    const dbRes = await pool.query(
      `SELECT id, title, message, type, client_id, read, created_at 
       FROM notificacoes 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [req.user.id]
    );
    res.json(dbRes.rows);
  } catch (err) {
    console.error("Erro ao buscar notificações:", err);
    res.status(500).json({ error: "Erro interno ao carregar notificações." });
  }
});

// PUT /api/v1/notifications/read — marca todas as notificações do usuário como lidas
router.put("/notifications/read", async (req, res) => {
  try {
    await pool.query(
      "UPDATE notificacoes SET read = TRUE WHERE user_id = $1",
      [req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Erro ao marcar notificações como lidas:", err);
    res.status(500).json({ error: "Erro interno ao atualizar notificações." });
  }
});

module.exports = router;
