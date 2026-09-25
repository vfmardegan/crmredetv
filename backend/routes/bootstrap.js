const express = require("express");
const { pool } = require("../db");
const { calculateWinProbabilities } = require("../utils/predictive");

const router = express.Router();

const DIRECT_CLIENT_ID = "direto";

function clientRowToJson(row, agencyLinksByAgencyId, interactionsByClientId) {
  return {
    id: row.id,
    codigo: row.codigo || "",
    razaoSocial: row.razao_social || "",
    cnpj: row.cnpj || "",
    nomeFantasia: row.nome_fantasia || "",
    name: row.nome_fantasia || row.razao_social || "",
    type: row.type,
    segmento: row.segmento || "",
    atendeAnunciantes: row.type === "Agência" ? agencyLinksByAgencyId[row.id] || [] : [],
    interactions: interactionsByClientId[row.id] || [],
    createdAt: row.created_at,
    aiSummary: row.ai_summary || null,
  };
}

function contactRowToJson(row) {
  return {
    id: row.id,
    clientId: row.client_id,
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
  };
}

function opportunityRowToJson(row) {
  // Desacoplamento dos anexos base64 ([BD-001]):
  // Remove o payload de dataUri do bootstrap para manter o JSON leve e performático.
  // Fornece a URL para streaming sob demanda caso o usuário clique em baixar.
  const rawAttachments = Array.isArray(row.attachments) ? row.attachments : [];
  const lightweightAttachments = rawAttachments.map((att) => {
    const { dataUri, ...meta } = att;
    return {
      ...meta,
      url: meta.url || `/api/v1/opportunities/${row.id}/attachments/${meta.id || encodeURIComponent(meta.name || "anexo")}`,
    };
  });

  return {
    id: row.id,
    title: row.title,
    executivo: row.executivo || "",
    executivoId: row.executivo_id || null, // [BD-002] Foreign key vinculada
    agencyId: row.agency_id || DIRECT_CLIENT_ID,
    advertiserId: row.advertiser_id,
    contactId: row.contact_id,
    products: row.products || [],
    value: Number(row.value) || 0,
    stage: row.stage,
    periodMonths: row.period_months || [],
    briefing: row.briefing || "",
    createdAt: row.data_criacao || "",
    deliveryDate: row.data_entrega || "",
    expectedCloseDate: row.previsao_fechamento || "",
    responsavel: row.responsavel || "",
    tipo: row.tipo || "Novo",
    versao: row.versao || 1,
    status: row.status || "Pendente",
    observacao: row.observacao || "",
    planDeliveryDate: row.plan_delivery_date || "",
    winProbability: row.winProbability !== undefined ? row.winProbability : null,
    productValues: row.product_values || {},
    attachments: lightweightAttachments,
  };
}

function proposalRowToJson(row) {
  return {
    id: row.id,
    templateId: row.template_id,
    contactId: row.contact_id,
    opportunityId: row.opportunity_id,
    sentAt: row.sent_at,
  };
}

function faturamentoRowToJson(row) {
  return {
    id: row.id,
    clienteCodigo: row.cliente_codigo,
    periodo: row.periodo,
    valor: Number(row.valor) || 0,
  };
}

