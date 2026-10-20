import React, { useState, useEffect, useMemo } from "react";
import {
  Activity,
  Search,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  Sparkles,
  Users,
  Briefcase,
  CheckCircle2,
  Calendar,
  Filter,
  RefreshCw,
  TrendingUp,
  Clock,
  UserCheck,
  MessageSquare,
  Award,
} from "lucide-react";
import { formatBRL } from "../utils/helpers";
import { apiGet } from "../services/api";

const PERIODOS = [
  { id: "7d", label: "7 dias" },
  { id: "30d", label: "30 dias" },
  { id: "90d", label: "90 dias" },
  { id: "total", label: "Total" },
];

const INDICADORES_MOBILE = [
  { id: "volumeFechado", label: "Volume Fechado (R$)", shortLabel: "Vol. Fechado" },
  { id: "volumeCriado", label: "Volume Criado (R$)", shortLabel: "Vol. Criado" },
  { id: "oportunidadesCriadas", label: "Oportunidades Criadas", shortLabel: "Oportunidades" },
  { id: "oportunidadesEstagnadas", label: "Estagnadas (>15d)", shortLabel: "Estagnadas (>15d)" },
  { id: "taxaConversao", label: "Taxa de Conversão (%)", shortLabel: "Conversão (%)" },
  { id: "contatosCompletos", label: "Contatos Completos (7 campos)", shortLabel: "Contatos 100%" },
  { id: "oportunidadesRadar", label: "Via Radar de Mercado", shortLabel: "Via Radar" },
  { id: "atividadesCards", label: "Atividades em Cards", shortLabel: "Atividades" },
];

