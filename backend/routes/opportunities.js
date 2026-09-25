const express = require("express");
const crypto = require("crypto");
const { pool } = require("../db");
const { broadcastToAdmins, broadcastToDirectorsOfExec, notifyUser } = require("../websocket");
const { logAudit } = require("../utils/audit");
const { hasPermission, requirePermission } = require("../utils/acl");
const { decryptToken } = require("../utils/crypto");
const { isClientAllowedForUser } = require("../utils/portfolio");

const router = express.Router();

const DIRECT_CLIENT_ID = "direto";

// Mapa campo do front-end (camelCase) -> coluna do banco (snake_case).
// Usado tanto na criação quanto na atualização parcial.
const FIELD_MAP = {
  title: "title",
  executivo: "executivo",
  executivoId: "executivo_id",
  advertiserId: "advertiser_id",
  contactId: "contact_id",
  products: "products",
  value: "value",
  stage: "stage",
  periodMonths: "period_months",
  briefing: "briefing",
  createdAt: "data_criacao",
  deliveryDate: "data_entrega",
  expectedCloseDate: "previsao_fechamento",
  responsavel: "responsavel",
  tipo: "tipo",
  versao: "versao",
  status: "status",
  observacao: "observacao",
  planDeliveryDate: "plan_delivery_date",
  productValues: "product_values",
  attachments: "attachments",
};

function agencyIdToDb(agencyId) {
  return !agencyId || agencyId === DIRECT_CLIENT_ID ? null : agencyId;
}

// Helper para verificar se o usuário pode alterar a oportunidade
async function isOpportunityWriteAllowed(user, oppId, body = {}) {
  if (user.perfil === "admin") return true;

  // Campos de esteira de planejamento e valoração que podem ser editados por especialistas
  const PLANNING_FIELDS = [
    "status",
    "planDeliveryDate",
    "responsavel",
    "tipo",
    "versao",
    "observacao",
    "briefing",
    "products",
    "productValues",
    "value"
  ];
  const requestedFields = Object.keys(body);
  const isOnlyPlanningUpdate = requestedFields.length > 0 && requestedFields.every((f) => PLANNING_FIELDS.includes(f));

  if (hasPermission(user.perfil, "can_edit_planning") && isOnlyPlanningUpdate) {
    return true;
  }

  if (!hasPermission(user.perfil, "can_edit_opportunities")) return false;

  const oppRes = await pool.query("SELECT executivo, executivo_id FROM opportunities WHERE id = $1", [oppId]);
  if (oppRes.rows.length === 0) return true; // Deixa o update principal retornar 404
  const oppExecName = oppRes.rows[0].executivo;
  const oppExecId = oppRes.rows[0].executivo_id;

  if (user.perfil === "executivo") {
    if (!user.executivo_id) return false;
    if (oppExecId && String(oppExecId) === String(user.executivo_id)) return true;
    const execRes = await pool.query("SELECT nome FROM executivos WHERE id = $1", [user.executivo_id]);
    const myExecName = execRes.rows[0]?.nome;
    return oppExecName === myExecName;
  }

  if (user.perfil === "diretor") {
    const dirExecs = await pool.query(
      `SELECT e.id, e.nome FROM diretor_executivos de 
       JOIN executivos e ON e.id = de.executivo_id 
       WHERE de.diretor_id = $1`,
      [user.id]
    );
    const subordinateIds = dirExecs.rows.map((r) => r.id);
    const subordinateNames = dirExecs.rows.map((r) => r.nome);
    return (oppExecId && subordinateIds.includes(oppExecId)) || subordinateNames.includes(oppExecName);
  }

  return false;
}