router.get("/bootstrap", async (req, res) => {
  const { id: myUserId, perfil, executivo_id: myExecId } = req.user;

  try {
    const [
      clientsRes,
      linksRes,
      contactsRes,
      oppsRes,
      proposalsRes,
      faturamentoRes,
      metasRes,
      execRes,
      carteiraRes,
      keyAccountsRes,
      dirExecsRes,
      interactionsRes,
      responsaveisRes
    ] = await Promise.all([
      pool.query("select * from clients order by id"),
      pool.query("select * from agency_links"),
      pool.query("select * from contacts order by id"),
      pool.query("select * from opportunities order by id"),
      pool.query("select * from sent_proposals order by sent_at desc"),
      pool.query("select * from faturamento_efetivo"),
      pool.query("select * from metas"),
      pool.query(`
        SELECT e.* 
        FROM executivos e 
        LEFT JOIN usuarios u ON u.executivo_id = e.id 
        WHERE COALESCE(u.ativo, TRUE) = TRUE 
        ORDER BY e.nome
      `),
      pool.query("select * from segmento_executivo"),
      pool.query("select * from carteira_key_accounts"),
      pool.query("select * from diretor_executivos"),
      pool.query("select * from client_interactions order by date desc, created_at desc"),
      pool.query("select nome from usuarios where coalesce(ativo, true) = true order by nome"),
    ]);

    // Inicializa mapeamento de relacionamentos de agências
    const agencyLinksByAgencyId = {};
    linksRes.rows.forEach((l) => {
      if (!agencyLinksByAgencyId[l.agency_id]) agencyLinksByAgencyId[l.agency_id] = [];
      agencyLinksByAgencyId[l.agency_id].push(l.advertiser_id);
    });

    // Inicializa mapeamento de interações de clientes
    const interactionsByClientId = {};
    interactionsRes.rows.forEach((row) => {
      if (!interactionsByClientId[row.client_id]) {
        interactionsByClientId[row.client_id] = [];
      }
      const dateStr = row.date ? new Date(row.date).toISOString().slice(0, 10) : "";
      interactionsByClientId[row.client_id].push({
        id: row.id,
        date: dateStr,
        note: row.note,
        aiSummary: row.ai_summary,
        aiNextAction: row.ai_next_action,
        aiRisk: row.ai_risk,
        type: row.type || "note"
      });
    });

    // Calcula as probabilidades de ganho (Win Probability)
    oppsRes.rows = calculateWinProbabilities(oppsRes.rows, clientsRes.rows, interactionsRes.rows);

    // Filtra dados de acordo com o nível de permissão (RBAC)
    let filteredClients = clientsRes.rows;
    let filteredOpps = oppsRes.rows;
    let filteredContacts = contactsRes.rows;
    let filteredProposals = proposalsRes.rows;
    let filteredFaturamento = faturamentoRes.rows;
    let filteredMetas = metasRes.rows;
    let filteredExecutivos = execRes.rows;

    const segmentExecMap = {};
    carteiraRes.rows.forEach((c) => {
      segmentExecMap[c.segmento] = c.executivo_id;
    });

    if (perfil !== "admin" && perfil !== "especialista") {
      // 1. Resolve a lista de executivos cujo dados são permitidos
      let allowedExecIds = [];
      if (perfil === "executivo") {
        let resolvedExecId = myExecId;
        if (!resolvedExecId) {
          const uRes = await pool.query("SELECT executivo_id FROM usuarios WHERE id = $1", [myUserId]);
          resolvedExecId = uRes.rows[0]?.executivo_id || null;
        }
        allowedExecIds = resolvedExecId ? [resolvedExecId] : [];
      } else if (perfil === "diretor") {
        allowedExecIds = dirExecsRes.rows
          .filter((d) => String(d.diretor_id) === String(myUserId))
          .map((d) => d.executivo_id);
        if (myExecId && !allowedExecIds.includes(myExecId)) {
          allowedExecIds.push(myExecId);
        }
      }

      const allowedExecNames = execRes.rows
        .filter((e) => allowedExecIds.includes(e.id))
        .map((e) => e.nome);

      const allowedSegments = carteiraRes.rows
        .filter((c) => allowedExecIds.includes(c.executivo_id))
        .map((c) => c.segmento);

      const allowedKeyAccounts = keyAccountsRes.rows
        .filter((k) => allowedExecIds.includes(k.executivo_id))
        .map((k) => k.client_id);

      // 2. Clientes e Agências: todos disponíveis para que executivos possam criar oportunidades para qualquer cliente/agência no pipeline
      filteredClients = clientsRes.rows;

      // 3. Filtrar Oportunidades (de acordo com executivos autorizados via FK e nome)
      filteredOpps = oppsRes.rows.filter((o) =>
        (o.executivo_id && allowedExecIds.includes(o.executivo_id)) ||
        allowedExecNames.includes(o.executivo)
      );

      // 4. Contatos: todos disponíveis para seleção e vinculação na criação de oportunidades
      filteredContacts = contactsRes.rows;

      // 5. Filtrar Propostas vinculadas ao escopo de oportunidades do executivo
      const allowedOppIds = new Set(filteredOpps.map((o) => o.id));
      filteredProposals = proposalsRes.rows.filter((p) =>
        !p.opportunity_id || allowedOppIds.has(p.opportunity_id)
      );

      // 6. Faturamento Efetivo disponível para os relatórios da Visão Geral
      filteredFaturamento = faturamentoRes.rows;

      // 7. Filtrar Metas
      filteredMetas = metasRes.rows.filter((m) => {
        if (m.client_id) {
          return allowedKeyAccounts.includes(m.client_id);
        }
        return !m.segmento || allowedSegments.includes(m.segmento);
      });

      // 8. Executivos: todos disponíveis para atribuição e filtros no pipeline
      filteredExecutivos = execRes.rows;
    }

    if (perfil === "especialista") {
      filteredFaturamento = [];
      filteredMetas = [];
    }

    // Estrutura o objeto de metas mensais
    const monthlyMetas = {};
    filteredMetas.forEach((m) => {
      const key = m.client_id ? `keyaccount:${m.client_id}` : m.segmento;
      if (key) {
        if (!monthlyMetas[key]) monthlyMetas[key] = {};
        monthlyMetas[key][m.periodo] = Number(m.valor) || 0;
      }
    });

    // Mapeamento de carteira
    const segmentoExecutivo = {};
    carteiraRes.rows.forEach((c) => {
      // Admin e especialista têm visibilidade total dos segmentos
      if (perfil === "admin" || perfil === "especialista" || filteredExecutivos.some(e => e.id === c.executivo_id)) {
        segmentoExecutivo[c.segmento] = c.executivo_id;
      }
    });

    const executivoKeyAccounts = {};
    keyAccountsRes.rows.forEach((k) => {
      if (perfil === "admin" || perfil === "especialista" || filteredExecutivos.some(e => e.id === k.executivo_id)) {
        if (!executivoKeyAccounts[k.executivo_id]) executivoKeyAccounts[k.executivo_id] = [];
        executivoKeyAccounts[k.executivo_id].push(k.client_id);
      }
    });

    res.json({
      advertisers: filteredClients.map((r) => clientRowToJson(r, agencyLinksByAgencyId, interactionsByClientId)),
      contacts: filteredContacts.map(contactRowToJson),
      opportunities: filteredOpps.map(opportunityRowToJson),
      proposals: filteredProposals.map(proposalRowToJson),
      faturamentoEfetivo: filteredFaturamento.map(faturamentoRowToJson),
      monthlyMetas,
      executivos: filteredExecutivos.map((e) => ({ id: e.id, nome: e.nome, email: e.email || "" })),
      segmentoExecutivo,
      executivoKeyAccounts,
      responsaveis: responsaveisRes.rows.map(r => r.nome),
    });

  } catch (err) {
    console.error("Erro em GET /bootstrap com filtro RBAC:", err);
    res.status(500).json({ error: "Não foi possível carregar os dados autorizados." });
  }
});

module.exports = router;
