// src/components/MediaPlannerTab.jsx
import React, { useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";
import {
  Calculator,
  Table as TableIcon,
  Layers,
  BarChart2,
  History,
  Plus,
  Trash2,
  Copy,
  Download,
  Save,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Building2,
  FileSpreadsheet,
  Search,
  ExternalLink,
  ChevronDown,
  Info
} from "lucide-react";

import {
  PROGRAMS_DATA,
  REGIONAL_MARKETS,
  MEDIA_FORMATS,
  RATE_CARD_VERSIONS,
  AUDIENCE_MARKETS
} from "../modules/mediaPlanner/rateCard";
import { MediaCalculator } from "../modules/mediaPlanner/calculator";

function formatBRL(val) {
  if (val === null || val === undefined || isNaN(val)) return "R$ 0,00";
  return Number(val).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function formatPercent(val) {
  if (val === null || val === undefined || isNaN(val)) return "0,00%";
  return `${Number(val).toFixed(2).replace(".", ",")}%`;
}

export default function MediaPlannerTab({
  advertisers = [],
  opportunities = [],
  currentUser = null,
  onSaveProposalToCrm = null
}) {
  const [subTab, setSubTab] = useState("planner"); // "planner" | "tabelas" | "formatos" | "impactos" | "historico"
  const [toastMessage, setToastMessage] = useState("");

  function showToast(msg) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  }

  // Parâmetros da Campanha
  const [campaign, setCampaign] = useState({
    client: "",
    agency: "",
    projectName: "",
    startDate: "",
    endDate: "",
    defaultDiscount: 70.0,
    globalInsertionMode: "TOTAL" // "TOTAL" | "FREQ"
  });

  // Linhas da grade de mídia
  const [lines, setLines] = useState([
    {
      id: "line-1",
      sigla: "SUPERPOP",
      marketId: "NACIONAL",
      formatId: "SPOT_30",
      brandedVariant: "inedito",
      insertionMode: "TOTAL",
      totalDirect: 20,
      freqDias: 5,
      freqPorDia: 4,
      discountPercent: 70.0
    }
  ]);

  // Histórico de propostas salvas (localStorage)
  const [savedProposals, setSavedProposals] = useState(() => {
    try {
      const stored = localStorage.getItem("redetv_media_proposals_history");
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  // Filtros da aba Tabelas de Preço
  const [tabelaSearch, setTabelaSearch] = useState("");
  const [tabelaMarket, setTabelaMarket] = useState("NACIONAL");
  const [tabelaGenero, setTabelaGenero] = useState("ALL");

  // Filtros da aba Formatos
  const [formatoSearch, setFormatoSearch] = useState("");

  // Calcula valores de uma linha específica usando MediaCalculator
  function calculateLine(line) {
    const unitPriceInfo = MediaCalculator.getUnitPrice(
      line.sigla,
      line.marketId,
      line.formatId,
      line.brandedVariant || "inedito",
      0,
      false,
      null,
      false
    );

    let totalInsertions = 0;
    if (line.insertionMode === "TOTAL") {
      totalInsertions = Number(line.totalDirect) || 0;
    } else if (line.insertionMode === "FREQ") {
      totalInsertions = (Number(line.freqDias) || 0) * (Number(line.freqPorDia) || 0);
    } else {
      totalInsertions = Number(line.totalDirect) || 0;
    }

    const financials = MediaCalculator.calculateLineFinancials(
      unitPriceInfo.valor,
      totalInsertions,
      line.discountPercent
    );

    return {
      ...unitPriceInfo,
      ...financials,
      totalInsertions
    };
  }

  // Linhas enriquecidas com cálculos em tempo real
  const calculatedLines = useMemo(() => {
    return lines.map((l) => ({
      ...l,
      calculo: calculateLine(l)
    }));
  }, [lines]);

  // Totais Consolidados (KPIs)
  const totals = useMemo(() => {
    let totalInsertions = 0;
    let totalBruto = 0;
    let totalLiquido = 0;

    calculatedLines.forEach((l) => {
      const c = l.calculo;
      if (c) {
        totalInsertions += c.totalInsertions || 0;
        totalBruto += c.valorBruto || 0;
        totalLiquido += c.valorLiquido || 0;
      }
    });

    const averageDiscount =
      totalBruto > 0 ? ((totalBruto - totalLiquido) / totalBruto) * 100 : campaign.defaultDiscount;

    // Estimativa de GRPs e CPM Líquido baseada no catálogo de audiência
    let totalGRP = 0;
    calculatedLines.forEach((l) => {
      const prog = MediaCalculator.getProgram(l.sigla);
      const ratDomiciliar = prog?.audiencia?.nacional?.ratDom || 0.6;
      totalGRP += (l.calculo?.totalInsertions || 0) * ratDomiciliar;
    });

    return {
      totalInsertions,
      totalBruto,
      totalLiquido,
      averageDiscount,
      totalGRP: Math.round(totalGRP * 10) / 10
    };
  }, [calculatedLines, campaign.defaultDiscount]);

  // Operações na Grade
  function addLine() {
    setLines((prev) => [
      ...prev,
      {
        id: `line-${Date.now()}`,
        sigla: "REDETV_NEWS",
        marketId: "NACIONAL",
        formatId: "SPOT_30",
        brandedVariant: "inedito",
        insertionMode: campaign.globalInsertionMode || "TOTAL",
        totalDirect: 10,
        freqDias: 5,
        freqPorDia: 2,
        discountPercent: campaign.defaultDiscount
      }
    ]);
  }

  function duplicateLine(id) {
    const idx = lines.findIndex((l) => l.id === id);
    if (idx === -1) return;
    const target = lines[idx];
    const duplicated = {
      ...target,
      id: `line-${Date.now()}`
    };
    const next = [...lines];
    next.splice(idx + 1, 0, duplicated);
    setLines(next);
  }

  function removeLine(id) {
    if (lines.length <= 1) return;
    setLines((prev) => prev.filter((l) => l.id !== id));
  }

  function updateLine(id, field, value) {
    setLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [field]: value } : l))
    );
  }

  function applyDefaultDiscountToAll() {
    const val = Number(campaign.defaultDiscount) || 0;
    setLines((prev) => prev.map((l) => ({ ...l, discountPercent: val })));
    showToast(`Desconto de ${val}% aplicado a todas as linhas!`);
  }

  // Exportação Oficial para Excel (.xlsx)
  function handleExportExcel() {
    try {
      const header = [
        "PROGRAMA",
        "COBERTURA / PRAÇA",
        "FORMATO",
        "VALOR UNIT. TABELA",
        "DESCONTO (%)",
        "VALOR UNIT. LÍQUIDO",
        "INSERÇÕES",
        "TOTAL BRUTO",
        "INVESTIMENTO LÍQUIDO"
      ];

      const dataRows = calculatedLines.map((l) => {
        const prog = MediaCalculator.getProgram(l.sigla);
        const mkt = MediaCalculator.getMarket(l.marketId);
        const fmt = MediaCalculator.getFormat(l.formatId);
        const c = l.calculo;
        return [
          prog?.nome || l.sigla,
          mkt?.nome || l.marketId,
          fmt?.nome || l.formatId,
          c.valor || 0,
          l.discountPercent || 0,
          c.valorUnitarioLiquido || 0,
          c.totalInsertions || 0,
          c.valorBruto || 0,
          c.valorLiquido || 0
        ];
      });

      // Linha de Totais
      const totalRow = [
        "TOTAIS DA PROPOSTA",
        "",
        "",
        "",
        totals.averageDiscount,
        "",
        totals.totalInsertions,
        totals.totalBruto,
        totals.totalLiquido
      ];

      const ws = XLSX.utils.aoa_to_sheet([
        [`PROPOSTA COMERCIAL REDETV! • ${campaign.client || "CLIENTE NÃO INFORMADO"}`],
        [`Projeto: ${campaign.projectName || "Geral"} | Agência: ${campaign.agency || "Direta"} | Período: ${campaign.startDate || "-"} a ${campaign.endDate || "-"}`],
        [],
        header,
        ...dataRows,
        [],
        totalRow
      ]);

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Plano de Mídia");

      const fileName = `Plano_Midia_RedeTV_${(campaign.client || "Proposta").replace(/\s+/g, "_")}.xlsx`;
      XLSX.writeFile(wb, fileName);
      showToast("✅ Planilha Excel gerada e baixada com sucesso!");
    } catch (e) {
      console.error(e);
      showToast("Erro ao exportar planilha.");
    }
  }

  // Salvar Proposta no Histórico
  function handleSaveProposal() {
    if (!campaign.client && lines.length === 0) {
      showToast("Preencha ao menos o cliente para salvar a proposta.");
      return;
    }

    const newProposal = {
      id: `prop-${Date.now()}`,
      createdAt: new Date().toISOString(),
      dateFormatted: new Date().toLocaleDateString("pt-BR"),
      campaign,
      lines,
      totals,
      userEmail: currentUser?.email || "executivo@redetv.com.br"
    };

    const nextList = [newProposal, ...savedProposals.filter((p) => p.id !== newProposal.id)];
    setSavedProposals(nextList);
    try {
      localStorage.setItem("redetv_media_proposals_history", JSON.stringify(nextList));
    } catch (e) {}

    showToast("💾 Proposta salva no histórico com sucesso!");
  }

  // Carregar Proposta do Histórico
  function handleLoadProposal(prop) {
    if (!prop) return;
    setCampaign(prop.campaign || {});
    setLines(prop.lines || []);
    setSubTab("planner");
    showToast(`Proposta "${prop.campaign?.projectName || prop.campaign?.client}" carregada com sucesso!`);
  }

  function handleDeleteSavedProposal(id) {
    const filtered = savedProposals.filter((p) => p.id !== id);
    setSavedProposals(filtered);
    try {
      localStorage.setItem("redetv_media_proposals_history", JSON.stringify(filtered));
    } catch (e) {}
    showToast("Proposta removida do histórico.");
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-xl border border-slate-700 flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header do Módulo */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <Calculator size={22} />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                Planejador de Mídia • RedeTV!
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Tabela Outubro/2026
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Valoração oficial de planos de mídia, tabela de preços, formatos comerciais e cálculo de impactos.
              </p>
            </div>
          </div>
        </div>

        {/* Sub-Navegação por Abas */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setSubTab("planner")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              subTab === "planner"
                ? "bg-white text-rose-600 shadow-2xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            <Calculator size={14} />
            Planejador
          </button>

          <button
            type="button"
            onClick={() => setSubTab("tabelas")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              subTab === "tabelas"
                ? "bg-white text-rose-600 shadow-2xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            <TableIcon size={14} />
            Tabelas de Preço
          </button>

          <button
            type="button"
            onClick={() => setSubTab("formatos")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              subTab === "formatos"
                ? "bg-white text-rose-600 shadow-2xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            <Layers size={14} />
            Formatos
          </button>

          <button
            type="button"
            onClick={() => setSubTab("impactos")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              subTab === "impactos"
                ? "bg-white text-rose-600 shadow-2xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            <BarChart2 size={14} />
            Impactos & GRP
          </button>

          <button
            type="button"
            onClick={() => setSubTab("historico")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              subTab === "historico"
                ? "bg-white text-rose-600 shadow-2xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            <History size={14} />
            Histórico ({savedProposals.length})
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 1. SUB-ABA: PLANEJADOR DE MÍDIA                              */}
      {/* ============================================================ */}
      {subTab === "planner" && (
        <div className="space-y-6">
          {/* Card: Parâmetros da Campanha */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs">
            <h2 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Building2 size={16} className="text-slate-400" />
              Dados Gerais da Campanha & Parâmetros Comerciais
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 text-xs">
              {/* Cliente com datalist de anunciantes do CRM */}
              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
                  Cliente / Anunciante
                </label>
                <input
                  type="text"
                  list="advertisers-datalist"
                  value={campaign.client}
                  onChange={(e) => setCampaign({ ...campaign, client: e.target.value })}
                  placeholder="Nome do Cliente..."
                  className="w-full py-1.5 px-3 border border-slate-300 rounded-lg bg-white font-medium text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
                <datalist id="advertisers-datalist">
                  {advertisers.map((a) => (
                    <option key={a.id} value={a.nomeFantasia || a.razaoSocial} />
                  ))}
                </datalist>
              </div>

              {/* Agência */}
              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
                  Agência de Publicidade
                </label>
                <input
                  type="text"
                  list="agencies-datalist"
                  value={campaign.agency}
                  onChange={(e) => setCampaign({ ...campaign, agency: e.target.value })}
                  placeholder="Nome da Agência..."
                  className="w-full py-1.5 px-3 border border-slate-300 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
                <datalist id="agencies-datalist">
                  {advertisers
                    .filter((a) => a.tipo === "AGENCIA")
                    .map((a) => (
                      <option key={a.id} value={a.nomeFantasia || a.razaoSocial} />
                    ))}
                </datalist>
              </div>

              {/* Nome do Projeto */}
              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
                  Título da Proposta / Campanha
                </label>
                <input
                  type="text"
                  value={campaign.projectName}
                  onChange={(e) => setCampaign({ ...campaign, projectName: e.target.value })}
                  placeholder="Ex: Q4 Black Friday 2026..."
                  className="w-full py-1.5 px-3 border border-slate-300 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              {/* Período */}
              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
                  Período de Veiculação
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={campaign.startDate}
                    onChange={(e) => setCampaign({ ...campaign, startDate: e.target.value })}
                    className="w-1/2 py-1.5 px-2 border border-slate-300 rounded-lg bg-white font-mono text-[11px]"
                  />
                  <span className="text-slate-400">a</span>
                  <input
                    type="date"
                    value={campaign.endDate}
                    onChange={(e) => setCampaign({ ...campaign, endDate: e.target.value })}
                    className="w-1/2 py-1.5 px-2 border border-slate-300 rounded-lg bg-white font-mono text-[11px]"
                  />
                </div>
              </div>

              {/* Desconto Padrão com Ação Global */}
              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
                  Desconto Base (%)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    value={campaign.defaultDiscount}
                    onChange={(e) =>
                      setCampaign({ ...campaign, defaultDiscount: Number(e.target.value) })
                    }
                    className="w-24 py-1.5 px-2 text-right border border-slate-300 rounded-lg bg-white font-mono font-bold text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={applyDefaultDiscountToAll}
                    title="Aplicar esse desconto a todas as linhas da grade"
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Cards de KPIs em Tempo Real */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-0.5">
                Total de Inserções
              </span>
              <div className="text-lg sm:text-xl font-bold font-mono text-slate-900">
                {totals.totalInsertions} spots
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {lines.length} programa{lines.length > 1 ? "s" : ""} na grade
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-0.5">
                Investimento Bruto
              </span>
              <div className="text-lg sm:text-xl font-bold font-mono text-slate-700">
                {formatBRL(totals.totalBruto)}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Tabela cheia</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-0.5">
                Desconto Médio
              </span>
              <div className="text-lg sm:text-xl font-bold font-mono text-amber-600">
                {formatPercent(totals.averageDiscount)}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Média ponderada</div>
            </div>

            <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-3.5 shadow-2xs">
              <span className="text-[10px] uppercase font-bold tracking-wider text-rose-700 block mb-0.5">
                Investimento Líquido
              </span>
              <div className="text-lg sm:text-xl font-bold font-mono text-rose-700">
                {formatBRL(totals.totalLiquido)}
              </div>
              <div className="text-[11px] text-rose-600 font-medium mt-0.5">Valor final negociado</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-0.5">
                Impactos & GRP Estimado
              </span>
              <div className="text-lg sm:text-xl font-bold font-mono text-slate-900">
                {totals.totalGRP} GRPs
              </div>
              <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                Audiência Nacional
              </div>
            </div>
          </div>

          {/* Tabela Corporativa: Grade de Mídia */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  Grade de Inserções e Valoração por Programa
                </h3>
                <p className="text-[11px] text-slate-500">
                  Selecione o programa, praça e formato comercial. Os cálculos unitários e de grade são automáticos.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={addLine}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs"
                >
                  <Plus size={14} />
                  Adicionar Programa
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Programa</th>
                    <th className="py-2.5 px-3">Praça / Cobertura</th>
                    <th className="py-2.5 px-3">Formato Comercial</th>
                    <th className="py-2.5 px-3 text-right">Unit. Tabela</th>
                    <th className="py-2.5 px-3 text-center">Desconto (%)</th>
                    <th className="py-2.5 px-3 text-right">Unit. Líquido</th>
                    <th className="py-2.5 px-3 text-center">Inserções</th>
                    <th className="py-2.5 px-3 text-right">Total Bruto</th>
                    <th className="py-2.5 px-3 text-right font-bold text-rose-600">Total Líquido</th>
                    <th className="py-2.5 px-2 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {calculatedLines.map((line) => {
                    const c = line.calculo;
                    return (
                      <tr key={line.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* 1. Programa */}
                        <td className="py-2 px-3">
                          <select
                            value={line.sigla}
                            onChange={(e) => updateLine(line.id, "sigla", e.target.value)}
                            className="w-48 py-1 px-2 border border-slate-200 rounded-md bg-white font-semibold text-slate-900 focus:ring-1 focus:ring-rose-500 focus:outline-none"
                          >
                            {PROGRAMS_DATA.map((p) => (
                              <option key={p.sigla} value={p.sigla}>
                                {p.nome}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* 2. Praça */}
                        <td className="py-2 px-3">
                          <select
                            value={line.marketId}
                            onChange={(e) => updateLine(line.id, "marketId", e.target.value)}
                            className="w-40 py-1 px-2 border border-slate-200 rounded-md bg-white text-slate-800 focus:ring-1 focus:ring-rose-500 focus:outline-none"
                          >
                            {REGIONAL_MARKETS.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.nome}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* 3. Formato */}
                        <td className="py-2 px-3">
                          <select
                            value={line.formatId}
                            onChange={(e) => updateLine(line.id, "formatId", e.target.value)}
                            className="w-48 py-1 px-2 border border-slate-200 rounded-md bg-white text-slate-800 focus:ring-1 focus:ring-rose-500 focus:outline-none"
                          >
                            {MEDIA_FORMATS.map((f) => (
                              <option key={f.id} value={f.id}>
                                {f.nome} ({f.defaultCoef}x)
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* 4. Unitário Tabela */}
                        <td className="py-2 px-3 text-right font-mono text-slate-600">
                          {formatBRL(c?.valor)}
                        </td>

                        {/* 5. Desconto (%) */}
                        <td className="py-2 px-3 text-center">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max="100"
                            value={line.discountPercent}
                            onChange={(e) =>
                              updateLine(line.id, "discountPercent", Number(e.target.value))
                            }
                            className="w-16 py-1 px-1.5 text-center border border-slate-200 rounded-md bg-white font-mono font-bold text-amber-700 focus:ring-1 focus:ring-rose-500 focus:outline-none"
                          />
                        </td>

                        {/* 6. Unitário Líquido */}
                        <td className="py-2 px-3 text-right font-mono font-medium text-slate-800">
                          {formatBRL(c?.valorUnitarioLiquido)}
                        </td>

                        {/* 7. Inserções */}
                        <td className="py-2 px-3 text-center">
                          <input
                            type="number"
                            min="1"
                            value={line.totalDirect}
                            onChange={(e) =>
                              updateLine(line.id, "totalDirect", Math.max(1, Number(e.target.value)))
                            }
                            className="w-16 py-1 px-1.5 text-center border border-slate-200 rounded-md bg-white font-mono font-bold text-slate-900 focus:ring-1 focus:ring-rose-500 focus:outline-none"
                          />
                        </td>

                        {/* 8. Total Bruto */}
                        <td className="py-2 px-3 text-right font-mono text-slate-600">
                          {formatBRL(c?.valorBruto)}
                        </td>

                        {/* 9. Total Líquido */}
                        <td className="py-2 px-3 text-right font-mono font-bold text-rose-600">
                          {formatBRL(c?.valorLiquido)}
                        </td>

                        {/* 10. Ações */}
                        <td className="py-2 px-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => duplicateLine(line.id)}
                              title="Duplicar linha"
                              className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
                            >
                              <Copy size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeLine(line.id)}
                              disabled={lines.length <= 1}
                              title="Remover linha"
                              className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-bold text-slate-800">
                  <tr>
                    <td colSpan={6} className="py-3 px-3 text-right text-slate-600">
                      Totais Consolidados da Grade:
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-900">
                      {totals.totalInsertions} spots
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-700">
                      {formatBRL(totals.totalBruto)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-rose-600 text-sm">
                      {formatBRL(totals.totalLiquido)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Rodapé de Ações da Grade */}
            <div className="p-4 border-t border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={addLine}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                >
                  <Plus size={14} />
                  Inserir Outro Programa
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLines([
                      {
                        id: `line-${Date.now()}`,
                        sigla: "SUPERPOP",
                        marketId: "NACIONAL",
                        formatId: "SPOT_30",
                        brandedVariant: "inedito",
                        insertionMode: "TOTAL",
                        totalDirect: 10,
                        discountPercent: campaign.defaultDiscount
                      }
                    ]);
                    showToast("Grade reiniciada.");
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-slate-500 hover:text-slate-700 text-xs font-medium"
                >
                  <RotateCcw size={13} />
                  Limpar Grade
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs"
                >
                  <Download size={14} />
                  Exportar Proposta (.xlsx)
                </button>
                <button
                  type="button"
                  onClick={handleSaveProposal}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs"
                >
                  <Save size={14} />
                  Salvar no Histórico
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. SUB-ABA: TABELAS DE PREÇO                                 */}
      {/* ============================================================ */}
      {subTab === "tabelas" && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <Search size={15} className="text-slate-400" />
              <input
                type="text"
                value={tabelaSearch}
                onChange={(e) => setTabelaSearch(e.target.value)}
                placeholder="Pesquisar programa na tabela..."
                className="w-full text-xs border-0 focus:ring-0 text-slate-900"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={tabelaMarket}
                onChange={(e) => setTabelaMarket(e.target.value)}
                className="text-xs border border-slate-300 rounded-lg py-1.5 px-3 bg-white"
              >
                {REGIONAL_MARKETS.map((m) => (
                  <option key={m.id} value={m.id}>
                    Praça: {m.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Programa</th>
                  <th className="py-2.5 px-3">Gênero / Faixa</th>
                  <th className="py-2.5 px-3">Dias de Exibição</th>
                  <th className="py-2.5 px-3">Horário</th>
                  <th className="py-2.5 px-3 text-right">Preço Base 30"</th>
                  <th className="py-2.5 px-3 text-center">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {PROGRAMS_DATA.filter((p) =>
                  tabelaSearch
                    ? p.nome.toLowerCase().includes(tabelaSearch.toLowerCase()) ||
                      p.sigla.toLowerCase().includes(tabelaSearch.toLowerCase())
                    : true
                ).map((prog) => {
                  const priceInfo = MediaCalculator.getUnitPrice(
                    prog.sigla,
                    tabelaMarket,
                    "SPOT_30"
                  );
                  return (
                    <tr key={prog.sigla} className="hover:bg-slate-50/80">
                      <td className="py-2 px-3 font-bold text-slate-900">{prog.nome}</td>
                      <td className="py-2 px-3">
                        <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {prog.genero}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-600">{prog.dias}</td>
                      <td className="py-2 px-3 font-mono text-slate-600">{prog.horario}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                        {formatBRL(priceInfo.valor)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setLines((prev) => [
                              ...prev,
                              {
                                id: `line-${Date.now()}`,
                                sigla: prog.sigla,
                                marketId: tabelaMarket,
                                formatId: "SPOT_30",
                                brandedVariant: "inedito",
                                insertionMode: "TOTAL",
                                totalDirect: 10,
                                discountPercent: campaign.defaultDiscount
                              }
                            ]);
                            setSubTab("planner");
                            showToast(`"${prog.nome}" adicionado à grade de planejamento!`);
                          }}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded text-xs font-semibold transition-colors"
                        >
                          + Incluir no Plano
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. SUB-ABA: FORMATOS COMERCIAIS                              */}
      {/* ============================================================ */}
      {subTab === "formatos" && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <Search size={15} className="text-slate-400" />
              <input
                type="text"
                value={formatoSearch}
                onChange={(e) => setFormatoSearch(e.target.value)}
                placeholder="Pesquisar formato ou tipo comercial..."
                className="w-full text-xs border-0 focus:ring-0 text-slate-900"
              />
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Total de formatos oficiais: <strong>{MEDIA_FORMATS.length}</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {MEDIA_FORMATS.filter((f) =>
              formatoSearch
                ? f.nome.toLowerCase().includes(formatoSearch.toLowerCase()) ||
                  f.id.toLowerCase().includes(formatoSearch.toLowerCase())
                : true
            ).map((fmt) => (
              <div
                key={fmt.id}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {fmt.tipo || "Mídia"}
                    </span>
                    <span className="font-mono font-bold text-rose-600 text-xs">
                      Fator: {fmt.defaultCoef}x base 30"
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">{fmt.nome}</h4>
                  <p className="text-xs text-slate-500">
                    {fmt.descricao || "Formato comercial padrão para inserções na grade da RedeTV!."}
                  </p>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Duração: <strong>{fmt.duracao || "Variável"}</strong></span>
                  <span className="text-emerald-600 font-semibold">Tabela Out/2026</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. SUB-ABA: IMPACTOS & GRP                                   */}
      {/* ============================================================ */}
      {subTab === "impactos" && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">
              Índices de Audiência e Potencial de Impactos por Programa
            </h3>
            <p className="text-[11px] text-slate-500">
              Dados médios de audiência domiciliar (Rat% e Share%) para projeção de GRP e alcance.
            </p>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Programa</th>
                <th className="py-2.5 px-3">Faixa / Horário</th>
                <th className="py-2.5 px-3 text-right">Rat Domiciliar (%)</th>
                <th className="py-2.5 px-3 text-right">Share (%)</th>
                <th className="py-2.5 px-3 text-right">Impactos Est. / Spot</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {PROGRAMS_DATA.map((prog) => {
                const aud = prog.audiencia?.nacional || { ratDom: 0.6, share: 1.5 };
                const impactos = Math.round((aud.ratDom || 0.6) * 190000);
                return (
                  <tr key={prog.sigla} className="hover:bg-slate-50/80">
                    <td className="py-2 px-3 font-bold text-slate-900">{prog.nome}</td>
                    <td className="py-2 px-3 text-slate-600 font-mono">{prog.horario}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">
                      {aud.ratDom}%
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-slate-600">
                      {aud.share}%
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-emerald-700 font-semibold">
                      {impactos.toLocaleString("pt-BR")} pessoas
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. SUB-ABA: HISTÓRICO DE PROPOSTAS                           */}
      {/* ============================================================ */}
      {subTab === "historico" && (
        <div className="space-y-4">
          {savedProposals.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center">
              <History size={36} className="text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-700">Nenhuma proposta salva ainda</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Monte sua grade na aba Planejador e clique em "Salvar no Histórico" para guardar simulações e reutilizá-las quando desejar.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedProposals.map((prop) => (
                <div
                  key={prop.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span>Salvo em {prop.dateFormatted}</span>
                      <span className="font-mono">{prop.lines?.length || 0} programas</span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 mb-0.5">
                      {prop.campaign?.client || "Cliente Não Informado"}
                    </h4>
                    <p className="text-xs text-slate-600 mb-3">
                      {prop.campaign?.projectName || "Sem título de projeto"}
                      {prop.campaign?.agency ? ` • Agência: ${prop.campaign.agency}` : ""}
                    </p>

                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Total de Spots:</span>
                        <strong className="font-mono text-slate-800">
                          {prop.totals?.totalInsertions}
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Desconto Médio:</span>
                        <strong className="font-mono text-amber-600">
                          {formatPercent(prop.totals?.averageDiscount)}
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Investimento Líquido:</span>
                        <strong className="font-mono text-rose-600 font-bold">
                          {formatBRL(prop.totals?.totalLiquido)}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleLoadProposal(prop)}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs"
                    >
                      Carregar no Planejador
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSavedProposal(prop.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                      title="Excluir proposta"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
