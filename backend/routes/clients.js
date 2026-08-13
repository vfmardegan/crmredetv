const express = require("express");
const crypto = require("crypto");
const { pool } = require("../db");
const { logAudit } = require("../utils/audit");

const router = express.Router();

// POST /api/v1/clients — cria cliente (Agência ou Anunciante).
// Aceita um "id" opcional no body: o front-end do CRM gera o id no
// navegador (função uid()) porque precisa dele imediatamente pra outras
// atualizações de estado locais antes da resposta da API chegar. Se não
// vier id, o backend gera um (útil pra outros clientes da API).
router.post("/clients", async (req, res) => {
  const { codigo, razaoSocial, cnpj, nomeFantasia, type, segmento } = req.body;
  if (!razaoSocial && !nomeFantasia) {
    return res.status(400).json({ error: "Informe ao menos Razão Social ou Nome Fantasia." });
  }
  if (type === "Anunciante" && !segmento) {
    return res.status(400).json({ error: "Selecione um segmento para o anunciante." });
  }
  const id = req.body.id || crypto.randomUUID();
  try {
    await pool.query(
      `insert into clients (id, codigo, razao_social, cnpj, nome_fantasia, type, segmento)
       values ($1, $2, $3, $4, $5, $6, $7)`,
      [id, codigo || null, razaoSocial || nomeFantasia, cnpj || null, nomeFantasia || null, type, type === "Anunciante" ? segmento : null]
    );
    await logAudit(
      req.user.id,
      req.user.email,
      "create_client",
      `Criou o cliente ${type} "${nomeFantasia || razaoSocial}" (ID: ${id})`
    );
    res.status(201).json({ id });
  } catch (err) {
    console.error("Erro em POST /clients:", err);
    res.status(500).json({ error: "Não foi possível salvar o cliente." });
  }
});

// PUT /api/v1/clients/:id — edita cliente já cadastrado.
router.put("/clients/:id", async (req, res) => {
  const { id } = req.params;
  const { codigo, razaoSocial, cnpj, nomeFantasia, type, segmento } = req.body;
  try {
    const result = await pool.query(
      `update clients set codigo = $1, razao_social = $2, cnpj = $3, nome_fantasia = $4,
       type = $5, segmento = $6 where id = $7`,
      [codigo || null, razaoSocial || nomeFantasia, cnpj || null, nomeFantasia || null, type, type === "Anunciante" ? segmento : null, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: "Cliente não encontrado." });
    await logAudit(
      req.user.id,
      req.user.email,
      "update_client",
      `Atualizou os dados do cliente ${type} "${nomeFantasia || razaoSocial}" (ID: ${id})`
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
router.put("/clients/:id/links", async (req, res) => {
  const { id } = req.params;
  const { atendeAnunciantes, vinculoAgencias } = req.body;
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

// POST /api/v1/clients/:id/interactions — registra uma interação (reunião, nota, ligação) no banco.
router.post("/clients/:id/interactions", async (req, res) => {
  const { id } = req.params;
  const { date, note, aiSummary, aiNextAction, aiRisk, type } = req.body;

  if (!note || !date) {
    return res.status(400).json({ error: "Data e nota são obrigatórias." });
  }

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
        note,
        aiSummary || null,
        aiNextAction || null,
        aiRisk || null,
        type || "note"
      ]
    );
    res.status(201).json({
      id: interactionId,
      date,
      note,
      aiSummary: aiSummary || null,
      aiNextAction: aiNextAction || null,
      aiRisk: aiRisk || null
    });
  } catch (err) {
    console.error("Erro ao salvar interação:", err);
    res.status(500).json({ error: "Erro interno do servidor ao salvar interação." });
  }
});

module.exports = router;
