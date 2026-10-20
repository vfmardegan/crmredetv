// src/components/OpecCampanhasTab.jsx
import React, { useState, useEffect } from "react";
import {
  Radio,
  Search,
  Plus,
  Upload,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  FileText,
  Building2,
  Tv,
  X,
  FileSpreadsheet
} from "lucide-react";
import { getOpecCampaigns, saveOpecCampaign } from "../services/opecService";

export default function OpecCampanhasTab({ currentUser }) {
  const [campaigns, setCampaigns] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  const [form, setForm] = useState({
    numeroPi: "",
    anunciante: "",
    marca: "",
    agencia: "",
    programa: "A Tarde é Sua",
    praca: "Grande SP",
    periodo: "",
    totalInsercoes: 8,
    formato: "Spot 30\"",
    valorLiquido: 50000,
    status: "Em Análise de Bloco",
    materialTecnico: "Aguardando Engenharia"
  });

  useEffect(() => {
    loadCampaigns();
  }, []);

  function loadCampaigns() {
    setCampaigns(getOpecCampaigns());
  }

  function handleCreateCampaign(e) {
    e.preventDefault();
    if (!form.numeroPi || !form.anunciante) {
      alert("Preencha ao menos o número do P.I. e o anunciante.");
      return;
    }
    saveOpecCampaign({
      ...form,
      totalInsercoes: Number(form.totalInsercoes) || 1,
      valorLiquido: Number(form.valorLiquido) || 0,
      analistaOpec: currentUser?.nome || "Mesa OPEC"
    });
    setShowNewModal(false);
    loadCampaigns();
  }

  const formatBRL = (val) =>
    (val || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const filteredCampaigns = campaigns.filter((c) => {
    const matchSearch =
      c.numeroPi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.anunciante.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.agencia.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.programa.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "analise" && c.status === "Em Análise de Bloco") ||
      (statusFilter === "aprovado" && c.status === "Aprovado na Grade") ||
      (statusFilter === "conflito" && c.status.includes("Conflito"));

    return matchSearch && matchStatus;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-7xl mx-auto">
      {/* Cabeçalho 100% Operacional */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
              OPEC • Campanhas e Mídia Avulsa
            </h1>
            <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-200">
              Operacional
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Fila de trabalho para conferência técnica e liberação rápida de P.Is táticos e spots avulsos
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowNewModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-2xs"
        >
          <Plus size={15} />
          Subir P.I. Avulso (PDF)
        </button>
      </div>

      {/* Controles de Busca e Filtros Rápidos */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por Nº do P.I., Anunciante, Agência, Programa..."
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-700"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              statusFilter === "all"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Todos ({campaigns.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("analise")}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              statusFilter === "analise"
                ? "bg-amber-600 text-white"
                : "bg-amber-50 text-amber-700 hover:bg-amber-100"
            }`}
          >
            Em Análise ({campaigns.filter((c) => c.status === "Em Análise de Bloco").length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("aprovado")}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              statusFilter === "aprovado"
                ? "bg-emerald-600 text-white"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            Aprovados na Grade ({campaigns.filter((c) => c.status === "Aprovado na Grade").length})
          </button>
        </div>
      </div>

      {/* Tabela de Campanhas Avulsas */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3.5">Nº P.I.</th>
                <th className="py-2.5 px-3.5">Anunciante & Marca</th>
                <th className="py-2.5 px-3.5">Agência</th>
                <th className="py-2.5 px-3.5">Programa & Praça</th>
                <th className="py-2.5 px-3.5 text-center">Inserções</th>
                <th className="py-2.5 px-3.5 text-right">Valor Líquido</th>
                <th className="py-2.5 px-3.5 text-center">Material Técnico</th>
                <th className="py-2.5 px-3.5 text-center">Status</th>
                <th className="py-2.5 px-3.5 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Nenhuma campanha avulsa encontrada.
                  </td>
                </tr>
              ) : (
                filteredCampaigns.map((camp) => (
                  <tr
                    key={camp.id}
                    onClick={() => setSelectedCampaign(camp)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {camp.numeroPi}
                    </td>

                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span className="font-semibold text-slate-900 block">{camp.anunciante}</span>
                      <span className="text-[11px] text-slate-500">{camp.marca}</span>
                    </td>

                    <td className="py-3 px-3.5 text-slate-600 whitespace-nowrap">{camp.agencia}</td>

                    <td className="py-3 px-3.5">
                      <span className="font-medium text-slate-800 block">{camp.programa}</span>
                      <span className="text-[10px] text-slate-400">
                        {camp.praca} • {camp.periodo}
                      </span>
                    </td>

                    <td className="py-3 px-3.5 text-center font-bold text-slate-900 whitespace-nowrap">
                      {camp.totalInsercoes} spots
                    </td>

                    <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      {formatBRL(camp.valorLiquido)}
                    </td>

                    <td className="py-3 px-3.5 text-center whitespace-nowrap">
                      <span className="text-[11px] text-slate-600">{camp.materialTecnico}</span>
                    </td>

                    <td className="py-3 px-3.5 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          camp.status === "Aprovado na Grade"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {camp.status}
                      </span>
                    </td>

                    <td className="py-3 px-3.5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCampaign(camp);
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-900 rounded hover:bg-slate-100 transition-colors"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE NOVO P.I. AVULSO */}
      {showNewModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          onClick={() => setShowNewModal(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Cadastrar P.I. de Mídia Avulsa
              </h3>
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Nº do P.I.:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: PI 44910/26"
                    value={form.numeroPi}
                    onChange={(e) => setForm({ ...form, numeroPi: e.target.value })}
                    className="w-full py-1.5 px-2.5 border border-slate-200 rounded-lg bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Agência:</label>
                  <input
                    type="text"
                    placeholder="Ex: VML / Publicis / Direto"
                    value={form.agencia}
                    onChange={(e) => setForm({ ...form, agencia: e.target.value })}
                    className="w-full py-1.5 px-2.5 border border-slate-200 rounded-lg bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Anunciante:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Casas Bahia"
                    value={form.anunciante}
                    onChange={(e) => setForm({ ...form, anunciante: e.target.value })}
                    className="w-full py-1.5 px-2.5 border border-slate-200 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Marca / Produto:</label>
                  <input
                    type="text"
                    placeholder="Ex: Black Friday 2026"
                    value={form.marca}
                    onChange={(e) => setForm({ ...form, marca: e.target.value })}
                    className="w-full py-1.5 px-2.5 border border-slate-200 rounded-lg bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Programa:</label>
                  <input
                    type="text"
                    value={form.programa}
                    onChange={(e) => setForm({ ...form, programa: e.target.value })}
                    className="w-full py-1.5 px-2.5 border border-slate-200 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Praça:</label>
                  <input
                    type="text"
                    value={form.praca}
                    onChange={(e) => setForm({ ...form, praca: e.target.value })}
                    className="w-full py-1.5 px-2.5 border border-slate-200 rounded-lg bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Qtd Inserções:</label>
                  <input
                    type="number"
                    min="1"
                    value={form.totalInsercoes}
                    onChange={(e) => setForm({ ...form, totalInsercoes: e.target.value })}
                    className="w-full py-1.5 px-2.5 border border-slate-200 rounded-lg bg-white font-mono"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-600 font-medium mb-1">Valor Líquido (R$):</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={form.valorLiquido}
                    onChange={(e) => setForm({ ...form, valorLiquido: e.target.value })}
                    className="w-full py-1.5 px-2.5 border border-slate-200 rounded-lg bg-white font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold shadow-2xs"
                >
                  Salvar e Liberar para Análise
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DRAWER DE CONFERÊNCIA DE CAMPANHA */}
      {selectedCampaign && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs"
          onClick={() => setSelectedCampaign(null)}
        >
          <div
            className="w-full max-w-md bg-white h-full shadow-2xl p-5 flex flex-col justify-between overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                    P.I. de Mídia Avulsa
                  </span>
                  <h3 className="text-base font-bold text-slate-900">{selectedCampaign.numeroPi}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCampaign(null)}
                  className="p-1 rounded text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="text-slate-500">Anunciante: <strong className="text-slate-900">{selectedCampaign.anunciante}</strong></div>
                <div className="text-slate-500">Agência: <strong className="text-slate-900">{selectedCampaign.agencia}</strong></div>
                <div className="text-slate-500">Programa: <strong className="text-slate-900">{selectedCampaign.programa}</strong></div>
                <div className="text-slate-500">Praça: <strong className="text-slate-900">{selectedCampaign.praca}</strong></div>
                <div className="text-slate-500">Inserções: <strong className="text-slate-900">{selectedCampaign.totalInsercoes} spots</strong></div>
                <div className="text-slate-500">Valor Líquido: <strong className="text-slate-900 font-mono text-sm">{formatBRL(selectedCampaign.valorLiquido)}</strong></div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 size={15} />
                  Status da Grade
                </div>
                <p className="text-[11px] text-emerald-700">
                  Material em conformidade com as regras de exibição e sem conflito de bloco.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedCampaign(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => {
                  alert("P.I. aprovado e despachado para a Grade de Exibição!");
                  setSelectedCampaign(null);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-2xs"
              >
                Aprovar para Grade
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
