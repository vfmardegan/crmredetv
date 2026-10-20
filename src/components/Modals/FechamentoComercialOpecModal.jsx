// src/components/Modals/FechamentoComercialOpecModal.jsx
import React, { useState } from "react";
import {
  X,
  FileSpreadsheet,
  CheckCircle2,
  Plus,
  Trash2,
  Upload,
  AlertCircle,
  Building2,
  Sparkles
} from "lucide-react";
import { TV_PRODUCTS } from "../../utils/helpers";

export default function FechamentoComercialOpecModal({
  isOpen,
  onClose,
  opportunity,
  advertiserName,
  agencyName,
  onConfirmFechamento
}) {
  if (!isOpen || !opportunity) return null;

  // Lista inicial de entregas baseada nos produtos da oportunidade (ou linha padrão)
  const [entregas, setEntregas] = useState(() => {
    if (opportunity.products && opportunity.products.length > 0) {
      return opportunity.products.map((prod, idx) => ({
        id: `row-${idx}`,
        programa: prod,
        formato: "Spot 30\"",
        praca: "Nacional (Rede)",
        valorUnitario: Math.round(Number(opportunity.value || 100000) / (opportunity.products.length * 10)),
        insercoesContratadas: 10
      }));
    }
    return [
      {
        id: "row-0",
        programa: "SuperPop",
        formato: "Spot 30\"",
        praca: "Nacional (Rede)",
        valorUnitario: 15000,
        insercoesContratadas: 20
      }
    ];
  });

  const [uploadFeedback, setUploadFeedback] = useState("");

  const programasSugeridos = [
    "SuperPop",
    "RedeTV! News",
    "Operação de Risco",
    "A Tarde é Sua",
    "Bola na Rede / NFL",
    "Sensacional",
    "Geral do Povo",
    "Vila da Vila",
    "Documento Verdade",
    "Manhã do Ronnie"
  ];

  const formatosSugeridos = [
    "Spot 30\"",
    "Spot 15\"",
    "Vinheta 5\"",
    "Testemunhal 60\"",
    "Merchandising 60\"",
    "Ação de Conteúdo",
    "Break Exclusivo"
  ];

  const pracasSugeridas = [
    "Nacional (Rede)",
    "Grande SP",
    "Rio de Janeiro",
    "Belo Horizonte",
    "Recife",
    "Fortaleza"
  ];

  function addRow() {
    setEntregas((prev) => [
      ...prev,
      {
        id: `row-${Date.now()}`,
        programa: "SuperPop",
        formato: "Spot 30\"",
        praca: "Nacional (Rede)",
        valorUnitario: 10000,
        insercoesContratadas: 10
      }
    ]);
  }

  function removeRow(id) {
    if (entregas.length <= 1) return;
    setEntregas((prev) => prev.filter((r) => r.id !== id));
  }

  function updateRow(id, field, value) {
    setEntregas((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  }

  // Simulação de leitura de planilha padrão da RedeTV!
  function handleExcelUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFeedback(`Lendo planilha "${file.name}"...`);

    setTimeout(() => {
      // Simula leitura dos itens da planilha padrão
      setEntregas([
        {
          id: `imp-1`,
          programa: "SuperPop",
          formato: "Spot 30\"",
          praca: "Nacional (Rede)",
          valorUnitario: 18000,
          insercoesContratadas: 30
        },
        {
          id: `imp-2`,
          programa: "RedeTV! News",
          formato: "Vinheta 5\"",
          praca: "Nacional (Rede)",
          valorUnitario: 11000,
          insercoesContratadas: 40
        }
      ]);
      setUploadFeedback(`✅ Planilha "${file.name}" lida com sucesso! 2 programas identificados.`);
    }, 600);
  }

  const totalInsercoes = entregas.reduce((acc, r) => acc + (Number(r.insercoesContratadas) || 0), 0);
  const totalValor = entregas.reduce(
    (acc, r) => acc + (Number(r.insercoesContratadas) || 0) * (Number(r.valorUnitario) || 0),
    0
  );

  function handleSalvar() {
    onConfirmFechamento({
      opportunity,
      anuncianteNome: advertiserName,
      agenciaNome: agencyName,
      entregas
    });
    onClose();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho do Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">
                  Fechamento Comercial • Envio para OPEC
                </h2>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                  Ganho / Fechado
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Defina o saldo global de entregas por programa para a conciliação automática de P.Is
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
          {/* Card Resumo da Negociação */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[11px] text-slate-500 uppercase font-semibold tracking-wider">
                Oportunidade
              </span>
              <div className="text-sm font-bold text-slate-900">{opportunity.title}</div>
              <div className="text-xs text-slate-600 mt-0.5">
                {advertiserName} {agencyName ? `• Agência: ${agencyName}` : ""}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-500 uppercase font-semibold tracking-wider">
                Valor Total da Oportunidade
              </span>
              <div className="text-base sm:text-lg font-bold text-slate-900 font-mono">
                {(Number(opportunity.value) || totalValor).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL"
                })}
              </div>
            </div>
          </div>

          {/* Área de Upload de Planilha Padrão */}
          <div className="border border-dashed border-slate-300 rounded-xl p-3 sm:p-4 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <FileSpreadsheet size={20} />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-semibold text-slate-800">
                  Importar Planilha Padrão RedeTV! (Opcional)
                </div>
                <div className="text-[11px] text-slate-500">
                  Preenche os programas e valores automaticamente a partir do Excel
                </div>
              </div>
            </div>
            <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs">
              <Upload size={14} />
              Escolher Excel (.xlsx, .csv)
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleExcelUpload}
              />
            </label>
          </div>

          {uploadFeedback && (
            <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg flex items-center gap-2">
              <CheckCircle2 size={15} />
              {uploadFeedback}
            </div>
          )}

          {/* Tabela de Saldo Contratado por Programa */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-800">
                  Entregas Contratadas por Programa
                </h3>
                <p className="text-[11px] text-slate-500">
                  Estes valores servirão como conta corrente para a OPEC abater à medida que os P.Is chegarem.
                </p>
              </div>
              <button
                type="button"
                onClick={addRow}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-200"
              >
                <Plus size={14} />
                Adicionar Programa
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Programa</th>
                    <th className="py-2.5 px-3">Formato</th>
                    <th className="py-2.5 px-3">Praça</th>
                    <th className="py-2.5 px-3 text-right">Valor Unitário Líquido (R$)</th>
                    <th className="py-2.5 px-3 text-center">Inserções Totais</th>
                    <th className="py-2.5 px-3 text-right">Subtotal</th>
                    <th className="py-2.5 px-2 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {entregas.map((row) => {
                    const subtotal = (Number(row.insercoesContratadas) || 0) * (Number(row.valorUnitario) || 0);
                    return (
                      <tr key={row.id} className="hover:bg-slate-50/60">
                        <td className="py-2 px-3">
                          <select
                            value={row.programa}
                            onChange={(e) => updateRow(row.id, "programa", e.target.value)}
                            className="w-full py-1 px-2 border border-slate-200 rounded-md bg-white focus:ring-1 focus:ring-rose-500 focus:outline-none"
                          >
                            {programasSugeridos.map((prog) => (
                              <option key={prog} value={prog}>
                                {prog}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-3">
                          <select
                            value={row.formato}
                            onChange={(e) => updateRow(row.id, "formato", e.target.value)}
                            className="w-full py-1 px-2 border border-slate-200 rounded-md bg-white focus:ring-1 focus:ring-rose-500 focus:outline-none"
                          >
                            {formatosSugeridos.map((f) => (
                              <option key={f} value={f}>
                                {f}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-3">
                          <select
                            value={row.praca}
                            onChange={(e) => updateRow(row.id, "praca", e.target.value)}
                            className="w-full py-1 px-2 border border-slate-200 rounded-md bg-white focus:ring-1 focus:ring-rose-500 focus:outline-none"
                          >
                            {pracasSugeridas.map((p) => (
                              <option key={p} value={p}>
                                {p}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <input
                            type="number"
                            min="0"
                            step="500"
                            value={row.valorUnitario}
                            onChange={(e) => updateRow(row.id, "valorUnitario", Number(e.target.value))}
                            className="w-28 py-1 px-2 text-right border border-slate-200 rounded-md bg-white font-mono focus:ring-1 focus:ring-rose-500 focus:outline-none"
                          />
                        </td>
                        <td className="py-2 px-3 text-center">
                          <input
                            type="number"
                            min="1"
                            value={row.insercoesContratadas}
                            onChange={(e) => updateRow(row.id, "insercoesContratadas", Number(e.target.value))}
                            className="w-16 py-1 px-2 text-center border border-slate-200 rounded-md bg-white font-mono font-semibold focus:ring-1 focus:ring-rose-500 focus:outline-none"
                          />
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-medium text-slate-800">
                          {subtotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeRow(row.id)}
                            disabled={entregas.length <= 1}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded disabled:opacity-30 transition-colors"
                            title="Remover linha"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-50 border-t border-slate-200 font-semibold text-slate-800">
                  <tr>
                    <td colSpan={4} className="py-2.5 px-3 text-right text-slate-600">
                      Totais Contratados:
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-900 font-mono">
                      {totalInsercoes} spots
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-rose-600 font-mono">
                      {totalValor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Rodapé de Ações */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSalvar}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-sm"
          >
            <CheckCircle2 size={16} />
            Confirmar Fechamento e Enviar para OPEC
          </button>
        </div>
      </div>
    </div>
  );
}
