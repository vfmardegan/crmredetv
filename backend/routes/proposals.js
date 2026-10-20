const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const { pool } = require("../db");
const { requirePermission } = require("../utils/acl");
const { decryptToken } = require("../utils/crypto");

const router = express.Router();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// Helper para montar e-mail em formato MIME RFC 2822
function createMimeMessage({ to, subject, body, attachments, attachmentBase64, attachmentFilename }) {
  const boundary = "boundary_" + Math.random().toString(36).slice(2);
  const parts = [];

  parts.push(`To: ${to}`);
  parts.push(`Subject: =?utf-8?B?${Buffer.from(subject).toString("base64")}?=`);
  parts.push("MIME-Version: 1.0");
  parts.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
  parts.push("");

  // Texto do e-mail
  parts.push(`--${boundary}`);
  parts.push('Content-Type: text/plain; charset="utf-8"');
  parts.push("Content-Transfer-Encoding: base64");
  parts.push("");
  parts.push(Buffer.from(body).toString("base64"));
  parts.push("");

  // Lista unificada de anexos
  const list = [];
  if (attachments && Array.isArray(attachments)) {
    list.push(...attachments);
  } else if (attachmentBase64) {
    list.push({ base64: attachmentBase64, filename: attachmentFilename || "attachment" });
  }

  // Anexos
  for (const att of list) {
    if (att.base64) {
      const matches = att.base64.match(/^data:(.+);base64,/);
      const contentType = matches ? matches[1] : "application/octet-stream";

      const base64Data = att.base64.includes(";base64,")
        ? att.base64.split(";base64,")[1]
        : att.base64;

      parts.push(`--${boundary}`);
      parts.push(`Content-Type: ${contentType}`);
      parts.push("Content-Transfer-Encoding: base64");
      parts.push(`Content-Disposition: attachment; filename="${att.filename}"`);
      parts.push("");
      parts.push(base64Data);
      parts.push("");
    }
  }

  parts.push(`--${boundary}--`);

  const mime = parts.join("\r\n");
  return Buffer.from(mime)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// POST /api/v1/proposals — registra o envio manual
router.post("/proposals", requirePermission("can_send_proposals"), async (req, res) => {
  const { templateId, contactId, opportunityId } = req.body;
  if (!templateId || !contactId) {
    return res.status(400).json({ error: "templateId e contactId são obrigatórios." });
  }

  try {
    const contactRes = await pool.query("SELECT client_id FROM contacts WHERE id = $1", [contactId]);
    if (contactRes.rows.length === 0) {
      return res.status(404).json({ error: "Contato não encontrado." });
    }

    const id = crypto.randomUUID();
    await pool.query(
      `insert into sent_proposals (id, template_id, contact_id, opportunity_id, sent_at)
       values ($1, $2, $3, $4, now())`,
      [id, templateId, contactId, opportunityId || null]
    );
    res.status(201).json({ id });
  } catch (err) {
    console.error("Erro em POST /proposals:", err);
    res.status(500).json({ error: "Não foi possível registrar o envio da proposta comercial." });
  }
});

// POST /api/v1/proposals/send — envia proposta por e-mail (Gmail API ou Bypass) e registra histórico
router.post("/proposals/send", requirePermission("can_send_proposals"), async (req, res) => {
  const {
    templateId,
    contactId,
    opportunityId,
    subject,
    body,
    attachments,
    attachmentBase64,
    attachmentFilename
  } = req.body;

  if (!contactId || !subject || !body) {
    return res.status(400).json({ error: "Parâmetros obrigatórios ausentes (contactId, subject, body)." });
  }

  try {
    // 1. Busca dados do contato e do cliente associado
    const contactRes = await pool.query(
      `SELECT c.email, c.name, cl.id as client_id, cl.nome_fantasia, cl.razao_social 
       FROM contacts c 
       JOIN clients cl ON c.client_id = cl.id 
       WHERE c.id = $1`,
      [contactId]
    );

    if (contactRes.rows.length === 0) {
      return res.status(404).json({ error: "Contato não encontrado." });
    }

    const contact = contactRes.rows[0];
    if (!contact.email) {
      return res.status(400).json({ error: "Este contato não possui e-mail cadastrado." });
    }

    // 2. Busca o título do template (se fornecido e existir no banco)
    let templateTitle = "Proposta Comercial";
    if (templateId) {
      const templateRes = await pool.query("SELECT title FROM proposal_templates WHERE id = $1", [templateId]);
      if (templateRes.rows.length > 0) templateTitle = templateRes.rows[0].title;
    }

    // 3. Verifica credenciais do Google para o usuário logado
    const userRes = await pool.query(
      "SELECT google_refresh_token, google_access_token FROM usuarios WHERE id = $1",
      [req.user.id]
    );

    const userTokens = userRes.rows[0];
    const hasGoogleTokens = userTokens && userTokens.google_refresh_token;

    let sentViaGmail = false;

    // Se estiver configurado e o usuário concedeu permissão, envia via Gmail real
    if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && hasGoogleTokens) {
      try {
        const oauth2Client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
        oauth2Client.setCredentials({
          refresh_token: decryptToken(userTokens.google_refresh_token),
          access_token: decryptToken(userTokens.google_access_token)
        });

        // Garante token atualizado
        const { token: accessToken } = await oauth2Client.getAccessToken();

        let resolvedAttachmentBase64 = attachmentBase64;
        if (resolvedAttachmentBase64 && resolvedAttachmentBase64.startsWith("/api/v1/uploads/")) {
          const safeName = path.basename(resolvedAttachmentBase64);
          const fPath = path.join(__dirname, "../uploads", safeName);
          if (fs.existsSync(fPath)) {
            resolvedAttachmentBase64 = "data:application/pdf;base64," + fs.readFileSync(fPath).toString("base64");
          }
        }

        const rawMessage = createMimeMessage({
          to: contact.email,
          subject,
          body,
          attachments,
          attachmentBase64: resolvedAttachmentBase64,
          attachmentFilename: attachmentFilename || "proposta.pdf"
        });

        const gmailRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ raw: rawMessage })
        });

        if (!gmailRes.ok) {
          const errData = await gmailRes.json().catch(() => ({}));
          throw new Error(errData.error?.message || `Status HTTP ${gmailRes.status}`);
        }

        sentViaGmail = true;
      } catch (gmailErr) {
        console.error("Falha ao enviar e-mail real pelo Gmail API. Tentando fallback/bypass:", gmailErr.message);
        // Não quebra a requisição se falhar, apenas indica que foi simulado
      }
    }

    // 4. Registra nas interações/histórico do cliente
    const interactionId = crypto.randomUUID();
    const interactionNote = `Proposta comercial — ${templateTitle} enviada para ${contact.name}\n\nAssunto: ${subject}\n\nMensagem:\n${body}`;
    
    await pool.query(
      `INSERT INTO client_interactions (id, client_id, user_id, date, note, type)
       VALUES ($1, $2, $3, CURRENT_DATE, $4, 'proposal')`,
      [interactionId, contact.client_id, req.user.id, interactionNote]
    );

    res.json({
      success: true,
      sentViaGmail,
      interactionId,
      mocked: !sentViaGmail
    });

  } catch (err) {
    console.error("Erro ao enviar proposta por e-mail:", err);
    res.status(500).json({ error: "Erro interno do servidor ao processar envio da proposta comercial." });
  }
});