// Helper para verificar se o usuário tem permissão de leitura sobre a oportunidade
async function isOpportunityReadAllowed(user, oppId) {
  if (user.perfil === "admin" || user.perfil === "especialista") return true;

  const oppRes = await pool.query("SELECT executivo, executivo_id FROM opportunities WHERE id = $1", [oppId]);
  if (oppRes.rows.length === 0) return false;
  const opp = oppRes.rows[0];

  if (user.perfil === "executivo") {
    if (!user.executivo_id) return false;
    if (opp.executivo_id && String(opp.executivo_id) === String(user.executivo_id)) return true;
    const execRes = await pool.query("SELECT nome FROM executivos WHERE id = $1", [user.executivo_id]);
    const myExecName = execRes.rows[0]?.nome;
    return opp.executivo === myExecName;
  }

  if (user.perfil === "diretor") {
    const dirExecs = await pool.query(
      `SELECT e.id, e.nome FROM diretor_executivos de 
       JOIN executivos e ON e.id = de.executivo_id 
       WHERE de.diretor_id = $1`,
      [user.id]
    );
    const subordinateIds = dirExecs.rows.map((r) => r.id);
    const subordinateNames = dirExecs.rows.map((r) => r.nome);
    return (opp.executivo_id && subordinateIds.includes(opp.executivo_id)) || subordinateNames.includes(opp.executivo);
  }

  return false;
}

// POST /api/v1/opportunities — cria oportunidade.
router.post("/opportunities", async (req, res) => {
  const body = req.body;
  if (!body.title || !body.executivo || !body.advertiserId) {
    return res.status(400).json({ error: "Título, executivo e anunciante são obrigatórios." });
  }

  // Validação de permissões para criação
  if (!hasPermission(req.user.perfil, "can_create_opportunities")) {
    return res.status(403).json({ error: "Acesso negado. Esta operação exige a permissão: can_create_opportunities" });
  }

  if (req.user.perfil === "executivo") {
    if (!req.user.executivo_id) {
      return res.status(403).json({ error: "Acesso negado. Seu usuário não está vinculado a nenhum executivo." });
    }
    const execRes = await pool.query("SELECT nome FROM executivos WHERE id = $1", [req.user.executivo_id]);
    const myExecName = execRes.rows[0]?.nome;
    if (body.executivo !== myExecName) {
      return res.status(403).json({ error: "Acesso negado. Você só pode criar oportunidades para si mesmo." });
    }
  } else if (req.user.perfil === "diretor") {
    const dirExecs = await pool.query(
      `SELECT e.nome FROM diretor_executivos de 
       JOIN executivos e ON e.id = de.executivo_id 
       WHERE de.diretor_id = $1`,
      [req.user.id]
    );
    const subordinateNames = dirExecs.rows.map((r) => r.nome);
    if (!subordinateNames.includes(body.executivo)) {
      return res.status(403).json({ error: "Acesso negado. Você só pode criar oportunidades para executivos da sua carteira." });
    }
  }

  // Validação de carteira comercial para anunciante e agência
  if (body.advertiserId) {
    const isAdvAllowed = await isClientAllowedForUser(req.user, body.advertiserId);
    if (!isAdvAllowed) {
      return res.status(403).json({ error: "Acesso negado. O anunciante informado não pertence à sua carteira autorizada." });
    }
  }

  const dbAgencyId = agencyIdToDb(body.agencyId);
  if (dbAgencyId) {
    const isAgencyAllowed = await isClientAllowedForUser(req.user, dbAgencyId);
    if (!isAgencyAllowed) {
      return res.status(403).json({ error: "Acesso negado. A agência informada não pertence à sua carteira autorizada." });
    }
  }

  const id = body.id || crypto.randomUUID();
  try {
    // Vincula a chave estrangeira executivo_id ([BD-002])
    let executivoId = body.executivoId || null;
    if (!executivoId && body.executivo) {
      const exRes = await pool.query("SELECT id FROM executivos WHERE LOWER(TRIM(nome)) = LOWER(TRIM($1)) LIMIT 1", [body.executivo]);
      if (exRes.rows.length > 0) {
        executivoId = exRes.rows[0].id;
      }
    }

    await pool.query(
      `insert into opportunities
       (id, title, executivo, executivo_id, agency_id, advertiser_id, contact_id, products, value, stage,
        period_months, briefing, responsavel, tipo, versao, status, observacao,
        plan_delivery_date, data_criacao, data_entrega, previsao_fechamento, product_values, attachments)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)`,
      [
        id, body.title, body.executivo, executivoId, agencyIdToDb(body.agencyId), body.advertiserId,
        body.contactId || null, body.products || [], body.value || 0, body.stage || "Desenvolvimento",
        body.periodMonths || [], body.briefing || null, body.responsavel || "", body.tipo || "Novo",
        body.versao || 1, body.status || "Pendente", body.observacao || "",
        body.planDeliveryDate || null, body.createdAt || null, body.deliveryDate || null, body.expectedCloseDate || null,
        body.productValues || '{}', JSON.stringify(body.attachments || [])
      ]
    );
    await logAudit(
      req.user.id,
      req.user.email,
      "create_opportunity",
      `Criou a oportunidade "${body.title}" (ID: ${id}) para o executivo "${body.executivo}" com o valor de R$ ${body.value || 0}`
    );
    res.status(201).json({ id });
  } catch (err) {
    console.error("Erro em POST /opportunities:", err);
    res.status(500).json({ error: "Não foi possível salvar a oportunidade." });
  }
});

