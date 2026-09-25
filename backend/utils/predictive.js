let cachedStats = null;
let lastStatsCalculated = 0;
const STATS_TTL_MS = 1000 * 60 * 60 * 8; // 8 hours cache

function calculateWinProbabilities(opportunities, clients, interactions = []) {
  // Agrupa interações por cliente_id
  const clientInteractionsMap = {};
  interactions.forEach(i => {
    const cId = i.client_id;
    if (!cId) return;
    if (!clientInteractionsMap[cId]) clientInteractionsMap[cId] = [];
    clientInteractionsMap[cId].push(i);
  });

  const now = Date.now();
  if (!cachedStats || now - lastStatsCalculated > STATS_TTL_MS) {
    // Mapa de cliente_id -> segmento
    const clientSegmentMap = {};
    clients.forEach(c => {
      clientSegmentMap[c.id] = c.segmento || "Outros";
    });

    // Calcula as estatísticas históricas de ganhos/perdas
    const execStats = {};
    const segmentStats = {};
    const clientStats = {};
    const agencyStats = {};
    let totalWon = 0;
    let totalLost = 0;

    opportunities.forEach(opp => {
      const isWon = opp.stage === 'Fechado';
      const isLost = opp.stage === 'Negado' || opp.stage === 'Cancelado';
      const isClosed = isWon || isLost;

      if (isClosed) {
        if (isWon) totalWon++;
        if (isLost) totalLost++;

        // Estatísticas do executivo
        const exec = opp.executivo || "Desconhecido";
        if (!execStats[exec]) execStats[exec] = { won: 0, lost: 0 };
        if (isWon) execStats[exec].won++;
        if (isLost) execStats[exec].lost++;

        // Estatísticas do segmento de mercado
        const segment = clientSegmentMap[opp.advertiser_id] || "Outros";
        if (!segmentStats[segment]) segmentStats[segment] = { won: 0, lost: 0 };
        if (isWon) segmentStats[segment].won++;
        if (isLost) segmentStats[segment].lost++;

        // Estatísticas do cliente/anunciante específico
        const clientId = opp.advertiser_id;
        if (clientId) {
          if (!clientStats[clientId]) clientStats[clientId] = { won: 0, lost: 0 };
          if (isWon) clientStats[clientId].won++;
          if (isLost) clientStats[clientId].lost++;
        }

        // Estatísticas da agência parceira específica
        const agencyId = opp.agency_id;
        if (agencyId && agencyId !== 'direto') {
          if (!agencyStats[agencyId]) agencyStats[agencyId] = { won: 0, lost: 0 };
          if (isWon) agencyStats[agencyId].won++;
          if (isLost) agencyStats[agencyId].lost++;
        }
      }
    });

    cachedStats = {
      clientSegmentMap,
      execStats,
      segmentStats,
      clientStats,
      agencyStats,
      overallWinRate: (totalWon + totalLost) > 0 ? totalWon / (totalWon + totalLost) : 0.4
    };
    lastStatsCalculated = now;
  }

  const { clientSegmentMap, execStats, segmentStats, clientStats, agencyStats, overallWinRate } = cachedStats;
  const today = new Date();


  // 2. Probabilidades bases por etapa do pipeline (temperatura da negociação)
  const baseProbByStage = {
    'Frio': 15,
    'Morno': 30,
    'Quente': 50
  };

  // 3. Calcula a probabilidade para cada oportunidade
  return opportunities.map(opp => {
    const stage = opp.stage || 'Desenvolvimento';

    // Win Probability só funciona quando está Frio, Morno ou Quente
    if (stage === 'Desenvolvimento' || stage === 'Fechado' || stage === 'Negado' || stage === 'Cancelado') {
      return {
        ...opp,
        winProbability: null
      };
    }

    const baseProb = baseProbByStage[stage] !== undefined ? baseProbByStage[stage] : 30;

    // Taxa de conversão do executivo
    const exec = opp.executivo || "Desconhecido";
    let execWinRate = overallWinRate;
    if (execStats[exec]) {
      const { won, lost } = execStats[exec];
      if (won + lost > 0) {
        execWinRate = won / (won + lost);
      }
    }

    // Taxa de conversão do segmento
    const segment = clientSegmentMap[opp.advertiser_id] || "Outros";
    let segmentWinRate = overallWinRate;
    if (segmentStats[segment]) {
      const { won, lost } = segmentStats[segment];
      if (won + lost > 0) {
        segmentWinRate = won / (won + lost);
      }
    }

    // Taxa de conversão do cliente específico
    const clientId = opp.advertiser_id;
    let clientWinRate = null;
    if (clientId && clientStats[clientId]) {
      const { won, lost } = clientStats[clientId];
      if (won + lost > 0) {
        clientWinRate = won / (won + lost);
      }
    }

    // Taxa de conversão da agência específica
    const agencyId = opp.agency_id;
    let agencyWinRate = null;
    if (agencyId && agencyId !== 'direto' && agencyStats[agencyId]) {
      const { won, lost } = agencyStats[agencyId];
      if (won + lost > 0) {
        agencyWinRate = won / (won + lost);
      }
    }

    // Taxa de Engajamento e Relacionamento baseada em pontuação de atividades nos últimos 3 meses (90 dias)
    let engagementScore = 0;
    const clientInteractions = clientInteractionsMap[clientId] || [];
    if (clientInteractions.length > 0) {
      let scoreSum = 0;

      clientInteractions.forEach(i => {
        const iDate = new Date(i.date);
        const diffMs = today - iDate;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        // Considera apenas atividades dos últimos 90 dias
        if (diffDays >= 0 && diffDays <= 90) {
          const type = i.type || "note";
          if (type === "meeting") {
            scoreSum += 10; // Reunião = 10 pontos
          } else if (type === "call" || type === "phone") {
            scoreSum += 5; // Ligação = 5 pontos
          } else {
            scoreSum += 3; // E-mail, WhatsApp ou Anotação = 3 pontos
          }
        }
      });

      // Limitado a um máximo de 100 pontos
      engagementScore = Math.min(100, scoreSum);
    }

    // Taxas de conversão com fallbacks para o segmento
    const clientRateValue = clientWinRate !== null ? clientWinRate : segmentWinRate;
    const agencyRateValue = agencyWinRate !== null ? agencyWinRate : segmentWinRate;

    const hasAgency = agencyId && agencyId !== 'direto';

    // Média ponderada com os novos pesos corrigidos pelo usuário:
    // 1. VIA AGÊNCIA:
    //    15% Cliente, 35% Engajamento, 15% Agência, 15% Executivo, 10% Segmento, 10% Estágio
    // 2. CLIENTE DIRETO:
    //    20% Cliente, 40% Engajamento, 20% Executivo, 10% Segmento, 10% Estágio
    let weightedProb;
    if (hasAgency) {
      weightedProb = Math.round(
        0.10 * baseProb +
        0.15 * (clientRateValue * 100) +
        0.15 * (agencyRateValue * 100) +
        0.15 * (execWinRate * 100) +
        0.10 * (segmentWinRate * 100) +
        0.35 * engagementScore
      );
    } else {
      weightedProb = Math.round(
        0.10 * baseProb +
        0.20 * (clientRateValue * 100) +
        0.20 * (execWinRate * 100) +
        0.10 * (segmentWinRate * 100) +
        0.40 * engagementScore
      );
    }

    // Clampa para evitar extremos
    const winProbability = Math.max(5, Math.min(95, weightedProb));

    return {
      ...opp,
      winProbability
    };
  });
}

module.exports = { calculateWinProbabilities };
