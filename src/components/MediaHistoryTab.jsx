// src/components/MediaHistoryTab.jsx
import React, { useState, useEffect } from "react";
import { Plus, RotateCcw } from "lucide-react";
import "../modules/mediaPlanner/mediaPlanner.css";
import { MediaCalculator } from "../modules/mediaPlanner/calculator";

function formatBRL(val) {
  if (val === null || val === undefined || isNaN(val) || val === "") return "R$ 0,00";
  return Number(val).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function MediaHistoryTab({ setView }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [historyList, setHistoryList] = useState([]);

  // Propostas de exemplo padrão de historico.html
  const demoProposals = [
    {
      id: "PROP-2026-001",
      projectName: "CAMPANHA NACIONAL VAREJO 2026",
      client: "GRUPO VAREJO BRASIL",
      agency: "AGÊNCIA NACIONAL DE MÍDIA",
      date: "21/10/2026",
      totalInsertions: 48,
      totalNet: 489200,
      tableVersion: "Outubro/2026",
      campaignData: {
        campaign: {
          client: "GRUPO VAREJO BRASIL",
          agency: "AGÊNCIA NACIONAL DE MÍDIA",
          projectName: "CAMPANHA NACIONAL VAREJO 2026",
          startDate: "2026-10-01",
          endDate: "2026-10-31",
          defaultDiscount: 70.0
        },
        lines: [
          { sigla: "TARD", marketId: "NACIONAL", formatId: "COMERCIAL_30", totalDirect: 24, discountPercent: 70 },
          { sigla: "NEWS", marketId: "NACIONAL", formatId: "COMERCIAL_30", totalDirect: 24, discountPercent: 70 }
        ]
      }
    },
    {
      id: "PROP-2026-002",
      projectName: "PATROCÍNIO SUPERPOP & SENSACIONAL",
      client: "COSMÉTICOS BELA COR",
      agency: "DDB BRASIL",
      date: "18/10/2026",
      totalInsertions: 24,
      totalNet: 312500,
      tableVersion: "Outubro/2026",
      campaignData: {
        campaign: {
          client: "COSMÉTICOS BELA COR",
          agency: "DDB BRASIL",
          projectName: "PATROCÍNIO SUPERPOP & SENSACIONAL",
          startDate: "2026-10-01",
          endDate: "2026-10-31",
          defaultDiscount: 70.0
        },
        lines: [
          { sigla: "SPOP", marketId: "NACIONAL", formatId: "COMERCIAL_30", totalDirect: 12, discountPercent: 70 },
          { sigla: "SENS", marketId: "NACIONAL", formatId: "COMERCIAL_30", totalDirect: 12, discountPercent: 70 }
        ]
      }
    },
    {
      id: "PROP-2026-003",
      projectName: "JORNALISMO PRIME TIME",
      client: "BANCO INVEST DIGITAL",
      agency: "AFRICA CREATIVE",
      date: "15/10/2026",
      totalInsertions: 30,
      totalNet: 645000,
      tableVersion: "Outubro/2026",
      campaignData: {
        campaign: {
          client: "BANCO INVEST DIGITAL",
          agency: "AFRICA CREATIVE",
          projectName: "JORNALISMO PRIME TIME",
          startDate: "2026-10-01",
          endDate: "2026-10-31",
          defaultDiscount: 70.0
        },
        lines: [
          { sigla: "NEWS", marketId: "NACIONAL", formatId: "COMERCIAL_30", totalDirect: 15, discountPercent: 70 },
          { sigla: "BPOV", marketId: "NACIONAL", formatId: "COMERCIAL_30", totalDirect: 15, discountPercent: 70 }
        ]
      }
    }
  ];

  useEffect(() => {
    let savedList = [];
    try {
      const s1 = localStorage.getItem("redetv_saved_proposals");
      const s2 = localStorage.getItem("redetv_media_proposals_history");
      if (s1) {
        savedList = JSON.parse(s1);
      } else if (s2) {
        savedList = JSON.parse(s2);
      }
    } catch (e) {}

    if (Array.isArray(savedList) && savedList.length > 0) {
      setHistoryList(savedList);
    } else {
      setHistoryList(demoProposals);
    }
  }, []);

  function handleOpenProposal(item) {
    if (item && item.campaignData) {
      localStorage.setItem("redetv_load_proposal", JSON.stringify(item.campaignData));
    } else if (item) {
      localStorage.setItem(
        "redetv_load_proposal",
        JSON.stringify({
          campaign: {
            client: item.client || "",
            agency: item.agency || "",
            projectName: item.projectName || "",
            startDate: item.campaign?.startDate || "",
            endDate: item.campaign?.endDate || "",
            defaultDiscount: item.campaign?.defaultDiscount || 70.0
          },
          lines: item.lines || [
            { sigla: "FGEN", marketId: "NACIONAL", formatId: "COMERCIAL_30", totalDirect: Math.round((item.totalInsertions || 10) / 2), discountPercent: 70 },
            { sigla: "TARD", marketId: "NACIONAL", formatId: "COMERCIAL_30", totalDirect: Math.round((item.totalInsertions || 10) / 2), discountPercent: 70 }
          ]
        })
      );
    }
    if (setView) {
      setView("mediaPlanner");
    }
  }

  const clean = searchTerm.toLowerCase().trim();
  const list = historyList.filter((item) => {
    if (!clean) return true;
    return (
      (item.projectName || "").toLowerCase().includes(clean) ||
      (item.client || "").toLowerCase().includes(clean) ||
      (item.agency || "").toLowerCase().includes(clean) ||
      (item.id || "").toLowerCase().includes(clean)
    );
  });

  return (
    <div className="media-planner-scope space-y-5 animate-fadeIn pb-16">
      {/* Topbar Fiel a historico.html */}
      <header className="topbar rounded-xl shadow-2xs">
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div className="topbar-title font-bold text-slate-900">
            Histórico de Propostas Comerciais
          </div>
        </div>

        <div className="topbar-actions">
          {setView && (
            <button
              type="button"
              onClick={() => setView("mediaPlanner")}
              className="btn btn-primary btn-sm"
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <span>+</span> Nova Proposta
            </button>
          )}
        </div>
      </header>

      {/* Tabela de Histórico Fiel a historico.html */}
      <main className="content-container" style={{ padding: 0 }}>
        <section className="table-card">
          <div className="table-toolbar">
            <div style={{ flex: 1, maxWidth: "380px" }}>
              <input
                type="text"
                id="input-search-history"
                className="form-input"
                placeholder="BUSCAR POR CLIENTE, PROJETO OU AGÊNCIA..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ height: "36px", fontSize: "12.5px", textTransform: "uppercase" }}
              />
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Total: <strong>{historyList.length}</strong> propostas registradas
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="corporate-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th className="center" style={{ width: "44px" }}>#</th>
                  <th style={{ minWidth: "220px" }}>PROJETO / CAMPANHA</th>
                  <th style={{ minWidth: "160px" }}>CLIENTE</th>
                  <th style={{ minWidth: "160px" }}>AGÊNCIA</th>
                  <th className="center" style={{ minWidth: "120px" }}>DATA / CICLO</th>
                  <th className="center" style={{ minWidth: "90px" }}>INSERÇÕES</th>
                  <th className="right" style={{ minWidth: "140px" }}>INVESTIMENTO LÍQUIDO</th>
                  <th className="center" style={{ width: "140px" }}>AÇÕES</th>
                </tr>
              </thead>
              <tbody id="tbody-history">
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="center" style={{ padding: "30px", color: "var(--text-muted)", textAlign: "center" }}>
                      Nenhuma proposta encontrada.
                    </td>
                  </tr>
                ) : (
                  list.map((item, idx) => (
                    <tr key={item.id} className="row-item">
                      <td className="center font-mono font-semibold" style={{ color: "var(--text-muted)", verticalAlign: "middle" }}>
                        {idx + 1}
                      </td>
                      <td style={{ verticalAlign: "middle" }}>
                        <div style={{ fontWeight: "700", color: "var(--text-dark)" }}>{item.projectName}</div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{item.id}</div>
                      </td>
                      <td style={{ fontWeight: "600", verticalAlign: "middle" }}>{item.client}</td>
                      <td style={{ color: "var(--text-muted)", verticalAlign: "middle" }}>{item.agency}</td>
                      <td className="center font-mono" style={{ fontSize: "12px", verticalAlign: "middle" }}>{item.date}</td>
                      <td className="center font-mono font-bold" style={{ color: "var(--text-dark)", verticalAlign: "middle" }}>
                        {item.totalInsertions}
                      </td>
                      <td className="right font-mono font-bold" style={{ color: "var(--rose-primary)", fontSize: "13.5px", verticalAlign: "middle" }}>
                        {formatBRL(item.totalNet || item.totalLiquido)}
                      </td>
                      <td className="center" style={{ verticalAlign: "middle" }}>
                        <button
                          type="button"
                          onClick={() => handleOpenProposal(item)}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: "11px", padding: "4px 10px", cursor: "pointer" }}
                        >
                          Abrir Grade
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