// PUT /api/v1/opportunities/:id — atualização PARCIAL.
router.put("/opportunities/:id", async (req, res) => {
  const { id } = req.params;
  const body = req.body;

  // Validação de permissões para edição
  const allowed = await isOpportunityWriteAllowed(req.user, id, body);
  if (!allowed) {
    return res.status(403).json({ error: "Acesso negado. Você não tem permissão para alterar esta oportunidade." });
  }

  // 1. Busca dados da oportunidade ANTES da alteração para comparar depois
  const beforeRes = await pool.query(
    "SELECT id, title, executivo, executivo_id, stage, agency_id, advertiser_id, contact_id, value, period_months, briefing, created_at, data_entrega, previsao_fechamento, products, responsavel, attachments FROM opportunities WHERE id = $1",
    [id]
  );
  if (beforeRes.rows.length === 0) {
    return res.status(404).json({ error: "Oportunidade não encontrada." });
  }
  const oldOpp = beforeRes.rows[0];

  // Validação de carteira comercial para anunciante e agência
  if (body.advertiserId && body.advertiserId !== oldOpp.advertiser_id) {
    const isAdvAllowed = await isClientAllowedForUser(req.user, body.advertiserId);
    if (!isAdvAllowed) {
      return res.status(403).json({ error: "Acesso negado. O anunciante informado não pertence à sua carteira autorizada." });
    }
  }

  const newAgencyDb = agencyIdToDb(body.agencyId);
  if (body.agencyId !== undefined && newAgencyDb !== oldOpp.agency_id) {
    if (newAgencyDb) {
      const isAgencyAllowed = await isClientAllowedForUser(req.user, newAgencyDb);
      if (!isAgencyAllowed) {
        return res.status(403).json({ error: "Acesso negado. A agência informada não pertence à sua carteira autorizada." });
      }
    }
  }

  // Bloqueio de transferência indevida de titularidade (Parameter Tampering / BOLA)
  if (req.user.perfil === "executivo" || req.user.perfil === "especialista") {
    if (
      (body.executivoId && String(body.executivoId) !== String(oldOpp.executivo_id)) ||
      (body.executivo && body.executivo !== oldOpp.executivo)
    ) {
      return res.status(403).json({ error: "Acesso negado. Apenas administradores e diretores podem transferir a titularidade de uma oportunidade." });
    }
  } else if (req.user.perfil === "diretor") {
    if (body.executivo || body.executivoId) {
      const dirExecs = await pool.query(
        `SELECT e.id, e.nome FROM diretor_executivos de 
         JOIN executivos e ON e.id = de.executivo_id 
         WHERE de.diretor_id = $1`,
        [req.user.id]
      );
      const subordinateIds = dirExecs.rows.map((r) => String(r.id));
      const subordinateNames = dirExecs.rows.map((r) => r.nome);
      if (body.executivoId && !subordinateIds.includes(String(body.executivoId))) {
        return res.status(403).json({ error: "Acesso negado. Você só pode reatribuir oportunidades para executivos da sua carteira." });
      }
      if (body.executivo && !subordinateNames.includes(body.executivo)) {
        return res.status(403).json({ error: "Acesso negado. Você só pode reatribuir oportunidades para executivos da sua carteira." });
      }
    }
  }

  // Sincroniza executivo_id e executivo se um deles for alterado ([BD-002])
  if (body.executivo && !body.executivoId) {
    const exRes = await pool.query("SELECT id FROM executivos WHERE LOWER(TRIM(nome)) = LOWER(TRIM($1)) LIMIT 1", [body.executivo]);
    if (exRes.rows.length > 0) {
      body.executivoId = exRes.rows[0].id;
    }
  } else if (body.executivoId && !body.executivo) {
    const exRes = await pool.query("SELECT nome FROM executivos WHERE id = $1 LIMIT 1", [body.executivoId]);
    if (exRes.rows.length > 0) {
      body.executivo = exRes.rows[0].nome;
    }
  }

  // Preserva dataUri dos anexos existentes se o payload não enviou dataUri ([BD-001])
  if (Array.isArray(body.attachments)) {
    const existingAtts = Array.isArray(oldOpp.attachments) ? oldOpp.attachments : [];
    body.attachments = body.attachments.map((newAtt) => {
      if (!newAtt.dataUri) {
        const found = existingAtts.find((e) => String(e.id) === String(newAtt.id) || e.name === newAtt.name);
        if (found && found.dataUri) {
          return { ...newAtt, dataUri: found.dataUri };
        }
      }
      return newAtt;
    });
  }

  const setClauses = [];
  const values = [];
  let i = 1;

  for (const [jsField, dbColumn] of Object.entries(FIELD_MAP)) {
    if (Object.prototype.hasOwnProperty.call(body, jsField)) {
      setClauses.push(`${dbColumn} = $${i}`);
      let val = body[jsField];
      if (jsField === "agencyId") {
        val = agencyIdToDb(val);
      } else if (jsField === "attachments" || jsField === "productValues") {
        val = JSON.stringify(val || (jsField === "attachments" ? [] : {}));
      }
      values.push(val);
      i++;
    }
  }

  if (setClauses.length === 0) {
    return res.status(400).json({ error: "Nenhum campo válido para atualizar." });
  }

  values.push(id);
  try {
    const result = await pool.query(
      `update opportunities set ${setClauses.join(", ")} where id = $${i}`,
      values
    );
    if (result.rowCount === 0) return res.status(404).json({ error: "Oportunidade não encontrada." });

    // 1.1 Registro de auditoria completo para alterações do card
    const changesLog = [];
    if (body.title && body.title !== oldOpp.title) {
      changesLog.push(`Título: "${oldOpp.title}" → "${body.title}"`);
    }
    if (body.executivo && body.executivo !== oldOpp.executivo) {
      changesLog.push(`Executivo: "${oldOpp.executivo}" → "${body.executivo}"`);
    }
    if (body.stage && body.stage !== oldOpp.stage) {
      changesLog.push(`Estágio: "${oldOpp.stage}" → "${body.stage}"`);
    }
    if (body.value !== undefined && Number(body.value) !== Number(oldOpp.value)) {
      const formatBRL = (val) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
      changesLog.push(`Valor: ${formatBRL(oldOpp.value)} → ${formatBRL(body.value)}`);
    }
    if (body.briefing !== undefined && body.briefing !== oldOpp.briefing) {
      changesLog.push(`Briefing atualizado`);
    }
    if (body.deliveryDate && body.deliveryDate !== oldOpp.data_entrega) {
      changesLog.push(`Data de entrega: "${oldOpp.data_entrega || ''}" → "${body.deliveryDate}"`);
    }
    if (body.expectedCloseDate && body.expectedCloseDate !== oldOpp.previsao_fechamento) {
      changesLog.push(`Previsão de fechamento: "${oldOpp.previsao_fechamento || ''}" → "${body.expectedCloseDate}"`);
    }
    if (body.products && JSON.stringify(body.products) !== JSON.stringify(oldOpp.products)) {
      changesLog.push(`Produtos: [${(oldOpp.products || []).join(", ")}] → [${(body.products || []).join(", ")}]`);
    }

    if (changesLog.length > 0) {
      await logAudit(
        req.user.id,
        req.user.email,
        "update_opportunity",
        `Oportunidade "${oldOpp.title}" (ID: ${id}) editada: ${changesLog.join("; ")}.`
      );
    }

    // 2. Notificação: Proposta Aprovada (stage mudou para 'Fechado')
    if (body.stage === "Fechado" && oldOpp.stage !== "Fechado") {
      const title = `🎉 Proposta Aprovada`;
      const message = `A proposta comercial da oportunidade "${oldOpp.title}" do executivo ${oldOpp.executivo} foi aprovada (Fechada/Ganha)!`;
      
      await broadcastToAdmins(title, message, "proposal_approved", oldOpp.advertiser_id);
      await broadcastToDirectorsOfExec(oldOpp.executivo, title, message, "proposal_approved", oldOpp.advertiser_id);

      // 3. Notificação: Meta de Faturamento Atingida no Mês
      const periodMonths = oldOpp.period_months || [];
      const oppValue = Number(oldOpp.value) || 0;

      for (const monthCode of periodMonths) {
        const execSearch = await pool.query("SELECT id FROM executivos WHERE nome = $1 LIMIT 1", [oldOpp.executivo]);
        if (execSearch.rows.length > 0) {
          const execId = execSearch.rows[0].id;

          // Soma metas do executivo no período
          const metaRes = await pool.query(
            `SELECT COALESCE(SUM(valor), 0) as total_meta FROM metas 
             WHERE periodo = $1 AND segmento IN (
               SELECT segmento FROM segmento_executivo WHERE executivo_id = $2
             )`,
            [monthCode, execId]
          );
          const totalMeta = Number(metaRes.rows[0].total_meta);

          if (totalMeta > 0) {
            // Soma faturamento efetivo (OPEC)
            const fatRes = await pool.query(
              `SELECT COALESCE(SUM(f.valor), 0) as total_faturamento 
               FROM faturamento_efetivo f
               JOIN clients c ON c.codigo = f.cliente_codigo
               WHERE f.periodo = $1 AND (
                 c.segmento IN (SELECT segmento FROM segmento_executivo WHERE executivo_id = $2)
                 OR c.id IN (SELECT client_id FROM carteira_key_accounts WHERE executivo_id = $2)
               )`,
              [monthCode, execId]
            );
            const totalFaturamento = Number(fatRes.rows[0].total_faturamento);

            // Soma outras oportunidades ganhas no mesmo período
            const oppsWonRes = await pool.query(
              `SELECT COALESCE(SUM(value), 0) as closed_opps_value 
               FROM opportunities 
               WHERE stage = 'Fechado' AND executivo = $1 AND $2 = ANY(period_months)`,
              [oldOpp.executivo, monthCode]
            );
            const closedOppsValue = Number(oppsWonRes.rows[0].closed_opps_value);

            const currentTotal = totalFaturamento + closedOppsValue;
            const previousTotal = currentTotal - oppValue;

            // Se cruzou a linha da meta agora
            if (previousTotal < totalMeta && currentTotal >= totalMeta) {
              const metaTitle = `🚀 Meta Batida!`;
              const metaMessage = `O executivo ${oldOpp.executivo} atingiu a meta de faturamento do período de ${monthCode}!`;

              await broadcastToAdmins(metaTitle, metaMessage, "goal_reached", oldOpp.advertiser_id);
              await broadcastToDirectorsOfExec(oldOpp.executivo, metaTitle, metaMessage, "goal_reached", oldOpp.advertiser_id);
            }
          }
        }
      }
    }

    // 4. Se houver novos responsáveis atribuídos, envia notificação no app e e-mail
    if (body.responsavel !== undefined) {
      const parseList = (str) => str ? str.split(",").map(x => x.trim()).filter(Boolean) : [];
      const oldList = parseList(oldOpp.responsavel);
      const newList = parseList(body.responsavel);
      const newlyAdded = newList.filter(x => !oldList.includes(x));

      for (const name of newlyAdded) {
        try {
          // Busca o usuário atribuído no banco
          const userRes = await pool.query(
            "SELECT id, email, nome FROM usuarios WHERE nome = $1 LIMIT 1",
            [name]
          );
          if (userRes.rows.length > 0) {
            const targetUser = userRes.rows[0];
            const title = "📋 Novo Responsável";
            const message = `Você foi atribuído como responsável pelo planejamento da oportunidade "${oldOpp.title}" (${oldOpp.executivo}).`;
            
            // 4.1 Notificação no Aplicativo (em tempo real)
            await notifyUser(targetUser.id, title, message, "opportunity_assigned", oldOpp.advertiser_id);

            // 4.2 Enviar e-mail notificando a atribuição
            const SYSTEM_EMAIL_USER = process.env.SYSTEM_EMAIL_USER || "crm@redetv.com.br";
            const SYSTEM_EMAIL_REFRESH_TOKEN = process.env.SYSTEM_EMAIL_REFRESH_TOKEN;
            
            const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
            const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

            const emailSubject = `CRM RedeTV! - Atribuição de Oportunidade: ${oldOpp.title}`;
            const emailBody = `Olá ${targetUser.nome},\n\n` +
              `Você foi atribuído como responsável pelo planejamento da seguinte oportunidade:\n\n` +
              `Oportunidade: ${oldOpp.title}\n` +
              `Executivo: ${oldOpp.executivo}\n` +
              `Data de Atribuição: ${new Date().toLocaleDateString("pt-BR")}\n\n` +
              `Acesse o CRM para iniciar o desenvolvimento do plano.\n\n` +
              `Atenciosamente,\n` +
              `Equipe CRM RedeTV!`;

            let refreshTokenToUse = SYSTEM_EMAIL_REFRESH_TOKEN;
            let accessTokenToUse = null;

            if (!refreshTokenToUse) {
              // Fallback: busca tokens do remetente (usuário logado)
              const senderTokensRes = await pool.query(
                "SELECT google_refresh_token, google_access_token FROM usuarios WHERE id = $1",
                [req.user.id]
              );
              if (senderTokensRes.rows.length > 0 && senderTokensRes.rows[0].google_refresh_token) {
                refreshTokenToUse = senderTokensRes.rows[0].google_refresh_token;
                accessTokenToUse = senderTokensRes.rows[0].google_access_token;
              }
            }

            if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && refreshTokenToUse) {
              const { OAuth2Client } = require("google-auth-library");
              const oauth2Client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
              oauth2Client.setCredentials({
                refresh_token: decryptToken(refreshTokenToUse),
                access_token: decryptToken(accessTokenToUse)
              });

              // Atualiza o token
              const { token: accessToken } = await oauth2Client.getAccessToken();

              // Se estiver usando o e-mail do sistema, adiciona a tag "From:"
              const fromHeader = SYSTEM_EMAIL_REFRESH_TOKEN ? `From: ${SYSTEM_EMAIL_USER}\n` : "";

              const rawMessage = [
                fromHeader +
                `To: ${targetUser.email}`,
                `Subject: =?utf-8?B?${Buffer.from(emailSubject).toString("base64")}?=`,
                "MIME-Version: 1.0",
                "Content-Type: text/plain; charset=utf-8",
                "Content-Transfer-Encoding: base64",
                "",
                Buffer.from(emailBody).toString("base64")
              ].join("\n");

              // Envia via Gmail API
              const gmailRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${accessToken}`,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  raw: Buffer.from(rawMessage).toString("base64").replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
                })
              });

              if (!gmailRes.ok) {
                const errData = await gmailRes.json().catch(() => ({}));
                console.error("Erro ao enviar e-mail de notificação real:", errData.error?.message);
              } else {
                console.log(`E-mail de notificação de atribuição enviado com sucesso para ${targetUser.email}`);
              }
            } else {
              console.log(`[SIMULADO] E-mail de notificação enviado para ${targetUser.email} (Sem tokens configurados):\nAssunto: ${emailSubject}\nCorpo:\n${emailBody}`);
            }
          }
        } catch (innerErr) {
          console.error(`Erro ao processar notificação de atribuição para ${name}:`, innerErr);
        }
      }
    }

    res.json({ id });
  } catch (err) {
    console.error("Erro em PUT /opportunities/:id:", err);
    res.status(500).json({ error: "Não foi possível atualizar a oportunidade." });
  }
});

// DELETE /api/v1/opportunities/:id — apenas para admins (via middleware requirePermission).
router.delete("/opportunities/:id", requirePermission("can_delete_opportunities"), async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Busca dados da oportunidade para o log de auditoria
    const oppRes = await pool.query("SELECT title, executivo, value FROM opportunities WHERE id = $1", [id]);
    if (oppRes.rows.length === 0) {
      return res.status(404).json({ error: "Oportunidade não encontrada." });
    }
    const opp = oppRes.rows[0];

    // 2. Deleta a oportunidade
    await pool.query("DELETE FROM opportunities WHERE id = $1", [id]);

    // 3. Log de auditoria
    const formatBRL = (val) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
    await logAudit(
      req.user.id,
      req.user.email,
      "delete_opportunity",
      `Oportunidade "${opp.title}" (Executivo: ${opp.executivo}, Valor: ${formatBRL(opp.value)}) foi excluída permanentemente.`
    );

    res.json({ success: true, message: "Oportunidade excluída com sucesso." });
  } catch (err) {
    console.error("Erro em DELETE /opportunities/:id:", err);
    res.status(500).json({ error: "Não foi possível excluir a oportunidade." });
  }
});

// GET /api/v1/opportunities/:id/attachments/:attachmentId — streaming de anexo sob demanda ([BD-001])
router.get("/opportunities/:id/attachments/:attachmentId", async (req, res) => {
  const { id, attachmentId } = req.params;
  try {
    const allowed = await isOpportunityReadAllowed(req.user, id);
    if (!allowed) {
      return res.status(403).json({ error: "Acesso negado. Você não tem permissão para acessar os anexos desta oportunidade." });
    }

    const oppRes = await pool.query("SELECT attachments FROM opportunities WHERE id = $1", [id]);
    if (oppRes.rows.length === 0) {
      return res.status(404).json({ error: "Oportunidade não encontrada." });
    }
    const attachments = oppRes.rows[0].attachments || [];
    const att = Array.isArray(attachments)
      ? attachments.find((a) => String(a.id) === String(attachmentId) || a.name === attachmentId)
      : null;

    if (!att) {
      return res.status(404).json({ error: "Anexo não encontrado." });
    }

    // Se o anexo possui dataUri em formato data:[<mediatype>][;base64],<data>
    if (att.dataUri && typeof att.dataUri === "string") {
      const match = att.dataUri.match(/^data:([^;]+);base64,(.*)$/);
      if (match) {
        const mimeType = match[1] || att.type || "application/octet-stream";
        const base64Data = match[2];
        const buffer = Buffer.from(base64Data, "base64");
        const fileName = att.name || `anexo-${attachmentId}`;
        const encodedFileName = encodeURIComponent(fileName);

        res.setHeader("Content-Type", mimeType);
        res.setHeader("Content-Length", buffer.length);
        res.setHeader(
          "Content-Disposition",
          `inline; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`
        );
        return res.send(buffer);
      }
    }

    // Caso possua uma URL externa direta
    if (att.url && !att.url.startsWith("/api/v1/opportunities")) {
      return res.redirect(att.url);
    }

    return res.json(att);
  } catch (err) {
    console.error("Erro ao recuperar anexo:", err);
    res.status(500).json({ error: "Não foi possível carregar o anexo." });
  }
});

module.exports = router;
