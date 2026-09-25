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
  "Bola Na Rede",
  "Brasil Do Povo",
  "É Notícia",
  "Fica Com A Gente",
  "Leitura Dinâmica",
  "Mega Sonho",
  "Nordeste Do Povo",
  "Operação De Risco",
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
];

export const SPECIAL_PROJECTS = ["Bezona", "Eleições 2026", "Liga Monstro", "Liga Universitária"];

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
  "BEZONA": "Bezona",
  "BOLA NA REDE": "Bola Na Rede",
  "BRASIL DO POVO": "Brasil Do Povo",
  "É NOTÍCIA": "É Notícia",
  "FICA COM A GENTE": "Fica Com A Gente",
  "LEITURA DINÂMICA": "Leitura Dinâmica",
  "MEGA SONHO": "Mega Sonho",
  "NORDESTE DO POVO": "Nordeste Do Povo",
  "OPERAÇÃO DE RISCO": "Operação De Risco",
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
  if (VALID_PRODUCTS_SET.has(p)) return p;
  if (Object.prototype.hasOwnProperty.call(PRODUCT_MIGRATION, p)) return PRODUCT_MIGRATION[p];
  return null;
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
    createdAt: o.createdAt || todayStr(),
    deliveryDate: o.deliveryDate || "",
    expectedCloseDate: o.expectedCloseDate || "",
    executivo: o.executivo || "",
    responsavel: o.responsavel || "",
    tipo: o.tipo || "Novo",
    versao: o.versao || 1,
    status: o.status || "Pendente",
    observacao: o.observacao || "",
    planDeliveryDate: o.planDeliveryDate || "",
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

