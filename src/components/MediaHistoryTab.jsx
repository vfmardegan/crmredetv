// src/components/MediaHistoryTab.jsx
import React, { useState, useEffect } from "react";
import {
  History,
  Search,
  Plus,
  Trash2,
  ExternalLink,
  RotateCcw,
  Building2,
  FileText
} from "lucide-react";
import "../modules/mediaPlanner/mediaPlanner.css";

function formatCurrency(val) {
  if (val === null || val === undefined || isNaN(val) || val === "") return "R$ 0";
  return "R$ " + Math.round(Number(val)).toLocaleString("pt-BR");
}

export default function MediaHistoryTab({ setView }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [proposals, setProposals] = useState([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("redetv_media_proposals_history");
      if (stored) {
        setProposals(JSON.parse(stored));
      }
    } catch (e) {
      console.warn("Erro ao ler historico:", e);
    }
  }, []);

  function handleDelete(id) {
    if (!window.confirm("Deseja realmente remover esta proposta do histórico?")) return;
    const next = proposals.filter((p) => p.id !== id);
    setProposals(next);
    try {
      localStorage.setItem("redetv_media_proposals_history", JSON.stringify(next));
    } catch (e) {}
  }

  function handleLoad(prop) {
    try {
      localStorage.setItem("redetv_load_proposal", JSON.stringify(prop));
      if (setView) {
        setView("mediaPlanner");
      }
    } catch (e) {
      console.error(e);
    }
  }

  const filtered = proposals.filter((p) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      (p.projectName || "").toLowerCase().includes(q) ||
      (p.client || "").toLowerCase().includes(q) ||
      (p.agency || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="media-planner-scope space-y-5 animate-fadeIn pb-16">
      {/* Topbar */}
      <header className="topbar rounded-xl shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <History size={18} />
          </div>
          <div className="topbar-title font-bold text-slate-900">
            Histórico de Propostas Comerciais
          </div>
        </div>

        {setView && (
          <button
            type="button"
            onClick={() => setView("mediaPlanner")}
            className="btn btn-primary btn-sm"
          >
            <Plus size={14} style={{ marginRight: "4px" }} />
            Nova Proposta (Valoração Online)
          </button>
        )}
      </header>

      {/* Tabela de Histórico */}
      <section className="table-card">
        <div className="table-toolbar">
          <div style={{ flex: 1, maxWidth: "380px" }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              placeholder="BUSCAR POR CLIENTE, PROJETO OU AGÊNCIA..."
              style={{ height: "36px", fontSize: "12px", textTransform: "uppercase" }}
            />
          </div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            Total: <strong>{filtered.length}</strong> propostas registradas
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
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                    {searchTerm ? "Nenhuma proposta encontrada para o filtro informado." : "Nenhuma proposta salva no histórico ainda."}
                  </td>
                </tr>
              ) : (
                filtered.map((prop, idx) => (
                  <tr key={prop.id} className="row-item">
                    <td className="center" style={{ verticalAlign: "middle", color: "var(--text-muted)", fontWeight: "600" }}>
                      {idx + 1}
                    </td>
                    <td style={{ verticalAlign: "middle" }}>
                      <strong style={{ color: "var(--text-dark)", fontSize: "0.85rem" }}>
                        {prop.projectName || "Sem nome de projeto"}
                      </strong>
                    </td>
                    <td style={{ verticalAlign: "middle", color: "var(--text-body)" }}>
                      {prop.client || "-"}
                    </td>
                    <td style={{ verticalAlign: "middle", color: "var(--text-muted)" }}>
                      {prop.agency || "-"}
                    </td>
                    <td className="center font-mono" style={{ verticalAlign: "middle", color: "var(--text-muted)", fontSize: "11px" }}>
                      {prop.date || "-"}
                    </td>
                    <td className="center font-mono" style={{ verticalAlign: "middle", fontWeight: "700" }}>
                      {prop.totalInsertions || 0} spots
                    </td>
                    <td className="right font-mono" style={{ verticalAlign: "middle", fontWeight: "700", color: "var(--rose-primary)" }}>
                      {formatCurrency(prop.totalNet || prop.totalLiquido)}
                    </td>
                    <td className="center" style={{ verticalAlign: "middle" }}>
                      <div style={{ display: "inline-flex", gap: "6px" }}>
                        <button
                          type="button"
                          onClick={() => handleLoad(prop)}
                          className="btn btn-secondary btn-sm"
                          title="Abrir no Valoração Online"
                        >
                          Carregar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(prop.id)}
                          className="btn-icon danger"
                          title="Remover do histórico"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
