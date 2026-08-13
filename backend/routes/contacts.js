const express = require("express");
const crypto = require("crypto");
const { pool } = require("../db");
const { logAudit } = require("../utils/audit");

const router = express.Router();

function fieldsFromBody(body) {
  return [
    body.clientId || null,
    body.name,
    body.cargo || null,
    body.departamento || null,
    body.nivelDecisao || null,
    body.celular || null,
    body.email || null,
    body.esportes || [],
    body.esportesOutro || null,
    body.hobbies || [],
    body.hobbiesOutro || null,
    body.timeCoracao || null,
    body.filhos === "" || body.filhos === undefined ? null : body.filhos,
  ];
}

// POST /api/v1/contacts
router.post("/contacts", async (req, res) => {
  if (!req.body.name || !req.body.clientId) {
    return res.status(400).json({ error: "Nome e empresa são obrigatórios." });
  }
  const id = req.body.id || crypto.randomUUID();
  try {
    await pool.query(
      `insert into contacts
       (id, client_id, name, cargo, departamento, nivel_decisao, celular, email, esportes, esportes_outro, hobbies, hobbies_outro, time_coracao, filhos)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [id, ...fieldsFromBody(req.body)]
    );
    await logAudit(
      req.user.id,
      req.user.email,
      "create_contact",
      `Criou o contato "${req.body.name}" (ID: ${id})`
    );
    res.status(201).json({ id });
  } catch (err) {
    console.error("Erro em POST /contacts:", err);
    res.status(500).json({ error: "Não foi possível salvar o contato." });
  }
});

// PUT /api/v1/contacts/:id
router.put("/contacts/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `update contacts set client_id = $1, name = $2, cargo = $3, departamento = $4,
       nivel_decisao = $5, celular = $6, email = $7, esportes = $8, esportes_outro = $9,
       hobbies = $10, hobbies_outro = $11, time_coracao = $12, filhos = $13 where id = $14`,
      [...fieldsFromBody(req.body), id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: "Contato não encontrado." });
    await logAudit(
      req.user.id,
      req.user.email,
      "update_contact",
      `Atualizou os dados do contato "${req.body.name}" (ID: ${id})`
    );
    res.json({ id });
  } catch (err) {
    console.error("Erro em PUT /contacts/:id:", err);
    res.status(500).json({ error: "Não foi possível atualizar o contato." });
  }
});

module.exports = router;