// POST /api/v1/emails/send — envia e-mail customizado (Gmail API ou Bypass) e registra histórico
router.post("/emails/send", requirePermission("can_send_proposals"), async (req, res) => {
  const {
    contactId,
    subject,
    body,
    attachmentBase64,
    attachmentFilename
  } = req.body;

  if (!contactId || !subject || !body) {
    return res.status(400).json({ error: "Parâmetros obrigatórios ausentes (contactId, subject, body)." });
  }

  try {
    // 1. Busca dados do contato e do cliente associado
    const contactRes = await pool.query(
      `SELECT c.email, c.name, cl.id as client_id, cl.nome_fantasia, cl.razao_social 
       FROM contacts c 
       JOIN clients cl ON c.client_id = cl.id 
       WHERE c.id = $1`,
      [contactId]
    );

    if (contactRes.rows.length === 0) {
      return res.status(404).json({ error: "Contato não encontrado." });
    }

    const contact = contactRes.rows[0];
    if (!contact.email) {
      return res.status(400).json({ error: "Este contato não possui e-mail cadastrado." });
    }

    // 2. Verifica credenciais do Google para o usuário logado
    const userRes = await pool.query(
      "SELECT google_refresh_token, google_access_token FROM usuarios WHERE id = $1",
      [req.user.id]
    );

    const userTokens = userRes.rows[0];
    const hasGoogleTokens = userTokens && userTokens.google_refresh_token;

    let sentViaGmail = false;

    // Se estiver configurado e o usuário concedeu permissão, envia via Gmail real
    if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && hasGoogleTokens) {
      try {
        const oauth2Client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
        oauth2Client.setCredentials({
          refresh_token: decryptToken(userTokens.google_refresh_token),
          access_token: decryptToken(userTokens.google_access_token)
        });

        // Garante token atualizado
        const { token: accessToken } = await oauth2Client.getAccessToken();

        const rawMessage = createMimeMessage({
          to: contact.email,
          subject,
          body,
          attachmentBase64,
          attachmentFilename
        });

        const gmailRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ raw: rawMessage })
        });

        if (!gmailRes.ok) {
          const errData = await gmailRes.json().catch(() => ({}));
          throw new Error(errData.error?.message || `Status HTTP ${gmailRes.status}`);
        }

        sentViaGmail = true;
      } catch (gmailErr) {
        console.error("Falha ao enviar e-mail real pelo Gmail API. Tentando fallback/bypass:", gmailErr.message);
      }
    }

    // 3. Registra nas interações/histórico do cliente
    const isProposal = req.body.isProposal === true;
    const interactionId = crypto.randomUUID();
    let interactionNote = isProposal
      ? `Proposta comercial enviada para ${contact.name}\n\nAssunto: ${subject}\n\nMensagem:\n${body}`
      : `E-mail para ${contact.name}\n\nAssunto: ${subject}\n\nMensagem:\n${body}`;
    if (attachmentFilename) {
      interactionNote += `\n\n📎 Anexo: ${attachmentFilename}`;
    }
    
    await pool.query(
      `INSERT INTO client_interactions (id, client_id, user_id, date, note, type)
       VALUES ($1, $2, $3, CURRENT_DATE, $4, $5)`,
      [interactionId, contact.client_id, req.user.id, interactionNote, isProposal ? 'proposal' : 'email']
    );

    res.json({
      success: true,
      sentViaGmail,
      interactionId,
      mocked: !sentViaGmail
    });

  } catch (err) {
    console.error("Erro ao enviar e-mail:", err);
    res.status(500).json({ error: "Erro interno do servidor ao processar envio do e-mail." });
  }
});

