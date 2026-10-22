// src/components/MediaPlannerTab.jsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import * as XLSX from "xlsx";
import {
  Download,
  Trash2,
  Copy,
  Plus,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  X,
  Search,
  ExternalLink,
  ChevronDown
} from "lucide-react";

import "../modules/mediaPlanner/mediaPlanner.css";
import {
  PROGRAMS_DATA,
  REGIONAL_MARKETS,
  MEDIA_FORMATS,
  RATE_CARD_VERSIONS
} from "../modules/mediaPlanner/rateCard";
import { MediaCalculator } from "../modules/mediaPlanner/calculator";

function formatCurrency(val) {
  if (val === null || val === undefined || isNaN(val) || val === "" || Number(val) === 0) return "R$ 0";
  return "R$ " + Math.round(Number(val)).toLocaleString("pt-BR");
}

function formatCurrencyExact(val) {
  if (val === null || val === undefined || isNaN(val) || val === "" || Number(val) === 0) return "R$ 0,00";
  return Number(val).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatPercent(val) {
  if (val === null || val === undefined || isNaN(val)) return "70,00%";
  return `${Number(val).toFixed(2).replace(".", ",")}%`;
}

function getProgramImpact(sigla) {
  const defaultImpacts = {
    RTVN: 142000,
    FGEN: 198000,
    BOLA: 245000,
    TARD: 412000,
    RTNO: 185000,
    BPOV: 295000,
    NEWS: 388000,
    RAPF: 310000,
    FAMA: 460000,
    SENS: 350000,
    ENOT: 125000,
    OGVE: 180000,
    SPOP: 395000,
    DINC: 140000,
    COMP: 280000,
    OPER: 315000,
    TEST: 210000,
    GOLP: 195000,
    MEGA: 520000,
    DOMI: 220000,
    JOAO: 260000,
    GERA: 240000,
    VILA: 190000,
    DEFAULT: 250000
  };
  return defaultImpacts[sigla] || defaultImpacts.DEFAULT;
}

function MediaPlannerTabContent({
  advertisers = [],
  opportunities = [],
  currentUser = null
}) {
  // Toast
  const [toastMessage, setToastMessage] = useState("");
  function showToast(msg) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  }

  // Modais auxiliares
  const [showTabelasModal, setShowTabelasModal] = useState(false);
  const [showHistoricoModal, setShowHistoricoModal] = useState(false);
  const [tabelaSearch, setTabelaSearch] = useState("");
  const [tabelaMarket, setTabelaMarket] = useState("NACIONAL");

  // Estado da Campanha (Fiel a index.html)
  const [campaign, setCampaign] = useState({
    client: "",
    agency: "",
    projectName: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    periodPreset: null,
    defaultDiscount: 70.0,
    globalInsertionMode: "TOTAL", // "TOTAL" | "FREQ" | "CALENDAR"
    isCollapsed: false
  });

  // Linhas da grade (Fiel a index.html)
  const [lines, setLines] = useState([
    {
      id: "line-1",
      sigla: "",
      marketId: "NACIONAL",
      formatId: "COMERCIAL_30",
      customCoef: null,
      insertionMode: "TOTAL",
      totalDirect: "",
      freqDias: "",
      freqPorDia: "",
      discountPercent: 70.0
    }
  ]);

  // Histórico de Campanhas Salvas
  const [savedProposals, setSavedProposals] = useState(() => {
    try {
      const stored = localStorage.getItem("redetv_media_proposals_history");
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  // Interconexão com Med.IA Planner e Histórico de Propostas
  useEffect(() => {
    try {
      const loadProp = localStorage.getItem("redetv_load_proposal");
      if (loadProp) {
        localStorage.removeItem("redetv_load_proposal");
        const parsed = JSON.parse(loadProp);
        if (parsed.campaign) setCampaign(parsed.campaign);
        if (parsed.lines && parsed.lines.length > 0) setLines(parsed.lines);
        showToast(`Campanha "${parsed.projectName || parsed.client}" carregada do histórico!`);
        return;
      }
    } catch (e) {}

    try {
      const pendingAi = localStorage.getItem("redetv_pending_ai_plan");
      if (pendingAi) {
        localStorage.removeItem("redetv_pending_ai_plan");
        const plan = JSON.parse(pendingAi);
        if (plan) {
          if (plan.projectName) {
            setCampaign((prev) => ({
              ...prev,
              projectName: plan.projectName,
              startDate: plan.period?.startDate || prev.startDate,
              endDate: plan.period?.endDate || prev.endDate,
              periodPreset: plan.period?.periodPreset || prev.periodPreset
            }));
          }
          if (Array.isArray(plan.items) && plan.items.length > 0) {
            const mapped = plan.items.map((it, idx) => ({
              id: `line-ai-${idx}-${Date.now()}`,
              sigla: it.program || "",
              marketId: "NACIONAL",
              formatId: it.format || "COMERCIAL_30",
              customCoef: null,
              insertionMode: "TOTAL",
              totalDirect: it.totalInsertions || 10,
              freqDias: "",
              freqPorDia: it.dailyFrequency || "",
              discountPercent: campaign.defaultDiscount || 70.0
            }));
            setLines(mapped);
            showToast("Plano gerado pela Med.IA importado com sucesso!");
          }
        }
      }
    } catch (e) {}
  }, []);

  // Recálculo de Linha
  function calculateLine(line) {
    try {
      if (!line.sigla) {
        return {
          basePrice30: 0,
          coef: 1.0,
          valor: 0,
          totalInsertions: 0,
          totalBruto: 0,
          totalLiquido: 0,
          unitarioLiquido: 0,
          discountPercent: line.discountPercent
        };
      }

      const unitPriceInfo = MediaCalculator.calculateUnitPrice(
        line.sigla,
        line.marketId || "NACIONAL",
        line.formatId || "COMERCIAL_30",
        "inedito",
        0,
        false,
        line.customCoef,
        false
      ) || { valor: 0, basePrice30: 0, coef: 1.0 };

      let totalInsertions = 0;
      if (line.insertionMode === "TOTAL") {
        totalInsertions = Number(line.totalDirect) || 0;
      } else if (line.insertionMode === "FREQ") {
        totalInsertions = (Number(line.freqDias) || 0) * (Number(line.freqPorDia) || 0);
      } else {
        totalInsertions = Number(line.totalDirect) || 0;
      }

      const financials = MediaCalculator.calculateLineFinancials(
        unitPriceInfo.valor || 0,
        totalInsertions,
        line.discountPercent !== "" && line.discountPercent !== undefined ? line.discountPercent : campaign.defaultDiscount
      ) || {};

      return {
        ...unitPriceInfo,
        ...financials,
        totalInsertions
      };
    } catch (err) {
      console.error("Erro calculo linha:", err);
      return {
        basePrice30: 0,
        coef: 1.0,
        valor: 0,
        totalInsertions: 0,
        totalBruto: 0,
        totalLiquido: 0,
        unitarioLiquido: 0
      };
    }
  }

  // Linhas calculadas
  const calculatedLines = useMemo(() => {
    return lines.map((l) => ({
      ...l,
      calculo: calculateLine(l)
    }));
  }, [lines, campaign.defaultDiscount]);

  // Totais (6 KPIs de index.html)
  const totals = useMemo(() => {
    let totalInsertions = 0;
    let totalBruto = 0;
    let totalLiquido = 0;
    let totalImpactos = 0;

    calculatedLines.forEach((l) => {
      const c = l.calculo;
      if (c && l.sigla) {
        totalInsertions += c.totalInsertions || 0;
        totalBruto += c.totalBruto || 0;
        totalLiquido += c.totalLiquido || 0;

        const impactPerSpot = getProgramImpact(l.sigla);
        totalImpactos += (c.totalInsertions || 0) * impactPerSpot;
      }
    });

    const averageDiscount =
      totalBruto > 0 ? ((totalBruto - totalLiquido) / totalBruto) * 100 : Number(campaign.defaultDiscount) || 70.0;

    const cpmMedio = totalImpactos > 0 ? (totalLiquido / totalImpactos) * 1000 : 0;

    return {
      totalInsertions,
      totalBruto,
      totalLiquido,
      averageDiscount,
      totalImpactos,
      cpmMedio
    };
  }, [calculatedLines, campaign.defaultDiscount]);

  // Ações da Grade
  function handleAddLine() {
    setLines((prev) => [
      ...prev,
      {
        id: `line-${Date.now()}`,
        sigla: "",
        marketId: "NACIONAL",
        formatId: "COMERCIAL_30",
        customCoef: null,
        insertionMode: campaign.globalInsertionMode,
        totalDirect: "",
        freqDias: "",
        freqPorDia: "",
        discountPercent: campaign.defaultDiscount
      }
    ]);
  }

  function handleDuplicateLine(id) {
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
    showToast("Linha duplicada com sucesso!");
  }

  function handleDeleteLine(id) {
    if (lines.length <= 1) {
      setLines([
        {
          id: `line-${Date.now()}`,
          sigla: "",
          marketId: "NACIONAL",
          formatId: "COMERCIAL_30",
          customCoef: null,
          insertionMode: campaign.globalInsertionMode,
          totalDirect: "",
          freqDias: "",
          freqPorDia: "",
          discountPercent: campaign.defaultDiscount
        }
      ]);
      showToast("Linha zerada.");
      return;
    }
    setLines((prev) => prev.filter((l) => l.id !== id));
    showToast("Linha removida.");
  }

  function handleClearAllLines() {
    setLines([
      {
        id: `line-${Date.now()}`,
        sigla: "",
        marketId: "NACIONAL",
        formatId: "COMERCIAL_30",
        customCoef: null,
        insertionMode: campaign.globalInsertionMode,
        totalDirect: "",
        freqDias: "",
        freqPorDia: "",
        discountPercent: campaign.defaultDiscount
      }
    ]);
    showToast("Todas as linhas foram limpas.");
  }

  function updateLine(id, field, value) {
    setLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [field]: value } : l))
    );
  }

  function handleSwitchGlobalMode(mode) {
    setCampaign((prev) => ({ ...prev, globalInsertionMode: mode }));
    setLines((prev) =>
      prev.map((l) => ({ ...l, insertionMode: mode }))
    );
  }

  // Exportar Excel Fiel (.xls / .xlsx)
  function handleExportExcel() {
    try {
      const header = [
        "#",
        "PRODUTO",
        "PRAÇA",
        "FORMATO",
        "BASE 30\"",
        "COEF.",
        "UNIT. TABELA",
        "INS",
        "ENTREGA DE MÍDIA",
        "DESCONTO (%)",
        "INVESTIMENTO",
        "UNIT. NEGOCIADO"
      ];

      const dataRows = calculatedLines
        .filter((l) => l.sigla)
        .map((l, idx) => {
          const prog = MediaCalculator.getProgram(l.sigla);
          const mkt = MediaCalculator.getMarket(l.marketId);
          const fmt = MediaCalculator.getFormat(l.formatId);
          const c = l.calculo || {};
          return [
            idx + 1,
            prog?.nome || l.sigla,
            mkt?.nome || l.marketId,
            fmt?.nome || l.formatId,
            c.basePrice30 || 0,
            c.coef || 1.0,
            c.valor || 0,
            c.totalInsertions || 0,
            c.totalBruto || 0,
            l.discountPercent || 0,
            c.totalLiquido || 0,
            c.unitarioLiquido || 0
          ];
        });

      const totalRow = [
        "TOTAIS",
        "",
        "",
        "",
        "",
        "",
        "",
        totals.totalInsertions,
        totals.totalBruto,
        totals.averageDiscount,
        totals.totalLiquido,
        ""
      ];

      const ws = XLSX.utils.aoa_to_sheet([
        [`REDETV! • PLANO DE MÍDIA • ${campaign.client || "CLIENTE NÃO INFORMADO"}`],
        [
          `Projeto: ${campaign.projectName || "Geral"} | Agência: ${campaign.agency || "Direta"} | Período: ${campaign.startDate} a ${campaign.endDate} | Tabela: Outubro/2026`
        ],
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
      showToast("Planilha Excel exportada com sucesso!");
    } catch (e) {
      console.error(e);
      showToast("Erro ao exportar planilha.");
    }
  }

  // Salvar Campanha
  function handleSaveCampaign() {
    const clientName = (campaign.client || "").trim() || "CLIENTE NÃO INFORMADO";
    const projectName = (campaign.projectName || "").trim() || `PLANO DE MÍDIA ${new Date().toLocaleDateString("pt-BR")}`;
    const agencyName = (campaign.agency || "").trim() || "DIRETO";

    const newProposal = {
      id: `PROP-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
      projectName,
      client: clientName,
      agency: agencyName,
      date: new Date().toLocaleDateString("pt-BR"),
      timestamp: Date.now(),
      totalInsertions: totals.totalInsertions,
      totalGross: totals.totalBruto,
      totalNet: totals.totalLiquido,
      avgDiscount: totals.averageDiscount,
      campaign,
      lines
    };

    const nextList = [newProposal, ...savedProposals.filter((p) => p.id !== newProposal.id)];
    setSavedProposals(nextList);
    try {
      localStorage.setItem("redetv_media_proposals_history", JSON.stringify(nextList));
    } catch (e) {}

    showToast("Campanha salva com sucesso no histórico!");
  }

  function handleLoadProposal(prop) {
    if (!prop) return;
    setCampaign(prop.campaign || {});
    setLines(prop.lines || []);
    setShowHistoricoModal(false);
    showToast(`Campanha "${prop.projectName || prop.client}" carregada com sucesso!`);
  }

  function handleDeleteSavedProposal(id) {
    const filtered = savedProposals.filter((p) => p.id !== id);
    setSavedProposals(filtered);
    try {
      localStorage.setItem("redetv_media_proposals_history", JSON.stringify(filtered));
    } catch (e) {}
    showToast("Campanha removida do histórico.");
  }

  return (
    <div className="media-planner-scope space-y-5 animate-fadeIn pb-16">
      {/* Toast Notificação */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-xl border border-slate-700 flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Topbar Fiel (h-16, branca, border-b) */}
      <header className="topbar rounded-xl shadow-2xs">
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div className="topbar-title font-bold text-slate-900">
            Sistema de Planejamento de Mídia
          </div>
        </div>
        <div className="topbar-actions">
          <button
            type="button"
            onClick={() => setShowTabelasModal(true)}
            id="btn-table-version"
            className="btn btn-secondary btn-sm"
          >
            ⚙️ Tabela Outubro/2026
          </button>
          <button
            type="button"
            onClick={() => setShowHistoricoModal(true)}
            className="btn btn-secondary btn-sm"
          >
            Histórico ({savedProposals.length})
          </button>
          <button
            type="button"
            onClick={handleExportExcel}
            id="btn-export-excel"
            className="btn btn-primary btn-sm"
          >
            <Download size={15} style={{ marginRight: "4px" }} />
            Exportar Excel (.xls)
          </button>
        </div>
      </header>

      {/* 1. Card: CAMPANHA (Retrátil) */}
      <section
        className={`card-box ${campaign.isCollapsed ? "campaign-collapsed" : ""}`}
        id="campaign-card-section"
      >
        <div
          className="card-title"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            userSelect: "none"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span>CAMPANHA</span>
          </div>
          <button
            type="button"
            id="btn-collapse-campaign"
            className="campaign-collapse-btn"
            onClick={() => setCampaign({ ...campaign, isCollapsed: !campaign.isCollapsed })}
            title="Retrair/Expandir Dados da Campanha"
          >
            <ChevronDown size={16} />
          </button>
        </div>

        {!campaign.isCollapsed && (
          <div className="campaign-grid" id="campaign-card-body">
            {/* Linha 1: Cliente, Agência, Nome do Projeto */}
            <div className="form-group col-4">
              <label htmlFor="camp-client" className="form-label">
                CLIENTE
              </label>
              <input
                type="text"
                id="camp-client"
                className="form-input"
                list="anunciantes-list"
                value={campaign.client}
                onChange={(e) => setCampaign({ ...campaign, client: e.target.value })}
                placeholder="Nome do Cliente"
              />
              <datalist id="anunciantes-list">
                {(advertisers || []).map((a) => (
                  <option key={a.id} value={a.nomeFantasia || a.razaoSocial} />
                ))}
              </datalist>
            </div>

            <div className="form-group col-4">
              <label htmlFor="camp-agency" className="form-label">
                AGÊNCIA
              </label>
              <input
                type="text"
                id="camp-agency"
                className="form-input"
                value={campaign.agency}
                onChange={(e) => setCampaign({ ...campaign, agency: e.target.value })}
                placeholder="Nome da Agência"
              />
            </div>

            <div className="form-group col-4">
              <label htmlFor="camp-project-name" className="form-label">
                NOME DO PROJETO
              </label>
              <input
                type="text"
                id="camp-project-name"
                className="form-input"
                value={campaign.projectName}
                onChange={(e) => setCampaign({ ...campaign, projectName: e.target.value })}
                placeholder="Nome do Projeto / Campanha"
              />
            </div>

            {/* Linha 2: Período de Exibição à esquerda e Desconto Padrão à direita */}
            <div className="form-group col-8">
              <label className="form-label">PERÍODO DE EXIBIÇÃO</label>
              <div className="period-container">
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "600" }}>De:</span>
                  <input
                    type="date"
                    id="camp-start-date"
                    className="form-input font-mono"
                    value={campaign.startDate}
                    onChange={(e) => setCampaign({ ...campaign, startDate: e.target.value })}
                    style={{ maxWidth: "140px" }}
                  />
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "600", marginLeft: "6px" }}>Até:</span>
                  <input
                    type="date"
                    id="camp-end-date"
                    className="form-input font-mono"
                    value={campaign.endDate}
                    onChange={(e) => setCampaign({ ...campaign, endDate: e.target.value })}
                    style={{ maxWidth: "140px" }}
                  />
                </div>

                <div
                  className="period-boxes-group"
                  style={{
                    marginLeft: "24px",
                    paddingLeft: "24px",
                    borderLeft: "1.5px solid var(--border-card)"
                  }}
                >
                  {[
                    { id: "MENSAL", label: "Mensal" },
                    { id: "TRIMESTRAL", label: "Trimestral" },
                    { id: "SEMESTRAL", label: "Semestral" },
                    { id: "ANUAL", label: "Anual" },
                    { id: "LIVRE", label: "Período Livre" }
                  ].map((p) => (
                    <label
                      key={p.id}
                      className={`period-box-option ${campaign.periodPreset === p.id ? "active" : ""}`}
                    >
                      <input
                        type="checkbox"
                        name="period-preset"
                        checked={campaign.periodPreset === p.id}
                        onChange={() => {
                          const nextPreset = campaign.periodPreset === p.id ? null : p.id;
                          setCampaign({ ...campaign, periodPreset: nextPreset });
                        }}
                        className="period-preset-check"
                      />
                      <span>{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="form-group col-4">
              <label htmlFor="camp-default-discount" className="form-label">
                DESCONTO PADRÃO (%)
              </label>
              <input
                type="number"
                step="0.01"
                id="camp-default-discount"
                className="form-input font-mono"
                value={campaign.defaultDiscount}
                onChange={(e) => {
                  const val = Number(e.target.value) || 0;
                  setCampaign({ ...campaign, defaultDiscount: val });
                }}
                placeholder="70.00"
                style={{ maxWidth: "180px" }}
              />
            </div>
          </div>
        )}
      </section>

      {/* 2. Grade de Entregas Comerciais / Tabela */}
      <section className="table-card">
        <div className="table-toolbar">
          <div className="table-toolbar-title">
            <span>Programação de Mídia</span>
          </div>
          <div className="table-toolbar-right" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: "600",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                color: "var(--text-muted)"
              }}
            >
              MODO DE INSERÇÃO:
            </span>
            <div className="mode-pill-group" id="global-mode-selector">
              <button
                type="button"
                onClick={() => handleSwitchGlobalMode("TOTAL")}
                className={`mode-pill-btn ${campaign.globalInsertionMode === "TOTAL" ? "active" : ""}`}
              >
                Total
              </button>
              <button
                type="button"
                onClick={() => handleSwitchGlobalMode("FREQ")}
                className={`mode-pill-btn ${campaign.globalInsertionMode === "FREQ" ? "active" : ""}`}
              >
                Frequência
              </button>
              <button
                type="button"
                onClick={() => handleSwitchGlobalMode("CALENDAR")}
                className={`mode-pill-btn ${campaign.globalInsertionMode === "CALENDAR" ? "active" : ""}`}
              >
                Cronograma
              </button>
            </div>
            <button
              type="button"
              onClick={handleClearAllLines}
              id="btn-clear-all-lines"
              className="btn btn-secondary btn-sm"
              title="Limpar todas as linhas da programação"
            >
              <RotateCcw size={12} style={{ marginRight: "4px" }} />
              Limpar Linhas
            </button>
          </div>
        </div>

        <div className="table-scroll-container" style={{ overflowX: "auto", minHeight: "220px" }}>
          <table className="corporate-table">
            <thead id="table-head">
              <tr>
                <th className="center" style={{ width: "36px" }}>#</th>
                <th style={{ minWidth: "220px" }}>PRODUTO</th>
                <th style={{ minWidth: "140px" }}>PRAÇA</th>
                <th style={{ minWidth: "180px" }}>FORMATO</th>
                <th className="right" style={{ minWidth: "105px" }}>BASE 30"</th>
                <th className="center" style={{ minWidth: "70px" }}>COEF.</th>
                <th className="right" style={{ minWidth: "110px" }}>UNIT. TABELA</th>
                <th className="center" style={{ minWidth: "90px" }}>INS</th>
                <th className="right" style={{ minWidth: "125px" }}>ENTREGA DE MÍDIA</th>
                <th className="center" style={{ minWidth: "85px" }}>DESCONTO</th>
                <th className="right" style={{ minWidth: "125px" }}>INVESTIMENTO</th>
                <th className="right" style={{ minWidth: "120px" }}>UNIT. NEGOCIADO</th>
                <th className="center" style={{ width: "70px" }}>AÇÕES</th>
              </tr>
            </thead>
            <tbody id="table-body">
              {calculatedLines.map((line, idx) => {
                const c = line.calculo || {};
                return (
                  <tr key={line.id} className="row-item">
                    {/* 1. # */}
                    <td className="center" style={{ verticalAlign: "middle", color: "var(--text-muted)", fontWeight: "600" }}>
                      {idx + 1}
                    </td>

                    {/* 2. PRODUTO */}
                    <td>
                      <select
                        value={line.sigla}
                        onChange={(e) => updateLine(line.id, "sigla", e.target.value)}
                        className="form-input"
                        style={{ height: "34px", fontSize: "0.82rem", textTransform: "uppercase" }}
                      >
                        <option value="">DIGITE PARA BUSCAR PRODUTO...</option>
                        {(PROGRAMS_DATA || []).map((p) => (
                          <option key={p.sigla} value={p.sigla}>
                            {p.nome}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* 3. PRAÇA */}
                    <td>
                      <select
                        value={line.marketId}
                        onChange={(e) => updateLine(line.id, "marketId", e.target.value)}
                        className="form-input"
                        style={{ height: "34px", fontSize: "0.82rem" }}
                      >
                        {(REGIONAL_MARKETS || []).map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.nome}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* 4. FORMATO */}
                    <td>
                      <select
                        value={line.formatId}
                        onChange={(e) => updateLine(line.id, "formatId", e.target.value)}
                        className="form-input"
                        style={{ height: "34px", fontSize: "0.82rem" }}
                      >
                        {(MEDIA_FORMATS || []).map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.nome}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* 5. BASE 30" */}
                    <td className="right font-mono" style={{ verticalAlign: "middle", color: "var(--text-muted)" }}>
                      {c.basePrice30 > 0 ? formatCurrency(c.basePrice30) : "-"}
                    </td>

                    {/* 6. COEF. */}
                    <td className="center" style={{ verticalAlign: "middle" }}>
                      <input
                        type="number"
                        step="0.01"
                        value={line.customCoef !== null && line.customCoef !== undefined ? line.customCoef : (c.coef || 1.0)}
                        onChange={(e) => updateLine(line.id, "customCoef", e.target.value)}
                        className="input-mini-corporate font-mono"
                        style={{ width: "50px" }}
                      />
                    </td>

                    {/* 7. UNIT. TABELA */}
                    <td className="right font-mono" style={{ verticalAlign: "middle", fontWeight: "600", color: "var(--text-dark)" }}>
                      {c.valor > 0 ? formatCurrency(c.valor) : "-"}
                    </td>

                    {/* 8. INS */}
                    <td className="center" style={{ verticalAlign: "middle" }}>
                      {line.insertionMode === "FREQ" ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "4px", justifyContent: "center" }}>
                          <input
                            type="number"
                            min="1"
                            value={line.freqDias}
                            onChange={(e) => updateLine(line.id, "freqDias", e.target.value)}
                            placeholder="Dias"
                            className="input-mini-corporate font-mono"
                            style={{ width: "42px" }}
                          />
                          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>x</span>
                          <input
                            type="number"
                            min="1"
                            value={line.freqPorDia}
                            onChange={(e) => updateLine(line.id, "freqPorDia", e.target.value)}
                            placeholder="/dia"
                            className="input-mini-corporate font-mono"
                            style={{ width: "42px" }}
                          />
                        </div>
                      ) : (
                        <input
                          type="number"
                          min="0"
                          value={line.totalDirect}
                          onChange={(e) => updateLine(line.id, "totalDirect", e.target.value)}
                          placeholder="0"
                          className="input-mini-corporate font-mono"
                          style={{ width: "54px" }}
                        />
                      )}
                    </td>

                    {/* 9. ENTREGA DE MÍDIA */}
                    <td className="right font-mono" style={{ verticalAlign: "middle", fontWeight: "600", color: "var(--text-dark)" }}>
                      {c.totalBruto > 0 ? formatCurrency(c.totalBruto) : "-"}
                    </td>

                    {/* 10. DESCONTO */}
                    <td className="center" style={{ verticalAlign: "middle" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "2px" }}>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={line.discountPercent}
                          onChange={(e) => updateLine(line.id, "discountPercent", Number(e.target.value))}
                          className="input-mini-corporate font-mono"
                          style={{ width: "52px" }}
                        />
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>%</span>
                      </div>
                    </td>

                    {/* 11. INVESTIMENTO */}
                    <td className="right font-mono rose" style={{ verticalAlign: "middle", fontWeight: "700", color: "var(--rose-primary)" }}>
                      {c.totalLiquido > 0 ? formatCurrency(c.totalLiquido) : "-"}
                    </td>

                    {/* 12. UNIT. NEGOCIADO */}
                    <td className="right font-mono" style={{ verticalAlign: "middle", color: "var(--text-muted)" }}>
                      {c.unitarioLiquido > 0 ? formatCurrency(c.unitarioLiquido) : "-"}
                    </td>

                    {/* 13. AÇÕES */}
                    <td className="center" style={{ verticalAlign: "middle" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <button
                          type="button"
                          onClick={() => handleDuplicateLine(line.id)}
                          className="btn-icon"
                          title="Duplicar linha"
                        >
                          <Copy size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteLine(line.id)}
                          className="btn-icon danger"
                          title="Remover linha"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Barra Inferior da Tabela (Botões Nova Inserção e Salvar Campanha) */}
        <div className="table-bottom-bar" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            type="button"
            id="btn-add-line"
            onClick={handleAddLine}
            className="btn btn-primary"
          >
            Nova Inserção
          </button>
          <button
            type="button"
            id="btn-save-campaign"
            onClick={handleSaveCampaign}
            className="btn btn-secondary"
            style={{ fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "6px" }}
            title="Salvar programação de mídia no histórico do sistema"
          >
            <Save size={15} />
            Salvar Campanha
          </button>
        </div>
      </section>

      {/* 3. Resumo dos Totais (KPIs no Final da Página) */}
      <section className="kpi-grid">
        <div className="kpi-card">
          <span className="kpi-label">TOTAL DE INSERÇÕES</span>
          <div className="kpi-value font-mono" id="kpi-total-insertions">
            {totals.totalInsertions}
          </div>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">ENTREGA TOTAL DE MÍDIA</span>
          <div className="kpi-value font-mono" id="kpi-gross-value">
            {formatCurrency(totals.totalBruto)}
          </div>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">INVESTIMENTO</span>
          <div className="kpi-value font-mono rose" id="kpi-net-value">
            {formatCurrency(totals.totalLiquido)}
          </div>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">DESCONTO MÉDIO</span>
          <div className="kpi-value font-mono" id="kpi-avg-discount">
            {formatPercent(totals.averageDiscount)}
          </div>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">IMPACTOS ESTIMADOS</span>
          <div className="kpi-value font-mono" id="kpi-total-impacts">
            {totals.totalImpactos > 0 ? totals.totalImpactos.toLocaleString("pt-BR") : "0"}
          </div>
          <span className="kpi-sub">PNT com Projeção Brasil</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">CPM MÉDIO</span>
          <div className="kpi-value font-mono" id="kpi-cpm-medio">
            {formatCurrencyExact(totals.cpmMedio)}
          </div>
        </div>
      </section>

      {/* Modal: Consulta da Tabela de Preços */}
      {showTabelasModal && (
        <div className="modal-overlay" style={{ display: "flex" }}>
          <div className="modal-content" style={{ maxWidth: "860px", width: "95%", maxHeight: "85vh", display: "flex", flexDirection: "column" }}>
            <div className="modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "1.05rem", fontWeight: "700" }}>Tabela de Preços Oficial • Outubro/2026</h3>
              <button
                type="button"
                onClick={() => setShowTabelasModal(false)}
                className="btn-icon"
                style={{ color: "white" }}
              >
                ✕
              </button>
            </div>
            <div className="modal-body" style={{ overflowY: "auto", padding: "16px" }}>
              <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
                <input
                  type="text"
                  placeholder="Pesquisar programa..."
                  value={tabelaSearch}
                  onChange={(e) => setTabelaSearch(e.target.value)}
                  className="form-input"
                  style={{ flex: 1 }}
                />
                <select
                  value={tabelaMarket}
                  onChange={(e) => setTabelaMarket(e.target.value)}
                  className="form-input"
                  style={{ width: "200px" }}
                >
                  {(REGIONAL_MARKETS || []).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nome}
                    </option>
                  ))}
                </select>
              </div>

              <table className="corporate-table">
                <thead>
                  <tr>
                    <th>PROGRAMA</th>
                    <th>GÊNERO</th>
                    <th>DIAS</th>
                    <th>HORÁRIO</th>
                    <th className="right">BASE 30"</th>
                    <th className="center">AÇÃO</th>
                  </tr>
                </thead>
                <tbody>
                  {(PROGRAMS_DATA || [])
                    .filter((p) =>
                      tabelaSearch
                        ? p.nome.toLowerCase().includes(tabelaSearch.toLowerCase()) ||
                          p.sigla.toLowerCase().includes(tabelaSearch.toLowerCase())
                        : true
                    )
                    .map((prog) => {
                      const price = MediaCalculator.calculateUnitPrice(prog.sigla, tabelaMarket, "COMERCIAL_30");
                      return (
                        <tr key={prog.sigla} className="row-item">
                          <td style={{ fontWeight: "700" }}>{prog.nome}</td>
                          <td>
                            <span className="badge-tag">{prog.genero}</span>
                          </td>
                          <td>{prog.diasDesc || "Seg/Sex"}</td>
                          <td className="font-mono">{prog.inicio} às {prog.fim}</td>
                          <td className="right font-mono font-bold">{formatCurrencyExact(price?.valor)}</td>
                          <td className="center">
                            <button
                              type="button"
                              onClick={() => {
                                setLines((prev) => [
                                  ...prev,
                                  {
                                    id: `line-${Date.now()}`,
                                    sigla: prog.sigla,
                                    marketId: tabelaMarket,
                                    formatId: "COMERCIAL_30",
                                    customCoef: null,
                                    insertionMode: campaign.globalInsertionMode,
                                    totalDirect: 10,
                                    freqDias: "",
                                    freqPorDia: "",
                                    discountPercent: campaign.defaultDiscount
                                  }
                                ]);
                                setShowTabelasModal(false);
                                showToast(`"${prog.nome}" adicionado à programação!`);
                              }}
                              className="btn btn-secondary btn-sm"
                            >
                              + Incluir
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Histórico de Campanhas */}
      {showHistoricoModal && (
        <div className="modal-overlay" style={{ display: "flex" }}>
          <div className="modal-content" style={{ maxWidth: "700px", width: "95%", maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
            <div className="modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "1.05rem", fontWeight: "700" }}>Histórico de Campanhas Salvas</h3>
              <button
                type="button"
                onClick={() => setShowHistoricoModal(false)}
                className="btn-icon"
                style={{ color: "white" }}
              >
                ✕
              </button>
            </div>
            <div className="modal-body" style={{ overflowY: "auto", padding: "16px" }}>
              {savedProposals.length === 0 ? (
                <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "30px 0" }}>
                  Nenhuma campanha salva no histórico ainda.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {savedProposals.map((prop) => (
                    <div
                      key={prop.id}
                      style={{
                        padding: "12px 16px",
                        border: "1px solid var(--border-card)",
                        borderRadius: "8px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: "0.9rem", color: "var(--text-dark)" }}>
                          {prop.projectName || prop.client}
                        </strong>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          Cliente: {prop.client} | Agência: {prop.agency} | Salvo em {prop.date}
                        </div>
                        <div style={{ fontSize: "0.8rem", marginTop: "4px" }}>
                          Total: <strong>{prop.totalInsertions} spots</strong> | Investimento:{" "}
                          <strong style={{ color: "var(--rose-primary)" }}>
                            {formatCurrency(prop.totalNet)}
                          </strong>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          type="button"
                          onClick={() => handleLoadProposal(prop)}
                          className="btn btn-primary btn-sm"
                        >
                          Carregar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSavedProposal(prop.id)}
                          className="btn btn-secondary btn-sm"
                          style={{ color: "var(--rose-primary)" }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

class MediaPlannerErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Erro capturado no MediaPlannerTab:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-white border border-rose-200 rounded-2xl p-8 max-w-xl mx-auto my-12 text-center shadow-lg">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={28} />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-2">Erro ao carregar o Planejador de Mídia</h3>
          <p className="text-xs text-slate-500 mb-4 font-mono bg-slate-50 p-3 rounded-lg border border-slate-200 text-left overflow-x-auto">
            {this.state.error?.toString()}
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold"
          >
            Tentar Novamente
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function MediaPlannerTab(props) {
  return (
    <MediaPlannerErrorBoundary>
      <MediaPlannerTabContent {...props} />
    </MediaPlannerErrorBoundary>
  );
}
