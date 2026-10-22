export const STAGES = [
  "Desenvolvimento",
  "Frio",
  "Morno",
  "Quente",
  "Fechado",
  "Negado",
  "Cancelado",
];

export const PLANNING_TYPES = ["Novo", "Refação", "Customização"];
export const PLANNING_STATUSES = ["Pendente", "Desenvolvimento", "Aprovação", "Entregue", "Comercializado", "Negativado", "Cancelado"];

export const STAGE_STYLES = {
  "Desenvolvimento": "bg-slate-100 text-slate-600 border-slate-300",
  "Frio": "bg-sky-50 text-sky-700 border-sky-300",
  "Morno": "bg-amber-50 text-amber-700 border-amber-300",
  "Quente": "bg-rose-50 text-rose-700 border-rose-300",
  "Fechado": "bg-emerald-50 text-emerald-700 border-emerald-300",
  "Negado": "bg-gray-100 text-gray-500 border-gray-300",
  "Cancelado": "bg-gray-100 text-gray-500 border-gray-300",
};

export const TV_PRODUCTS = [
  "A Tarde É Sua",
  "A Tarde É Sua - 1ª Edição",
  "American Zone",
  "Amor em Risco",
  "Bola Na Rede",
  "Brasil Do Povo",
  "Dinheiro na Conta",
  "É Notícia",
  "Fica Com A Gente",
  "Leitura Dinâmica",
  "Mega Sonho",
  "Nordeste Do Povo",
  "O Grande Vencedor",
  "Operação De Risco",
  "Operação Resgate",
  "Para Aqui",
  "Programmatic TV",
  "RedeTV! News",
  "RedeTV! Notícias - 1ª Edição",
  "RedeTV! Notícias - 2ª Edição",
  "RJ Do Povo",
  "Rodada De Negócios",
  "Rotativo",
  "Sensacional",
  "Superpop",
  "TV Fama",
  "Vizinhos em Guerra",
];

export const SPECIAL_PROJECTS = [
  "Bezona",
  "Eleições 2026",
  "Eventos Proprietários",
  "Liga Monstro",
  "Liga Universitária",
  "Ravenna R10",
];

export const DIGITAL_PRODUCTS = [
  "Esportes",
  "Google Partner Sales",
  "Pegadinhas",
  "RedeTV! Noticias",
  "Social Media",
  "Soft News",
];

export const ALL_PRODUCTS = [...TV_PRODUCTS, ...DIGITAL_PRODUCTS, ...SPECIAL_PROJECTS].sort((a, b) => a.localeCompare(b, "pt-BR"));

const VALID_PRODUCTS_SET = new Set(ALL_PRODUCTS);

const PRODUCT_MIGRATION = {
  "A TARDE É SUA": "A Tarde É Sua",
  "A TARDE É SUA - 1ª EDIÇÃO": "A Tarde É Sua - 1ª Edição",
  "AMERICAN ZONE": "American Zone",
  "AMOR EM RISCO": "Amor em Risco",
  "BEZONA": "Bezona",
  "BOLA NA REDE": "Bola Na Rede",
  "BRASIL DO POVO": "Brasil Do Povo",
  "DINHEIRO NA CONTA": "Dinheiro na Conta",
  "É NOTÍCIA": "É Notícia",
  "FICA COM A GENTE": "Fica Com A Gente",
  "LEITURA DINÂMICA": "Leitura Dinâmica",
  "MEGA SONHO": "Mega Sonho",
  "NORDESTE DO POVO": "Nordeste Do Povo",
  "O GRANDE VENCEDOR": "O Grande Vencedor",
  "OPERAÇÃO DE RISCO": "Operação De Risco",
  "OPERAÇÃO RESGATE": "Operação Resgate",
  "PARA AQUI": "Para Aqui",
  "PROGRAMMATIC TV": "Programmatic TV",
  "REDETV! NEWS": "RedeTV! News",
  "REDETV! NOTÍCIAS - 1ª EDIÇÃO": "RedeTV! Notícias - 1ª Edição",
  "REDETV! NOTÍCIAS - 2ª EDIÇÃO": "RedeTV! Notícias - 2ª Edição",
  "RJ DO POVO": "RJ Do Povo",
  "RODADA DE NEGÓCIOS": "Rodada De Negócios",
  "ROTATIVO": "Rotativo",
  "SENSACIONAL": "Sensacional",
  "SUPERPOP": "Superpop",
  "TV FAMA": "TV Fama",
  "VIZINHOS EM GUERRA": "Vizinhos em Guerra",
  "ESPORTES": "Esportes",
  "GOOGLE PARTNER SALES": "Google Partner Sales",
  "PEGADINHAS": "Pegadinhas",
  "REDETV! NOTICIAS": "RedeTV! Noticias",
  "SOCIAL MEDIA": "Social Media",
  "SOFT NEWS": "Soft News",
  "DIGITAL | SOCIAL": "Social Media",
  "DIGITAL | PARTNER SALES": "Google Partner Sales",
  'Comercial 30"': null,
  'Comercial 15"': null,
  "Patrocínio": null,
  "Merchandising": null,
  "Digital + TV": null,
};

