import React, { useState, useEffect } from "react";
import {
  BarChart,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  LabelList,
} from "recharts";
import {
  LayoutDashboard,
  GitBranch,
  Building2,
  FileText,
  Plus,
  X,
  Sparkles,
  Loader2,
  Users,
  Filter,
  Maximize2,
  ClipboardList,
  DollarSign,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Trash2,
} from "lucide-react";

const STAGES = [
  "Desenvolvimento",
  "Frio",
  "Morno",
  "Quente",
  "Fechado",
  "Negado",
];

const PLANNING_TYPES = ["Novo", "Refação", "Customização"];
const PLANNING_STATUSES = ["Pendente", "Desenvolvimento", "Aprovação", "Entregue", "Comercializado", "Negativado", "Cancelado"];

const STAGE_STYLES = {
  "Desenvolvimento": "bg-slate-100 text-slate-600 border-slate-300",
  "Frio": "bg-sky-50 text-sky-700 border-sky-300",
  "Morno": "bg-amber-50 text-amber-700 border-amber-300",
  "Quente": "bg-rose-50 text-rose-700 border-rose-300",
  "Fechado": "bg-emerald-50 text-emerald-700 border-emerald-300",
  "Negado": "bg-gray-100 text-gray-500 border-gray-300",
};

const TV_PRODUCTS = [
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

const SPECIAL_PROJECTS = ["Bezona", "Eleições 2026", "Liga Monstro", "Liga Universitária"];

const DIGITAL_PRODUCTS = [
  "Esportes",
  "Google Partner Sales",
  "Pegadinhas",
  "RedeTV! Noticias",
  "Social Media",
  "Soft News",
];

// Unified list for the Pipeline's "Produtos" filter, which doesn't need
// the Televisão/Digital split used in the opportunity form.
const ALL_PRODUCTS = [...TV_PRODUCTS, ...DIGITAL_PRODUCTS, ...SPECIAL_PROJECTS].sort((a, b) => a.localeCompare(b, "pt-BR"));

const VALID_PRODUCTS_SET = new Set(ALL_PRODUCTS);

// Maps every historical product-name spelling used in earlier versions of
// this CRM onto the current product list, so opportunities saved under an
// older scheme still show a valid, matching product instead of a ghost
// value that no longer exists in TV_PRODUCTS / DIGITAL_PRODUCTS.
const PRODUCT_MIGRATION = {
  // ALL CAPS → Title Case (the naming scheme used right before this one)
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
  // Even earlier digital-only names, from before Digital had its own list
  "DIGITAL | SOCIAL": "Social Media",
  "DIGITAL | PARTNER SALES": "Google Partner Sales",
  // The very first, generic format list (no equivalent program today —
  // dropped rather than guessed, since there's no faithful 1:1 mapping)
  'Comercial 30"': null,
  'Comercial 15"': null,
  "Patrocínio": null,
  "Merchandising": null,
  "Digital + TV": null,
};

function migrateProductName(p) {
  if (VALID_PRODUCTS_SET.has(p)) return p;
  if (Object.prototype.hasOwnProperty.call(PRODUCT_MIGRATION, p)) return PRODUCT_MIGRATION[p];
  return null;
}

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [2026, 2027];

const DIRECT_CLIENT_ID = "direto";
const DIRECT_CLIENT_OPTION = { id: DIRECT_CLIENT_ID, name: "Cliente Direto" };

const SEGMENTOS = [
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
  "Petroquímica",
  "Tech e E-Commerce",
  "Telecom",
  "Turismo",
  "Vestuário e Moda",
];

const DECISION_LEVELS = ["Presidência", "C-Level", "Diretoria", "Gerência", "Analista", "Operação"];

const HOBBIES = ["Artes, Moda e Design", "Automobilismo", "Cinema e Séries", "Esportes", "e-Sports", "Gastronomia", "Música e Shows", "Pets", "Tecnologia", "Turismo", "Vinhos", "Outros", "Nenhum"];

const SPORTS = ["Artes Marciais", "Atletismo", "Automobilismo", "Basquete", "Corrida", "Futebol", "Golfe", "Natação", "Tênis", "Vôlei", "Outros", "Nenhum"];

const STORAGE_KEY = "crm-redetv-data";

function formatBRL(v) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(v || 0);
}

// Formats a raw digit string as a Brazilian thousands-separated number
// (dot between thousands, no decimals) for the investment input field.
function formatThousandsBR(digits) {
  if (!digits) return "";
  return Number(digits).toLocaleString("pt-BR");
}