export default function EngajamentoTab({ currentUser }) {
  const [periodo, setPeriodo] = useState("30d");
  const [mobileMetric, setMobileMetric] = useState("volumeFechado");
  const [selectedDiretor, setSelectedDiretor] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("volumeFechado");
  const [sortDirection, setSortDirection] = useState("desc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({ executivos: [], diretores: [] });

  const isAdmin = currentUser && currentUser.perfil === "admin";
  const isDiretor = currentUser && currentUser.perfil === "diretor";

  // Carrega os dados da API
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `/engajamento?periodo=${periodo}`;
      if (isAdmin && selectedDiretor) {
        url += `&diretor_id=${selectedDiretor}`;
      }
      const res = await apiGet(url);
      setData(res || { executivos: [], diretores: [] });
    } catch (err) {
      console.error("Erro ao carregar engajamento:", err);
      setError(err.message || "Não foi possível carregar os dados de engajamento.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [periodo, selectedDiretor]);

  // Ordenação
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown size={12} className="inline ml-1 text-slate-400 opacity-60" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp size={12} className="inline ml-1 text-sky-600 font-bold" />
    ) : (
      <ArrowDown size={12} className="inline ml-1 text-sky-600 font-bold" />
    );
  };

  const filteredRows = useMemo(() => {
    return data.executivos || [];
  }, [data.executivos]);

  // Lista ordenada
  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (typeof aVal === "string") {
        aVal = (aVal || "").toLowerCase();
        bVal = (bVal || "").toLowerCase();
        if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
        if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
        return 0;
      }

      aVal = Number(aVal) || 0;
      bVal = Number(bVal) || 0;
      return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
    });
  }, [filteredRows, sortField, sortDirection]);

  // Máximos para cálculo proporcional das micro-barras visuais (Data Bars)
  const maxValues = useMemo(() => {
    const list = filteredRows;
    return {
      volumeCriado: Math.max(...list.map((r) => r.volumeCriado || 0), 1),
      volumeFechado: Math.max(...list.map((r) => r.volumeFechado || 0), 1),
      oportunidadesCriadas: Math.max(...list.map((r) => r.oportunidadesCriadas || 0), 1),
    };
  }, [filteredRows]);

  // Totais consolidados da equipe
  const totals = useMemo(() => {
    const list = filteredRows;
    const totalCriadas = list.reduce((acc, r) => acc + (r.oportunidadesCriadas || 0), 0);
    const totalEstagnadas = list.reduce((acc, r) => acc + (r.oportunidadesEstagnadas || 0), 0);
    const totalCompletos = list.reduce((acc, r) => acc + (r.contatosCompletos || 0), 0);
    const totalRadar = list.reduce((acc, r) => acc + (r.oportunidadesRadar || 0), 0);
    const totalAtividades = list.reduce((acc, r) => acc + (r.atividadesCards || 0), 0);
    const totalVolCriado = list.reduce((acc, r) => acc + (r.volumeCriado || 0), 0);
    const totalVolFechado = list.reduce((acc, r) => acc + (r.volumeFechado || 0), 0);
    const totalFechadas = list.reduce((acc, r) => acc + (r.fechadas || 0), 0);
    const totalPerdidas = list.reduce((acc, r) => acc + (r.perdidas || 0), 0);
    const totalConcluidas = totalFechadas + totalPerdidas;
    const taxaGeral =
      totalConcluidas > 0 ? Number(((totalFechadas / totalConcluidas) * 100).toFixed(1)) : 0;

    return {
      totalCriadas,
      totalEstagnadas,
      totalCompletos,
      totalRadar,
      totalAtividades,
      totalVolCriado,
      totalVolFechado,
      taxaGeral,
    };
  }, [filteredRows]);

  // Exportação para CSV
  const exportToCSV = () => {
    if (sortedRows.length === 0) return;

    const headers = [
      "Executivo",
      "E-mail",
      "Oportunidades Criadas",
      "Estagnadas (>15d)",
      "Contatos Completos",
      "Via Radar",
      "Atividades (Cards)",
      "Volume Criado (R$)",
      "Volume Fechado (R$)",
      "Taxa Conversao (%)",
    ];

    const rows = sortedRows.map((r) => [
      `"${(r.nome || "").replace(/"/g, '""')}"`,
      `"${(r.email || "").replace(/"/g, '""')}"`,
      r.oportunidadesCriadas || 0,
      r.oportunidadesEstagnadas || 0,
      r.contatosCompletos || 0,
      r.oportunidadesRadar || 0,
      r.atividadesCards || 0,
      (r.volumeCriado || 0).toFixed(2),
      (r.volumeFechado || 0).toFixed(2),
      `${r.taxaConversao || 0}%`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map((e) => e.join(";"))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Engajamento_Equipe_${periodo}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Iniciais para avatar
  const getInitials = (nome) => {
    if (!nome) return "EX";
    const parts = nome.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Medalhas para o Top 3
  const getMedalBadge = (index) => {
    if (sortDirection !== "desc") return null;
    if (index === 0) return <span title="1º Lugar" className="text-sm shrink-0">🥇</span>;
    if (index === 1) return <span title="2º Lugar" className="text-sm shrink-0">🥈</span>;
    if (index === 2) return <span title="3º Lugar" className="text-sm shrink-0">🥉</span>;
    return null;
  };

  const currentMobileInd = useMemo(() => {
    return INDICADORES_MOBILE.find((i) => i.id === mobileMetric) || INDICADORES_MOBILE[0];
  }, [mobileMetric]);

  const renderMobileValue = (exec, metricId) => {
    if (metricId === "volumeFechado") {
      return (
        <span className="font-bold text-emerald-700 text-xs sm:text-sm">
          {formatBRL(exec.volumeFechado)}
        </span>
      );
    }
    if (metricId === "volumeCriado") {
      return (
        <span className="font-semibold text-slate-800 text-xs sm:text-sm">
          {formatBRL(exec.volumeCriado)}
        </span>
      );
    }
    if (metricId === "taxaConversao") {
      return exec.taxaConversao > 0 ? (
        <span
          className={
            "inline-block px-2.5 py-0.5 rounded text-xs font-bold " +
            (exec.taxaConversao >= 30
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-sky-50 text-sky-700 border border-sky-200")
          }
        >
          {exec.taxaConversao}%
        </span>
      ) : (
        <span className="text-slate-300 font-mono text-xs">0%</span>
      );
    }
    if (metricId === "oportunidadesEstagnadas") {
      return exec.oportunidadesEstagnadas > 0 ? (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
          <AlertTriangle size={11} className="text-rose-600" />
          {exec.oportunidadesEstagnadas} em risco
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
          <CheckCircle2 size={12} className="text-emerald-500" />
          Em dia
        </span>
      );
    }
    if (metricId === "oportunidadesRadar") {
      return exec.oportunidadesRadar > 0 ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
          <Sparkles size={11} className="text-amber-600" />
          {exec.oportunidadesRadar}
        </span>
      ) : (
        <span className="text-slate-300 font-mono text-xs">0</span>
      );
    }
    if (metricId === "atividadesCards") {
      return (
        <span className="font-bold text-sky-700 text-xs sm:text-sm">
          {exec.atividadesCards}
        </span>
      );
    }
    return (
      <span className="font-bold text-slate-800 text-xs sm:text-sm">
        {exec[metricId]}
      </span>
    );
  };

  const renderMobileTotal = (metricId) => {
    if (metricId === "volumeFechado") {
      return <span className="text-emerald-800 font-bold">{formatBRL(totals.totalVolFechado)}</span>;
    }
    if (metricId === "volumeCriado") {
      return <span className="text-slate-900 font-bold">{formatBRL(totals.totalVolCriado)}</span>;
    }
    if (metricId === "taxaConversao") {
      return <span className="bg-slate-200 px-2 py-0.5 rounded text-slate-800">{totals.taxaGeral}%</span>;
    }
    if (metricId === "oportunidadesEstagnadas") {
      return totals.totalEstagnadas > 0 ? (
        <span className="text-rose-700 font-bold">{totals.totalEstagnadas} em risco</span>
      ) : (
        <span className="text-emerald-700 font-medium">0 em dia</span>
      );
    }
    if (metricId === "oportunidadesRadar") {
      return <span>{totals.totalRadar}</span>;
    }
    if (metricId === "atividadesCards") {
      return <span>{totals.totalAtividades}</span>;
    }
    if (metricId === "contatosCompletos") {
      return <span>{totals.totalCompletos}</span>;
    }
    return <span>{totals.totalCriadas}</span>;
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* 1. Cabeçalho Principal e Controles Responsivos */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center shrink-0 shadow-sm">
                <Activity size={20} />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Engajamento Comercial
                </h2>
              </div>
            </div>

            {/* Controles: Período + Seletor de Equipe */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {/* Seletor de Período (Pills com rolagem horizontal touch) */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 -mx-1 px-1">
                {PERIODOS.map((p) => {
                  const isSelected = periodo === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPeriodo(p.id)}
                      className={
                        "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shrink-0 " +
                        (isSelected
                          ? "bg-slate-900 text-white shadow-sm"
                          : "bg-slate-100/80 text-slate-600 hover:text-slate-900 hover:bg-slate-200/80")
                      }
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>

              {/* Dropdown de Diretor (apenas Admin) */}
              {isAdmin && data.diretores && data.diretores.length > 0 && (
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 w-full sm:w-auto">
                  <Filter size={13} className="text-slate-400 shrink-0" />
                  <select
                    value={selectedDiretor}
                    onChange={(e) => setSelectedDiretor(e.target.value)}
                    className="bg-transparent text-xs text-slate-700 font-medium focus:outline-none w-full sm:w-auto"
                  >
                    <option value="">Todas as Equipes</option>
                    {data.diretores.map((d) => (
                      <option key={d.id} value={d.id}>
                        Equipe: {d.nome}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Mensagem de Erro (se houver) */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 text-xs text-rose-700 flex items-center gap-2">
          <AlertTriangle size={16} className="text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 3. VISÃO MOBILE (< md): TABELA SIMPLES DE 2 COLUNAS (EXECUTIVO + INDICADOR SELECIONADO) */}
      <div className="block md:hidden flex flex-col gap-3">
        {/* Seletor do Indicador Mobile */}
        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Filter size={12} className="text-sky-600" />
            <span>Indicador em Exibição:</span>
          </label>
          <div className="relative">
            <select
              value={mobileMetric}
              onChange={(e) => {
                const nextMetric = e.target.value;
                setMobileMetric(nextMetric);
                setSortField(nextMetric);
                setSortDirection("desc");
              }}
              className="w-full bg-slate-50 text-xs font-bold text-slate-800 border border-slate-200 rounded-lg py-2 px-3 appearance-none focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all cursor-pointer"
            >
              {INDICADORES_MOBILE.map((ind) => (
                <option key={ind.id} value={ind.id}>
                  {ind.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              <ArrowUpDown size={13} />
            </div>
          </div>
        </div>

        {/* Tabela de 2 Colunas no Mobile */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-400">
              <RefreshCw size={24} className="animate-spin text-sky-600 mx-auto mb-2" />
              <span className="text-xs">Carregando indicadores...</span>
            </div>
          ) : sortedRows.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Users size={32} className="mx-auto mb-2 text-slate-300" />
              <p className="font-semibold text-slate-700 text-sm">Nenhum executivo encontrado.</p>
            </div>
          ) : (
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th
                    onClick={() => handleSort("nome")}
                    className="py-3 px-3 cursor-pointer hover:bg-slate-200 transition-colors"
                  >
                    Executivo {getSortIcon("nome")}
                  </th>
                  <th
                    onClick={() => handleSort(mobileMetric)}
                    className="py-3 px-3 text-right cursor-pointer hover:bg-slate-200 transition-colors"
                  >
                    {currentMobileInd.shortLabel} {getSortIcon(mobileMetric)}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedRows.map((exec, idx) => {
                  const medal = getMedalBadge(idx);
                  return (
                    <tr key={exec.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="relative shrink-0">
                            {exec.foto_url ? (
                              <img
                                src={exec.foto_url}
                                alt={exec.nome}
                                className="w-7 h-7 rounded-full object-cover border border-slate-200"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-slate-800 text-white font-bold text-[10px] flex items-center justify-center">
                                {getInitials(exec.nome)}
                              </div>
                            )}
                            {medal && (
                              <span className="absolute -top-1 -right-1 text-[11px]">{medal}</span>
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-slate-900 truncate text-xs">
                              {exec.nome}
                            </span>
                            {exec.email && (
                              <span className="text-[10px] text-slate-400 truncate">
                                {exec.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        {renderMobileValue(exec, mobileMetric)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-100 text-slate-900 font-bold border-t-2 border-slate-300">
                <tr>
                  <td className="py-2.5 px-3 uppercase text-[11px] text-slate-700">
                    Total da Equipe ({filteredRows.length})
                  </td>
                  <td className="py-2.5 px-3 text-right whitespace-nowrap text-xs">
                    {renderMobileTotal(mobileMetric)}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>

      {/* 4. VISÃO DESKTOP (>= md): TABELA MODERNA COM MICRO-BARRAS VISUAIS & HEADER FIXO */}
      <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="max-h-[640px] overflow-y-auto overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse whitespace-nowrap">
            {/* Cabeçalho Fixo (Sticky Top) */}
            <thead className="sticky top-0 bg-slate-100 z-10 text-slate-700 font-semibold border-b border-slate-200 shadow-sm">
              <tr>
                <th
                  onClick={() => handleSort("nome")}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-200 transition-colors min-w-[220px]"
                >
                  Executivo {getSortIcon("nome")}
                </th>

                <th
                  onClick={() => handleSort("oportunidadesCriadas")}
                  className="py-3 px-3 text-center cursor-pointer hover:bg-slate-200 transition-colors w-28"
                  title="Total de oportunidades criadas no período"
                >
                  Oportunidades {getSortIcon("oportunidadesCriadas")}
                </th>

                <th
                  onClick={() => handleSort("oportunidadesEstagnadas")}
                  className="py-3 px-3 text-center cursor-pointer hover:bg-slate-200 transition-colors w-32"
                  title="Oportunidades abertas sem qualquer interação há mais de 15 dias"
                >
                  Estagnadas (&gt;15d) {getSortIcon("oportunidadesEstagnadas")}
                </th>

                <th
                  onClick={() => handleSort("contatosCompletos")}
                  className="py-3 px-3 text-center cursor-pointer hover:bg-slate-200 transition-colors w-32"
                  title="Contatos com todos os 7 campos obrigatórios preenchidos"
                >
                  Contatos 100% {getSortIcon("contatosCompletos")}
                </th>

                <th
                  onClick={() => handleSort("oportunidadesRadar")}
                  className="py-3 px-3 text-center cursor-pointer hover:bg-slate-200 transition-colors w-28"
                  title="Oportunidades originadas do Radar de Mercado"
                >
                  Via Radar {getSortIcon("oportunidadesRadar")}
                </th>

                <th
                  onClick={() => handleSort("atividadesCards")}
                  className="py-3 px-3 text-center cursor-pointer hover:bg-slate-200 transition-colors w-28"
                  title="Total de atividades e toques registrados nos cards de clientes"
                >
                  Atividades {getSortIcon("atividadesCards")}
                </th>

                <th
                  onClick={() => handleSort("volumeCriado")}
                  className="py-3 px-4 text-right cursor-pointer hover:bg-slate-200 transition-colors min-w-[130px]"
                  title="Soma do valor das oportunidades geradas no período"
                >
                  Vol. Criado {getSortIcon("volumeCriado")}
                </th>

                <th
                  onClick={() => handleSort("volumeFechado")}
                  className="py-3 px-4 text-right cursor-pointer hover:bg-slate-200 transition-colors min-w-[150px] font-bold text-slate-900 bg-slate-200/50"
                  title="Soma do valor das oportunidades fechadas/ganhas no período"
                >
                  Vol. Fechado {getSortIcon("volumeFechado")}
                </th>

                <th
                  onClick={() => handleSort("taxaConversao")}
                  className="py-3 px-4 text-center cursor-pointer hover:bg-slate-200 transition-colors w-28"
                  title="Fechadas ÷ (Fechadas + Perdidas)"
                >
                  Conversão (%) {getSortIcon("taxaConversao")}
                </th>
              </tr>
            </thead>

            {/* Corpo da Tabela */}
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <RefreshCw size={24} className="animate-spin text-sky-600 mx-auto mb-2" />
                    <span>Calculando indicadores de engajamento...</span>
                  </td>
                </tr>
              ) : sortedRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Users size={32} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-medium text-slate-600">Nenhum executivo encontrado.</p>
                  </td>
                </tr>
              ) : (
                sortedRows.map((exec, idx) => {
                  const hasEstagnadas = exec.oportunidadesEstagnadas > 0;
                  const medal = getMedalBadge(idx);

                  // Percentual para as Micro-Barras de Progresso
                  const percentFechado = Math.min(
                    100,
                    Math.round(((exec.volumeFechado || 0) / maxValues.volumeFechado) * 100)
                  );
                  const percentCriado = Math.min(
                    100,
                    Math.round(((exec.volumeCriado || 0) / maxValues.volumeCriado) * 100)
                  );

                  return (
                    <tr key={exec.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* 1. Executivo com Medalha Top 3 */}
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0">
                            {exec.foto_url ? (
                              <img
                                src={exec.foto_url}
                                alt={exec.nome}
                                className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-sm"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                                {getInitials(exec.nome)}
                              </div>
                            )}
                            {medal && (
                              <span className="absolute -top-1 -right-1 text-xs">{medal}</span>
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-slate-900 truncate">
                              {exec.nome}
                            </span>
                            {exec.email && (
                              <span className="text-[11px] text-slate-400 truncate">
                                {exec.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 2. Oportunidades Criadas */}
                      <td className="py-2.5 px-3 text-center">
                        <span className="font-semibold text-slate-800 text-xs">
                          {exec.oportunidadesCriadas}
                        </span>
                      </td>

                      {/* 3. Estagnadas (> 15d) Inteligente */}
                      <td className="py-2.5 px-3 text-center">
                        {hasEstagnadas ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-sm animate-pulse">
                            <AlertTriangle size={11} className="text-rose-600 shrink-0" />
                            {exec.oportunidadesEstagnadas} em risco
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                            <CheckCircle2 size={12} className="text-emerald-500" />
                            Em dia
                          </span>
                        )}
                      </td>

                      {/* 4. Contatos Completos */}
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={
                            "font-semibold " +
                            (exec.contatosCompletos > 0 ? "text-slate-800" : "text-slate-300")
                          }
                        >
                          {exec.contatosCompletos}
                        </span>
                      </td>

                      {/* 5. Via Radar */}
                      <td className="py-2.5 px-3 text-center">
                        {exec.oportunidadesRadar > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            <Sparkles size={11} className="text-amber-600 shrink-0" />
                            {exec.oportunidadesRadar}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-mono">0</span>
                        )}
                      </td>

                      {/* 6. Atividades (Cards) */}
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={
                            "font-semibold " +
                            (exec.atividadesCards > 0 ? "text-sky-700" : "text-slate-300")
                          }
                        >
                          {exec.atividadesCards}
                        </span>
                      </td>

                      {/* 7. Volume Criado com Data Bar Sutil */}
                      <td className="py-2.5 px-4 text-right relative">
                        {percentCriado > 0 && (
                          <div
                            className="absolute inset-y-1 right-0 bg-slate-100/70 rounded-l pointer-events-none"
                            style={{ width: `${percentCriado}%` }}
                          />
                        )}
                        <span className="relative z-1 font-medium text-slate-700">
                          {formatBRL(exec.volumeCriado)}
                        </span>
                      </td>

                      {/* 8. Volume Fechado com Data Bar Verde Esmeralda */}
                      <td className="py-2.5 px-4 text-right relative bg-emerald-50/20">
                        {percentFechado > 0 && (
                          <div
                            className="absolute inset-y-1 right-0 bg-emerald-100/60 rounded-l pointer-events-none"
                            style={{ width: `${percentFechado}%` }}
                          />
                        )}
                        <span className="relative z-1 font-bold text-emerald-800">
                          {formatBRL(exec.volumeFechado)}
                        </span>
                      </td>

                      {/* 9. Taxa de Conversão */}
                      <td className="py-2.5 px-4 text-center">
                        {exec.taxaConversao > 0 ? (
                          <span
                            className={
                              "inline-block px-2.5 py-0.5 rounded-md text-xs font-bold " +
                              (exec.taxaConversao >= 30
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-sky-50 text-sky-700 border border-sky-200")
                            }
                          >
                            {exec.taxaConversao}%
                          </span>
                        ) : (
                          <span className="text-slate-300 font-mono">0%</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Rodapé com Totais e Médias da Equipe */}
            {!loading && sortedRows.length > 0 && (
              <tfoot className="sticky bottom-0 bg-slate-100 text-slate-800 font-bold border-t-2 border-slate-300 shadow-md">
                <tr>
                  <td className="py-3 px-4 uppercase tracking-wider text-[11px] text-slate-700">
                    Total da Equipe ({filteredRows.length})
                  </td>
                  <td className="py-3 px-3 text-center">{totals.totalCriadas}</td>
                  <td className="py-3 px-3 text-center">
                    {totals.totalEstagnadas > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                        {totals.totalEstagnadas} em risco
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-medium text-[11px]">0 em dia</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">{totals.totalCompletos}</td>
                  <td className="py-3 px-3 text-center">{totals.totalRadar}</td>
                  <td className="py-3 px-3 text-center">{totals.totalAtividades}</td>
                  <td className="py-3 px-4 text-right">{formatBRL(totals.totalVolCriado)}</td>
                  <td className="py-3 px-4 text-right text-emerald-800 bg-emerald-100/40">
                    {formatBRL(totals.totalVolFechado)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-block px-2.5 py-0.5 rounded bg-slate-200 text-slate-800 text-xs">
                      {totals.taxaGeral}%
                    </span>
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