export function migrateProductName(p) {
  if (!p || typeof p !== "string") return null;
  const trimmed = p.trim();
  if (VALID_PRODUCTS_SET.has(trimmed)) return trimmed;
  if (Object.prototype.hasOwnProperty.call(PRODUCT_MIGRATION, trimmed)) {
    return PRODUCT_MIGRATION[trimmed];
  }
  return trimmed;
}

export const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export const CURRENT_YEAR = new Date().getFullYear();
const START_YEAR = 2023;
const END_YEAR = CURRENT_YEAR + 1;
export const YEARS = Array.from({ length: END_YEAR - START_YEAR + 1 }, (_, i) => START_YEAR + i);

export const DIRECT_CLIENT_ID = "direto";
export const DIRECT_CLIENT_OPTION = { id: DIRECT_CLIENT_ID, name: "Cliente Direto" };

export const SEGMENTOS = [
  "Agro e Meio-Ambiente",
  "Alimentos",
  "Apostas Esportivas",
  "Atacarejo",
  "Automotivo",
  "Bebidas",
  "Construção, Imobiliário e Decoração",
  "Educação",
  "Eletro-Eletrônicos",
  "Entretenimento",
  "Facilities",
  "Farma e Saúde",
  "Financeiro e Seguros",
  "Governo Federal",
  "Governo Local - MG",
  "Governo Local - NE",
  "Governo Local - RJ",
  "Governo Local - SP",
  "Higiene e Beleza",
  "Igrejas",
  "Petroquímica",
  "Tech e E-Commerce",
  "Telecom",
  "Turismo",
  "Vestuário e Moda",
];

export const DECISION_LEVELS = ["Presidência", "C-Level", "Diretoria", "Gerência", "Analista", "Operação"];

export const HOBBIES = ["Artes, Moda e Design", "Automobilismo", "Cinema e Séries", "Esportes", "e-Sports", "Gastronomia", "Música e Shows", "Pets", "Tecnologia", "Turismo", "Vinhos", "Outros", "Nenhum"];

export const SPORTS = ["Artes Marciais", "Atletismo", "Automobilismo", "Basquete", "Corrida", "Futebol", "Golfe", "Natação", "Tênis", "Vôlei", "Outros", "Nenhum"];

export function formatBRL(v) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(v || 0);
}

