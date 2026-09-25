const express = require("express");
const crypto = require("crypto");
const { pool } = require("../db");
const { logAudit } = require("../utils/audit");
const { requirePermission } = require("../utils/acl");
const { getAllowedExecIds, isClientAllowedForUser } = require("../utils/portfolio");

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

// GET /api/v1/contacts — busca paginada de contatos com suporte a search e clientId ([ARQ-002]).
router.get("/contacts", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const offset = (page - 1) * limit;
    const { search, clientId } = req.query;

    const conditions = [];
    const params = [];

    // Isolamento de carteira multi-tenant ([BOLA/IDOR]):
    // Executivos e diretores só acessam contatos de clientes de sua carteira
    const execIds = await getAllowedExecIds(req.user);
    if (execIds !== null) {
      if (execIds.length === 0) {
        conditions.push("1 = 0");
      } else {
        params.push(execIds);
        const pIdx = params.length;
        conditions.push(`c.client_id IN (
          SELECT cl.id FROM clients cl
          WHERE (
            (cl.type = 'Anunciante' AND (
              cl.segmento IN (SELECT segmento FROM segmento_executivo WHERE executivo_id = ANY($${pIdx}::varchar[]))
              OR cl.id IN (SELECT client_id FROM carteira_key_accounts WHERE executivo_id = ANY($${pIdx}::varchar[]))
            ))
            OR
            (cl.type = 'Agência' AND cl.id IN (
              SELECT al.agency_id FROM agency_links al
              JOIN clients adv ON adv.id = al.advertiser_id
              WHERE adv.type = 'Anunciante' AND (
                adv.segmento IN (SELECT segmento FROM segmento_executivo WHERE executivo_id = ANY($${pIdx}::varchar[]))
                OR adv.id IN (SELECT client_id FROM carteira_key_accounts WHERE executivo_id = ANY($${pIdx}::varchar[]))
              )
            ))
          )
        )`);
      }
    }

    if (clientId) {
      params.push(clientId);
      conditions.push(`c.client_id = $${params.length}`);
    }

    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      const pIdx = params.length;
      conditions.push(
        `(LOWER(c.name) LIKE $${pIdx} OR LOWER(COALESCE(c.email, '')) LIKE $${pIdx} OR LOWER(COALESCE(c.cargo, '')) LIKE $${pIdx} OR LOWER(COALESCE(c.celular, '')) LIKE $${pIdx})`
      );
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countQuery = `SELECT count(*)::int AS total FROM contacts c ${whereClause}`;
    const countRes = await pool.query(countQuery, params);
    const total = countRes.rows[0]?.total || 0;

    const dataParams = [...params, limit, offset];
    const dataQuery = `
      SELECT c.*, cl.nome_fantasia AS client_nome_fantasia, cl.razao_social AS client_razao_social
      FROM contacts c
      LEFT JOIN clients cl ON cl.id = c.client_id
      ${whereClause}
      ORDER BY c.name ASC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    const dataRes = await pool.query(dataQuery, dataParams);

    const contacts = dataRes.rows.map((row) => ({
      id: row.id,
      clientId: row.client_id,
      clientName: row.client_nome_fantasia || row.client_razao_social || "",
      name: row.name,
      cargo: row.cargo || "",
      departamento: row.departamento || "",
      nivelDecisao: row.nivel_decisao || "",
      celular: row.celular || "",
      email: row.email || "",
      esportes: row.esportes || [],
      esportesOutro: row.esportes_outro || "",
      hobbies: row.hobbies || [],
      hobbiesOutro: row.hobbies_outro || "",
      timeCoracao: row.time_coracao || "",
      filhos: row.filhos === null ? "" : row.filhos,
      createdAt: row.created_at,
    }));

    const totalPages = Math.ceil(total / limit) || 1;

    res.json({
      data: contacts,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (err) {
    console.error("Erro em GET /contacts:", err);
    res.status(500).json({ error: "Erro ao buscar contatos." });
  }
});

// POST /api/v1/contacts — cria contato
router.post("/contacts", requirePermission("can_edit_contacts"), async (req, res) => {
  if (!req.body.name || !req.body.clientId) {
    return res.status(400).json({ error: "Nome e empresa são obrigatórios." });
  }

  try {
    const allowed = await isClientAllowedForUser(req.user, req.body.clientId);
    if (!allowed) {
      return res.status(403).json({ error: "Acesso negado. A empresa informada não pertence à sua carteira autorizada." });
    }

    const id = req.body.id || crypto.randomUUID();
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

// PUT /api/v1/contacts/:id — atualiza contato
router.put("/contacts/:id", requirePermission("can_edit_contacts"), async (req, res) => {
  const { id } = req.params;
  try {
    const existingRes = await pool.query("SELECT client_id FROM contacts WHERE id = $1", [id]);
    if (existingRes.rows.length === 0) {
      return res.status(404).json({ error: "Contato não encontrado." });
    }
    const currentClientId = existingRes.rows[0].client_id;
    const allowedCurrent = await isClientAllowedForUser(req.user, currentClientId);
    if (!allowedCurrent) {
      return res.status(403).json({ error: "Acesso negado. O cliente deste contato não pertence à sua carteira autorizada." });
    }

    if (req.body.clientId && req.body.clientId !== currentClientId) {
      const allowedNew = await isClientAllowedForUser(req.user, req.body.clientId);
      if (!allowedNew) {
        return res.status(403).json({ error: "Acesso negado. A nova empresa atribuída não pertence à sua carteira autorizada." });
      }
    }

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

// DELETE /api/v1/contacts/:id — exclui contato (Apenas Administrador)
router.delete("/contacts/:id", async (req, res) => {
  if (req.user.perfil !== "admin") {
    return res.status(403).json({ error: "Acesso negado. Apenas administradores podem excluir cadastros de contatos." });
  }

  const { id } = req.params;
  try {
    const nameRes = await pool.query("SELECT name FROM contacts WHERE id = $1", [id]);
    if (nameRes.rows.length === 0) {
      return res.status(404).json({ error: "Contato não encontrado." });
    }

    const contactName = nameRes.rows[0].name;

    await pool.query("DELETE FROM contacts WHERE id = $1", [id]);

    await logAudit(
      req.user.id,
      req.user.email,
      "delete_contact",
      `Excluiu permanentemente o contato "${contactName}" (ID: ${id})`
    );

    res.json({ success: true, id });
  } catch (err) {
    console.error("Erro em DELETE /contacts/:id:", err);
    res.status(500).json({ error: "Não foi possível excluir o contato." });
  }
});

module.exports = router;
