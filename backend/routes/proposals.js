const express = require("express");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const { pool } = require("../db");

const router = express.Router();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// Helper para montar e-mail em formato MIME RFC 2822
function createMimeMessage({ to, subject, body, attachmentBase64, attachmentFilename }) {
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

  // Anexo
  if (attachmentBase64) {
    const matches = attachmentBase64.match(/^data:(.+);base64,/);
    const contentType = matches ? matches[1] : "application/octet-stream";

    const base64Data = attachmentBase64.includes(";base64,")
      ? attachmentBase64.split(";base64,")[1]
      : attachmentBase64;

    parts.push(`--${boundary}`);
    parts.push(`Content-Type: ${contentType}`);
    parts.push("Content-Transfer-Encoding: base64");
    parts.push(`Content-Disposition: attachment; filename="${attachmentFilename}"`);
    parts.push("");
    parts.push(base64Data);
    parts.push("");
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
router.post("/proposals", async (req, res) => {
  const { templateId, contactId, opportunityId } = req.body;
  if (!templateId || !contactId) {
    return res.status(400).json({ error: "templateId e contactId são obrigatórios." });
  }
  const id = crypto.randomUUID();
  try {
    await pool.query(
      `insert into sent_proposals (id, template_id, contact_id, opportunity_id, sent_at)
       values ($1, $2, $3, $4, now())`,
      [id, templateId, contactId, opportunityId || null]
    );
    res.status(201).json({ id });
  } catch (err) {
    console.error("Erro em POST /proposals:", err);
    res.status(500).json({ error: "Não foi possível registrar o envio." });
  }
});

// POST /api/v1/proposals/send — envia proposta por e-mail (Gmail API ou Bypass) e registra histórico
router.post("/proposals/send", async (req, res) => {
  const {
    templateId,
    contactId,
    opportunityId,
    subject,
    body,
    attachmentBase64,
    attachmentFilename
  } = req.body;

  if (!templateId || !contactId || !subject || !body) {
    return res.status(400).json({ error: "Parâmetros obrigatórios ausentes (templateId, contactId, subject, body)." });
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

    // 2. Busca informações do template da proposta
    const templateRes = await pool.query("SELECT title FROM proposal_templates WHERE id = $1", [templateId]);
    const templateTitle = templateRes.rows.length > 0 ? templateRes.rows[0].title : "Proposta Comercial";

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
          refresh_token: userTokens.google_refresh_token,
          access_token: userTokens.google_access_token
        });

        // Garante token atualizado
        const { token: accessToken } = await oauth2Client.getAccessToken();

        const rawMessage = createMimeMessage({
          to: contact.email,
          subject,
          body,
          attachmentBase64,
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

    // 4. Registra no histórico de propostas enviadas
    const proposalId = crypto.randomUUID();
    await pool.query(
      `INSERT INTO sent_proposals (id, template_id, contact_id, opportunity_id, sent_at)
       VALUES ($1, $2, $3, $4, now())`,
      [proposalId, templateId, contactId, opportunityId || null]
    );

    // 5. Registra nas interações/histórico do cliente
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
      proposalId,
      interactionId,
      mocked: !sentViaGmail
    });

  } catch (err) {
    console.error("Erro ao enviar proposta por e-mail:", err);
    res.status(500).json({ error: "Erro interno do servidor ao processar envio: " + err.message });
  }
});

// POST /api/v1/emails/send — envia e-mail customizado (Gmail API ou Bypass) e registra histórico
router.post("/emails/send", async (req, res) => {
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
          refresh_token: userTokens.google_refresh_token,
          access_token: userTokens.google_access_token
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
    res.status(500).json({ error: "Erro interno do servidor ao processar envio: " + err.message });
  }
});

module.exports = router;