// ==========================================
// ROTAS CRUD DE PROPOSICÕES / PROPOSTAS PADRÃO
// ==========================================

// GET /api/v1/proposal-templates
router.get("/proposal-templates", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, product, title, subtitle, horario, periodo, cluster, observacao,
              pdf_file_name as "pdfFileName", pdf_data_uri as "pdfDataUri",
              xls_file_name as "xlsFileName", xls_data_uri as "xlsDataUri",
              created_at as "createdAt"
       FROM proposal_templates
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Erro em GET /proposal-templates:", err);
    res.status(500).json({ error: "Erro ao buscar propostas padrão." });
  }
});

// POST /api/v1/proposal-templates
router.post("/proposal-templates", async (req, res) => {
  const {
    product,
    title,
    subtitle,
    horario,
    periodo,
    cluster,
    observacao,
    pdfFileName,
    pdfDataUri,
    xlsFileName,
    xlsDataUri
  } = req.body;

  if (!title) {
    return res.status(400).json({ error: "O título da proposta é obrigatório." });
  }

  const id = "tpl-" + crypto.randomUUID().slice(0, 8);

  try {
    const query = `
      INSERT INTO proposal_templates (
        id, product, title, subtitle, horario, periodo, cluster, observacao,
        pdf_file_name, pdf_data_uri, xls_file_name, xls_data_uri
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id, product, title, subtitle, horario, periodo, cluster, observacao,
                pdf_file_name as "pdfFileName", pdf_data_uri as "pdfDataUri",
                xls_file_name as "xlsFileName", xls_data_uri as "xlsDataUri",
                created_at as "createdAt"
    `;
    const values = [
      id,
      product || "",
      title,
      subtitle || observacao || "",
      horario || "",
      periodo || "",
      cluster || "Televisão",
      observacao || subtitle || "",
      pdfFileName || null,
      pdfDataUri || null,
      xlsFileName || null,
      xlsDataUri || null
    ];
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Erro em POST /proposal-templates:", err);
    res.status(500).json({ error: "Erro ao criar proposta padrão." });
  }
});

// PUT /api/v1/proposal-templates/:id
router.put("/proposal-templates/:id", async (req, res) => {
  const { id } = req.params;
  const {
    product,
    title,
    subtitle,
    horario,
    periodo,
    cluster,
    observacao,
    pdfFileName,
    pdfDataUri,
    xlsFileName,
    xlsDataUri
  } = req.body;

  if (!title) {
    return res.status(400).json({ error: "O título da proposta é obrigatório." });
  }

  try {
    const query = `
      UPDATE proposal_templates
      SET product = $1,
          title = $2,
          subtitle = $3,
          horario = $4,
          periodo = $5,
          cluster = $6,
          observacao = $7,
          pdf_file_name = COALESCE($8, pdf_file_name),
          pdf_data_uri = COALESCE($9, pdf_data_uri),
          xls_file_name = COALESCE($10, xls_file_name),
          xls_data_uri = COALESCE($11, xls_data_uri)
      WHERE id = $12
      RETURNING id, product, title, subtitle, horario, periodo, cluster, observacao,
                pdf_file_name as "pdfFileName", pdf_data_uri as "pdfDataUri",
                xls_file_name as "xlsFileName", xls_data_uri as "xlsDataUri",
                created_at as "createdAt"
    `;
    const values = [
      product || "",
      title,
      subtitle || observacao || "",
      horario || "",
      periodo || "",
      cluster || "Televisão",
      observacao || subtitle || "",
      pdfFileName,
      pdfDataUri,
      xlsFileName,
      xlsDataUri,
      id
    ];
    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Proposta padrão não encontrada." });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Erro em PUT /proposal-templates/:id:", err);
    res.status(500).json({ error: "Erro ao atualizar proposta padrão." });
  }
});

// DELETE /api/v1/proposal-templates/:id
router.delete("/proposal-templates/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM proposal_templates WHERE id = $1", [id]);
    res.json({ success: true, id, message: "Proposta padrão removida com sucesso." });
  } catch (err) {
    console.error("Erro em DELETE /proposal-templates/:id:", err);
    res.status(500).json({ error: "Erro ao excluir proposta padrão." });
  }
});

module.exports = router;
