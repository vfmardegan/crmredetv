import React, { useState, useEffect, useMemo } from "react";
import {
  LayoutDashboard,
  GitBranch,
  Building2,
  Users,
  FileText,
  Plus,
  X,
  Briefcase,
  ClipboardList,
  Loader2,
  Bell,
  Sparkles,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Pencil
} from "lucide-react";

import { apiGet, apiPost, apiPut, apiDelete, iaSummarize, requestGoogleScopes } from "./services/api";
import Login from "./components/Login";
import {
  DIRECT_CLIENT_ID,
  DIRECT_CLIENT_OPTION,
  YEARS,
  MONTHS,
  STAGES,
  STAGE_STYLES,
  TV_PRODUCTS,
  DIGITAL_PRODUCTS,
  SPECIAL_PROJECTS,
  ALL_PRODUCTS,
  SEGMENTOS,
  DECISION_LEVELS,
  HOBBIES,
  SPORTS,
  todayStr,
  toInputDate,
  formatCNPJ,
  formatCelular,
  formatBRL,
  formatThousandsBR,
  formatPeriod,
  formatDate,
  emptyOppForm,
  PROPOSAL_TEMPLATES,
  buildProposalEmailBody,
  normalizeAdvertiser,
  normalizeContact,
  normalizeOpportunity,
  toggleArrayValue,
  toggleMultiWithNone,
  segMatches,
  normalizeSegmentName,
  hasPermission,
  uid,
  getClientInactivityStatus,
  getAgencyInactivityStatus
} from "./utils/helpers";

import {
  ClientSearchField,
  MultiClientSearchField,
  ContactSearchField,
  AnyClientSearchField
} from "./components/UI/SearchFields";

const DashboardTab = React.lazy(() => import("./components/DashboardTab"));
const PipelineKanbanTab = React.lazy(() => import("./components/PipelineKanbanTab"));
const PlanningTab = React.lazy(() => import("./components/PlanningTab"));
const AdvertisersTab = React.lazy(() => import("./components/AdvertisersTab"));
const ContactsTab = React.lazy(() => import("./components/ContactsTab"));
const ProposalsTab = React.lazy(() => import("./components/ProposalsTab"));
const ExecutivosTab = React.lazy(() => import("./components/ExecutivosTab"));
const AccessTab = React.lazy(() => import("./components/AccessTab"));

function TabLoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center py-28 text-slate-400 gap-3">
      <Loader2 className="animate-spin text-rose-500" size={32} />
      <span className="text-xs font-medium text-slate-400">Carregando visualização...</span>
    </div>
  );
}
import AudioRecorder from "./components/AudioRecorder";
import NewAdvertiserModal from "./components/Modals/NewAdvertiserModal";
import NewContactModal from "./components/Modals/NewContactModal";
import NewOpportunityModal from "./components/Modals/NewOpportunityModal";

