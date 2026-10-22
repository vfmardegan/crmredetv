// src/components/MidiasFormatosTab.jsx
import React, { useState } from "react";
import {
  Layers,
  Table as TableIcon,
  BarChart2,
  Search,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import "../modules/mediaPlanner/mediaPlanner.css";
import {
  PROGRAMS_DATA,
  REGIONAL_MARKETS,
  MEDIA_FORMATS
} from "../modules/mediaPlanner/rateCard";
import { MediaCalculator } from "../modules/mediaPlanner/calculator";

function formatCurrency(val) {
  if (val === null || val === undefined || isNaN(val) || val === "") return "R$ 0,00";
  return Number(val).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function MidiasFormatosTab() {
  const [activeTab, setActiveTab] = useState("tabelas"); // "tabelas" | "formatos" | "impactos"
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMarket, setSelectedMarket] = useState("NACIONAL");

  return (
    <div className="media-planner-scope space-y-5 animate-fadeIn pb-16">
      {/* Topbar */}
      <header className="topbar rounded-xl shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <Layers size={18} />
          </div>
          <div>
            <div className="topbar-title font-bold text-slate-900 leading-none">
              Mídias e Formatos • Administração
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "3px" }}>
              Tabelas Oficiais, Matriz de Formatos e Índices de Audiência (Outubro/2026)
            </div>
          </div>
        </div>

        {/* Sub-navegação */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab("tabelas")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              activeTab === "tabelas"
                ? "bg-white text-rose-600 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Tabelas de Preço
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("formatos")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              activeTab === "formatos"
                ? "bg-white text-rose-600 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Formatos & Coeficientes
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("impactos")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              activeTab === "impactos"
                ? "bg-white text-rose-600 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Impactos por Programa
          </button>
        </div>
      </header>

      {/* 1. TABELA DE PREÇOS */}
      {activeTab === "tabelas" && (
        <section className="table-card">
          <div className="table-toolbar">
            <div style={{ flex: 1, maxWidth: "340px" }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input"
                placeholder="PESQUISAR PROGRAMA..."
                style={{ height: "36px", fontSize: "12px", textTransform: "uppercase" }}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", textTransform: "uppercase" }}>
                Praça:
              </span>
              <select
                value={selectedMarket}
                onChange={(e) => setSelectedMarket(e.target.value)}
                className="form-input"
                style={{ height: "36px", width: "220px", fontSize: "12px" }}
              >
                {(REGIONAL_MARKETS || []).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome} ({m.emissora || m.regiao})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="corporate-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>PROGRAMA</th>
                  <th>GÊNERO</th>
                  <th>DIAS</th>
                  <th>HORÁRIO</th>
                  <th className="right">BASE 30" (TABELA)</th>
                </tr>
              </thead>
              <tbody>
                {(PROGRAMS_DATA || [])
                  .filter((p) =>
                    searchQuery
                      ? (p.nome || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (p.sigla || "").toLowerCase().includes(searchQuery.toLowerCase())
                      : true
                  )
                  .map((prog) => {
                    const price = MediaCalculator.calculateUnitPrice(prog.sigla, selectedMarket, "COMERCIAL_30");
                    return (
                      <tr key={prog.sigla} className="row-item">
                        <td style={{ fontWeight: "700", verticalAlign: "middle" }}>
                          {prog.nome}
                          <span style={{ fontSize: "10px", color: "var(--text-muted)", marginLeft: "8px" }}>
                            ({prog.sigla})
                          </span>
                        </td>
                        <td style={{ verticalAlign: "middle" }}>
                          <span className="badge-tag">{prog.genero}</span>
                        </td>
                        <td style={{ verticalAlign: "middle", color: "var(--text-body)" }}>
                          {prog.diasDesc || "Seg a Sex"}
                        </td>
                        <td className="font-mono" style={{ verticalAlign: "middle", color: "var(--text-muted)" }}>
                          {prog.inicio ? `${prog.inicio} às ${prog.fim}` : "-"}
                        </td>
                        <td className="right font-mono" style={{ verticalAlign: "middle", fontWeight: "700", color: "var(--text-dark)" }}>
                          {formatCurrency(price?.valor)}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 2. FORMATOS & COEFICIENTES */}
      {activeTab === "formatos" && (
        <section className="table-card">
          <div className="table-toolbar">
            <div style={{ flex: 1, maxWidth: "340px" }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input"
                placeholder="PESQUISAR FORMATO..."
                style={{ height: "36px", fontSize: "12px", textTransform: "uppercase" }}
              />
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Total: <strong>{MEDIA_FORMATS.length}</strong> formatos comerciais homologados
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="corporate-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>CÓDIGO FORMATO</th>
                  <th>NOME COMERCIAL</th>
                  <th className="center">FATOR MULTIPLICADOR</th>
                  <th>DESCRIÇÃO / APLICAÇÃO</th>
                </tr>
              </thead>
              <tbody>
                {(MEDIA_FORMATS || [])
                  .filter((f) =>
                    searchQuery
                      ? (f.nome || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (f.id || "").toLowerCase().includes(searchQuery.toLowerCase())
                      : true
                  )
                  .map((fmt) => (
                    <tr key={fmt.id} className="row-item">
                      <td className="font-mono" style={{ verticalAlign: "middle", fontWeight: "600", fontSize: "11px", color: "var(--text-muted)" }}>
                        {fmt.id}
                      </td>
                      <td style={{ verticalAlign: "middle", fontWeight: "700" }}>
                        {fmt.nome}
                      </td>
                      <td className="center font-mono" style={{ verticalAlign: "middle", fontWeight: "700", color: "var(--rose-primary)" }}>
                        {fmt.defaultCoef}x
                      </td>
                      <td style={{ verticalAlign: "middle", color: "var(--text-body)", fontSize: "0.82rem" }}>
                        {fmt.descricao || "Formato comercial padrão homologado pela Diretoria Comercial RedeTV!."}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 3. IMPACTOS POR PROGRAMA */}
      {activeTab === "impactos" && (
        <section className="table-card">
          <div className="table-toolbar">
            <div style={{ flex: 1, maxWidth: "340px" }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input"
                placeholder="PESQUISAR PROGRAMA..."
                style={{ height: "36px", fontSize: "12px", textTransform: "uppercase" }}
              />
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Base: <strong>PNT com Projeção Brasil (Kantar IBOPE Media)</strong>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="corporate-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>PROGRAMA</th>
                  <th>FAIXA / HORÁRIO</th>
                  <th className="right">RAT DOMICILIAR (%)</th>
                  <th className="right">SHARE (%)</th>
                  <th className="right">IMPACTOS ESTIMADOS / SPOT</th>
                </tr>
              </thead>
              <tbody>
                {(PROGRAMS_DATA || [])
                  .filter((p) =>
                    searchQuery
                      ? (p.nome || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (p.sigla || "").toLowerCase().includes(searchQuery.toLowerCase())
                      : true
                  )
                  .map((prog) => {
                    const aud = prog.audiencia?.nacional || { ratDom: 0.6, share: 1.5 };
                    const impactos = Math.round((aud.ratDom || 0.6) * 190000);
                    return (
                      <tr key={prog.sigla} className="row-item">
                        <td style={{ fontWeight: "700", verticalAlign: "middle" }}>
                          {prog.nome}
                        </td>
                        <td className="font-mono" style={{ verticalAlign: "middle", color: "var(--text-muted)" }}>
                          {prog.inicio ? `${prog.inicio} às ${prog.fim}` : "-"}
                        </td>
                        <td className="right font-mono" style={{ verticalAlign: "middle", fontWeight: "700" }}>
                          {aud.ratDom}%
                        </td>
                        <td className="right font-mono" style={{ verticalAlign: "middle", color: "var(--text-muted)" }}>
                          {aud.share}%
                        </td>
                        <td className="right font-mono" style={{ verticalAlign: "middle", fontWeight: "700", color: "var(--emerald-text)" }}>
                          {impactos.toLocaleString("pt-BR")} pessoas
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