export function formatMillionsBRL(v) {
  const millions = (v || 0) / 1000000;
  return millions.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatThousandsBR(digits) {
  if (!digits) return "";
  return Number(digits).toLocaleString("pt-BR");
}

export function formatDate(d) {
  if (!d) return "—";
  const dateStr = d.includes("T") ? d.split("T")[0] : d;
  const parts = dateStr.split("-");
  if (parts.length !== 3) return d;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function formatCNPJ(digits) {
  if (!digits) return "";
  const d = digits.slice(0, 14);
  let out = d.slice(0, 2);
  if (d.length > 2) out += "." + d.slice(2, 5);
  if (d.length > 5) out += "." + d.slice(5, 8);
  if (d.length > 8) out += "/" + d.slice(8, 12);
  if (d.length > 12) out += "-" + d.slice(12, 14);
  return out;
}

export function formatCelular(digits) {
  if (!digits) return "";
  const d = digits.slice(0, 11);
  let out = "(" + d.slice(0, 2);
  if (d.length > 2) out += ") " + d.slice(2, 7);
  if (d.length > 7) out += "-" + d.slice(7, 11);
  return out;
}

export function formatPeriod(periodMonths) {
  if (!periodMonths || periodMonths.length === 0) return "Período a definir";
  const sorted = [...periodMonths].sort((a, b) => {
    const [ya, ma] = a.split("-");
    const [yb, mb] = b.split("-");
    if (ya !== yb) return Number(ya) - Number(yb);
    return MONTHS.indexOf(ma) - MONTHS.indexOf(mb);
  });
  return sorted.map((p) => { const [y, m] = p.split("-"); return `${m}/${y}`; }).join(", ");
}

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function toInputDate(d) {
  if (!d) return "";
  if (typeof d === "string") return d.split("T")[0];
  if (d instanceof Date) return d.toISOString().split("T")[0];
  return "";
}

export function toggleArrayValue(arr, val) {
  return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];
}

export function toggleMultiWithNone(arr, val) {
  if (val === "Nenhum") {
    return arr.includes("Nenhum") ? [] : ["Nenhum"];
  }
  return toggleArrayValue(arr.filter((v) => v !== "Nenhum"), val);
}

const VALID_SEGMENTOS_SET = new Set(SEGMENTOS);
const LOWERCASE_CONNECTORS = new Set(["e", "de", "da", "do", "das", "dos", "em"]);

const SEGMENT_ALIASES = {
  "governo mg": "governo local - mg",
  "governo rj": "governo local - rj",
  "governo ne": "governo local - ne",
  "governo sp": "governo local - sp",
  "governo local mg": "governo local - mg",
  "governo local rj": "governo local - rj",
  "governo local ne": "governo local - ne",
  "governo local sp": "governo local - sp",
  "igreja": "igrejas",
  "igrejas": "igrejas",
};

export function normalizeSegmentName(s) {
  const norm = (s || "").trim().toLowerCase();
  return SEGMENT_ALIASES[norm] || norm;
}

export function segMatches(filterList, value) {
  if (!filterList || filterList.length === 0) return true;
  const v = normalizeSegmentName(value);
  return filterList.some((f) => {
    const fn = normalizeSegmentName(f);
    if (fn === v) return true;
    if (fn === "governo" && v.startsWith("governo")) return true;
    return false;
  });
}

export function titleCasePt(str) {
  if (!str) return str;
  return str
    .split(" ")
    .map((word, i) => {
      if (/^[A-ZÀ-Ú]{2,3}$/.test(word)) return word;
      const lower = word.toLowerCase();
      if (i > 0 && LOWERCASE_CONNECTORS.has(lower)) return lower;
      return lower
        .split("-")
        .map((seg) => (seg ? seg.charAt(0).toUpperCase() + seg.slice(1) : seg))
        .join("-");
    })
    .join(" ");
}

export function normalizeAdvertiser(a) {
  const contacts = Array.isArray(a.contacts)
    ? a.contacts
    : a.contactName
    ? [{ id: uid(), name: a.contactName, role: a.contactRole || "", channel: a.contactChannel || "" }]
    : [];
  const nomeFantasia = a.nomeFantasia || a.name || "";
  const rawSegmento = a.segmento || a.sector || "";
  return {
    ...a,
    contacts,
    interactions: Array.isArray(a.interactions) ? a.interactions : [],
    codigo: a.codigo || "",
    razaoSocial: a.razaoSocial || a.name || "",
    cnpj: a.cnpj || "",
    nomeFantasia,
    name: nomeFantasia,
    segmento: VALID_SEGMENTOS_SET.has(rawSegmento) ? rawSegmento : titleCasePt(rawSegmento),
    atendeAnunciantes: Array.isArray(a.atendeAnunciantes) ? a.atendeAnunciantes : [],
  };
}

export function normalizeContact(c) {
  return {
    ...c,
    clientId: c.clientId || c.advertiserId || null,
    cargo: c.cargo || c.role || "",
    departamento: c.departamento || "",
    nivelDecisao: c.nivelDecisao || "",
    celular: c.celular || "",
    email: c.email || "",
    esportes: Array.isArray(c.esportes) ? c.esportes : [],
    hobbies: Array.isArray(c.hobbies) ? c.hobbies : [],
    esportesOutro: c.esportesOutro || "",
    hobbiesOutro: c.hobbiesOutro || "",
    timeCoracao: c.timeCoracao || "",
    filhos: c.filhos === undefined || c.filhos === null || c.filhos === "" ? "" : c.filhos,
  };
}

export function deriveContactsFromAdvertisers(advertiserList) {
  const list = [];
  advertiserList.forEach((a) => {
    (a.contacts || []).forEach((c) => {
      list.push(
        normalizeContact({
          ...c,
          clientId: a.id,
        })
      );
    });
  });
  return list;
}

const STAGE_MIGRATION = {
  "Prospecção": "Desenvolvimento",
  "Qualificação": "Frio",
  "Proposta enviada": "Morno",
  "Negociação": "Quente",
  "Fechado - ganho": "Fechado",
  "Fechado - perdido": "Negado",
};

export function deriveMonthCodeFromDate(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split("-");
  if (parts.length < 2) return null;
  const year = parts[0];
  const monthIndex = parseInt(parts[1], 10) - 1;
  if (!year || monthIndex < 0 || monthIndex > 11) return null;
  return `${year}-${MONTHS[monthIndex]}`;
}

export function pseudoRandomPeriodFromId(id) {
  let hash = 0;
  for (let i = 0; i < String(id).length; i++) {
    hash = (hash * 31 + String(id).charCodeAt(i)) >>> 0;
  }
  const month = MONTHS[hash % 12];
  const year = CURRENT_YEAR + (Math.floor(hash / 12) % 2);
  return `${year}-${month}`;
}

export function normalizeOpportunity(o) {
  const rawMonths = Array.isArray(o.periodMonths) ? o.periodMonths : [];
  let periodMonths = rawMonths;
  if (rawMonths.length === 0) {
    const fromClose = deriveMonthCodeFromDate(o.expectedCloseDate);
    const fromDelivery = deriveMonthCodeFromDate(o.deliveryDate);
    const fromCreated = deriveMonthCodeFromDate(o.createdAt);
    const fallback = fromClose || fromDelivery || fromCreated || pseudoRandomPeriodFromId(o.id);
    periodMonths = [fallback];
  }
  const rawStage = o.stage || o.status || "Desenvolvimento";
  const stage = STAGE_MIGRATION[rawStage] || rawStage;
  return {
    ...o,
    agencyId: o.agencyId || DIRECT_CLIENT_ID,
    advertiserId: o.advertiserId || "",
    contactId: o.contactId || "",
    products: Array.isArray(o.products) ? o.products.map(migrateProductName).filter(Boolean) : [],
    value: o.value === undefined || o.value === null ? 0 : Number(o.value),
    stage: STAGES.includes(stage) ? stage : "Desenvolvimento",
    periodMonths,
    briefing: o.briefing || "",
    createdAt: toInputDate(o.createdAt) || todayStr(),
    deliveryDate: toInputDate(o.deliveryDate),
    expectedCloseDate: toInputDate(o.expectedCloseDate),
    executivo: o.executivo || "",
    responsavel: o.responsavel || "",
    tipo: o.tipo || "Novo",
    versao: o.versao || 1,
    status: o.status || null,
    observacao: o.observacao || "",
    planDeliveryDate: toInputDate(o.planDeliveryDate),
    productValues: o.productValues || {},
  };
}

export function riskStyle(risco) {
  const r = (risco || "").toLowerCase();
  if (r.includes("alto")) return "bg-rose-50 text-rose-700 border-rose-200";
  if (r.includes("médio") || r.includes("medio"))
    return "bg-amber-50 text-amber-700 border-amber-200";
  if (r.includes("baixo")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  return "bg-slate-100 text-slate-500 border-slate-200";
}

export function emptyOppForm() {
  return {
    title: "",
    executivo: "",
    agencyId: "",
    advertiserId: "",
    contactId: "",
    products: [],
    value: "",
    periodMonths: [],
    briefing: "",
    createdAt: todayStr(),
    deliveryDate: "",
    expectedCloseDate: "",
    productValues: {},
    solicitarPlanejamento: false,
    attachments: [],
    temperatura: "Morno",
  };
}

export const PROPOSAL_TEMPLATES = [];

export function buildProposalEmailBody(template, contactName) {
  const lines = [];
  lines.push("Olá" + (contactName ? ", " + contactName.split(" ")[0] : "") + "!");
  lines.push("");
  lines.push("Segue em anexo a proposta comercial de " + template.title + " da RedeTV!.");
  lines.push("");
  lines.push("Fico à disposição para detalhar qualquer ponto e agendar uma conversa.");
  lines.push("");
  lines.push("Abraço,");
  return lines.join("\n");
}

export const PERMISSIONS = {
  admin: [
    "can_view_dashboard",
    "can_view_pipeline",
    "can_view_planning",
    "can_edit_planning",
    "can_view_clients",
    "can_edit_clients",
    "can_view_executivos",
    "can_manage_users",
    "can_access_media_planner",
    "can_view_audit_logs",
    "can_manage_executivos_links",
    "can_assign_carteira",
    "can_send_proposals",
    "can_schedule_meetings",
    "can_view_contacts",
    "can_edit_contacts",
    "can_record_audio",
    "can_create_opportunities",
    "can_edit_opportunities",
    "can_delete_opportunities",
    "can_manage_proposal_templates",
    "can_view_engajamento"
  ],
  diretor: [
    "can_view_dashboard",
    "can_view_pipeline",
    "can_view_planning",
    "can_edit_planning",
    "can_view_clients",
    "can_edit_clients",
    "can_view_executivos",
    "can_manage_executivos_links",
    "can_send_proposals",
    "can_schedule_meetings",
    "can_view_contacts",
    "can_edit_contacts",
    "can_record_audio",
    "can_create_opportunities",
    "can_edit_opportunities",
    "can_manage_proposal_templates",
    "can_view_engajamento"
  ],
  especialista: [
    "can_view_pipeline",
    "can_view_planning",
    "can_edit_planning",
    "can_view_clients",
    "can_view_executivos",
    "can_view_contacts",
    "can_edit_contacts",
    "can_record_audio",
    "can_edit_opportunities",
    "can_manage_proposal_templates"
  ],
  executivo: [
    "can_view_dashboard",
    "can_view_pipeline",
    "can_view_clients",
    "can_edit_clients",
    "can_send_proposals",
    "can_schedule_meetings",
    "can_view_contacts",
    "can_edit_contacts",
    "can_record_audio",
    "can_create_opportunities",
    "can_edit_opportunities",
    "can_manage_proposal_templates"
  ]
};

export function hasPermission(userPerfil, permission) {
  if (!userPerfil || !PERMISSIONS[userPerfil]) return false;
  return PERMISSIONS[userPerfil].includes(permission);
}

export function getClientInactivityStatus(client) {
  if (!client) return null;
  const interactions = Array.isArray(client.interactions) ? client.interactions : [];
  
  let lastDate;
  if (interactions.length > 0) {
    const dates = interactions
      .map(i => i.date ? new Date(i.date).getTime() : null)
      .filter(Boolean);
    if (dates.length > 0) {
      lastDate = new Date(Math.max(...dates));
    }
  }
  
  if (!lastDate && client.createdAt) {
    lastDate = new Date(client.createdAt);
  }
  
  if (!lastDate) return null;
  
  const today = new Date();
  // Diferença em milissegundos, ignorando a parte das horas para contar dias corridos limpos
  const d1 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const d2 = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
  const diffTime = d1 - d2;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays >= 30) {
    return { level: 30, icon: "💣", label: `${diffDays} dias sem interação`, badgeClass: "bg-slate-400 text-white border-slate-500 font-bold shadow-sm animate-pulse" };
  } else if (diffDays >= 20) {
    return { level: 20, icon: "🔴", label: `${diffDays} dias sem interação`, badgeClass: "bg-red-600 text-white border-red-750 font-semibold shadow-sm" };
  } else if (diffDays >= 10) {
    return { level: 10, icon: "🟡", label: `${diffDays} dias sem interação`, badgeClass: "bg-yellow-400 text-slate-900 border-yellow-500 font-semibold shadow-sm" };
  }
  
  return null;
}

export function getAgencyInactivityStatus(agency, servedAdvertisers) {
  if (!agency || agency.type !== "Agência") return null;
  
  let highestStatus = null;
  
  (servedAdvertisers || []).forEach(client => {
    const status = getClientInactivityStatus(client);
    if (status) {
      if (!highestStatus || status.level > highestStatus.level) {
        highestStatus = {
          ...status,
          clientName: client.nomeFantasia || client.razaoSocial
        };
      }
    }
  });
  
  if (highestStatus) {
    return {
      level: highestStatus.level,
      icon: highestStatus.icon,
      label: `Possui cliente inativo: ${highestStatus.clientName} (${highestStatus.label})`,
      badgeClass: highestStatus.badgeClass
    };
  }
  
  return null;
}


