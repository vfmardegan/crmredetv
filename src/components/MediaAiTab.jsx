// src/components/MediaAiTab.jsx
import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  Bot,
  Building2,
  Briefcase
} from "lucide-react";
import "../modules/mediaPlanner/mediaPlanner.css";
import "../modules/mediaPlanner/geminiService";

export default function MediaAiTab({ setView, prefillCampaign }) {
  const [contextData, setContextData] = useState(() => {
    if (prefillCampaign) return prefillCampaign;
    try {
      const stored = localStorage.getItem("redetv_media_ai_prefill");
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return null;
  });

  const [promptText, setPromptText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generatedPlan, setGeneratedPlan] = useState(null);

  useEffect(() => {
    let ctx = prefillCampaign;
    if (!ctx) {
      try {
        const stored = localStorage.getItem("redetv_media_ai_prefill");
        if (stored) ctx = JSON.parse(stored);
      } catch (e) {}
    }
    if (ctx) {
      setContextData(ctx);
      setPromptText((prev) => {
        if (prev.trim()) return prev;
        const cName = ctx.client || "Cliente";
        const aPart = ctx.agency ? ` (Agência: ${ctx.agency})` : "";
        const pPart = ctx.projectName ? ` para a oportunidade "${ctx.projectName}"` : "";
        return `Plano de mídia comercial para ${cName}${aPart}${pPart}: veiculação no mês vigente com 70% de desconto padrão nos principais programas da grade.`;
      });
    }
  }, [prefillCampaign]);

  const examplePrompts = [
    "Campanha Black Friday no mês de Novembro: 10 inserções no TV Fama e A Tarde é Sua na praça São Paulo com 70% de desconto.",
    "Proposta para cliente do segmento automotivo: veiculação no Bola na Rede e RedeTV! News com 20 inserções no total (Nacional).",
    "Campanha de final de ano: 2 spots por dia no SuperPop e Sensacional durante o mês de Dezembro."
  ];

  async function handleGeneratePlan() {
    if (!promptText.trim()) {
      setError("Por favor, digite as instruções da campanha para a IA.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (!window.GeminiService) {
        throw new Error("Serviço GeminiService não inicializado.");
      }
      const plan = await window.GeminiService.plan(promptText.trim());
      // Injeta cliente, agência e projeto do contexto se existirem
      if (contextData) {
        if (!plan.client && contextData.client) plan.client = contextData.client;
        if (!plan.agency && contextData.agency) plan.agency = contextData.agency;
        if (!plan.projectName && contextData.projectName) plan.projectName = contextData.projectName;
      }
      setGeneratedPlan(plan);
    } catch (err) {
      console.error(err);
      setError(
        err.message?.includes("API_KEY") || err.message?.includes("key")
          ? "Chave da Gemini API não configurada no ambiente. Adicione VITE_GEMINI_API_KEY no arquivo .env."
          : `Falha na geração do plano de mídia: ${err.message}`
      );
    } finally {
      setLoading(false);
    }
  }

  function handleApplyToPlanner() {
    if (!generatedPlan) return;
    try {
      const planToApply = {
        ...generatedPlan,
        client: generatedPlan.client || contextData?.client || "",
        agency: generatedPlan.agency || contextData?.agency || "",
        projectName: generatedPlan.projectName || contextData?.projectName || ""
      };

      localStorage.setItem("redetv_pending_ai_plan", JSON.stringify(planToApply));
      if (contextData) {
        localStorage.setItem("redetv_prefill_campaign", JSON.stringify({
          client: planToApply.client,
          agency: planToApply.agency,
          projectName: planToApply.projectName,
          opportunityId: contextData.opportunityId
        }));
      }

      if (setView) {
        setView("mediaPlanner");
      }
    } catch (e) {
      console.error("Erro ao aplicar plano no Valoração Online:", e);
    }
  }

  return (
    <div className="media-planner-scope space-y-5 animate-fadeIn pb-16">
      {/* Topbar */}
      <header className="topbar rounded-xl shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <Bot size={18} />
          </div>
          <div className="topbar-title font-bold text-slate-900">
            Med.IA Planner — Inteligência Artificial Generativa de Mídia
          </div>
        </div>

        {setView && (
          <button
            type="button"
            onClick={() => setView("mediaPlanner")}
            className="btn btn-secondary btn-sm"
          >
            ← Ir para Valoração Online
          </button>
        )}
      </header>

      {/* Contexto Vinculado da Oportunidade */}
      {contextData && (contextData.client || contextData.projectName) && (
        <div className="card-box" style={{ background: "#FFF1F2", border: "1px solid #FECDD3" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "26px", height: "26px", borderRadius: "6px", background: "#E11D48", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Sparkles size={14} />
              </div>
              <div>
                <div style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "#9F1239" }}>
                  Oportunidade Vinculada do Pipeline
                </div>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#881337", marginTop: "1px" }}>
                  {contextData.projectName || "Projeto"}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "12px", color: "#475569" }}>
              {contextData.client && (
                <span><strong>Cliente:</strong> {contextData.client}</span>
              )}
              {contextData.agency && (
                <span><strong>Agência:</strong> {contextData.agency}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hero Card Informativo */}
      <div className="card-box" style={{ background: "#F8FAFC" }}>
        <p style={{ fontSize: "0.85rem", color: "#475569", lineHeight: "1.6", margin: 0 }}>
          Descreva os objetivos comerciais, programas, formatos desejados e períodos em linguagem natural. A <strong>Med.IA</strong> analisa a tabela de preços oficial de Outubro/2026, valida as regras de exibição da RedeTV! e monta uma proposta pronta para você revisar e aplicar.
        </p>
      </div>

      {/* Input Section */}
      <section className="card-box">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <label style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Instruções para o Planejador IA
          </label>
          <button
            type="button"
            onClick={() => setPromptText(examplePrompts[0])}
            style={{ fontSize: "11px", fontWeight: "600", color: "var(--rose-primary)", background: "transparent", border: "none", cursor: "pointer" }}
          >
            Preencher com Exemplo
          </button>
        </div>

        <textarea
          rows={4}
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          placeholder="Exemplo: Preciso de uma proposta comercial para uma marca de varejo. Período de 15 a 30 de Novembro. Programas: A Tarde é Sua (30 segundos) e TV Fama (30 segundos), praça São Paulo. Quero 10 inserções em cada um com 70% de desconto."
          className="form-input"
          style={{ height: "auto", minHeight: "100px", padding: "12px", resize: "vertical", fontSize: "0.85rem", lineHeight: "1.5" }}
        />

        {/* Prompt Chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "12px" }}>
          {examplePrompts.map((ex, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPromptText(ex)}
              className="btn-prompt-chip"
            >
              💡 Exemplo {i + 1}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ marginTop: "14px", padding: "10px 14px", background: "#FEF2F2", border: "1px solid #FECDD3", borderRadius: "8px", color: "#BE123C", fontSize: "0.82rem", display: "flex", alignItems: "center", gap: "8px" }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <button
            type="button"
            onClick={() => { setPromptText(""); setGeneratedPlan(null); setError(""); }}
            className="btn btn-secondary btn-sm"
          >
            <RotateCcw size={13} style={{ marginRight: "4px" }} />
            Limpar
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleGeneratePlan}
            className="btn btn-primary"
            style={{ minWidth: "180px" }}
          >
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" style={{ marginRight: "6px" }} />
                Gerando Plano...
              </>
            ) : (
              <>
                <Sparkles size={15} style={{ marginRight: "6px" }} />
                Gerar Plano de Mídia
              </>
            )}
          </button>
        </div>
      </section>

      {/* Resultado da IA */}
      {generatedPlan && (
        <section className="card-box animate-fadeIn">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid var(--border-card)" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <CheckCircle2 size={18} style={{ color: "var(--emerald-text)" }} />
                <h3 style={{ fontSize: "1rem", fontWeight: "700", color: "var(--text-dark)", margin: 0 }}>
                  Plano Gerado com Sucesso pela Med.IA
                </h3>
              </div>
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "4px", margin: 0 }}>
                Projeto: <strong>{generatedPlan.projectName || "Campanha Personalizada"}</strong> | Período:{" "}
                <strong>{generatedPlan.period?.periodLabel || "Definido pela IA"}</strong>
              </p>
            </div>

            <button
              type="button"
              onClick={handleApplyToPlanner}
              className="btn btn-primary"
            >
              Aplicar no Valoração Online
              <ArrowRight size={15} style={{ marginLeft: "6px" }} />
            </button>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="corporate-table">
              <thead>
                <tr>
                  <th>PROGRAMA</th>
                  <th>FORMATO</th>
                  <th className="center">FREQ. DIÁRIA</th>
                  <th className="center">TOTAL INSERÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {(generatedPlan.items || []).map((it, idx) => (
                  <tr key={idx} className="row-item">
                    <td style={{ fontWeight: "700" }}>{it.program}</td>
                    <td>{it.format}</td>
                    <td className="center">{it.dailyFrequency || "-"}</td>
                    <td className="center" style={{ fontWeight: "700" }}>{it.totalInsertions || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
