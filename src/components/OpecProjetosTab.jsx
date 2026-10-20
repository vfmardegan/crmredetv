// src/components/OpecProjetosTab.jsx
import React, { useState, useEffect } from "react";
import {
  Layers,
  Search,
  Plus,
  Upload,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ChevronRight,
  FileText,
  Mail,
  Building2,
  Tv,
  ArrowRight,
  X,
  FileCheck,
  Send,
  AlertCircle
} from "lucide-react";
import {
  getOpecProjects,
  saveOpecProject,
  reconcilePiToProject
} from "../services/opecService";

export default function OpecProjetosTab({ currentUser, onNavigate }) {
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedProject, setSelectedProject] = useState(null);

  // Estados da mesa de conciliação do P.I. dentro do drawer
  const [piInput, setPiInput] = useState({
    numeroPi: "",
    competencia: "Novembro/2026",
    programa: "",
    insercoes: 10,
    valorUnitario: 0,
    valorLiquido: 0,
    arquivoNome: ""
  });
  const [conciliacaoResult, setConciliacaoResult] = useState(null);
  const [showNotificarExecutivoModal, setShowNotificarExecutivoModal] = useState(false);
  const [notificacaoEnviada, setNotificacaoEnviada] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  function loadProjects() {
    const list = getOpecProjects();
    setProjects(list);
    if (selectedProject) {
      const updated = list.find((p) => p.id === selectedProject.id);
      if (updated) setSelectedProject(updated);
    }
  }

  function handleOpenMesa(project) {
    setSelectedProject(project);
    setConciliacaoResult(null);
    setNotificacaoEnviada(false);
    // Pré-preenche o primeiro programa com saldo
    const firstWithSaldo = project.entregasContratadas.find((e) => e.saldoRestante > 0) || project.entregasContratadas[0];
    if (firstWithSaldo) {
      setPiInput({
        numeroPi: `PI ${Math.floor(10000 + Math.random() * 90000)}/26`,
        competencia: "Novembro/2026",
        programa: firstWithSaldo.programa,
        insercoes: Math.min(10, firstWithSaldo.saldoRestante || 10),
        valorUnitario: firstWithSaldo.valorUnitario,
        valorLiquido: Math.min(10, firstWithSaldo.saldoRestante || 10) * firstWithSaldo.valorUnitario,
        arquivoNome: ""
      });
    }
  }

  function handleProgramChange(progName) {
    if (!selectedProject) return;
    const prog = selectedProject.entregasContratadas.find((e) => e.programa === progName);
    if (prog) {
      const qtd = Math.min(10, prog.saldoRestante || 10);
      setPiInput((prev) => ({
        ...prev,
        programa: prog.programa,
        valorUnitario: prog.valorUnitario,
        insercoes: qtd,
        valorLiquido: qtd * prog.valorUnitario
      }));
    } else {
      setPiInput((prev) => ({ ...prev, programa: progName }));
    }
    setConciliacaoResult(null);
  }

  // Simulação de leitura de PDF do P.I. com IA / OCR
  function handlePiPdfUpload(e) {
    const file = e.target.files?.[0];
    if (!file || !selectedProject) return;

    const prog = selectedProject.entregasContratadas[0];
    const unitarioSugerido = prog ? prog.valorUnitario : 15000;
    const insercoesSugeridas = prog ? Math.min(10, prog.saldoRestante || 10) : 10;

    setPiInput({
      numeroPi: `PI ${file.name.replace(/\D/g, "").slice(0, 5) || "48921"}/26`,
      competencia: "Novembro/2026",
      programa: prog ? prog.programa : "SuperPop",
      insercoes: insercoesSugeridas,
      valorUnitario: unitarioSugerido,
      valorLiquido: insercoesSugeridas * unitarioSugerido,
      arquivoNome: file.name
    });

    setConciliacaoResult(null);
  }

  function handleProcessarConciliacao() {
    if (!selectedProject) return;
    try {
      const res = reconcilePiToProject(selectedProject.id, piInput);
      setConciliacaoResult(res);
      if (res.success) {
        loadProjects();
      }
    } catch (e) {
      alert(e.message);
    }
  }

  function handleEnviarNotificacaoExecutivo() {
    setNotificacaoEnviada(true);
    setTimeout(() => {
      setShowNotificarExecutivoModal(false);
    }, 1500);
  }

  const formatBRL = (val) =>
    (val || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const filteredProjects = projects.filter((p) => {
    const matchSearch =
      p.nomeProjeto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.anunciante.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.agencia.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.executivo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.codigoProjeto.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "aguardando" && p.status === "Aguardando 1º P.I.") ||
      (statusFilter === "parcial" && p.status === "Em Veiculação / Parcial") ||
      (statusFilter === "divergencia" && p.status === "Com Divergência") ||
      (statusFilter === "concluido" && p.status === "Concluído");

    return matchSearch && matchStatus;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-7xl mx-auto">
      {/* Cabeçalho 100% Operacional */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
              OPEC • Mesa de Projetos Contratados
            </h1>
            <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-200">
              Operacional
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Conta corrente de saldo por programa e conciliação de P.Is vinculados aos contratos comerciais
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-xs text-slate-500 font-medium">
            Fila ativa: <span className="text-slate-900 font-bold">{projects.length} projetos</span>
          </div>
        </div>
      </div>

      {/* Controles de Busca e Filtros Rápidos */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por Projeto, Anunciante, Agência, Executivo..."
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
            Todos ({projects.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("aguardando")}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              statusFilter === "aguardando"
                ? "bg-amber-600 text-white"
                : "bg-amber-50 text-amber-700 hover:bg-amber-100"
            }`}
          >
            Aguardando 1º P.I. ({projects.filter((p) => p.status === "Aguardando 1º P.I.").length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("parcial")}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              statusFilter === "parcial"
                ? "bg-blue-600 text-white"
                : "bg-blue-50 text-blue-700 hover:bg-blue-100"
            }`}
          >
            Em Veiculação ({projects.filter((p) => p.status === "Em Veiculação / Parcial").length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("divergencia")}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              statusFilter === "divergencia"
                ? "bg-rose-600 text-white"
                : "bg-rose-50 text-rose-700 hover:bg-rose-100"
            }`}
          >
            Com Divergência ({projects.filter((p) => p.status === "Com Divergência").length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("concluido")}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              statusFilter === "concluido"
                ? "bg-emerald-600 text-white"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            Concluídos ({projects.filter((p) => p.status === "Concluído").length})
          </button>
        </div>
      </div>

      {/* Tabela Operacional Densa de Projetos */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3.5">Código / Projeto</th>
                <th className="py-2.5 px-3.5">Anunciante & Agência</th>
                <th className="py-2.5 px-3.5">Executivo</th>
                <th className="py-2.5 px-3.5 text-right">Valor Contratado</th>
                <th className="py-2.5 px-3.5 text-center">Conta de Inserções (Saldo)</th>
                <th className="py-2.5 px-3.5 text-center">Status</th>
                <th className="py-2.5 px-3.5 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Nenhum projeto encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((p) => {
                  const totalContratadas = p.entregasContratadas.reduce(
                    (s, it) => s + it.insercoesContratadas,
                    0
                  );
                  const totalVeiculadas = p.entregasContratadas.reduce(
                    (s, it) => s + it.insercoesVeiculadas,
                    0
                  );
                  const totalSaldo = p.entregasContratadas.reduce(
                    (s, it) => s + it.saldoRestante,
                    0
                  );
                  const perc = totalContratadas > 0 ? Math.round((totalVeiculadas / totalContratadas) * 100) : 0;

                  return (
                    <tr
                      key={p.id}
                      onClick={() => handleOpenMesa(p)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-3.5">
                        <span className="font-mono font-bold text-slate-800 text-[11px] block">
                          {p.codigoProjeto}
                        </span>
                        <span className="text-slate-900 font-medium truncate block max-w-[200px]">
                          {p.nomeProjeto}
                        </span>
                        <span className="text-[10px] text-slate-400">Criado em: {p.dataCriacao}</span>
                      </td>

                      <td className="py-3 px-3.5">
                        <span className="font-semibold text-slate-900 block">{p.anunciante}</span>
                        <span className="text-[11px] text-slate-500">{p.agencia}</span>
                      </td>

                      <td className="py-3 px-3.5 whitespace-nowrap text-slate-600">
                        {p.executivo}
                      </td>

                      <td className="py-3 px-3.5 text-right whitespace-nowrap font-mono font-bold text-slate-900">
                        {formatBRL(p.valorTotalContratado)}
                      </td>

                      <td className="py-3 px-3.5 text-center min-w-[170px]">
                        <div className="flex items-center justify-between text-[11px] font-medium text-slate-600 mb-1">
                          <span>{totalVeiculadas} veiculadas</span>
                          <span className="font-bold text-slate-900">{totalSaldo} saldo rest.</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              perc === 100
                                ? "bg-emerald-500"
                                : p.status === "Com Divergência"
                                ? "bg-rose-500"
                                : "bg-slate-800"
                            }`}
                            style={{ width: `${Math.min(100, perc)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 mt-0.5 block">
                          Total Contratado: {totalContratadas} spots ({perc}%)
                        </span>
                      </td>

                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                            p.status === "Concluído"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : p.status === "Em Veiculação / Parcial"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : p.status === "Com Divergência"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              p.status === "Concluído"
                                ? "bg-emerald-500"
                                : p.status === "Em Veiculação / Parcial"
                                ? "bg-blue-500"
                                : p.status === "Com Divergência"
                                ? "bg-rose-500"
                                : "bg-amber-500"
                            }`}
                          />
                          {p.status}
                        </span>
                      </td>

                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenMesa(p);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-white bg-slate-100 hover:bg-slate-800 rounded-md transition-colors"
                        >
                          <span>Mesa / P.I.</span>
                          <ChevronRight size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DRAWER DA MESA DE OPERAÇÕES DO PROJETO */}
      {selectedProject && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs"
          onClick={() => setSelectedProject(null)}
        >
          <div
            className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header da Mesa */}
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded">
                    {selectedProject.codigoProjeto}
                  </span>
                  <span className="text-xs text-slate-400">Executivo: {selectedProject.executivo}</span>
                </div>
                <h2 className="text-base sm:text-lg font-bold mt-1 text-white">
                  {selectedProject.nomeProjeto}
                </h2>
                <div className="text-xs text-slate-300 mt-0.5">
                  {selectedProject.anunciante} • Agência: {selectedProject.agencia}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProject(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-6 flex-1 text-xs sm:text-sm">
              {/* TABELA 1: CONTA CORRENTE DE SALDO POR PROGRAMA */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    1. Saldo Contratado por Programa (Conta Corrente)
                  </h3>
                  <span className="text-xs font-bold text-slate-900 font-mono">
                    Total: {formatBRL(selectedProject.valorTotalContratado)}
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[10px]">
                      <tr>
                        <th className="py-2 px-3">Programa / Formato</th>
                        <th className="py-2 px-3 text-right">Valor Unit. Fechado</th>
                        <th className="py-2 px-3 text-center">Contratadas</th>
                        <th className="py-2 px-3 text-center">Veiculadas</th>
                        <th className="py-2 px-3 text-right">Saldo Restante</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {selectedProject.entregasContratadas.map((ent) => (
                        <tr key={ent.id} className="hover:bg-slate-50/60">
                          <td className="py-2 px-3">
                            <span className="font-semibold text-slate-900 block">{ent.programa}</span>
                            <span className="text-[10px] text-slate-500">{ent.formato} • {ent.praca}</span>
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-medium text-slate-800">
                            {formatBRL(ent.valorUnitario)}
                          </td>
                          <td className="py-2 px-3 text-center font-mono">{ent.insercoesContratadas}</td>
                          <td className="py-2 px-3 text-center font-mono text-slate-600">
                            {ent.insercoesVeiculadas}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <span
                              className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                                ent.saldoRestante === 0
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-slate-100 text-slate-900"
                              }`}
                            >
                              {ent.saldoRestante} spots
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* PAINEL DE CONCILIAÇÃO: RECEPÇÃO DE NOVO P.I. */}
              <div className="border-2 border-slate-800/10 rounded-2xl p-4 bg-slate-50 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                      2
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                        Receber e Conciliar Novo P.I. (PDF / Agência)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        O sistema compara automaticamente o valor unitário e abate do saldo de inserções.
                      </p>
                    </div>
                  </div>

                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 shadow-2xs">
                    <Upload size={13} />
                    Ler P.I. (PDF)
                    <input type="file" accept=".pdf" className="hidden" onChange={handlePiPdfUpload} />
                  </label>
                </div>

                {piInput.arquivoNome && (
                  <div className="text-xs font-medium text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-lg flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <FileText size={14} className="text-rose-500" />
                      Arquivo: <strong>{piInput.arquivoNome}</strong>
                    </span>
                    <span className="text-[10px] text-emerald-600 font-semibold">Leitura OCR Concluída</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Nº do P.I. da Agência:</label>
                    <input
                      type="text"
                      value={piInput.numeroPi}
                      onChange={(e) => setPiInput({ ...piInput, numeroPi: e.target.value })}
                      className="w-full py-1.5 px-2.5 border border-slate-200 rounded-lg bg-white font-mono font-medium focus:ring-1 focus:ring-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Competência / Mês:</label>
                    <input
                      type="text"
                      value={piInput.competencia}
                      onChange={(e) => setPiInput({ ...piInput, competencia: e.target.value })}
                      className="w-full py-1.5 px-2.5 border border-slate-200 rounded-lg bg-white focus:ring-1 focus:ring-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Programa no P.I.:</label>
                    <select
                      value={piInput.programa}
                      onChange={(e) => handleProgramChange(e.target.value)}
                      className="w-full py-1.5 px-2.5 border border-slate-200 rounded-lg bg-white font-medium focus:ring-1 focus:ring-slate-700"
                    >
                      {selectedProject.entregasContratadas.map((e) => (
                        <option key={e.id} value={e.programa}>
                          {e.programa} (Saldo: {e.saldoRestante} spots)
                        </option>
                      ))}
                      <option value="Programa Fora do Contrato">Outro / Fora do Contrato</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Qtd Inserções:</label>
                      <input
                        type="number"
                        min="1"
                        value={piInput.insercoes}
                        onChange={(e) => {
                          const qtd = Number(e.target.value) || 0;
                          setPiInput({
                            ...piInput,
                            insercoes: qtd,
                            valorLiquido: qtd * piInput.valorUnitario
                          });
                          setConciliacaoResult(null);
                        }}
                        className="w-full py-1.5 px-2.5 border border-slate-200 rounded-lg bg-white font-mono font-bold focus:ring-1 focus:ring-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Valor Unit. no P.I. (R$):</label>
                      <input
                        type="number"
                        min="0"
                        value={piInput.valorUnitario}
                        onChange={(e) => {
                          const unit = Number(e.target.value) || 0;
                          setPiInput({
                            ...piInput,
                            valorUnitario: unit,
                            valorLiquido: unit * piInput.insercoes
                          });
                          setConciliacaoResult(null);
                        }}
                        className="w-full py-1.5 px-2.5 border border-slate-200 rounded-lg bg-white font-mono focus:ring-1 focus:ring-slate-700"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                  <div className="text-xs text-slate-600">
                    Valor Total Líquido do P.I.:{" "}
                    <strong className="text-slate-900 font-mono text-sm">
                      {formatBRL(piInput.valorLiquido)}
                    </strong>
                  </div>

                  <button
                    type="button"
                    onClick={handleProcessarConciliacao}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs transition-colors shadow-2xs"
                  >
                    <span>Conferir e Conciliar P.I.</span>
                    <ArrowRight size={14} />
                  </button>
                </div>

                {/* RESULTADO DA CONCILIAÇÃO EM TEMPO REAL */}
                {conciliacaoResult && (
                  <div className="pt-2">
                    {conciliacaoResult.success ? (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                        <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs sm:text-sm">
                          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                          <span>P.I. 100% Conciliado e Validado com Sucesso!</span>
                        </div>
                        <p className="text-xs text-emerald-700 leading-relaxed">
                          Os valores unitários bateram com o contrato comercial e foram debitadas{" "}
                          <strong>{piInput.insercoes} inserções</strong> do programa{" "}
                          <strong>{piInput.programa}</strong>. O saldo restante foi atualizado na conta corrente.
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-3">
                        <div className="flex items-center gap-2 text-rose-800 font-bold text-xs sm:text-sm">
                          <AlertTriangle size={18} className="text-rose-600 shrink-0" />
                          <span>Divergência Encontrada no P.I.!</span>
                        </div>
                        <ul className="text-xs text-rose-700 space-y-1 list-disc pl-5">
                          {conciliacaoResult.errors.map((err, i) => (
                            <li key={i}>{err}</li>
                          ))}
                        </ul>

                        <div className="pt-1 flex items-center justify-between">
                          <span className="text-[11px] text-rose-600">
                            Ação requerida: Devolver à agência ou solicitar correção ao executivo.
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowNotificarExecutivoModal(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                          >
                            <Mail size={13} />
                            Notificar Executivo ({selectedProject.executivo})
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* TABELA 3: HISTÓRICO DE P.IS VINCULADOS */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  3. Histórico de P.Is Vinculados ao Projeto ({selectedProject.pisVinculados.length})
                </h3>

                {selectedProject.pisVinculados.length === 0 ? (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                    Nenhum P.I. foi vinculado a este projeto até o momento.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[10px]">
                        <tr>
                          <th className="py-2 px-3">Nº P.I.</th>
                          <th className="py-2 px-3">Competência</th>
                          <th className="py-2 px-3">Programa</th>
                          <th className="py-2 px-3 text-center">Inserções</th>
                          <th className="py-2 px-3 text-right">Valor Líquido</th>
                          <th className="py-2 px-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {selectedProject.pisVinculados.map((pi) => (
                          <tr key={pi.id} className="hover:bg-slate-50/60">
                            <td className="py-2 px-3 font-mono font-medium text-slate-900">
                              {pi.numeroPi}
                              <span className="block text-[10px] text-slate-400 font-normal">
                                {pi.dataRecebimento}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-700">{pi.competencia}</td>
                            <td className="py-2 px-3 font-medium text-slate-800">{pi.programa}</td>
                            <td className="py-2 px-3 text-center font-bold text-slate-900">
                              {pi.insercoes} spots
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                              {formatBRL(pi.valorLiquido)}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  pi.status.includes("Aprovado")
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-rose-100 text-rose-800"
                                }`}
                              >
                                {pi.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Rodapé da Mesa */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Mesa de Operações Comercial & OPEC • RedeTV!
              </span>
              <button
                type="button"
                onClick={() => setSelectedProject(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Fechar Mesa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE NOTIFICAÇÃO RÁPIDA DE DIVERGÊNCIA AO EXECUTIVO */}
      {showNotificarExecutivoModal && selectedProject && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          onClick={() => setShowNotificarExecutivoModal(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                <Mail size={18} />
                <span>Notificar Executivo de Conta</span>
              </div>
              <button
                type="button"
                onClick={() => setShowNotificarExecutivoModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              O sistema irá disparar um alerta e e-mail automático para o executivo responsável com o
              espelho exato da divergência encontrada no P.I. para que ele acione o mídia da agência:
            </p>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
              <div className="text-slate-500">
                Destinatário: <strong className="text-slate-800">{selectedProject.executivo}</strong>
              </div>
              <div className="text-slate-500">
                Projeto: <strong className="text-slate-800">{selectedProject.nomeProjeto}</strong>
              </div>
              <div className="text-slate-500">
                P.I. Avaliado: <strong className="text-slate-800">{piInput.numeroPi}</strong>
              </div>
              <div className="text-rose-700 font-medium pt-1 border-t border-slate-200">
                Motivo da Devolução:
                <p className="text-[11px] text-rose-600 mt-0.5">
                  {conciliacaoResult?.errors?.[0] || "Divergência de valores ou saldo de inserções."}
                </p>
              </div>
            </div>

            {notificacaoEnviada ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600" />
                Notificação enviada com sucesso ao Executivo!
              </div>
            ) : (
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNotificarExecutivoModal(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleEnviarNotificacaoExecutivo}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                >
                  <Send size={13} />
                  Enviar Alerta com 1 Clique
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
