const express = require("express");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const { pool } = require("../db");
const { requirePermission } = require("../utils/acl");
const { decryptToken } = require("../utils/crypto");

const router = express.Router();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// POST /api/v1/calendar/event — cria evento na agenda (Google Calendar ou Bypass)
router.post("/calendar/event", requirePermission("can_schedule_meetings"), async (req, res) => {
  const { clientId, title, date, time, duration, description, guests } = req.body;

  if (!clientId || !title || !date || !time) {
    return res.status(400).json({ error: "clientId, title, date e time são obrigatórios." });
  }

  try {
    // 1. Busca informações de tokens do Google do usuário logado
    const userRes = await pool.query(
      "SELECT google_refresh_token, google_access_token FROM usuarios WHERE id = $1",
      [req.user.id]
    );

    const userTokens = userRes.rows[0];
    const hasGoogleTokens = userTokens && userTokens.google_refresh_token;

    let createdInCalendar = false;

    // Se estiver configurado e o usuário concedeu permissão, cria no Calendar real
    if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && hasGoogleTokens) {
      try {
        const oauth2Client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
        oauth2Client.setCredentials({
          refresh_token: decryptToken(userTokens.google_refresh_token),
          access_token: decryptToken(userTokens.google_access_token)
        });

        // Garante token atualizado
        const { token: accessToken } = await oauth2Client.getAccessToken();

        // Converte data/hora para formato RFC 3339
        const startDateTime = new Date(`${date}T${time}:00`);
        const durationMinutes = Number(duration) || 60;
        const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60000);

        const eventData = {
          summary: title,
          description: description || "",
          start: {
            dateTime: startDateTime.toISOString(),
            timeZone: "America/Sao_Paulo"
          },
          end: {
            dateTime: endDateTime.toISOString(),
            timeZone: "America/Sao_Paulo"
          },
          attendees: Array.isArray(guests) ? guests.map(email => ({ email })) : []
        };

        const calendarRes = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(eventData)
        });

        if (!calendarRes.ok) {
          const errData = await calendarRes.json().catch(() => ({}));
          throw new Error(errData.error?.message || `Status HTTP ${calendarRes.status}`);
        }

        createdInCalendar = true;
      } catch (calendarErr) {
        console.error("Falha ao criar evento no Calendar real. Usando simulador:", calendarErr.message);
      }
    }

    // 2. Registra nas interações/histórico do cliente
    const interactionId = crypto.randomUUID();
    const durationStr = duration ? `${duration} min` : "1 hora";
    const guestsStr = Array.isArray(guests) && guests.length > 0 ? `\nParticipantes: ${guests.join(", ")}` : "";
    const interactionNote = `📅 Compromisso Agendado (${createdInCalendar ? "Google Calendar" : "Simulador"}): ${title}\nData: ${date} às ${time} (${durationStr})${guestsStr}\n\nDescrição:\n${description || "Sem descrição"}`;

    await pool.query(
      `INSERT INTO client_interactions (id, client_id, user_id, date, note, type)
       VALUES ($1, $2, $3, $4, $5, 'meeting')`,
      [interactionId, clientId, req.user.id, date, interactionNote]
    );

    res.json({
      success: true,
      createdInCalendar,
      interactionId,
      mocked: !createdInCalendar
    });

  } catch (err) {
    console.error("Erro ao agendar compromisso:", err);
    res.status(500).json({ error: "Erro interno do servidor ao agendar compromisso." });
  }
});

module.exports = router;