function formatDate(d) {
  if (!d) return "—";
  const parts = d.split("-");
  if (parts.length !== 3) return d;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function formatCNPJ(digits) {
  if (!digits) return "";
  const d = digits.slice(0, 14);
  let out = d.slice(0, 2);
  if (d.length > 2) out += "." + d.slice(2, 5);
  if (d.length > 5) out += "." + d.slice(5, 8);
  if (d.length > 8) out += "/" + d.slice(8, 12);
  if (d.length > 12) out += "-" + d.slice(12, 14);
  return out;
}

function formatCelular(digits) {
  if (!digits) return "";
  const d = digits.slice(0, 11);
  let out = "(" + d.slice(0, 2);
  if (d.length > 2) out += ") " + d.slice(2, 7);
  if (d.length > 7) out += "-" + d.slice(7, 11);
  return out;
}

// periodMonths entries are "YYYY-Mon" codes (e.g. "2026-Out"), so each
// month carries its own year — this is what lets a period span a year
// boundary (Out/Nov/Dez 2026 + Jan/Fev/Mar 2027) without collisions.
function formatPeriod(periodMonths) {
  if (!periodMonths || periodMonths.length === 0) return "Período a definir";
  const sorted = [...periodMonths].sort((a, b) => {
    const [ya, ma] = a.split("-");
    const [yb, mb] = b.split("-");
    if (ya !== yb) return Number(ya) - Number(yb);
    return MONTHS.indexOf(ma) - MONTHS.indexOf(mb);
  });
  return sorted.map((p) => { const [y, m] = p.split("-"); return `${m}/${y}`; }).join(", ");
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function toggleArrayValue(arr, val) {
  return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];
}

// Same as toggleArrayValue, but treats "Nenhum" as mutually exclusive with
// every other option — picking it clears the rest, and picking anything
// else clears "Nenhum" — so the selection never ends up contradictory.
function toggleMultiWithNone(arr, val) {
  if (val === "Nenhum") {
    return arr.includes("Nenhum") ? [] : ["Nenhum"];
  }
  return toggleArrayValue(arr.filter((v) => v !== "Nenhum"), val);
}

// Normalizes records loaded from storage that may come from an older
// version of the data model (e.g. a single contact instead of a list).
const VALID_SEGMENTOS_SET = new Set(SEGMENTOS);
const LOWERCASE_CONNECTORS = new Set(["e", "de", "da", "do", "das", "dos", "em"]);

// Title-cases a string the way our fixed lists do (e.g. "Farma e Saúde"):
// every word capitalized except small connectors, and each side of a
// hyphen capitalized too ("Meio-Ambiente"). Used to clean up legacy
// freeform segmento values ("Alimentos e bebidas") saved before Segmento
// became a fixed list.
// Case/whitespace-tolerant match, used for segment filtering — a safety
// net in case any saved advertiser has a segmento with slightly different
// formatting than the fixed SEGMENTOS list (extra spaces, casing, etc.).
function segMatches(filterList, value) {
  const norm = (s) => (s || "").trim().toLowerCase();
  const v = norm(value);
  return filterList.some((f) => norm(f) === v);
}

function titleCasePt(str) {
  if (!str) return str;
  return str
    .split(" ")
    .map((word, i) => {
      // Preserve short all-caps abbreviations (state/region codes like SP, RJ, MG, NE)
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

function normalizeAdvertiser(a) {
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

function normalizeContact(c) {
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

// Builds the standalone contacts collection out of the legacy embedded
// advertiser.contacts arrays, for people who already had data saved
// before contacts became their own tab.
function deriveContactsFromAdvertisers(advertiserList) {
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

function deriveMonthCodeFromDate(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split("-");
  if (parts.length < 2) return null;
  const year = parts[0];
  const monthIndex = parseInt(parts[1], 10) - 1;
  if (!year || monthIndex < 0 || monthIndex > 11) return null;
  return `${year}-${MONTHS[monthIndex]}`;
}

// Deterministic pseudo-random period, seeded by the opportunity's own id.
// Used as a last-resort fallback so records with no usable date don't all
// collapse onto the same month — but still gives the same answer every
// reload instead of shuffling the Visão Geral each time.
function pseudoRandomPeriodFromId(id) {
  let hash = 0;
  for (let i = 0; i < String(id).length; i++) {
    hash = (hash * 31 + String(id).charCodeAt(i)) >>> 0;
  }
  const month = MONTHS[hash % 12];
  const year = CURRENT_YEAR + (Math.floor(hash / 12) % 2);
  return `${year}-${month}`;
}

function normalizeOpportunity(o) {
  const rawMonths = Array.isArray(o.periodMonths) ? o.periodMonths : [];
  const fallbackYear = o.periodYear || CURRENT_YEAR;
  // Legacy records stored bare month codes ("Out") plus a single periodYear
  // for the whole opportunity — migrate those into year-qualified codes
  // ("2026-Out") so each month keeps its own year.
  let periodMonths = rawMonths.map((m) => (m.includes("-") ? m : `${fallbackYear}-${m}`));
  // Records saved with no period at all (older data, or anything that slipped
  // through before Período was required) would silently disappear from the
  // Visão Geral, since it's filtered by period. Fall back to the month/year
  // of the closing date so every opportunity is always attributable to a period.
  if (periodMonths.length === 0) {
    const fallback =
      deriveMonthCodeFromDate(o.expectedCloseDate) ||
      deriveMonthCodeFromDate(o.deliveryDate) ||
      pseudoRandomPeriodFromId(o.id);
    if (fallback) periodMonths = [fallback];
  }
  return {
    ...o,
    stage: STAGE_MIGRATION[o.stage] || o.stage,
    agencyId: o.agencyId || DIRECT_CLIENT_ID,
    contactId: o.contactId !== undefined ? o.contactId : null,
    products: (Array.isArray(o.products) ? o.products : o.format ? [o.format] : [])
      .map(migrateProductName)
      .filter(Boolean),
    periodMonths,
    briefing: o.briefing || "",
    value: Number(o.value) || 0,
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
  };
}

function riskStyle(risco) {
  const r = (risco || "").toLowerCase();
  if (r.includes("alto")) return "bg-rose-50 text-rose-700 border-rose-200";
  if (r.includes("médio") || r.includes("medio"))
    return "bg-amber-50 text-amber-700 border-amber-200";
  if (r.includes("baixo")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  return "bg-slate-100 text-slate-500 border-slate-200";
}

async function callClaude(systemPrompt, userPrompt) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  const data = await response.json();
  const text = (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");
  return text;
}

function emptyOppForm() {
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
  };
}

const seedAdvertisers = [
  {
    id: "a1",
    codigo: "1001",
    razaoSocial: "Vantana Alimentos Ltda.",
    cnpj: "12345678000190",
    nomeFantasia: "Grupo Vantana Alimentos",
    name: "Grupo Vantana Alimentos",
    type: "Anunciante",
    segmento: "Alimentos",
    contacts: [{ id: "c1", name: "Marina Costa", role: "Gerente de Mídia", channel: "WhatsApp" }],
    interactions: [
      {
        id: "i1",
        date: "2026-06-18",
        note: "Reunião de renovação do patrocínio da novela das 21h. Cliente pediu desconto de 12% alegando proposta concorrente da Globo. Ficou de responder até sexta.",
        aiSummary:
          "Cliente negocia renovação de patrocínio e pressiona por desconto de 12%, citando proposta concorrente.",
        aiNextAction:
          "Preparar contraproposta com valor agregado (bônus de inserções) antes de sexta-feira.",
        aiRisk: "médio",
      },
    ],
  },
  {
    id: "a2",
    codigo: "1002",
    razaoSocial: "Fluxo Comunicação e Publicidade Ltda.",
    cnpj: "23456789000181",
    nomeFantasia: "Agência Fluxo Comunicação",
    name: "Agência Fluxo Comunicação",
    type: "Agência",
    segmento: "Tech e E-Commerce",
    atendeAnunciantes: ["a1", "a6"],
    contacts: [{ id: "c2", name: "Rafael Andrade", role: "Diretor de Contas", channel: "E-mail" }],
    interactions: [],
  },
  {
    id: "a3",
    codigo: "1003",
    razaoSocial: "Banco Horizonte S.A.",
    cnpj: "34567890000172",
    nomeFantasia: "Banco Horizonte",
    name: "Banco Horizonte",
    type: "Anunciante",
    segmento: "Financeiro e Seguros",
    contacts: [{ id: "c3", name: "Juliana Prado", role: "Coordenadora de Marketing", channel: "Reunião" }],
    interactions: [],
  },
  {
    id: "a4",
    codigo: "1004",
    razaoSocial: "Prisma Mídia Planejamento Ltda.",
    cnpj: "45678900000163",
    nomeFantasia: "Agência Prisma Mídia",
    name: "Agência Prisma Mídia",
    type: "Agência",
    segmento: "Entretenimento",
    atendeAnunciantes: ["a5"],
    contacts: [{ id: "c4", name: "Eduardo Lima", role: "Planejador de mídia", channel: "E-mail" }],
    interactions: [],
  },
  {
    id: "a5",
    codigo: "1005",
    razaoSocial: "Bela Linha Indústria de Cosméticos Ltda.",
    cnpj: "56789000000154",
    nomeFantasia: "Bela Linha Cosméticos",
    name: "Bela Linha Cosméticos",
    type: "Anunciante",
    segmento: "Higiene e Beleza",
    contacts: [{ id: "c5", name: "Patrícia Nogueira", role: "Head de Marketing", channel: "WhatsApp" }],
    interactions: [],
  },
  {
    id: "a6",
    codigo: "1006",
    razaoSocial: "Construtora Amplo Engenharia Ltda.",
    cnpj: "67890100000145",
    nomeFantasia: "Construtora Amplo",
    name: "Construtora Amplo",
    type: "Anunciante",
    segmento: "Construção, Imobiliário e Decoração",
    contacts: [{ id: "c6", name: "Carlos Bittencourt", role: "Gerente Comercial", channel: "Telefone" }],
    interactions: [],
  },
];

// Standardized, ready-to-send proposal templates ("propostas de prateleira").
// Executives pick one, view or send the PDF directly — no AI generation, no
// on-screen breakdown; the PDF itself carries the detail.
const PROPOSAL_TEMPLATES = [
  {
    id: "tpl-superpop",
    product: "Superpop",
    title: "Patrocínio SuperPop",
    subtitle: "Cota nacional + cota de patrocínio local, com a Cariúcha",
    horario: "Quarta-feira, 22h45",
    periodo: "12 meses",
    pdfFileName: "proposta-superpop.pdf",
    pdfDataUri: "data:application/pdf;base64,JVBERi0xLjQKJZOMi54gUmVwb3J0TGFiIEdlbmVyYXRlZCBQREYgZG9jdW1lbnQgKG9wZW5zb3VyY2UpCjEgMCBvYmoKPDwKL0YxIDIgMCBSIC9GMiAzIDAgUgo+PgplbmRvYmoKMiAwIG9iago8PAovQmFzZUZvbnQgL0hlbHZldGljYSAvRW5jb2RpbmcgL1dpbkFuc2lFbmNvZGluZyAvTmFtZSAvRjEgL1N1YnR5cGUgL1R5cGUxIC9UeXBlIC9Gb250Cj4+CmVuZG9iagozIDAgb2JqCjw8Ci9CYXNlRm9udCAvSGVsdmV0aWNhLUJvbGQgL0VuY29kaW5nIC9XaW5BbnNpRW5jb2RpbmcgL05hbWUgL0YyIC9TdWJ0eXBlIC9UeXBlMSAvVHlwZSAvRm9udAo+PgplbmRvYmoKNCAwIG9iago8PAovQ29udGVudHMgOSAwIFIgL01lZGlhQm94IFsgMCAwIDU5NS4yNzU2IDg0MS44ODk4IF0gL1BhcmVudCA4IDAgUiAvUmVzb3VyY2VzIDw8Ci9Gb250IDEgMCBSIC9Qcm9jU2V0IFsgL1BERiAvVGV4dCAvSW1hZ2VCIC9JbWFnZUMgL0ltYWdlSSBdCj4+IC9Sb3RhdGUgMCAvVHJhbnMgPDwKCj4+IAogIC9UeXBlIC9QYWdlCj4+CmVuZG9iago1IDAgb2JqCjw8Ci9Db250ZW50cyAxMCAwIFIgL01lZGlhQm94IFsgMCAwIDU5NS4yNzU2IDg0MS44ODk4IF0gL1BhcmVudCA4IDAgUiAvUmVzb3VyY2VzIDw8Ci9Gb250IDEgMCBSIC9Qcm9jU2V0IFsgL1BERiAvVGV4dCAvSW1hZ2VCIC9JbWFnZUMgL0ltYWdlSSBdCj4+IC9Sb3RhdGUgMCAvVHJhbnMgPDwKCj4+IAogIC9UeXBlIC9QYWdlCj4+CmVuZG9iago2IDAgb2JqCjw8Ci9QYWdlTW9kZSAvVXNlTm9uZSAvUGFnZXMgOCAwIFIgL1R5cGUgL0NhdGFsb2cKPj4KZW5kb2JqCjcgMCBvYmoKPDwKL0F1dGhvciAoXChhbm9ueW1vdXNcKSkgL0NyZWF0aW9uRGF0ZSAoRDoyMDI2MDcwMTIxNTY0MiswMCcwMCcpIC9DcmVhdG9yIChcKHVuc3BlY2lmaWVkXCkpIC9LZXl3b3JkcyAoKSAvTW9kRGF0ZSAoRDoyMDI2MDcwMTIxNTY0MiswMCcwMCcpIC9Qcm9kdWNlciAoUmVwb3J0TGFiIFBERiBMaWJyYXJ5IC0gXChvcGVuc291cmNlXCkpIAogIC9TdWJqZWN0IChcKHVuc3BlY2lmaWVkXCkpIC9UaXRsZSAoXChhbm9ueW1vdXNcKSkgL1RyYXBwZWQgL0ZhbHNlCj4+CmVuZG9iago4IDAgb2JqCjw8Ci9Db3VudCAyIC9LaWRzIFsgNCAwIFIgNSAwIFIgXSAvVHlwZSAvUGFnZXMKPj4KZW5kb2JqCjkgMCBvYmoKPDwKL0ZpbHRlciBbIC9BU0NJSTg1RGVjb2RlIC9GbGF0ZURlY29kZSBdIC9MZW5ndGggMjA4MAo+PgpzdHJlYW0KR2F0bTw9YGA9VSY6WEFXZlFQc2QtKl8uY2kwaCdtOCZmRDBFR1FwV1NeQGZqXyhub086ZEUxSkZTYiUwISJZMk1XTjM+RVtfUTI4S2w3S2BKO1lMWXMzPU1tcEw/MXQtOXJ1PCsrU1RyI05KJixDNCxVTktOK0lqaHVrY28kJiRmTlUqdSVAKy1JWXJPITxrP2oyTl4uIilwZmhLbC1tOkVLWmA8YCE3cT5qYj5SdGRLMUlyVD1Ab08xPV83ZlgtZ1V0OSowbyE8UUljTlpdUiRJX0A2Sj8yKzlaT15dIUAiTjoqaSRZSnNxISFkRm4vRF9TM2pyUyhIVWdoTzVySCw4SCtWKmBLUjpGcClUZz1ZbTQ1OTJoNVlJKChVZFBdKiUiclU+bihoYTg5TitvJWs/PikzYzBdMTNQSyk9KHJrWmJJTVVrU1YrQkhhZSRePUA3dGQiZFMrVXJtb2BEZFsyLkVyaklFcC1kL01FZi5kTGNzczY/S1M9T0FhPls2aF1VbWJbLD4tSzw7anU/Zz8/Jzk/Wk5oWDI1NlhZJDRoajE5I249YHVwZCxxQ2U2S1tFI0c2bFlqRilEYzRyIkJaLWIwZGsrbDdmUydzIjw3a0w/QC0kZSU9KUYhNzI2Qz5HT0tEKGU2Zm0wTiNRLiw9W0tYM0BnSypvM2tHX0hhb1RYK2ZeI0UubGlzOF51PGRfb1E8aioral05bkhdRidzIThRYmEwLExVUyQrL19YVGAoWzdRR2onJCgsXzdgSV5KIkFUIVNxSUdnTyE/UVdpYzlOXSo7YDclPiglT1RDOyckTk5rJyhJZWUqbUhCIytAZV5JYjZyMV5WKyI6blJlJHEqNkBOKmIzTFwsPVRsVzZXLiliTmI1RUxMSFBfU1phXS5jJkdJKyhMLydfI1NOJyptQUcyKnJFOXBgLTgqW2gzb25sZUZkJms7ZyFrLnMqQ0I6SkgoKCVtM0A0YmYsZV9MbyVaM1UvOlpiRUNjIThGOygzJGcxVFghPCpUNj9SaCRwS2kka3JcMEo6dDMnXzg1RiFcSmAlR3FLY3IhPURMPlEsXFBIQXJAQzJMcFUtPGspK1BjWkdPVVVFMFFiOG02TihkTk9jQTklIjptMiMiP2BrPCxCakpZTj9adGhrJm09Mk0+b2RcdTcsRj0hRmFNXWpdRSJLdTNDcTk5UmhBWEs0PT42OmJcWUxrLCViPzRlLTUsST45MURPJkFUX0deSycwKTxeVkE+X0JrOy9hYGkudVY7cTdHKyJoPW0qQjkhSDxFQ2dDKGgoLEY/QlZESW5yRzN1T2VxZzxdOHRDaC08LXEoPjlZaWtYbWIsTTxHcl11ZDFTOXQ4aWJxbWQ5SlMsKi9kJW09ZyRxJDI4ajZFQihmKmtJQnBcYV5pa1lJWFJeUW89LlRIMzlCSzFCaiRgVXVOWjgsZmQ4aFJzUW4zOGU0KlcjdUI5amR0MldwTXBOXTJiIlFGIkxQIl9rWDNJTzg4IlMlLU0xKlw1WU0zUj80L1JbWGdAPmE2bDRZc0FSLzJhV1sxImZaKW5gXFQ6c3BRYG1bTktdYUcqRStOb1cwc147biRuUTRYcE9fL0M5OEglaGVQbG5kZmByO0NlaltLSkdaMGtXMW0+YSU3WEBfZ2ZUJz9wS2tsYDxiMi4+NGApbU9iLihdX2c+ZW88Z1JTYEYpSEwjZTI+aixjRDQnbHRbQl01IjtTPClLTjBfYUZjOikoUFcvT0d1Zi5hYTxoMEFQPktxOGtdYCYoOSNKblEvSHBNOUY2cTlmOGN1VSFGP2I0dUdDS0YnSGpdVkIzNEh1PidgWypYO19vODwnO2Y/LTl0QlYsNC1XW2ktViVyRj0vSTsoND5JZCtSa2A4KHFnJmdEXUdlL1RcVk1wWG1ySydJPXIzPHVJKCptUzIwKSYxN1xUXzFaKj4xPUE4Vks0a1Jfa11hLmlwUiF1LCJfS2UtUHBhRjNvQ2YvTVtXPm1ncThtb1BvPyQ4WjJKKz8iNjNTRSFdTms+bVM6YnJsR2k7ISlwbSstSCc2WmFuOyJSYFplVmE7WTY0PTJrPE1WcyxWLSpnTGZaNyJOJCg9VS9vVUtLbiIlXVVGXzxXPmpMWWAqQVtWazZLUGpKTVNWLzFbVl1DW2YmJGVESyk5MjdjJkZybkg2UTItbzJqJjBnImJcRD9fTC8sQTAhOmlaTm9iPzc5WThmZTZpbmVuW0dfO2wwS2krJWVVPSVeIzFIMEBQJlVSY1gsSkRbRmA/cjBqbjAxKkEhJmcoW2RsMipTME5BOD9TK1cmRzJlRVRYUiVRLDBYZFoiI0E4PXNaMThhMDlmRF50NiFpcThtSixNTm10TChXREtFQ1NMUjktNW1YUWw9OEwmb2NpOT9cUSxiayNEdUVkalw4REo8MnQmX01iUVZ1LipxVmZnJUxZYkxGT3J0TGxYNVM1azo4Yz84L2pRbik2TWRHPFpkIlpVRVEoOj9CSC9JOGYrLEpwPHNGTnE2XUc6cSVGaGBjRSFRcjtuJC8nSmlwbjVPMz11I1E/LEswSj0ta1I1WXQ3I19KaCxIdWxLbDZAUDxVL0ovTHFOMltmYSpWIVhYP3UqUSVEXiQ/QShcaipbZWo6OmhyWFI/aGopbDhyKEd1P2ZdZ11gZVZVIVRxQT1kIltkRz5yMDc3QTlhNC1bJi1baSNWV004USlHVk1qQ2xhQ1VRPUM3Mz8tZFluNiNEMydoQmNkIShzcldCLGpcYkh+PmVuZHN0cmVhbQplbmRvYmoKMTAgMCBvYmoKPDwKL0ZpbHRlciBbIC9BU0NJSTg1RGVjb2RlIC9GbGF0ZURlY29kZSBdIC9MZW5ndGggMTMwNwo+PgpzdHJlYW0KR2F1MS87MDFKTSUiUjc2LnJgMGJcRiUucidNNC4uPkJmPj9oS0RPalk+OUZQQTB0L0wmajhqLUdRJTE6al1JZl0tVzUlbUZFJ14iIXE2ZEUlPjRjJE1tXTBrIVV0T0FtbGlGNSoqLCM2IjsubTciM3N1K0locUMiVlcoIVhYci9MVE9YLzxcXjUkMTdqJFo5RDhDW1Y9JldGXCRLImtUYTo9YmdGNylHcztOVGI9I1g5OUtjbzxTKWBmImY6Tjg2cChdIV8qP0BhaVpcTFJnT1R0Q08+QmwpSzReZkdSS1xQMDxWTkNidE0vKDZzbWRcRWIjJkosYyteLD1QTFZmZlpJNXJZSzpRXkk+LTRAITpnSCIiLHA0UjBOLG89KGIxYCYkUXJESVZBMFo+NnFnVTIuSWZSKCJHbC0xclhAdDgkVEUhI0J0M2tYIj9lWXVCSFxmZyteLmBKMGAybGJsR0hoIk5HPCdvY2Q5bTgxOU9iImpWbFVsTy0wdTBsX0BRLE1XOkolIjIzXEJlQ1lzMCsyKWgqRTZySD5uamlNSmk7NzhVLU4uIVUpJzgyOUhfPWVtaVFZQEpAZTQrV0BNMDxJOyJHW28vKTJlJ1tyV1ZDVF5CQDwwX1FKJ2tHLmomYmFGJS1qXyJeVSoqZWpYRzgicS5nKU1YRGlzQ1BUZ19VWipDS09wQiEwU2BKJlpPPTtLPHNPLDdoLWlUWUp0ZWQzO21GPipeMVo/QmVxdSlKJC48NklTTTBaRjMuZSkrLF5nJV5VTGIraGppJCw0JDlicW5CXEkmX1UiJHMxc280Nko3JGAnYDtfSk1LQ2MqJGxSQlpCQmxYSiQ4V21jP0tAYShkUi5cZjIxUUovTUZUVjFDa0EoO2VrUC4yJy0xRV4tTmotUGonKWEidEhBWSlZZFxiXkInXkQrO2BpKCtPaXIzQEY3TkosXFhTXVZDTiZTXy8wPUA1MTddO1NJI1xvdSwvUGdLKkA/bnJsRVUmdFM3XTpUIU9ubzUhKmhEOnFxZ2IwampTJkooQCpjMj1KaDs3OWZMcGdFTUJoTGE7anNSJTgsY2tVMS85J1c5S0M2WmlwWUomKDo4dD4nISM8Pkk7LFgrZ0QxMk1JcEhIV29yW09iTUY3JVVMLGpYITdDNF9ASz8oPlhZckNiTjdBOT47TW83bmFCUSpfayo6PzdoWDZHSlhZUzFJMmRNTGxIJzhaYGMoajcpZUUkR2VjLCFHRV4rLlMsbDUvW1tCYDR1SjtvTypIVXBCJHBTXT5PdD1GRydOQUk8cHVFPnRaYydSYUcjV1JAQ1M6YDdpRmApbilHVUM2Jmhxay5eWWlAJUM6Oj0sJiZJQ1UlXy8lRmpPb2pwKF47QFp0O3M5c0NaTlghWSMlPDQyaSlZPihLSWdVOHRWTUE7XF1TbzFEOShzckJFTSRZcmVAWEhDXlNLV29gYWwiZD1RMHI7SztcJi8vXWs4PVhXcGRhQUtiIi1eR2VESTM5Xl1RcSs+bkd1akIyLlZANVsjdDw0OTlPZ1sqTCM1bigxLTsvKjJISGNJUyVcREJxW1wnKURSRFZddCpbSmVSOFxHZ0kxUl1aOEFmJksrJWNGN2R1NDJDK0NlYz83MGhZR20iLCpVa2xBQG1fSz1tZDM1WEEmNV9FX25nTCMkNTVNSnV0JE0rci43P08qQFZUUkUsKD1YY3BhLktWbHNrWyxpQiEqI0FQVCQsWlVnfj5lbmRzdHJlYW0KZW5kb2JqCnhyZWYKMCAxMQowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwNjEgMDAwMDAgbiAKMDAwMDAwMDEwMiAwMDAwMCBuIAowMDAwMDAwMjA5IDAwMDAwIG4gCjAwMDAwMDAzMjEgMDAwMDAgbiAKMDAwMDAwMDUyNCAwMDAwMCBuIAowMDAwMDAwNzI4IDAwMDAwIG4gCjAwMDAwMDA3OTYgMDAwMDAgbiAKMDAwMDAwMTA3NiAwMDAwMCBuIAowMDAwMDAxMTQxIDAwMDAwIG4gCjAwMDAwMDMzMTIgMDAwMDAgbiAKdHJhaWxlcgo8PAovSUQgCls8YTJkNGE4OWFhMjlhYzM0NWU2MDBmOWE0NWMwN2Q2ZTI+PGEyZDRhODlhYTI5YWMzNDVlNjAwZjlhNDVjMDdkNmUyPl0KJSBSZXBvcnRMYWIgZ2VuZXJhdGVkIFBERiBkb2N1bWVudCAtLSBkaWdlc3QgKG9wZW5zb3VyY2UpCgovSW5mbyA3IDAgUgovUm9vdCA2IDAgUgovU2l6ZSAxMQo+PgpzdGFydHhyZWYKNDcxMQolJUVPRgo=",
  },
];

function buildProposalEmailBody(template, contactName) {
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

const seedContacts = [
  { id: "c1", clientId: "a1", name: "Marina Costa", cargo: "Gerente de Mídia", departamento: "Marketing", nivelDecisao: "Gerência", celular: "11987650001", email: "marina.costa@vantana.com.br", esportes: ["Corrida", "Vôlei"], timeCoracao: "Palmeiras", filhos: 1 },
  { id: "c2", clientId: "a2", name: "Rafael Andrade", cargo: "Diretor de Contas", departamento: "Atendimento", nivelDecisao: "Diretoria", celular: "11987650002", email: "rafael.andrade@fluxocomunicacao.com.br", esportes: ["Futebol", "Tênis"], timeCoracao: "Flamengo", filhos: 2 },
  { id: "c3", clientId: "a3", name: "Juliana Prado", cargo: "Coordenadora de Marketing", departamento: "Marketing", nivelDecisao: "Analista", celular: "11987650003", email: "juliana.prado@bancohorizonte.com.br", esportes: ["Natação"], timeCoracao: "", filhos: 0 },
  { id: "c4", clientId: "a4", name: "Eduardo Lima", cargo: "Planejador de mídia", departamento: "Planejamento", nivelDecisao: "Operação", celular: "11987650004", email: "eduardo.lima@prismamidia.com.br", esportes: ["Futebol", "Corrida"], timeCoracao: "Corinthians", filhos: 0 },
  { id: "c5", clientId: "a5", name: "Patrícia Nogueira", cargo: "Head de Marketing", departamento: "Marketing", nivelDecisao: "C-Level", celular: "11987650005", email: "patricia.nogueira@belalinha.com.br", esportes: ["Golfe", "Tênis"], timeCoracao: "São Paulo", filhos: 2 },
  { id: "c6", clientId: "a6", name: "Carlos Bittencourt", cargo: "Gerente Comercial", departamento: "Comercial", nivelDecisao: "Gerência", celular: "11987650006", email: "carlos.bittencourt@construtoraamplo.com.br", esportes: ["Futebol", "Artes Marciais"], timeCoracao: "Vasco da Gama", filhos: 3 },
];

// Metas mensais — carga de dados (pensada para vir de uma consulta SQL no
// financeiro), não editável pela interface. Sazonalidade realista de mídia:
// mais fraca no início do ano, mais forte no fim (Black Friday, Natal,
// fechamento de verba do ano).
// Metas mensais por SEGMENTO — carga de dados (feita pelo financeiro via
// SQL), não editável pela interface do CRM. Não existe meta por cliente;
// a meta só faz sentido no nível de segmento, que é o que compõe a
// carteira de cada executivo. Sazonalidade realista de mídia: mais fraca
// no início do ano, mais forte no fim (Black Friday, Natal, fechamento de
// verba do ano).
// Executivos — cadastro canônico (antes disso, "Executivo" era só texto
// livre digitado na oportunidade, o que fragmentava o mesmo nome em
// variações diferentes). Nomes iguais aos já usados nas oportunidades de
// exemplo, para não quebrar o histórico.
const seedExecutivos = [
  { id: "e1", nome: "Bruno Camargo" },
  { id: "e2", nome: "Ana Beatriz Souza" },
  { id: "e3", nome: "Diego Martins" },
  { id: "e4", nome: "Larissa Ferreira" },
  { id: "e5", nome: "Rodrigo Nunes" },
];

// Carteira: cada Segmento pertence a exatamente um Executivo (regra
// exclusiva). Chave = nome do segmento, valor = id do executivo dono.
// Segmentos sem cliente cadastrado ficam de fora por ora.
const seedSegmentoExecutivo = {
  Alimentos: "e1",
  "Financeiro e Seguros": "e2",
  "Higiene e Beleza": "e3",
  "Construção, Imobiliário e Decoração": "e4",
  "Tech e E-Commerce": "e5",
  Entretenimento: "e5",
};

const seedMetas = {
  Alimentos: {
    "2026-Jan": 210000, "2026-Fev": 225000, "2026-Mar": 255000, "2026-Abr": 270000,
    "2026-Mai": 285000, "2026-Jun": 300000, "2026-Jul": 315000, "2026-Ago": 330000,
    "2026-Set": 345000, "2026-Out": 390000, "2026-Nov": 435000, "2026-Dez": 480000,
    "2027-Jan": 230000, "2027-Fev": 248000, "2027-Mar": 281000, "2027-Abr": 297000,
    "2027-Mai": 314000, "2027-Jun": 330000, "2027-Jul": 347000, "2027-Ago": 363000,
    "2027-Set": 380000, "2027-Out": 429000, "2027-Nov": 479000, "2027-Dez": 528000,
  },
  "Financeiro e Seguros": {
    "2026-Jan": 210000, "2026-Fev": 225000, "2026-Mar": 255000, "2026-Abr": 270000,
    "2026-Mai": 285000, "2026-Jun": 300000, "2026-Jul": 315000, "2026-Ago": 330000,
    "2026-Set": 345000, "2026-Out": 390000, "2026-Nov": 435000, "2026-Dez": 480000,
    "2027-Jan": 230000, "2027-Fev": 248000, "2027-Mar": 281000, "2027-Abr": 297000,
    "2027-Mai": 314000, "2027-Jun": 330000, "2027-Jul": 347000, "2027-Ago": 363000,
    "2027-Set": 380000, "2027-Out": 429000, "2027-Nov": 479000, "2027-Dez": 528000,
  },
  "Higiene e Beleza": {
    "2026-Jan": 140000, "2026-Fev": 150000, "2026-Mar": 170000, "2026-Abr": 180000,
    "2026-Mai": 190000, "2026-Jun": 200000, "2026-Jul": 210000, "2026-Ago": 220000,
    "2026-Set": 230000, "2026-Out": 260000, "2026-Nov": 290000, "2026-Dez": 320000,
    "2027-Jan": 154000, "2027-Fev": 165000, "2027-Mar": 187000, "2027-Abr": 198000,
    "2027-Mai": 209000, "2027-Jun": 220000, "2027-Jul": 231000, "2027-Ago": 242000,
    "2027-Set": 253000, "2027-Out": 286000, "2027-Nov": 319000, "2027-Dez": 352000,
  },
  "Construção, Imobiliário e Decoração": {
    "2026-Jan": 140000, "2026-Fev": 150000, "2026-Mar": 170000, "2026-Abr": 180000,
    "2026-Mai": 190000, "2026-Jun": 200000, "2026-Jul": 210000, "2026-Ago": 220000,
    "2026-Set": 230000, "2026-Out": 260000, "2026-Nov": 290000, "2026-Dez": 320000,
    "2027-Jan": 154000, "2027-Fev": 165000, "2027-Mar": 187000, "2027-Abr": 198000,
    "2027-Mai": 209000, "2027-Jun": 220000, "2027-Jul": 231000, "2027-Ago": 242000,
    "2027-Set": 253000, "2027-Out": 286000, "2027-Nov": 319000, "2027-Dez": 352000,
  },
};

// Faturamento efetivo — representa a atualização diária do sistema OPEC da
// RedeTV!, identificada pelo Código do cliente. Aqui é só um retrato
// estático de exemplo; na integração real isso chega via job automático.
const seedFaturamentoEfetivo = [
  { id: "f1", clienteCodigo: "1001", periodo: "2026-Mai", valor: 180000 },
  { id: "f2", clienteCodigo: "1001", periodo: "2026-Jun", valor: 195000 },
  { id: "f3", clienteCodigo: "1003", periodo: "2026-Mai", valor: 220000 },
  { id: "f4", clienteCodigo: "1003", periodo: "2026-Jun", valor: 235000 },
  { id: "f5", clienteCodigo: "1005", periodo: "2026-Mai", valor: 150000 },
  { id: "f6", clienteCodigo: "1005", periodo: "2026-Jun", valor: 160000 },
  { id: "f7", clienteCodigo: "1006", periodo: "2026-Mai", valor: 140000 },
  { id: "f8", clienteCodigo: "1006", periodo: "2026-Jun", valor: 155000 },
];

const seedOpportunities = [
  { id: "o1", agencyId: DIRECT_CLIENT_ID, advertiserId: "a1", contactId: "c1", title: "Patrocínio novela das 21h", products: ["Superpop"], value: 850000, stage: "Quente", periodMonths: ["2026-Ago", "2026-Set"], briefing: "Cliente quer presença forte em abertura e encerramento do programa, com menção do apresentador ao vivo. Pediu para evitar concorrentes diretos do setor de alimentos na mesma janela. Já usou formato parecido em 2025 com boa recepção.", executivo: "Bruno Camargo", responsavel: "Camila Rezende", tipo: "Novo", versao: 1, status: "Aprovação", observacao: "Cliente pediu contraproposta com bônus de inserções — aguardando aprovação do valor final.", planDeliveryDate: "", createdAt: "2026-06-01", deliveryDate: "2026-07-20", expectedCloseDate: "2026-07-15" },
  { id: "o2", agencyId: "a2", advertiserId: "a1", contactId: "c2", title: "Pacote comercial futebol", products: ["Bola Na Rede"], value: 420000, stage: "Morno", periodMonths: ["2026-Jul"], executivo: "Ana Beatriz Souza", responsavel: "Thiago Alves", tipo: "Novo", versao: 1, status: "Desenvolvimento", observacao: "", planDeliveryDate: "", createdAt: "2026-06-10", deliveryDate: "2026-06-28", expectedCloseDate: "2026-06-25" },
  { id: "o3", agencyId: DIRECT_CLIENT_ID, advertiserId: "a3", contactId: "c3", title: "Merchandising programa manhã", products: ["Fica Com A Gente"], value: 180000, stage: "Frio", periodMonths: ["2026-Set"], executivo: "Diego Martins", responsavel: "", tipo: "Novo", versao: 1, status: "Pendente", observacao: "", planDeliveryDate: "", createdAt: "2026-06-15", deliveryDate: "2026-08-20", expectedCloseDate: "2026-08-10" },
  { id: "o4", agencyId: "a4", advertiserId: "a5", contactId: "c4", title: "Cross-media grade + digital", products: ["Social Media", "Google Partner Sales"], value: 610000, stage: "Desenvolvimento", periodMonths: ["2026-Out", "2026-Nov", "2026-Dez", "2027-Jan", "2027-Fev", "2027-Mar"], briefing: "Anunciante quer testar formato cross-media pela primeira vez, com foco em performance digital casado com presença na grade. Pediu relatório mensal de resultados e possibilidade de ajuste de verba entre os canais ao longo da campanha.", executivo: "Larissa Ferreira", responsavel: "", tipo: "Customização", versao: 1, status: "Pendente", observacao: "", planDeliveryDate: "", createdAt: "2026-06-20", deliveryDate: "2026-09-25", expectedCloseDate: "2026-09-15" },
  { id: "o5", agencyId: DIRECT_CLIENT_ID, advertiserId: "a5", contactId: "c5", title: 'Comercial 15" horário nobre', products: ["TV Fama"], value: 260000, stage: "Fechado", periodMonths: ["2026-Jun"], executivo: "Rodrigo Nunes", responsavel: "Thiago Alves", tipo: "Novo", versao: 1, status: "Comercializado", observacao: "", planDeliveryDate: "2026-05-28", createdAt: "2026-05-05", deliveryDate: "2026-05-28", expectedCloseDate: "2026-05-25" },
  { id: "o6", agencyId: DIRECT_CLIENT_ID, advertiserId: "a6", contactId: "c6", title: "Patrocínio previsão do tempo", products: ["RedeTV! Notícias - 1ª Edição"], value: 320000, stage: "Quente", periodMonths: ["2026-Ago"], executivo: "Bruno Camargo", responsavel: "Juliana Matos", tipo: "Novo", versao: 1, status: "Aprovação", observacao: "", planDeliveryDate: "", createdAt: "2026-06-12", deliveryDate: "2026-07-25", expectedCloseDate: "2026-07-20" },
  { id: "o7", agencyId: DIRECT_CLIENT_ID, advertiserId: "a1", contactId: "c1", title: "Ação de merchandising verão", products: ["Sensacional"], value: 150000, stage: "Negado", periodMonths: ["2026-Jan"], executivo: "Ana Beatriz Souza", responsavel: "", tipo: "Novo", versao: 1, status: "Negativado", observacao: "", planDeliveryDate: "2026-01-15", createdAt: "2025-11-10", deliveryDate: "2026-01-15", expectedCloseDate: "2026-01-10" },
  { id: "o8", agencyId: "a2", advertiserId: "a6", contactId: "c2", title: "Renovação pacote anual", products: ["Superpop", "TV Fama"], value: 980000, stage: "Frio", periodMonths: ["2027-Jan", "2027-Fev", "2027-Mar", "2027-Abr", "2027-Mai", "2027-Jun", "2027-Jul", "2027-Ago", "2027-Set", "2027-Out", "2027-Nov", "2027-Dez"], briefing: "Renovação do pacote anual vigente, com pedido de revisão de valor por conta do aumento de verba do grupo para o próximo exercício.", executivo: "Diego Martins", responsavel: "", tipo: "Refação", versao: 2, status: "Pendente", observacao: "Segunda revisão do pacote anual; financeiro do grupo pediu novo desconto.", planDeliveryDate: "", createdAt: "2026-06-22", deliveryDate: "2026-12-15", expectedCloseDate: "2026-11-30" },
  { id: "o9", agencyId: DIRECT_CLIENT_ID, advertiserId: "a3", contactId: "c3", title: "Patrocínio À Tarde É Sua", products: ["A Tarde É Sua"], value: 410000, stage: "Desenvolvimento", periodMonths: ["2026-Set", "2026-Out"], briefing: "Banco quer aproveitar o horário de maior audiência feminina para reforçar campanha de crédito consignado. Pediu formato que permita testemunhal de clientes reais.", executivo: "Larissa Ferreira", responsavel: "", tipo: "Novo", versao: 1, status: "Pendente", observacao: "", planDeliveryDate: "", createdAt: "2026-06-25", deliveryDate: "2026-08-30", expectedCloseDate: "2026-08-20" },
  { id: "o10", agencyId: "a2", advertiserId: "a1", contactId: "c2", title: "Comercial Rodada De Negócios", products: ["Rodada De Negócios"], value: 275000, stage: "Desenvolvimento", periodMonths: ["2026-Nov"], briefing: "Cliente pede visibilidade em rodada de negócios voltada para varejo alimentício, com foco em relacionamento B2B e geração de leads qualificados.", executivo: "Rodrigo Nunes", responsavel: "", tipo: "Novo", versao: 1, status: "Pendente", observacao: "", planDeliveryDate: "", createdAt: "2026-06-28", deliveryDate: "2026-10-20", expectedCloseDate: "2026-10-10" },
  { id: "o11", agencyId: DIRECT_CLIENT_ID, advertiserId: "a6", contactId: "c6", title: "Ação Para Aqui — Feirão Imobiliário", products: ["Para Aqui"], value: 198000, stage: "Desenvolvimento", periodMonths: ["2026-Ago"], briefing: "Construtora quer aproveitar o quadro para divulgar feirão de lançamentos imobiliários na Grande SP, com chamada direta para visitação do stand.", executivo: "Bruno Camargo", responsavel: "", tipo: "Novo", versao: 1, status: "Pendente", observacao: "", planDeliveryDate: "", createdAt: "2026-06-18", deliveryDate: "2026-07-30", expectedCloseDate: "2026-07-25" },
  { id: "o12", agencyId: "a4", advertiserId: "a5", contactId: "c4", title: "Patrocínio Bezona", products: ["Bezona"], value: 356000, stage: "Desenvolvimento", periodMonths: ["2026-Dez"], briefing: "Marca de cosméticos busca associar produto a quadro de humor popular entre público jovem, com menção de produto em cena.", executivo: "Ana Beatriz Souza", responsavel: "", tipo: "Novo", versao: 1, status: "Pendente", observacao: "", planDeliveryDate: "", createdAt: "2026-06-29", deliveryDate: "2026-11-25", expectedCloseDate: "2026-11-15" },
  { id: "o13", agencyId: DIRECT_CLIENT_ID, advertiserId: "a3", contactId: "c3", title: "Cota RedeTV! Notícias — 1ª Edição", products: ["RedeTV! Notícias - 1ª Edição"], value: 289000, stage: "Frio", periodMonths: ["2026-Set"], briefing: "Anunciante avalia entrada no telejornal para reforçar solidez institucional após lançamento de nova linha de investimentos.", executivo: "Diego Martins", responsavel: "", tipo: "Novo", versao: 1, status: "Pendente", observacao: "", planDeliveryDate: "", createdAt: "2026-06-05", deliveryDate: "2026-08-25", expectedCloseDate: "2026-08-15" },
  { id: "o15", agencyId: DIRECT_CLIENT_ID, advertiserId: "a5", contactId: "c5", title: "Pacote Social Media Bela Linha", products: ["Social Media"], value: 145000, stage: "Frio", periodMonths: ["2026-Ago", "2026-Set"], briefing: "Cliente quer testar pacote 100% digital antes de comprometer verba de TV, com foco em performance nas redes.", executivo: "Larissa Ferreira", responsavel: "", tipo: "Novo", versao: 1, status: "Pendente", observacao: "", planDeliveryDate: "", createdAt: "2026-06-11", deliveryDate: "2026-07-28", expectedCloseDate: "2026-07-20" },
  { id: "o16", agencyId: "a4", advertiserId: "a5", contactId: "c4", title: "Patrocínio American Zone", products: ["American Zone"], value: 398000, stage: "Frio", periodMonths: ["2026-Nov"], briefing: "Marca de beleza avalia o formato internacional do quadro para posicionar produto premium junto ao público classe AB.", executivo: "Rodrigo Nunes", responsavel: "", tipo: "Novo", versao: 1, status: "Pendente", observacao: "", planDeliveryDate: "", createdAt: "2026-06-14", deliveryDate: "2026-10-15", expectedCloseDate: "2026-10-05" },
  { id: "o17", agencyId: "a2", advertiserId: "a1", contactId: "c2", title: "Ação de Trade Leitura Dinâmica", products: ["Leitura Dinâmica"], value: 233000, stage: "Morno", periodMonths: ["2026-Set"], briefing: "Anunciante quer patrocinar quadro educativo, alinhado com iniciativa de responsabilidade social da marca.", executivo: "Bruno Camargo", responsavel: "Camila Rezende", tipo: "Novo", versao: 1, status: "Desenvolvimento", observacao: "", planDeliveryDate: "", createdAt: "2026-06-02", deliveryDate: "2026-08-18", expectedCloseDate: "2026-08-08" },
  { id: "o18", agencyId: DIRECT_CLIENT_ID, advertiserId: "a6", contactId: "c6", title: "Cota Rotativo — Praça SP", products: ["Rotativo"], value: 176000, stage: "Morno", periodMonths: ["2026-Jul", "2026-Ago"], briefing: "Cliente pede cota rotativa para começar a testar presença na emissora antes de negociar pacote fechado maior.", executivo: "Ana Beatriz Souza", responsavel: "Thiago Alves", tipo: "Novo", versao: 1, status: "Desenvolvimento", observacao: "", planDeliveryDate: "", createdAt: "2026-05-30", deliveryDate: "2026-07-10", expectedCloseDate: "2026-07-05" },
  { id: "o19", agencyId: "a4", advertiserId: "a5", contactId: "c4", title: "Pacote Digital Performance", products: ["Google Partner Sales", "Soft News"], value: 267000, stage: "Morno", periodMonths: ["2026-Ago", "2026-Set", "2026-Out"], briefing: "Agência propõe combinar mídia programática digital com conteúdo editorial de bem-estar para a marca.", executivo: "Diego Martins", responsavel: "Juliana Matos", tipo: "Customização", versao: 1, status: "Desenvolvimento", observacao: "Combinação de formatos ainda em validação com o time de planejamento digital.", planDeliveryDate: "", createdAt: "2026-06-01", deliveryDate: "2026-07-25", expectedCloseDate: "2026-07-18" },
  { id: "o20", agencyId: DIRECT_CLIENT_ID, advertiserId: "a3", contactId: "c3", title: "Patrocínio É Notícia", products: ["É Notícia"], value: 342000, stage: "Morno", periodMonths: ["2026-Set", "2026-Out"], briefing: "Anunciante quer aproveitar o debate direto do quadro para reforçar transparência de seus produtos financeiros.", executivo: "Larissa Ferreira", responsavel: "Camila Rezende", tipo: "Novo", versao: 1, status: "Desenvolvimento", observacao: "", planDeliveryDate: "", createdAt: "2026-06-06", deliveryDate: "2026-08-22", expectedCloseDate: "2026-08-12" },
  { id: "o21", agencyId: "a2", advertiserId: "a6", contactId: "c2", title: "Cota Nacional RJ Do Povo", products: ["RJ Do Povo"], value: 621000, stage: "Quente", periodMonths: ["2026-Ago", "2026-Set", "2026-Out"], briefing: "Agência negocia cota nacional para reforçar presença da construtora em praças estratégicas do Rio e do Sudeste.", executivo: "Rodrigo Nunes", responsavel: "Thiago Alves", tipo: "Novo", versao: 1, status: "Aprovação", observacao: "", planDeliveryDate: "", createdAt: "2026-06-15", deliveryDate: "2026-07-31", expectedCloseDate: "2026-07-22" },
  { id: "o22", agencyId: DIRECT_CLIENT_ID, advertiserId: "a1", contactId: "c1", title: "Patrocínio Nordeste Do Povo", products: ["Nordeste Do Povo"], value: 458000, stage: "Quente", periodMonths: ["2026-Jul", "2026-Ago"], briefing: "Cliente quer associar a marca a conteúdo popular e regional, reforçando conexão com o consumidor nordestino.", executivo: "Bruno Camargo", responsavel: "Juliana Matos", tipo: "Novo", versao: 1, status: "Aprovação", observacao: "", planDeliveryDate: "", createdAt: "2026-06-03", deliveryDate: "2026-07-15", expectedCloseDate: "2026-07-08" },
  { id: "o23", agencyId: DIRECT_CLIENT_ID, advertiserId: "a5", contactId: "c5", title: "Ação Pegadinhas + Esportes Digital", products: ["Pegadinhas", "Esportes"], value: 189000, stage: "Fechado", periodMonths: ["2026-Jun"], briefing: "Ação fechada de pegadinha personalizada com a marca, mais impulsionamento esportivo digital, já em fase de produção.", executivo: "Ana Beatriz Souza", responsavel: "Camila Rezende", tipo: "Novo", versao: 1, status: "Comercializado", observacao: "", planDeliveryDate: "2026-06-20", createdAt: "2026-05-10", deliveryDate: "2026-06-20", expectedCloseDate: "2026-06-15" },
  { id: "o24", agencyId: "a2", advertiserId: "a1", contactId: "c2", title: "Comercial Brasil Do Povo", products: ["Brasil Do Povo"], value: 372000, stage: "Negado", periodMonths: ["2026-Mai"], briefing: "Proposta recusada pelo cliente por incompatibilidade de calendário com campanha já fechada de concorrente direto.", executivo: "Diego Martins", responsavel: "", tipo: "Novo", versao: 1, status: "Negativado", observacao: "Cliente fechou com concorrente direto no mesmo período — sem espaço pra revisão.", planDeliveryDate: "2026-05-25", createdAt: "2026-04-20", deliveryDate: "2026-05-25", expectedCloseDate: "2026-05-18" },
  { id: "o25", agencyId: "a4", advertiserId: "a5", contactId: "c4", title: "Renovação Cota Programmatic TV", products: ["Programmatic TV"], value: 210000, stage: "Fechado", periodMonths: ["2027-Jan", "2027-Fev"], briefing: "Renovação automática do pacote programático do ano anterior, já aprovada pelo financeiro do anunciante.", executivo: "Larissa Ferreira", responsavel: "Juliana Matos", tipo: "Refação", versao: 2, status: "Comercializado", observacao: "", planDeliveryDate: "2027-01-15", createdAt: "2026-06-20", deliveryDate: "2027-01-15", expectedCloseDate: "2027-01-05" },
  { id: "o26", agencyId: DIRECT_CLIENT_ID, advertiserId: "a6", contactId: "c6", title: "Patrocínio Operação De Risco", products: ["Operação De Risco"], value: 295000, stage: "Negado", periodMonths: ["2027-Mar"], briefing: "Cliente optou por não renovar o patrocínio após reavaliação do budget de marketing para o próximo trimestre.", executivo: "Rodrigo Nunes", responsavel: "", tipo: "Novo", versao: 1, status: "Negativado", observacao: "", planDeliveryDate: "2027-02-20", createdAt: "2026-06-25", deliveryDate: "2027-02-20", expectedCloseDate: "2027-02-10" },
  { id: "o27", agencyId: "a4", advertiserId: "a5", contactId: "c4", title: "Patrocínio Superpop — Renovação Trimestral", products: ["Superpop"], value: 445000, stage: "Desenvolvimento", periodMonths: ["2026-Nov", "2026-Dez", "2027-Jan"], briefing: "Cliente quer estender o patrocínio já ativo por mais um trimestre, incluindo a virada de ano, aproveitando a sazonalidade de fim de ano no varejo.", executivo: "Bruno Camargo", responsavel: "", tipo: "Refação", versao: 2, status: "Pendente", observacao: "Extensão do patrocínio ativo; só falta assinatura do aditivo.", planDeliveryDate: "", createdAt: "2026-06-20", deliveryDate: "2026-10-25", expectedCloseDate: "2026-10-15" },
  { id: "o28", agencyId: DIRECT_CLIENT_ID, advertiserId: "a1", contactId: "c1", title: "Cota Fica Com A Gente — Lançamento de Produto", products: ["Fica Com A Gente"], value: 265000, stage: "Desenvolvimento", periodMonths: ["2026-Ago"], briefing: "Anunciante lança nova linha de produtos e quer presença no programa matinal para gerar recall imediato com o público consumidor.", executivo: "Ana Beatriz Souza", responsavel: "", tipo: "Novo", versao: 1, status: "Pendente", observacao: "", planDeliveryDate: "", createdAt: "2026-06-22", deliveryDate: "2026-07-28", expectedCloseDate: "2026-07-20" },
  { id: "o29", agencyId: "a2", advertiserId: "a6", contactId: "c2", title: "Patrocínio A Tarde É Sua — 1ª Edição", products: ["A Tarde É Sua - 1ª Edição"], value: 312000, stage: "Desenvolvimento", periodMonths: ["2026-Set", "2026-Out"], briefing: "Construtora busca associar a marca a conteúdo de entretenimento vespertino, com foco em público interessado em decoração e reforma.", executivo: "Diego Martins", responsavel: "", tipo: "Novo", versao: 1, status: "Pendente", observacao: "", planDeliveryDate: "", createdAt: "2026-06-24", deliveryDate: "2026-08-28", expectedCloseDate: "2026-08-18" },
  { id: "o30", agencyId: DIRECT_CLIENT_ID, advertiserId: "a3", contactId: "c3", title: "Comercial RedeTV! News", products: ["RedeTV! News"], value: 187000, stage: "Frio", periodMonths: ["2026-Ago"], briefing: "Banco quer testar formato de telejornal noturno para reforçar presença institucional fora do horário nobre tradicional.", executivo: "Larissa Ferreira", responsavel: "", tipo: "Novo", versao: 1, status: "Pendente", observacao: "", planDeliveryDate: "", createdAt: "2026-06-07", deliveryDate: "2026-07-25", expectedCloseDate: "2026-07-15" },
  { id: "o31", agencyId: "a4", advertiserId: "a5", contactId: "c4", title: "Ação Rotativo + Digital", products: ["Rotativo", "Soft News"], value: 229000, stage: "Frio", periodMonths: ["2026-Set", "2026-Out"], briefing: "Marca de beleza avalia combinar cota rotativa de TV com inserção digital editorial, buscando eficiência de custo por impacto.", executivo: "Rodrigo Nunes", responsavel: "", tipo: "Novo", versao: 1, status: "Pendente", observacao: "", planDeliveryDate: "", createdAt: "2026-06-09", deliveryDate: "2026-08-20", expectedCloseDate: "2026-08-10" },
  { id: "o32", agencyId: DIRECT_CLIENT_ID, advertiserId: "a6", contactId: "c6", title: "Patrocínio Rodada De Negócios — Feira Setorial", products: ["Rodada De Negócios"], value: 341000, stage: "Morno", periodMonths: ["2026-Ago"], briefing: "Construtora quer patrocinar a cobertura de feira setorial de construção civil, com menção direta a lançamentos da empresa.", executivo: "Bruno Camargo", responsavel: "Camila Rezende", tipo: "Novo", versao: 1, status: "Desenvolvimento", observacao: "", planDeliveryDate: "", createdAt: "2026-05-28", deliveryDate: "2026-07-20", expectedCloseDate: "2026-07-12" },
  { id: "o33", agencyId: "a2", advertiserId: "a1", contactId: "c2", title: "Cota Bola Na Rede — Copa Regional", products: ["Bola Na Rede"], value: 578000, stage: "Morno", periodMonths: ["2026-Jul", "2026-Ago"], briefing: "Alimentício quer aproveitar o pico de audiência da competição regional de futebol para reforçar a marca junto ao público masculino.", executivo: "Ana Beatriz Souza", responsavel: "Thiago Alves", tipo: "Novo", versao: 1, status: "Desenvolvimento", observacao: "", planDeliveryDate: "", createdAt: "2026-05-25", deliveryDate: "2026-07-08", expectedCloseDate: "2026-07-01" },
  { id: "o35", agencyId: "a4", advertiserId: "a5", contactId: "c4", title: "Cota Programmatic TV + RedeTV! Noticias", products: ["Programmatic TV", "RedeTV! Noticias"], value: 254000, stage: "Quente", periodMonths: ["2026-Ago", "2026-Set"], briefing: "Agência sugere combinar cota programática com conteúdo de notícias digital, testando um novo mix de canais para a marca.", executivo: "Diego Martins", responsavel: "Juliana Matos", tipo: "Customização", versao: 1, status: "Aprovação", observacao: "", planDeliveryDate: "", createdAt: "2026-06-10", deliveryDate: "2026-07-22", expectedCloseDate: "2026-07-14" },
  { id: "o36", agencyId: DIRECT_CLIENT_ID, advertiserId: "a1", contactId: "c1", title: "Ação Sensacional — Degustação ao Vivo", products: ["Sensacional"], value: 389000, stage: "Quente", periodMonths: ["2026-Jul", "2026-Ago"], briefing: "Anunciante quer fazer degustação ao vivo no quadro de variedades, com amostra de produto distribuída ao público presente.", executivo: "Larissa Ferreira", responsavel: "Camila Rezende", tipo: "Novo", versao: 1, status: "Aprovação", observacao: "", planDeliveryDate: "", createdAt: "2026-06-01", deliveryDate: "2026-07-18", expectedCloseDate: "2026-07-10" },
  { id: "o37", agencyId: "a2", advertiserId: "a6", contactId: "c2", title: "Cota RedeTV! Notícias — 2ª Edição", products: ["RedeTV! Notícias - 2ª Edição"], value: 412000, stage: "Quente", periodMonths: ["2026-Ago", "2026-Set", "2026-Out"], briefing: "Construtora negocia a segunda edição do telejornal para reforçar frequência de exposição em praças estratégicas.", executivo: "Rodrigo Nunes", responsavel: "Thiago Alves", tipo: "Novo", versao: 1, status: "Aprovação", observacao: "", planDeliveryDate: "", createdAt: "2026-06-12", deliveryDate: "2026-07-29", expectedCloseDate: "2026-07-20" },
  { id: "o38", agencyId: DIRECT_CLIENT_ID, advertiserId: "a3", contactId: "c3", title: "Patrocínio Leitura Dinâmica — Educação Financeira", products: ["Leitura Dinâmica"], value: 223000, stage: "Fechado", periodMonths: ["2026-Jun"], briefing: "Banco fecha patrocínio de quadro educativo como parte da campanha de educação financeira do cliente, já aprovada internamente.", executivo: "Bruno Camargo", responsavel: "Juliana Matos", tipo: "Novo", versao: 1, status: "Comercializado", observacao: "", planDeliveryDate: "2026-06-18", createdAt: "2026-05-02", deliveryDate: "2026-06-18", expectedCloseDate: "2026-06-12" },
  { id: "o39", agencyId: "a4", advertiserId: "a5", contactId: "c4", title: "Ação TV Fama — Lançamento Linha Verão", products: ["TV Fama"], value: 334000, stage: "Fechado", periodMonths: ["2026-Jun", "2026-Jul"], briefing: "Marca de beleza fecha ação para lançamento de linha de verão, com a apresentadora testando produtos ao vivo.", executivo: "Ana Beatriz Souza", responsavel: "Camila Rezende", tipo: "Novo", versao: 1, status: "Comercializado", observacao: "", planDeliveryDate: "2026-06-25", createdAt: "2026-05-15", deliveryDate: "2026-06-25", expectedCloseDate: "2026-06-18" },
  { id: "o40", agencyId: DIRECT_CLIENT_ID, advertiserId: "a6", contactId: "c6", title: "Cota Nordeste Do Povo — Expansão Regional", products: ["Nordeste Do Povo"], value: 276000, stage: "Negado", periodMonths: ["2026-Mai"], briefing: "Proposta de expansão regional recusada após a construtora redirecionar verba para reforço em praça já consolidada.", executivo: "Diego Martins", responsavel: "", tipo: "Novo", versao: 1, status: "Negativado", observacao: "", planDeliveryDate: "2026-05-20", createdAt: "2026-04-15", deliveryDate: "2026-05-20", expectedCloseDate: "2026-05-12" },
  { id: "o41", agencyId: "a2", advertiserId: "a1", contactId: "c2", title: "Patrocínio American Zone — Linha Importados", products: ["American Zone"], value: 401000, stage: "Negado", periodMonths: ["2026-Abr"], briefing: "Cliente optou por não renovar o patrocínio do formato internacional após revisão do portfólio de marcas importadas.", executivo: "Larissa Ferreira", responsavel: "", tipo: "Novo", versao: 1, status: "Negativado", observacao: "", planDeliveryDate: "2026-04-22", createdAt: "2026-03-10", deliveryDate: "2026-04-22", expectedCloseDate: "2026-04-15" },
];

function KpiCard({ label, value, sub }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-xl font-mono font-medium text-slate-800 mt-1">{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
    </div>
  );
}

// Custom tooltip for the Pipeline em Aberto stacked chart: keeps the same
// Frio → Morno → Quente order the bars are stacked in (recharts' default
// tooltip lists them in reverse), and skips the month — it's already the
// bar the person is hovering, so repeating it in the box is redundant.
function StageStackTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const order = ["Frio", "Morno", "Quente"];
  const items = order.map((key) => payload.find((p) => p.dataKey === key)).filter(Boolean);
  if (items.length === 0) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-md shadow-sm px-3 py-2 flex flex-col gap-1">
      {items.map((item) => (
        <div key={item.dataKey} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
          <span className="text-slate-500">{item.name}</span>
          <span className="font-mono text-slate-800 ml-auto">{formatBRL(item.value)}</span>
        </div>
      ))}
    </div>
  );
}

// Tooltip do Resultado Mensal: mostra Faturamento, Pipeline e Meta (na
// ordem em que aparecem empilhados/no gráfico) e, junto, o GAP daquele mês
// específico (Faturamento + Pipeline - Meta) — verde se positivo, vermelho
// se negativo.
function ResultadoMensalTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const order = ["Faturamento", "Pipeline", "Meta"];
  const items = order.map((key) => payload.find((p) => p.dataKey === key)).filter(Boolean);
  if (items.length === 0) return null;
  const faturamento = items.find((i) => i.dataKey === "Faturamento")?.value || 0;
  const pipeline = items.find((i) => i.dataKey === "Pipeline")?.value || 0;
  const meta = items.find((i) => i.dataKey === "Meta")?.value || 0;
  const hasMeta = items.some((i) => i.dataKey === "Meta");
  const gap = faturamento + pipeline - meta;
  return (
    <div className="bg-white border border-slate-200 rounded-md shadow-sm px-3 py-2 flex flex-col gap-1">
      {items.map((item) => (
        <div key={item.dataKey} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
          <span className="text-slate-500">{item.name}</span>
          <span className="font-mono text-slate-800 ml-auto">{formatBRL(item.value)}</span>
        </div>
      ))}
      {hasMeta && (
        <div className="flex items-center gap-2 text-xs border-t border-slate-100 pt-1 mt-0.5">
          <span className="text-slate-500">GAP</span>
          <span className={"font-mono ml-auto " + (gap < 0 ? "text-rose-600" : "text-emerald-600")}>{formatBRL(gap)}</span>
        </div>
      )}
    </div>
  );
}

// Tooltip do gráfico Resultado: nas colunas Meta e Faturado o valor já está
// no rótulo em cima da barra, então não repetimos nada. Só a coluna GAP
// mostra o detalhamento — quanto do buraco para a meta já está coberto por
// Pipeline ponderado e quanto ainda precisa ser produzido do zero.
function ResultadoTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length || label !== "GAP") return null;
  const order = ["Pipeline", "AProduzir"];
  const items = order.map((key) => payload.find((p) => p.dataKey === key)).filter(Boolean);
  if (items.length === 0) return null;
  const nameMap = { Pipeline: "Pipeline (cobre o GAP)", AProduzir: "A produzir" };
  const totalGap = items.reduce((s, i) => s + (i.value || 0), 0);
  return (
    <div className="bg-white border border-slate-200 rounded-md shadow-sm px-3 py-2 flex flex-col gap-1">
      <div className="text-xs text-slate-500 font-medium border-b border-slate-100 pb-1 mb-0.5">GAP: {formatBRL(totalGap)}</div>
      {items.map((item) => (
        <div key={item.dataKey} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
          <span className="text-slate-500">{nameMap[item.dataKey]}</span>
          <span className="font-mono text-slate-800 ml-auto">{formatBRL(item.value)}</span>
        </div>
      ))}
    </div>
  );
}

// Sinalização de prazo para o Pipeline Planejamento: verde (mais de 24h até
// o deadline), amarelo (dentro da janela de 24h) ou vermelho (prazo
// estourado). Tratamos o deadline como o fim do dia da Data de Entrega.
function DeadlineSignal({ deliveryDate }) {
  if (!deliveryDate) {
    return <span className="text-xs text-slate-300">—</span>;
  }
  const deadline = new Date(`${deliveryDate}T23:59:59`);
  const diffHours = (deadline.getTime() - Date.now()) / (1000 * 60 * 60);
  let color = "bg-emerald-500";
  let label = "No prazo";
  if (diffHours < 0) {
    color = "bg-rose-500";
    label = "Atrasado";
  } else if (diffHours <= 24) {
    color = "bg-amber-400";
    label = "Até 24h";
  }
  return (
    <span className="flex items-center gap-1.5 whitespace-nowrap">
      <span className={"w-2.5 h-2.5 rounded-full shrink-0 " + color} />
      <span className="text-xs text-slate-500">{label}</span>
    </span>
  );
}

// Velocímetro (0–100%) de atingimento da meta. O arco de fundo vai de 0% a
// 100%; o arco colorido preenche até o percentual atingido (limitado
// visualmente a 100%, mesmo que o valor real ultrapasse isso).
function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

function MetaGauge({ percent, positive }) {
  const safePercent = Number.isFinite(percent) ? percent : 0;
  const clamped = Math.max(0, Math.min(100, safePercent));
  const cx = 60;
  const cy = 58;
  const r = 46;
  const startAngle = -90; // 0% — extremo esquerdo
  const endAngleBg = 90; // 100% — extremo direito
  const endAngleFg = -90 + (clamped / 100) * 180;
  const color = positive ? "#059669" : "#e11d48";
  const label = `${Math.round(safePercent)}%`;
  const labelFontSize = label.length > 6 ? 13 : label.length > 4 ? 16 : 20;
  return (
    <svg viewBox="0 0 120 68" width="120" height="68">
      <path
        d={describeArc(cx, cy, r, startAngle, endAngleBg)}
        fill="none"
        stroke="#e2e8f0"
        strokeWidth="10"
        strokeLinecap="round"
      />
      {clamped > 0 && (
        <path
          d={describeArc(cx, cy, r, startAngle, endAngleFg)}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
        />
      )}
      <text x={cx} y={cy - 2} textAnchor="middle" fontSize={labelFontSize} fontFamily="monospace" fontWeight="500" fill={color}>
        {label}
      </text>
    </svg>
  );
}

// Searchable client field: filters advertisers/agencies of the given type
// as the person types, and offers to open the client-registration modal
// when the search comes up empty.
function ClientSearchField({ label, type, advertisers, valueId, onSelect, onCreateNew, placeholder, required, directOption }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const selected = directOption && valueId === directOption.id ? directOption : advertisers.find((a) => a.id === valueId);
  const pool = advertisers.filter((a) => a.type === type);
  const q = query.trim().toLowerCase();
  const results = q
    ? pool.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          (a.razaoSocial || "").toLowerCase().includes(q)
      )
    : pool;

  return (
    <div className="relative">
      <label className="text-xs text-slate-500 mb-1 block">{label}</label>
      {selected ? (
        <div className="flex items-center justify-between border border-slate-200 rounded-md px-3 py-2 text-sm bg-slate-50">
          <span className="text-slate-700">{selected.name}</span>
          <button type="button" onClick={() => onSelect("")} className="text-slate-400 hover:text-slate-700">
            <X size={14} />
          </button>
        </div>
      ) : (
        <>
          <input
            type="text"
            required={required}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder={placeholder}
            className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
          />
          {open && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-md shadow-sm max-h-56 overflow-y-auto">
              {directOption && (
                <button
                  type="button"
                  onMouseDown={() => {
                    onSelect(directOption.id);
                    setQuery("");
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 text-slate-700 font-medium border-b border-slate-100"
                >
                  {directOption.name}
                </button>
              )}
              {results.length > 0 ? (
                results.map((a) => (
                  <button
                    type="button"
                    key={a.id}
                    onMouseDown={() => {
                      onSelect(a.id);
                      setQuery("");
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 text-slate-700"
                  >
                    {a.name}
                  </button>
                ))
              ) : (
                <div className="p-3 flex flex-col gap-2">
                  <span className="text-xs text-slate-400">Nenhum resultado para "{query}".</span>
                  <button
                    type="button"
                    onMouseDown={() => onCreateNew(query)}
                    className="text-xs text-rose-600 hover:text-rose-700 font-medium text-left"
                  >
                    + Cadastrar novo cliente
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Searchable multi-select client field: used both on the Agência side
// (choosing which Anunciantes it serves) and the Anunciante side
// (choosing which Agências represent it) — same underlying relationship,
// entered from either direction.
function MultiClientSearchField({ label, type, advertisers, selectedIds, onChange, placeholder, onCreateNew }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const pool = advertisers.filter((a) => a.type === type && !selectedIds.includes(a.id));
  const q = query.trim().toLowerCase();
  const results = q
    ? pool.filter((a) => a.name.toLowerCase().includes(q) || (a.razaoSocial || "").toLowerCase().includes(q))
    : pool;
  const selectedItems = selectedIds.map((id) => advertisers.find((a) => a.id === id)).filter(Boolean);

  return (
    <div>
      <label className="text-xs text-slate-500 mb-1 block">{label}</label>
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-1.5">
          {selectedItems.map((a) => (
            <span key={a.id} className="text-xs bg-rose-50 border border-rose-200 text-rose-700 pl-2 pr-1 py-0.5 rounded-md flex items-center gap-1">
              {a.name}
              <button type="button" onClick={() => onChange(selectedIds.filter((id) => id !== a.id))} className="hover:text-rose-900">
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
        />
        {open && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-md shadow-sm max-h-48 overflow-y-auto">
            {results.length > 0 ? (
              results.map((a) => (
                <button
                  type="button"
                  key={a.id}
                  onMouseDown={() => {
                    onChange([...selectedIds, a.id]);
                    setQuery("");
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 text-slate-700"
                >
                  {a.name}
                </button>
              ))
            ) : (
              <div className="p-3 flex flex-col gap-2">
                <span className="text-xs text-slate-400">Nenhum resultado para "{query}".</span>
                {onCreateNew && (
                  <button
                    type="button"
                    onMouseDown={() => onCreateNew(query)}
                    className="text-xs text-rose-600 hover:text-rose-700 font-medium text-left"
                  >
                    + Cadastrar {type}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Searchable single-select for Contato, scoped to whichever contacts are
// available for the selected Agência/Anunciante. Offers to register a new
// contact inline when the search comes up empty — same pattern as the
// client search fields.
function ContactSearchField({ label, options, valueId, onSelect, onCreateNew, disabled }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const selected = options.find((c) => c.id === valueId);
  const q = query.trim().toLowerCase();
  const results = q
    ? options.filter((c) => c.name.toLowerCase().includes(q) || (c.cargo || "").toLowerCase().includes(q))
    : options;

  return (
    <div className="relative">
      <label className="text-xs text-slate-500 mb-1 block">{label}</label>
      {selected ? (
        <div className="flex items-center justify-between border border-slate-200 rounded-md px-3 py-2 text-sm bg-slate-50">
          <span className="text-slate-700">{selected.name} — {selected.cargo} ({selected.ownerName})</span>
          <button type="button" onClick={() => onSelect("")} className="text-slate-400 hover:text-slate-700">
            <X size={14} />
          </button>
        </div>
      ) : (
        <>
          <input
            type="text"
            disabled={disabled}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder={disabled ? "Selecione agência ou anunciante primeiro" : "Buscar contato..."}
            className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-400"
          />
          {open && !disabled && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-md shadow-sm max-h-48 overflow-y-auto">
              {results.length > 0 ? (
                results.map((c) => (
                  <button
                    type="button"
                    key={c.id}
                    onMouseDown={() => {
                      onSelect(c.id);
                      setQuery("");
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 text-slate-700"
                  >
                    {c.name} — {c.cargo} ({c.ownerName})
                  </button>
                ))
              ) : (
                <div className="p-3 flex flex-col gap-2">
                  <span className="text-xs text-slate-400">Nenhum contato encontrado{query ? ` para "${query}"` : ""}.</span>
                  <button
                    type="button"
                    onMouseDown={() => onCreateNew(query)}
                    className="text-xs text-rose-600 hover:text-rose-700 font-medium text-left"
                  >
                    + Cadastrar Contato
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Company search for the Novo Contato form — bilateral in the sense that it
// searches Agências and Anunciantes together in one field (a contact can
// belong to either), with a create-new fallback when nothing matches.
function AnyClientSearchField({ label, advertisers, valueId, onSelect, onCreateNew, placeholder }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const selected = advertisers.find((a) => a.id === valueId);
  const q = query.trim().toLowerCase();
  const results = q
    ? advertisers.filter((a) => a.name.toLowerCase().includes(q) || (a.razaoSocial || "").toLowerCase().includes(q))
    : advertisers;

  return (
    <div className="relative">
      <label className="text-xs text-slate-500 mb-1 block">{label}</label>
      {selected ? (
        <div className="flex items-center justify-between border border-slate-200 rounded-md px-3 py-2 text-sm bg-slate-50">
          <span className="text-slate-700">{selected.name} <span className="text-slate-400">({selected.type})</span></span>
          <button type="button" onClick={() => onSelect("")} className="text-slate-400 hover:text-slate-700">
            <X size={14} />
          </button>
        </div>
      ) : (
        <>
          <input
            type="text"
            required
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder={placeholder}
            className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
          />
          {open && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-md shadow-sm max-h-48 overflow-y-auto">
              {results.length > 0 ? (
                results.map((a) => (
                  <button
                    type="button"
                    key={a.id}
                    onMouseDown={() => {
                      onSelect(a.id);
                      setQuery("");
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 text-slate-700"
                  >
                    {a.name} <span className="text-slate-400">({a.type})</span>
                  </button>
                ))
              ) : (
                <div className="p-3 flex flex-col gap-2">
                  <span className="text-xs text-slate-400">Nenhum resultado para "{query}".</span>
                  <button
                    type="button"
                    onMouseDown={() => onCreateNew(query)}
                    className="text-xs text-rose-600 hover:text-rose-700 font-medium text-left"
                  >
                    + Cadastrar Cliente
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Multi-select segment filter for the Pipeline board. Uses a full-screen
// transparent click-catcher (same pattern as the app's modals) to close
// the panel on outside click, which is more reliable than blur timeouts
// for a list of checkboxes.
// Generic multi-select filter dropdown, used by the Pipeline board for
// Segmento, Produtos, and Agência. `options` is [{value, label}].
function MultiSelectFilterButton({ label, options, selected, onChange, searchPlaceholder }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const visibleOptions = query.trim()
    ? options.filter((opt) => opt.label.toLowerCase().includes(query.trim().toLowerCase()))
    : options;
  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => {
          setQuery("");
          setOpen((v) => !v);
        }}
        className={
          "flex items-center gap-1.5 text-xs border rounded-md px-3 py-1.5 " +
          (selected.length > 0
            ? "bg-rose-50 border-rose-300 text-rose-700"
            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50")
        }
      >
        <Filter size={13} />
        {label}{selected.length > 0 ? ` (${selected.length})` : ""}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1 w-64 bg-white border border-slate-200 rounded-md shadow-sm p-2 max-h-80 overflow-y-auto">
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder || `Buscar ${label.toLowerCase()}...`}
              className="w-full border border-slate-200 rounded-md px-2 py-1 text-xs mb-1"
            />
            {selected.length > 0 && (
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-xs text-rose-600 hover:text-rose-700 mb-1 px-1"
              >
                Limpar filtros
              </button>
            )}
            {visibleOptions.length === 0 && (
              <div className="text-xs text-slate-400 px-1.5 py-1">
                {options.length === 0 ? "Nenhuma opção disponível." : `Nenhum resultado para "${query}".`}
              </div>
            )}
            <div className="flex flex-col gap-0.5">
              {visibleOptions.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 text-xs px-1.5 py-1 hover:bg-slate-50 rounded cursor-pointer text-slate-600">
                  <input
                    type="checkbox"
                    checked={selected.includes(opt.value)}
                    onChange={() => onChange(toggleArrayValue(selected, opt.value))}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Month/year filter for the Pipeline board. Year tabs switch which year's
// month grid is shown, matching the picker used in the opportunity form —
// selections from other years stay intact when switching tabs.
function PeriodFilterButton({ selected, onChange }) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(CURRENT_YEAR);
  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={
          "flex items-center gap-1.5 text-xs border rounded-md px-3 py-1.5 " +
          (selected.length > 0
            ? "bg-rose-50 border-rose-300 text-rose-700"
            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50")
        }
      >
        <Filter size={13} />
        Mês{selected.length > 0 ? ` (${selected.length})` : ""}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1 w-72 bg-white border border-slate-200 rounded-md shadow-sm p-2">
            {selected.length > 0 && (
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-xs text-rose-600 hover:text-rose-700 mb-2 px-1"
              >
                Limpar filtros
              </button>
            )}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {YEARS.map((y) => (
                <button
                  type="button"
                  key={y}
                  onClick={() => setViewYear(y)}
                  className={
                    "text-xs border rounded-md px-2 py-1 " +
                    (viewYear === y ? "bg-slate-900 border-slate-900 text-white" : "border-slate-200 text-slate-600")
                  }
                >
                  {y}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {MONTHS.map((m) => {
                const code = `${viewYear}-${m}`;
                return (
                  <label
                    key={m}
                    className={
                      "flex items-center justify-center text-xs border rounded-md px-2 py-1 cursor-pointer " +
                      (selected.includes(code) ? "bg-rose-50 border-rose-300 text-rose-700" : "border-slate-200 text-slate-600")
                    }
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={selected.includes(code)}
                      onChange={() => onChange(toggleArrayValue(selected, code))}
                    />
                    {m}
                  </label>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Supabase — persistência real, no lugar do window.storage do artefato.
// Chave "publishable" (pública), protegida pelas políticas de RLS do banco.
// ---------------------------------------------------------------------------
const SUPABASE_URL = "https://ybynuyzwboqurotievid.supabase.co";
const SUPABASE_KEY = "sb_publishable_U-wJS8MH5oMn_zubUFClZQ_kcbIVhqm";

async function supaFetch(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Supabase ${options.method || "GET"} ${path} falhou: ${res.status} ${text}`);
  }
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// --- clients ---------------------------------------------------------------
function clientToRow(a) {
  return {
    id: a.id,
    codigo: a.codigo || null,
    razao_social: a.razaoSocial || a.name || "",
    cnpj: a.cnpj || null,
    nome_fantasia: a.nomeFantasia || a.name || null,
    type: a.type,
    segmento: a.segmento || null,
  };
}
function rowToClient(r, links) {
  return {
    id: r.id,
    codigo: r.codigo || "",
    razaoSocial: r.razao_social || "",
    cnpj: r.cnpj || "",
    nomeFantasia: r.nome_fantasia || "",
    name: r.nome_fantasia || r.razao_social || "",
    type: r.type,
    segmento: r.segmento || "",
    atendeAnunciantes: links.filter((l) => l.agency_id === r.id).map((l) => l.advertiser_id),
    contacts: [],
    interactions: [],
  };
}

// --- contacts ----------------------------------------------------------
function contactToRow(c) {
  return {
    id: c.id,
    client_id: c.clientId || null,
    name: c.name,
    cargo: c.cargo || null,
    departamento: c.departamento || null,
    nivel_decisao: c.nivelDecisao || null,
    celular: c.celular || null,
    email: c.email || null,
    esportes: c.esportes || [],
    esportes_outro: c.esportesOutro || null,
    hobbies: c.hobbies || [],
    hobbies_outro: c.hobbiesOutro || null,
    time_coracao: c.timeCoracao || null,
    filhos: c.filhos === "" || c.filhos === undefined || c.filhos === null ? null : c.filhos,
  };
}
function rowToContact(r) {
  return {
    id: r.id,
    clientId: r.client_id,
    name: r.name,
    cargo: r.cargo || "",
    departamento: r.departamento || "",
    nivelDecisao: r.nivel_decisao || "",
    celular: r.celular || "",
    email: r.email || "",
    esportes: r.esportes || [],
    esportesOutro: r.esportes_outro || "",
    hobbies: r.hobbies || [],
    hobbiesOutro: r.hobbies_outro || "",
    timeCoracao: r.time_coracao || "",
    filhos: r.filhos === null || r.filhos === undefined ? "" : r.filhos,
  };
}

// --- opportunities -------------------------------------------------------
function oppToRow(o) {
  return {
    id: o.id,
    title: o.title,
    agency_id: o.agencyId && o.agencyId !== DIRECT_CLIENT_ID ? o.agencyId : null,
    advertiser_id: o.advertiserId,
    contact_id: o.contactId || null,
    products: o.products || [],
    value: o.value || 0,
    stage: o.stage,
    period_months: o.periodMonths || [],
    briefing: o.briefing || null,
    data_criacao: o.createdAt || null,
    data_entrega: o.deliveryDate || null,
    previsao_fechamento: o.expectedCloseDate || null,
  };
}
function rowToOpp(r) {
  return {
    id: r.id,
    title: r.title,
    agencyId: r.agency_id || DIRECT_CLIENT_ID,
    advertiserId: r.advertiser_id,
    contactId: r.contact_id,
    products: r.products || [],
    value: Number(r.value) || 0,
    stage: r.stage,
    periodMonths: r.period_months || [],
    briefing: r.briefing || "",
    createdAt: r.data_criacao || "",
    deliveryDate: r.data_entrega || "",
    expectedCloseDate: r.previsao_fechamento || "",
  };
}

// --- sent proposals --------------------------------------------------------
function proposalToRow(p) {
  return {
    id: p.id,
    template_id: p.templateId,
    contact_id: p.contactId,
    opportunity_id: p.opportunityId || null,
    sent_at: p.sentAt || new Date().toISOString(),
  };
}
function rowToProposal(r) {
  return {
    id: r.id,
    templateId: r.template_id,
    contactId: r.contact_id,
    opportunityId: r.opportunity_id,
    sentAt: r.sent_at,
  };
}

// Full-state sync: upserts everything currently in memory into Supabase.
// Simpler and safer to get right in one pass than converting every single
// mutation handler into its own network call — fine at this data volume.
async function syncAllToSupabase(advertisers, contacts, opportunities, proposals) {
  const clientRows = advertisers.map(clientToRow);
  if (clientRows.length) {
    await supaFetch("/clients?on_conflict=id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify(clientRows),
    });
  }

  const linkRows = [];
  advertisers.forEach((a) => {
    if (a.type === "Agência") {
      (a.atendeAnunciantes || []).forEach((advId) => linkRows.push({ agency_id: a.id, advertiser_id: advId }));
    }
  });
  if (linkRows.length) {
    await supaFetch("/agency_links?on_conflict=agency_id,advertiser_id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify(linkRows),
    });
  }

  const contactRows = contacts.map(contactToRow);
  if (contactRows.length) {
    await supaFetch("/contacts?on_conflict=id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify(contactRows),
    });
  }

  const oppRows = opportunities.map(oppToRow);
  if (oppRows.length) {
    await supaFetch("/opportunities?on_conflict=id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify(oppRows),
    });
  }

  const proposalRows = proposals.map(proposalToRow);
  if (proposalRows.length) {
    await supaFetch("/sent_proposals?on_conflict=id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify(proposalRows),
    });
  }
}

export default function App() {
  const [advertisers, setAdvertisers] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const [view, setView] = useState("dashboard");
  const [selectedAdvertiserId, setSelectedAdvertiserId] = useState(null);
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [showNewAdvertiser, setShowNewAdvertiser] = useState(false);
  const [showNewOpportunity, setShowNewOpportunity] = useState(false);
  const [pendingOppClientField, setPendingOppClientField] = useState(null);
  const [pendingOppContact, setPendingOppContact] = useState(false);
  const [showQuickCreateClient, setShowQuickCreateClient] = useState(false);
  const [pendingContactClient, setPendingContactClient] = useState(false);
  const [editingClientId, setEditingClientId] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [faturamentoEfetivo, setFaturamentoEfetivo] = useState(seedFaturamentoEfetivo);
  const [monthlyMetas, setMonthlyMetas] = useState(seedMetas);
  const [executivos, setExecutivos] = useState(seedExecutivos);
  const [segmentoExecutivo, setSegmentoExecutivo] = useState(seedSegmentoExecutivo);
  const [showNewExecutivo, setShowNewExecutivo] = useState(false);
  const [newExecutivoForm, setNewExecutivoForm] = useState({ nome: "" });
  const [editingCarteiraId, setEditingCarteiraId] = useState(null);
  const [expandedClientsId, setExpandedClientsId] = useState(null);
  const [executivoYear, setExecutivoYear] = useState(2026);
  const [quickCreateType, setQuickCreateType] = useState("Anunciante");
  const [quickCreateTargetField, setQuickCreateTargetField] = useState(null);
  const [quickCreateCodigo, setQuickCreateCodigo] = useState("");
  const [quickCreateRazaoSocial, setQuickCreateRazaoSocial] = useState("");
  const [quickCreateCnpj, setQuickCreateCnpj] = useState("");
  const [quickCreateName, setQuickCreateName] = useState("");
  const [quickCreateSegmento, setQuickCreateSegmento] = useState("");
  const [showNewContact, setShowNewContact] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [tvExpanded, setTvExpanded] = useState(false);
  const [digitalExpanded, setDigitalExpanded] = useState(false);
  const [specialExpanded, setSpecialExpanded] = useState(false);
  const [periodViewYear, setPeriodViewYear] = useState(CURRENT_YEAR);
  const [segmentFilter, setSegmentFilter] = useState([]);
  const [productFilter, setProductFilter] = useState([]);
  const [agencyFilter, setAgencyFilter] = useState([]);
  const [monthFilter, setMonthFilter] = useState([]);
  const [dashboardYear, setDashboardYear] = useState(2026);
  const [dashboardMonths, setDashboardMonths] = useState([]);
  const [dashboardSegmentFilter, setDashboardSegmentFilter] = useState([]);
  const [dashboardProductFilter, setDashboardProductFilter] = useState([]);
  const [dashboardAgencyFilter, setDashboardAgencyFilter] = useState([]);
  const [dashboardAdvertiserFilter, setDashboardAdvertiserFilter] = useState([]);
  const [dashboardExecutivoFilter, setDashboardExecutivoFilter] = useState([]);
  const [noteDraft, setNoteDraft] = useState("");
  const [summarizingId, setSummarizingId] = useState(null);
  const [showSendProposal, setShowSendProposal] = useState(false);
  const [sendProposalTemplateId, setSendProposalTemplateId] = useState(null);
  const [sendProposalContactId, setSendProposalContactId] = useState("");
  const [sendProposalOppId, setSendProposalOppId] = useState("");
  const [highlightedOppId, setHighlightedOppId] = useState(null);
  const [selectedOppId, setSelectedOppId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const [newAdvForm, setNewAdvForm] = useState({
    type: "Anunciante",
    codigo: "",
    razaoSocial: "",
    cnpj: "",
    nomeFantasia: "",
    segmento: "",
    atendeAnunciantes: [],
    vinculoAgencias: [],
  });
  const [newOppForm, setNewOppForm] = useState(emptyOppForm());
  const [newContactForm, setNewContactForm] = useState({
    name: "",
    clientId: "",
    cargo: "",
    departamento: "",
    nivelDecisao: "",
    celular: "",
    email: "",
    hobbies: [],
    hobbiesOutro: "",
    esportes: [],
    esportesOutro: "",
    timeCoracao: "",
    filhos: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_KEY, false);
        if (res && res.value) {
          const parsed = JSON.parse(res.value);
          const normalizedAdvertisers = (parsed.advertisers || seedAdvertisers).map(normalizeAdvertiser);
          setAdvertisers(normalizedAdvertisers);
          const loadedOpps = (parsed.opportunities || seedOpportunities).map(normalizeOpportunity);
          const loadedOppIds = new Set(loadedOpps.map((o) => o.id));
          const missingSeedOpps = seedOpportunities
            .filter((o) => !loadedOppIds.has(o.id))
            .map(normalizeOpportunity);
          const mergedOpps = missingSeedOpps.length ? [...loadedOpps, ...missingSeedOpps] : loadedOpps;
          // "Mega Sonho" opportunities were cleared out of the pipeline —
          // purge any that are still sitting in previously saved data.
          setOpportunities(mergedOpps.filter((o) => !(o.products || []).includes("Mega Sonho")));
          setProposals(parsed.proposals || []);
          setFaturamentoEfetivo(Array.isArray(parsed.faturamentoEfetivo) ? parsed.faturamentoEfetivo : seedFaturamentoEfetivo);
          setMonthlyMetas(parsed.monthlyMetas && typeof parsed.monthlyMetas === "object" ? parsed.monthlyMetas : seedMetas);
          setExecutivos(Array.isArray(parsed.executivos) ? parsed.executivos : seedExecutivos);
          setSegmentoExecutivo(parsed.segmentoExecutivo && typeof parsed.segmentoExecutivo === "object" ? parsed.segmentoExecutivo : seedSegmentoExecutivo);
          setContacts(
            Array.isArray(parsed.contacts)
              ? parsed.contacts.map(normalizeContact)
              : deriveContactsFromAdvertisers(normalizedAdvertisers).length
              ? deriveContactsFromAdvertisers(normalizedAdvertisers)
              : seedContacts.map(normalizeContact)
          );
        } else {
          setAdvertisers(seedAdvertisers.map(normalizeAdvertiser));
          setOpportunities(seedOpportunities.map(normalizeOpportunity));
          setContacts(seedContacts.map(normalizeContact));
        }
      } catch (e) {
        setAdvertisers(seedAdvertisers.map(normalizeAdvertiser));
        setOpportunities(seedOpportunities.map(normalizeOpportunity));
        setContacts(seedContacts.map(normalizeContact));
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(async () => {
      try {
        await window.storage.set(
          STORAGE_KEY,
          JSON.stringify({ advertisers, opportunities, proposals, contacts, faturamentoEfetivo, monthlyMetas, executivos, segmentoExecutivo }),
          false
        );
      } catch (e) {
        // silent — local state still holds the data for this session
      }
    }, 400);
    return () => clearTimeout(t);
  }, [advertisers, opportunities, proposals, contacts, faturamentoEfetivo, monthlyMetas, executivos, segmentoExecutivo, loaded]);

  useEffect(() => {
    if (!highlightedOppId || view !== "pipeline") return;
    const el = document.getElementById(`opp-card-${highlightedOppId}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    const t = setTimeout(() => setHighlightedOppId(null), 2500);
    return () => clearTimeout(t);
  }, [highlightedOppId, view]);

  function goToOpportunityInPipeline(oppId) {
    setSelectedAdvertiserId(null);
    setSelectedContactId(null);
    setView("pipeline");
    setHighlightedOppId(oppId);
  }

  function updateStage(oppId, newStage) {
    setOpportunities((prev) =>
      prev.map((o) => (o.id === oppId ? { ...o, stage: newStage } : o))
    );
  }

  function updatePlanningField(oppId, field, value) {
    setOpportunities((prev) =>
      prev.map((o) => (o.id === oppId ? { ...o, [field]: value } : o))
    );
  }

  function openCreateClientForOpportunity(fieldTarget, type, prefillName) {
    setNewAdvForm({
      type,
      codigo: "",
      razaoSocial: "",
      cnpj: "",
      nomeFantasia: prefillName || "",
      segmento: "",
      atendeAnunciantes: [],
      vinculoAgencias: [],
    });
    setPendingOppClientField(fieldTarget);
    setShowNewAdvertiser(true);
  }

  function openCreateClientForContact(prefillName) {
    setNewAdvForm({
      type: "Anunciante",
      codigo: "",
      razaoSocial: "",
      cnpj: "",
      nomeFantasia: prefillName || "",
      segmento: "",
      atendeAnunciantes: [],
      vinculoAgencias: [],
    });
    setPendingContactClient(true);
    setShowNewAdvertiser(true);
  }

  function closeNewAdvertiser() {
    setShowNewAdvertiser(false);
    setPendingOppClientField(null);
    setPendingContactClient(false);
    setEditingClientId(null);
  }

  function openEditClient(client) {
    const vinculoAgencias =
      client.type === "Anunciante"
        ? advertisers.filter((a) => a.type === "Agência" && (a.atendeAnunciantes || []).includes(client.id)).map((a) => a.id)
        : [];
    setNewAdvForm({
      type: client.type,
      codigo: client.codigo || "",
      razaoSocial: client.razaoSocial || "",
      cnpj: client.cnpj || "",
      nomeFantasia: client.nomeFantasia || "",
      segmento: client.segmento || "",
      atendeAnunciantes: client.type === "Agência" ? client.atendeAnunciantes || [] : [],
      vinculoAgencias,
    });
    setEditingClientId(client.id);
    setSelectedAdvertiserId(null);
    setShowNewAdvertiser(true);
  }

  function addAdvertiser(e) {
    e.preventDefault();
    if (!newAdvForm.nomeFantasia.trim() && !newAdvForm.razaoSocial.trim()) return;
    if (newAdvForm.type === "Anunciante" && !newAdvForm.segmento) {
      setErrorMsg("Selecione um segmento para o anunciante.");
      return;
    }
    const displayName = newAdvForm.nomeFantasia.trim() || newAdvForm.razaoSocial.trim();

    if (editingClientId) {
      const clientId = editingClientId;
      setAdvertisers((prev) => {
        let updated = prev.map((a) =>
          a.id === clientId
            ? {
                ...a,
                codigo: newAdvForm.codigo,
                razaoSocial: newAdvForm.razaoSocial,
                cnpj: newAdvForm.cnpj,
                nomeFantasia: newAdvForm.nomeFantasia,
                name: displayName,
                type: newAdvForm.type,
                segmento: newAdvForm.type === "Agência" ? "" : newAdvForm.segmento,
                atendeAnunciantes: newAdvForm.type === "Agência" ? newAdvForm.atendeAnunciantes : a.atendeAnunciantes,
              }
            : a
        );
        // Reconcile bilateral links when editing an Anunciante: add this
        // client to any newly-checked agency, and remove it from any
        // agency that was unchecked.
        if (newAdvForm.type === "Anunciante") {
          updated = updated.map((a) => {
            if (a.type !== "Agência") return a;
            const shouldServe = newAdvForm.vinculoAgencias.includes(a.id);
            const currentlyServes = (a.atendeAnunciantes || []).includes(clientId);
            if (shouldServe && !currentlyServes) {
              return { ...a, atendeAnunciantes: [...(a.atendeAnunciantes || []), clientId] };
            }
            if (!shouldServe && currentlyServes) {
              return { ...a, atendeAnunciantes: (a.atendeAnunciantes || []).filter((id) => id !== clientId) };
            }
            return a;
          });
        }
        return updated;
      });
      setEditingClientId(null);
      setNewAdvForm({
        type: "Anunciante",
        codigo: "",
        razaoSocial: "",
        cnpj: "",
        nomeFantasia: "",
        segmento: "",
        atendeAnunciantes: [],
        vinculoAgencias: [],
      });
      setShowNewAdvertiser(false);
      return;
    }

    const adv = {
      id: uid(),
      codigo: newAdvForm.codigo,
      razaoSocial: newAdvForm.razaoSocial,
      cnpj: newAdvForm.cnpj,
      nomeFantasia: newAdvForm.nomeFantasia,
      name: displayName,
      type: newAdvForm.type,
      segmento: newAdvForm.type === "Agência" ? "" : newAdvForm.segmento,
      atendeAnunciantes: newAdvForm.type === "Agência" ? newAdvForm.atendeAnunciantes : [],
      contacts: [],
      interactions: [],
    };
    setAdvertisers((prev) => {
      // If this new Anunciante was linked to one or more Agências from its
      // own form, write the relationship back onto those agency records
      // too — the link is the same either direction it's entered from.
      const withBacklinks =
        newAdvForm.type === "Anunciante" && newAdvForm.vinculoAgencias.length > 0
          ? prev.map((a) =>
              newAdvForm.vinculoAgencias.includes(a.id) && a.type === "Agência"
                ? { ...a, atendeAnunciantes: a.atendeAnunciantes.includes(adv.id) ? a.atendeAnunciantes : [...a.atendeAnunciantes, adv.id] }
                : a
            )
          : prev;
      return [...withBacklinks, adv];
    });
    if (pendingOppClientField) {
      setNewOppForm((prev) => ({ ...prev, [pendingOppClientField]: adv.id, contactId: "" }));
      setPendingOppClientField(null);
    }
    if (pendingContactClient) {
      setNewContactForm((prev) => ({ ...prev, clientId: adv.id }));
      setPendingContactClient(false);
    }
    setNewAdvForm({
      type: "Anunciante",
      codigo: "",
      razaoSocial: "",
      cnpj: "",
      nomeFantasia: "",
      segmento: "",
      atendeAnunciantes: [],
      vinculoAgencias: [],
    });
    setShowNewAdvertiser(false);
  }

  function getServedAdvertisers(agency) {
    return (agency.atendeAnunciantes || [])
      .map((id) => advertisers.find((a) => a.id === id))
      .filter(Boolean);
  }

  function getServingAgencies(advertiserId) {
    return advertisers.filter((a) => a.type === "Agência" && (a.atendeAnunciantes || []).includes(advertiserId));
  }

  function getAvailableContacts(agencyId, advertiserId) {
    const list = [];
    const agency = advertisers.find((a) => a.id === agencyId);
    const adv = advertisers.find((a) => a.id === advertiserId);
    if (agency) contacts.filter((c) => c.clientId === agency.id).forEach((c) => list.push({ ...c, ownerName: agency.name }));
    if (adv) contacts.filter((c) => c.clientId === adv.id).forEach((c) => list.push({ ...c, ownerName: adv.name }));
    return list;
  }

  function openCreateContactForOpportunity(prefillName) {
    const defaultClientId =
      newOppForm.advertiserId || (newOppForm.agencyId && newOppForm.agencyId !== DIRECT_CLIENT_ID ? newOppForm.agencyId : "");
    setNewContactForm({
      name: prefillName || "",
      clientId: defaultClientId,
      cargo: "",
      departamento: "",
      nivelDecisao: "",
      celular: "",
      email: "",
      hobbies: [],
      hobbiesOutro: "",
      esportes: [],
      esportesOutro: "",
      timeCoracao: "",
      filhos: "",
    });
    setPendingOppContact(true);
    setShowNewContact(true);
  }

  function closeNewContact() {
    setShowNewContact(false);
    setPendingOppContact(false);
  }

  function openQuickCreateClient(type, prefillName, targetField) {
    setQuickCreateType(type);
    setQuickCreateCodigo("");
    setQuickCreateRazaoSocial("");
    setQuickCreateCnpj("");
    setQuickCreateName(prefillName || "");
    setQuickCreateSegmento("");
    setQuickCreateTargetField(targetField);
    setShowQuickCreateClient(true);
  }

  function closeQuickCreateClient() {
    setShowQuickCreateClient(false);
    setQuickCreateTargetField(null);
  }

  function addExecutivo(e) {
    e.preventDefault();
    if (!newExecutivoForm.nome.trim()) return;
    setExecutivos((prev) => [...prev, { id: uid(), nome: newExecutivoForm.nome.trim() }]);
    setNewExecutivoForm({ nome: "" });
    setShowNewExecutivo(false);
  }

  function deleteExecutivo(id) {
    setExecutivos((prev) => prev.filter((e) => e.id !== id));
    // Libera os segmentos que estavam com esse executivo, em vez de deixar
    // a carteira apontando para um id que não existe mais.
    setSegmentoExecutivo((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((seg) => {
        if (next[seg] === id) delete next[seg];
      });
      return next;
    });
    if (editingCarteiraId === id) setEditingCarteiraId(null);
  }

  function assignSegmentoToExecutivo(segmento, executivoId) {
    setSegmentoExecutivo((prev) => {
      const next = { ...prev };
      const current = next[segmento];
      if (current === executivoId) {
        delete next[segmento]; // clicou de novo no mesmo — libera o segmento
      } else {
        next[segmento] = executivoId; // atribui (ou rouba de outro executivo)
      }
      return next;
    });
  }

  async function resetToSeedData() {
    try {
      await window.storage.delete(STORAGE_KEY, false);
    } catch (e) {
      // key may not exist yet — fine, we're resetting either way
    }
    setAdvertisers(seedAdvertisers.map(normalizeAdvertiser));
    setContacts(seedContacts.map(normalizeContact));
    setOpportunities(seedOpportunities.map(normalizeOpportunity));
    setProposals([]);
    setFaturamentoEfetivo(seedFaturamentoEfetivo);
    setMonthlyMetas(seedMetas);
    setExecutivos(seedExecutivos);
    setSegmentoExecutivo(seedSegmentoExecutivo);
    setShowResetConfirm(false);
  }

  function confirmQuickCreateClient(e) {
    e.preventDefault();
    if (!quickCreateName.trim() && !quickCreateRazaoSocial.trim()) return;
    if (quickCreateType === "Anunciante" && !quickCreateSegmento) {
      setErrorMsg("Selecione um segmento para o anunciante.");
      return;
    }
    const displayName = quickCreateName.trim() || quickCreateRazaoSocial.trim();
    const client = {
      id: uid(),
      codigo: quickCreateCodigo,
      razaoSocial: quickCreateRazaoSocial,
      cnpj: quickCreateCnpj,
      nomeFantasia: quickCreateName,
      name: displayName,
      type: quickCreateType,
      segmento: quickCreateType === "Anunciante" ? quickCreateSegmento : "",
      atendeAnunciantes: [],
      contacts: [],
      interactions: [],
    };
    setAdvertisers((prev) => [...prev, client]);
    if (quickCreateTargetField) {
      setNewAdvForm((prev) => ({ ...prev, [quickCreateTargetField]: [...prev[quickCreateTargetField], client.id] }));
    }
    setShowQuickCreateClient(false);
    setQuickCreateTargetField(null);
  }

  function addContact(e) {
    e.preventDefault();
    if (!newContactForm.name.trim() || !newContactForm.clientId) return;
    const contact = {
      id: uid(),
      ...newContactForm,
      name: newContactForm.name.trim(),
      filhos: newContactForm.filhos === "" ? "" : Number(newContactForm.filhos) || 0,
    };
    setContacts((prev) => [...prev, contact]);
    if (pendingOppContact) {
      setNewOppForm((prev) => ({ ...prev, contactId: contact.id }));
      setPendingOppContact(false);
    }
    setNewContactForm({
      name: "",
      clientId: "",
      cargo: "",
      departamento: "",
      nivelDecisao: "",
      celular: "",
      email: "",
      hobbies: [],
      hobbiesOutro: "",
      esportes: [],
      esportesOutro: "",
      timeCoracao: "",
      filhos: "",
    });
    setShowNewContact(false);
  }

  function addOpportunity(e) {
    e.preventDefault();
    if (!newOppForm.title.trim() || !newOppForm.executivo.trim() || !newOppForm.advertiserId || !newOppForm.agencyId) return;
    const contactsForSelection = getAvailableContacts(newOppForm.agencyId, newOppForm.advertiserId);
    if (contactsForSelection.length > 0 && !newOppForm.contactId) {
      setErrorMsg("Selecione um contato.");
      return;
    }
    if (!newOppForm.value) {
      setErrorMsg("Informe o investimento previsto.");
      return;
    }
    if (newOppForm.periodMonths.length === 0) {
      setErrorMsg("Selecione ao menos um mês para o período.");
      return;
    }
    if (!newOppForm.briefing.trim()) {
      setErrorMsg("Preencha o briefing para o planejamento comercial.");
      return;
    }
    if (!newOppForm.deliveryDate || !newOppForm.expectedCloseDate) {
      setErrorMsg("Preencha a data de entrega e a previsão de fechamento.");
      return;
    }
    const opp = {
      id: uid(),
      stage: "Desenvolvimento",
      title: newOppForm.title.trim(),
      executivo: newOppForm.executivo.trim(),
      agencyId: newOppForm.agencyId || null,
      advertiserId: newOppForm.advertiserId,
      contactId: newOppForm.contactId || null,
      products: newOppForm.products,
      value: Number(newOppForm.value) || 0,
      periodMonths: newOppForm.periodMonths,
      briefing: newOppForm.briefing.trim(),
      createdAt: newOppForm.createdAt,
      deliveryDate: newOppForm.deliveryDate,
      expectedCloseDate: newOppForm.expectedCloseDate,
      // Pipeline Planejamento — preenchidos depois pelo time de planejamento comercial.
      responsavel: "",
      tipo: "Novo",
      versao: 1,
      status: "Pendente",
      observacao: "",
      planDeliveryDate: "",
    };
    setOpportunities((prev) => [...prev, opp]);
    setNewOppForm(emptyOppForm());
    setShowNewOpportunity(false);
  }

  function addInteraction(advertiserId) {
    if (!noteDraft.trim()) return;
    const interaction = {
      id: uid(),
      date: todayStr(),
      note: noteDraft.trim(),
      aiSummary: null,
      aiNextAction: null,
      aiRisk: null,
    };
    setAdvertisers((prev) =>
      prev.map((a) =>
        a.id === advertiserId
          ? { ...a, interactions: [interaction, ...a.interactions] }
          : a
      )
    );
    setNoteDraft("");
  }

  async function summarizeInteraction(advertiserId, interactionId) {
    setSummarizingId(interactionId);
    setErrorMsg("");
    try {
      const advertiser = advertisers.find((a) => a.id === advertiserId);
      const interaction = advertiser.interactions.find((i) => i.id === interactionId);
      const history = advertiser.interactions
        .filter((i) => i.id !== interactionId)
        .slice(0, 3)
        .map((i) => `- ${i.date}: ${i.note}`)
        .join("\n");
      const userPrompt = `Anunciante/Agência: ${advertiser.name} (${advertiser.segmento})
Interação mais recente: "${interaction.note}"
Histórico anterior:
${history || "Nenhum"}

Responda apenas com um JSON válido, sem markdown, no formato exato: {"resumo": "...", "proxima_acao": "...", "risco": "baixo|médio|alto"}`;
      const text = await callClaude(
        "Você é um assistente de vendas de mídia para uma emissora de TV brasileira, ajudando a equipe comercial a gerenciar o relacionamento com anunciantes e agências.",
        userPrompt
      );
      const clean = text.replace(/```json|```/g, "").trim();
      let parsed;
      try {
        parsed = JSON.parse(clean);
      } catch (err) {
        parsed = { resumo: clean, proxima_acao: "", risco: "" };
      }
      setAdvertisers((prev) =>
        prev.map((a) =>
          a.id !== advertiserId
            ? a
            : {
                ...a,
                interactions: a.interactions.map((i) =>
                  i.id === interactionId
                    ? {
                        ...i,
                        aiSummary: parsed.resumo,
                        aiNextAction: parsed.proxima_acao,
                        aiRisk: parsed.risco,
                      }
                    : i
                ),
              }
        )
      );
    } catch (e) {
      setErrorMsg("Não foi possível gerar o resumo agora. Tente novamente.");
    } finally {
      setSummarizingId(null);
    }
  }

  function openSendProposal(templateId) {
    setSendProposalTemplateId(templateId);
    setSendProposalContactId("");
    setSendProposalOppId("");
    setShowSendProposal(true);
  }

  function downloadProposalPdf(template) {
    const link = document.createElement("a");
    link.href = template.pdfDataUri;
    link.download = template.pdfFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function confirmProposalSent() {
    const template = PROPOSAL_TEMPLATES.find((t) => t.id === sendProposalTemplateId);
    const contact = contacts.find((c) => c.id === sendProposalContactId);
    if (!template || !contact) return;
    downloadProposalPdf(template);
    const proposal = {
      id: uid(),
      templateId: template.id,
      contactId: contact.id,
      opportunityId: sendProposalOppId || null,
      sentAt: new Date().toISOString(),
    };
    setProposals((prev) => [proposal, ...prev]);
    setShowSendProposal(false);
    setView("proposals");
  }

  if (!loaded) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-slate-400" size={28} />
      </div>
    );
  }

  const openOpps = opportunities.filter(
    (o) => o.stage !== "Fechado" && o.stage !== "Negado"
  );
  const pipelineOpportunities = opportunities.filter((o) => {
    if (segmentFilter.length > 0) {
      const adv = advertisers.find((a) => a.id === o.advertiserId);
      if (!adv || !segMatches(segmentFilter, adv.segmento)) return false;
    }
    if (productFilter.length > 0) {
      if (!(o.products || []).some((p) => productFilter.includes(p))) return false;
    }
    if (agencyFilter.length > 0) {
      if (!agencyFilter.includes(o.agencyId)) return false;
    }
    if (monthFilter.length > 0) {
      if (!(o.periodMonths || []).some((m) => monthFilter.includes(m))) return false;
    }
    return true;
  });

  function sortByDeadline(opps) {
    return opps.slice().sort((a, b) => new Date(a.deliveryDate || "9999-12-31") - new Date(b.deliveryDate || "9999-12-31"));
  }
  const PLANNING_FINALIZADA_ORDER = ["Comercializado", "Negativado", "Cancelado"];
  const planningGroups = [
    {
      label: "Em Aberto",
      rows: sortByDeadline(opportunities.filter((o) => ["Pendente", "Desenvolvimento", "Aprovação"].includes(o.status))),
    },
    {
      label: "Entregue",
      rows: sortByDeadline(opportunities.filter((o) => o.status === "Entregue")),
    },
    {
      label: "Finalizado",
      rows: opportunities
        .filter((o) => PLANNING_FINALIZADA_ORDER.includes(o.status))
        .slice()
        .sort((a, b) => {
          const diff = PLANNING_FINALIZADA_ORDER.indexOf(a.status) - PLANNING_FINALIZADA_ORDER.indexOf(b.status);
          if (diff !== 0) return diff;
          return new Date(a.deliveryDate || "9999-12-31") - new Date(b.deliveryDate || "9999-12-31");
        }),
    },
  ];

  const agencyFilterOptions = [
    { value: DIRECT_CLIENT_ID, label: DIRECT_CLIENT_OPTION.name },
    ...advertisers.filter((a) => a.type === "Agência").map((a) => ({ value: a.id, label: a.name })),
  ];

  const advertiserFilterOptions = advertisers
    .filter((a) => a.type === "Anunciante")
    .map((a) => ({ value: a.id, label: a.name }));

  const pipelineActiveFilters = [
    ...segmentFilter.map((v) => ({ type: "Segmento", label: v, clear: () => setSegmentFilter(segmentFilter.filter((x) => x !== v)) })),
    ...productFilter.map((v) => ({ type: "Produto", label: v, clear: () => setProductFilter(productFilter.filter((x) => x !== v)) })),
    ...agencyFilter.map((v) => {
      const opt = agencyFilterOptions.find((o) => o.value === v);
      return { type: "Agência", label: opt ? opt.label : v, clear: () => setAgencyFilter(agencyFilter.filter((x) => x !== v)) };
    }),
    ...monthFilter.map((v) => {
      const [y, m] = v.split("-");
      return { type: "Mês", label: `${m}/${y}`, clear: () => setMonthFilter(monthFilter.filter((x) => x !== v)) };
    }),
  ];
  // Visão Geral: everything below is scoped to the selected year, matched
  // against each opportunity's periodMonths ("AAAA-Mês" codes).
  // Filtro de Executivo: traduzido para os segmentos da carteira dele —
  // não existe um "executivo" na oportunidade em si além do texto livre
  // digitado na criação, então a filtragem funciona por segmento do cliente.
  const executivoFilterSegmentos =
    dashboardExecutivoFilter.length > 0
      ? Object.keys(segmentoExecutivo).filter((seg) => dashboardExecutivoFilter.includes(segmentoExecutivo[seg]))
      : null;

  function matchesDashboardFilters(o) {
    if (dashboardSegmentFilter.length > 0) {
      const adv = advertisers.find((a) => a.id === o.advertiserId);
      if (!adv || !segMatches(dashboardSegmentFilter, adv.segmento)) return false;
    }
    if (executivoFilterSegmentos) {
      const adv = advertisers.find((a) => a.id === o.advertiserId);
      if (!adv || !executivoFilterSegmentos.includes(adv.segmento)) return false;
    }
    if (dashboardProductFilter.length > 0) {
      if (!(o.products || []).some((p) => dashboardProductFilter.includes(p))) return false;
    }
    if (dashboardAgencyFilter.length > 0) {
      if (!dashboardAgencyFilter.includes(o.agencyId)) return false;
    }
    if (dashboardAdvertiserFilter.length > 0) {
      if (!dashboardAdvertiserFilter.includes(o.advertiserId)) return false;
    }
    return true;
  }

  const dashboardOppsYearOnly = opportunities.filter((o) => {
    const monthsInYear = (o.periodMonths || []).filter((m) => m.startsWith(dashboardYear + "-"));
    if (monthsInYear.length === 0) return false;
    return matchesDashboardFilters(o);
  });

  const dashboardOpps = dashboardOppsYearOnly.filter((o) => {
    if (dashboardMonths.length === 0) return true;
    const monthsInYear = (o.periodMonths || []).filter((m) => m.startsWith(dashboardYear + "-"));
    return monthsInYear.some((m) => dashboardMonths.includes(m.split("-")[1]));
  });
  // An opportunity's value spread evenly across the months it spans — used
  // any time we need to attribute value to a single month rather than the
  // whole opportunity (the monthly chart, and the KPI cards once Meses is
  // filtered), so a 3-month deal doesn't count its full value three times.
  function monthlyValueOfOpp(o) {
    const n = (o.periodMonths || []).length;
    return n > 0 ? o.value / n : 0;
  }

  // Full value when no Meses filter is active (the KPI cards describe the
  // whole selected year); once specific months are selected, sum the
  // per-month average for just the months that were actually selected.
  function periodAdjustedValue(o) {
    if (dashboardMonths.length === 0) return o.value;
    const monthsInYear = (o.periodMonths || []).filter((m) => m.startsWith(dashboardYear + "-"));
    const matched = monthsInYear.filter((m) => dashboardMonths.includes(m.split("-")[1]));
    return monthlyValueOfOpp(o) * matched.length;
  }

  const sumByStage = (stage) => dashboardOpps.filter((o) => o.stage === stage).reduce((s, o) => s + periodAdjustedValue(o), 0);
  const countByStage = (stage) => dashboardOpps.filter((o) => o.stage === stage).length;

  // New chart: soma de oportunidades frias, mornas e quentes por mês do ano
  // selecionado. Cada oportunidade contribui com seu valor total dividido
  // pelo número de meses que ela abrange — a média mensal —, alocado em
  // cada mês que ela toca. Respeita o filtro de Meses da página.
  const monthlyOpenData = MONTHS.map((m) => {
    const code = `${dashboardYear}-${m}`;
    const monthInScope = dashboardMonths.length === 0 || dashboardMonths.includes(m);
    const oppsInMonth = monthInScope ? dashboardOpps.filter((o) => (o.periodMonths || []).includes(code)) : [];
    const frio = oppsInMonth.filter((o) => o.stage === "Frio").reduce((s, o) => s + monthlyValueOfOpp(o), 0);
    const morno = oppsInMonth.filter((o) => o.stage === "Morno").reduce((s, o) => s + monthlyValueOfOpp(o), 0);
    const quente = oppsInMonth.filter((o) => o.stage === "Quente").reduce((s, o) => s + monthlyValueOfOpp(o), 0);
    return {
      month: m,
      Frio: frio,
      Morno: morno,
      Quente: quente,
      total: frio + morno + quente,
    };
  });

  // Faturamento: projeção = Efetivo (já faturado, lançado manualmente por
  // enquanto) + Potencial ponderado (frio/morno/quente). "Fechado" no CRM
  // não entra na soma — é mostrado à parte como referência de conciliação,
  // já que, uma vez faturado, aquele valor passa a aparecer em Efetivo (somar
  // os dois contaria a mesma receita duas vezes).
  const STAGE_WEIGHTS = { Frio: 0, Morno: 0.1, Quente: 0.7 };

  // Mesma lógica da aba Faturamento, mas usando o ano e os filtros já
  // ativos na Visão Geral (Segmento e Anunciante para o Efetivo — Agência e
  // Produtos não se aplicam bem a um lançamento por cliente/mês, então
  // ficam de fora dessa camada específica). "Fechado no CRM" fica fora de
  // propósito, por decisão de manter essa análise simples.
  // Meta é só por Segmento (não existe meta por cliente) — soma dos
  // segmentos filtrados, ou de todos os segmentos com meta cadastrada
  // quando nenhum Segmento está selecionado. Some qualquer filtro que não
  // seja temporal ou de Segmento (Produto, Agência, Anunciante) e a linha
  // deixa de fazer sentido, então ela desaparece do gráfico.
  const metaVisible = dashboardProductFilter.length === 0 && dashboardAgencyFilter.length === 0 && dashboardAdvertiserFilter.length === 0;
  const relevantSegmentosForMeta = (() => {
    const base = dashboardSegmentFilter.length > 0 ? dashboardSegmentFilter : Object.keys(monthlyMetas);
    return executivoFilterSegmentos ? base.filter((seg) => executivoFilterSegmentos.includes(seg)) : base;
  })();
  // Meses "em escopo": todos, a menos que o filtro de Mês esteja ativo — daí
  // só os selecionados contam, tanto no gráfico mensal quanto nos totais do
  // ano (Faturamento, Pipeline e Meta precisam respeitar isso igualmente,
  // senão o GAP fica inconsistente).
  const effectiveMonthsForResultado = dashboardMonths.length > 0 ? dashboardMonths : MONTHS;

  const visaoGeralFaturamentoData = MONTHS.map((m) => {
    const code = `${dashboardYear}-${m}`;
    const monthInScope = effectiveMonthsForResultado.includes(m);
    const efetivo = !monthInScope
      ? 0
      : faturamentoEfetivo
          .filter((f) => {
            if (f.periodo !== code) return false;
            const client = advertisers.find((a) => a.codigo === f.clienteCodigo);
            if (!client) return false;
            if (dashboardSegmentFilter.length > 0 && !segMatches(dashboardSegmentFilter, client.segmento)) return false;
            if (executivoFilterSegmentos && !executivoFilterSegmentos.includes(client.segmento)) return false;
            if (dashboardAdvertiserFilter.length > 0 && !dashboardAdvertiserFilter.includes(client.id)) return false;
            return true;
          })
          .reduce((s, f) => s + f.valor, 0);
    const potencial = !monthInScope
      ? 0
      : dashboardOpps
          .filter((o) => ["Frio", "Morno", "Quente"].includes(o.stage) && (o.periodMonths || []).includes(code))
          .reduce((s, o) => s + monthlyValueOfOpp(o) * STAGE_WEIGHTS[o.stage], 0);
    const meta =
      monthInScope && metaVisible
        ? relevantSegmentosForMeta.reduce((s, seg) => s + ((monthlyMetas[seg] && monthlyMetas[seg][code]) || 0), 0)
        : 0;
    return { month: m, Faturamento: efetivo, Pipeline: potencial, Meta: meta };
  });
  const visaoGeralFaturamentoEfetivoTotal = visaoGeralFaturamentoData.reduce((s, m) => s + m.Faturamento, 0);
  const visaoGeralFaturamentoPotencialTotal = visaoGeralFaturamentoData.reduce((s, m) => s + m.Pipeline, 0);
  const visaoGeralMetaAnoTotal = visaoGeralFaturamentoData.reduce((s, m) => s + m.Meta, 0);
  // GAP = Faturamento + Pipeline - Meta: negativo significa abaixo da meta
  // (vermelho), positivo significa que já superou a meta (verde).
  // Coluna GAP: altura = Meta - Faturado (o que falta faturar para bater a
  // meta). Essa altura é dividida em duas fatias: o que o Pipeline ponderado
  // já cobre, e o que ainda precisa ser produzido do zero (a diferença).
  // Se Faturado já superou a Meta, não há GAP (fatias ficam em zero).
  const gapParaMeta = Math.max(0, visaoGeralMetaAnoTotal - visaoGeralFaturamentoEfetivoTotal);
  const gapPipeline = Math.min(gapParaMeta, visaoGeralFaturamentoPotencialTotal);
  const gapAProduzir = Math.max(0, gapParaMeta - visaoGeralFaturamentoPotencialTotal);
  // Caixa "Meta" (velocímetro): percentual de atingimento considerando
  // Faturado + Pipeline contra a Meta (mantido como estava). O valor
  // numérico abaixo do velocímetro é o GAP total = Meta - Faturado, SEM
  // abater o pipeline — o buraco cheio para bater a meta.
  // Caixa "Meta" (velocímetro): não considera pipeline em nenhum cálculo
  // aqui — só o que já foi faturado de fato contra a meta.
  const metaAtingida = visaoGeralFaturamentoEfetivoTotal >= visaoGeralMetaAnoTotal;
  const visaoGeralAtingimentoPercent =
    visaoGeralMetaAnoTotal > 0 ? (visaoGeralFaturamentoEfetivoTotal / visaoGeralMetaAnoTotal) * 100 : 0;
  const faturadoMenosMeta = visaoGeralFaturamentoEfetivoTotal - visaoGeralMetaAnoTotal;
  const resumoAnoData = [
    { name: "Meta", Meta: visaoGeralMetaAnoTotal, Faturado: 0, Pipeline: 0, AProduzir: 0, totalTop: visaoGeralMetaAnoTotal },
    { name: "Faturado", Meta: 0, Faturado: visaoGeralFaturamentoEfetivoTotal, Pipeline: 0, AProduzir: 0, totalTop: visaoGeralFaturamentoEfetivoTotal },
    { name: "GAP", Meta: 0, Faturado: 0, Pipeline: gapPipeline, AProduzir: gapAProduzir, totalTop: gapParaMeta },
  ];

  const pipelineTotal = dashboardOpps.reduce((s, o) => s + periodAdjustedValue(o), 0);
  const emDesenvolvimentoValor = sumByStage("Desenvolvimento");
  const frioValor = sumByStage("Frio");
  const mornoValor = sumByStage("Morno");
  const quenteValor = sumByStage("Quente");
  const emAbertoValor = frioValor + mornoValor + quenteValor;
  const emAbertoCount = countByStage("Frio") + countByStage("Morno") + countByStage("Quente");
  const estimativaFaturamento = frioValor * 0 + mornoValor * 0.1 + quenteValor * 0.7;
  const fechadosValor = sumByStage("Fechado");
  const negadosValor = sumByStage("Negado");
  const taxaConversao = fechadosValor + negadosValor > 0 ? fechadosValor / (fechadosValor + negadosValor) : 0;

  const stageData = STAGES.map((s) => ({
    stage: s.length > 12 ? s.slice(0, 12) + "…" : s,
    valor: sumByStage(s),
  }));

  function computeProductRow(p) {
    const opps = dashboardOpps.filter((o) => (o.products || []).includes(p));
    const stageValues = {};
    STAGES.forEach((s) => {
      stageValues[s] = opps.filter((o) => o.stage === s).reduce((sum, o) => sum + periodAdjustedValue(o), 0);
    });
    const total = STAGES.reduce((sum, s) => sum + stageValues[s], 0);
    const emAberto = stageValues["Frio"] + stageValues["Morno"] + stageValues["Quente"];
    const fechado = stageValues["Fechado"];
    const negado = stageValues["Negado"];
    const taxaConversao = fechado + negado > 0 ? fechado / (fechado + negado) : null;
    return { product: p, stageValues, total, emAberto, taxaConversao };
  }

  function sumProductRows(rows) {
    const stageValues = {};
    STAGES.forEach((s) => {
      stageValues[s] = rows.reduce((sum, r) => sum + r.stageValues[s], 0);
    });
    const total = rows.reduce((sum, r) => sum + r.total, 0);
    const emAberto = rows.reduce((sum, r) => sum + r.emAberto, 0);
    const fechado = stageValues["Fechado"];
    const negado = stageValues["Negado"];
    const taxaConversao = fechado + negado > 0 ? fechado / (fechado + negado) : null;
    return { stageValues, total, emAberto, taxaConversao };
  }

  const tvProductRows = TV_PRODUCTS.map(computeProductRow).filter((r) => r.total > 0);
  const digitalProductRows = DIGITAL_PRODUCTS.map(computeProductRow).filter((r) => r.total > 0);
  const specialProductRows = SPECIAL_PROJECTS.map(computeProductRow).filter((r) => r.total > 0);
  const tvProductTotals = sumProductRows(tvProductRows);
  const digitalProductTotals = sumProductRows(digitalProductRows);
  const specialProductTotals = sumProductRows(specialProductRows);

  const selectedAdvertiser = advertisers.find((a) => a.id === selectedAdvertiserId);
  const selectedContact = contacts.find((c) => c.id === selectedContactId);
  const selectedContactClient = selectedContact ? advertisers.find((a) => a.id === selectedContact.clientId) : null;

  const selectedOpp = opportunities.find((o) => o.id === selectedOppId);
  const selectedOppAdvertiser = selectedOpp ? advertisers.find((a) => a.id === selectedOpp.advertiserId) : null;
  const selectedOppAgency = selectedOpp && selectedOpp.agencyId && selectedOpp.agencyId !== DIRECT_CLIENT_ID
    ? advertisers.find((a) => a.id === selectedOpp.agencyId)
    : null;
  const selectedOppContact = selectedOpp ? contacts.find((c) => c.id === selectedOpp.contactId) : null;

  const sendProposalTemplate = PROPOSAL_TEMPLATES.find((t) => t.id === sendProposalTemplateId) || null;
  const sendProposalContact = contacts.find((c) => c.id === sendProposalContactId) || null;
  const sendProposalMailto =
    sendProposalTemplate && sendProposalContact && sendProposalContact.email
      ? `mailto:${sendProposalContact.email}?subject=${encodeURIComponent(`Proposta comercial — ${sendProposalTemplate.title} | RedeTV!`)}&body=${encodeURIComponent(buildProposalEmailBody(sendProposalTemplate, sendProposalContact.name))}`
      : null;

  const contactSearchQuery = contactSearch.trim().toLowerCase();
  const filteredContacts = !contactSearchQuery
    ? contacts
    : contacts.filter((c) => {
        const client = advertisers.find((a) => a.id === c.clientId);
        const nameMatch = c.name.toLowerCase().includes(contactSearchQuery);
        const empresaMatch = client ? client.name.toLowerCase().includes(contactSearchQuery) : false;
        const agencyMatch =
          client && client.type === "Anunciante"
            ? getServingAgencies(client.id).some((ag) => ag.name.toLowerCase().includes(contactSearchQuery))
            : false;
        return nameMatch || empresaMatch || agencyMatch;
      });

  const clientSearchQuery = clientSearch.trim().toLowerCase();
  function getClientTotalValue(a) {
    return opportunities
      .filter((o) => o.advertiserId === a.id || o.agencyId === a.id)
      .reduce((s, o) => s + o.value, 0);
  }

  const filteredAdvertisers = (!clientSearchQuery
    ? advertisers
    : advertisers.filter((a) => {
        const digits = clientSearchQuery.replace(/\D/g, "");
        return (
          (a.nomeFantasia || "").toLowerCase().includes(clientSearchQuery) ||
          (a.razaoSocial || "").toLowerCase().includes(clientSearchQuery) ||
          (a.codigo || "").toString().toLowerCase().includes(clientSearchQuery) ||
          (digits && (a.cnpj || "").includes(digits))
        );
      })
  ).slice().sort((a, b) => getClientTotalValue(b) - getClientTotalValue(a));
  const availableContacts = getAvailableContacts(newOppForm.agencyId, newOppForm.advertiserId);

  // Carteira e KPIs de um executivo: soma dos segmentos que são dele
  // (regra exclusiva — cada segmento pertence a só um executivo).
  function computeExecutivoKpis(executivo) {
    const segmentos = Object.keys(segmentoExecutivo).filter((seg) => segmentoExecutivo[seg] === executivo.id);
    const clientesDaCarteira = advertisers.filter((a) => a.type === "Anunciante" && segmentos.includes(a.segmento));
    const clientIds = clientesDaCarteira.map((c) => c.id);

    let faturamento = 0;
    let pipeline = 0;
    let pipelineTotal = 0;
    let meta = 0;
    MONTHS.forEach((m) => {
      const code = `${executivoYear}-${m}`;
      faturamento += faturamentoEfetivo
        .filter((f) => {
          if (f.periodo !== code) return false;
          const client = advertisers.find((a) => a.codigo === f.clienteCodigo);
          return client && segmentos.includes(client.segmento);
        })
        .reduce((s, f) => s + f.valor, 0);
      const oppsAbertoNoMes = opportunities.filter(
        (o) =>
          ["Frio", "Morno", "Quente"].includes(o.stage) &&
          (o.periodMonths || []).includes(code) &&
          clientIds.includes(o.advertiserId)
      );
      pipeline += oppsAbertoNoMes.reduce((s, o) => s + monthlyValueOfOpp(o) * STAGE_WEIGHTS[o.stage], 0);
      pipelineTotal += oppsAbertoNoMes.reduce((s, o) => s + monthlyValueOfOpp(o), 0);
      meta += segmentos.reduce((s, seg) => s + ((monthlyMetas[seg] && monthlyMetas[seg][code]) || 0), 0);
    });
    const gap = faturamento - meta;
    const percent = meta > 0 ? (faturamento / meta) * 100 : 0;
    return { segmentos, clientesDaCarteira, faturamento, pipeline, pipelineTotal, meta, gap, percent };
  }

  // Linha de cliente dentro da tabela expansível de cada executivo:
  // Faturamento (efetivo do OPEC), Valor Total das Oportunidades (bruto,
  // qualquer estágio, sem ponderar) e Pipeline (só Frio/Morno/Quente,
  // ponderado, ratado por mês e limitado aos meses do ano selecionado).
  function computeClientRowForExecutivo(client, year) {
    const faturamento = faturamentoEfetivo
      .filter((f) => f.clienteCodigo === client.codigo && f.periodo.startsWith(year + "-"))
      .reduce((s, f) => s + f.valor, 0);
    const clientOpps = opportunities.filter(
      (o) => o.advertiserId === client.id && (o.periodMonths || []).some((pm) => pm.startsWith(year + "-"))
    );
    const valorTotalOportunidades = clientOpps.reduce((s, o) => s + o.value, 0);
    const pipeline = clientOpps
      .filter((o) => ["Frio", "Morno", "Quente"].includes(o.stage))
      .reduce((s, o) => {
        const monthsInYear = (o.periodMonths || []).filter((pm) => pm.startsWith(year + "-")).length;
        return s + monthsInYear * monthlyValueOfOpp(o) * STAGE_WEIGHTS[o.stage];
      }, 0);
    return { faturamento, valorTotalOportunidades, pipeline };
  }

  const viewTitles = {
    dashboard: "Visão Geral",
    pipeline: "Pipeline comercial",
    planning: "Pipeline Planejamento",
    advertisers: "Clientes",
    contacts: "Contatos",
    proposals: "Propostas geradas com IA",
    executivos: "Executivos",
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 text-slate-900 flex">
      <aside className="w-56 shrink-0 bg-slate-900 text-slate-100 flex flex-col">
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-sm font-medium">CRM Comercial</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">Mercado anunciante</div>
        </div>
        <nav className="flex-1 p-3 flex flex-col gap-1">
          {[
            { id: "dashboard", label: "Visão Geral", icon: LayoutDashboard },
            { id: "pipeline", label: "Pipeline", icon: GitBranch },
            { id: "advertisers", label: "Clientes", icon: Building2 },
            { id: "contacts", label: "Contatos", icon: Users },
            { id: "proposals", label: "Propostas", icon: FileText },
            { id: "executivos", label: "Executivos", icon: Briefcase },
            { id: "planning", label: "Pipeline Planejamento", icon: ClipboardList },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm text-left transition-colors " +
                (view === item.id
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200")
              }
            >
              <item.icon size={16} />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800 text-xs text-slate-500 flex flex-col gap-2">
          <div>Protótipo — dados fictícios, salvos localmente.</div>
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="text-left text-rose-400 hover:text-rose-300"
          >
            Restaurar dados de exemplo
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="px-8 py-5 border-b border-slate-200 bg-white flex items-center justify-between">
          <h1 className="text-lg font-medium text-slate-800">{viewTitles[view]}</h1>
          {view === "advertisers" && (
            <button
              onClick={() => {
                setNewAdvForm({
                  type: "Agência",
                  codigo: "",
                  razaoSocial: "",
                  cnpj: "",
                  nomeFantasia: "",
                  segmento: "",
                  atendeAnunciantes: [],
                  vinculoAgencias: [],
                });
                setPendingOppClientField(null);
                setEditingClientId(null);
                setShowNewAdvertiser(true);
              }}
              className="flex items-center gap-1.5 text-sm bg-slate-900 text-white px-3 py-1.5 rounded-md hover:bg-slate-800"
            >
              <Plus size={15} /> Novo cliente
            </button>
          )}
          {view === "contacts" && (
            <button
              onClick={() => {
                setPendingOppContact(false);
                setShowNewContact(true);
              }}
              className="flex items-center gap-1.5 text-sm bg-slate-900 text-white px-3 py-1.5 rounded-md hover:bg-slate-800"
            >
              <Plus size={15} /> Novo Contato
            </button>
          )}
          {view === "pipeline" && (
            <button
              onClick={() => {
                setNewOppForm(emptyOppForm());
                setTvExpanded(false);
                setDigitalExpanded(false);
                setSpecialExpanded(false);
                setPeriodViewYear(CURRENT_YEAR);
                setShowNewOpportunity(true);
              }}
              className="flex items-center gap-1.5 text-sm bg-slate-900 text-white px-3 py-1.5 rounded-md hover:bg-slate-800"
            >
              <Plus size={15} /> Nova Oportunidade
            </button>
          )}
        </div>

        {errorMsg && (
          <div className="mx-8 mt-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-2 rounded-md flex items-center justify-between">
            {errorMsg}
            <button onClick={() => setErrorMsg("")}>
              <X size={14} />
            </button>
          </div>
        )}

        <div className="p-8">
          {view === "dashboard" && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-2 flex-wrap">
                <MultiSelectFilterButton
                  label="Segmento"
                  options={SEGMENTOS.map((s) => ({ value: s, label: s }))}
                  selected={dashboardSegmentFilter}
                  onChange={setDashboardSegmentFilter}
                />
                <MultiSelectFilterButton
                  label="Produtos"
                  options={ALL_PRODUCTS.map((p) => ({ value: p, label: p }))}
                  selected={dashboardProductFilter}
                  onChange={setDashboardProductFilter}
                />
                <MultiSelectFilterButton
                  label="Agência"
                  options={agencyFilterOptions}
                  selected={dashboardAgencyFilter}
                  onChange={setDashboardAgencyFilter}
                />
                <MultiSelectFilterButton
                  label="Anunciante"
                  options={advertiserFilterOptions}
                  selected={dashboardAdvertiserFilter}
                  onChange={setDashboardAdvertiserFilter}
                />
                <MultiSelectFilterButton
                  label="Executivo"
                  options={executivos.map((ex) => ({ value: ex.id, label: ex.nome }))}
                  selected={dashboardExecutivoFilter}
                  onChange={setDashboardExecutivoFilter}
                />
                {[
                  ...dashboardSegmentFilter.map((v) => ({ label: "Segmento: " + v, clear: () => setDashboardSegmentFilter(dashboardSegmentFilter.filter((x) => x !== v)) })),
                  ...dashboardProductFilter.map((v) => ({ label: "Produto: " + v, clear: () => setDashboardProductFilter(dashboardProductFilter.filter((x) => x !== v)) })),
                  ...dashboardAgencyFilter.map((v) => {
                    const opt = agencyFilterOptions.find((o) => o.value === v);
                    return { label: "Agência: " + (opt ? opt.label : v), clear: () => setDashboardAgencyFilter(dashboardAgencyFilter.filter((x) => x !== v)) };
                  }),
                  ...dashboardAdvertiserFilter.map((v) => {
                    const opt = advertiserFilterOptions.find((o) => o.value === v);
                    return { label: "Anunciante: " + (opt ? opt.label : v), clear: () => setDashboardAdvertiserFilter(dashboardAdvertiserFilter.filter((x) => x !== v)) };
                  }),
                  ...dashboardExecutivoFilter.map((v) => {
                    const ex = executivos.find((e) => e.id === v);
                    return { label: "Executivo: " + (ex ? ex.nome : v), clear: () => setDashboardExecutivoFilter(dashboardExecutivoFilter.filter((x) => x !== v)) };
                  }),
                ].map((f, i) => (
                  <span key={i} className="text-xs bg-slate-100 text-slate-600 pl-2 pr-1 py-1 rounded-md flex items-center gap-1">
                    {f.label}
                    <button type="button" onClick={f.clear} className="hover:text-slate-900">
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 w-16 shrink-0">Ano</span>
                  <div className="flex flex-wrap gap-1.5">
                    {YEARS.map((y) => (
                      <button
                        type="button"
                        key={y}
                        onClick={() => setDashboardYear(y)}
                        className={
                          "w-16 text-xs border rounded-md py-1.5 " +
                          (dashboardYear === y ? "bg-slate-900 border-slate-900 text-white" : "border-slate-200 text-slate-600 bg-white hover:bg-slate-50")
                        }
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-xs text-slate-400 w-16 shrink-0 pt-1.5">Meses</span>
                  <div className="grid grid-cols-6 gap-1.5">
                    {MONTHS.map((m) => (
                      <label
                        key={m}
                        className={
                          "w-16 flex items-center justify-center text-xs border rounded-md py-1.5 cursor-pointer " +
                          (dashboardMonths.includes(m) ? "bg-rose-50 border-rose-300 text-rose-700" : "border-slate-200 text-slate-600 bg-white")
                        }
                      >
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={dashboardMonths.includes(m)}
                          onChange={() => setDashboardMonths((prev) => toggleArrayValue(prev, m))}
                        />
                        {m}
                      </label>
                    ))}
                  </div>
                  {dashboardMonths.length > 0 && (
                    <button type="button" onClick={() => setDashboardMonths([])} className="text-xs text-rose-600 hover:text-rose-700 self-start pt-1.5">
                      Limpar meses
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 p-5">
                <div className="text-sm font-medium text-slate-700 mb-3">
                  Resultado <span className="text-slate-400 font-normal">({dashboardYear})</span>
                </div>
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="flex-1 min-w-0">
                    <ResponsiveContainer width="100%" height={380}>
                      <BarChart data={resumoAnoData} margin={{ top: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} />
                        <Tooltip content={<ResultadoTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="Meta" stackId="resumo" fill="#0f172a" name="Meta" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Faturado" stackId="resumo" fill="#059669" name="Faturado" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Pipeline" stackId="resumo" fill="#0284c7" name="Pipeline (cobre o GAP)" />
                        <Bar dataKey="AProduzir" stackId="resumo" fill="#e11d48" name="A produzir" radius={[4, 4, 0, 0]}>
                          <LabelList
                            dataKey="totalTop"
                            position="top"
                            formatter={(v) => (v > 0 ? formatBRL(v) : "")}
                            style={{ fontSize: 11, fill: "#334155" }}
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div
                    className={
                      "shrink-0 md:w-72 rounded-lg border p-4 flex flex-col items-center justify-center gap-1 " +
                      (metaAtingida ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200")
                    }
                  >
                    <div className="text-xs text-slate-500 self-start">Meta</div>
                    <MetaGauge percent={visaoGeralAtingimentoPercent} positive={metaAtingida} />
                    <div className={"text-xl font-mono font-medium -mt-2 " + (metaAtingida ? "text-emerald-700" : "text-rose-700")}>
                      {formatBRL(faturadoMenosMeta)}
                    </div>
                  </div>
                </div>
                {!metaVisible && (
                  <div className="text-xs text-slate-400 mt-2">
                    Meta e GAP ficam zerados enquanto houver filtro de Produto, Agência ou Anunciante ativo.
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg border border-slate-200 p-5">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <div className="text-sm font-medium text-slate-700">
                    Resultado Mensal <span className="text-slate-400 font-normal">({dashboardYear})</span>
                  </div>
                  <div className="text-xs text-slate-400">
                    Faturamento {formatBRL(visaoGeralFaturamentoEfetivoTotal)} · Pipeline {formatBRL(visaoGeralFaturamentoPotencialTotal)}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <ComposedChart data={visaoGeralFaturamentoData} margin={{ top: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} />
                    <Tooltip content={<ResultadoMensalTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="Faturamento" stackId="fat" fill="#059669" name="Faturamento" />
                    <Bar dataKey="Pipeline" stackId="fat" fill="#0284c7" name="Pipeline" radius={[4, 4, 0, 0]} />
                    {metaVisible && <Line type="monotone" dataKey="Meta" name="Meta" stroke="#0f172a" strokeWidth={2} dot={{ r: 3 }} />}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <KpiCard label="Pipeline Total" value={formatBRL(pipelineTotal)} sub={`${dashboardOpps.length} oportunidades`} />
                <KpiCard label="Em Desenvolvimento" value={formatBRL(emDesenvolvimentoValor)} sub={`${countByStage("Desenvolvimento")} oportunidades`} />
                <KpiCard label="Em Aberto" value={formatBRL(emAbertoValor)} sub={`${emAbertoCount} · frio, morno e quente`} />
                <KpiCard label="Estimativa de Faturamento" value={formatBRL(estimativaFaturamento)} sub="0% frio + 10% morno + 70% quente" />
                <KpiCard label="Fechados" value={formatBRL(fechadosValor)} sub={`${countByStage("Fechado")} oportunidades`} />
                <KpiCard label="Negados" value={formatBRL(negadosValor)} sub={`${countByStage("Negado")} oportunidades`} />
                <KpiCard label="Taxa de Conversão" value={`${Math.round(taxaConversao * 100)}%`} sub={`${countByStage("Fechado")} fechadas · ${countByStage("Negado")} negadas`} />
              </div>

              <div className="bg-white rounded-lg border border-slate-200 p-5">
                <div className="text-sm font-medium text-slate-700 mb-3">Pipeline Total</div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={stageData} margin={{ top: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                    <XAxis dataKey="stage" tick={{ fontSize: 11, fill: "#64748b" }} />
                    <Tooltip formatter={(v) => formatBRL(v)} />
                    <Bar dataKey="valor" fill="#e11d48" radius={[4, 4, 0, 0]}>
                      <LabelList
                        dataKey="valor"
                        position="top"
                        formatter={(v) => formatBRL(v)}
                        style={{ fontSize: 11, fill: "#334155" }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 p-5">
                <div className="text-sm font-medium text-slate-700 mb-3">Pipeline Mensal <span className="text-slate-400 font-normal">({dashboardYear})</span></div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={monthlyOpenData} margin={{ top: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} />
                    <Tooltip content={<StageStackTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="Frio" stackId="pipeline" fill="#3b82f6" name="Frio" />
                    <Bar dataKey="Morno" stackId="pipeline" fill="#eab308" name="Morno" />
                    <Bar dataKey="Quente" stackId="pipeline" fill="#f97316" name="Quente" radius={[4, 4, 0, 0]}>
                      <LabelList dataKey="total" position="top" formatter={(v) => formatBRL(v)} style={{ fontSize: 10, fill: "#334155" }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 p-5">
                <div className="text-sm font-medium text-slate-700 mb-3">Pipeline por Produto</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="text-slate-500 border-b border-slate-200">
                        <th className="py-2 pr-3 font-medium text-left">Produto</th>
                        {STAGES.map((s) => (
                          <th key={s} className="py-2 px-3 font-medium text-right">{s}</th>
                        ))}
                        <th className="py-2 px-3 font-medium text-right">Total</th>
                        <th className="py-2 px-3 font-medium text-right">Em Aberto</th>
                        <th className="py-2 pl-3 font-medium text-right">Taxa Conv.</th>
                      </tr>
                    </thead>
                    {[
                      { label: "Televisão", rows: tvProductRows, totals: tvProductTotals },
                      { label: "Digital", rows: digitalProductRows, totals: digitalProductTotals },
                      { label: "Projetos Especiais", rows: specialProductRows, totals: specialProductTotals },
                    ].map((group) => {
                      const headerStyles = {
                        "Televisão": "bg-sky-50 text-sky-800 border-sky-200",
                        "Digital": "bg-violet-50 text-violet-800 border-violet-200",
                        "Projetos Especiais": "bg-amber-50 text-amber-800 border-amber-200",
                      };
                      return (
                      <tbody key={group.label}>
                        <tr>
                          <td colSpan={10} className="pt-4 pb-0">
                            <div className={"text-sm font-bold uppercase tracking-wide px-3 py-2 rounded-md border " + headerStyles[group.label]}>
                              {group.label}
                            </div>
                          </td>
                        </tr>
                        {group.rows.length === 0 && (
                          <tr>
                            <td colSpan={10} className="py-2 text-slate-300">Nenhuma oportunidade nesse grupo, no período filtrado.</td>
                          </tr>
                        )}
                        {group.rows.map((r) => (
                          <tr key={r.product} className="border-b border-slate-50 text-slate-600">
                            <td className="py-1.5 pr-3 text-slate-700">{r.product}</td>
                            {STAGES.map((s) => (
                              <td key={s} className="py-1.5 px-3 text-right font-mono">{r.stageValues[s] > 0 ? formatBRL(r.stageValues[s]) : "—"}</td>
                            ))}
                            <td className="py-1.5 px-3 text-right font-mono text-slate-800">{formatBRL(r.total)}</td>
                            <td className="py-1.5 px-3 text-right font-mono">{formatBRL(r.emAberto)}</td>
                            <td className="py-1.5 pl-3 text-right font-mono">{r.taxaConversao === null ? "—" : `${Math.round(r.taxaConversao * 100)}%`}</td>
                          </tr>
                        ))}
                        {group.rows.length > 0 && (
                          <tr className="border-t border-slate-200 font-medium text-slate-800">
                            <td className="py-1.5 pr-3">Total {group.label}</td>
                            {STAGES.map((s) => (
                              <td key={s} className="py-1.5 px-3 text-right font-mono">{group.totals.stageValues[s] > 0 ? formatBRL(group.totals.stageValues[s]) : "—"}</td>
                            ))}
                            <td className="py-1.5 px-3 text-right font-mono">{formatBRL(group.totals.total)}</td>
                            <td className="py-1.5 px-3 text-right font-mono">{formatBRL(group.totals.emAberto)}</td>
                            <td className="py-1.5 pl-3 text-right font-mono">{group.totals.taxaConversao === null ? "—" : `${Math.round(group.totals.taxaConversao * 100)}%`}</td>
                          </tr>
                        )}
                      </tbody>
                      );
                    })}
                  </table>
                </div>
              </div>
            </div>
          )}

          {view === "pipeline" && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <MultiSelectFilterButton
                  label="Segmento"
                  options={SEGMENTOS.map((s) => ({ value: s, label: s }))}
                  selected={segmentFilter}
                  onChange={setSegmentFilter}
                />
                <MultiSelectFilterButton
                  label="Produtos"
                  options={ALL_PRODUCTS.map((p) => ({ value: p, label: p }))}
                  selected={productFilter}
                  onChange={setProductFilter}
                />
                <MultiSelectFilterButton
                  label="Agência"
                  options={agencyFilterOptions}
                  selected={agencyFilter}
                  onChange={setAgencyFilter}
                />
                <PeriodFilterButton selected={monthFilter} onChange={setMonthFilter} />
                {pipelineActiveFilters.map((f, i) => (
                  <span key={f.type + f.label + i} className="text-xs bg-slate-100 text-slate-600 pl-2 pr-1 py-1 rounded-md flex items-center gap-1">
                    {f.type}: {f.label}
                    <button type="button" onClick={f.clear} className="hover:text-slate-900">
                      <X size={11} />
                    </button>
                  </span>
                ))}
                {pipelineActiveFilters.length > 0 && (
                  <span className="text-xs text-slate-400">{pipelineOpportunities.length} de {opportunities.length} oportunidades</span>
                )}
              </div>
              <div className="flex gap-4 overflow-x-auto pb-4">
                {STAGES.map((stage) => {
                  const stageOpps = pipelineOpportunities.filter((o) => o.stage === stage);
                  const stageTotal = stageOpps.reduce((s, o) => s + o.value, 0);
                  return (
                    <div key={stage} className="w-72 shrink-0 bg-white rounded-lg border border-slate-200 flex flex-col">
                      <div className="p-3 border-b border-slate-200">
                        <div className="flex items-center justify-between">
                          <span className={"text-xs font-medium px-2 py-0.5 rounded border " + STAGE_STYLES[stage]}>
                            {stage}
                          </span>
                          <span className="text-xs text-slate-400">{stageOpps.length}</span>
                      </div>
                      <div className="text-sm font-mono text-slate-600 mt-1">{formatBRL(stageTotal)}</div>
                    </div>
                    <div className="p-2 flex flex-col gap-2 flex-1 min-h-20">
                      {stageOpps.map((o) => {
                        const advertiser = advertisers.find((a) => a.id === o.advertiserId);
                        const agency = o.agencyId && o.agencyId !== DIRECT_CLIENT_ID ? advertisers.find((a) => a.id === o.agencyId) : null;
                        return (
                          <div
                            key={o.id}
                            id={`opp-card-${o.id}`}
                            className={
                              "bg-slate-50 border rounded-md p-3 text-sm transition-shadow " +
                              (highlightedOppId === o.id
                                ? "border-rose-400 ring-2 ring-rose-300"
                                : "border-slate-200")
                            }
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="font-medium text-slate-800">{o.title}</div>
                              <button
                                type="button"
                                onClick={() => setSelectedOppId(o.id)}
                                className="text-slate-400 hover:text-rose-600 shrink-0"
                                title="Ver card completo"
                              >
                                <Maximize2 size={13} />
                              </button>
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {agency ? `${agency.name} → ${advertiser ? advertiser.name : ""}` : advertiser ? advertiser.name : ""}
                            </div>
                            {advertiser && advertiser.segmento && (
                              <div className="text-xs text-slate-500 mt-0.5">{advertiser.segmento}</div>
                            )}
                            <div className="flex flex-wrap gap-1 mt-2">
                              {(o.products || []).map((p) => (
                                <span key={p} className="text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">{p}</span>
                              ))}
                            </div>
                            <div className="text-sm font-mono text-slate-700 mt-2">{formatBRL(o.value)}</div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              {formatPeriod(o.periodMonths)}
                            </div>
                            <div className="text-xs text-slate-400">Fechamento previsto: {formatDate(o.expectedCloseDate)}</div>
                            {o.briefing && (
                              <div className="text-xs text-slate-400 italic mt-1 line-clamp-2">"{o.briefing}"</div>
                            )}
                            <select
                              value={o.stage}
                              onChange={(e) => updateStage(o.id, e.target.value)}
                              className="mt-2 w-full text-xs border border-slate-200 rounded px-1 py-1 bg-white"
                            >
                              {STAGES.map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </div>
                        );
                      })}
                      {stageOpps.length === 0 && (
                        <div className="text-xs text-slate-300 text-center py-6">Sem oportunidades</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            </div>
          )}

          {view === "planning" && (
            <div className="bg-white rounded-lg border border-slate-200 p-5">
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-200 text-left">
                      <th className="py-2 pr-3 font-medium">Executivo</th>
                      <th className="py-2 px-3 font-medium">Agência</th>
                      <th className="py-2 px-3 font-medium">Anunciante</th>
                      <th className="py-2 px-3 font-medium">Responsável</th>
                      <th className="py-2 px-3 font-medium">Tipo</th>
                      <th className="py-2 px-3 font-medium">Versão</th>
                      <th className="py-2 px-3 font-medium">Data de Entrada</th>
                      <th className="py-2 px-3 font-medium">Deadline</th>
                      <th className="py-2 px-3 font-medium">Prazo</th>
                      <th className="py-2 px-3 font-medium">Status</th>
                      <th className="py-2 px-3 font-medium">Observação</th>
                      <th className="py-2 pl-3 font-medium">Data de Entrega do Plano</th>
                    </tr>
                  </thead>
                  {planningGroups.map((group) => {
                    const headerStyles = {
                      "Em Aberto": "bg-sky-50 text-sky-800 border-sky-200",
                      "Entregue": "bg-emerald-50 text-emerald-800 border-emerald-200",
                      "Finalizado": "bg-slate-100 text-slate-800 border-slate-300",
                    };
                    return (
                    <tbody key={group.label}>
                      <tr>
                        <td colSpan={12} className="pt-4 pb-0">
                          <div className={"text-sm font-bold uppercase tracking-wide px-3 py-2 rounded-md border " + headerStyles[group.label]}>
                            {group.label} <span className="font-normal normal-case text-xs">({group.rows.length})</span>
                          </div>
                        </td>
                      </tr>
                      {group.rows.length === 0 && (
                        <tr>
                          <td colSpan={12} className="py-2 text-slate-300">Nenhuma oportunidade nesta categoria.</td>
                        </tr>
                      )}
                      {group.rows.map((o) => {
                        const agency = o.agencyId && o.agencyId !== DIRECT_CLIENT_ID ? advertisers.find((a) => a.id === o.agencyId) : null;
                        const advertiser = advertisers.find((a) => a.id === o.advertiserId);
                        return (
                          <tr key={o.id} className="border-b border-slate-50 text-slate-600 align-top">
                            <td className="py-2 pr-3 text-slate-700">{o.executivo || "—"}</td>
                            <td className="py-2 px-3">{agency ? agency.name : "Cliente Direto"}</td>
                            <td className="py-2 px-3">{advertiser ? advertiser.name : "—"}</td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={o.responsavel}
                                onChange={(e) => updatePlanningField(o.id, "responsavel", e.target.value)}
                                placeholder="Atribuir"
                                className="w-32 border border-slate-200 rounded px-2 py-1 text-xs"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <select
                                value={o.tipo}
                                onChange={(e) => updatePlanningField(o.id, "tipo", e.target.value)}
                                className="border border-slate-200 rounded px-1.5 py-1 text-xs bg-white"
                              >
                                {PLANNING_TYPES.map((t) => (
                                  <option key={t} value={t}>{t}</option>
                                ))}
                              </select>
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="number"
                                min="1"
                                value={o.versao}
                                onChange={(e) => updatePlanningField(o.id, "versao", Number(e.target.value) || 1)}
                                className="w-14 border border-slate-200 rounded px-2 py-1 text-xs"
                              />
                            </td>
                            <td className="py-2 px-3 font-mono text-slate-500">{formatDate(o.createdAt)}</td>
                            <td className="py-2 px-3 font-mono text-slate-500">{formatDate(o.deliveryDate)}</td>
                            <td className="py-2 px-3">
                              {["Entregue", "Comercializado", "Negativado", "Cancelado"].includes(o.status) ? (
                                <span className="text-xs text-slate-300">Concluído</span>
                              ) : (
                                <DeadlineSignal deliveryDate={o.deliveryDate} />
                              )}
                            </td>
                            <td className="py-2 px-3">
                              <select
                                value={o.status}
                                onChange={(e) => updatePlanningField(o.id, "status", e.target.value)}
                                className="border border-slate-200 rounded px-1.5 py-1 text-xs bg-white"
                              >
                                {PLANNING_STATUSES.map((s) => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                            </td>
                            <td className="py-2 px-3">
                              <textarea
                                value={o.observacao}
                                onChange={(e) => updatePlanningField(o.id, "observacao", e.target.value)}
                                placeholder="Anotações..."
                                rows={1}
                                className="w-48 border border-slate-200 rounded px-2 py-1 text-xs resize-y whitespace-normal"
                              />
                            </td>
                            <td className="py-2 pl-3">
                              <input
                                type="date"
                                value={o.planDeliveryDate}
                                onChange={(e) => updatePlanningField(o.id, "planDeliveryDate", e.target.value)}
                                className="border border-slate-200 rounded px-2 py-1 text-xs"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    );
                  })}
                </table>
              </div>
            </div>
          )}

          {view === "advertisers" && (
            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                placeholder="Buscar por nome fantasia, razão social, código ou CNPJ..."
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white"
              />
              <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100">
                {filteredAdvertisers.length === 0 && (
                  <div className="p-6 text-sm text-slate-400 text-center">
                    {advertisers.length === 0 ? "Nenhum cliente cadastrado ainda." : `Nenhum cliente encontrado para "${clientSearch}".`}
                  </div>
                )}
                {filteredAdvertisers.map((a) => {
                const advOpps = opportunities.filter((o) => o.advertiserId === a.id || o.agencyId === a.id);
                const totalValue = advOpps.reduce((s, o) => s + o.value, 0);
                const relatedCount = a.type === "Agência" ? getServedAdvertisers(a).length : getServingAgencies(a.id).length;
                return (
                  <button
                    key={a.id}
                    onClick={() => setSelectedAdvertiserId(a.id)}
                    className="w-full text-left p-4 flex items-center justify-between hover:bg-slate-50"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800">{a.nomeFantasia || a.razaoSocial}</span>
                        <span
                          className={
                            "text-xs px-1.5 py-0.5 rounded border " +
                            (a.type === "Agência"
                              ? "bg-violet-50 text-violet-700 border-violet-200"
                              : "bg-sky-50 text-sky-700 border-sky-200")
                          }
                        >
                          {a.type}
                        </span>
                        {a.codigo && <span className="text-xs text-slate-400 font-mono">#{a.codigo}</span>}
                      </div>
                      {a.razaoSocial && <div className="text-xs text-slate-400 mt-0.5">{a.razaoSocial}</div>}
                      {a.segmento && <div className="text-xs text-slate-400 mt-0.5">{a.segmento}</div>}
                      {relatedCount > 0 && (
                        <div className="text-xs text-slate-400 mt-0.5">
                          {a.type === "Agência"
                            ? `Atende ${relatedCount} anunciante${relatedCount !== 1 ? "s" : ""}`
                            : `${relatedCount} agência${relatedCount !== 1 ? "s" : ""} vinculada${relatedCount !== 1 ? "s" : ""}`}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-mono text-slate-700">{formatBRL(totalValue)}</div>
                      <div className="text-xs text-slate-400">
                        {advOpps.length} oportunidade{advOpps.length !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </button>
                );
              })}
              </div>
            </div>
          )}

          {view === "contacts" && (
            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                placeholder="Buscar por nome, empresa ou agência..."
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white"
              />
              <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100">
                {filteredContacts.length === 0 && (
                  <div className="p-6 text-sm text-slate-400 text-center">
                    {contacts.length === 0 ? "Nenhum contato cadastrado ainda." : `Nenhum contato encontrado para "${contactSearch}".`}
                  </div>
                )}
                {filteredContacts.map((c) => {
                  const client = advertisers.find((a) => a.id === c.clientId);
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedContactId(c.id)}
                      className="w-full text-left p-4 flex items-center justify-between hover:bg-slate-50"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-800">{c.name}</span>
                          {c.nivelDecisao && (
                            <span className="text-xs px-1.5 py-0.5 rounded border bg-violet-50 text-violet-700 border-violet-200">
                              {c.nivelDecisao}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {c.cargo}{c.cargo && client ? " · " : ""}{client ? client.name : "Cliente não vinculado"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-500">{c.celular ? formatCelular(c.celular) : "—"}</div>
                        <div className="text-xs text-slate-400">{c.email || "—"}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {view === "proposals" && (
            <div className="flex flex-col gap-6">
              <div>
                <div className="text-sm font-medium text-slate-700 mb-3">Propostas padrão</div>
                <div className="flex flex-col gap-3">
                  {PROPOSAL_TEMPLATES.map((t) => (
                    <div key={t.id} className="bg-white rounded-lg border border-slate-200 p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-md bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                          <FileText size={16} className="text-rose-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-800">{t.title}</span>
                            <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">{t.product}</span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">{t.subtitle}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{t.horario} · {t.periodo}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={t.pdfDataUri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs border border-slate-200 text-slate-600 px-3 py-1.5 rounded-md hover:bg-slate-50 whitespace-nowrap"
                        >
                          Visualizar
                        </a>
                        <button
                          type="button"
                          onClick={() => openSendProposal(t.id)}
                          className="text-xs bg-rose-600 text-white px-3 py-1.5 rounded-md hover:bg-rose-700 whitespace-nowrap"
                        >
                          Enviar por e-mail
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-slate-700 mb-3">Propostas enviadas</div>
                <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100">
                  {proposals.length === 0 && (
                    <div className="p-6 text-sm text-slate-400 text-center">Nenhuma proposta enviada ainda.</div>
                  )}
                  {proposals.map((p) => {
                    const template = PROPOSAL_TEMPLATES.find((t) => t.id === p.templateId);
                    const contact = contacts.find((c) => c.id === p.contactId);
                    const client = contact ? advertisers.find((a) => a.id === contact.clientId) : null;
                    const opp = p.opportunityId ? opportunities.find((o) => o.id === p.opportunityId) : null;
                    return (
                      <div key={p.id} className="p-4 flex items-center justify-between">
                        <div>
                          <div className="font-medium text-slate-800">{template ? template.title : "Modelo removido"}</div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {contact ? contact.name : "Contato removido"}{client ? ` · ${client.name}` : ""}{opp ? ` · ${opp.title}` : ""}
                          </div>
                        </div>
                        <div className="text-xs text-slate-400">{p.sentAt ? new Date(p.sentAt).toLocaleDateString("pt-BR") : ""}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {view === "executivos" && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Ano:</span>
                  {YEARS.map((y) => (
                    <button
                      type="button"
                      key={y}
                      onClick={() => setExecutivoYear(y)}
                      className={
                        "text-xs border rounded-md px-3 py-1.5 " +
                        (executivoYear === y ? "bg-slate-900 border-slate-900 text-white" : "border-slate-200 text-slate-600 bg-white hover:bg-slate-50")
                      }
                    >
                      {y}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNewExecutivoForm({ nome: "" });
                    setShowNewExecutivo(true);
                  }}
                  className="flex items-center gap-1.5 text-sm bg-slate-900 text-white px-3 py-1.5 rounded-md hover:bg-slate-800"
                >
                  <Plus size={15} /> Novo Executivo
                </button>
              </div>

              {executivos.length === 0 && (
                <div className="bg-white rounded-lg border border-slate-200 p-6 text-sm text-slate-400 text-center">
                  Nenhum executivo cadastrado ainda.
                </div>
              )}

              {executivos.map((executivo) => {
                const kpis = computeExecutivoKpis(executivo);
                const isEditing = editingCarteiraId === executivo.id;
                return (
                  <div key={executivo.id} className="bg-white rounded-lg border border-slate-200 p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-medium text-slate-800">{executivo.nome}</div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {kpis.segmentos.length === 0
                            ? "Nenhum segmento na carteira ainda"
                            : `Carteira: ${kpis.segmentos.join(", ")}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setEditingCarteiraId(isEditing ? null : executivo.id)}
                          className="flex items-center gap-1 text-xs border border-slate-200 text-slate-600 px-2.5 py-1.5 rounded-md hover:bg-slate-50"
                        >
                          Editar carteira {isEditing ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteExecutivo(executivo.id)}
                          className="text-slate-300 hover:text-rose-600"
                          title="Excluir executivo"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {isEditing && (
                      <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-md mb-4 max-h-56 overflow-y-auto">
                        {SEGMENTOS.map((seg) => {
                          const ownerId = segmentoExecutivo[seg];
                          const isMine = ownerId === executivo.id;
                          const ownerName = ownerId && !isMine ? executivos.find((e) => e.id === ownerId)?.nome : null;
                          return (
                            <label
                              key={seg}
                              className={
                                "flex items-center gap-1.5 text-xs border rounded-md px-2 py-1 cursor-pointer " +
                                (isMine ? "bg-rose-50 border-rose-300 text-rose-700" : "border-slate-200 text-slate-600")
                              }
                              title={ownerName ? `Hoje é da carteira de ${ownerName}` : ""}
                            >
                              <input
                                type="checkbox"
                                className="hidden"
                                checked={isMine}
                                onChange={() => assignSegmentoToExecutivo(seg, executivo.id)}
                              />
                              {seg}
                              {ownerName && <span className="text-slate-400">({ownerName})</span>}
                            </label>
                          );
                        })}
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <KpiCard label="Meta" value={formatBRL(kpis.meta)} sub={`${kpis.segmentos.length} segmento(s)`} />
                      <KpiCard label="Faturamento" value={formatBRL(kpis.faturamento)} sub={`${executivoYear}`} />
                      <KpiCard
                        label="GAP"
                        value={formatBRL(kpis.gap)}
                        sub={`${Math.round(kpis.percent)}% da meta atingido`}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <KpiCard label="Oportunidades (Pipeline Total)" value={formatBRL(kpis.pipelineTotal)} sub="Frio + Morno + Quente, sem ponderar" />
                      <KpiCard label="Pipeline" value={formatBRL(kpis.pipeline)} sub="Frio 0% + Morno 10% + Quente 70%" />
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={() => setExpandedClientsId(expandedClientsId === executivo.id ? null : executivo.id)}
                        className="flex items-center gap-1 text-xs font-medium text-slate-500 mb-2 hover:text-slate-800"
                      >
                        Clientes da carteira ({kpis.clientesDaCarteira.length})
                        {expandedClientsId === executivo.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>

                      {expandedClientsId !== executivo.id && (
                        <div className="flex flex-wrap gap-1.5">
                          {kpis.clientesDaCarteira.length === 0 && (
                            <div className="text-xs text-slate-300">Nenhum cliente nos segmentos desta carteira.</div>
                          )}
                          {kpis.clientesDaCarteira.map((c) => (
                            <span key={c.id} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                              {c.name}
                            </span>
                          ))}
                        </div>
                      )}

                      {expandedClientsId === executivo.id && (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs border-collapse whitespace-nowrap">
                            <thead>
                              <tr className="text-slate-500 border-b border-slate-200 text-left">
                                <th className="py-2 pr-3 font-medium">Cliente</th>
                                <th className="py-2 px-3 font-medium text-right">Faturamento</th>
                                <th className="py-2 px-3 font-medium text-right">Valor Total das Oportunidades</th>
                                <th className="py-2 pl-3 font-medium text-right">Pipeline</th>
                              </tr>
                            </thead>
                            {kpis.clientesDaCarteira.length === 0 && (
                              <tbody>
                                <tr>
                                  <td colSpan={4} className="py-3 text-slate-300">Nenhum cliente nos segmentos desta carteira.</td>
                                </tr>
                              </tbody>
                            )}
                            {kpis.segmentos.map((seg, segIdx) => {
                              const headerPalette = [
                                "bg-sky-50 text-sky-800 border-sky-200",
                                "bg-violet-50 text-violet-800 border-violet-200",
                                "bg-amber-50 text-amber-800 border-amber-200",
                                "bg-emerald-50 text-emerald-800 border-emerald-200",
                                "bg-rose-50 text-rose-800 border-rose-200",
                              ];
                              const clientesDoSegmento = kpis.clientesDaCarteira.filter((c) => c.segmento === seg);
                              if (clientesDoSegmento.length === 0) return null;
                              const rows = clientesDoSegmento.map((c) => ({ client: c, ...computeClientRowForExecutivo(c, executivoYear) }));
                              const subtotal = rows.reduce(
                                (acc, r) => ({
                                  faturamento: acc.faturamento + r.faturamento,
                                  valorTotalOportunidades: acc.valorTotalOportunidades + r.valorTotalOportunidades,
                                  pipeline: acc.pipeline + r.pipeline,
                                }),
                                { faturamento: 0, valorTotalOportunidades: 0, pipeline: 0 }
                              );
                              return (
                                <tbody key={seg}>
                                  <tr>
                                    <td colSpan={4} className="pt-3 pb-0">
                                      <div className={"text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-md border " + headerPalette[segIdx % headerPalette.length]}>
                                        {seg}
                                      </div>
                                    </td>
                                  </tr>
                                  {rows.map((r) => (
                                    <tr key={r.client.id} className="border-b border-slate-50 text-slate-600">
                                      <td className="py-1.5 pr-3 text-slate-700">{r.client.name}</td>
                                      <td className="py-1.5 px-3 text-right font-mono">{formatBRL(r.faturamento)}</td>
                                      <td className="py-1.5 px-3 text-right font-mono">{formatBRL(r.valorTotalOportunidades)}</td>
                                      <td className="py-1.5 pl-3 text-right font-mono">{formatBRL(r.pipeline)}</td>
                                    </tr>
                                  ))}
                                  <tr className="border-b border-slate-200 font-medium text-slate-800">
                                    <td className="py-1.5 pr-3">Total {seg}</td>
                                    <td className="py-1.5 px-3 text-right font-mono">{formatBRL(subtotal.faturamento)}</td>
                                    <td className="py-1.5 px-3 text-right font-mono">{formatBRL(subtotal.valorTotalOportunidades)}</td>
                                    <td className="py-1.5 pl-3 text-right font-mono">{formatBRL(subtotal.pipeline)}</td>
                                  </tr>
                                </tbody>
                              );
                            })}
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {selectedAdvertiser && (
        <div
          className="fixed inset-0 bg-slate-900/30 flex justify-end z-40"
          onClick={() => setSelectedAdvertiserId(null)}
        >
          <div className="w-full max-w-md bg-white h-full overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-lg font-medium text-slate-800">{selectedAdvertiser.name}</div>
                <div className="text-xs text-slate-500 mt-1">{selectedAdvertiser.razaoSocial}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditClient(selectedAdvertiser)}
                  className="text-xs border border-slate-200 text-slate-600 px-2.5 py-1.5 rounded-md hover:bg-slate-50"
                >
                  Editar
                </button>
                <button onClick={() => setSelectedAdvertiserId(null)} className="text-slate-400 hover:text-slate-700">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm mb-5">
              <div className="bg-slate-50 rounded-md p-3">
                <div className="text-xs text-slate-400">Código</div>
                <div className="text-slate-700 font-mono">{selectedAdvertiser.codigo || "—"}</div>
              </div>
              <div className="bg-slate-50 rounded-md p-3">
                <div className="text-xs text-slate-400">CNPJ</div>
                <div className="text-slate-700 font-mono">{selectedAdvertiser.cnpj ? formatCNPJ(selectedAdvertiser.cnpj) : "—"}</div>
              </div>
              {selectedAdvertiser.type === "Anunciante" && (
                <div className="bg-slate-50 rounded-md p-3 col-span-2">
                  <div className="text-xs text-slate-400">Segmento</div>
                  <div className="text-slate-700">{selectedAdvertiser.segmento || "—"}</div>
                </div>
              )}
            </div>

            <div className="bg-slate-50 rounded-md p-3 text-sm text-slate-600 mb-5 flex flex-col gap-2">
              <div className="text-xs font-medium text-slate-500">
                {selectedAdvertiser.type === "Agência" ? "Anunciantes atendidos" : "Agências vinculadas"}
              </div>
              {selectedAdvertiser.type === "Agência" ? (
                getServedAdvertisers(selectedAdvertiser).length === 0 ? (
                  <div className="text-xs text-slate-400">Nenhum anunciante vinculado ainda.</div>
                ) : (
                  getServedAdvertisers(selectedAdvertiser).map((rel) => (
                    <button
                      key={rel.id}
                      onClick={() => setSelectedAdvertiserId(rel.id)}
                      className="text-left text-slate-700 hover:text-rose-600"
                    >
                      {rel.name}
                    </button>
                  ))
                )
              ) : getServingAgencies(selectedAdvertiser.id).length === 0 ? (
                <div className="text-xs text-slate-400">Nenhuma agência vinculada ainda.</div>
              ) : (
                getServingAgencies(selectedAdvertiser.id).map((rel) => (
                  <button
                    key={rel.id}
                    onClick={() => setSelectedAdvertiserId(rel.id)}
                    className="text-left text-slate-700 hover:text-rose-600"
                  >
                    {rel.name}
                  </button>
                ))
              )}
            </div>

            <div className="bg-slate-50 rounded-md p-3 text-sm text-slate-600 mb-5 flex flex-col gap-2">
              <div className="text-xs font-medium text-slate-500">Contatos</div>
              {contacts.filter((c) => c.clientId === selectedAdvertiser.id).length === 0 && (
                <div className="text-xs text-slate-400">Nenhum contato cadastrado na aba Contatos para este cliente.</div>
              )}
              {contacts
                .filter((c) => c.clientId === selectedAdvertiser.id)
                .map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedAdvertiserId(null);
                      setSelectedContactId(c.id);
                    }}
                    className="text-left hover:text-rose-600"
                  >
                    <div>{c.name} · {c.cargo}</div>
                    <div className="text-xs text-slate-400">{c.celular ? formatCelular(c.celular) : c.email || "Sem contato direto"}</div>
                  </button>
                ))}
            </div>

            <div className="mb-5">
              <div className="text-xs font-medium text-slate-500 mb-2">Oportunidades</div>
              <div className="flex flex-col gap-2">
                {opportunities
                  .filter((o) => o.advertiserId === selectedAdvertiser.id || o.agencyId === selectedAdvertiser.id)
                  .sort((a, b) => {
                    const order = ["Fechado", "Quente", "Morno", "Frio", "Desenvolvimento", "Negado"];
                    const stageDiff = order.indexOf(a.stage) - order.indexOf(b.stage);
                    if (stageDiff !== 0) return stageDiff;
                    return b.value - a.value;
                  })
                  .map((o) => (
                    <button
                      key={o.id}
                      onClick={() => goToOpportunityInPipeline(o.id)}
                      className="w-full flex items-center justify-between text-sm border border-slate-100 rounded-md px-3 py-2 hover:border-rose-200 hover:bg-rose-50/40 text-left"
                    >
                      <span className="text-slate-700 hover:text-rose-700">{o.title}</span>
                      <span className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-mono text-slate-400">{formatBRL(o.value)}</span>
                        <span className={"text-xs px-1.5 py-0.5 rounded border " + STAGE_STYLES[o.stage]}>{o.stage}</span>
                      </span>
                    </button>
                  ))}
                {opportunities.filter((o) => o.advertiserId === selectedAdvertiser.id || o.agencyId === selectedAdvertiser.id).length === 0 && (
                  <div className="text-xs text-slate-300">Nenhuma oportunidade registrada.</div>
                )}
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-slate-500 mb-2">Interações</div>
              <div className="flex flex-col gap-2 mb-3">
                <textarea
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  placeholder="Registrar uma reunião, ligação ou troca de mensagens..."
                  className="w-full text-sm border border-slate-200 rounded-md p-2 resize-none h-20"
                />
                <button
                  onClick={() => addInteraction(selectedAdvertiser.id)}
                  className="self-start text-xs bg-slate-900 text-white px-3 py-1.5 rounded-md hover:bg-slate-800"
                >
                  Adicionar interação
                </button>
              </div>
              <div className="text-xs font-medium text-slate-500 mb-2">Histórico</div>
              <div className="flex flex-col gap-3">
                {(selectedAdvertiser.interactions || []).map((i) => (
                  <div key={i.id} className="border border-slate-100 rounded-md p-3">
                    <div className="text-xs text-slate-400 mb-1">{new Date(i.date).toLocaleDateString("pt-BR")}</div>
                    <div className="text-sm text-slate-700">{i.note}</div>
                    {i.aiSummary ? (
                      <div className="mt-2 bg-violet-50 border border-violet-100 rounded-md p-2">
                        <div className="text-xs text-violet-700 flex items-center gap-1">
                          <Sparkles size={11} /> Resumo da IA
                        </div>
                        <div className="text-xs text-slate-600 mt-1">{i.aiSummary}</div>
                        {i.aiNextAction && (
                          <div className="text-xs text-slate-600 mt-1">
                            <span className="font-medium">Próxima ação: </span>{i.aiNextAction}
                          </div>
                        )}
                        {i.aiRisk && (
                          <span className={"inline-block mt-1 text-xs px-1.5 py-0.5 rounded border " + riskStyle(i.aiRisk)}>
                            Risco: {i.aiRisk}
                          </span>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => summarizeInteraction(selectedAdvertiser.id, i.id)}
                        disabled={summarizingId === i.id}
                        className="mt-2 flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 disabled:opacity-50"
                      >
                        {summarizingId === i.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Sparkles size={12} />
                        )}
                        Resumir com IA
                      </button>
                    )}
                  </div>
                ))}
                {(selectedAdvertiser.interactions || []).length === 0 && (
                  <div className="text-xs text-slate-300">Nenhuma interação registrada.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedContact && (
        <div
          className="fixed inset-0 bg-slate-900/30 flex justify-end z-40"
          onClick={() => setSelectedContactId(null)}
        >
          <div className="w-full max-w-md bg-white h-full overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-lg font-medium text-slate-800">{selectedContact.name}</div>
                <div className="text-xs text-slate-500 mt-1">
                  {selectedContact.cargo}{selectedContact.cargo && selectedContact.departamento ? " · " : ""}{selectedContact.departamento}
                </div>
              </div>
              <button onClick={() => setSelectedContactId(null)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            {selectedContactClient && (
              <button
                onClick={() => {
                  setSelectedContactId(null);
                  setSelectedAdvertiserId(selectedContactClient.id);
                }}
                className="text-xs text-rose-600 hover:text-rose-700 mb-4 block"
              >
                Ver cliente: {selectedContactClient.name} →
              </button>
            )}

            <div className="grid grid-cols-2 gap-3 text-sm mb-5">
              <div className="bg-slate-50 rounded-md p-3">
                <div className="text-xs text-slate-400">Nível de decisão</div>
                <div className="text-slate-700">{selectedContact.nivelDecisao || "—"}</div>
              </div>
              <div className="bg-slate-50 rounded-md p-3">
                <div className="text-xs text-slate-400">Filhos</div>
                <div className="text-slate-700">{selectedContact.filhos === "" ? "—" : selectedContact.filhos}</div>
              </div>
              <div className="bg-slate-50 rounded-md p-3">
                <div className="text-xs text-slate-400">Celular</div>
                <div className="text-slate-700 font-mono">{selectedContact.celular ? formatCelular(selectedContact.celular) : "—"}</div>
              </div>
              <div className="bg-slate-50 rounded-md p-3">
                <div className="text-xs text-slate-400">E-mail</div>
                <div className="text-slate-700 break-all">{selectedContact.email || "—"}</div>
              </div>
              <div className="bg-slate-50 rounded-md p-3 col-span-2">
                <div className="text-xs text-slate-400">Time do coração</div>
                <div className="text-slate-700">{selectedContact.timeCoracao || "—"}</div>
              </div>
            </div>

            <div className="mb-5">
              <div className="text-xs font-medium text-slate-500 mb-2">Hobbies</div>
              <div className="flex flex-wrap gap-1.5">
                {(selectedContact.hobbies || []).length === 0 && (
                  <div className="text-xs text-slate-300">Nenhum hobby cadastrado.</div>
                )}
                {(selectedContact.hobbies || []).map((h) => (
                  <span key={h} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                    {h === "Outros" && selectedContact.hobbiesOutro ? `Outros: ${selectedContact.hobbiesOutro}` : h}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-slate-500 mb-2">Esportes</div>
              <div className="flex flex-wrap gap-1.5">
                {(selectedContact.esportes || []).length === 0 && (
                  <div className="text-xs text-slate-300">Nenhum esporte cadastrado.</div>
                )}
                {(selectedContact.esportes || []).map((s) => (
                  <span key={s} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                    {s === "Outros" && selectedContact.esportesOutro ? `Outros: ${selectedContact.esportesOutro}` : s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedOpp && (
        <div className="fixed inset-0 bg-slate-900/30 flex justify-end z-40" onClick={() => setSelectedOppId(null)}>
          <div className="w-full max-w-md bg-white h-full overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-lg font-medium text-slate-800">{selectedOpp.title}</div>
                <span className={"inline-block text-xs px-1.5 py-0.5 rounded border mt-1 " + STAGE_STYLES[selectedOpp.stage]}>
                  {selectedOpp.stage}
                </span>
              </div>
              <button onClick={() => setSelectedOppId(null)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <div className="bg-slate-50 rounded-md p-3 text-sm text-slate-600 mb-5">
              <div>
                {selectedOppAgency ? `${selectedOppAgency.name} → ` : ""}
                {selectedOppAdvertiser ? selectedOppAdvertiser.name : "Anunciante removido"}
              </div>
              {selectedOppAdvertiser && selectedOppAdvertiser.segmento && (
                <div className="text-xs text-slate-400 mt-1">{selectedOppAdvertiser.segmento}</div>
              )}
              {selectedOppContact && (
                <div className="text-xs text-slate-400 mt-1">
                  Contato: {selectedOppContact.name} · {selectedOppContact.cargo}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm mb-5">
              <div className="bg-slate-50 rounded-md p-3 col-span-2">
                <div className="text-xs text-slate-400">Investimento previsto</div>
                <div className="text-slate-700 font-mono">{formatBRL(selectedOpp.value)}</div>
              </div>
              <div className="bg-slate-50 rounded-md p-3 col-span-2">
                <div className="text-xs text-slate-400">Período</div>
                <div className="text-slate-700">{formatPeriod(selectedOpp.periodMonths)}</div>
              </div>
              <div className="bg-slate-50 rounded-md p-3">
                <div className="text-xs text-slate-400">Data de criação</div>
                <div className="text-slate-700">{formatDate(selectedOpp.createdAt)}</div>
              </div>
              <div className="bg-slate-50 rounded-md p-3">
                <div className="text-xs text-slate-400">Data de entrega</div>
                <div className="text-slate-700">{formatDate(selectedOpp.deliveryDate)}</div>
              </div>
              <div className="bg-slate-50 rounded-md p-3 col-span-2">
                <div className="text-xs text-slate-400">Previsão de fechamento</div>
                <div className="text-slate-700">{formatDate(selectedOpp.expectedCloseDate)}</div>
              </div>
            </div>

            <div className="mb-5">
              <div className="text-xs font-medium text-slate-500 mb-2">Produtos</div>
              <div className="flex flex-wrap gap-1.5">
                {(selectedOpp.products || []).length === 0 && (
                  <div className="text-xs text-slate-300">Nenhum produto selecionado.</div>
                )}
                {(selectedOpp.products || []).map((p) => (
                  <span key={p} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">{p}</span>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <div className="text-xs font-medium text-slate-500 mb-2">Briefing</div>
              <div className="text-sm text-slate-600 bg-slate-50 rounded-md p-3 whitespace-pre-wrap">
                {selectedOpp.briefing || "Nenhum briefing registrado."}
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-500 mb-1 block">Estágio</label>
              <select
                value={selectedOpp.stage}
                onChange={(e) => updateStage(selectedOpp.id, e.target.value)}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {showNewAdvertiser && (
        <div className="fixed inset-0 bg-slate-900/30 flex items-center justify-center z-50" style={{ zIndex: 65 }} onClick={closeNewAdvertiser}>
          <form onSubmit={addAdvertiser} onClick={(e) => e.stopPropagation()} className="bg-white rounded-lg p-6 w-full max-w-sm flex flex-col gap-3">
            <div className="flex items-center justify-between mb-1">
              <div className="font-medium text-slate-800">{editingClientId ? "Editar Cliente" : "Novo Cliente"}</div>
              <button type="button" onClick={closeNewAdvertiser}><X size={16} className="text-slate-400" /></button>
            </div>

            <div>
              <label className="text-xs text-slate-500 mb-1 block">Tipo de cliente</label>
              <select
                value={newAdvForm.type}
                onChange={(e) =>
                  setNewAdvForm({
                    ...newAdvForm,
                    type: e.target.value,
                    segmento: e.target.value === "Agência" ? "" : newAdvForm.segmento,
                    atendeAnunciantes: e.target.value === "Agência" ? newAdvForm.atendeAnunciantes : [],
                    vinculoAgencias: e.target.value === "Anunciante" ? newAdvForm.vinculoAgencias : [],
                  })
                }
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
              >
                <option>Agência</option>
                <option>Anunciante</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-500 mb-1 block">Código</label>
              <input
                type="number"
                placeholder="Ex: 1007"
                value={newAdvForm.codigo}
                onChange={(e) => setNewAdvForm({ ...newAdvForm, codigo: e.target.value })}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-xs text-slate-500 mb-1 block">Razão social</label>
              <input
                required
                placeholder="Razão social"
                value={newAdvForm.razaoSocial}
                onChange={(e) => setNewAdvForm({ ...newAdvForm, razaoSocial: e.target.value })}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-xs text-slate-500 mb-1 block">CNPJ</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={18}
                placeholder="00.000.000/0000-00"
                value={formatCNPJ(newAdvForm.cnpj)}
                onChange={(e) => setNewAdvForm({ ...newAdvForm, cnpj: e.target.value.replace(/\D/g, "").slice(0, 14) })}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-xs text-slate-500 mb-1 block">Nome fantasia</label>
              <input
                placeholder="Nome fantasia"
                value={newAdvForm.nomeFantasia}
                onChange={(e) => setNewAdvForm({ ...newAdvForm, nomeFantasia: e.target.value })}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
              />
            </div>

            {newAdvForm.type === "Anunciante" && (
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Segmento</label>
                <select
                  required
                  value={newAdvForm.segmento}
                  onChange={(e) => setNewAdvForm({ ...newAdvForm, segmento: e.target.value })}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">Selecionar segmento</option>
                  {SEGMENTOS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}

            {newAdvForm.type === "Agência" && (
              <MultiClientSearchField
                label="Anunciantes"
                type="Anunciante"
                advertisers={advertisers}
                selectedIds={newAdvForm.atendeAnunciantes}
                onChange={(ids) => setNewAdvForm((prev) => ({ ...prev, atendeAnunciantes: ids }))}
                onCreateNew={(text) => openQuickCreateClient("Anunciante", text, "atendeAnunciantes")}
                placeholder="Buscar anunciante..."
              />
            )}

            {newAdvForm.type === "Anunciante" && (
              <MultiClientSearchField
                label="Agências"
                type="Agência"
                advertisers={advertisers}
                selectedIds={newAdvForm.vinculoAgencias}
                onChange={(ids) => setNewAdvForm((prev) => ({ ...prev, vinculoAgencias: ids }))}
                onCreateNew={(text) => openQuickCreateClient("Agência", text, "vinculoAgencias")}
                placeholder="Buscar agência..."
              />
            )}

            <button type="submit" className="bg-slate-900 text-white rounded-md py-2 text-sm mt-1 hover:bg-slate-800">{editingClientId ? "Salvar alterações" : "Salvar cliente"}</button>
          </form>
        </div>
      )}

      {showResetConfirm && (
        <div className="fixed inset-0 bg-slate-900/30 flex items-center justify-center z-50" onClick={() => setShowResetConfirm(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-lg p-6 w-full max-w-sm flex flex-col gap-3">
            <div className="font-medium text-slate-800">Restaurar dados de exemplo?</div>
            <div className="text-sm text-slate-500">
              Isso apaga tudo que está salvo no seu navegador (clientes, contatos, oportunidades e propostas enviadas) e recarrega a base de demonstração original. Não tem como desfazer.
            </div>
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 border border-slate-200 text-slate-600 rounded-md py-2 text-sm hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={resetToSeedData}
                className="flex-1 bg-rose-600 text-white rounded-md py-2 text-sm hover:bg-rose-700"
              >
                Restaurar
              </button>
            </div>
          </div>
        </div>
      )}

      {showNewExecutivo && (
        <div className="fixed inset-0 bg-slate-900/30 flex items-center justify-center z-50" onClick={() => setShowNewExecutivo(false)}>
          <form onSubmit={addExecutivo} onClick={(e) => e.stopPropagation()} className="bg-white rounded-lg p-6 w-full max-w-sm flex flex-col gap-3">
            <div className="flex items-center justify-between mb-1">
              <div className="font-medium text-slate-800">Novo Executivo</div>
              <button type="button" onClick={() => setShowNewExecutivo(false)}><X size={16} className="text-slate-400" /></button>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Nome</label>
              <input
                required
                autoFocus
                placeholder="Nome do executivo"
                value={newExecutivoForm.nome}
                onChange={(e) => setNewExecutivoForm({ nome: e.target.value })}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <button type="submit" className="bg-slate-900 text-white rounded-md py-2 text-sm mt-1 hover:bg-slate-800">Salvar Executivo</button>
          </form>
        </div>
      )}

      {showQuickCreateClient && (
        <div className="fixed inset-0 bg-slate-900/30 flex items-center justify-center z-50" style={{ zIndex: 70 }} onClick={closeQuickCreateClient}>
          <form onSubmit={confirmQuickCreateClient} onClick={(e) => e.stopPropagation()} className="bg-white rounded-lg p-6 w-full max-w-sm flex flex-col gap-3">
            <div className="flex items-center justify-between mb-1">
              <div className="font-medium text-slate-800">Cadastrar {quickCreateType}</div>
              <button type="button" onClick={closeQuickCreateClient}><X size={16} className="text-slate-400" /></button>
            </div>

            <div>
              <label className="text-xs text-slate-500 mb-1 block">Código</label>
              <input
                type="number"
                placeholder="Ex: 1007"
                value={quickCreateCodigo}
                onChange={(e) => setQuickCreateCodigo(e.target.value)}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-xs text-slate-500 mb-1 block">Razão social</label>
              <input
                required
                autoFocus
                placeholder="Razão social"
                value={quickCreateRazaoSocial}
                onChange={(e) => setQuickCreateRazaoSocial(e.target.value)}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-xs text-slate-500 mb-1 block">CNPJ</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={18}
                placeholder="00.000.000/0000-00"
                value={formatCNPJ(quickCreateCnpj)}
                onChange={(e) => setQuickCreateCnpj(e.target.value.replace(/\D/g, "").slice(0, 14))}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-xs text-slate-500 mb-1 block">Nome fantasia</label>
              <input
                placeholder="Nome fantasia"
                value={quickCreateName}
                onChange={(e) => setQuickCreateName(e.target.value)}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
              />
            </div>

            {quickCreateType === "Anunciante" && (
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Segmento</label>
                <select
                  required
                  value={quickCreateSegmento}
                  onChange={(e) => setQuickCreateSegmento(e.target.value)}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">Selecionar segmento</option>
                  {SEGMENTOS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="text-xs text-slate-400">
              Contatos e vínculos com outras agências/anunciantes podem ser adicionados depois na aba Clientes.
            </div>

            <button type="submit" className="bg-slate-900 text-white rounded-md py-2 text-sm mt-1 hover:bg-slate-800">
              Salvar {quickCreateType}
            </button>
          </form>
        </div>
      )}

      {showNewContact && (
        <div className="fixed inset-0 bg-slate-900/30 flex items-start justify-center z-50 overflow-y-auto py-8" style={{ zIndex: 60 }} onClick={closeNewContact}>
          <form onSubmit={addContact} onClick={(e) => e.stopPropagation()} className="bg-white rounded-lg p-6 w-full max-w-lg flex flex-col gap-4">
            <div className="flex items-center justify-between mb-1">
              <div className="font-medium text-slate-800">Novo Contato</div>
              <button type="button" onClick={closeNewContact}><X size={16} className="text-slate-400" /></button>
            </div>

            <div>
              <label className="text-xs text-slate-500 mb-1 block">Nome</label>
              <input
                required
                placeholder="Nome completo"
                value={newContactForm.name}
                onChange={(e) => setNewContactForm({ ...newContactForm, name: e.target.value })}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
              />
            </div>

            <div>
              <AnyClientSearchField
                label="Empresa"
                advertisers={advertisers}
                valueId={newContactForm.clientId}
                onSelect={(id) => setNewContactForm({ ...newContactForm, clientId: id })}
                onCreateNew={(text) => openCreateClientForContact(text)}
                placeholder="Buscar agência ou anunciante..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Cargo</label>
                <input
                  placeholder="Cargo"
                  value={newContactForm.cargo}
                  onChange={(e) => setNewContactForm({ ...newContactForm, cargo: e.target.value })}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Departamento</label>
                <input
                  placeholder="Departamento"
                  value={newContactForm.departamento}
                  onChange={(e) => setNewContactForm({ ...newContactForm, departamento: e.target.value })}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-500 mb-1 block">Nível de decisão</label>
              <div className="flex flex-wrap gap-2">
                {DECISION_LEVELS.map((lvl) => (
                  <label
                    key={lvl}
                    className={
                      "flex items-center gap-1.5 text-xs border rounded-md px-2 py-1 cursor-pointer " +
                      (newContactForm.nivelDecisao === lvl
                        ? "bg-rose-50 border-rose-300 text-rose-700"
                        : "border-slate-200 text-slate-600")
                    }
                  >
                    <input
                      type="radio"
                      name="nivelDecisao"
                      className="hidden"
                      checked={newContactForm.nivelDecisao === lvl}
                      onChange={() => setNewContactForm((prev) => ({ ...prev, nivelDecisao: lvl }))}
                    />
                    {lvl}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Celular</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="(11) 98765-4321"
                  value={formatCelular(newContactForm.celular)}
                  onChange={(e) => setNewContactForm({ ...newContactForm, celular: e.target.value.replace(/\D/g, "").slice(0, 11) })}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">E-mail</label>
                <input
                  placeholder="nome@empresa.com.br"
                  value={newContactForm.email}
                  onChange={(e) => setNewContactForm({ ...newContactForm, email: e.target.value })}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-500 mb-1 block">Hobbies</label>
              <div className="flex flex-wrap gap-2">
                {HOBBIES.map((h) => (
                  <label
                    key={h}
                    className={
                      "flex items-center gap-1.5 text-xs border rounded-md px-2 py-1 cursor-pointer " +
                      (newContactForm.hobbies.includes(h)
                        ? "bg-rose-50 border-rose-300 text-rose-700"
                        : "border-slate-200 text-slate-600")
                    }
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={newContactForm.hobbies.includes(h)}
                      onChange={() => setNewContactForm((prev) => ({ ...prev, hobbies: toggleMultiWithNone(prev.hobbies, h) }))}
                    />
                    {h}
                  </label>
                ))}
              </div>
              {newContactForm.hobbies.includes("Outros") && (
                <input
                  type="text"
                  placeholder="Qual hobby?"
                  value={newContactForm.hobbiesOutro}
                  onChange={(e) => setNewContactForm({ ...newContactForm, hobbiesOutro: e.target.value })}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm mt-2"
                />
              )}
            </div>

            <div>
              <label className="text-xs text-slate-500 mb-1 block">Esportes</label>
              <div className="flex flex-wrap gap-2">
                {SPORTS.map((s) => (
                  <label
                    key={s}
                    className={
                      "flex items-center gap-1.5 text-xs border rounded-md px-2 py-1 cursor-pointer " +
                      (newContactForm.esportes.includes(s)
                        ? "bg-rose-50 border-rose-300 text-rose-700"
                        : "border-slate-200 text-slate-600")
                    }
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={newContactForm.esportes.includes(s)}
                      onChange={() => setNewContactForm((prev) => ({ ...prev, esportes: toggleMultiWithNone(prev.esportes, s) }))}
                    />
                    {s}
                  </label>
                ))}
              </div>
              {newContactForm.esportes.includes("Outros") && (
                <input
                  type="text"
                  placeholder="Qual esporte?"
                  value={newContactForm.esportesOutro}
                  onChange={(e) => setNewContactForm({ ...newContactForm, esportesOutro: e.target.value })}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm mt-2"
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Time do coração</label>
                <input
                  placeholder="Ex: Flamengo"
                  value={newContactForm.timeCoracao}
                  onChange={(e) => setNewContactForm({ ...newContactForm, timeCoracao: e.target.value })}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Filhos</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={newContactForm.filhos}
                  onChange={(e) => setNewContactForm({ ...newContactForm, filhos: e.target.value })}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
                />
              </div>
            </div>

            <button type="submit" className="bg-slate-900 text-white rounded-md py-2 text-sm mt-1 hover:bg-slate-800">Salvar contato</button>
          </form>
        </div>
      )}

      {showNewOpportunity && (
        <div className="fixed inset-0 bg-slate-900/30 flex items-start justify-center z-50 overflow-y-auto py-8" onClick={() => setShowNewOpportunity(false)}>
          <form onSubmit={addOpportunity} onClick={(e) => e.stopPropagation()} className="bg-white rounded-lg p-6 w-full max-w-lg flex flex-col gap-4">
            <div className="flex items-center justify-between mb-1">
              <div className="font-medium text-slate-800">Nova Oportunidade</div>
              <button type="button" onClick={() => setShowNewOpportunity(false)}><X size={16} className="text-slate-400" /></button>
            </div>

            <div>
              <label className="text-xs text-slate-500 mb-1 block">Nome da oportunidade</label>
              <input
                required
                placeholder="Ex: Patrocínio novela das 21h"
                value={newOppForm.title}
                onChange={(e) => setNewOppForm({ ...newOppForm, title: e.target.value })}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-xs text-slate-500 mb-1 block">Executivo</label>
              <select
                required
                value={newOppForm.executivo}
                onChange={(e) => setNewOppForm({ ...newOppForm, executivo: e.target.value })}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
              >
                <option value="">
                  {executivos.length === 0 ? "Cadastre um executivo na aba Executivos primeiro" : "Selecionar executivo"}
                </option>
                {executivos.map((ex) => (
                  <option key={ex.id} value={ex.nome}>{ex.nome}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <ClientSearchField
                label="Agência"
                type="Agência"
                required
                directOption={DIRECT_CLIENT_OPTION}
                advertisers={advertisers}
                valueId={newOppForm.agencyId}
                onSelect={(id) => setNewOppForm((prev) => ({ ...prev, agencyId: id, contactId: "" }))}
                onCreateNew={(text) => openCreateClientForOpportunity("agencyId", "Agência", text)}
                placeholder="Buscar agência ou Cliente Direto"
              />
              <ClientSearchField
                label="Anunciante"
                type="Anunciante"
                required
                advertisers={advertisers}
                valueId={newOppForm.advertiserId}
                onSelect={(id) => setNewOppForm((prev) => ({ ...prev, advertiserId: id, contactId: "" }))}
                onCreateNew={(text) => openCreateClientForOpportunity("advertiserId", "Anunciante", text)}
                placeholder="Buscar anunciante"
              />
            </div>

            <div>
              <ContactSearchField
                label="Contato"
                options={availableContacts}
                valueId={newOppForm.contactId}
                onSelect={(id) => setNewOppForm((prev) => ({ ...prev, contactId: id }))}
                onCreateNew={(text) => openCreateContactForOpportunity(text)}
                disabled={!newOppForm.advertiserId && !(newOppForm.agencyId && newOppForm.agencyId !== DIRECT_CLIENT_ID)}
              />
            </div>

            <div>
              <button
                type="button"
                onClick={() => setTvExpanded((v) => !v)}
                className="w-full flex items-center justify-between text-xs text-slate-500 mb-1"
              >
                <span>
                  Televisão{newOppForm.products.filter((p) => TV_PRODUCTS.includes(p)).length > 0 &&
                    ` (${newOppForm.products.filter((p) => TV_PRODUCTS.includes(p)).length} selecionado${newOppForm.products.filter((p) => TV_PRODUCTS.includes(p)).length !== 1 ? "s" : ""})`}
                </span>
                <span className="text-rose-600 font-medium">{tvExpanded ? "Recolher ▲" : "Selecionar ▼"}</span>
              </button>
              {!tvExpanded && newOppForm.products.filter((p) => TV_PRODUCTS.includes(p)).length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {newOppForm.products.filter((p) => TV_PRODUCTS.includes(p)).map((p) => (
                    <span key={p} className="text-xs bg-rose-50 border border-rose-200 text-rose-700 px-2 py-0.5 rounded-md">{p}</span>
                  ))}
                </div>
              )}
              {tvExpanded && (
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto border border-slate-100 rounded-md p-2">
                  {TV_PRODUCTS.map((p) => (
                    <label
                      key={p}
                      className={
                        "flex items-center gap-1.5 text-xs border rounded-md px-2 py-1 cursor-pointer " +
                        (newOppForm.products.includes(p)
                          ? "bg-rose-50 border-rose-300 text-rose-700"
                          : "border-slate-200 text-slate-600")
                      }
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={newOppForm.products.includes(p)}
                        onChange={() => setNewOppForm((prev) => ({ ...prev, products: toggleArrayValue(prev.products, p) }))}
                      />
                      {p}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div>
              <button
                type="button"
                onClick={() => setDigitalExpanded((v) => !v)}
                className="w-full flex items-center justify-between text-xs text-slate-500 mb-1"
              >
                <span>
                  Digital{newOppForm.products.filter((p) => DIGITAL_PRODUCTS.includes(p)).length > 0 &&
                    ` (${newOppForm.products.filter((p) => DIGITAL_PRODUCTS.includes(p)).length} selecionado${newOppForm.products.filter((p) => DIGITAL_PRODUCTS.includes(p)).length !== 1 ? "s" : ""})`}
                </span>
                <span className="text-rose-600 font-medium">{digitalExpanded ? "Recolher ▲" : "Selecionar ▼"}</span>
              </button>
              {!digitalExpanded && newOppForm.products.filter((p) => DIGITAL_PRODUCTS.includes(p)).length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {newOppForm.products.filter((p) => DIGITAL_PRODUCTS.includes(p)).map((p) => (
                    <span key={p} className="text-xs bg-rose-50 border border-rose-200 text-rose-700 px-2 py-0.5 rounded-md">{p}</span>
                  ))}
                </div>
              )}
              {digitalExpanded && (
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto border border-slate-100 rounded-md p-2">
                  {DIGITAL_PRODUCTS.map((p) => (
                    <label
                      key={p}
                      className={
                        "flex items-center gap-1.5 text-xs border rounded-md px-2 py-1 cursor-pointer " +
                        (newOppForm.products.includes(p)
                          ? "bg-rose-50 border-rose-300 text-rose-700"
                          : "border-slate-200 text-slate-600")
                      }
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={newOppForm.products.includes(p)}
                        onChange={() => setNewOppForm((prev) => ({ ...prev, products: toggleArrayValue(prev.products, p) }))}
                      />
                      {p}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div>
              <button
                type="button"
                onClick={() => setSpecialExpanded((v) => !v)}
                className="w-full flex items-center justify-between text-xs text-slate-500 mb-1"
              >
                <span>
                  Projetos Especiais{newOppForm.products.filter((p) => SPECIAL_PROJECTS.includes(p)).length > 0 &&
                    ` (${newOppForm.products.filter((p) => SPECIAL_PROJECTS.includes(p)).length} selecionado${newOppForm.products.filter((p) => SPECIAL_PROJECTS.includes(p)).length !== 1 ? "s" : ""})`}
                </span>
                <span className="text-rose-600 font-medium">{specialExpanded ? "Recolher ▲" : "Selecionar ▼"}</span>
              </button>
              {!specialExpanded && newOppForm.products.filter((p) => SPECIAL_PROJECTS.includes(p)).length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {newOppForm.products.filter((p) => SPECIAL_PROJECTS.includes(p)).map((p) => (
                    <span key={p} className="text-xs bg-rose-50 border border-rose-200 text-rose-700 px-2 py-0.5 rounded-md">{p}</span>
                  ))}
                </div>
              )}
              {specialExpanded && (
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto border border-slate-100 rounded-md p-2">
                  {SPECIAL_PROJECTS.map((p) => (
                    <label
                      key={p}
                      className={
                        "flex items-center gap-1.5 text-xs border rounded-md px-2 py-1 cursor-pointer " +
                        (newOppForm.products.includes(p)
                          ? "bg-rose-50 border-rose-300 text-rose-700"
                          : "border-slate-200 text-slate-600")
                      }
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={newOppForm.products.includes(p)}
                        onChange={() => setNewOppForm((prev) => ({ ...prev, products: toggleArrayValue(prev.products, p) }))}
                      />
                      {p}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-xs text-slate-500 mb-1 block">Investimento previsto</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">R$</span>
                <input
                  type="text"
                  required
                  inputMode="numeric"
                  placeholder="0"
                  value={formatThousandsBR(newOppForm.value)}
                  onChange={(e) => setNewOppForm({ ...newOppForm, value: e.target.value.replace(/\D/g, "") })}
                  className="w-full border border-slate-200 rounded-md pl-9 pr-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-500 mb-1 block">Período</label>
              <div className="flex flex-col gap-2">
                <div>
                  <div className="text-xs text-slate-400 mb-1">Ano exibido</div>
                  <div className="flex flex-wrap gap-2">
                    {YEARS.map((y) => (
                      <button
                        type="button"
                        key={y}
                        onClick={() => setPeriodViewYear(y)}
                        className={
                          "text-xs border rounded-md px-2 py-1 " +
                          (periodViewYear === y
                            ? "bg-slate-900 border-slate-900 text-white"
                            : "border-slate-200 text-slate-600")
                        }
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-1">Meses de {periodViewYear}</div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {MONTHS.map((m) => {
                      const code = `${periodViewYear}-${m}`;
                      return (
                        <label
                          key={m}
                          className={
                            "flex items-center justify-center gap-1 text-xs border rounded-md px-2 py-1 cursor-pointer " +
                            (newOppForm.periodMonths.includes(code)
                              ? "bg-rose-50 border-rose-300 text-rose-700"
                              : "border-slate-200 text-slate-600")
                          }
                        >
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={newOppForm.periodMonths.includes(code)}
                            onChange={() => setNewOppForm((prev) => ({ ...prev, periodMonths: toggleArrayValue(prev.periodMonths, code) }))}
                          />
                          {m}
                        </label>
                      );
                    })}
                  </div>
                </div>
                {newOppForm.periodMonths.length > 0 && (
                  <div className="text-xs text-slate-500">
                    Selecionado: {formatPeriod(newOppForm.periodMonths)}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-500 mb-1 block">Briefing para o planejamento comercial</label>
              <textarea
                required
                value={newOppForm.briefing}
                onChange={(e) => setNewOppForm({ ...newOppForm, briefing: e.target.value })}
                placeholder="Descreva o contexto da negociação, expectativas do cliente, formatos de interesse, referências de campanhas anteriores e qualquer detalhe relevante para a equipe de planejamento montar a proposta."
                rows={5}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm resize-y"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Data de criação</label>
                <input
                  type="date"
                  value={newOppForm.createdAt}
                  disabled
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-slate-50 text-slate-400"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Data de entrega</label>
                <input
                  type="date"
                  required
                  value={newOppForm.deliveryDate}
                  onChange={(e) => setNewOppForm({ ...newOppForm, deliveryDate: e.target.value })}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Previsão de fechamento</label>
                <input
                  type="date"
                  required
                  value={newOppForm.expectedCloseDate}
                  onChange={(e) => setNewOppForm({ ...newOppForm, expectedCloseDate: e.target.value })}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
                />
              </div>
            </div>

            <button type="submit" className="bg-slate-900 text-white rounded-md py-2 text-sm mt-1 hover:bg-slate-800">Salvar oportunidade</button>
          </form>
        </div>
      )}

      {showSendProposal && (
        <div className="fixed inset-0 bg-slate-900/30 flex items-center justify-center z-50" onClick={() => setShowSendProposal(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-lg p-6 w-full max-w-sm flex flex-col gap-3">
            <div className="flex items-center justify-between mb-1">
              <div className="font-medium text-slate-800">Enviar proposta</div>
              <button onClick={() => setShowSendProposal(false)}><X size={16} className="text-slate-400" /></button>
            </div>
            <div className="text-xs text-slate-500">{sendProposalTemplate ? sendProposalTemplate.title : ""}</div>

            <div>
              <label className="text-xs text-slate-500 mb-1 block">Contato</label>
              <select
                value={sendProposalContactId}
                onChange={(e) => setSendProposalContactId(e.target.value)}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
              >
                <option value="">Selecionar contato</option>
                {contacts.map((c) => {
                  const client = advertisers.find((a) => a.id === c.clientId);
                  return (
                    <option key={c.id} value={c.id}>{c.name}{client ? ` — ${client.name}` : ""}</option>
                  );
                })}
              </select>
              {sendProposalContact && !sendProposalContact.email && (
                <div className="text-xs text-amber-600 mt-1">Esse contato não tem e-mail cadastrado.</div>
              )}
            </div>

            <div>
              <label className="text-xs text-slate-500 mb-1 block">Oportunidade (opcional)</label>
              <select
                value={sendProposalOppId}
                onChange={(e) => setSendProposalOppId(e.target.value)}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
              >
                <option value="">Nenhuma</option>
                {openOpps.map((o) => {
                  const adv = advertisers.find((a) => a.id === o.advertiserId);
                  return (
                    <option key={o.id} value={o.id}>{o.title} — {adv ? adv.name : ""}</option>
                  );
                })}
              </select>
            </div>

            <a
              href={sendProposalMailto || undefined}
              onClick={(e) => {
                if (!sendProposalMailto) {
                  e.preventDefault();
                  return;
                }
                confirmProposalSent();
              }}
              className={
                "rounded-md py-2 text-sm mt-1 flex items-center justify-center gap-2 " +
                (sendProposalMailto ? "bg-rose-600 text-white hover:bg-rose-700 cursor-pointer" : "bg-slate-200 text-slate-400 cursor-not-allowed")
              }
            >
              Baixar PDF e abrir e-mail
            </a>
            <div className="text-xs text-slate-400">
              O PDF é baixado automaticamente — anexe-o manualmente no e-mail que abrir, já com destinatário e assunto preenchidos.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