export const PROPOSAL_TEMPLATES = [
  {
    id: "tpl-superpop",
    product: "Superpop",
    title: "Patrocínio SuperPop",
    subtitle: "Cota nacional + cota de patrocínio local, com a Cariúcha",
    horario: "Quarta-feira, 22h45",
    periodo: "12 meses",
    pdfFileName: "proposta-superpop.pdf",
    pdfDataUri: "data:application/pdf;base64,JVBERi0xLjQKJZOMi54gUmVwb3J0TGFiIEdlbmVyYXRlZCBQREYgZG9jdW1lbnQgKG9wZW5zb3VyY2UpCjEgMCBvYmoKPDwKL0YxIDIgMCBSIC9GMiAzIDAgUgo+PgplbmRvYmoKMiAwIG9iago8PAovQmFzZUZvbnQgL0hlbHZldGljYSAvRW5jb2RpbmcgL1dpbkFuc2lFbmNvZGluZyAvTmFtZSAvRjEgL1N1YnR5cGUgL1R5cGUxIC9UeXBlIC9Gb250Cj4+CmVuZG9iagozIDAgb2JqCjw8Ci9CYXNlRm9udCAvSGVsdmV0aWNhLUJvbGQgL0VuY29kaW5nIC9XaW5BbnNpRW5jb2RpbmcgL05hbWUgL0YyIC9TdWJ0eXBlIC9UeXBlMSAvVHlwZSAvRm9udAo+PgplbmRvYmoKNCAwIG9iago8PAovQ29udGVudHMgOSAwIFIgL01lZGlhQm94IFsgMCAwIDU5NS4yNzU2IDg0MS44ODk4IF0gL1BhcmVudCA4IDAgUiAvUmVzb3VyY2VzIDw8Ci9Gb250IDEgMCBSIC9Qcm9jU2V0IFsgL1BERiAvVGV4dCAvSW1hZ2VCIC9JbWFnZUMgL0ltYWdlSSBdCj4+IC9Sb3RhdGUgMCAvVHJhbnMgPDwKCj4+IAogIC9UeXBlIC9QYWdlCj4+CmVuZG9iago1IDAgb2JqCjw8Ci9Db250ZW50cyAxMCAwIFIgL01lZGlhQm94IFsgMCAwIDU5NS4yNzU2IDg0MS44ODk4IF0gL1BhcmVudCA4IDAgUiAvUmVzb3VyY2VzIDw8Ci9Gb250IDEgMCBSIC9Qcm9jU2V0IFsgL1BERiAvVGV4dCAvSW1hZ2VCIC9JbWFnZUMgL0ltYWdlSSBdCj4+IC9Sb3RhdGUgMCAvVHJhbnMgPDwKCj4+IAogIC9UeXBlIC9QYWdlCj4+CmVuZG9iago2IDAgb2JqCjw8Ci9QYWdlTW9kZSAvVXNlTm9uZSAvUGFnZXMgOCAwIFIgL1R5cGUgL0NhdGFsb2cKPj4KZW5kb2JqCjcgMCBvYmoKPDwKL0F1dGhvciAoXChhbm9ueW1vdXNcKSkgL0NyZWF0aW9uRGF0ZSAoRDoyMDI2MDcwMTIxNTY0MiswMCcwMCcpIC9DcmVhdG9yIChcKHVuc3BlY2lmaWVkXCkpIC9LZXl3b3JkcyAoKSAvTW9kRGF0ZSAoRDoyMDI2MDcwMTIxNTY0MaswMCcwMCcpIC9Qcm9kdWNlciAoUmVwb3J0TGFiIFBERiBMaWJyYXJ5IC0gXChvcGVuc291cmNlXCkpIAogIC9TdWJqZWN0IChcKHVuc3BlY2lmaWVkXCkpIC9UaXRsZSAoXChhbm9ueW1vdXNcKSkgL1RyYXBwZWQgL0ZhbHNlCj4+CmVuZG9iago4IDAgb2JqCjw8Ci9Db3VudCAyIC9LaWRzIFsgNCAwIFIgNSAwIFIgXSAvVHlwZSAvUGFnZXMKPj4KZW5kb2JqCjkgMCBvYmoKPDwKL0ZpbHRlciBbIC9BU0NJSTg1RGVjb2RlIC9GbGF0ZURlY29kZSBdIC9MZW5ndGggMjA4MAo+PgpzdHJlYW0KR2F0bTw9YGA9VSY6WEFXZlFQc2QtKl8uY2kwaCdtOCZmRDBFR1FwV1NeQGZqXyhub086ZEUxSkZTYiUwISJZMk1XTjM+RVtfUTI4S2w3S2BKO1lMWXMzPU1tcEw/MXQtOXJ1PCsrU1RyI05KJixDNCxVTktOK0lqaHVrY28kJiRmTlUqdSVAKy1JWXJPITxrP2oyTl4uIilwZmhLbC1tOkVLWmA8YCE3cT5qYj5SdGRLMUlyVD1Ab08xPV83ZlgtZ1V0OSowbyE8UUljTlpdUiRJX0A2Sj8yKzlaT15dIUAiTjoqaSRZSnNxISFkRm4vRF9TM2pyUyhIVWdoTzVySCw4SCtWKmBLUjpGcClUZz1ZbTQ1OTJoNVlJKChVZFBdKiUiclU+bihoYTg5TitvJWs/PikzYzBdMTNQSyk9KHJrWmJJTVVrU1YrQkhhZSRePUA3dGQiZFMrVXJtb2BEZFsyLkVyaklFcC1kL01FZi5kTGNzczY/S1M9T0FhPls2aF1VbWJbLD4tSzw7anU/Zz8/Jzk/Wk5oWDI1NlhZJDRoajE5I249YHVwZCxxQ2U2S1tFI0c2bFlqRilEYzRyIkJaLWIwZGsrbDdmUydzIjw3a0w/QC0kZSU9KUYhNzI2Qz5HT0tEKGU2Zm0wTiNRLiw9W0tYM0BnSypvM2tHX0hhb1RYK2ZeI0UubGlzOF51PGRfb1E8aioral05bkhdRidzIThRYmEwLExVUyQrL19YVGAoWzdRR2onJCgsXzdgSV5KIkFUIVNxSUdnTyE/UVdpYzlOXSo7YDclPiglT1RDOyckTk5rJyhJZWUqbUhCIytAZV5JYjZyMV5WKyI6blJlJHEqNkBOKmIzTFwsPVRsVzZXLiliTmI1RUxMSFBfU1phXS5jJkdJKyhMLydfI1NOJyptQUcyKnJFOXBgLTgqW2gzb25sZUZkJms7ZyFrLnMqQ0I6SkgoKCVtM0A0YmYsZV9MbyVaM1UvOlpiRUNjIThGOygzJGcxVFghPCpUNj9SaCRwS2kka3JcMEo6dDMnXzg1RiFcSmAlR3FLY3IhPURMPlEsXFBIQXJAQzJMcFUtPGspK1BjWkdPVVVFMFFiOG02TihkTk9jQTklIjptMiMiP2BrPCxCakpZTj9adGhrJm09Mk0+b2RcdTcsRj0hRmFNXWpdRSJLdTNDcTk5UmhBWEs0PT42OmJcWUxrLCViPzRlLTUsST45MURPJkFUX0deSycwKTxeVkE+X0JrOy9hYGkudVY7cTdHKyJoPW0qQjkhSDxFQ2dDKGgoLEY/QlZESW5yRzN1T2VxZzxdOHRDaC08LXEoPjlZaWtYbWIsTTxHcl11ZDFTOXQ4aWJxbWQ5SlMsKi9kJW09ZyRxJDI4ajZFQihmKmtJQnBcYV5pa1lJWFJeUW89LlRIMzlCSzFCaiRgVXVOWjgsZmQ4aFJzUW4zOGU0KlcjdUI5amR0MldwTXBOXTJiIlFGIkxQIl9rWDNJTzg4IlMlLU0xKlw1WU0zUj80L1JbWGdAPmE2bDRZc0FSLzJhV1sxImZaKW5gXFQ6c3BRYG1bTktdYUcqRStOb1cwc147biRuUTRYcE9fL0M5OEglaGVQbG5kZmByO0NlaltLSkdaMGtXMW0+YSU3WEBfZ2ZUJz9wS2tsYDxiMi4+NGApbU9iLihdX2c+ZW88Z1JTYEYpSEwjZTI+aixjRDQnbHRbQl01IjtTPClLTjBfYUZjOikoUFcvT0d1Zi5hYTxoMEFQPktxOGtdYCYoOSNKblEvSHBNOUY2cTlmOGN1VSFGP2I0dUdDS0YnSGpdVkIzNEh1PidgWypYO19vODwnO2Y/LTl0QlYsNC1XW2ktViVyRj0vSTsoND5JZCtSa2A4KHFnJmdEXUdlL1RcVk1wWG1ySydJPXIzPHVJKCptUzIwKSYxN1xUXzFaKj4xPUE4Vks0a1Jfa11hLmlwUiF1LCJfS2UtUHBhRjNvQ2YvTVtXPm1ncThtb1BvPyQ4WjJKKz8iNjNTRSFdTms+bVM6YnJsR2k7ISlwbSstSCc2WmFuOyJSYFplVmE7WTY0PTJrPE1WcyxWLSpnTGZaNyJOJCg9VS9vVUtLbiIlXVVGXzxXPmpMWWAqQVtWazZLUGpKTVNWLzFbVl1DW2YmJGVESyk5MjdjJkZybkg2UTItbzJqJjBnImJcRD9fTC8sQTAhOmlaTm9iPzc5WThmZTZpbmVuW0dfO2wwS2krJWVVPSVeIzFIMEBQJlVSY1gsSkRbRmA/cjBqbjAxKkEhJmcoW2RsMipTME5BOD9TK1cmRzJlRVRYUiVRLDBYZFoiI0E4PXNaMThhMDlmRF50NiFpcThtSixNTm10TChXREtFQ1NMUjktNW1YUWw9OEwmb2NpOT9cUSxiayNEdUVkalw4REo8MnQmX01iUVZ1LipxVmZnJUxZYkxGT3J0TGxYNVM1azo4Yz84L2pRbik2TWRHPFpkIlpVRVEoOj9CSC9JOGYrLEpwPHNGTnE2XUc6cSVGaGBjRSFRcjtuJC8nSmlwbjVPMz11I1E/LEswSj0ta1I1WXQ3I19KaCxIdWxLbDZAUDxVL0ovTHFOMltmYSpWIVhYP3UqUSVEXiQ/QShcaipbZWo6OmhyWFI/aGopbDhyKEd1P2ZdZ11gZVZVIVRxQT1kIltkRz5yMDc3QTlhNC1bJi1baSNWV004USlHVk1qQ2xhQ1VRPUM3Mz8tZFluNiNEMydoQmNkIShzcldCLGpcYkh+PmVuZHN0cmVhbQplbmRvYmoKMTAgMCBvYmoKPDwKL0ZpbHRlciBbIC9BU0NJSTg1RGVjb2RlIC9GbGF0ZURlY29kZSBdIC9MZW5ndGggMTMwNwo+PgpzdHJlYW0KR2F1MS87MDFKTSUiUjc2LnJgMGJcRiUucidNNC4uPkJmPj9oS0RPalk+OUZQQTB0L0wmajhqLUdRJTE6al1JZl0tVzUlbUZFJ14iIXE2ZEUlPjRjJE1tXTBrIVV0T0FtbGlGNSoqLCM2IjsubTciM3N1K0locUMiVlcoIVhYci9MVE9YLzxcXjUkMTdqJFo5RDhDW1Y9JldGXCRLImtUYTo9YmdGNylHcztOVGI9I1g5OUtjbzxTKWBmImY6Tjg2cChdIV8qP0BhaVpcTFJnT1R0Q08+QmwpSzReZkdSS1xQMDxWTkNidE0vKDZzbWRcRWIjJkosYyteLD1QTFZmZlpJNXJZSzpRXkk+LTRAITpnSCIiLHA0UjBOLG89KGIxYCYkUXJESVZBMFo+NnFnVTIuSWZSKCJHbC0xclhAdDgkVEUhI0J0M2tYIj9lWXVCSFxmZyteLmBKMGAybGJsR0hoIk5HPCdvY2Q5bTgxOU9iImpWbFVsTy0wdTBsX0BRLE1XOkolIjIzXEJlQ1lzMCsyKWgqRTZySD5uamlNSmk7NzhVLU4uIVUpJzgyOUhfPWVtaVFZQEpAZTQrV0BNMDxJOyJHW28vKTJlJ1tyV1ZDVF5CQDwwX1FKJ2tHLmomYmFGJS1qXyJeVSoqZWpYRzgicS5nKU1YRGlzQ1BUZ19VWipDS09wQiEwU2BKJlpPPTtLPHNPLDdoLWlUWUp0ZWQzO21GPipeMVo/QmVxdSlKJC48NklTTTBaRjMuZSkrLF5nJV5VTGIraGppJCw0JDlicW5CXEkmX1UiJHMxc280Nko3JGAnYDtfSk1LQ2MqJGxSQlpCQmxYSiQ4V21jP0tAYShkUi5cZjIxUUovTUZUVjFDa0EoO2VrUC4yJy0xRV4tTmotUGonKWEidEhBWSlZZFxiXkInXkQrO2BpKCtPaXIzQEY3TkosXFhTXVZDTiZTXy8wPUA1MTddO1NJI1xvdSwvUGdLKkA/bnJsRVUmdFM3XTpUIU9ubzUhKmhEOnFxZ2IwampTJkooQCpjMj1KaDs3OWZMcGdFTUJoTGE7anNSJTgsY2tVMS85J1c5S0M2WmlwWUomKDo4dD4nISM8Pkk7LFgrZ0QxMk1JcEhIV29yW09iTUY3JVVMLGpYITdDNF9ASz8oPlhZckNiTjdBOT47TW83bmFCUSpfayo6PzdoWDZHSlhZUzFJMmRNTGxIJzhaYGMoajcpZUUkR2VjLCFHRV4rLlMsbDUvW1tCYDR1SjtvTypIVXBCJHBTXT5PdD1GRydOQUk8cHVFPnRaYydSYUcjV1JAQ1M6YDdpRmApbilHVUM2Jmhxay5eWWlAJUM6Oj0sJiZJQ1UlXy8lRmpPb2pwKF47QFp0O3M5c0NaTlghWSMlPDQyaSlZPihLSWdVOHRWTUE7XF1TbzFEOShzckJFTSRZcmVAWEhDXlNLV29gYWwiZD1RMHI7SztcJi8vXWs4PVhXcGRhQUtiIi1eR2VESTM5Xl1RcSs+bkd1akIyLlZANVsjdDw0OTlPZ1sqTCM1bigxLTsvKjJISGNJUyVcREJxW1wnKURSRFZddCpbSmVSOFxHZ0kxUl1aOEFmJksrJWNGN2R1NDJDK0NlYz83MGhZR20iLCpVa2xBQG1fSz1tZDM1WEEmNV9FX25nTCMkNTVNSnV0JE0rci43P08qQFZUUkUsKD1YY3BhLktWbHNrWyxpQiEqI0FQVCQsWlVnfj5lbmRzdHJlYW0KZW5kb2JqCnhyZWYKMCAxMQowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwNjEgMDAwMDAgbiAKMDAwMDAwMDEwMiAwMDAwMCBuIAowMDAwMDAwMjA5IDAwMDAwIG4gCjAwMDAwMDAzMjEgMDAwMDAgbiAKMDAwMDAwMDUyNCAwMDAwMCBuIAowMDAwMDAwNzI4IDAwMDAwIG4gCjAwMDAwMDA3OTYgMDAwMDAgbiAKMDAwMDAwMTA3NiAwMDAwMCBuIAowMDAwMDAxMTQxIDAwMDAwIG4gCjAwMDAwMDMzMTIgMDAwMDAgbiAKdHJhaWxlcgo8PAovSUQgCls8YTJkNGE4OWFhMjlhYzM0NWU2MDBmOWE0NWMwN2Q2ZTI+PGEyZDRhODlhYTI5YWMzNDVlNjAwZjlhNDVjMDdkNmUyPl0KJSBSZXBvcnRMYWIgZ2VuZXJhdGVkIFBERiBkb2N1bWVudCAtLSBkaWdlc3QgKG9wZW5zb3VyY2UpCgovSW5mbyA3IDAgUgovUm9vdCA2IDAgUgovU2l6ZSAxMQo+PgpzdGFydHhyZWYKNDcxMQolJUVPRgo=",
    xlsFileName: "tabela-valores-superpop.xlsx",
    xlsDataUri: "data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,UEsDBBQAAAAIAI2ptFYAAAAAAAAAAAAAAAATAAAAW0NvbnRlbnRfVHlwZXNdLnhtbFBLAQIUABQAAAAIAI2ptFYAAAAAAAAAAAAAAAATAAAAAAAAAAAAAAAAAAAAAABbQ29udGVudF9UeXBlc10ueG1sUEsFBgAAAAABAAEATgAAAEQAAAAAAA==",
  },
];

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
    "can_delete_opportunities"
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
    "can_edit_opportunities"
  ],
  especialista: [
    "can_view_pipeline",
    "can_view_planning",
    "can_edit_planning",
    "can_view_clients",
    "can_view_executivos",
    "can_view_contacts",
    "can_edit_contacts"
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
    "can_edit_opportunities"
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


