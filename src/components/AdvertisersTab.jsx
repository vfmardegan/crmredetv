import React from "react";
import { X, Sparkles, Loader2, Mail, Calendar, FileText, Mic, ClipboardList, Phone, MessageCircle, Trash2, Download, Upload, CheckCircle, AlertTriangle, FileSpreadsheet } from "lucide-react";
import AudioRecorder from "./AudioRecorder";
import { apiPost } from "../services/api";
import {
  formatBRL,
  formatCNPJ,
  formatCelular,
  riskStyle,
  STAGE_STYLES,
  getClientInactivityStatus,
  getAgencyInactivityStatus,
  SEGMENTOS,
  normalizeSegmentName,
} from "../utils/helpers";

export default function AdvertisersTab({
  advertisers,
  opportunities,
  faturamentoEfetivo = [],
  contacts,
  clientSearch,
  setClientSearch,
  filteredAdvertisers,
  selectedAdvertiserId,
  setSelectedAdvertiserId,
  getServedAdvertisers,
  getServingAgencies,
  openEditClient,
  addInteraction,
  noteDraft,
  setNoteDraft,
  summarizeInteraction,
  summarizingId,
  goToOpportunityInPipeline,
  goToContact,
  setView,
  setSelectedContactId,
  openScheduleMeeting,
  onTranscribeComplete,
  openSendCustomEmail,
  generateClientAiSummary,
  openSendProposal,
  contactDaysFilter,
  setContactDaysFilter,
  currentUser,
  onDeleteClient,
  segmentoExecutivo = {},
  executivoKeyAccounts = {},
  executivos = [],
  onRefreshData,
}) {
  const selectedAdvertiser = advertisers.find((a) => a.id === selectedAdvertiserId);
  const [selectedType, setSelectedType] = React.useState("call");
  const [loadingSummary, setLoadingSummary] = React.useState(false);
  const [visibleCount, setVisibleCount] = React.useState(50);
  const [localSearch, setLocalSearch] = React.useState(clientSearch);

  // Filtros adicionais: Tipo (Anunciante/Agência) e Segmento
  const [typeFilter, setTypeFilter] = React.useState("all");
  const [segmentFilter, setSegmentFilter] = React.useState("all");

  // Estado do Modal de Atualização de Base via CSV (Admin)
  const [showImportModal, setShowImportModal] = React.useState(false);
  const [importFile, setImportFile] = React.useState(null);
  const [importPreview, setImportPreview] = React.useState(null);
  const [importLoading, setImportLoading] = React.useState(false);
  const [importResult, setImportResult] = React.useState(null);
  const [importError, setImportError] = React.useState("");
  const fileInputRef = React.useRef(null);

  const getCnpjStatus = (client) => {
    if (!client) return "Ativo";
    const st = (
      client.situacaoCadastral ||
      client.situacao_cadastral ||
      client.situacao ||
      client.statusCnpj ||
      client.cnpjStatus ||
      client.status ||
      (client.ativo === false ? "Inativo" : "Ativo")
    );
    return String(st).trim().toLowerCase() === "inativo" ? "Inativo" : "Ativo";
  };

  const getClientFaturamento2026 = (client) => {
    if (!client || !faturamentoEfetivo || faturamentoEfetivo.length === 0) return 0;
    const codes = new Set();
    if (client.codigo) codes.add(String(client.codigo).trim());
    if (client.type === "Agência" && getServedAdvertisers) {
      getServedAdvertisers(client).forEach((sa) => {
        if (sa.codigo) codes.add(String(sa.codigo).trim());
      });
    }
    if (codes.size === 0) return 0;
    return faturamentoEfetivo
      .filter((f) => codes.has(String(f.clienteCodigo || "").trim()) && (f.periodo || "").toLowerCase().startsWith("2026-"))
      .reduce((s, f) => s + (Number(f.valor) || 0), 0);
  };

  // Lista dinâmica contendo apenas os segmentos cadastrados nos clientes
  const availableSegments = React.useMemo(() => {
    const set = new Set();
    (advertisers || []).forEach((a) => {
      const seg = (a.segmento || "").trim();
      if (seg && seg.toLowerCase() !== "não identificado" && seg.toLowerCase() !== "nao identificado") {
        set.add(seg);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [advertisers]);

  // Sincroniza estado local com o pai se alterado externamente
  React.useEffect(() => {
    setLocalSearch(clientSearch);
  }, [clientSearch]);

  // Debounce de 250ms para digitação 100% fluida sem travar o teclado
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== clientSearch) {
        setClientSearch(localSearch);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [localSearch, clientSearch, setClientSearch]);

  // Reseta a paginação para 50 sempre que houver busca por texto ou alteração de filtro
  React.useEffect(() => {
    setVisibleCount(50);
  }, [clientSearch, contactDaysFilter, typeFilter, segmentFilter]);

  // Aplica a restrição automática de CNPJ Ativo e os filtros de Tipo e Segmento
  const processedAdvertisers = React.useMemo(() => {
    return filteredAdvertisers.filter((a) => {
      // Restrição automática: exibe apenas clientes com CNPJ Ativo
      if (getCnpjStatus(a) !== "Ativo") {
        return false;
      }

      // 1. Filtro por Tipo (Anunciante / Agência)
      if (typeFilter !== "all" && a.type !== typeFilter) {
        return false;
      }

      // 2. Filtro por Segmento
      if (segmentFilter !== "all") {
        const segMatch = (a.segmento || "").toLowerCase() === segmentFilter.toLowerCase();
        if (!segMatch) {
          if (a.type === "Agência" && getServedAdvertisers) {
            const served = getServedAdvertisers(a);
            const hasServedSeg = served.some((sa) => (sa.segmento || "").toLowerCase() === segmentFilter.toLowerCase());
            if (!hasServedSeg) return false;
          } else {
            return false;
          }
        }
      }

      return true;
    });
  }, [filteredAdvertisers, typeFilter, segmentFilter, getServedAdvertisers]);

  const visibleAdvertisers = processedAdvertisers.slice(0, visibleCount);

  // Escopo de clientes permitidos de acordo com o perfil do usuário logado
  const permittedAdvertisers = React.useMemo(() => {
    if (!currentUser || !advertisers || advertisers.length === 0) return [];
    const perfil = currentUser.perfil || "executivo";

    // Admin, Diretor e Especialista: A lista 'advertisers' já vem escopada pelo backend RBAC
    if (perfil === "admin" || perfil === "diretor" || perfil === "especialista") {
      return advertisers;
    }

    // Executivo: Estritamente a sua própria carteira comercial (segmentos associados + key accounts nominais)
    const myExecId =
      currentUser.executivo_id ||
      (executivos || []).find(
        (e) =>
          (e.nome && currentUser.nome && e.nome.trim().toLowerCase() === currentUser.nome.trim().toLowerCase()) ||
          (e.email && currentUser.email && e.email.trim().toLowerCase() === currentUser.email.trim().toLowerCase())
      )?.id;

    if (!myExecId || Object.keys(segmentoExecutivo || {}).length === 0) {
      return advertisers;
    }

    const mySegments = Object.keys(segmentoExecutivo || {}).filter(
      (seg) => String(segmentoExecutivo[seg]) === String(myExecId)
    );
    const myKeyAccountIds = new Set((executivoKeyAccounts && executivoKeyAccounts[myExecId]) || []);

    if (mySegments.length === 0 && myKeyAccountIds.size === 0) {
      return advertisers;
    }

    const otherExecKeyAccountIds = new Set();
    Object.entries(executivoKeyAccounts || {}).forEach(([exId, kaIds]) => {
      if (String(exId) !== String(myExecId)) {
        (kaIds || []).forEach((id) => otherExecKeyAccountIds.add(id));
      }
    });

    return advertisers.filter((a) => {
      if (myKeyAccountIds.has(a.id)) return true;
      if (otherExecKeyAccountIds.has(a.id)) return false;
      if (a.segmento && mySegments.some((s) => normalizeSegmentName(s) === normalizeSegmentName(a.segmento))) {
        return true;
      }
      return false;
    });
  }, [currentUser, advertisers, segmentoExecutivo, executivoKeyAccounts, executivos]);

  const isFiltered =
    typeFilter !== "all" ||
    segmentFilter !== "all" ||
    !!(localSearch && localSearch.trim()) ||
    contactDaysFilter !== "all";

  const permittedIdsSet = React.useMemo(() => new Set(permittedAdvertisers.map((a) => a.id)), [permittedAdvertisers]);

  const clientsToExport = React.useMemo(() => {
    if (!isFiltered) return permittedAdvertisers;
    return processedAdvertisers.filter((a) => permittedIdsSet.has(a.id));
  }, [isFiltered, permittedAdvertisers, processedAdvertisers, permittedIdsSet]);

  const exportButtonLabel = React.useMemo(() => {
    const perfil = currentUser?.perfil || "executivo";
    const countStr = isFiltered ? `${clientsToExport.length} filtrado(s)` : `${permittedAdvertisers.length}`;
    if (perfil === "admin") return `Exportar Base (${countStr})`;
    if (perfil === "diretor") return `Exportar Diretoria (${countStr})`;
    return `Exportar Minha Carteira (${countStr})`;
  }, [currentUser, isFiltered, clientsToExport.length, permittedAdvertisers.length]);

  function handleExportCSV() {
    if (clientsToExport.length === 0) {
      alert("Nenhum cliente disponível para exportação com os filtros atuais.");
      return;
    }

    const delimiter = ";";
    const headers = [
      "Código",
      "Tipo",
      "Nome Fantasia",
      "Razão Social",
      "CNPJ",
      "Segmento",
      "Status",
      "Contatos Cadastrados",
      "Faturamento 2026 (R$)",
      "Data Último Contato",
      "Dias Sem Contato",
    ];

    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    let csvContent = "\uFEFF"; // UTF-8 BOM
    csvContent += headers.map(escapeCSV).join(delimiter) + "\r\n";

    clientsToExport.forEach((a) => {
      const clientContacts = (contacts || []).filter((c) => c.clientId === a.id);
      const fat2026 = getClientFaturamento2026(a);
      const fat2026Formatted = fat2026 > 0 ? fat2026.toFixed(2).replace(".", ",") : "0,00";

      let lastDate = "";
      let daysCount = "";
      const lastInt = (a.interactions || [])[0];
      if (lastInt && lastInt.date) {
        lastDate = String(lastInt.date).slice(0, 10);
        const diffDays = Math.floor((new Date() - new Date(lastInt.date)) / (1000 * 60 * 60 * 24));
        daysCount = diffDays >= 0 ? String(diffDays) : "0";
      }

      const row = [
        a.codigo || "",
        a.type || "Anunciante",
        a.nomeFantasia || a.name || "",
        a.razaoSocial || "",
        formatCNPJ(a.cnpj) || a.cnpj || "",
        a.segmento || "Geral",
        a.status || "Ativo",
        clientContacts.length,
        fat2026Formatted,
        lastDate,
        daysCount,
      ];

      csvContent += row.map(escapeCSV).join(delimiter) + "\r\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStr = new Date().toISOString().slice(0, 10);
    const perfilPrefix = currentUser?.perfil === "admin" ? "Base_Clientes" : "Carteira_Clientes";
    link.setAttribute("href", url);
    link.setAttribute("download", `${perfilPrefix}_RedeTV_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function handleDownloadTemplate() {
    const delimiter = ";";
    const headers = [
      "Tipo",
      "Razao_Social",
      "Nome_Fantasia",
      "CNPJ",
      "Codigo_ERP",
      "Segmento",
      "Executivo_Email",
      "Agencia_Vinculada_Nome",
      "Contato_Nome",
      "Contato_Cargo",
      "Contato_Email",
      "Contato_Telefone",
    ];

    const sampleRows = [
      [
        "Agência",
        "WMcCann Publicidade Ltda",
        "WMcCann",
        "60.579.703/0001-48",
        "AG-001",
        "Geral",
        "bruno.camargo@redetv.com.br",
        "",
        "Mariana Souza",
        "Diretora de Mídia",
        "mariana.souza@wmccann.com.br",
        "(11) 98765-4321",
      ],
      [
        "Anunciante",
        "JBS S.A.",
        "Friboi / Seara",
        "02.916.265/0001-60",
        "ANC-001",
        "Alimentos",
        "bruno.camargo@redetv.com.br",
        "WMcCann",
        "Carlos Alberto",
        "Gerente de Marketing",
        "carlos.alberto@jbs.com.br",
        "(11) 99887-1122",
      ],
      [
        "Anunciante",
        "Ambev S.A.",
        "Ambev",
        "07.526.557/0001-00",
        "ANC-002",
        "Bebidas",
        "silvia.szekely@redetv.com.br",
        "WMcCann",
        "Fernanda Lima",
        "Head de Mídia",
        "fernanda.lima@ambev.com.br",
        "(11) 97654-3210",
      ],
    ];

    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    let csvContent = "\uFEFF";
    csvContent += headers.map(escapeCSV).join(delimiter) + "\r\n";
    sampleRows.forEach((row) => {
      csvContent += row.map(escapeCSV).join(delimiter) + "\r\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "Modelo_Atualizacao_Clientes_RedeTV.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function parseCSVLine(line, delimiter) {
    const values = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        values.push(current.trim().replace(/^"|"$/g, "").replace(/""/g, '"'));
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^"|"$/g, "").replace(/""/g, '"'));
    return values;
  }

  function handleFileChange(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setImportFile(file);
    setImportError("");
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const rawLines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
        if (rawLines.length < 2) {
          throw new Error("O arquivo está vazio ou contém apenas a linha de cabeçalho.");
        }

        const firstLine = rawLines[0];
        const delimiter = firstLine.includes(";") ? ";" : ",";
        const rawHeaders = parseCSVLine(firstLine, delimiter);
        const normalizedHeaders = rawHeaders.map((h) =>
          h.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9_]/g, "_")
        );

        const parsedRows = [];
        for (let i = 1; i < rawLines.length; i++) {
          const cols = parseCSVLine(rawLines[i], delimiter);
          if (cols.length === 0 || !cols.some((c) => c !== "")) continue;

          const rowObj = {};
          normalizedHeaders.forEach((h, idx) => {
            rowObj[h] = cols[idx] !== undefined ? cols[idx].trim() : "";
          });

          const tipo = rowObj["tipo"] || rowObj["type"] || "Anunciante";
          const razaoSocial = rowObj["razao_social"] || rowObj["razaosocial"] || rowObj["nome"] || rowObj["nome_fantasia"] || "";
          const nomeFantasia = rowObj["nome_fantasia"] || rowObj["nomefantasia"] || razaoSocial;
          const cnpj = rowObj["cnpj"] || "";
          const codigoErp = rowObj["codigo_erp"] || rowObj["codigo"] || rowObj["codigoerp"] || "";
          const segmento = rowObj["segmento"] || "Geral";
          const executivoEmail = rowObj["executivo_email"] || rowObj["executivo"] || rowObj["email_executivo"] || "";
          const agenciaVinculada = rowObj["agencia_vinculada_nome"] || rowObj["agencia"] || rowObj["agencia_vinculada"] || "";
          const contatoNome = rowObj["contato_nome"] || rowObj["contato"] || "";
          const contatoCargo = rowObj["contato_cargo"] || rowObj["cargo"] || "";
          const contatoEmail = rowObj["contato_email"] || rowObj["email"] || "";
          const contatoTelefone = rowObj["contato_telefone"] || rowObj["telefone"] || rowObj["celular"] || "";

          if (razaoSocial || nomeFantasia || cnpj || codigoErp) {
            parsedRows.push({
              tipo,
              razaoSocial,
              nomeFantasia,
              cnpj,
              codigoErp,
              segmento,
              executivoEmail,
              agenciaVinculada,
              contatoNome,
              contatoCargo,
              contatoEmail,
              contatoTelefone,
              rawIndex: i + 1,
            });
          }
        }

        if (parsedRows.length === 0) {
          throw new Error("Nenhum dado válido de cliente pôde ser extraído da planilha.");
        }

        setImportPreview({
          totalLines: parsedRows.length,
          rows: parsedRows,
          sample: parsedRows.slice(0, 5),
        });
      } catch (err) {
        console.error("Erro ao ler CSV:", err);
        setImportError(err.message || "Erro ao ler e processar o arquivo CSV.");
        setImportPreview(null);
      }
    };
    reader.readAsText(file, "UTF-8");
  }

  async function handleConfirmImport() {
    if (!importPreview || !importPreview.rows || importPreview.rows.length === 0) {
      setImportError("Nenhum dado válido carregado para importação.");
      return;
    }

    setImportLoading(true);
    setImportError("");
    setImportResult(null);

    try {
      const res = await apiPost("/clients/import", { rows: importPreview.rows });
      setImportResult(res);
      if (typeof onRefreshData === "function") {
        await onRefreshData();
      }
    } catch (err) {
      console.error("Erro na importação:", err);
      setImportError(err.message || "Falha ao importar base de clientes no servidor.");
    } finally {
      setImportLoading(false);
    }
  }

  function handleCloseImportModal() {
    setShowImportModal(false);
    setImportFile(null);
    setImportPreview(null);
    setImportError("");
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        type="text"
        value={localSearch}
        onChange={(e) => setLocalSearch(e.target.value)}
        placeholder="Buscar por nome fantasia, razão social, código ou CNPJ..."
        className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white"
      />

      {/* Barra de Filtros Principais: Tipo e Segmento (Dimensões Dinâmicas) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* 1. Tipo (Anunciante e Agência) */}
          <div className="flex items-center gap-1.5 shrink-0">
            <label className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">Tipo de Cliente:</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-slate-400 w-auto"
            >
              <option value="all">Todos</option>
              <option value="Anunciante">Anunciantes</option>
              <option value="Agência">Agências</option>
            </select>
          </div>

          {/* 2. Segmento */}
          <div className="flex items-center gap-1.5 shrink-0">
            <label className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">Segmento:</label>
            <select
              value={segmentFilter}
              onChange={(e) => setSegmentFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-slate-400 w-auto max-w-[280px]"
            >
              <option value="all">Todos</option>
              {availableSegments.map((seg) => (
                <option key={seg} value={seg}>
                  {seg}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Botões de Ação: Importar (Admin) e Exportar (Todos) */}
        <div className="flex items-center gap-2 shrink-0">
          {currentUser?.perfil === "admin" && (
            <button
              type="button"
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md shadow-sm transition-colors cursor-pointer text-xs shrink-0"
              title="Atualizar ou sincronizar base de clientes via planilha CSV"
            >
              <Upload size={14} />
              <span className="hidden sm:inline">Atualizar Base (CSV)</span>
              <span className="sm:hidden">CSV</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-medium rounded-md border border-slate-200 shadow-sm transition-colors cursor-pointer text-xs shrink-0"
            title="Baixar planilha CSV da carteira compatível com Excel"
          >
            <Download size={14} className="text-slate-500" />
            <span>{exportButtonLabel}</span>
          </button>
        </div>
      </div>

      {/* Filtro de dias sem contato */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        <span className="text-slate-400 font-medium whitespace-nowrap mr-1">Sem contato:</span>
        {[
          { key: "all", label: "Todos" },
          { key: "10",  label: "10 dias" },
          { key: "20",  label: "20 dias" },
          { key: "30",  label: "30 dias" },
        ].map((opt) => {
          const active = contactDaysFilter === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => setContactDaysFilter(opt.key)}
              className={`px-2.5 py-1 rounded-full border text-[10px] font-semibold transition-all shrink-0 ${
                active
                  ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                  : "bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100">
        {processedAdvertisers.length === 0 && (
          <div className="p-6 text-sm text-slate-400 text-center">
            {advertisers.length === 0 ? "Nenhum cliente cadastrado ainda." : `Nenhum cliente encontrado para os filtros selecionados.`}
          </div>
        )}
        {visibleAdvertisers.map((a) => {
          const advOpps = opportunities.filter((o) => o.advertiserId === a.id || o.agencyId === a.id);
          const oppsValue = advOpps.reduce((s, o) => s + o.value, 0);
          const fat2026 = getClientFaturamento2026(a);
          const relatedCount = a.type === "Agência" ? getServedAdvertisers(a).length : getServingAgencies(a.id).length;
          return (
            <button
              key={a.id}
              onClick={() => setSelectedAdvertiserId(a.id)}
              className="w-full text-left p-4 flex items-center justify-between hover:bg-slate-50"
            >
              <div>
                <div className="flex items-center gap-2 flex-wrap">
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

                  {/* Badge de Sem Contato (10, 20, 30+ dias) */}
                  {(() => {
                    const status = a.type === "Agência"
                      ? getAgencyInactivityStatus(a, getServedAdvertisers(a))
                      : getClientInactivityStatus(a);
                    if (!status) return null;
                    return (
                      <span 
                        className={`text-[10px] px-1.5 py-0.5 rounded border font-medium flex items-center gap-0.5 uppercase tracking-wide ${status.badgeClass}`}
                        title={status.label}
                      >
                        <span>{status.icon}</span>
                        <span>
                          {status.level === 30 ? "Sem Contato +30" : status.level === 20 ? "Sem Contato +20" : "Sem Contato +10"}
                        </span>
                      </span>
                    );
                  })()}
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
                {fat2026 > 0 ? (
                  <>
                    <div className="text-sm font-mono font-semibold text-emerald-700" title="Faturamento Efetivo 2026">
                      {formatBRL(fat2026)} <span className="text-xs font-normal text-emerald-600 font-sans">(2026)</span>
                    </div>
                    <div className="text-xs text-slate-400">
                      {oppsValue > 0 ? `${formatBRL(oppsValue)} em ` : ""}{advOpps.length} oportunidade{advOpps.length !== 1 ? "s" : ""}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-sm font-mono text-slate-700">{formatBRL(oppsValue)}</div>
                    <div className="text-xs text-slate-400">
                      {advOpps.length} oportunidade{advOpps.length !== 1 ? "s" : ""}
                    </div>
                  </>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {processedAdvertisers.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600">
          <div>
            Exibindo <strong className="text-slate-900">{visibleAdvertisers.length}</strong> de <strong className="text-slate-900">{processedAdvertisers.length.toLocaleString('pt-BR')}</strong> clientes
          </div>
          {visibleCount < processedAdvertisers.length && (
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + 50)}
              className="w-full sm:w-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-semibold transition-colors shadow-sm flex items-center justify-center gap-1.5"
            >
              <span>Carregar mais 50</span>
            </button>
          )}
        </div>
      )}

      {selectedAdvertiser && (
        <div
          className="fixed inset-0 bg-slate-900/30 flex justify-end z-40"
          onClick={() => setSelectedAdvertiserId(null)}
        >
          <div className="w-full sm:max-w-md bg-white h-full overflow-y-auto p-4 sm:p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-lg font-semibold text-slate-800">{selectedAdvertiser.name}</span>
                  {/* Badge de Sem Contato */}
                  {(() => {
                    const status = selectedAdvertiser.type === "Agência"
                      ? getAgencyInactivityStatus(selectedAdvertiser, getServedAdvertisers(selectedAdvertiser))
                      : getClientInactivityStatus(selectedAdvertiser);
                    if (!status) return null;
                    return (
                      <span className={`text-xs px-2 py-0.5 rounded border font-medium flex items-center gap-1 ${status.badgeClass}`}>
                        <span>{status.icon}</span>
                        <span>{status.label}</span>
                      </span>
                    );
                  })()}
                </div>
                <div className="text-xs text-slate-500 mt-1">{selectedAdvertiser.razaoSocial}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditClient(selectedAdvertiser)}
                  className="text-xs border border-slate-200 text-slate-600 px-2.5 py-1.5 rounded-md hover:bg-slate-50 font-medium"
                >
                  Editar
                </button>
                {currentUser?.perfil === "admin" && (
                  <button
                    onClick={() => onDeleteClient(selectedAdvertiser.id)}
                    className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2.5 py-1.5 rounded-md font-medium flex items-center gap-1 transition-colors"
                    title="Excluir cadastro (Apenas Administrador)"
                  >
                    <Trash2 size={13} />
                    <span>Excluir</span>
                  </button>
                )}
                <button onClick={() => setSelectedAdvertiserId(null)} className="text-slate-400 hover:text-slate-700 ml-1">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Resumo Financeiro / Comercial */}
            {(() => {
              const selectedFat2026 = getClientFaturamento2026(selectedAdvertiser);
              const selectedOpps = opportunities.filter((o) => o.advertiserId === selectedAdvertiser.id || o.agencyId === selectedAdvertiser.id);
              const selectedOppsValue = selectedOpps.reduce((s, o) => s + o.value, 0);
              return (
                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                  <div className="bg-emerald-50/70 border border-emerald-200/60 rounded-md p-3">
                    <div className="text-xs font-medium text-emerald-800">Faturamento (2026)</div>
                    <div className="text-base font-bold font-mono text-emerald-700 mt-0.5">
                      {formatBRL(selectedFat2026)}
                    </div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200/60 rounded-md p-3">
                    <div className="text-xs font-medium text-slate-500">Pipeline (Oportunidades)</div>
                    <div className="text-base font-bold font-mono text-slate-700 mt-0.5">
                      {formatBRL(selectedOppsValue)}
                    </div>
                  </div>
                </div>
              );
            })()}

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
                  <div key={c.id} className="flex items-center justify-between py-1 border-b border-slate-100/50 last:border-b-0">
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof goToContact === "function") {
                          goToContact(c.id);
                        } else {
                          setSelectedAdvertiserId(null);
                          setSelectedContactId(c.id);
                          if (typeof setView === "function") setView("contacts");
                        }
                      }}
                      className="text-left flex-1 hover:text-rose-600 pr-2 transition-colors cursor-pointer group"
                    >
                      <div className="font-semibold text-slate-700">{c.name} · {c.cargo}</div>
                      <div className="text-xs text-slate-400">{c.celular ? formatCelular(c.celular) : c.email || "Sem contato direto"}</div>
                    </button>
                    {c.email && (
                      <button
                        type="button"
                        onClick={() => openSendCustomEmail(c.id)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
                        title={`Enviar e-mail para ${c.name}`}
                      >
                        <Mail size={14} />
                      </button>
                    )}
                  </div>
                ))}
            </div>

            <div className="mb-8">
              <div className="text-xs font-medium text-slate-500 mb-2">Oportunidades</div>
              <div className="flex flex-col gap-2">
                {opportunities
                  .filter((o) => o.advertiserId === selectedAdvertiser.id || o.agencyId === selectedAdvertiser.id)
                  .sort((a, b) => {
                    const order = ["Fechado", "Quente", "Morno", "Frio", "Desenvolvimento", "Negado", "Cancelado"];
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
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Registrar Nova Atividade</div>
              <div className="flex flex-col gap-2 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                {/* Seletor de Tipo de Interação */}
                <div className="flex gap-1 border-b border-slate-200/60 pb-2 mb-1 shrink-0 overflow-x-auto">
                  {[
                    { id: "call", label: "📞 Ligação" },
                    { id: "whatsapp", label: "💬 WhatsApp" },
                    { id: "meeting", label: "🤝 Reunião" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSelectedType(tab.id)}
                      className={`text-[10px] px-2.5 py-1 rounded-md font-semibold transition-colors shrink-0 ${
                        selectedType === tab.id
                          ? "bg-slate-900 text-white shadow-sm"
                          : "text-slate-550 hover:bg-slate-200"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <textarea
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  placeholder={
                    selectedType === "call" ? "Registrar resumo da ligação telefônica..." :
                    selectedType === "whatsapp" ? "Registrar resumo da conversa de WhatsApp..." :
                    selectedType === "meeting" ? "Registrar ata ou pontos acordados na reunião..." :
                    "Registrar nova atividade com este cliente..."
                  }
                  className="w-full text-sm border border-slate-250 rounded-md p-2 bg-white resize-none h-20 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />

                <div className="flex justify-between items-center mt-1">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        addInteraction(selectedAdvertiser.id, selectedType);
                        setSelectedType("call");
                      }}
                      className="text-xs bg-slate-900 text-white px-3 py-1.5 rounded-md hover:bg-slate-800 font-semibold shadow-sm transition-colors"
                    >
                      Salvar
                    </button>
                  </div>
                  <AudioRecorder
                    onTranscribeComplete={(result) => {
                      const text = result?.transcription || result?.transcricao || result?.briefing || result?.text || "";
                      if (!text) return;
                      setNoteDraft((prev) => (prev ? `${prev}\n\n${text}` : text));
                    }}
                    onError={(err) => alert(err)}
                  />
                </div>
              </div>

              {/* Bloco Agendar Reunião */}
              <div className="flex items-center justify-between mb-4 mt-8 border-t border-slate-100 pt-4">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Agendar Reunião</div>
                <button
                  type="button"
                  onClick={() => openScheduleMeeting(selectedAdvertiser.id)}
                  className="text-xs border border-slate-200 text-slate-700 bg-white px-3 py-1.5 rounded-md hover:bg-slate-50 font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Calendar size={13} className="text-slate-400" />
                  Enviar Invite
                </button>
              </div>

              {/* Bloco Enviar Proposta */}
              <div className="flex items-center justify-between mb-4 mt-4 pt-4 border-t border-slate-100/60">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Enviar Proposta</div>
                <button
                  type="button"
                  onClick={() => {
                    const clientContacts = contacts.filter(c => c.clientId === selectedAdvertiser.id);
                    if (clientContacts.length === 0) {
                      alert("Por favor, cadastre um contato na aba Contatos para este cliente antes de enviar uma proposta.");
                      return;
                    }
                    openSendCustomEmail(clientContacts[0].id, true);
                  }}
                  className="text-xs border border-slate-200 text-slate-700 bg-white px-3 py-1.5 rounded-md hover:bg-slate-50 font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Mail size={13} className="text-slate-400" />
                  Enviar Proposta
                </button>
              </div>

              {/* Divisor Fino */}
              <div className="border-t border-slate-150 my-6"></div>

              {/* Resumo Executivo IA Consolidado */}
              <div className="bg-slate-50 border border-slate-200/65 rounded-xl p-4 mb-4 mt-0 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
                
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="text-indigo-500 animate-pulse" size={15} />
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Resumo Executivo da IA
                    </span>
                  </div>
                  
                  <button
                    type="button"
                    disabled={loadingSummary}
                    onClick={async () => {
                      setLoadingSummary(true);
                      try {
                        await generateClientAiSummary(selectedAdvertiser.id);
                      } catch (err) {
                        alert("Não foi possível gerar o resumo comercial: " + err.message);
                      } finally {
                        setLoadingSummary(false);
                      }
                    }}
                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-850 flex items-center gap-1 transition-colors bg-indigo-50 hover:bg-indigo-100/80 px-2 py-1 rounded-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {loadingSummary ? (
                      <>
                        <Loader2 className="animate-spin" size={10} />
                        <span>Consolidando...</span>
                      </>
                    ) : selectedAdvertiser.aiSummary ? (
                      <span>🔄 Recalcular Resumo</span>
                    ) : (
                      <span>🤖 Gerar Resumo</span>
                    )}
                  </button>
                </div>

                {loadingSummary ? (
                  <div className="flex flex-col items-center justify-center py-6 gap-2">
                    <Loader2 className="animate-spin text-indigo-500" size={24} />
                    <div className="text-xs text-slate-500 font-semibold">Analisando histórico de interações com o cliente...</div>
                  </div>
                ) : selectedAdvertiser.aiSummary ? (
                  <div className="text-xs text-slate-650 leading-relaxed font-normal whitespace-pre-wrap">
                    {selectedAdvertiser.aiSummary}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 text-center py-4 italic border border-dashed border-slate-200 rounded-lg">
                    Consolide o histórico comercial deste cliente em um diagnóstico inteligente clicando no botão acima.
                  </div>
                )}
              </div>

              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 mt-2">Histórico de Atividades</div>
              
              {/* Feed Container */}
              <div className="relative pl-6 border-l-2 border-slate-200 ml-3.5 flex flex-col gap-5 py-2">
                {(selectedAdvertiser.interactions || []).map((i) => {
                  // Configurações de ícones e cores por tipo
                  const typeConfigs = {
                    whatsapp: {
                      icon: MessageCircle,
                      bg: "bg-emerald-50 border-emerald-200 text-emerald-600",
                      label: "WhatsApp / Mensagem"
                    },
                    email: {
                      icon: Mail,
                      bg: "bg-blue-50 border-blue-200 text-blue-600",
                      label: "E-mail Enviado"
                    },
                    meeting: {
                      icon: Calendar,
                      bg: "bg-emerald-50 border-emerald-200 text-emerald-600",
                      label: "Reunião / Agenda"
                    },
                    proposal: {
                      icon: FileText,
                      bg: "bg-violet-50 border-violet-200 text-violet-600",
                      label: "Proposta Comercial"
                    },
                    transcription: {
                      icon: Mic,
                      bg: "bg-rose-50 border-rose-200 text-rose-600",
                      label: "Áudio Transcrito"
                    },
                    call: {
                      icon: Phone,
                      bg: "bg-amber-50 border-amber-200 text-amber-600",
                      label: "Ligação Telefônica"
                    },
                    note: {
                      icon: ClipboardList,
                      bg: "bg-slate-50 border-slate-200 text-slate-650",
                      label: "Anotação Manual"
                    }
                  };
                  
                  const config = typeConfigs[i.type] || typeConfigs.note;
                  const TypeIcon = config.icon;

                  return (
                    <div key={i.id} className="relative group">
                      {/* Timeline Icon Badge */}
                      <span className={`absolute -left-[36px] top-1 w-6 h-6 rounded-full border flex items-center justify-center shadow-sm z-10 ${config.bg}`}>
                        <TypeIcon size={12} />
                      </span>
                      
                      {/* Content Box */}
                      <div className="bg-white border border-slate-150 rounded-lg p-3 shadow-sm hover:shadow transition-shadow">
                        {/* Feed Item Header */}
                        <div className="flex items-center justify-between mb-1.5 shrink-0">
                          <span className="text-[9px] font-bold text-slate-800 uppercase tracking-wider">{config.label}</span>
                          <span className="text-[9px] text-slate-400 font-normal">
                            {new Date(i.date).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                        
                        {/* Feed Item Note Body */}
                        <div className="text-xs text-slate-650 whitespace-pre-wrap leading-relaxed">
                          {i.note}
                        </div>
                        
                        {/* AI Summary Block */}
                        {i.aiSummary ? (
                          <div className="mt-2.5 bg-violet-50/50 border border-violet-100 rounded-lg p-2.5">
                            <div className="text-[9px] font-bold text-violet-800 flex items-center gap-1 uppercase tracking-wider">
                              <Sparkles size={11} /> Resumo Executivo da IA
                            </div>
                            <div className="text-xs text-slate-600 mt-1 leading-relaxed">{i.aiSummary}</div>
                            {i.aiNextAction && (
                              <div className="text-xs text-slate-650 mt-1.5 pt-1.5 border-t border-violet-100/50 leading-relaxed">
                                <span className="font-semibold text-slate-700">Próxima ação: </span>{i.aiNextAction}
                              </div>
                            )}
                            {i.aiRisk && (
                              <span className={`inline-block mt-2 text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${riskStyle(i.aiRisk)}`}>
                                Risco {i.aiRisk}
                              </span>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => summarizeInteraction(selectedAdvertiser.id, i.id)}
                            disabled={summarizingId === i.id}
                            className="mt-2.5 flex items-center gap-1 text-[9px] text-rose-600 hover:text-rose-700 font-bold uppercase tracking-wider disabled:opacity-50"
                          >
                            {summarizingId === i.id ? (
                              <Loader2 size={11} className="animate-spin" />
                            ) : (
                              <Sparkles size={11} />
                            )}
                            Resumir com IA
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {(selectedAdvertiser.interactions || []).length === 0 && (
                  <div className="text-xs text-slate-400 p-4 border border-dashed border-slate-200 rounded-lg text-center bg-slate-50/50 -ml-6">
                    Nenhuma atividade ou interação registrada para este cliente.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Atualização de Base de Clientes (CSV) */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full border border-slate-200 overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="text-red-600" size={20} />
                <h3 className="font-semibold text-slate-800 text-base">
                  Atualizar Base de Clientes (CSV)
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseImportModal}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors cursor-pointer"
                disabled={importLoading}
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[calc(85vh-130px)] overflow-y-auto">
              {/* Informações explicativas */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 space-y-1">
                <div className="font-semibold flex items-center gap-1.5 text-amber-800">
                  <AlertTriangle size={14} className="shrink-0 text-amber-600" />
                  <span>Sincronização Segura sem Perda de Histórico</span>
                </div>
                <p className="leading-relaxed">
                  Clientes existentes serão identificados por <strong>CNPJ</strong>, <strong>Código ERP</strong> ou <strong>Razão Social</strong> e atualizados automaticamente mantendo intactos todos os históricos de interações, propostas, pipeline e faturamento. Clientes não encontrados serão inseridos como novos cadastros.
                </p>
              </div>

              {/* Botão Baixar Modelo */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <div className="text-xs font-semibold text-slate-700">Modelo Oficial da Planilha</div>
                  <div className="text-[11px] text-slate-500">Baixe o arquivo CSV formatado com os cabeçalhos padrão e exemplos.</div>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-medium rounded-md border border-slate-300 text-xs shadow-sm transition-colors cursor-pointer shrink-0"
                >
                  <Download size={14} className="text-slate-500" />
                  <span>Baixar Modelo CSV</span>
                </button>
              </div>

              {/* Seleção do Arquivo */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Selecione o arquivo CSV preenchido:
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  disabled={importLoading}
                  className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 file:cursor-pointer border border-slate-200 rounded-lg p-1.5 cursor-pointer bg-slate-50/50"
                />
              </div>

              {/* Alerta de Erro */}
              {importError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
                  <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                  <div className="leading-relaxed">{importError}</div>
                </div>
              )}

              {/* Resultado do Sucesso */}
              {importResult && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-emerald-900 text-sm">
                    <CheckCircle size={18} className="text-emerald-600" />
                    <span>Base de Clientes Atualizada com Sucesso!</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    <div className="bg-white/80 p-2 rounded border border-emerald-100 text-center">
                      <div className="text-[11px] text-emerald-600 font-medium">Total Linhas</div>
                      <div className="text-base font-bold text-emerald-900">{importResult.total}</div>
                    </div>
                    <div className="bg-white/80 p-2 rounded border border-emerald-100 text-center">
                      <div className="text-[11px] text-emerald-600 font-medium">Atualizados</div>
                      <div className="text-base font-bold text-emerald-900">{importResult.updated}</div>
                    </div>
                    <div className="bg-white/80 p-2 rounded border border-emerald-100 text-center">
                      <div className="text-[11px] text-emerald-600 font-medium">Novos Cadastros</div>
                      <div className="text-base font-bold text-emerald-900">{importResult.inserted}</div>
                    </div>
                    <div className="bg-white/80 p-2 rounded border border-emerald-100 text-center">
                      <div className="text-[11px] text-emerald-600 font-medium">Contatos</div>
                      <div className="text-base font-bold text-emerald-900">{importResult.contacts || 0}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Preview dos Dados */}
              {importPreview && !importResult && (
                <div className="space-y-2 border border-slate-200 rounded-lg p-3 bg-slate-50/50">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">
                      Pré-visualização dos Dados ({importPreview.totalLines} linha{importPreview.totalLines > 1 ? "s" : ""} encontrada{importPreview.totalLines > 1 ? "s" : ""}):
                    </span>
                    <span className="text-[11px] text-slate-400">Exibindo primeiras {importPreview.sample.length} linhas</span>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded bg-white max-h-48 text-[11px]">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-slate-600">
                          <th className="p-2 font-medium">Tipo</th>
                          <th className="p-2 font-medium">Razão Social / Fantasia</th>
                          <th className="p-2 font-medium">CNPJ</th>
                          <th className="p-2 font-medium">Cód. ERP</th>
                          <th className="p-2 font-medium">Segmento</th>
                          <th className="p-2 font-medium">Executivo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {importPreview.sample.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2 text-slate-700">
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${row.tipo === "Agência" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"}`}>
                                {row.tipo}
                              </span>
                            </td>
                            <td className="p-2 text-slate-800 font-medium">{row.nomeFantasia || row.razaoSocial}</td>
                            <td className="p-2 text-slate-600 font-mono">{row.cnpj || "-"}</td>
                            <td className="p-2 text-slate-600 font-mono">{row.codigoErp || "-"}</td>
                            <td className="p-2 text-slate-600">{row.segmento || "-"}</td>
                            <td className="p-2 text-slate-600">{row.executivoEmail || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 px-6 py-3 border-t border-slate-200 bg-slate-50">
              <button
                type="button"
                onClick={handleCloseImportModal}
                disabled={importLoading}
                className="px-4 py-2 border border-slate-300 rounded-md text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
              >
                {importResult ? "Fechar" : "Cancelar"}
              </button>

              {!importResult && (
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={importLoading || !importPreview}
                  className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs font-medium shadow-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {importLoading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Processando Importação...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={14} />
                      <span>Confirmar e Atualizar Base</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