const seedExecutivos = [
  { id: "e1", nome: "Bruno Camargo" },
  { id: "e2", nome: "Ana Beatriz Souza" },
  { id: "e3", nome: "Diego Martins" },
  { id: "e4", nome: "Larissa Ferreira" },
  { id: "e5", nome: "Rodrigo Nunes" },
];

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

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("crm_session_token") || null);
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("crm_user_profile");
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });

  const [advertisers, setAdvertisers] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [allProducts, setAllProducts] = useState({ televisao: TV_PRODUCTS, digital: DIGITAL_PRODUCTS, especiais: SPECIAL_PROJECTS });
  const [proposalTemplates, setProposalTemplates] = useState(PROPOSAL_TEMPLATES);
  const [contactDaysFilter, setContactDaysFilter] = useState("all");
  const [pipelineSearch, setPipelineSearch] = useState("");
  const [view, setView] = useState(() => {
    try {
      const stored = localStorage.getItem("crm_user_profile");
      const usr = stored ? JSON.parse(stored) : null;
      if (usr && !hasPermission(usr.perfil, "can_view_dashboard")) return "pipeline";
    } catch (e) {}
    return "dashboard";
  });
  const [selectedAdvertiserId, setSelectedAdvertiserId] = useState(null);
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [showNewAdvertiser, setShowNewAdvertiser] = useState(false);
  const [showNewOpportunity, setShowNewOpportunity] = useState(false);
  const [pendingOppClientField, setPendingOppClientField] = useState(null);
  const [pendingOppContact, setPendingOppContact] = useState(false);
  const [showQuickCreateClient, setShowQuickCreateClient] = useState(false);
  const [pendingContactClient, setPendingContactClient] = useState(false);
  const [editingClientId, setEditingClientId] = useState(null);
  const [editingContactId, setEditingContactId] = useState(null);
  const [faturamentoEfetivo, setFaturamentoEfetivo] = useState(seedFaturamentoEfetivo);
  const [monthlyMetas, setMonthlyMetas] = useState(seedMetas);
  const [executivos, setExecutivos] = useState(seedExecutivos);
  const [segmentoExecutivo, setSegmentoExecutivo] = useState(seedSegmentoExecutivo);
  const [showNewExecutivo, setShowNewExecutivo] = useState(false);
  const [newExecutivoForm, setNewExecutivoForm] = useState({ nome: "", email: "" });
  const [editingCarteiraId, setEditingCarteiraId] = useState(null);
  const [executivoKeyAccounts, setExecutivoKeyAccounts] = useState({});
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
  const [periodViewYear, setPeriodViewYear] = useState(2026);
  const [segmentFilter, setSegmentFilter] = useState([]);
  const [productFilter, setProductFilter] = useState([]);
  const [agencyFilter, setAgencyFilter] = useState([]);
  const [executivoFilter, setExecutivoFilter] = useState([]);
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
  const [sendProposalSubject, setSendProposalSubject] = useState("");
  const [sendProposalBody, setSendProposalBody] = useState("");
  const [sendingProposal, setSendingProposal] = useState(false);
  const [pendingOppAfterProposal, setPendingOppAfterProposal] = useState(null); // { contactName, clientId }
  const [editingOppId, setEditingOppId] = useState(null);

  const [showSendCustomEmail, setShowSendCustomEmail] = useState(false);
  const [sendCustomEmailContactId, setSendCustomEmailContactId] = useState("");
  const [sendCustomEmailSubject, setSendCustomEmailSubject] = useState("");
  const [sendCustomEmailBody, setSendCustomEmailBody] = useState("");
  const [sendCustomEmailAttachmentBase64, setSendCustomEmailAttachmentBase64] = useState("");
  const [sendCustomEmailAttachmentName, setSendCustomEmailAttachmentName] = useState("");
  const [sendingCustomEmail, setSendingCustomEmail] = useState(false);
  const [customEmailIsProposal, setCustomEmailIsProposal] = useState(false);
  const [showScheduleMeeting, setShowScheduleMeeting] = useState(false);
  const [scheduleMeetingClientId, setScheduleMeetingClientId] = useState("");
  const [scheduleMeetingTitle, setScheduleMeetingTitle] = useState("");
  const [scheduleMeetingDate, setScheduleMeetingDate] = useState("");
  const [scheduleMeetingTime, setScheduleMeetingTime] = useState("");
  const [scheduleMeetingDuration, setScheduleMeetingDuration] = useState("60");
  const [scheduleMeetingDescription, setScheduleMeetingDescription] = useState("");
  const [scheduleMeetingGuests, setScheduleMeetingGuests] = useState([]);
  const [schedulingMeeting, setSchedulingMeeting] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [responsaveis, setResponsaveis] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [activeToast, setActiveToast] = useState(null);
  const [transcriptionPreviewData, setTranscriptionPreviewData] = useState(null);
  const [showTranscriptionPreview, setShowTranscriptionPreview] = useState(false);
  const [highlightedOppId, setHighlightedOppId] = useState(null);
  const [selectedOppId, setSelectedOppId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [warningMsg, setWarningMsg] = useState("");

  useEffect(() => {
    if (user && !hasPermission(user.perfil, "can_view_dashboard") && view === "dashboard") {
      setView("pipeline");
    }
  }, [user, view]);

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

  const reloadBootstrapData = async () => {
    try {
      const parsed = await apiGet("/bootstrap");
      const normalizedAdvertisers = (parsed.advertisers || []).map(normalizeAdvertiser);
      setAdvertisers(normalizedAdvertisers);
      setOpportunities((parsed.opportunities || []).map(normalizeOpportunity));
      setProposals(parsed.proposals || []);
      setFaturamentoEfetivo(Array.isArray(parsed.faturamentoEfetivo) ? parsed.faturamentoEfetivo : []);
      setMonthlyMetas(parsed.monthlyMetas && typeof parsed.monthlyMetas === "object" ? parsed.monthlyMetas : {});
      setExecutivos(Array.isArray(parsed.executivos) ? parsed.executivos : []);
      setSegmentoExecutivo(parsed.segmentoExecutivo && typeof parsed.segmentoExecutivo === "object" ? parsed.segmentoExecutivo : {});
      setExecutivoKeyAccounts(parsed.executivoKeyAccounts && typeof parsed.executivoKeyAccounts === "object" ? parsed.executivoKeyAccounts : {});
      setContacts((parsed.contacts || []).map(normalizeContact));
      setResponsaveis(Array.isArray(parsed.responsaveis) ? parsed.responsaveis : []);
      if (Array.isArray(parsed.produtos)) {
        const activeRows = parsed.produtos.filter((p) => p.ativo !== false);
        setAllProducts({
          televisao: activeRows.filter((p) => p.categoria === "televisao").map((p) => p.nome),
          digital:   activeRows.filter((p) => p.categoria === "digital").map((p) => p.nome),
          especiais: activeRows.filter((p) => p.categoria === "especiais").map((p) => p.nome),
        });
      }
    } catch (e) {
      console.error("Falha ao carregar dados da API:", e);
      setErrorMsg("Não foi possível carregar os dados do servidor. Tente recarregar a página.");
    }
  };

  useEffect(() => {
    if (!token) {
      setLoaded(true);
      return;
    }
    setLoaded(false);
    (async () => {
      await reloadBootstrapData();
      setLoaded(true);
    })();
  }, [token]);

  // Carrega lista de produtos do backend (pode ter sido atualizado via Gestão e Acessos)
  useEffect(() => {
    if (!token) return;
    apiGet("/admin/produtos")
      .then((rows) => {
        const activeRows = rows.filter((p) => p.ativo !== false);
        setAllProducts({
          televisao: activeRows.filter((p) => p.categoria === "televisao").map((p) => p.nome),
          digital:   activeRows.filter((p) => p.categoria === "digital").map((p) => p.nome),
          especiais: activeRows.filter((p) => p.categoria === "especiais").map((p) => p.nome),
        });
      })
      .catch(() => { /* usa fallback estático */ });
  }, [token]);

  // Carrega propostas padrão do backend
  function loadProposalTemplates() {
    if (!token) return;
    apiGet("/proposal-templates")
      .then((rows) => {
        if (rows && rows.length > 0) setProposalTemplates(rows);
      })
      .catch(() => { /* usa fallback estático PROPOSAL_TEMPLATES */ });
  }
  useEffect(() => { loadProposalTemplates(); }, [token]);

  // Carrega notificações passadas no boot
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const list = await apiGet("/notifications");
        setNotifications(list);
        setUnreadCount(list.filter((n) => !n.read).length);
      } catch (err) {
        console.error("Erro ao carregar notificações do servidor:", err);
      }
    })();
  }, [token]);

  // Conecta ao WebSocket do backend
  useEffect(() => {
    if (!token) return;

    const wsProto = window.location.protocol === "https:" ? "wss:" : "ws:";
    const socketUrl = `${wsProto}//${window.location.host}/api/v1/ws?token=${token}`;

    let ws = new WebSocket(socketUrl);

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.event === "notification") {
          const newNotif = payload.data;
          
          setNotifications((prev) => [newNotif, ...prev]);
          setUnreadCount((prev) => prev + 1);
          setActiveToast(newNotif);
          
          // Toca som discreto de alerta
          try {
            const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav");
            audio.volume = 0.15;
            audio.play().catch(() => {});
          } catch (e) {}

          // Dispensa o toast após 6s
          setTimeout(() => {
            setActiveToast((curr) => curr && curr.id === newNotif.id ? null : curr);
          }, 6000);
        }
      } catch (e) {
        console.error("Erro ao ler socket payload:", e);
      }
    };

    ws.onclose = () => {
      // Reconectar após 5 segundos
      setTimeout(() => {
        if (localStorage.getItem("crm_session_token")) {
          // Trigger a re-render or reconnection by touching state
        }
      }, 5000);
    };

    return () => {
      ws.close();
    };
  }, [token]);

  async function handleMarkAllNotificationsAsRead() {
    try {
      await apiPut("/notifications/read", {});
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Falha ao limpar notificações:", err);
    }
  }

  useEffect(() => {
    if (!highlightedOppId || view !== "pipeline") return;
    const el = document.getElementById(`opp-card-${highlightedOppId}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    const t = setTimeout(() => setHighlightedOppId(null), 2500);
    return () => clearTimeout(t);
  }, [highlightedOppId, view]);

  // Listener global da tecla Escape para fechar modais/drawers hierarquicamente ([A11Y-001])
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" || e.keyCode === 27) {
        if (showQuickCreateClient) {
          closeQuickCreateClient();
        } else if (showTranscriptionPreview) {
          setShowTranscriptionPreview(false);
          setTranscriptionPreviewData(null);
        } else if (showSendProposal) {
          setShowSendProposal(false);
        } else if (pendingOppAfterProposal) {
          setPendingOppAfterProposal(null);
        } else if (showSendCustomEmail) {
          setShowSendCustomEmail(false);
        } else if (showScheduleMeeting) {
          setShowScheduleMeeting(false);
        } else if (showNewAdvertiser) {
          closeNewAdvertiser();
        } else if (showNewContact) {
          closeNewContact();
        } else if (showNotificationsDropdown) {
          setShowNotificationsDropdown(false);
        } else if (selectedOppId) {
          setSelectedOppId(null);
        } else if (selectedAdvertiserId) {
          setSelectedAdvertiserId(null);
        } else if (selectedContactId) {
          setSelectedContactId(null);
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    showQuickCreateClient,
    showTranscriptionPreview,
    showSendProposal,
    pendingOppAfterProposal,
    showSendCustomEmail,
    showScheduleMeeting,
    showNewOpportunity,
    showNewAdvertiser,
    showNewContact,
    showNotificationsDropdown,
    selectedOppId,
    selectedAdvertiserId,
    selectedContactId,
  ]);

  function handleLogout() {
    localStorage.removeItem("crm_session_token");
    localStorage.removeItem("crm_user_profile");
    setToken(null);
    setUser(null);
    setView("dashboard");
  }

  function goToOpportunityInPipeline(oppId) {
    setSelectedAdvertiserId(null);
    setSelectedContactId(null);
    setPipelineSearch("");
    const targetOpp = opportunities.find((o) => o.id === oppId);
    if (targetOpp) {
      if (monthFilter.length > 0 && !(targetOpp.periodMonths || []).some((m) => monthFilter.includes(m))) {
        setMonthFilter([]);
      }
      if (segmentFilter.length > 0) {
        const adv = advertisers.find((a) => a.id === targetOpp.advertiserId);
        if (!adv || !segMatches(segmentFilter, adv.segmento)) {
          setSegmentFilter([]);
        }
      }
      if (agencyFilter.length > 0 && !agencyFilter.includes(targetOpp.agencyId)) {
        setAgencyFilter([]);
      }
      if (productFilter.length > 0 && !(targetOpp.products || []).some((p) => productFilter.includes(p))) {
        setProductFilter([]);
      }
    }
    setView("pipeline");
    setHighlightedOppId(oppId);
  }

  function goToContact(contactId) {
    setSelectedAdvertiserId(null);
    setSelectedContactId(contactId);
    setView("contacts");
  }

  function goToAdvertiser(clientId) {
    setSelectedContactId(null);
    setSelectedAdvertiserId(clientId);
    setView("advertisers");
  }

  function updateStage(oppId, newStage) {
    const oldOpps = [...opportunities];
    setOpportunities((prev) =>
      prev.map((o) => (o.id === oppId ? { ...o, stage: newStage } : o))
    );
    apiPut(`/opportunities/${oppId}`, { stage: newStage }).catch((e) => {
      console.error(e);
      setOpportunities(oldOpps);
      setErrorMsg(e.message || "Não foi possível salvar a mudança de estágio no servidor.");
    });
  }

  function updatePlanningField(oppId, field, value) {
    const oldOpps = [...opportunities];
    const updates = { [field]: value };
    
    // Se o status for Entregue ou Cancelado, a data de entrega é preenchida automaticamente com hoje
    if (field === "status" && (value === "Entregue" || value === "Cancelado")) {
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      updates.planDeliveryDate = today;
    }

    setOpportunities((prev) =>
      prev.map((o) => (o.id === oppId ? { ...o, ...updates } : o))
    );
    apiPut(`/opportunities/${oppId}`, updates).catch((e) => {
      console.error(e);
      setOpportunities(oldOpps);
      setErrorMsg(e.message || "Não foi possível salvar essa alteração no servidor.");
    });
  }

  function updateOpportunityProducts(oppId, products, productValues, value) {
    const oldOpps = [...opportunities];
    setOpportunities((prev) =>
      prev.map((o) => (o.id === oppId ? { ...o, products, productValues, value } : o))
    );
    apiPut(`/opportunities/${oppId}`, { products, productValues, value }).catch((e) => {
      console.error(e);
      setOpportunities(oldOpps);
      setErrorMsg(e.message || "Não foi possível salvar a valoração de produtos no servidor.");
    });
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
    const cleanNomeFantasia = (newAdvForm.nomeFantasia || "").trim();
    if (!cleanNomeFantasia) {
      setErrorMsg("O Nome Fantasia é obrigatório.");
      return;
    }
    if (newAdvForm.type === "Anunciante" && !newAdvForm.segmento) {
      setErrorMsg("Selecione um segmento para o anunciante.");
      return;
    }
    const cleanRazaoSocial = (newAdvForm.razaoSocial || "").trim() || cleanNomeFantasia;
    const displayName = cleanNomeFantasia;

    if (editingClientId) {
      const clientId = editingClientId;
      setAdvertisers((prev) => {
        let updated = prev.map((a) =>
          a.id === clientId
            ? {
                ...a,
                codigo: newAdvForm.codigo,
                razaoSocial: cleanRazaoSocial,
                cnpj: newAdvForm.cnpj,
                nomeFantasia: cleanNomeFantasia,
                name: displayName,
                type: newAdvForm.type,
                segmento: newAdvForm.type === "Agência" ? "" : newAdvForm.segmento,
                atendeAnunciantes: newAdvForm.type === "Agência" ? newAdvForm.atendeAnunciantes : a.atendeAnunciantes,
              }
            : a
        );
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
      apiPut(`/clients/${clientId}`, {
        codigo: newAdvForm.codigo, razaoSocial: cleanRazaoSocial, cnpj: newAdvForm.cnpj,
        nomeFantasia: cleanNomeFantasia, type: newAdvForm.type, segmento: newAdvForm.segmento,
      })
        .then(() =>
          newAdvForm.type === "Agência"
            ? apiPut(`/clients/${clientId}/links`, { atendeAnunciantes: newAdvForm.atendeAnunciantes })
            : apiPut(`/clients/${clientId}/links`, { vinculoAgencias: newAdvForm.vinculoAgencias })
        )
        .catch((err) => {
          console.error(err);
          setErrorMsg("Não foi possível salvar as alterações do cliente no servidor.");
        });
      return;
    }

    const adv = {
      id: uid(),
      codigo: newAdvForm.codigo,
      razaoSocial: cleanRazaoSocial,
      cnpj: newAdvForm.cnpj,
      nomeFantasia: cleanNomeFantasia,
      name: displayName,
      type: newAdvForm.type,
      segmento: newAdvForm.type === "Agência" ? "" : newAdvForm.segmento,
      atendeAnunciantes: newAdvForm.type === "Agência" ? newAdvForm.atendeAnunciantes : [],
      contacts: [],
      interactions: [],
    };
    setAdvertisers((prev) => {
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
    apiPost("/clients", adv)
      .then(() =>
        newAdvForm.type === "Agência" && newAdvForm.atendeAnunciantes.length > 0
          ? apiPut(`/clients/${adv.id}/links`, { atendeAnunciantes: newAdvForm.atendeAnunciantes })
          : newAdvForm.type === "Anunciante" && newAdvForm.vinculoAgencias.length > 0
          ? apiPut(`/clients/${adv.id}/links`, { vinculoAgencias: newAdvForm.vinculoAgencias })
          : null
      )
      .catch((err) => {
        console.error(err);
        setErrorMsg("Não foi possível salvar o cliente no servidor.");
      });
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
    setEditingContactId(null);
  }

  function openEditContact(contact) {
    setNewContactForm({
      name: contact.name || "",
      clientId: contact.clientId || "",
      cargo: contact.cargo || "",
      departamento: contact.departamento || "",
      nivelDecisao: contact.nivelDecisao || "",
      celular: contact.celular || "",
      email: contact.email || "",
      esportes: contact.esportes || [],
      esportesOutro: contact.esportesOutro || "",
      hobbies: contact.hobbies || [],
      hobbiesOutro: contact.hobbiesOutro || "",
      timeCoracao: contact.timeCoracao || "",
      filhos: contact.filhos === null || contact.filhos === undefined ? "" : contact.filhos,
    });
    setEditingContactId(contact.id);
    setSelectedContactId(null);
    setShowNewContact(true);
  }

  function handleDeleteClient(clientId) {
    if (user?.perfil !== "admin") {
      setErrorMsg("Apenas administradores podem excluir cadastros de clientes.");
      return;
    }
    const targetClient = advertisers.find((a) => a.id === clientId);
    const clientName = targetClient ? (targetClient.nomeFantasia || targetClient.razaoSocial || targetClient.name) : "este cliente";

    if (!window.confirm(`Tem certeza que deseja excluir permanentemente o cadastro de "${clientName}"?\n\nEsta ação não poderá ser desfeita.`)) {
      return;
    }

    setAdvertisers((prev) => prev.filter((a) => a.id !== clientId));
    setShowNewAdvertiser(false);
    setEditingClientId(null);
    setSelectedAdvertiserId(null);

    apiDelete(`/clients/${clientId}`)
      .then(() => {
        setSuccessMsg(`Cliente "${clientName}" excluído com sucesso.`);
        setTimeout(() => setSuccessMsg(""), 4000);
      })
      .catch((err) => {
        console.error("Erro ao excluir cliente:", err);
        setErrorMsg(err.message || "Não foi possível excluir o cliente no servidor.");
      });
  }

  function handleDeleteContact(contactId) {
    if (user?.perfil !== "admin") {
      setErrorMsg("Apenas administradores podem excluir cadastros de contatos.");
      return;
    }
    const targetContact = contacts.find((c) => c.id === contactId);
    const contactName = targetContact ? targetContact.name : "este contato";

    if (!window.confirm(`Tem certeza que deseja excluir permanentemente o cadastro de "${contactName}"?\n\nEsta ação não poderá ser desfeita.`)) {
      return;
    }

    setContacts((prev) => prev.filter((c) => c.id !== contactId));
    setShowNewContact(false);
    setEditingContactId(null);
    setSelectedContactId(null);

    apiDelete(`/contacts/${contactId}`)
      .then(() => {
        setSuccessMsg(`Contato "${contactName}" excluído com sucesso.`);
        setTimeout(() => setSuccessMsg(""), 4000);
      })
      .catch((err) => {
        console.error("Erro ao excluir contato:", err);
        setErrorMsg(err.message || "Não foi possível excluir o contato no servidor.");
      });
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

  async function addExecutivo(e) {
    e.preventDefault();
    const nome = (newExecutivoForm.nome || "").trim();
    const email = (newExecutivoForm.email || "").trim();
    if (!nome || !email) {
      setErrorMsg("Informe o nome e o e-mail do executivo.");
      return;
    }
    setShowNewExecutivo(false);
    setNewExecutivoForm({ nome: "", email: "" });
    try {
      const res = await apiPost("/executivos", { nome, email });
      setExecutivos((prev) => [...prev, { id: res.id, nome: res.nome || nome, email: res.email || email }]);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Não foi possível salvar o executivo no servidor.");
    }
  }

  async function deleteExecutivo(id) {
    setExecutivos((prev) => prev.filter((e) => e.id !== id));
    setSegmentoExecutivo((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((seg) => {
        if (next[seg] === id) delete next[seg];
      });
      return next;
    });
    if (editingCarteiraId === id) setEditingCarteiraId(null);
    try {
      await apiDelete(`/executivos/${id}`);
    } catch (err) {
      console.error(err);
      setErrorMsg("Não foi possível excluir o executivo no servidor.");
    }
  }

  function assignSegmentoToExecutivo(segmento, executivoId) {
    let novoDono = executivoId;
    setSegmentoExecutivo((prev) => {
      const next = { ...prev };
      const current = next[segmento];
      if (current === executivoId) {
        delete next[segmento];
        novoDono = null;
      } else {
        next[segmento] = executivoId;
      }
      return next;
    });
    apiPut(`/carteira/${encodeURIComponent(segmento)}`, { executivoId: novoDono }).catch((err) => {
      console.error(err);
      setErrorMsg("Não foi possível salvar a carteira no servidor.");
    });
  }


  function confirmQuickCreateClient(e) {
    e.preventDefault();
    const cleanNomeFantasia = (quickCreateName || "").trim();
    if (!cleanNomeFantasia) {
      setErrorMsg("O Nome Fantasia é obrigatório.");
      return;
    }
    if (quickCreateType === "Anunciante" && !quickCreateSegmento) {
      setErrorMsg("Selecione um segmento para o anunciante.");
      return;
    }
    const cleanRazaoSocial = (quickCreateRazaoSocial || "").trim() || cleanNomeFantasia;
    const displayName = cleanNomeFantasia;
    const client = {
      id: uid(),
      codigo: quickCreateCodigo,
      razaoSocial: cleanRazaoSocial,
      cnpj: quickCreateCnpj,
      nomeFantasia: cleanNomeFantasia,
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
    apiPost("/clients", client).catch((err) => {
      console.error(err);
      setErrorMsg("Não foi possível salvar o cliente no servidor.");
    });
  }

  function addContact(e) {
    e.preventDefault();
    if (!newContactForm.name.trim() || !newContactForm.clientId) return;

    if (editingContactId) {
      const cId = editingContactId;
      const updatedContact = {
        id: cId,
        ...newContactForm,
        name: newContactForm.name.trim(),
        filhos: newContactForm.filhos === "" ? "" : Number(newContactForm.filhos) || 0,
      };
      setContacts((prev) => prev.map((c) => (c.id === cId ? updatedContact : c)));
      setEditingContactId(null);
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
      apiPut(`/contacts/${cId}`, updatedContact).catch((err) => {
        console.error(err);
        setErrorMsg("Não foi possível atualizar o contato no servidor.");
      });
      return;
    }
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
    apiPost("/contacts", contact).catch((err) => {
      console.error(err);
      setErrorMsg("Não foi possível salvar o contato no servidor.");
    });
  }

  function openEditOpportunity(oppId) {
    const opp = opportunities.find((o) => o.id === oppId);
    if (!opp) return;
    setEditingOppId(opp.id);
    const hasPlanningRequest = Boolean(
      (opp.status && ["Pendente", "Desenvolvimento", "Aprovação"].includes(opp.status)) ||
      opp.stage === "Desenvolvimento"
    );
    setNewOppForm({
      title: opp.title || "",
      executivo: opp.executivo || "",
      agencyId: opp.agencyId || "",
      advertiserId: opp.advertiserId || "",
      contactId: opp.contactId || "",
      products: opp.products || [],
      value: opp.value !== undefined && opp.value !== null ? String(opp.value) : "",
      periodMonths: opp.periodMonths || [],
      briefing: opp.briefing || "",
      createdAt: toInputDate(opp.createdAt) || todayStr(),
      deliveryDate: toInputDate(opp.deliveryDate),
      expectedCloseDate: toInputDate(opp.expectedCloseDate),
      productValues: opp.productValues || {},
      stage: opp.stage || "Prospecção",
      temperatura: ["Quente", "Morno", "Frio"].includes(opp.stage) ? opp.stage : "Morno",
      solicitarPlanejamento: hasPlanningRequest,
      attachments: opp.attachments || [],
    });
    setShowNewOpportunity(true);
  }

  async function addOpportunity(e) {
    e.preventDefault();
    setErrorMsg("");
    if (!newOppForm.title.trim()) {
      setErrorMsg("O título da oportunidade é obrigatório.");
      return;
    }
    if (!newOppForm.executivo.trim()) {
      setErrorMsg("Selecione o executivo responsável.");
      return;
    }
    if (!newOppForm.agencyId) {
      setErrorMsg("Selecione a agência ou escolha 'Cliente Direto'.");
      return;
    }
    if (!newOppForm.advertiserId) {
      setErrorMsg("Selecione o anunciante.");
      return;
    }
    const contactsForSelection = getAvailableContacts(newOppForm.agencyId, newOppForm.advertiserId);
    if (contactsForSelection.length > 0 && !newOppForm.contactId) {
      setErrorMsg("Selecione um contato para a oportunidade.");
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

    if (newOppForm.solicitarPlanejamento) {
      if (!newOppForm.briefing.trim()) {
        setErrorMsg("Preencha o briefing ao solicitar proposta ao planejamento.");
        return;
      }
      if (!newOppForm.deliveryDate) {
        setErrorMsg("Preencha a data de entrega desejada.");
        return;
      }
    } else {
      if (!newOppForm.expectedCloseDate) {
        setErrorMsg("Preencha a previsão de fechamento.");
        return;
      }
    }

    const existingOpp = editingOppId ? opportunities.find((o) => o.id === editingOppId) : null;

    let targetStage;
    let targetStatus;
    let targetDeliveryDate;
    let targetExpectedCloseDate;

    if (newOppForm.solicitarPlanejamento) {
      targetStage = "Desenvolvimento";
      targetStatus = existingOpp?.status ? existingOpp.status : "Pendente";
      targetDeliveryDate = toInputDate(newOppForm.deliveryDate) || null;
      targetExpectedCloseDate = toInputDate(newOppForm.expectedCloseDate) || targetDeliveryDate || (existingOpp ? toInputDate(existingOpp.expectedCloseDate) : todayStr());
    } else {
      // Se não solicitar proposta ao planejamento, o card não deve ir para a aba Planejamento (status = null)
      targetStage = newOppForm.temperatura || (existingOpp && existingOpp.stage !== "Desenvolvimento" ? existingOpp.stage : "Morno");
      targetStatus = null;
      // Preserva data de entrega histórica se já existir e o usuário não alterou, ou null se não houver
      targetDeliveryDate = toInputDate(newOppForm.deliveryDate) || (existingOpp ? toInputDate(existingOpp.deliveryDate) : null);
      targetExpectedCloseDate = toInputDate(newOppForm.expectedCloseDate) || (existingOpp ? toInputDate(existingOpp.expectedCloseDate) : todayStr());
    }

    const payload = {
      title: newOppForm.title.trim(),
      executivo: newOppForm.executivo.trim(),
      agencyId: newOppForm.agencyId || null,
      advertiserId: newOppForm.advertiserId,
      contactId: newOppForm.contactId || null,
      products: newOppForm.products,
      value: Number(newOppForm.value) || 0,
      periodMonths: newOppForm.periodMonths,
      briefing: newOppForm.solicitarPlanejamento ? newOppForm.briefing.trim() : (newOppForm.briefing || ""),
      createdAt: toInputDate(newOppForm.createdAt) || (existingOpp ? toInputDate(existingOpp.createdAt) : todayStr()),
      deliveryDate: targetDeliveryDate,
      expectedCloseDate: targetExpectedCloseDate,
      stage: targetStage,
      status: targetStatus,
      attachments: newOppForm.attachments || [],
    };

    try {
      if (editingOppId) {
        await apiPut(`/opportunities/${editingOppId}`, payload);
      } else {
        await apiPost("/opportunities", payload);
      }
      const bootData = await apiGet("/bootstrap");
      if (bootData && bootData.opportunities) {
        setOpportunities((bootData.opportunities || []).map(normalizeOpportunity));
      }
      setNewOppForm(emptyOppForm());
      setShowNewOpportunity(false);
      setEditingOppId(null);
    } catch (err) {
      console.error(err);
      setErrorMsg("Não foi possível salvar a oportunidade no servidor: " + (err.message || ""));
    }
  }

  async function deleteOpportunity(oppId) {
    if (!window.confirm("Tem certeza que deseja excluir permanentemente esta oportunidade? Esta ação não pode ser desfeita.")) return;
    const oldOpps = [...opportunities];
    setOpportunities((prev) => prev.filter((o) => o.id !== oppId));
    setSelectedOppId(null);
    try {
      await apiDelete(`/opportunities/${oppId}`);
    } catch (e) {
      console.error(e);
      setOpportunities(oldOpps);
      setErrorMsg(e.message || "Não foi possível excluir a oportunidade no servidor.");
    }
  }

  function addInteraction(advertiserId, type = "note") {
    if (!noteDraft.trim()) return;
    const interaction = {
      id: uid(),
      date: todayStr(),
      note: noteDraft.trim(),
      aiSummary: null,
      aiNextAction: null,
      aiRisk: null,
      type
    };
    setAdvertisers((prev) =>
      prev.map((a) =>
        a.id === advertiserId
          ? { ...a, interactions: [interaction, ...a.interactions] }
          : a
      )
    );
    setNoteDraft("");
    apiPost(`/clients/${advertiserId}/interactions`, interaction).catch((err) => {
      console.error(err);
      setErrorMsg("Não foi possível salvar a interação no servidor.");
    });
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
      
      const parsed = await iaSummarize(advertiserId, interaction.note, history, interactionId);
      
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

  async function generateClientAiSummary(clientId) {
    try {
      const response = await apiPost("/ia/client-summary", { clientId });
      if (response.summary) {
        setAdvertisers((prev) =>
          prev.map((a) => (a.id === clientId ? { ...a, aiSummary: response.summary } : a))
        );
        return response.summary;
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  function handleTranscriptionComplete(result, targetClientId) {
    setTranscriptionPreviewData({ ...result, clientId: targetClientId });
    setShowTranscriptionPreview(true);
  }

  async function saveTranscriptionToTimeline() {
    if (!transcriptionPreviewData) return;
    const { clientId, transcricao, resumo, proxima_acao, risco } = transcriptionPreviewData;
    
    const formattedNote = `Reunião Gravada & Transcrita por IA:\n\nRESUMO:\n${resumo}\n\nTRANSCRIÇÃO:\n${transcricao}`;
    const interaction = {
      id: uid(),
      date: todayStr(),
      note: formattedNote,
      aiSummary: resumo,
      aiNextAction: proxima_acao,
      aiRisk: risco,
    };
    
    setAdvertisers((prev) =>
      prev.map((a) =>
        a.id === clientId
          ? { ...a, interactions: [interaction, ...a.interactions] }
          : a
      )
    );
    
    setShowTranscriptionPreview(false);
    setTranscriptionPreviewData(null);
    
    try {
      await apiPost(`/clients/${clientId}/interactions`, interaction);
    } catch (err) {
      console.error(err);
      setErrorMsg("Não foi possível salvar a transcrição na timeline do cliente.");
    }
  }

  function handleCreateOpportunityFromTranscription() {
    if (!transcriptionPreviewData) return;
    const { clientId, briefing, proxima_acao } = transcriptionPreviewData;
    const advertiser = advertisers.find((a) => a.id === clientId);
    
    const myExecName = user?.perfil === "executivo"
      ? (executivos.find((e) => String(e.id) === String(user?.executivo_id))?.nome || user?.nome || "")
      : "";

    setNewOppForm({
      ...emptyOppForm(),
      executivo: myExecName,
      advertiserId: clientId || "",
      agencyId: (advertiser && advertiser.type === "Agência") ? advertiser.id : "",
      briefing: `Briefing gerado por IA a partir de gravação:\n\n${briefing}\n\nPróxima Ação:\n${proxima_acao}`,
      title: `Oportunidade - ${advertiser ? (advertiser.nomeFantasia || advertiser.razaoSocial) : ""}`,
    });
    
    setShowTranscriptionPreview(false);
    setShowNewOpportunity(true);
  }

  function openSendProposal(templateId, contactId) {
    const targetTemplateId = templateId || (proposalTemplates.length > 0 ? proposalTemplates[0].id : "");
    const template = proposalTemplates.find((t) => t.id === targetTemplateId);
    const targetContactId = contactId || "";
    setSendProposalTemplateId(targetTemplateId);
    setSendProposalContactId(targetContactId);
    setSendProposalOppId("");
    
    const contact = contacts.find((c) => c.id === targetContactId);
    setSendProposalSubject(template ? `Proposta comercial — ${template.title} | RedeTV!` : "");
    setSendProposalBody(template ? buildProposalEmailBody(template, contact ? contact.name : "") : "");
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

  async function sendProposalEmail() {
    const template = proposalTemplates.find((t) => t.id === sendProposalTemplateId);
    const contact = contacts.find((c) => c.id === sendProposalContactId);
    if (!template || !contact) return;

    setSendingProposal(true);
    setErrorMsg("");

    const attachmentsList = [];
    if (template.pdfDataUri) {
      attachmentsList.push({
        base64: template.pdfDataUri,
        filename: template.pdfFileName || "proposta.pdf"
      });
    }
    if (template.xlsDataUri) {
      attachmentsList.push({
        base64: template.xlsDataUri,
        filename: template.xlsFileName || "tabela.xlsx"
      });
    }

    const sendData = {
      templateId: template.id,
      contactId: contact.id,
      opportunityId: null,
      subject: sendProposalSubject,
      body: sendProposalBody,
      attachments: attachmentsList,
      attachmentBase64: template.pdfDataUri,
      attachmentFilename: template.pdfFileName
    };

    const performSend = async () => {
      const response = await apiPost("/proposals/send", sendData);

      // Baixa o PDF automaticamente
      if (template.pdfDataUri) downloadProposalPdf(template);

      const interaction = {
        id: response.interactionId,
        date: todayStr(),
        note: `Proposta comercial — ${template.title} enviada para ${contact.name}\n\nAssunto: ${sendProposalSubject}\n\nMensagem:\n${sendProposalBody}`,
        aiSummary: null,
        aiNextAction: null,
        aiRisk: null,
        type: "proposal"
      };

      setAdvertisers((prev) =>
        prev.map((a) =>
          a.id === contact.clientId
            ? { ...a, interactions: [interaction, ...a.interactions] }
            : a
        )
      );

      setShowSendProposal(false);
      setSendingProposal(false);

      if (response.mocked) {
        setWarningMsg("Proposta registrada no CRM. O disparo de e-mail externo foi simulado internamente.");
      } else {
        setSuccessMsg("Proposta comercial registrada e enviada com sucesso!");
      }

      // Abre modal React de confirmação de oportunidade
      setPendingOppAfterProposal({ contactName: contact.name, clientId: contact.clientId });
    };

    try {
      await performSend();
    } catch (err) {
      if (err.message.includes("credenciais") || err.message.includes("autorizar") || err.message.includes("Google") || err.message.includes("tokens")) {
        requestGoogleScopes(async (oauthResponse) => {
          try {
            await apiPost("/auth/google/callback-code", { code: oauthResponse.code });
            await performSend();
          } catch (callbackErr) {
            setErrorMsg("Falha ao autorizar conta Google: " + callbackErr.message);
          } finally {
            setSendingProposal(false);
          }
        });
      } else {
        setErrorMsg(err.message || "Erro ao enviar e-mail da proposta.");
        setSendingProposal(false);
      }
    }
  }

  function openSendCustomEmail(contactId, isProposal) {
    setSendCustomEmailContactId(contactId);
    setSendCustomEmailSubject("");
    setSendCustomEmailBody("");
    setSendCustomEmailAttachmentBase64("");
    setSendCustomEmailAttachmentName("");
    setCustomEmailIsProposal(!!isProposal);
    setShowSendCustomEmail(true);
  }

  async function sendCustomEmail() {
    const contact = contacts.find((c) => c.id === sendCustomEmailContactId);
    if (!contact) return;

    setSendingCustomEmail(true);
    setErrorMsg("");

    const sendData = {
      contactId: contact.id,
      subject: sendCustomEmailSubject,
      body: sendCustomEmailBody,
      attachmentBase64: sendCustomEmailAttachmentBase64 || null,
      attachmentFilename: sendCustomEmailAttachmentName || null,
      isProposal: customEmailIsProposal
    };

    const performSend = async () => {
      const response = await apiPost("/emails/send", sendData);

      let noteContent = customEmailIsProposal
        ? `Proposta comercial enviada para ${contact.name}\n\nAssunto: ${sendCustomEmailSubject}\n\nMensagem:\n${sendCustomEmailBody}`
        : `E-mail para ${contact.name}\n\nAssunto: ${sendCustomEmailSubject}\n\nMensagem:\n${sendCustomEmailBody}`;
      
      if (sendCustomEmailAttachmentName) {
        noteContent += `\n\n📎 Anexo: ${sendCustomEmailAttachmentName}`;
      }

      const interaction = {
        id: response.interactionId,
        date: todayStr(),
        note: noteContent,
        aiSummary: null,
        aiNextAction: null,
        aiRisk: null,
        type: customEmailIsProposal ? "proposal" : "email"
      };

      setAdvertisers((prev) =>
        prev.map((a) =>
          a.id === contact.clientId
            ? { ...a, interactions: [interaction, ...a.interactions] }
            : a
        )
      );

      setShowSendCustomEmail(false);
      setSendingCustomEmail(false);

      if (response.mocked) {
        setWarningMsg("E-mail registrado no histórico do cliente.");
      } else {
        setSuccessMsg("E-mail enviado e registrado com sucesso!");
      }
    };

    try {
      await performSend();
    } catch (err) {
      if (err.message.includes("credenciais") || err.message.includes("autorizar") || err.message.includes("Google") || err.message.includes("tokens")) {
        requestGoogleScopes(async (oauthResponse) => {
          try {
            await apiPost("/auth/google/callback-code", { code: oauthResponse.code });
            await performSend();
          } catch (callbackErr) {
            setErrorMsg("Falha ao autorizar conta Google: " + callbackErr.message);
            setSendingCustomEmail(false);
          }
        });
      } else {
        setErrorMsg(err.message || "Erro ao enviar e-mail.");
        setSendingCustomEmail(false);
      }
    }
  }

  function openScheduleMeeting(clientId) {
    setScheduleMeetingClientId(clientId);
    setScheduleMeetingTitle("");
    setScheduleMeetingDate(todayStr());
    setScheduleMeetingTime("10:00");
    setScheduleMeetingDuration("60");
    setScheduleMeetingDescription("");
    setScheduleMeetingGuests([]);
    setShowScheduleMeeting(true);
  }

  async function scheduleMeeting() {
    if (!scheduleMeetingClientId || !scheduleMeetingTitle || !scheduleMeetingDate || !scheduleMeetingTime) return;

    setSchedulingMeeting(true);
    setErrorMsg("");

    const meetingData = {
      clientId: scheduleMeetingClientId,
      title: scheduleMeetingTitle,
      date: scheduleMeetingDate,
      time: scheduleMeetingTime,
      duration: scheduleMeetingDuration,
      description: scheduleMeetingDescription,
      guests: scheduleMeetingGuests
    };

    const performSchedule = async () => {
      const response = await apiPost("/calendar/event", meetingData);

      const guestsStr = scheduleMeetingGuests.length > 0 ? `\nParticipantes: ${scheduleMeetingGuests.join(", ")}` : "";
      const durationStr = scheduleMeetingDuration ? `${scheduleMeetingDuration} min` : "1 hora";
      const interaction = {
        id: response.interactionId,
        date: scheduleMeetingDate,
        note: `📅 Compromisso Agendado: ${scheduleMeetingTitle}\nData: ${scheduleMeetingDate} às ${scheduleMeetingTime} (${durationStr})${guestsStr}\n\nDescrição:\n${scheduleMeetingDescription || "Sem descrição"}`,
        aiSummary: null,
        aiNextAction: null,
        aiRisk: null
      };

      setAdvertisers((prev) =>
        prev.map((a) =>
          a.id === scheduleMeetingClientId
            ? { ...a, interactions: [interaction, ...a.interactions] }
            : a
        )
      );

      setShowScheduleMeeting(false);

      if (response.mocked || !response.createdInCalendar) {
        setSuccessMsg("Compromisso registrado com sucesso na agenda do CRM!");
      } else {
        setSuccessMsg("Compromisso agendado com sucesso!");
      }
    };

    try {
      await performSchedule();
    } catch (err) {
      if (err.message.includes("credenciais") || err.message.includes("autorizar") || err.message.includes("Google") || err.message.includes("tokens")) {
        requestGoogleScopes(async (oauthResponse) => {
          try {
            await apiPost("/auth/google/callback-code", { code: oauthResponse.code });
            await performSchedule();
          } catch (callbackErr) {
            setErrorMsg("Falha ao autorizar conta Google: " + callbackErr.message);
          } finally {
            setSchedulingMeeting(false);
          }
        });
      } else {
        setErrorMsg(err.message || "Erro ao agendar compromisso.");
        setSchedulingMeeting(false);
      }
    }
  }

  const advertiserMap = useMemo(() => {
    const map = new Map();
    advertisers.forEach((a) => map.set(a.id, a));
    return map;
  }, [advertisers]);

  const clientSegmentByCodigo = useMemo(() => {
    const map = {};
    (advertisers || []).forEach((a) => {
      if (a.codigo) map[String(a.codigo).trim()] = a.segmento;
    });
    return map;
  }, [advertisers]);

  const clientByIdMap = useMemo(() => {
    const map = {};
    (advertisers || []).forEach((a) => {
      map[a.id] = a;
    });
    return map;
  }, [advertisers]);

  const contactSearchQuery = contactSearch.trim().toLowerCase();
  const filteredContacts = useMemo(() => {
    if (!contactSearchQuery) {
      return contacts.slice().sort((a, b) => (a.name || "").localeCompare(b.name || "", "pt-BR"));
    }
    return contacts
      .filter((c) => {
        const client = advertiserMap.get(c.clientId);
        const nameMatch = (c.name || "").toLowerCase().includes(contactSearchQuery);
        const empresaMatch = client ? (client.name || "").toLowerCase().includes(contactSearchQuery) : false;
        const agencyMatch =
          client && client.type === "Anunciante"
            ? getServingAgencies(client.id).some((ag) => (ag.name || "").toLowerCase().includes(contactSearchQuery))
            : false;
        return nameMatch || empresaMatch || agencyMatch;
      })
      .slice()
      .sort((a, b) => (a.name || "").localeCompare(b.name || "", "pt-BR"));
  }, [contacts, contactSearchQuery, advertiserMap]);

  const clientSearchQuery = clientSearch.trim().toLowerCase();
  const filteredAdvertisers = useMemo(() => {
    const list = !clientSearchQuery
      ? advertisers
      : advertisers.filter((a) => {
          const digits = clientSearchQuery.replace(/\D/g, "");
          return (
            (a.nomeFantasia || "").toLowerCase().includes(clientSearchQuery) ||
            (a.razaoSocial || "").toLowerCase().includes(clientSearchQuery) ||
            (a.codigo || "").toString().toLowerCase().includes(clientSearchQuery) ||
            (digits && (a.cnpj || "").includes(digits))
          );
        });
    return list
      .filter((a) => {
        if (contactDaysFilter === "all") return true;
        const daysLimit = parseInt(contactDaysFilter, 10);
        const status = a.type === "Agência"
          ? getAgencyInactivityStatus(a, getServedAdvertisers(a))
          : getClientInactivityStatus(a);
        if (!status) return false;
        return status.level === daysLimit;
      })
      .slice()
      .sort((a, b) => (a.name || "").localeCompare(b.name || "", "pt-BR"));
  }, [advertisers, clientSearchQuery, contactDaysFilter]);

  const myExecId = useMemo(() => {
    if (!user) return null;
    if (user.executivo_id) return String(user.executivo_id);
    const found = (executivos || []).find(
      (e) =>
        (e.nome && user.nome && e.nome.trim().toLowerCase() === user.nome.trim().toLowerCase()) ||
        (e.email && user.email && e.email.trim().toLowerCase() === user.email.trim().toLowerCase())
    );
    return found ? String(found.id) : null;
  }, [user, executivos]);

  const effectiveDashboardExecutivoFilter = useMemo(() => {
    if (user?.perfil === "executivo") {
      return myExecId ? [myExecId] : [];
    }
    return dashboardExecutivoFilter;
  }, [user?.perfil, myExecId, dashboardExecutivoFilter]);

  const executivoFilterSegmentos = useMemo(() => {
    if (effectiveDashboardExecutivoFilter.length === 0) return null;
    return Object.keys(segmentoExecutivo).filter((seg) => effectiveDashboardExecutivoFilter.map(String).includes(String(segmentoExecutivo[seg])));
  }, [effectiveDashboardExecutivoFilter, segmentoExecutivo]);

  const executivoFilterKeyAccountIds = useMemo(() => {
    if (effectiveDashboardExecutivoFilter.length === 0) return [];
    const set = new Set();
    effectiveDashboardExecutivoFilter.forEach((execId) => {
      (executivoKeyAccounts[execId] || []).forEach((kaId) => set.add(kaId));
    });
    return Array.from(set);
  }, [effectiveDashboardExecutivoFilter, executivoKeyAccounts]);

  const executivoFilterKeyAccountClients = useMemo(() => {
    if (executivoFilterKeyAccountIds.length === 0) return [];
    return (advertisers || []).filter((a) => executivoFilterKeyAccountIds.includes(a.id));
  }, [executivoFilterKeyAccountIds, advertisers]);

  const executivoFilterKeyAccountCodigos = useMemo(() => {
    if (executivoFilterKeyAccountClients.length === 0) return new Set();
    return new Set(executivoFilterKeyAccountClients.map((a) => String(a.codigo || "").trim()).filter(Boolean));
  }, [executivoFilterKeyAccountClients]);

  const executivoFilterNames = useMemo(() => {
    if (effectiveDashboardExecutivoFilter.length === 0) return [];
    return executivos.filter((e) => effectiveDashboardExecutivoFilter.map(String).includes(String(e.id))).map((e) => e.nome);
  }, [effectiveDashboardExecutivoFilter, executivos]);

  const keyAccountExecByCodigo = useMemo(() => {
    const map = {};
    Object.entries(executivoKeyAccounts || {}).forEach(([execId, kaIds]) => {
      (kaIds || []).forEach((kaId) => {
        const client = clientByIdMap[kaId];
        if (client && client.codigo) {
          map[String(client.codigo).trim()] = String(execId);
        }
      });
    });
    return map;
  }, [executivoKeyAccounts, clientByIdMap]);

  const keyAccountExecById = useMemo(() => {
    const map = {};
    Object.entries(executivoKeyAccounts || {}).forEach(([execId, kaIds]) => {
      (kaIds || []).forEach((kaId) => {
        map[kaId] = String(execId);
      });
    });
    return map;
  }, [executivoKeyAccounts]);

  const executivoFilterOptions = useMemo(() => {
    const list = [...executivos];
    const existingNames = new Set(list.map((e) => (e.nome || "").toLowerCase().trim()));
    opportunities.forEach((o) => {
      const name = (o.executivo || "").trim();
      if (name && !existingNames.has(name.toLowerCase())) {
        existingNames.add(name.toLowerCase());
        list.push({ id: o.executivoId || o.executivo_id || name, nome: name });
      }
    });
    return list
      .filter((e) => e.nome)
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
      .map((e) => ({ value: e.id, label: e.nome }));
  }, [executivos, opportunities]);

  const agencyFilterOptions = useMemo(() => [
    { value: DIRECT_CLIENT_ID, label: DIRECT_CLIENT_OPTION.name },
    ...advertisers.filter((a) => a.type === "Agência").map((a) => ({ value: a.id, label: a.name })),
  ], [advertisers]);

  const advertiserFilterOptions = useMemo(() => advertisers
    .filter((a) => a.type === "Anunciante")
    .map((a) => ({ value: a.id, label: a.name })), [advertisers]);

  const dashboardAdvertiserFilterOptions = useMemo(() => {
    if (user?.perfil === "executivo") {
      const myKaSet = new Set((executivoKeyAccounts && myExecId && executivoKeyAccounts[myExecId]) || []);
      const otherKaSet = new Set();
      Object.entries(executivoKeyAccounts || {}).forEach(([exId, kaIds]) => {
        if (String(exId) !== String(myExecId)) {
          (kaIds || []).forEach((id) => otherKaSet.add(id));
        }
      });
      const mySegs = Object.keys(segmentoExecutivo || {}).filter(
        (seg) => String(segmentoExecutivo[seg]) === String(myExecId)
      );

      return (advertisers || [])
        .filter((a) => {
          if (a.type !== "Anunciante") return false;
          if (myKaSet.has(a.id)) return true;
          if (otherKaSet.has(a.id)) return false;
          if (a.segmento && mySegs.some((s) => normalizeSegmentName(s) === normalizeSegmentName(a.segmento))) {
            return true;
          }
          return false;
        })
        .map((a) => ({ value: a.id, label: a.name }));
    }
    return advertiserFilterOptions;
  }, [user?.perfil, myExecId, executivoKeyAccounts, segmentoExecutivo, advertisers, advertiserFilterOptions]);

  if (!token || !user) {
    return (
      <Login
        onLoginSuccess={(tok, usr) => {
          localStorage.setItem("crm_session_token", tok);
          localStorage.setItem("crm_user_profile", JSON.stringify(usr));
          setToken(tok);
          setUser(usr);
          if (!hasPermission(usr?.perfil, "can_view_dashboard")) {
            setView("pipeline");
          } else {
            setView("dashboard");
          }
        }}
      />
    );
  }

  if (!loaded) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-slate-400" size={28} />
      </div>
    );
  }

  const openOpps = opportunities.filter(
    (o) => o.stage !== "Fechado" && o.stage !== "Negado" && o.stage !== "Cancelado"
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
    if (executivoFilter.length > 0) {
      const selectedExecNames = executivoFilterOptions
        .filter((opt) => executivoFilter.includes(opt.value))
        .map((opt) => opt.label.toLowerCase().trim());
      const selectedExecIds = executivoFilter.map(String);

      const oppExecName = (o.executivo || "").toLowerCase().trim();
      const oppExecId = String(o.executivoId || o.executivo_id || "").trim();

      const nameMatch = oppExecName && selectedExecNames.includes(oppExecName);
      const idMatch = oppExecId && selectedExecIds.includes(oppExecId);
      const directMatch = executivoFilter.some(
        (v) => String(v).toLowerCase().trim() === oppExecName || String(v).trim() === oppExecId
      );

      if (!nameMatch && !idMatch && !directMatch) return false;
    }
    if (pipelineSearch.trim()) {
      const q = pipelineSearch.toLowerCase().trim();
      const adv = advertisers.find((a) => a.id === o.advertiserId);
      const ag = o.agencyId && o.agencyId !== DIRECT_CLIENT_ID ? advertisers.find((a) => a.id === o.agencyId) : null;
      
      const titleMatch = (o.title || "").toLowerCase().includes(q);
      const advMatch = adv ? (
        (adv.nomeFantasia || "").toLowerCase().includes(q) ||
        (adv.razaoSocial || "").toLowerCase().includes(q)
      ) : false;
      const agMatch = ag ? (
        (ag.nomeFantasia || "").toLowerCase().includes(q) ||
        (ag.razaoSocial || "").toLowerCase().includes(q)
      ) : false;
      const execMatch = (o.executivo || "").toLowerCase().includes(q);
      const respMatch = (o.responsavel || "").toLowerCase().includes(q);
      const prodMatch = (o.products || []).some((p) => p.toLowerCase().includes(q));
      
      if (!titleMatch && !advMatch && !agMatch && !execMatch && !respMatch && !prodMatch) {
        return false;
      }
    }
    return true;
  });

  function sortByDeadline(opps) {
    return opps.slice().sort((a, b) => {
      const aDate = a.deliveryDate;
      const bDate = b.deliveryDate;
      if (!aDate && !bDate) {
        return b.id - a.id;
      }
      if (!aDate) return 1;
      if (!bDate) return -1;
      return new Date(aDate) - new Date(bDate);
    });
  }
  
  const PLANNING_FINALIZADA_ORDER = ["Comercializado", "Negativado", "Cancelado"];
  const planningGroups = [
    {
      label: "Em Aberto",
      rows: sortByDeadline(opportunities.filter((o) => o.status && ["Pendente", "Desenvolvimento", "Aprovação"].includes(o.status))),
    },
    {
      label: "Entregue",
      rows: sortByDeadline(opportunities.filter((o) => o.status === "Entregue")),
    },
    {
      label: "Finalizado",
      rows: opportunities
        .filter((o) => o.status && PLANNING_FINALIZADA_ORDER.includes(o.status))
        .slice()
        .sort((a, b) => {
          const diff = PLANNING_FINALIZADA_ORDER.indexOf(a.status) - PLANNING_FINALIZADA_ORDER.indexOf(b.status);
          if (diff !== 0) return diff;
          
          const aDate = a.deliveryDate;
          const bDate = b.deliveryDate;
          if (!aDate && !bDate) {
            return b.id - a.id;
          }
          if (!aDate) return 1;
          if (!bDate) return -1;
          return new Date(aDate) - new Date(bDate);
        }),
    },
  ];


  const pipelineActiveFilters = [
    ...segmentFilter.map((v) => ({ type: "Segmento", label: v, clear: () => setSegmentFilter(segmentFilter.filter((x) => x !== v)) })),
    ...productFilter.map((v) => ({ type: "Produto", label: v, clear: () => setProductFilter(productFilter.filter((x) => x !== v)) })),
    ...agencyFilter.map((v) => {
      const opt = agencyFilterOptions.find((o) => o.value === v);
      return { type: "Agência", label: opt ? opt.label : v, clear: () => setAgencyFilter(agencyFilter.filter((x) => x !== v)) };
    }),
    ...executivoFilter.map((v) => {
      const opt = executivoFilterOptions.find((o) => o.value === v);
      return { type: "Executivo", label: opt ? opt.label : v, clear: () => setExecutivoFilter(executivoFilter.filter((x) => x !== v)) };
    }),
    ...monthFilter.map((v) => {
      const [y, m] = v.split("-");
      return { type: "Mês", label: `${m}/${y}`, clear: () => setMonthFilter(monthFilter.filter((x) => x !== v)) };
    }),
    ...(pipelineSearch.trim() ? [{ type: "Busca", label: `"${pipelineSearch.trim()}"`, clear: () => setPipelineSearch("") }] : []),
  ];

  function matchesDashboardFilters(o) {
    if (dashboardSegmentFilter.length > 0) {
      const adv = advertisers.find((a) => a.id === o.advertiserId);
      if (!adv || !segMatches(dashboardSegmentFilter, adv.segmento)) return false;
    }
    if (effectiveDashboardExecutivoFilter.length > 0) {
      const kaOwnerExecId = keyAccountExecById[o.advertiserId] || (o.agencyId ? keyAccountExecById[o.agencyId] : null);
      if (kaOwnerExecId && !effectiveDashboardExecutivoFilter.map(String).includes(String(kaOwnerExecId))) {
        return false;
      }
      const adv = clientByIdMap[o.advertiserId] || advertisers.find((a) => a.id === o.advertiserId);
      const isMySegment = adv && executivoFilterSegmentos && executivoFilterSegmentos.includes(adv.segmento);
      const isMyKeyAccount = executivoFilterKeyAccountIds.includes(o.advertiserId) || (o.agencyId && executivoFilterKeyAccountIds.includes(o.agencyId));
      const isMyOpp = executivoFilterNames.includes(o.executivo);
      if (!isMySegment && !isMyKeyAccount && !isMyOpp) return false;
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

  const dashboardOpps = opportunities.filter((o) => {
    if (!matchesDashboardFilters(o)) return false;
    if (dashboardMonths.length > 0) {
      const monthsInScope = (o.periodMonths || []).filter((m) => m.startsWith(dashboardYear + "-"));
      return monthsInScope.some((m) => dashboardMonths.includes(m.split("-")[1]));
    }
    return true;
  });

  function oppProductValue(o, productFilter = dashboardProductFilter) {
    const totalVal = Number(o.value) || 0;
    if (!productFilter || productFilter.length === 0) return totalVal;

    const prods = o.products || [];
    const numProds = prods.length || 1;
    const matchingProds = prods.filter((p) => productFilter.includes(p));
    if (matchingProds.length === 0) return 0;

    let sum = 0;
    matchingProds.forEach((p) => {
      const allocatedVal = o.productValues?.[p];
      if (allocatedVal !== undefined && allocatedVal !== null && Number(allocatedVal) > 0 && totalVal > 0) {
        sum += Number(allocatedVal);
      } else {
        sum += totalVal / numProds;
      }
    });

    return Math.min(sum, totalVal);
  }

  function rawMonthlyValueOfOpp(o) {
    const n = (o.periodMonths || []).length;
    return n > 0 ? (Number(o.value) || 0) / n : 0;
  }

  function rawPeriodAdjustedValue(o) {
    if (dashboardMonths.length === 0) return Number(o.value) || 0;
    const monthsInYear = (o.periodMonths || []).filter((m) => m.startsWith(dashboardYear + "-"));
    const matched = monthsInYear.filter((m) => dashboardMonths.includes(m.split("-")[1]));
    return rawMonthlyValueOfOpp(o) * matched.length;
  }

  function monthlyValueOfOpp(o) {
    const n = (o.periodMonths || []).length;
    const val = oppProductValue(o, dashboardProductFilter);
    return n > 0 ? val / n : 0;
  }

  function periodAdjustedValue(o) {
    if (dashboardMonths.length === 0) return oppProductValue(o, dashboardProductFilter);
    const monthsInYear = (o.periodMonths || []).filter((m) => m.startsWith(dashboardYear + "-"));
    const matched = monthsInYear.filter((m) => dashboardMonths.includes(m.split("-")[1]));
    return monthlyValueOfOpp(o) * matched.length;
  }

  const sumByStage = (stage) => dashboardOpps.filter((o) => o.stage === stage).reduce((s, o) => s + periodAdjustedValue(o), 0);
  const countByStage = (stage) => dashboardOpps.filter((o) => o.stage === stage).length;

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

  const STAGE_WEIGHTS = { Frio: 0, Morno: 0.1, Quente: 0.7 };
  const isProductFiltered = dashboardProductFilter.length > 0;
  const metaVisible = !isProductFiltered && dashboardAgencyFilter.length === 0 && dashboardAdvertiserFilter.length === 0;
  
  const effectiveMonthsForResultado = dashboardMonths.length > 0 ? dashboardMonths : MONTHS;

  const visaoGeralFaturamentoData = MONTHS.map((m) => {
    if (isProductFiltered) {
      return { month: m, Faturamento: 0, Pipeline: 0, Meta: 0 };
    }
    const code = `${dashboardYear}-${m}`;
    const codeLower = code.toLowerCase();
    const monthInScope = effectiveMonthsForResultado.includes(m);
    const hasActiveFilters =
      dashboardSegmentFilter.length > 0 ||
      effectiveDashboardExecutivoFilter.length > 0 ||
      dashboardAdvertiserFilter.length > 0;

    const efetivo = !monthInScope
      ? 0
      : faturamentoEfetivo
          .filter((f) => {
            if ((f.periodo || "").toLowerCase() !== codeLower) return false;
            if (hasActiveFilters) {
              const clientCod = String(f.clienteCodigo || "").trim();
              const client = advertisers.find(
                (a) => String(a.codigo || "").trim() === clientCod
              );
              if (!client) return false;
              if (dashboardSegmentFilter.length > 0 && !segMatches(dashboardSegmentFilter, client.segmento)) return false;

              if (effectiveDashboardExecutivoFilter.length > 0) {
                const kaOwnerExecId = keyAccountExecByCodigo[clientCod] || keyAccountExecById[client.id];
                if (kaOwnerExecId && !effectiveDashboardExecutivoFilter.map(String).includes(String(kaOwnerExecId))) {
                  return false;
                }
                const seg = clientSegmentByCodigo[clientCod] || client.segmento;
                const isMySegment = seg && executivoFilterSegmentos && executivoFilterSegmentos.some((s) => normalizeSegmentName(s) === normalizeSegmentName(seg));
                const isMyKeyAccount = executivoFilterKeyAccountCodigos.has(clientCod) || executivoFilterKeyAccountIds.includes(client.id);
                if (!isMySegment && !isMyKeyAccount) return false;
              }

              if (dashboardAdvertiserFilter.length > 0 && !dashboardAdvertiserFilter.includes(client.id)) return false;
            }
            return true;
          })
          .reduce((s, f) => s + (Number(f.valor) || 0), 0);
    const potencial = !monthInScope
      ? 0
      : dashboardOpps
          .filter(
            (o) =>
              ["Frio", "Morno", "Quente"].includes(o.stage) &&
              (o.periodMonths || []).some((pm) => (pm || "").toLowerCase() === codeLower)
          )
          .reduce((s, o) => s + monthlyValueOfOpp(o) * STAGE_WEIGHTS[o.stage], 0);

    let meta = 0;
    if (monthInScope && metaVisible) {
      if (effectiveDashboardExecutivoFilter.length > 0) {
        effectiveDashboardExecutivoFilter.forEach((execId) => {
          const execIdStr = String(execId);
          const execSegs = Object.keys(segmentoExecutivo).filter((seg) => String(segmentoExecutivo[seg]) === execIdStr);
          const execKaIds = executivoKeyAccounts[execId] || [];

          execSegs.forEach((seg) => {
            if (dashboardSegmentFilter.length > 0 && !segMatches(dashboardSegmentFilter, seg)) return;
            meta += (monthlyMetas[seg] && (monthlyMetas[seg][code] || monthlyMetas[seg][codeLower])) || 0;
          });

          execKaIds.forEach((kaId) => {
            const kaClient = clientByIdMap[kaId];
            if (dashboardSegmentFilter.length > 0 && (!kaClient || !segMatches(dashboardSegmentFilter, kaClient.segmento))) return;
            const key = `keyaccount:${kaId}`;
            meta += (monthlyMetas[key] && (monthlyMetas[key][code] || monthlyMetas[key][codeLower])) || 0;
          });
        });
      } else {
        const metaKeys = Object.keys(monthlyMetas);
        metaKeys.forEach((key) => {
          if (key.startsWith("keyaccount:")) {
            const kaId = key.replace("keyaccount:", "").trim();
            const kaClient = clientByIdMap[kaId];
            if (dashboardSegmentFilter.length > 0 && (!kaClient || !segMatches(dashboardSegmentFilter, kaClient.segmento))) return;
            meta += (monthlyMetas[key] && (monthlyMetas[key][code] || monthlyMetas[key][codeLower])) || 0;
          } else {
            if (dashboardSegmentFilter.length > 0 && !segMatches(dashboardSegmentFilter, key)) return;
            meta += (monthlyMetas[key] && (monthlyMetas[key][code] || monthlyMetas[key][codeLower])) || 0;
          }
        });
      }
    }
    return { month: m, Faturamento: efetivo, Pipeline: potencial, Meta: meta };
  });

  const visaoGeralFaturamentoEfetivoTotal = isProductFiltered ? 0 : visaoGeralFaturamentoData.reduce((s, m) => s + m.Faturamento, 0);
  const visaoGeralFaturamentoPotencialTotal = isProductFiltered ? 0 : visaoGeralFaturamentoData.reduce((s, m) => s + m.Pipeline, 0);
  const visaoGeralMetaAnoTotal = isProductFiltered ? 0 : visaoGeralFaturamentoData.reduce((s, m) => s + m.Meta, 0);
  
  const gapParaMeta = isProductFiltered ? 0 : Math.max(0, visaoGeralMetaAnoTotal - visaoGeralFaturamentoEfetivoTotal);
  const gapPipeline = isProductFiltered ? 0 : Math.min(gapParaMeta, visaoGeralFaturamentoPotencialTotal);
  const gapAProduzir = isProductFiltered ? 0 : Math.max(0, gapParaMeta - visaoGeralFaturamentoPotencialTotal);
  
  const metaAtingida = !isProductFiltered && visaoGeralFaturamentoEfetivoTotal >= visaoGeralMetaAnoTotal;
  const visaoGeralAtingimentoPercent =
    !isProductFiltered && visaoGeralMetaAnoTotal > 0 ? (visaoGeralFaturamentoEfetivoTotal / visaoGeralMetaAnoTotal) * 100 : 0;
  const faturadoMenosMeta = isProductFiltered ? 0 : visaoGeralFaturamentoEfetivoTotal - visaoGeralMetaAnoTotal;
  
  const resumoAnoData = isProductFiltered
    ? [
        { name: "Meta", Meta: 0, Faturado: 0, Pipeline: 0, AProduzir: 0, totalTop: 0 },
        { name: "Faturado", Meta: 0, Faturado: 0, Pipeline: 0, AProduzir: 0, totalTop: 0 },
        { name: "GAP", Meta: 0, Faturado: 0, Pipeline: 0, AProduzir: 0, totalTop: 0 },
      ]
    : [
        { name: "Meta", Meta: visaoGeralMetaAnoTotal, Faturado: 0, Pipeline: 0, AProduzir: 0, totalTop: visaoGeralMetaAnoTotal },
        { name: "Faturado", Meta: 0, Faturado: visaoGeralFaturamentoEfetivoTotal, Pipeline: 0, AProduzir: 0, totalTop: visaoGeralFaturamentoEfetivoTotal },
        { name: "GAP", Meta: 0, Faturado: 0, Pipeline: gapPipeline, AProduzir: gapAProduzir, totalTop: -gapParaMeta },
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
      stageValues[s] = opps.filter((o) => o.stage === s).reduce((sum, o) => {
        const numProds = (o.products || []).length || 1;
        const allocatedVal = o.productValues?.[p];
        let valForProduct = 0;
        
        if (allocatedVal !== undefined && allocatedVal !== null && Number(allocatedVal) > 0 && o.value > 0) {
          const fraction = Number(allocatedVal) / o.value;
          valForProduct = rawPeriodAdjustedValue(o) * fraction;
        } else {
          valForProduct = rawPeriodAdjustedValue(o) / numProds;
        }
        
        return sum + valForProduct;
      }, 0);
    });
    const PIPELINE_TOTAL_STAGES = ["Frio", "Morno", "Quente", "Fechado", "Negado"];
    const total = PIPELINE_TOTAL_STAGES.reduce((sum, s) => sum + (stageValues[s] || 0), 0);
    const hasAnyStageValue = STAGES.some((s) => (stageValues[s] || 0) > 0);
    const emAberto = (stageValues["Frio"] || 0) + (stageValues["Morno"] || 0) + (stageValues["Quente"] || 0);
    const fechado = stageValues["Fechado"] || 0;
    const negado = stageValues["Negado"] || 0;
    const taxaConversao = fechado + negado > 0 ? fechado / (fechado + negado) : null;
    return { product: p, stageValues, total, hasAnyStageValue, emAberto, taxaConversao };
  }

  function sumProductRows(rows) {
    const stageValues = {};
    STAGES.forEach((s) => {
      stageValues[s] = rows.reduce((sum, r) => sum + (r.stageValues[s] || 0), 0);
    });
    const total = rows.reduce((sum, r) => sum + (r.total || 0), 0);
    const emAberto = rows.reduce((sum, r) => sum + (r.emAberto || 0), 0);
    const fechado = stageValues["Fechado"] || 0;
    const negado = stageValues["Negado"] || 0;
    const taxaConversao = fechado + negado > 0 ? fechado / (fechado + negado) : null;
    return { stageValues, total, emAberto, taxaConversao };
  }

  const productFilterMatches = (p) => dashboardProductFilter.length === 0 || dashboardProductFilter.includes(p);
  const tvProductRows = allProducts.televisao.filter(productFilterMatches).map(computeProductRow).filter((r) => r.hasAnyStageValue);
  const digitalProductRows = allProducts.digital.filter(productFilterMatches).map(computeProductRow).filter((r) => r.hasAnyStageValue);
  const specialProductRows = allProducts.especiais.filter(productFilterMatches).map(computeProductRow).filter((r) => r.hasAnyStageValue);
  const tvProductTotals = sumProductRows(tvProductRows);
  const digitalProductTotals = sumProductRows(digitalProductRows);
  const specialProductTotals = sumProductRows(specialProductRows);

  const selectedAdvertiser = advertisers.find((a) => a.id === selectedAdvertiserId);
  const selectedContact = contacts.find((c) => c.id === selectedContactId);
  
  const selectedOpp = opportunities.find((o) => o.id === selectedOppId);
  const selectedOppAdvertiser = selectedOpp ? advertisers.find((a) => a.id === selectedOpp.advertiserId) : null;
  const selectedOppAgency = selectedOpp && selectedOpp.agencyId && selectedOpp.agencyId !== DIRECT_CLIENT_ID
    ? advertisers.find((a) => a.id === selectedOpp.agencyId)
    : null;
  const selectedOppContact = selectedOpp ? contacts.find((c) => c.id === selectedOpp.contactId) : null;

  const canEditOppStage = (() => {
    if (!user || !selectedOpp) return false;
    if (!hasPermission(user.perfil, "can_edit_opportunities")) return false;
    if (user.perfil === "admin") return true;
    if (user.perfil === "diretor") return true;
    if (user.perfil === "especialista") return true;
    if (user.perfil === "executivo") {
      if (user.executivo_id && selectedOpp.executivoId) {
        return String(user.executivo_id) === String(selectedOpp.executivoId);
      }
      if (user.executivo_id) {
        const myExec = executivos.find((e) => String(e.id) === String(user.executivo_id));
        if (myExec && selectedOpp.executivo) {
          return myExec.nome?.toLowerCase() === selectedOpp.executivo.toLowerCase();
        }
      }
      return Boolean(user.nome && selectedOpp.executivo && user.nome.toLowerCase() === selectedOpp.executivo.toLowerCase());
    }
    return false;
  })();

  const sendProposalTemplate = proposalTemplates.find((t) => t.id === sendProposalTemplateId) || null;
  const sendProposalContact = contacts.find((c) => c.id === sendProposalContactId) || null;
  const sendProposalMailto =
    sendProposalTemplate && sendProposalContact && sendProposalContact.email
      ? `mailto:${sendProposalContact.email}?subject=${encodeURIComponent(`Proposta comercial — ${sendProposalTemplate.title} | RedeTV!`)}&body=${encodeURIComponent(buildProposalEmailBody(sendProposalTemplate, sendProposalContact.name))}`
      : null;

  function getClientTotalValue(a) {
    return opportunities
      .filter((o) => o.advertiserId === a.id || o.agencyId === a.id)
      .reduce((s, o) => s + o.value, 0);
  }
  
  const availableContacts = getAvailableContacts(newOppForm.agencyId, newOppForm.advertiserId);

  function computeExecutivoKpis(executivo) {
    const execIdStr = String(executivo.id);
    const segmentos = Object.keys(segmentoExecutivo).filter((seg) => String(segmentoExecutivo[seg]) === execIdStr);
    const keyAccountIds = executivoKeyAccounts[executivo.id] || [];
    const keyAccountClients = (advertisers || []).filter((a) => keyAccountIds.includes(a.id));
    const keyAccountCodigos = new Set(keyAccountClients.map((a) => String(a.codigo || "").trim()).filter(Boolean));

    let faturamento = 0;
    let pipeline = 0;
    let pipelineTotal = 0;
    let meta = 0;

    MONTHS.forEach((m) => {
      const code = `${executivoYear}-${m}`.toLowerCase();
      faturamento += faturamentoEfetivo
        .filter((f) => {
          if ((f.periodo || "").toLowerCase() !== code) return false;
          const cod = String(f.clienteCodigo || "").trim();
          const kaOwnerExecId = keyAccountExecByCodigo[cod];
          
          if (kaOwnerExecId && kaOwnerExecId !== execIdStr) {
            return false;
          }

          const seg = clientSegmentByCodigo[cod];
          const isMySegment = seg && segmentos.some((s) => normalizeSegmentName(s) === normalizeSegmentName(seg));
          return keyAccountCodigos.has(cod) || isMySegment;
        })
        .reduce((s, f) => s + (Number(f.valor) || 0), 0);

      const oppsAbertoNoMes = opportunities.filter((o) => {
        if (!["Frio", "Morno", "Quente"].includes(o.stage)) return false;
        if (!(o.periodMonths || []).some((pm) => (pm || "").toLowerCase() === code)) return false;
        const kaOwnerExecId = keyAccountExecById[o.advertiserId] || (o.agencyId ? keyAccountExecById[o.agencyId] : null);
        if (kaOwnerExecId && String(kaOwnerExecId) !== execIdStr) {
          return false;
        }
        const adv = clientByIdMap[o.advertiserId];
        const isMySegment = adv && segmentos.some((s) => normalizeSegmentName(s) === normalizeSegmentName(adv.segmento));
        const isMyKeyAccount = keyAccountIds.includes(o.advertiserId) || (o.agencyId && keyAccountIds.includes(o.agencyId));
        const isMyOpp = o.executivo === executivo.nome;
        return isMySegment || isMyKeyAccount || isMyOpp;
      });

      const segMeta = segmentos.reduce((s, seg) => s + ((monthlyMetas[seg] && (monthlyMetas[seg][code] || monthlyMetas[seg][`${executivoYear}-${m}`])) || 0), 0);
      const kaMeta = keyAccountIds.reduce((s, kaId) => {
        const key = `keyaccount:${kaId}`;
        return s + ((monthlyMetas[key] && (monthlyMetas[key][code] || monthlyMetas[key][`${executivoYear}-${m}`])) || 0);
      }, 0);
      meta += segMeta + kaMeta;
    });

    const gap = faturamento - meta;
    const percent = meta > 0 ? (faturamento / meta) * 100 : 0;
    return { segmentos, keyAccountClients, faturamento, pipeline, pipelineTotal, meta, gap, percent };
  }

  function computeClientRowForExecutivo(client, year) {
    const faturamento = faturamentoEfetivo
      .filter(
        (f) =>
          String(f.clienteCodigo || "").trim() === String(client.codigo || "").trim() &&
          (f.periodo || "").toLowerCase().startsWith(String(year).toLowerCase() + "-")
      )
      .reduce((s, f) => s + (Number(f.valor) || 0), 0);
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
    proposals: "Propostas",
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
            hasPermission(user.perfil, "can_view_dashboard") && { id: "dashboard", label: "Visão Geral", icon: LayoutDashboard },
            { id: "pipeline", label: "Pipeline", icon: GitBranch },
            { id: "advertisers", label: "Clientes", icon: Building2 },
            { id: "contacts", label: "Contatos", icon: Users },
            { id: "proposals", label: "Propostas", icon: FileText },
            hasPermission(user.perfil, "can_view_executivos") && { id: "executivos", label: "Executivos", icon: Briefcase },
            hasPermission(user.perfil, "can_view_planning") && { id: "planning", label: "Pipeline Planejamento", icon: ClipboardList },
            hasPermission(user.perfil, "can_manage_users") && { id: "access", label: "Gestão e Acessos", icon: Shield },
          ].filter(Boolean).map((item) => (
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
        <div className="p-4 border-t border-slate-800 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            {user.foto_url ? (
              <img src={user.foto_url} alt={user.nome} className="w-8 h-8 rounded-full border border-slate-750" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs uppercase">
                {user.nome ? user.nome.charAt(0) : "U"}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-slate-200 truncate">{user.nome || "Usuário"}</div>
              <div className="text-[10px] text-slate-500 truncate">{user.email}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 border border-slate-800 text-xs text-rose-400 rounded-md hover:bg-rose-500/10 hover:border-rose-500/20 transition-colors"
          >
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="px-8 py-5 border-b border-slate-200 bg-white flex items-center justify-between relative shrink-0">
          <h1 className="text-lg font-medium text-slate-800">{viewTitles[view]}</h1>
          <div className="flex items-center gap-4">
            {/* Sino de Notificações */}
            {hasPermission(user.perfil, "can_view_executivos") && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                  className="p-1.5 rounded-full hover:bg-slate-100 transition-colors text-slate-500 relative flex items-center justify-center"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-600 rounded-full border-2 border-white animate-pulse" />
                  )}
                </button>

                {showNotificationsDropdown && (
                  <>
                    <div className="fixed inset-0 z-45" onClick={() => setShowNotificationsDropdown(false)} />
                    <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-lg shadow-xl z-50 flex flex-col max-h-[400px] overflow-hidden">
                      <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
                        <span className="text-xs font-semibold text-slate-700">Notificações</span>
                        {unreadCount > 0 && (
                          <button
                            type="button"
                            onClick={handleMarkAllNotificationsAsRead}
                            className="text-[10px] text-rose-600 hover:text-rose-700 font-semibold"
                          >
                            Marcar como lidas
                          </button>
                        )}
                      </div>
                      <div className="overflow-y-auto divide-y divide-slate-100 flex-1">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-xs text-slate-400">Nenhuma notificação por enquanto.</div>
                        ) : (
                          notifications.map((n) => (
                            <div key={n.id} className={`p-3 text-xs transition-colors ${n.read ? "bg-white" : "bg-slate-50/50"}`}>
                              <div className="font-semibold text-slate-850 flex items-center justify-between">
                                <span>{n.title}</span>
                                <span className="text-[9px] text-slate-400 font-normal">
                                  {new Date(n.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                                </span>
                              </div>
                              <div className="text-slate-650 mt-1 leading-relaxed">{n.message}</div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {view === "advertisers" && (
              <button
                onClick={() => {
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
                  setShowNewContact(true);
                }}
                className="flex items-center gap-1.5 text-sm bg-slate-900 text-white px-3 py-1.5 rounded-md hover:bg-slate-800"
              >
                <Plus size={15} /> Novo Contato
              </button>
            )}
            {view === "pipeline" && hasPermission(user.perfil, "can_create_opportunities") && (
              <button
                onClick={() => {
                  const myExecName = user?.perfil === "executivo"
                    ? (executivos.find((e) => String(e.id) === String(user?.executivo_id))?.nome || user?.nome || "")
                    : "";
                  setNewOppForm({
                    ...emptyOppForm(),
                    executivo: myExecName,
                  });
                  setShowNewOpportunity(true);
                }}
                className="flex items-center gap-1.5 text-sm bg-slate-900 text-white px-3 py-1.5 rounded-md hover:bg-slate-800"
              >
                <Plus size={15} /> Nova Oportunidade
              </button>
            )}
          </div>
        </div>

        <div className="p-8 overflow-y-auto">
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-md mb-6 flex items-center justify-between text-sm">
              <span>{errorMsg}</span>
              <button onClick={() => setErrorMsg("")} className="text-rose-400 hover:text-rose-600">
                <X size={16} />
              </button>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-md mb-6 flex items-center justify-between text-sm">
              <span>{successMsg}</span>
              <button onClick={() => setSuccessMsg("")} className="text-emerald-400 hover:text-emerald-600">
                <X size={16} />
              </button>
            </div>
          )}

          {warningMsg && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-md mb-6 flex items-center justify-between text-sm shadow-sm">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-600 shrink-0" />
                <span>{warningMsg}</span>
              </div>
              <button onClick={() => setWarningMsg("")} className="text-amber-500 hover:text-amber-700">
                <X size={16} />
              </button>
            </div>
          )}

          <React.Suspense fallback={<TabLoadingFallback />}>
          {view === "dashboard" && hasPermission(user.perfil, "can_view_dashboard") && (
            <DashboardTab
              dashboardSegmentFilter={dashboardSegmentFilter}
              setDashboardSegmentFilter={setDashboardSegmentFilter}
              dashboardProductFilter={dashboardProductFilter}
              setDashboardProductFilter={setDashboardProductFilter}
              dashboardAgencyFilter={dashboardAgencyFilter}
              setDashboardAgencyFilter={setDashboardAgencyFilter}
              dashboardAdvertiserFilter={dashboardAdvertiserFilter}
              setDashboardAdvertiserFilter={setDashboardAdvertiserFilter}
              dashboardExecutivoFilter={effectiveDashboardExecutivoFilter}
              setDashboardExecutivoFilter={setDashboardExecutivoFilter}
              dashboardYear={dashboardYear}
              setDashboardYear={setDashboardYear}
              dashboardMonths={dashboardMonths}
              setDashboardMonths={setDashboardMonths}
              executivos={executivos}
              agencyFilterOptions={agencyFilterOptions}
              advertiserFilterOptions={dashboardAdvertiserFilterOptions}
              metaVisible={metaVisible}
              resumoAnoData={resumoAnoData}
              visaoGeralAtingimentoPercent={visaoGeralAtingimentoPercent}
              metaAtingida={metaAtingida}
              faturadoMenosMeta={faturadoMenosMeta}
              visaoGeralFaturamentoEfetivoTotal={visaoGeralFaturamentoEfetivoTotal}
              visaoGeralFaturamentoPotencialTotal={visaoGeralFaturamentoPotencialTotal}
              visaoGeralFaturamentoData={visaoGeralFaturamentoData}
              pipelineTotal={pipelineTotal}
              dashboardOpps={dashboardOpps}
              emDesenvolvimentoValor={emDesenvolvimentoValor}
              emAbertoValor={emAbertoValor}
              emAbertoCount={emAbertoCount}
              estimativaFaturamento={estimativaFaturamento}
              fechadosValor={fechadosValor}
              negadosValor={negadosValor}
              taxaConversao={taxaConversao}
              stageData={stageData}
              monthlyOpenData={monthlyOpenData}
              countByStage={countByStage}
              tvProductRows={tvProductRows}
              tvProductTotals={tvProductTotals}
              digitalProductRows={digitalProductRows}
              digitalProductTotals={digitalProductTotals}
              specialProductRows={specialProductRows}
              specialProductTotals={specialProductTotals}
              userPerfil={user.perfil}
              advertisers={advertisers}
              faturamentoEfetivo={faturamentoEfetivo}
              segmentoExecutivo={segmentoExecutivo}
              executivoKeyAccounts={executivoKeyAccounts}
            />
          )}

          {view === "pipeline" && (
            <PipelineKanbanTab
              segmentFilter={segmentFilter}
              setSegmentFilter={setSegmentFilter}
              productFilter={productFilter}
              setProductFilter={setProductFilter}
              agencyFilter={agencyFilter}
              setAgencyFilter={setAgencyFilter}
              executivoFilter={executivoFilter}
              setExecutivoFilter={setExecutivoFilter}
              executivoFilterOptions={executivoFilterOptions}
              monthFilter={monthFilter}
              setMonthFilter={setMonthFilter}
              pipelineActiveFilters={pipelineActiveFilters}
              pipelineOpportunities={pipelineOpportunities}
              opportunities={opportunities}
              agencyFilterOptions={agencyFilterOptions}
              advertisers={advertisers}
              highlightedOppId={highlightedOppId}
              setSelectedOppId={setSelectedOppId}
              updateStage={updateStage}
              pipelineSearch={pipelineSearch}
              setPipelineSearch={setPipelineSearch}
              openEditOpportunity={openEditOpportunity}
            />
          )}

          {view === "planning" && (
            <PlanningTab
              planningGroups={planningGroups}
              advertisers={advertisers}
              updatePlanningField={updatePlanningField}
              updateOpportunityProducts={updateOpportunityProducts}
              allProducts={allProducts}
              responsaveis={responsaveis}
              goToOpportunityInPipeline={goToOpportunityInPipeline}
            />
          )}

          {view === "advertisers" && (
            <AdvertisersTab
              advertisers={advertisers}
              opportunities={opportunities}
              faturamentoEfetivo={faturamentoEfetivo}
              contacts={contacts}
              clientSearch={clientSearch}
              setClientSearch={setClientSearch}
              filteredAdvertisers={filteredAdvertisers}
              selectedAdvertiserId={selectedAdvertiserId}
              setSelectedAdvertiserId={setSelectedAdvertiserId}
              getServedAdvertisers={getServedAdvertisers}
              getServingAgencies={getServingAgencies}
              openEditClient={openEditClient}
              addInteraction={addInteraction}
              noteDraft={noteDraft}
              setNoteDraft={setNoteDraft}
              summarizeInteraction={summarizeInteraction}
              summarizingId={summarizingId}
              goToOpportunityInPipeline={goToOpportunityInPipeline}
              goToContact={goToContact}
              setView={setView}
              setSelectedContactId={setSelectedContactId}
              openScheduleMeeting={openScheduleMeeting}
              onTranscribeComplete={(result) => handleTranscriptionComplete(result, selectedAdvertiserId)}
              openSendCustomEmail={openSendCustomEmail}
              generateClientAiSummary={generateClientAiSummary}
              openSendProposal={openSendProposal}
              contactDaysFilter={contactDaysFilter}
              setContactDaysFilter={setContactDaysFilter}
              currentUser={user}
              onDeleteClient={handleDeleteClient}
              segmentoExecutivo={segmentoExecutivo}
              executivoKeyAccounts={executivoKeyAccounts}
              executivos={executivos}
              onRefreshData={reloadBootstrapData}
            />
          )}

          {view === "contacts" && (
            <ContactsTab
              advertisers={advertisers}
              contacts={contacts}
              contactSearch={contactSearch}
              setContactSearch={setContactSearch}
              filteredContacts={filteredContacts}
              selectedContactId={selectedContactId}
              setSelectedContactId={setSelectedContactId}
              setSelectedAdvertiserId={setSelectedAdvertiserId}
              goToAdvertiser={goToAdvertiser}
              setView={setView}
              openSendCustomEmail={openSendCustomEmail}
              openEditContact={openEditContact}
              currentUser={user}
              onDeleteContact={handleDeleteContact}
            />
          )}

          {view === "proposals" && (
            <ProposalsTab
              openSendProposal={openSendProposal}
              proposalTemplates={proposalTemplates}
            />
          )}

          {view === "executivos" && hasPermission(user.perfil, "can_view_executivos") && (
            <ExecutivosTab
              executivoYear={executivoYear}
              setExecutivoYear={setExecutivoYear}
              executivos={executivos}
              setShowNewExecutivo={setShowNewExecutivo}
              setNewExecutivoForm={setNewExecutivoForm}
              computeExecutivoKpis={computeExecutivoKpis}
              editingCarteiraId={editingCarteiraId}
              setEditingCarteiraId={setEditingCarteiraId}
              deleteExecutivo={deleteExecutivo}
              segmentoExecutivo={segmentoExecutivo}
              assignSegmentoToExecutivo={assignSegmentoToExecutivo}
              expandedClientsId={expandedClientsId}
              setExpandedClientsId={setExpandedClientsId}
              computeClientRowForExecutivo={computeClientRowForExecutivo}
              advertisers={advertisers}
              executivoKeyAccounts={executivoKeyAccounts}
              currentUser={user}
            />
          )}

          {view === "access" && hasPermission(user.perfil, "can_manage_users") && (
            <AccessTab
              executivos={executivos}
              currentUser={user}
              proposalTemplates={proposalTemplates}
              onRefreshProposals={loadProposalTemplates}
              onRefreshData={reloadBootstrapData}
            />
          )}
          </React.Suspense>
        </div>
      </main>

      {selectedOpp && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="drawer-opp-title"
          className="fixed inset-0 bg-slate-900/30 flex justify-end z-40"
          onClick={() => setSelectedOppId(null)}
        >
          <div className="w-full max-w-md bg-white h-full overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 id="drawer-opp-title" className="text-lg font-medium text-slate-800">{selectedOpp.title}</h2>
                <span className={"inline-block text-xs px-1.5 py-0.5 rounded border mt-1 " + STAGE_STYLES[selectedOpp.stage]}>
                  {selectedOpp.stage}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const oppId = selectedOpp.id;
                    setSelectedOppId(null);
                    openEditOpportunity(oppId);
                  }}
                  className="flex items-center gap-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded-md font-medium border border-slate-200 transition-colors cursor-pointer"
                >
                  <Pencil size={13} /> Editar
                </button>
                <button
                  type="button"
                  aria-label="Fechar painel"
                  onClick={() => setSelectedOppId(null)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="bg-slate-50 rounded-md p-3 text-sm text-slate-600 mb-5">
              <div>
                {selectedOppAgency ? `${selectedOppAgency.name} → ` : ""}
                {selectedOppAdvertiser ? selectedOppAdvertiser.name : "Anunciante removido"}
              </div>
              {selectedOppAdvertiser && selectedOppAdvertiser.segmento && (
                <div className="text-xs text-slate-600 mt-1 font-medium">{selectedOppAdvertiser.segmento}</div>
              )}
              {selectedOppContact && (
                <div className="text-xs text-slate-600 mt-1 font-medium">
                  Contato: {selectedOppContact.name} · {selectedOppContact.cargo}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm mb-5">
              <div className="bg-slate-50 rounded-md p-3 col-span-2 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-600 font-medium">Investimento previsto</div>
                  <div className="text-slate-700 font-mono font-semibold">{formatBRL(selectedOpp.value)}</div>
                </div>
                {selectedOpp.winProbability !== null && selectedOpp.winProbability !== undefined && (
                  <div className="text-right">
                    <div className="text-xs text-slate-600 font-medium">Probabilidade de Fechamento</div>
                    <span
                      className={`inline-block mt-0.5 text-xs font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                        selectedOpp.winProbability > 80 ? "bg-emerald-50 text-emerald-700 border-emerald-250" :
                        selectedOpp.winProbability >= 60 ? "bg-amber-50 text-amber-700 border-amber-250" :
                        "bg-rose-50 text-rose-700 border-rose-250"
                      }`}
                    >
                      {selectedOpp.winProbability}% win
                    </span>
                  </div>
                )}
              </div>
              <div className="bg-slate-50 rounded-md p-3 col-span-2">
                <div className="text-xs text-slate-600 font-medium">Período</div>
                <div className="text-slate-700">{formatPeriod(selectedOpp.periodMonths)}</div>
              </div>
              <div className="bg-slate-50 rounded-md p-3">
                <div className="text-xs text-slate-600 font-medium">Data de criação</div>
                <div className="text-slate-700">{formatDate(selectedOpp.createdAt)}</div>
              </div>
              <div className="bg-slate-50 rounded-md p-3">
                <div className="text-xs text-slate-600 font-medium">Data de entrega</div>
                <div className="text-slate-700">{formatDate(selectedOpp.deliveryDate)}</div>
              </div>
              <div className="bg-slate-50 rounded-md p-3 col-span-2">
                <div className="text-xs text-slate-600 font-medium">Previsão de fechamento</div>
                <div className="text-slate-700">{formatDate(selectedOpp.expectedCloseDate)}</div>
              </div>
            </div>

            <div className="mb-5">
              <div className="text-xs font-semibold text-slate-700 mb-2">Produtos</div>
              <div className="flex flex-wrap gap-1.5">
                {(selectedOpp.products || []).length === 0 && (
                  <div className="text-xs text-slate-400">Nenhum produto selecionado.</div>
                )}
                {(selectedOpp.products || []).map((p) => {
                  const hasAllocated = selectedOpp.productValues?.[p] !== undefined && selectedOpp.productValues?.[p] !== null;
                  const val = hasAllocated 
                    ? Number(selectedOpp.productValues[p]) 
                    : (selectedOpp.value / (selectedOpp.products.length || 1));
                  const suffix = hasAllocated ? "" : " (estimado)";
                  return (
                    <span key={p} className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                      {p} <span className="font-semibold text-slate-800 font-mono">({formatBRL(val)}{suffix})</span>
                    </span>
                  );
                })}
              </div>
            </div>

            {selectedOpp.briefing && (
              <div className="mb-5">
                <div className="text-xs font-semibold text-slate-700 mb-2">Briefing</div>
                <div className="text-sm text-slate-600 bg-slate-50 rounded-md p-3 whitespace-pre-wrap">
                  {selectedOpp.briefing}
                </div>
              </div>
            )}

            {(selectedOpp.attachments || []).length > 0 && (
              <div className="mb-5">
                <div className="text-xs font-semibold text-slate-700 mb-2">Arquivos Anexados</div>
                <div className="flex flex-col gap-1.5">
                  {(selectedOpp.attachments || []).map((att) => (
                    <a
                      key={att.id || att.name}
                      href={att.url || att.dataUri}
                      download={att.name}
                      target={att.url ? "_blank" : undefined}
                      rel="noopener noreferrer"
                      className="flex items-center justify-between bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md px-3 py-2 text-xs text-slate-700 font-medium transition-colors"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileText size={15} className="text-rose-600 shrink-0" />
                        <span className="truncate">{att.name}</span>
                      </div>
                      <span className="text-[10px] text-rose-600 font-semibold uppercase tracking-wider shrink-0 border border-rose-200 bg-rose-50 px-2 py-0.5 rounded">
                        Baixar
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-5">
              <label className="text-xs text-slate-700 font-medium mb-1 block">Estágio</label>
              <select
                value={selectedOpp.stage}
                disabled={!canEditOppStage}
                onChange={(e) => updateStage(selectedOpp.id, e.target.value)}
                className={`w-full border border-slate-200 rounded-md px-3 py-2 text-sm ${
                  !canEditOppStage
                    ? "bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200"
                    : "bg-white text-slate-800"
                }`}
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {!canEditOppStage && (
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-1.5">
                  <AlertTriangle size={14} className="shrink-0 text-amber-600" />
                  <span>A alteração de estágio no pipeline é restrita ao executivo responsável, especialistas e administradores.</span>
                </div>
              )}
            </div>

            {hasPermission(user.perfil, "can_delete_opportunities") && (
              <div className="mt-8 pt-4 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => deleteOpportunity(selectedOpp.id)}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white rounded-md py-2.5 text-xs font-bold uppercase tracking-wider shadow-sm hover:shadow transition-all"
                >
                  Excluir Oportunidade
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <NewAdvertiserModal
        show={showNewAdvertiser}
        onClose={closeNewAdvertiser}
        onSubmit={addAdvertiser}
        editingClientId={editingClientId}
        newAdvForm={newAdvForm}
        setNewAdvForm={setNewAdvForm}
        advertisers={advertisers}
        openQuickCreateClient={openQuickCreateClient}
        currentUser={user}
        onDeleteClient={handleDeleteClient}
      />


      {showQuickCreateClient && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-quick-client-title"
          className="fixed inset-0 bg-slate-900/30 flex items-center justify-center z-50"
          style={{ zIndex: 70 }}
          onClick={closeQuickCreateClient}
        >
          <form onSubmit={confirmQuickCreateClient} onClick={(e) => e.stopPropagation()} className="bg-white rounded-lg p-6 w-full max-w-sm flex flex-col gap-3">
            <div className="flex items-center justify-between mb-1">
              <h2 id="modal-quick-client-title" className="font-semibold text-slate-800 text-base">Cadastrar {quickCreateType}</h2>
              <button
                type="button"
                aria-label="Fechar modal"
                onClick={closeQuickCreateClient}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div>
              <label className="text-xs text-slate-700 font-medium mb-1 block">Código</label>
              <input
                type="number"
                placeholder="Ex: 1007"
                value={quickCreateCodigo}
                onChange={(e) => setQuickCreateCodigo(e.target.value)}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-xs text-slate-700 font-medium mb-1 block">Razão social</label>
              <input
                placeholder="Razão social (opcional)"
                value={quickCreateRazaoSocial}
                onChange={(e) => setQuickCreateRazaoSocial(e.target.value)}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-xs text-slate-700 font-medium mb-1 block">CNPJ</label>
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
              <label className="text-xs text-slate-700 font-medium mb-1 block">Nome fantasia *</label>
              <input
                required
                autoFocus
                placeholder="Nome fantasia"
                value={quickCreateName}
                onChange={(e) => setQuickCreateName(e.target.value)}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
              />
            </div>

            {quickCreateType === "Anunciante" && (
              <div>
                <label className="text-xs text-slate-700 font-medium mb-1 block">Segmento *</label>
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

            <div className="text-xs text-slate-500">
              Contatos e vínculos com outras agências/anunciantes podem ser adicionados depois na aba Clientes.
            </div>

            <button type="submit" className="w-full bg-slate-900 text-white rounded-md py-2 text-sm mt-1 hover:bg-slate-800">
              Salvar {quickCreateType}
            </button>
          </form>
        </div>
      )}

      <NewContactModal
        show={showNewContact}
        onClose={closeNewContact}
        onSubmit={addContact}
        newContactForm={newContactForm}
        setNewContactForm={setNewContactForm}
        advertisers={advertisers}
        openCreateClientForContact={openCreateClientForContact}
        editingContactId={editingContactId}
        currentUser={user}
        onDeleteContact={handleDeleteContact}
      />

      <NewOpportunityModal
        show={showNewOpportunity}
        onClose={() => {
          setShowNewOpportunity(false);
          setEditingOppId(null);
        }}
        onSubmit={addOpportunity}
        newOppForm={newOppForm}
        setNewOppForm={setNewOppForm}
        executivos={executivos}
        advertisers={advertisers}
        availableContacts={availableContacts}
        openCreateClientForOpportunity={openCreateClientForOpportunity}
        openCreateContactForOpportunity={openCreateContactForOpportunity}
        errorMsg={errorMsg}
        setErrorMsg={setErrorMsg}
        allProducts={allProducts}
        editingOppId={editingOppId}
      />

      {showSendProposal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-send-prop-title"
          className="fixed inset-0 bg-slate-900/30 flex items-center justify-center z-50"
          onClick={() => setShowSendProposal(false)}
        >
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-lg p-6 w-full max-w-md flex flex-col gap-3 shadow-xl">
            <div className="flex items-center justify-between mb-1">
              <h2 id="modal-send-prop-title" className="font-semibold text-slate-800 text-base">Enviar proposta comercial por e-mail</h2>
              <button
                type="button"
                aria-label="Fechar modal"
                onClick={() => setShowSendProposal(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-md border border-slate-100 mb-1">
              <span className="font-semibold text-slate-700">Modelo selecionado:</span> {sendProposalTemplate ? sendProposalTemplate.title : ""}
            </div>

            <div>
              <label className="text-xs text-slate-700 mb-1 block font-medium">Contato (Destinatário)</label>
              <select
                value={sendProposalContactId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSendProposalContactId(val);
                  const contact = contacts.find((c) => c.id === val);
                  const template = proposalTemplates.find((t) => t.id === sendProposalTemplateId);
                  if (template) {
                    setSendProposalBody(buildProposalEmailBody(template, contact ? contact.name : ""));
                  }
                }}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white"
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
                <div className="text-xs text-rose-600 mt-1 font-medium">Esse contato não tem e-mail cadastrado.</div>
              )}
            </div>

            <div>
              <label className="text-xs text-slate-700 mb-1 block font-medium">Assunto do e-mail</label>
              <input
                type="text"
                value={sendProposalSubject}
                onChange={(e) => setSendProposalSubject(e.target.value)}
                placeholder="Assunto do e-mail..."
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-slate-350"
              />
            </div>

            <div>
              <label className="text-xs text-slate-700 mb-1 block font-medium">Mensagem (Corpo do e-mail)</label>
              <textarea
                value={sendProposalBody}
                onChange={(e) => setSendProposalBody(e.target.value)}
                placeholder="Mensagem..."
                rows={5}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm resize-none font-sans focus:outline-none focus:border-slate-350 h-28"
              />
            </div>

            <div className="bg-rose-50 text-rose-700 text-[11px] p-2 rounded-md border border-rose-100 font-medium flex flex-col gap-0.5">
              <div>📎 <b>PDF:</b> "{sendProposalTemplate?.pdfFileName}" será anexado.</div>
              {sendProposalTemplate?.xlsFileName && (
                <div>📊 <b>Excel:</b> "{sendProposalTemplate?.xlsFileName}" será anexado.</div>
              )}
            </div>

            <button
              onClick={sendProposalEmail}
              disabled={sendingProposal || !sendProposalContact || !sendProposalContact.email || !sendProposalSubject || !sendProposalBody}
              className={
                "rounded-md py-2.5 text-sm mt-1 flex items-center justify-center gap-2 font-medium transition-colors " +
                (sendProposalContact && sendProposalContact.email && sendProposalSubject && sendProposalBody && !sendingProposal
                  ? "bg-rose-600 text-white hover:bg-rose-700 cursor-pointer"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed")
              }
            >
              {sendingProposal ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Enviando...
                </>
              ) : (
                "Enviar por Gmail / Simulação"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Modal de confirmação: criar oportunidade após envio de proposta */}
      {pendingOppAfterProposal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-pending-opp-title"
          className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50"
        >
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                <CheckCircle2 size={20} className="text-emerald-600" />
              </div>
              <div>
                <h2 id="modal-pending-opp-title" className="font-semibold text-slate-800 text-sm">Proposta enviada!</h2>
                <div className="text-xs text-slate-600 mt-0.5">Proposta enviada para <strong>{pendingOppAfterProposal.contactName}</strong>.</div>
              </div>
            </div>
            <p className="text-sm text-slate-600">
              Deseja criar uma <strong>oportunidade no pipeline</strong> para este cliente agora?
            </p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setPendingOppAfterProposal(null)}
                className="px-4 py-2 text-xs border border-slate-200 text-slate-600 rounded-md hover:bg-slate-50"
              >
                Agora não
              </button>
              <button
                type="button"
                onClick={() => {
                  const { clientId, contactName } = pendingOppAfterProposal;
                  setPendingOppAfterProposal(null);
                  const myExecName = user?.perfil === "executivo"
                    ? (executivos.find((e) => String(e.id) === String(user?.executivo_id))?.nome || user?.nome || "")
                    : "";
                  setNewOppForm({
                    ...emptyOppForm(),
                    executivo: myExecName,
                    advertiserId: clientId || "",
                    agencyId: (advertiser && advertiser.type === "Agência") ? advertiser.id : "",
                    title: `Oportunidade - ${advertiser ? (advertiser.nomeFantasia || advertiser.razaoSocial || advertiser.name || "") : contactName}`,
                  });
                  setView("pipeline");
                  setShowNewOpportunity(true);
                }}
                className="px-4 py-2 text-xs bg-rose-600 text-white font-semibold rounded-md hover:bg-rose-700"
              >
                Criar oportunidade
              </button>
            </div>
          </div>
        </div>
      )}

      {showSendCustomEmail && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-send-email-title"
          className="fixed inset-0 bg-slate-900/30 flex items-center justify-center z-50"
          onClick={() => setShowSendCustomEmail(false)}
        >
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-lg p-6 w-full max-w-md flex flex-col gap-3 shadow-xl">
            <div className="flex items-center justify-between mb-1">
              <h2 id="modal-send-email-title" className="font-semibold text-slate-800 font-sans text-base">
                {customEmailIsProposal ? "Enviar proposta comercial por e-mail" : "Enviar e-mail para o cliente"}
              </h2>
              <button
                type="button"
                aria-label="Fechar modal"
                onClick={() => setShowSendCustomEmail(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            {(() => {
              const contact = contacts.find(c => c.id === sendCustomEmailContactId);
              const client = contact ? advertisers.find(a => a.id === contact.clientId) : null;
              return (
                <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-md border border-slate-100 mb-1">
                  <div><span className="font-semibold text-slate-700">Destinatário:</span> {contact ? `${contact.name} (${contact.email})` : ""}</div>
                  {client && <div className="mt-0.5"><span className="font-semibold text-slate-700">Cliente:</span> {client.name}</div>}
                </div>
              );
            })()}

            <div>
              <label className="text-xs text-slate-700 mb-1 block font-semibold">Assunto do e-mail</label>
              <input
                type="text"
                value={sendCustomEmailSubject}
                onChange={(e) => setSendCustomEmailSubject(e.target.value)}
                placeholder="Ex: Assunto da conversa..."
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-rose-300 focus:ring-1 focus:ring-rose-300"
              />
            </div>

            <div>
              <label className="text-xs text-slate-700 mb-1 block font-semibold">Mensagem (Corpo do e-mail)</label>
              <textarea
                value={sendCustomEmailBody}
                onChange={(e) => setSendCustomEmailBody(e.target.value)}
                placeholder="Escreva sua mensagem aqui..."
                rows={6}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm resize-none font-sans focus:outline-none focus:border-rose-300 focus:ring-1 focus:ring-rose-300 h-36"
              />
            </div>

            <div>
              <label className="text-xs text-slate-700 mb-1 block font-semibold">Anexo (Opcional)</label>
              <input
                type="file"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setSendCustomEmailAttachmentBase64(reader.result);
                    setSendCustomEmailAttachmentName(file.name);
                  };
                  reader.readAsDataURL(file);
                }}
                className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100 cursor-pointer"
              />
              {sendCustomEmailAttachmentName && (
                <div className="text-[11px] text-slate-600 mt-1 flex items-center gap-1 font-medium">
                  <span>📎 Anexado: <strong>{sendCustomEmailAttachmentName}</strong></span>
                  <button
                    type="button"
                    onClick={() => {
                      setSendCustomEmailAttachmentBase64("");
                      setSendCustomEmailAttachmentName("");
                    }}
                    className="text-rose-600 hover:underline font-semibold ml-1"
                  >
                    Remover
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={sendCustomEmail}
              disabled={sendingCustomEmail || !sendCustomEmailSubject.trim() || !sendCustomEmailBody.trim()}
              className={
                "rounded-md py-2.5 text-sm mt-1 flex items-center justify-center gap-2 font-semibold uppercase tracking-wider text-xs transition-all shadow-sm hover:shadow " +
                (sendCustomEmailSubject.trim() && sendCustomEmailBody.trim() && !sendingCustomEmail
                  ? "bg-rose-600 text-white hover:bg-rose-700 cursor-pointer"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed")
              }
            >
              {sendingCustomEmail ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Enviando...
                </>
              ) : (
                "Enviar E-mail"
              )}
            </button>
          </div>
        </div>
      )}

      {showScheduleMeeting && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-sched-title"
          className="fixed inset-0 bg-slate-900/30 flex items-center justify-center z-50"
          onClick={() => setShowScheduleMeeting(false)}
        >
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-lg p-6 w-full max-w-md flex flex-col gap-3 shadow-xl">
            <div className="flex items-center justify-between mb-1">
              <h2 id="modal-sched-title" className="font-semibold text-slate-800 text-base">Agendar Compromisso na Agenda</h2>
              <button
                type="button"
                aria-label="Fechar modal"
                onClick={() => setShowScheduleMeeting(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div>
              <label className="text-xs text-slate-700 mb-1 block font-medium">Título da Reunião</label>
              <input
                type="text"
                value={scheduleMeetingTitle}
                onChange={(e) => setScheduleMeetingTitle(e.target.value)}
                placeholder="Ex: Apresentação da Proposta Superpop..."
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-slate-350"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-700 mb-1 block font-medium">Data</label>
                <input
                  type="date"
                  value={scheduleMeetingDate}
                  onChange={(e) => setScheduleMeetingDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-slate-700 mb-1 block font-medium">Hora de início</label>
                <input
                  type="time"
                  value={scheduleMeetingTime}
                  onChange={(e) => setScheduleMeetingTime(e.target.value)}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-700 mb-1 block font-medium">Duração</label>
              <select
                value={scheduleMeetingDuration}
                onChange={(e) => setScheduleMeetingDuration(e.target.value)}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white"
              >
                <option value="15">15 minutos</option>
                <option value="30">30 minutos</option>
                <option value="45">45 minutos</option>
                <option value="60">1 hora</option>
                <option value="90">1 hora e meia</option>
                <option value="120">2 horas</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-700 mb-1 block font-medium">Descrição (opcional)</label>
              <textarea
                value={scheduleMeetingDescription}
                onChange={(e) => setScheduleMeetingDescription(e.target.value)}
                placeholder="Pauta da reunião, detalhes, link do Teams/Meet..."
                rows={3}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm resize-none focus:outline-none h-16"
              />
            </div>

            <div>
              <label className="text-xs text-slate-700 mb-1 block font-medium">Convidados (Contatos do Cliente)</label>
              <div className="flex flex-col gap-1.5 max-h-24 overflow-y-auto border border-slate-200 rounded-md p-2 bg-slate-50">
                {contacts.filter(c => c.clientId === scheduleMeetingClientId).map((c) => (
                  <label key={c.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={scheduleMeetingGuests.includes(c.email)}
                      disabled={!c.email}
                      onChange={() => {
                        if (!c.email) return;
                        setScheduleMeetingGuests(prev =>
                          prev.includes(c.email) ? prev.filter(email => email !== c.email) : [...prev, c.email]
                        );
                      }}
                      className="rounded border-slate-350 text-slate-900 focus:ring-slate-900"
                    />
                    <span>{c.name} {c.email ? `(${c.email})` : <span className="text-rose-500">(Sem e-mail)</span>}</span>
                  </label>
                ))}
                {contacts.filter(c => c.clientId === scheduleMeetingClientId).length === 0 && (
                  <span className="text-xs text-slate-500 font-medium">Nenhum contato cadastrado para este cliente.</span>
                )}
              </div>
            </div>

            <button
              onClick={scheduleMeeting}
              disabled={schedulingMeeting || !scheduleMeetingTitle || !scheduleMeetingDate || !scheduleMeetingTime}
              className={
                "rounded-md py-2.5 text-sm mt-1 flex items-center justify-center gap-2 font-medium transition-colors " +
                (scheduleMeetingTitle && scheduleMeetingDate && scheduleMeetingTime && !schedulingMeeting
                  ? "bg-slate-900 text-white hover:bg-slate-800 cursor-pointer"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed")
              }
            >
              {schedulingMeeting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Agendando...
                </>
              ) : (
                "Confirmar Agendamento"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Modal de Preview de Transcrição de Reunião */}
      {showTranscriptionPreview && transcriptionPreviewData && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-transc-title"
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-slide-up">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="flex items-center gap-2">
                <span className="p-1 bg-rose-50 rounded-md text-rose-500">
                  <Mic size={18} />
                </span>
                <h2 id="modal-transc-title" className="font-semibold text-slate-800">Resultado do Processamento por IA (Gemini)</h2>
              </div>
              <button 
                type="button"
                aria-label="Fechar prévia da transcrição"
                onClick={() => {
                  setShowTranscriptionPreview(false);
                  setTranscriptionPreviewData(null);
                }} 
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Body (Two Columns) */}
            <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Column: Transcrição */}
              <div className="flex flex-col h-[50vh]">
                <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Transcrição Completa (Verbatim)</div>
                <textarea
                  readOnly
                  value={transcriptionPreviewData.transcricao}
                  className="w-full flex-1 border border-slate-200 rounded-lg p-3 text-xs text-slate-650 bg-slate-50 resize-none font-mono focus:outline-none"
                />
              </div>

              {/* Right Column: IA Summary & Briefing */}
              <div className="flex flex-col gap-4 overflow-y-auto pr-1">
                
                {/* Risco Badge */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Grau de Risco Comercial</span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium uppercase tracking-wider ${
                    transcriptionPreviewData.risco === "alto" ? "bg-rose-50 text-rose-700 border-rose-200" :
                    transcriptionPreviewData.risco === "médio" || transcriptionPreviewData.risco === "medio" ? "bg-amber-50 text-amber-700 border-amber-200" :
                    "bg-emerald-50 text-emerald-700 border-emerald-200"
                  }`}>
                    Risco {transcriptionPreviewData.risco}
                  </span>
                </div>

                {/* Resumo Executivo */}
                <div>
                  <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Resumo da Reunião</div>
                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs text-slate-700 leading-relaxed">
                    {transcriptionPreviewData.resumo}
                  </div>
                </div>

                {/* Briefing de Mídia */}
                <div>
                  <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Briefing Comercial Sugerido</div>
                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {transcriptionPreviewData.briefing}
                  </div>
                </div>

                {/* Próximas Ações */}
                <div>
                  <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Próximos Passos (Ações)</div>
                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs text-slate-700 font-medium">
                    {transcriptionPreviewData.proxima_acao}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowTranscriptionPreview(false);
                  setTranscriptionPreviewData(null);
                }}
                className="px-4 py-2 border border-slate-200 rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Descartar
              </button>
              
              {transcriptionPreviewData.clientId && (
                <>
                  <button
                    onClick={saveTranscriptionToTimeline}
                    className="px-4 py-2 bg-slate-900 text-white rounded-md text-xs font-semibold hover:bg-slate-800 transition-colors"
                  >
                    Salvar na Timeline
                  </button>
                  <button
                    onClick={handleCreateOpportunityFromTranscription}
                    className="px-4 py-2 bg-rose-650 text-white rounded-md text-xs font-semibold hover:bg-rose-750 transition-colors animate-pulse"
                  >
                    Criar Oportunidade
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Toast de Notificação flutuante */}
      {activeToast && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm bg-slate-900 text-white rounded-lg shadow-2xl border border-slate-800 p-4 flex items-start gap-3 animate-slide-up">
          <div className="p-1 bg-slate-800 rounded-md text-rose-500 mt-0.5 shrink-0">
            <Sparkles size={16} className="animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-slate-100">{activeToast.title}</div>
            <div className="text-[11px] text-slate-350 mt-1 leading-relaxed">{activeToast.message}</div>
          </div>
          <button 
            onClick={() => setActiveToast(null)} 
            className="text-slate-400 hover:text-white transition-colors shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
