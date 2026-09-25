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

      const valor = Number(f.valor) || 0;

      if (!clientBilledData.has(cod)) {
        clientBilledData.set(cod, { totalInScope: 0, totalYear: 0 });
      }

      const entry = clientBilledData.get(cod);
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

      const nomeFantasia = client?.nomeFantasia || client?.razaoSocial || client?.name || `Cliente (${cod})`;
      const razaoSocial = client?.razaoSocial || "";
      const segmento = client?.segmento || "Não identificado";
      const type = client?.type || "Anunciante";

      rows.push({
        id: client?.id || `unmapped-${cod}`,
        codigo: cod,
        nomeFantasia,
        razaoSocial,
        type,
        segmento,
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
  ]);

  // Filtragem por busca textual local (nome fantasia, razão social, código ou segmento)
  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return billedClients;
    const term = searchTerm.trim().toLowerCase();
    return billedClients.filter((r) => {
      return (
        r.codigo.toLowerCase().includes(term) ||
        r.nomeFantasia.toLowerCase().includes(term) ||
        r.razaoSocial.toLowerCase().includes(term) ||
        r.segmento.toLowerCase().includes(term) ||
        r.type.toLowerCase().includes(term)
      );
    });
  }, [billedClients, searchTerm]);

  // Ordenação de todas as linhas
  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => {
      let valA, valB;

      if (sortField === "total") {
        valA = a.total;
        valB = b.total;
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

  // Total geral para o rodapé
  const totalGeral = useMemo(() => {
    return sortedRows.reduce((acc, r) => acc + (r.total || 0), 0);
  }, [sortedRows]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection(field === "total" ? "desc" : "asc");
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
      "Nome Fantasia",
      "Razão Social",
      "Tipo",
      "Segmento",
      `Total Faturado (${dashboardYear})`,
    ];

    const rows = sortedRows.map((r, idx) => [
      idx + 1,
      `"${r.codigo}"`,
      `"${r.nomeFantasia.replace(/"/g, '""')}"`,
      `"${r.razaoSocial.replace(/"/g, '""')}"`,
      `"${r.type}"`,
      `"${r.segmento.replace(/"/g, '""')}"`,
      (r.total || 0).toFixed(2).replace(".", ","),
    ]);

    const totalsRow = [
      "TOTAL",
      "—",
      `${sortedRows.length} clientes`,
      "—",
      "—",
      "—",
      totalGeral.toFixed(2).replace(".", ","),
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

        {/* Indicadores rápidos de totais e busca */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <span className="text-xs text-slate-500">Clientes Faturados:</span>
            <span className="text-xs font-bold text-slate-800 font-mono">
              {filteredRows.length}
            </span>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <DollarSign className="text-emerald-600" size={14} />
            <span className="text-xs text-emerald-700">Total Faturado:</span>
            <span className="text-xs font-bold text-emerald-800 font-mono">
              {formatBRL(totalGeral)}
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

      {/* Barra de Pesquisa Rápida */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrar por nome, código ou segmento..."
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

        <div className="text-xs text-slate-500 hidden sm:block">
          Exibindo <span className="font-semibold text-slate-700">{sortedRows.length}</span> registros (use a barra de rolagem para navegar)
        </div>
      </div>

      {/* Janela de rolagem: ~15 linhas visíveis na tela inicial com scroll vertical e lateral */}
      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-inner">
        <div className="max-h-[590px] overflow-y-auto overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse whitespace-nowrap min-w-[700px]">
            {/* Cabeçalho Fixo (Sticky Top) */}
            <thead className="sticky top-0 bg-slate-100 z-10 text-slate-700 font-semibold border-b border-slate-200 shadow-sm">
              <tr>
                <th className="py-2.5 px-3 text-center w-12 text-slate-400 font-mono">#</th>

                <th
                  onClick={() => handleSort("codigo")}
                  className="py-2.5 px-3 cursor-pointer hover:bg-slate-200 transition-colors w-24 text-center font-mono"
                >
                  Código {getSortIcon("codigo")}
                </th>

                <th
                  onClick={() => handleSort("nomeFantasia")}
                  className="py-2.5 px-4 cursor-pointer hover:bg-slate-200 transition-colors min-w-[260px]"
                >
                  Nome Fantasia {getSortIcon("nomeFantasia")}
                </th>

                <th
                  onClick={() => handleSort("type")}
                  className="py-2.5 px-3 cursor-pointer hover:bg-slate-200 transition-colors text-center w-28"
                >
                  Tipo {getSortIcon("type")}
                </th>

                <th
                  onClick={() => handleSort("segmento")}
                  className="py-2.5 px-4 cursor-pointer hover:bg-slate-200 transition-colors min-w-[200px]"
                >
                  Segmento {getSortIcon("segmento")}
                </th>

                <th
                  onClick={() => handleSort("total")}
                  className="py-2.5 px-5 text-right cursor-pointer bg-slate-200/80 hover:bg-slate-200 transition-colors min-w-[160px] text-slate-900 font-bold"
                >
                  Total Faturado {getSortIcon("total")}
                </th>
              </tr>
            </thead>

            {/* Corpo da Tabela com todos os registros */}
            <tbody className="divide-y divide-slate-100">
              {sortedRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
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
                sortedRows.map((row, idx) => (
                  <tr
                    key={row.id}
                    className="hover:bg-sky-50/50 transition-colors text-slate-600 group"
                  >
                    <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                      {idx + 1}
                    </td>

                    <td className="py-2 px-3 text-center font-mono text-slate-500 font-medium">
                      {row.codigo}
                    </td>

                    <td className="py-2 px-4 font-medium text-slate-800">
                      <div className="flex flex-col">
                        <span title={row.nomeFantasia} className="line-clamp-1 font-semibold text-slate-900">
                          {row.nomeFantasia}
                        </span>
                        {row.razaoSocial && row.razaoSocial !== row.nomeFantasia && (
                          <span title={row.razaoSocial} className="line-clamp-1 text-[11px] text-slate-400 font-normal">
                            {row.razaoSocial}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-2 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          row.type === "Agência"
                            ? "bg-violet-50 text-violet-700 border-violet-200"
                            : "bg-sky-50 text-sky-700 border-sky-200"
                        }`}
                      >
                        {row.type}
                      </span>
                    </td>

                    <td className="py-2 px-4 text-slate-600">
                      <span className="line-clamp-1">{row.segmento}</span>
                    </td>

                    <td className="py-2 px-5 text-right font-mono font-bold text-emerald-700 bg-slate-50/60 group-hover:bg-emerald-50/30 transition-colors text-xs">
                      {formatBRL(row.total)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            {/* Rodapé Fixo com Totais (Sticky Bottom) */}
            {sortedRows.length > 0 && (
              <tfoot className="sticky bottom-0 bg-slate-100 z-10 font-bold text-slate-800 border-t-2 border-slate-300 shadow-sm">
                <tr>
                  <td className="py-2.5 px-3 text-center text-slate-400 font-mono">Σ</td>
                  <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-500">
                    {sortedRows.length} clientes
                  </td>
                  <td colSpan={3} className="py-2.5 px-4 text-left font-bold text-slate-800">
                    TOTAL DO PERÍODO SELECIONADO
                  </td>
                  <td className="py-2.5 px-5 text-right font-mono text-sm font-extrabold text-emerald-800 bg-emerald-100/70 border-l border-emerald-200">
                    {formatBRL(totalGeral)}
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
