const express = require("express");
const crypto = require("crypto");
const { pool } = require("../db");
const { logAudit } = require("../utils/audit");
const { requirePermission } = require("../utils/acl");
const { getPortfolioClientCondition, isClientAllowedForUser } = require("../utils/portfolio");

const router = express.Router();

// GET /api/v1/clients — busca paginada de clientes com suporte a search, type e segmento ([ARQ-002]).
router.get("/clients", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const offset = (page - 1) * limit;
    const { search, type, segmento } = req.query;

    const conditions = [];
    const params = [];

    // Isolamento de carteira comercial multi-tenant ([BOLA/IDOR]):
    // Executivos e diretores têm visão estritamente restrita aos clientes atribuídos
    const portfolio = await getPortfolioClientCondition(req.user, "c", 1);
    if (portfolio.condition) {
      if (portfolio.condition === "1 = 0") {
        conditions.push("1 = 0");
      } else {
        params.push(...portfolio.params);
        conditions.push(portfolio.condition);
      }
    }

    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      const pIdx = params.length;
      conditions.push(
        `(LOWER(c.nome_fantasia) LIKE $${pIdx} OR LOWER(c.razao_social) LIKE $${pIdx} OR LOWER(COALESCE(c.cnpj, '')) LIKE $${pIdx} OR LOWER(COALESCE(c.codigo, '')) LIKE $${pIdx})`
      );
    }

    if (type && type !== "all") {
      params.push(type);
      conditions.push(`c.type = $${params.length}`);
    }

    if (segmento && segmento !== "all") {
      params.push(segmento);
      conditions.push(`c.segmento = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countQuery = `SELECT count(*)::int AS total FROM clients c ${whereClause}`;
    const countRes = await pool.query(countQuery, params);
    const total = countRes.rows[0]?.total || 0;

    const dataParams = [...params, limit, offset];
    const dataQuery = `
      SELECT c.*
      FROM clients c
      ${whereClause}
      ORDER BY COALESCE(c.nome_fantasia, c.razao_social) ASC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    const dataRes = await pool.query(dataQuery, dataParams);

    const clients = dataRes.rows.map((row) => ({
      id: row.id,
      codigo: row.codigo || "",
      razaoSocial: row.razao_social || "",
      cnpj: row.cnpj || "",
      nomeFantasia: row.nome_fantasia || "",
      name: row.nome_fantasia || row.razao_social || "",
      type: row.type,
      segmento: row.segmento || "",
      createdAt: row.created_at,
      aiSummary: row.ai_summary || null,
    }));

    const totalPages = Math.ceil(total / limit) || 1;

    res.json({
      data: clients,
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
    console.error("Erro em GET /clients:", err);
    res.status(500).json({ error: "Erro ao buscar clientes." });
  }
});

// POST /api/v1/clients — cria cliente (Agência ou Anunciante).
// Exige permissão can_edit_clients ([SEC-006]).
router.post("/clients", requirePermission("can_edit_clients"), async (req, res) => {
  const { codigo, razaoSocial, cnpj, nomeFantasia, type, segmento } = req.body;
  const cleanNomeFantasia = (nomeFantasia || "").trim();
  if (!cleanNomeFantasia) {
    return res.status(400).json({ error: "O Nome Fantasia é obrigatório." });
  }
  const cleanRazaoSocial = (razaoSocial || "").trim();
  const cleanCodigo = (codigo || "").toString().trim();
  const cleanCnpj = (cnpj || "").toString().trim();
  const cleanSegmento = (segmento || "").trim();
  const id = req.body.id || crypto.randomUUID();
  try {
    await pool.query(
      `insert into clients (id, codigo, razao_social, cnpj, nome_fantasia, type, segmento)
       values ($1, $2, $3, $4, $5, $6, $7)`,
      [
        id,
        cleanCodigo || null,
        cleanRazaoSocial || cleanNomeFantasia,
        cleanCnpj || null,
        cleanNomeFantasia,
        type,
        cleanSegmento || null
      ]
    );
    await logAudit(
      req.user.id,
      req.user.email,
      "create_client",
      `Criou o cliente ${type} "${cleanNomeFantasia}" (ID: ${id})`
    );
    res.status(201).json({ id });
  } catch (err) {
    console.error("Erro em POST /clients:", err);
    res.status(500).json({ error: "Não foi possível salvar o cliente." });
  }
});

// PUT /api/v1/clients/:id — edita cliente já cadastrado.
router.put("/clients/:id", requirePermission("can_edit_clients"), async (req, res) => {
  const { id } = req.params;
  const { codigo, razaoSocial, cnpj, nomeFantasia, type, segmento } = req.body;
  const cleanNomeFantasia = (nomeFantasia || "").trim();
  if (!cleanNomeFantasia) {
    return res.status(400).json({ error: "O Nome Fantasia é obrigatório." });
  }
  const cleanRazaoSocial = (razaoSocial || "").trim();
  const cleanCodigo = (codigo || "").toString().trim();
  const cleanCnpj = (cnpj || "").toString().trim();
  const cleanSegmento = (segmento || "").trim();
  try {
    const allowed = await isClientAllowedForUser(req.user, id);
    if (!allowed) {
      return res.status(403).json({ error: "Acesso negado. Este cliente não pertence à sua carteira autorizada." });
    }

    const result = await pool.query(
      `update clients set codigo = $1, razao_social = $2, cnpj = $3, nome_fantasia = $4,
       type = $5, segmento = $6 where id = $7`,
      [
        cleanCodigo || null,
        cleanRazaoSocial || cleanNomeFantasia,
        cleanCnpj || null,
        cleanNomeFantasia,
        type,
        cleanSegmento || null,
        id
      ]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: "Cliente não encontrado." });
    await logAudit(
      req.user.id,
      req.user.email,
      "update_client",
      `Atualizou os dados do cliente ${type} "${cleanNomeFantasia}" (ID: ${id})`
    );
    res.json({ id });
  } catch (err) {
    console.error("Erro em PUT /clients/:id:", err);
    res.status(500).json({ error: "Não foi possível atualizar o cliente." });
  }
});

