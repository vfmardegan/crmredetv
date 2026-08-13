const express = require("express");
const crypto = require("crypto");
const { pool } = require("../db");
const { logAudit } = require("../utils/audit");
const { hasPermission } = require("../utils/acl");

const router = express.Router();

// POST /api/v1/executivos — cria executivo.
router.post("/executivos", async (req, res) => {
  if (!hasPermission(req.user.perfil, "can_assign_carteira")) {
    return res.status(403).json({ error: "Acesso negado. Esta operação exige a permissão: can_assign_carteira" });
  }

  const { nome } = req.body;
  if (!nome || !nome.trim()) {
    return res.status(400).json({ error: "Nome é obrigatório." });
  }
  const id = crypto.randomUUID();
  try {
    await pool.query("insert into executivos (id, nome) values ($1, $2)", [id, nome.trim()]);
    res.status(201).json({ id });
  } catch (err) {
    console.error("Erro em POST /executivos:", err);
    res.status(500).json({ error: "Não foi possível salvar o executivo." });
  }
});

// DELETE /api/v1/executivos/:id — exclui executivo.
router.delete("/executivos/:id", async (req, res) => {
  if (!hasPermission(req.user.perfil, "can_assign_carteira")) {
    return res.status(403).json({ error: "Acesso negado. Esta operação exige a permissão: can_assign_carteira" });
  }

  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("delete from segmento_executivo where executivo_id = $1", [id]);
    const result = await client.query("delete from executivos where id = $1", [id]);
    await client.query("COMMIT");
    if (result.rowCount === 0) return res.status(404).json({ error: "Executivo não encontrado." });
    res.json({ id });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Erro em DELETE /executivos/:id:", err);
    res.status(500).json({ error: "Não foi possível excluir o executivo." });
  } finally {
    client.release();
  }
});

// PUT /api/v1/carteira/:segmento — atribui (ou libera) um segmento.
router.put("/carteira/:segmento", async (req, res) => {
  if (!hasPermission(req.user.perfil, "can_assign_carteira")) {
    return res.status(403).json({ error: "Acesso negado. Esta operação exige a permissão: can_assign_carteira" });
  }

  const { segmento } = req.params;
  const { executivoId } = req.body;
  try {
    const beforeRes = await pool.query("SELECT executivo_id FROM segmento_executivo WHERE segmento = $1", [segmento]);
    const oldExecId = beforeRes.rows[0]?.executivo_id || null;

    let oldExecName = "Nenhum";
    if (oldExecId) {
      const oldExecRes = await pool.query("SELECT nome FROM executivos WHERE id = $1", [oldExecId]);
      oldExecName = oldExecRes.rows[0]?.nome || oldExecId;
    }

    if (!executivoId) {
      await pool.query("delete from segmento_executivo where segmento = $1", [segmento]);
      await logAudit(
        req.user.id,
        req.user.email,
        "update_segment_owner",
        `Carteira: Segmento "${segmento}" desvinculado do executivo "${oldExecName}".`
      );
      return res.json({ segmento, executivoId: null });
    }

    const newExecRes = await pool.query("SELECT nome FROM executivos WHERE id = $1", [executivoId]);
    const newExecName = newExecRes.rows[0]?.nome || executivoId;

    await pool.query(
      `insert into segmento_executivo (segmento, executivo_id, updated_at)
       values ($1, $2, now())
       on conflict (segmento) do update set executivo_id = excluded.executivo_id, updated_at = now()`,
      [segmento, executivoId]
    );

    await logAudit(
      req.user.id,
      req.user.email,
      "update_segment_owner",
      `Carteira: Segmento "${segmento}" transferido do executivo "${oldExecName}" para "${newExecName}".`
    );

    res.json({ segmento, executivoId });
  } catch (err) {
    console.error("Erro em PUT /carteira/:segmento:", err);
    res.status(500).json({ error: "Não foi possível atualizar a carteira." });
  }
});

module.exports = router;
