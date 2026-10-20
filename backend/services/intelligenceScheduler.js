/**
 * Serviço de Agendamento e Varredura do Radar de Mercado
 * Horários previstos de varredura: 08h00, 12h00, 16h00 e 20h00 (Fuso de Brasília / America/Sao_Paulo)
 */

const { pool } = require("../db");
const marketSources = require("./marketSources");

const SCHEDULE_HOURS = [8, 12, 16, 20];
const TIMEZONE = "America/Sao_Paulo";

let lastRunTimestamp = null;
let schedulerInterval = null;
let lastTriggeredSlot = null; // 'YYYY-MM-DD-HH' para evitar disparo duplicado no mesmo minuto

/**
 * Retorna as componentes de data e hora atuais no fuso de São Paulo
 */
function getSaoPauloDateComponents(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const map = {};
  for (const part of parts) {
    if (part.type !== "literal") {
      map[part.type] = parseInt(part.value, 10);
    }
  }

  return {
    year: map.year,
    month: map.month,
    day: map.day,
    hour: map.hour,
    minute: map.minute,
    second: map.second,
    dateString: `${map.year}-${String(map.month).padStart(2, "0")}-${String(map.day).padStart(2, "0")}`,
    timeString: `${String(map.hour).padStart(2, "0")}:${String(map.minute).padStart(2, "0")}`,
  };
}

/**
 * Retorna o status atual da grade de varredura
 */
function getScheduleStatus() {
  const spNow = getSaoPauloDateComponents();
  const currentHour = spNow.hour;
  const currentMinute = spNow.minute;
  const currentTotalMinutes = currentHour * 60 + currentMinute;

  let lastSlotHour = null;
  let nextSlotHour = null;
  let nextDateStr = spNow.dateString;
  let lastDateStr = spNow.dateString;

  // Encontra o último e o próximo horário dentro da grade [8, 12, 16, 20]
  for (const h of SCHEDULE_HOURS) {
    const slotMinutes = h * 60;
    if (currentTotalMinutes >= slotMinutes) {
      lastSlotHour = h;
    } else if (nextSlotHour === null) {
      nextSlotHour = h;
    }
  }

  // Se já passou de 20:00, o próximo é 08:00 de amanhã
  if (nextSlotHour === null) {
    nextSlotHour = SCHEDULE_HOURS[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const spTom = getSaoPauloDateComponents(tomorrow);
    nextDateStr = spTom.dateString;
  }

  // Se ainda é antes das 08:00, o último foi às 20:00 de ontem
  if (lastSlotHour === null) {
    lastSlotHour = SCHEDULE_HOURS[SCHEDULE_HOURS.length - 1];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const spYes = getSaoPauloDateComponents(yesterday);
    lastDateStr = spYes.dateString;
  }

  const formatSlot = (dStr, hour) => `${dStr} ${String(hour).padStart(2, "0")}:00:00 (BRT)`;

  return {
    schedule: ["08:00", "12:00", "16:00", "20:00"],
    timezone: TIMEZONE,
    timezoneLabel: "Horário de Brasília",
    currentTime: `${spNow.dateString} ${spNow.timeString}`,
    lastRun: {
      slot: `${String(lastSlotHour).padStart(2, "0")}:00`,
      datetime: formatSlot(lastDateStr, lastSlotHour),
      timestamp: lastRunTimestamp,
    },
    nextRun: {
      slot: `${String(nextSlotHour).padStart(2, "0")}:00`,
      datetime: formatSlot(nextDateStr, nextSlotHour),
    },
    runsPerDay: SCHEDULE_HOURS.length,
  };
}

const marketCrawler = require("./marketCrawler");

/**
 * Executa a rotina de varredura do mercado publicitário
 */
async function runMarketScrape(triggerSource = "scheduler", options = {}) {
  const now = new Date();
  const totalSources = marketSources.getAllActiveSources().length;
  lastRunTimestamp = now.toISOString();
  console.log(`[Radar de Mercado] Iniciando varredura em ${totalSources} fontes monitoradas às ${now.toLocaleTimeString("pt-BR", { timeZone: TIMEZONE })} (Gatilho: ${triggerSource})...`);

  try {
    const result = await marketCrawler.crawlAndIngest(triggerSource, options);
    console.log(`[Radar de Mercado] Varredura concluída com sucesso em ${new Date().toISOString()}. Notícias novas: ${result.insertedCount || 0}`);
    return { ok: true, timestamp: lastRunTimestamp, sourcesScanned: totalSources, ...result };
  } catch (err) {
    console.error(`[Radar de Mercado] Erro durante varredura:`, err);
    return { ok: false, error: err.message };
  }
}

/**
 * Inicia o agendador que monitora os 4 horários diários
 */
function initScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
  }

  const totalSources = marketSources.getAllActiveSources().length;
  console.log(
    `[Radar de Mercado] Agendador inicializado com ${totalSources} fontes ativas. Varreduras previstas às 08h00, 12h00, 16h00 e 20h00 (Horário de Brasília).`
  );

  // Checa a cada 30 segundos se chegou em um dos minutos 00 de 08:00, 12:00, 16:00 ou 20:00
  schedulerInterval = setInterval(() => {
    const sp = getSaoPauloDateComponents();
    if (SCHEDULE_HOURS.includes(sp.hour) && sp.minute === 0) {
      const slotKey = `${sp.dateString}-${sp.hour}`;
      if (lastTriggeredSlot !== slotKey) {
        lastTriggeredSlot = slotKey;
        runMarketScrape(`automatic_schedule_${sp.hour}h`);
      }
    }
  }, 30 * 1000);
}

module.exports = {
  SCHEDULE_HOURS,
  TIMEZONE,
  getScheduleStatus,
  runMarketScrape,
  initScheduler,
};
