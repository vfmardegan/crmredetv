import React, { useState, useMemo } from "react";
import {
  MONTHS,
  formatBRL,
  segMatches,
  normalizeSegmentName,
} from "../utils/helpers";
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  Building2,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

export default function ClientBilledTable({
  advertisers = [],
  faturamentoEfetivo = [],
  executivos = [],
  segmentoExecutivo = {},
  executivoKeyAccounts = {},
  dashboardYear = 2026,
  dashboardMonths = [],
  dashboardSegmentFilter = [],
  dashboardAdvertiserFilter = [],
  dashboardAgencyFilter = [],
  dashboardExecutivoFilter = [],
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState("total");
  const [sortDirection, setSortDirection] = useState("desc");

  // Mapeamentos rápidos de clientes
  const clientByCodigoMap = useMemo(() => {
    const map = new Map();
    (advertisers || []).forEach((a) => {
      if (a.codigo) {
        map.set(String(a.codigo).trim(), a);
      }
    });
    return map;
  }, [advertisers]);

  const clientByIdMap = useMemo(() => {
    const map = new Map();
    (advertisers || []).forEach((a) => {
      map.set(a.id, a);
    });
    return map;
  }, [advertisers]);

  // Mapeamentos de executivos e Key Accounts
  const executivoNameById = useMemo(() => {
    const map = {};
    (executivos || []).forEach((e) => {
      map[String(e.id)] = e.nome;
    });
    return map;
  }, [executivos]);

  const keyAccountExecByCodigo = useMemo(() => {
    const map = {};
    Object.entries(executivoKeyAccounts || {}).forEach(([execId, kaIds]) => {
      (kaIds || []).forEach((kaId) => {
        const client = clientByIdMap.get(kaId);
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

  const executivoFilterSegmentos = useMemo(() => {
    if (!dashboardExecutivoFilter || dashboardExecutivoFilter.length === 0) return null;
    return Object.keys(segmentoExecutivo || {}).filter((seg) =>
      dashboardExecutivoFilter.map(String).includes(String(segmentoExecutivo[seg]))
    );
  }, [dashboardExecutivoFilter, segmentoExecutivo]);

  const executivoFilterKeyAccountIds = useMemo(() => {
    if (!dashboardExecutivoFilter || dashboardExecutivoFilter.length === 0) return [];
    const set = new Set();
    dashboardExecutivoFilter.forEach((execId) => {
      (executivoKeyAccounts?.[execId] || []).forEach((kaId) => set.add(kaId));
    });
    return Array.from(set);
  }, [dashboardExecutivoFilter, executivoKeyAccounts]);

  const executivoFilterKeyAccountCodigos = useMemo(() => {
    if (executivoFilterKeyAccountIds.length === 0) return new Set();
    const set = new Set();
    executivoFilterKeyAccountIds.forEach((id) => {
      const c = clientByIdMap.get(id);
      if (c && c.codigo) set.add(String(c.codigo).trim());
    });
    return set;
  }, [executivoFilterKeyAccountIds, clientByIdMap]);

  const getExecutivoName = useMemo(() => {
    return (client, cod) => {
      const kaExecId = (client && keyAccountExecById[client.id]) || keyAccountExecByCodigo[cod];
      if (kaExecId && executivoNameById[kaExecId]) {
        return `${executivoNameById[kaExecId]} (Key Account)`;
      }
      const seg = client?.segmento;
      if (seg && segmentoExecutivo?.[seg] && executivoNameById[segmentoExecutivo[seg]]) {
        return executivoNameById[segmentoExecutivo[seg]];
      }
      return client?.executivo || "—";
    };
  }, [keyAccountExecById, keyAccountExecByCodigo, executivoNameById, segmentoExecutivo]);

  const yearPrefix = useMemo(() => `${dashboardYear}-`.toLowerCase(), [dashboardYear]);
  const monthsInScope = useMemo(
    () => (dashboardMonths && dashboardMonths.length > 0 ? dashboardMonths : MONTHS),
    [dashboardMonths]
  );
  const monthsInScopeSet = useMemo(
    () => new Set(monthsInScope.map((m) => m.toLowerCase())),
    [monthsInScope]
  );

  // Consolidação dos clientes com faturamento no período e filtros
  const billedClients = useMemo(() => {
    const clientBilledData = new Map();

    (faturamentoEfetivo || []).forEach((f) => {
      const periodoLower = (f.periodo || "").toLowerCase().trim();
      if (!periodoLower.startsWith(yearPrefix)) return;

      const cod = String(f.clienteCodigo || "").trim();
      if (!cod) return;

      const monthPart = periodoLower.split("-")[1];
      if (!monthPart) return;

      const monthName = MONTHS.find((m) => m.toLowerCase() === monthPart);
      if (!monthName) return;

      const valor = Number(f.valor) || 0;

      if (!clientBilledData.has(cod)) {
        const monthly = {};
        MONTHS.forEach((m) => {
          monthly[m] = 0;
        });
        clientBilledData.set(cod, { monthly, totalInScope: 0, totalYear: 0 });
      }

      const entry = clientBilledData.get(cod);
      entry.monthly[monthName] += valor;
      entry.totalYear += valor;
      if (monthsInScopeSet.has(monthPart)) {
        entry.totalInScope += valor;
      }
    });

    const hasActiveFilters =
      (dashboardSegmentFilter && dashboardSegmentFilter.length > 0) ||
      (dashboardAdvertiserFilter && dashboardAdvertiserFilter.length > 0) ||
      (dashboardAgencyFilter && dashboardAgencyFilter.length > 0) ||
      (dashboardExecutivoFilter && dashboardExecutivoFilter.length > 0);

    const rows = [];

    clientBilledData.forEach((data, cod) => {
      if (data.totalInScope === 0) return;

      const client = clientByCodigoMap.get(cod);

      if (hasActiveFilters) {
        if (!client) return;

        if (dashboardSegmentFilter && dashboardSegmentFilter.length > 0) {
          if (!segMatches(dashboardSegmentFilter, client.segmento)) return;
        }

        if (dashboardAdvertiserFilter && dashboardAdvertiserFilter.length > 0) {
          if (!dashboardAdvertiserFilter.includes(client.id)) return;
        }

        if (dashboardAgencyFilter && dashboardAgencyFilter.length > 0) {
          if (!dashboardAgencyFilter.includes(client.id)) return;
        }

        if (dashboardExecutivoFilter && dashboardExecutivoFilter.length > 0) {
          const kaOwnerExecId = keyAccountExecByCodigo[cod] || keyAccountExecById[client.id];
          if (kaOwnerExecId && !dashboardExecutivoFilter.map(String).includes(String(kaOwnerExecId))) {
            return;
          }
          const isMyKa = executivoFilterKeyAccountCodigos.has(cod) || executivoFilterKeyAccountIds.includes(client.id);
          const isMySegment =
            client.segmento &&
            executivoFilterSegmentos &&
            executivoFilterSegmentos.some((s) => normalizeSegmentName(s) === normalizeSegmentName(client.segmento));
          if (!isMyKa && !isMySegment) return;
        }
      }

      const clientName = client?.razaoSocial || client?.name || `Cliente (${cod})`;
      const nomeFantasia = client?.nomeFantasia || client?.name || "";
      const segmento = client?.segmento || "Não identificado";
      const type = client?.type || "Anunciante";
      const executivoName = getExecutivoName(client, cod);

      rows.push({
        id: client?.id || `unmapped-${cod}`,
        codigo: cod,
        razaoSocial: clientName,
        nomeFantasia,
        type,
        segmento,
        executivo: executivoName,
        monthly: data.monthly,
        total: data.totalInScope,
        totalYear: data.totalYear,
      });
    });

    return rows;
  }, [
    faturamentoEfetivo,
    yearPrefix,
    monthsInScopeSet,
    clientByCodigoMap,
    dashboardSegmentFilter,
    dashboardAdvertiserFilter,
    dashboardAgencyFilter,
    dashboardExecutivoFilter,
    keyAccountExecByCodigo,
    keyAccountExecById,
    executivoFilterKeyAccountCodigos,
    executivoFilterKeyAccountIds,
    executivoFilterSegmentos,
    getExecutivoName,
  ]);

  // Filtragem por busca textual local (razão social, nome fantasia, código, executivo ou segmento)
  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return billedClients;
    const term = searchTerm.trim().toLowerCase();
    return billedClients.filter((r) => {
      return (
        r.codigo.toLowerCase().includes(term) ||
        r.razaoSocial.toLowerCase().includes(term) ||
        r.nomeFantasia.toLowerCase().includes(term) ||
        r.segmento.toLowerCase().includes(term) ||
        r.executivo.toLowerCase().includes(term) ||
        r.type.toLowerCase().includes(term)
      );
    });
  }, [billedClients, searchTerm]);

  // Ordenação das linhas
  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => {
      let valA, valB;

      if (sortField === "total") {
        valA = a.total;
        valB = b.total;
      } else if (MONTHS.includes(sortField)) {
        valA = a.monthly[sortField] || 0;
        valB = b.monthly[sortField] || 0;
      } else {
        valA = String(a[sortField] || "").toLowerCase();
        valB = String(b[sortField] || "").toLowerCase();
      }

      if (typeof valA === "number" && typeof valB === "number") {
        return sortDirection === "asc" ? valA - valB : valB - valA;
      }
      return sortDirection === "asc"
        ? String(valA).localeCompare(String(valB), "pt-BR")
        : String(valB).localeCompare(String(valA), "pt-BR");
    });
  }, [filteredRows, sortField, sortDirection]);

  // Totais gerais do rodapé
  const totals = useMemo(() => {
    const monthlyTotals = {};
    MONTHS.forEach((m) => {
      monthlyTotals[m] = 0;
    });
    let grandTotal = 0;

    sortedRows.forEach((r) => {
      MONTHS.forEach((m) => {
        monthlyTotals[m] += r.monthly[m] || 0;
      });
      grandTotal += r.total || 0;
    });

    return { monthlyTotals, grandTotal };
  }, [sortedRows]);

  // Paginação
  const totalPages = pageSize === "all" ? 1 : Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const currentPageSafe = Math.min(currentPage, totalPages);

  const displayedRows = useMemo(() => {
    if (pageSize === "all") return sortedRows;
    const start = (currentPageSafe - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, currentPageSafe, pageSize]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection(field === "total" || MONTHS.includes(field) ? "desc" : "asc");
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown size={12} className="text-slate-400 opacity-60 inline ml-1" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp size={12} className="text-sky-600 inline ml-1 font-bold" />
    ) : (
      <ArrowDown size={12} className="text-sky-600 inline ml-1 font-bold" />
    );
  };

  // Exportar dados para CSV
  const handleExportCSV = () => {
    const headers = [
      "Ranking",
      "Código",
      "Razão Social",
      "Nome Fantasia",
      "Tipo",
      "Segmento",
      "Executivo",
      ...MONTHS,
      `Total Faturado (${dashboardYear})`,
    ];

    const rows = sortedRows.map((r, idx) => [
      idx + 1,
      `"${r.codigo}"`,
      `"${r.razaoSocial.replace(/"/g, '""')}"`,
      `"${r.nomeFantasia.replace(/"/g, '""')}"`,
      `"${r.type}"`,
      `"${r.segmento.replace(/"/g, '""')}"`,
      `"${r.executivo.replace(/"/g, '""')}"`,
      ...MONTHS.map((m) => (r.monthly[m] || 0).toFixed(2).replace(".", ",")),
      (r.total || 0).toFixed(2).replace(".", ","),
    ]);

    const totalsRow = [
      "TOTAL",
      "—",
      "—",
      "—",
      "—",
      "—",
      "—",
      ...MONTHS.map((m) => (totals.monthlyTotals[m] || 0).toFixed(2).replace(".", ",")),
      totals.grandTotal.toFixed(2).replace(".", ","),
    ];

    const csvContent =
      "\uFEFF" +
      [headers.join(";"), ...rows.map((e) => e.join(";")), totalsRow.join(";")].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `faturamento_clientes_${dashboardYear}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const periodLabel = useMemo(() => {
    if (dashboardMonths && dashboardMonths.length > 0) {
      return `${dashboardYear} · ${dashboardMonths.join(", ")}`;
    }
    return `${dashboardYear} · Ano Completo`;
  }, [dashboardYear, dashboardMonths]);

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm flex flex-col gap-4 mt-2">
      {/* Cabeçalho do Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="text-slate-600" size={20} />
            <h3 className="text-base font-semibold text-slate-800">
              Clientes com Faturamento Efetivo
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
              {periodLabel}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Lista consolidada de clientes com faturamento apurado, afetada pelos filtros de segmento,
            anunciante, executivo e período.
          </p>
        </div>

        {/* Indicadores rápidos de totais */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <span className="text-xs text-slate-500">Clientes Ativos:</span>
            <span className="text-xs font-bold text-slate-800 font-mono">
              {filteredRows.length}
            </span>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <DollarSign className="text-emerald-600" size={14} />
            <span className="text-xs text-emerald-700">Total Faturado:</span>
            <span className="text-xs font-bold text-emerald-800 font-mono">
              {formatBRL(totals.grandTotal)}
            </span>
          </div>

          <button
            onClick={handleExportCSV}
            title="Exportar tabela atual para CSV"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm"
          >
            <Download size={13} className="text-slate-500" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Barra de Ferramentas / Pesquisa interna e controles de paginação */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Filtrar por nome, código ou executivo..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all placeholder:text-slate-400"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              ×
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <span>Exibir:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                const val = e.target.value === "all" ? "all" : Number(e.target.value);
                setPageSize(val);
                setCurrentPage(1);
              }}
              className="py-1 px-2 border border-slate-200 rounded-md bg-white text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value={20}>20 linhas</option>
              <option value={50}>50 linhas</option>
              <option value={100}>100 linhas</option>
              <option value="all">Todas as linhas</option>
            </select>
          </div>

          {pageSize !== "all" && (
            <div className="flex items-center gap-1">
              <span>
                {Math.min((currentPageSafe - 1) * pageSize + 1, sortedRows.length)}–
                {Math.min(currentPageSafe * pageSize, sortedRows.length)} de {sortedRows.length}
              </span>

              <div className="flex items-center ml-2 border border-slate-200 rounded-md bg-white overflow-hidden shadow-sm">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPageSafe <= 1}
                  className="p-1 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white"
                  title="Primeira página"
                >
                  <ChevronsLeft size={14} />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPageSafe <= 1}
                  className="p-1 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white border-l border-slate-100"
                  title="Página anterior"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="px-2 font-mono text-[11px] font-semibold text-slate-700">
                  {currentPageSafe}/{totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPageSafe >= totalPages}
                  className="p-1 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white border-r border-slate-100"
                  title="Próxima página"
                >
                  <ChevronRight size={14} />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPageSafe >= totalPages}
                  className="p-1 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white"
                  title="Última página"
                >
                  <ChevronsRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Container com 20 linhas visíveis e scroll lateral (overflow-x-auto) */}
      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-inner">
        <div className="max-h-[820px] overflow-y-auto overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse whitespace-nowrap min-w-[1350px]">
            {/* Cabeçalho Fixo (Sticky) */}
            <thead className="sticky top-0 bg-slate-100 z-10 text-slate-700 font-semibold border-b border-slate-200 shadow-sm">
              <tr>
                <th className="py-2.5 px-3 text-center w-12 text-slate-400 font-mono">#</th>

                <th
                  onClick={() => handleSort("codigo")}
                  className="py-2.5 px-3 cursor-pointer hover:bg-slate-200 transition-colors w-24"
                >
                  Código {getSortIcon("codigo")}
                </th>

                <th
                  onClick={() => handleSort("razaoSocial")}
                  className="py-2.5 px-3 cursor-pointer hover:bg-slate-200 transition-colors min-w-[240px]"
                >
                  Razão Social {getSortIcon("razaoSocial")}
                </th>

                <th
                  onClick={() => handleSort("nomeFantasia")}
                  className="py-2.5 px-3 cursor-pointer hover:bg-slate-200 transition-colors min-w-[180px]"
                >
                  Nome Fantasia {getSortIcon("nomeFantasia")}
                </th>

                <th
                  onClick={() => handleSort("type")}
                  className="py-2.5 px-3 cursor-pointer hover:bg-slate-200 transition-colors text-center w-24"
                >
                  Tipo {getSortIcon("type")}
                </th>

                <th
                  onClick={() => handleSort("segmento")}
                  className="py-2.5 px-3 cursor-pointer hover:bg-slate-200 transition-colors min-w-[170px]"
                >
                  Segmento {getSortIcon("segmento")}
                </th>

                <th
                  onClick={() => handleSort("executivo")}
                  className="py-2.5 px-3 cursor-pointer hover:bg-slate-200 transition-colors min-w-[190px]"
                >
                  Executivo {getSortIcon("executivo")}
                </th>

                {/* Colunas Mensais */}
                {MONTHS.map((m) => {
                  const isInScope = monthsInScopeSet.has(m.toLowerCase());
                  return (
                    <th
                      key={m}
                      onClick={() => handleSort(m)}
                      className={`py-2.5 px-3 text-right cursor-pointer hover:bg-slate-200 transition-colors w-28 ${
                        isInScope ? "text-slate-800 font-bold bg-sky-50/50" : "text-slate-500 font-normal"
                      }`}
                      title={isInScope ? `Mês incluído no período` : `Mês fora do período filtrado`}
                    >
                      {m} {getSortIcon(m)}
                    </th>
                  );
                })}

                {/* Coluna Total */}
                <th
                  onClick={() => handleSort("total")}
                  className="py-2.5 px-4 text-right cursor-pointer bg-slate-200/80 hover:bg-slate-200 transition-colors min-w-[140px] text-slate-900 font-bold"
                >
                  Total Período {getSortIcon("total")}
                </th>
              </tr>
            </thead>

            {/* Corpo da Tabela */}
            <tbody className="divide-y divide-slate-100">
              {displayedRows.length === 0 ? (
                <tr>
                  <td colSpan={7 + MONTHS.length + 1} className="py-12 text-center text-slate-400">
                    <Building2 className="mx-auto mb-2 text-slate-300" size={32} />
                    <p className="font-medium text-slate-600">
                      Nenhum cliente com faturamento encontrado para os filtros selecionados.
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Tente ajustar o ano, os meses ou os filtros de segmento e executivo.
                    </p>
                  </td>
                </tr>
              ) : (
                displayedRows.map((row, idx) => {
                  const rowRank =
                    pageSize === "all" ? idx + 1 : (currentPageSafe - 1) * pageSize + idx + 1;
                  return (
                    <tr
                      key={row.id}
                      className="hover:bg-sky-50/40 transition-colors text-slate-600 group"
                    >
                      <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                        {rowRank}
                      </td>

                      <td className="py-2 px-3 font-mono text-slate-500 font-medium">
                        {row.codigo}
                      </td>

                      <td className="py-2 px-3 font-medium text-slate-800">
                        <span title={row.razaoSocial} className="line-clamp-1">
                          {row.razaoSocial}
                        </span>
                      </td>

                      <td className="py-2 px-3 text-slate-600">
                        <span title={row.nomeFantasia} className="line-clamp-1">
                          {row.nomeFantasia || "—"}
                        </span>
                      </td>

                      <td className="py-2 px-3 text-center">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                            row.type === "Agência"
                              ? "bg-violet-50 text-violet-700 border-violet-200"
                              : "bg-sky-50 text-sky-700 border-sky-200"
                          }`}
                        >
                          {row.type}
                        </span>
                      </td>

                      <td className="py-2 px-3 text-slate-600">
                        <span className="line-clamp-1">{row.segmento}</span>
                      </td>

                      <td className="py-2 px-3 text-slate-700">
                        <span
                          className={`line-clamp-1 ${
                            row.executivo.includes("Key Account") ? "font-semibold text-purple-700" : ""
                          }`}
                        >
                          {row.executivo}
                        </span>
                      </td>

                      {/* Valores por mês */}
                      {MONTHS.map((m) => {
                        const val = row.monthly[m] || 0;
                        const isInScope = monthsInScopeSet.has(m.toLowerCase());
                        return (
                          <td
                            key={m}
                            className={`py-2 px-3 text-right font-mono ${
                              val > 0
                                ? isInScope
                                  ? "text-slate-800 font-medium bg-sky-50/20"
                                  : "text-slate-600"
                                : "text-slate-300"
                            }`}
                          >
                            {val !== 0 ? formatBRL(val) : "—"}
                          </td>
                        );
                      })}

                      {/* Total no período */}
                      <td className="py-2 px-4 text-right font-mono font-bold text-emerald-700 bg-slate-50/70 group-hover:bg-emerald-50/30 transition-colors">
                        {formatBRL(row.total)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Rodapé Fixo com Totais (Sticky) */}
            {sortedRows.length > 0 && (
              <tfoot className="sticky bottom-0 bg-slate-100 z-10 font-bold text-slate-800 border-t-2 border-slate-300 shadow-sm">
                <tr>
                  <td className="py-2.5 px-3 text-center text-slate-400 font-mono">Σ</td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                    {sortedRows.length} itens
                  </td>
                  <td colSpan={5} className="py-2.5 px-3 text-left font-bold text-slate-800">
                    TOTAL DO PERÍODO SELECIONADO
                  </td>

                  {/* Totais mensais */}
                  {MONTHS.map((m) => {
                    const monthTotal = totals.monthlyTotals[m] || 0;
                    const isInScope = monthsInScopeSet.has(m.toLowerCase());
                    return (
                      <td
                        key={m}
                        className={`py-2.5 px-3 text-right font-mono text-xs ${
                          isInScope ? "text-slate-900 bg-sky-100/50 font-bold" : "text-slate-600"
                        }`}
                      >
                        {monthTotal !== 0 ? formatBRL(monthTotal) : "—"}
                      </td>
                    );
                  })}

                  {/* Total Geral */}
                  <td className="py-2.5 px-4 text-right font-mono text-sm font-extrabold text-emerald-800 bg-emerald-100/70 border-l border-emerald-200">
                    {formatBRL(totals.grandTotal)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
