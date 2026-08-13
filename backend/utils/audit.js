const { pool } = require("../db");

async function logAudit(userId, userEmail, action, details) {
  try {
    await pool.query(
      `INSERT INTO audit_logs (user_id, user_email, action, details)
       VALUES ($1, $2, $3, $4)`,
      [userId, userEmail, action, details]
    );
  } catch (err) {
    console.error("Falha ao salvar log de auditoria no banco:", err);
  }
}

module.exports = { logAudit };