// PUT /api/v1/clients/:id/links — reconcilia vínculo Agência <-> Anunciante
// nos dois sentidos. Body: { atendeAnunciantes: [...] } (se o cliente é
// Agência) ou { vinculoAgencias: [...] } (se é Anunciante).
router.put("/clients/:id/links", requirePermission("can_edit_clients"), async (req, res) => {
  const { id } = req.params;
  const { atendeAnunciantes, vinculoAgencias } = req.body;
  try {
    const allowed = await isClientAllowedForUser(req.user, id);
    if (!allowed) {
      return res.status(403).json({ error: "Acesso negado. Este cliente não pertence à sua carteira autorizada." });
    }
  } catch (err) {
    console.error("Erro ao validar permissão de carteira em links:", err);
    return res.status(500).json({ error: "Erro ao validar autorização de carteira." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    if (Array.isArray(atendeAnunciantes)) {
      // Este cliente é uma Agência: substitui a lista completa de
      // anunciantes atendidos por ele.
      await client.query("delete from agency_links where agency_id = $1", [id]);
      for (const advertiserId of atendeAnunciantes) {
        await client.query(
          "insert into agency_links (agency_id, advertiser_id) values ($1, $2) on conflict do nothing",
          [id, advertiserId]
        );
      }
    } else if (Array.isArray(vinculoAgencias)) {
      // Este cliente é um Anunciante: substitui, em cada agência afetada,
      // se ela atende ou não este anunciante.
      await client.query("delete from agency_links where advertiser_id = $1", [id]);
      for (const agencyId of vinculoAgencias) {
        await client.query(
          "insert into agency_links (agency_id, advertiser_id) values ($1, $2) on conflict do nothing",
          [agencyId, id]
        );
      }
    } else {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Envie atendeAnunciantes ou vinculoAgencias." });
    }

    const nameRes = await client.query("SELECT nome_fantasia, razao_social, type FROM clients WHERE id = $1", [id]);
    const clientObj = nameRes.rows[0];
    const clientName = clientObj ? (clientObj.nome_fantasia || clientObj.razao_social) : id;

    await logAudit(
      req.user.id,
      req.user.email,
      "update_client_links",
      `Atualizou os vínculos comerciais do cliente "${clientName}" (ID: ${id})`
    );

    await client.query("COMMIT");
    res.json({ id });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Erro em PUT /clients/:id/links:", err);
    res.status(500).json({ error: "Não foi possível atualizar os vínculos." });
  } finally {
    client.release();
  }
});

// POST /api/v1/clients/:id/interactions — registra uma interação (reunião, nota, ligação) no banco ([MOD-001]).
router.post("/clients/:id/interactions", async (req, res) => {
  const { id } = req.params;
  const { date, note, aiSummary, aiNextAction, aiRisk, type } = req.body;

  if (!note || !date) {
    return res.status(400).json({ error: "Data e nota são obrigatórias." });
  }

  if (typeof note !== "string" || note.trim().length === 0) {
    return res.status(400).json({ error: "O texto da nota não pode estar vazio." });
  }

  // Limite razoável de payload para notas comerciais ([MOD-001])
  if (note.length > 5000) {
    return res.status(400).json({ error: "A nota excede o limite máximo permitido de 5.000 caracteres." });
  }

  try {
    const allowed = await isClientAllowedForUser(req.user, id);
    if (!allowed) {
      return res.status(403).json({ error: "Acesso negado. Este cliente não pertence à sua carteira autorizada." });
    }
  } catch (err) {
    console.error("Erro ao validar permissão de carteira em interação:", err);
    return res.status(500).json({ error: "Erro ao validar autorização de carteira." });
  }

  // Sanitização estrita contra injeção de HTML malicioso, tags e scripts (Stored XSS)
  const sanitizedNote = note
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/javascript:/gi, "")
    .trim();

  const interactionId = req.body.id || crypto.randomUUID();
  try {
    await pool.query(
      `INSERT INTO client_interactions (id, client_id, user_id, date, note, ai_summary, ai_next_action, ai_risk, type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        interactionId,
        id,
        req.user.id,
        date,
        sanitizedNote,
        aiSummary || null,
        aiNextAction || null,
        aiRisk || null,
        type || "note"
      ]
    );
    res.status(201).json({
      id: interactionId,
      date,
      note: sanitizedNote,
      aiSummary: aiSummary || null,
      aiNextAction: aiNextAction || null,
      aiRisk: aiRisk || null
    });
  } catch (err) {
    console.error("Erro ao salvar interação:", err);
    res.status(500).json({ error: "Erro interno do servidor ao salvar interação." });
  }
});

// POST /api/v1/clients/import — importa e sincroniza lote de clientes via CSV (Apenas Administrador)
router.post("/clients/import", async (req, res) => {
  if (req.user.perfil !== "admin") {
    return res.status(403).json({ error: "Acesso negado. Apenas administradores podem importar ou sincronizar a base de clientes." });
  }

  const { rows } = req.body;
  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: "Nenhuma linha enviada para importação." });
  }

  const client = await pool.connect();
  let insertedClients = 0;
  let updatedClients = 0;
  let insertedContacts = 0;
  let insertedLinks = 0;
  let linkedExecutives = 0;

  try {
    await client.query("BEGIN");

    for (const row of rows) {
      const tipoRaw = row.tipo || row.type || "Anunciante";
      const tipo = tipoRaw.toLowerCase().includes("ag") ? "Agência" : "Anunciante";
      const razaoSocial = (row.razaoSocial || row.nomeFantasia || "").trim();
      const nomeFantasia = (row.nomeFantasia || razaoSocial || "").trim();
      if (!razaoSocial && !nomeFantasia) continue;

      const rawCnpj = (row.cnpj || "").trim();
      const cleanCnpj = rawCnpj.replace(/\D/g, "");
      const codigoErp = (row.codigoErp || row.codigo || "").trim() || null;
      const segmento = (row.segmento || (tipo === "Anunciante" ? "Geral" : null) || "").trim() || (tipo === "Anunciante" ? "Geral" : null);
      const executivoEmail = (row.executivoEmail || "").trim();
      const agenciaVinculada = (row.agenciaVinculada || "").trim();
      const contatoNome = (row.contatoNome || "").trim();
      const contatoCargo = (row.contatoCargo || "").trim() || null;
      const contatoEmail = (row.contatoEmail || "").trim() || null;
      const contatoTelefone = (row.contatoTelefone || "").trim() || null;

      // 1. Localizar cliente existente:
      // a) Por CNPJ (dígitos limpos ou string exata)
      // b) Por Código ERP
      // c) Por Razão Social ou Nome Fantasia
      let clientId = null;
      let existingRes = null;

      if (cleanCnpj && cleanCnpj.length >= 8) {
        existingRes = await client.query(
          `SELECT id, codigo, razao_social, nome_fantasia, segmento, type, cnpj 
           FROM clients 
           WHERE regexp_replace(cnpj, '[^0-9]', '', 'g') = $1 OR cnpj = $2 
           LIMIT 1`,
          [cleanCnpj, rawCnpj]
        );
      }

      if ((!existingRes || existingRes.rows.length === 0) && codigoErp) {
        existingRes = await client.query(
          `SELECT id, codigo, razao_social, nome_fantasia, segmento, type, cnpj 
           FROM clients 
           WHERE codigo IS NOT NULL AND LOWER(TRIM(codigo)) = LOWER(TRIM($1)) 
           LIMIT 1`,
          [codigoErp]
        );
      }

      if (!existingRes || existingRes.rows.length === 0) {
        existingRes = await client.query(
          `SELECT id, codigo, razao_social, nome_fantasia, segmento, type, cnpj 
           FROM clients 
           WHERE LOWER(TRIM(razao_social)) = LOWER(TRIM($1)) 
              OR LOWER(TRIM(nome_fantasia)) = LOWER(TRIM($2)) 
           LIMIT 1`,
          [razaoSocial, nomeFantasia]
        );
      }

      if (existingRes && existingRes.rows.length > 0) {
        clientId = existingRes.rows[0].id;
        const current = existingRes.rows[0];

        await client.query(
          `UPDATE clients 
           SET razao_social = COALESCE(NULLIF($1, ''), razao_social),
               nome_fantasia = COALESCE(NULLIF($2, ''), nome_fantasia),
               cnpj = COALESCE(NULLIF($3, ''), cnpj),
               codigo = COALESCE(NULLIF($4, ''), codigo),
               segmento = CASE WHEN $5 = 'Anunciante' THEN COALESCE(NULLIF($6, ''), segmento) ELSE segmento END,
               type = COALESCE(NULLIF($5, ''), type)
           WHERE id = $7`,
          [
            razaoSocial || current.razao_social,
            nomeFantasia || current.nome_fantasia,
            rawCnpj || current.cnpj,
            codigoErp || current.codigo,
            tipo,
            segmento,
            clientId
          ]
        );
        updatedClients++;
      } else {
        clientId = crypto.randomUUID();
        await client.query(
          `INSERT INTO clients (id, codigo, razao_social, cnpj, nome_fantasia, type, segmento)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            clientId,
            codigoErp || null,
            razaoSocial,
            rawCnpj || null,
            nomeFantasia || razaoSocial,
            tipo,
            tipo === "Anunciante" ? (segmento || "Geral") : null
          ]
        );
        insertedClients++;
      }

      // 2. Vínculo Executivo (Key Account)
      if (executivoEmail) {
        let execId = null;
        const userRes = await client.query(
          `SELECT executivo_id FROM usuarios WHERE LOWER(TRIM(email)) = LOWER(TRIM($1)) AND executivo_id IS NOT NULL LIMIT 1`,
          [executivoEmail]
        );
        if (userRes.rows.length > 0) {
          execId = userRes.rows[0].executivo_id;
        } else {
          const directRes = await client.query(
            `SELECT id FROM executivos WHERE LOWER(TRIM(nome)) = LOWER(TRIM($1)) LIMIT 1`,
            [executivoEmail]
          );
          if (directRes.rows.length > 0) {
            execId = directRes.rows[0].id;
          }
        }

        if (execId) {
          await client.query(
            `INSERT INTO carteira_key_accounts (executivo_id, client_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [execId, clientId]
          );
          linkedExecutives++;
        }
      }

      // 3. Vínculo Agência <-> Anunciante
      if (tipo === "Anunciante" && agenciaVinculada) {
        const agencyRes = await client.query(
          `SELECT id FROM clients WHERE type = 'Agência' AND (
             LOWER(TRIM(razao_social)) = LOWER(TRIM($1)) OR 
             LOWER(TRIM(nome_fantasia)) = LOWER(TRIM($1)) OR 
             LOWER(TRIM(razao_social)) LIKE LOWER(TRIM($2)) OR 
             LOWER(TRIM(nome_fantasia)) LIKE LOWER(TRIM($2))
           ) LIMIT 1`,
          [agenciaVinculada, `%${agenciaVinculada}%`]
        );
        if (agencyRes.rows.length > 0) {
          const agencyId = agencyRes.rows[0].id;
          await client.query(
            `INSERT INTO agency_links (agency_id, advertiser_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [agencyId, clientId]
          );
          insertedLinks++;
        }
      }

      // 4. Cadastro / Atualização de Contato
      if (contatoNome) {
        let contactRes = null;
        if (contatoEmail) {
          contactRes = await client.query(
            `SELECT id FROM contacts WHERE client_id = $1 AND LOWER(TRIM(email)) = LOWER(TRIM($2)) LIMIT 1`,
            [clientId, contatoEmail]
          );
        }
        if (!contactRes || contactRes.rows.length === 0) {
          contactRes = await client.query(
            `SELECT id FROM contacts WHERE client_id = $1 AND LOWER(TRIM(name)) = LOWER(TRIM($2)) LIMIT 1`,
            [clientId, contatoNome]
          );
        }

        if (contactRes && contactRes.rows.length > 0) {
          await client.query(
            `UPDATE contacts 
             SET cargo = COALESCE(NULLIF($1, ''), cargo),
                 email = COALESCE(NULLIF($2, ''), email),
                 celular = COALESCE(NULLIF($3, ''), celular)
             WHERE id = $4`,
            [contatoCargo, contatoEmail, contatoTelefone, contactRes.rows[0].id]
          );
        } else {
          const newContactId = crypto.randomUUID();
          await client.query(
            `INSERT INTO contacts (id, client_id, name, cargo, email, celular) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [newContactId, clientId, contatoNome, contatoCargo, contatoEmail, contatoTelefone]
          );
          insertedContacts++;
        }
      }
    }

    await client.query("COMMIT");

    await logAudit(
      req.user.id,
      req.user.email,
      "import_clients",
      `Importação de base de clientes via CSV: ${rows.length} registros processados (${insertedClients} novos, ${updatedClients} atualizados, ${insertedContacts} contatos, ${insertedLinks} vínculos agência, ${linkedExecutives} key accounts)`
    );

    res.json({
      success: true,
      total: rows.length,
      inserted: insertedClients,
      updated: updatedClients,
      contacts: insertedContacts,
      links: insertedLinks,
      linkedExecutives: linkedExecutives,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Erro em POST /clients/import:", err);
    res.status(500).json({ error: "Erro ao processar importação da base de clientes: " + (err.message || err) });
  } finally {
    client.release();
  }
});

// DELETE /api/v1/clients/:id — exclui cliente (Apenas Administrador)
router.delete("/clients/:id", async (req, res) => {
  if (req.user.perfil !== "admin") {
    return res.status(403).json({ error: "Acesso negado. Apenas administradores podem excluir cadastros de clientes." });
  }

  const { id } = req.params;
  try {
    const nameRes = await pool.query("SELECT nome_fantasia, razao_social, type FROM clients WHERE id = $1", [id]);
    if (nameRes.rows.length === 0) {
      return res.status(404).json({ error: "Cliente não encontrado." });
    }

    const clientObj = nameRes.rows[0];
    const clientName = clientObj.nome_fantasia || clientObj.razao_social || id;

    await pool.query("DELETE FROM clients WHERE id = $1", [id]);

    await logAudit(
      req.user.id,
      req.user.email,
      "delete_client",
      `Excluiu permanentemente o cliente "${clientName}" (ID: ${id})`
    );

    res.json({ success: true, id });
  } catch (err) {
    console.error("Erro em DELETE /clients/:id:", err);
    res.status(500).json({ error: "Não foi possível excluir o cliente." });
  }
});

module.exports = router;
