import React, { useState, useMemo } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  FileText,
  FileSpreadsheet,
  CheckCircle2,
  Loader2,
  X,
  ChevronDown,
  ChevronRight,
  Clock,
  Layers
} from "lucide-react";
import { apiPost, apiPut, apiDelete, uploadFileInChunks } from "../../services/api";
import { TV_PRODUCTS, DIGITAL_PRODUCTS, SPECIAL_PROJECTS } from "../../utils/helpers";

const CLUSTER_CONFIG = {
  "Tabela": {
    title: "Tabela de Preços",
    buttonLabel: "Tabela",
    badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    headerBg: "bg-slate-50 border-slate-200",
    dotColor: "bg-emerald-500",
  },
  "Televisão": {
    title: "Televisão",
    buttonLabel: "Televisão",
    badgeBg: "bg-red-50 text-red-700 border-red-200",
    headerBg: "bg-slate-50 border-slate-200",
    dotColor: "bg-red-500",
  },
  "Digital": {
    title: "Digital",
    buttonLabel: "Digital",
    badgeBg: "bg-blue-50 text-blue-700 border-blue-200",
    headerBg: "bg-slate-50 border-slate-200",
    dotColor: "bg-blue-500",
  },
  "Projetos Especiais": {
    title: "Projetos Especiais",
    buttonLabel: "Projetos Especiais",
    badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
    headerBg: "bg-slate-50 border-slate-200",
    dotColor: "bg-amber-500",
  },
};

// Ordem estrita: Tabela, Televisão, Digital, Projetos Especiais
const CLUSTERS_LIST = ["Tabela", "Televisão", "Digital", "Projetos Especiais"];

export default function AdminProposalsTab({ proposalTemplates = [], onRefresh, allProducts }) {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [xlsFile, setXlsFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");

  // Controle de expansão/retração das 4 seções (iniciam recolhidas)
  const [expandedClusters, setExpandedClusters] = useState({
    "Tabela": false,
    "Televisão": false,
    "Digital": false,
    "Projetos Especiais": false,
  });

  // Produtos conectados dinamicamente à grade da aba Produtos e ordenados alfabeticamente
  const clustersProducts = useMemo(() => {
    const tv = (allProducts?.televisao && allProducts.televisao.length > 0 ? allProducts.televisao : TV_PRODUCTS)
      .slice()
      .sort((a, b) => a.localeCompare(b, "pt-BR"));

    const dig = (allProducts?.digital && allProducts.digital.length > 0 ? allProducts.digital : DIGITAL_PRODUCTS)
      .slice()
      .sort((a, b) => a.localeCompare(b, "pt-BR"));

    const esp = (allProducts?.especiais && allProducts.especiais.length > 0 ? allProducts.especiais : SPECIAL_PROJECTS)
      .slice()
      .sort((a, b) => a.localeCompare(b, "pt-BR"));

    const tab = Array.from(new Set([...tv, ...dig, ...esp])).sort((a, b) => a.localeCompare(b, "pt-BR"));

    return {
      "Tabela": tab,
      "Televisão": tv,
      "Digital": dig,
      "Projetos Especiais": esp,
    };
  }, [allProducts]);

  const [form, setForm] = useState({
    title: "",
    cluster: "Tabela",
    product: "",
    periodo: "",
    observacao: "",
    pdfFileName: "",
    pdfDataUri: "",
    xlsFileName: "",
    xlsDataUri: "",
  });

  function toggleCluster(clusterName) {
    setExpandedClusters((prev) => ({
      ...prev,
      [clusterName]: !prev[clusterName],
    }));
  }

  function handleOpenCreate(defaultCluster = "Tabela") {
    setEditingItem(null);
    setPdfFile(null);
    setXlsFile(null);
    setUploadStatus("");
    setForm({
      title: "",
      cluster: defaultCluster,
      product: "",
      periodo: "",
      observacao: "",
      pdfFileName: "",
      pdfDataUri: "",
      xlsFileName: "",
      xlsDataUri: "",
    });
    setShowModal(true);
  }

  function resolveCluster(item) {
    if (item.cluster) {
      if (item.cluster === "Tabela" || item.cluster === "Tabela de Preços") return "Tabela";
      if (item.cluster === "Televisão") return "Televisão";
      if (item.cluster === "Digital") return "Digital";
      if (item.cluster === "Projetos Especiais") return "Projetos Especiais";
    }
    const titleLower = (item.title || "").toLowerCase();
    if (titleLower.includes("tabela") || titleLower.includes("preço") || titleLower.includes("lista de preço")) {
      return "Tabela";
    }
    if (item.product) {
      if (clustersProducts["Televisão"]?.includes(item.product)) return "Televisão";
      if (clustersProducts["Digital"]?.includes(item.product)) return "Digital";
      if (clustersProducts["Projetos Especiais"]?.includes(item.product)) return "Projetos Especiais";
    }
    return "Televisão";
  }

  function handleOpenEdit(item) {
    setEditingItem(item);
    setPdfFile(null);
    setXlsFile(null);
    setUploadStatus("");
    const itemCluster = resolveCluster(item);
    setForm({
      title: item.title || "",
      cluster: itemCluster,
      product: item.product || "",
      periodo: item.periodo || "",
      observacao: item.observacao || item.subtitle || "",
      pdfFileName: item.pdfFileName || "",
      pdfDataUri: item.pdfDataUri || "",
      xlsFileName: item.xlsFileName || "",
      xlsDataUri: item.xlsDataUri || "",
    });
    setShowModal(true);
  }

  const MAX_FILE_SIZE_MB = 30;

  function handlePdfFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      alert(`O arquivo PDF selecionado é muito grande (${(file.size / 1024 / 1024).toFixed(1)} MB). O limite máximo suportado é de ${MAX_FILE_SIZE_MB} MB.`);
      e.target.value = "";
      return;
    }
    setPdfFile(file);
    setForm((prev) => ({
      ...prev,
      pdfFileName: file.name,
    }));
  }

  function handleXlsFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      alert(`O arquivo Excel selecionado é muito grande (${(file.size / 1024 / 1024).toFixed(1)} MB). O limite máximo suportado é de ${MAX_FILE_SIZE_MB} MB.`);
      e.target.value = "";
      return;
    }
    setXlsFile(file);
    setForm((prev) => ({
      ...prev,
      xlsFileName: file.name,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) {
      alert("Por favor, preencha o Título.");
      return;
    }

    setSaving(true);
    setUploadStatus("Iniciando...");
    try {
      let finalPdfUri = form.pdfDataUri;
      let finalXlsUri = form.xlsDataUri;

      // 1. Se um novo PDF foi anexado, realiza upload fragmentado (imune ao WAF)
      if (pdfFile) {
        setUploadStatus("Enviando PDF...");
        const uploadedPdf = await uploadFileInChunks(pdfFile, (pct) => {
          setUploadStatus(`Enviando PDF (${pct}%)...`);
        });
        if (uploadedPdf?.fileUrl) {
          finalPdfUri = uploadedPdf.fileUrl;
        }
      }

      // 2. Se um novo Excel foi anexado, realiza upload fragmentado (imune ao WAF)
      if (xlsFile) {
        setUploadStatus("Enviando Excel...");
        const uploadedXls = await uploadFileInChunks(xlsFile, (pct) => {
          setUploadStatus(`Enviando Excel (${pct}%)...`);
        });
        if (uploadedXls?.fileUrl) {
          finalXlsUri = uploadedXls.fileUrl;
        }
      }

      setUploadStatus("Salvando...");
      const payload = {
        title: form.title.trim(),
        cluster: form.cluster,
        product: form.product || null,
        periodo: form.periodo.trim() || null,
        observacao: form.observacao.trim() || null,
        pdfFileName: form.pdfFileName || null,
        pdfDataUri: finalPdfUri || null,
        xlsFileName: form.xlsFileName || null,
        xlsDataUri: finalXlsUri || null,
      };

      if (editingItem) {
        await apiPut(`/proposal-templates/${editingItem.id}`, payload);
      } else {
        await apiPost("/proposal-templates", payload);
      }

      setShowModal(false);
      setEditingItem(null);
      setPdfFile(null);
      setXlsFile(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Erro ao salvar proposta/tabela:", err);
      alert("Erro ao salvar: " + (err.message || "Tente novamente."));
    } finally {
      setSaving(false);
      setUploadStatus("");
    }
  }

  async function handleDelete(id, title) {
    if (!window.confirm(`Deseja realmente excluir "${title}"?`)) return;
    try {
      await apiDelete(`/proposal-templates/${id}`);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Erro ao excluir proposta/tabela:", err);
      alert("Erro ao excluir: " + (err.message || "Tente novamente."));
    }
  }

  // Agrupa os itens nas 4 seções em ordem alfabética dentro de cada uma
  const groupedProposals = useMemo(() => {
    const groups = {
      "Tabela": [],
      "Televisão": [],
      "Digital": [],
      "Projetos Especiais": [],
    };
    (proposalTemplates || []).forEach((item) => {
      const c = resolveCluster(item);
      if (!groups[c]) groups[c] = [];
      groups[c].push(item);
    });

    Object.keys(groups).forEach((key) => {
      groups[key].sort((a, b) => (a.title || "").localeCompare(b.title || "", "pt-BR"));
    });

    return groups;
  }, [proposalTemplates, clustersProducts]);

  return (
    <div className="flex flex-col gap-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-800">Tabela e Propostas</h2>
        </div>
        <button
          type="button"
          onClick={() => handleOpenCreate("Tabela")}
          className="bg-rose-600 text-white px-3.5 py-2 rounded-md text-xs font-semibold hover:bg-rose-700 transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer w-fit"
        >
          <Plus size={14} /> Novo Cadastro
        </button>
      </div>

      {/* Listagem das 4 Seções na ordem: Tabela, Televisão, Digital, Projetos Especiais (Expandíveis / Retráteis) */}
      <div className="flex flex-col gap-5">
        {CLUSTERS_LIST.map((clusterName) => {
          const config = CLUSTER_CONFIG[clusterName];
          const isExpanded = expandedClusters[clusterName];
          const items = groupedProposals[clusterName] || [];

          return (
            <div
              key={clusterName}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs transition-all"
            >
              {/* Barra da Seção (Sem ícones) */}
              <div
                onClick={() => toggleCluster(clusterName)}
                className="flex items-center justify-between px-5 py-3.5 bg-slate-50/70 hover:bg-slate-100/70 border-b border-slate-200/80 cursor-pointer transition-colors select-none"
              >
                <div className="flex items-center gap-2.5">
                  <h3 className="text-sm font-bold text-slate-800">{config.title}</h3>
                  <span className="text-[11px] font-semibold bg-white text-slate-600 px-2 py-0.5 rounded-full border border-slate-200 shadow-xs">
                    {items.length} {items.length === 1 ? "item" : "itens"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenCreate(clusterName);
                    }}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={13} /> Adicionar
                  </button>
                  <span className="text-slate-400 p-1">
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </span>
                </div>
              </div>

              {/* Conteúdo Expandido da Seção */}
              {isExpanded && (
                <div>
                  {items.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      Nenhum item cadastrado em <strong>{config.title}</strong>. Clique em{" "}
                      <span
                        onClick={() => handleOpenCreate(clusterName)}
                        className="text-rose-600 font-semibold cursor-pointer hover:underline"
                      >
                        Adicionar
                      </span>{" "}
                      para cadastrar um modelo ou tabela.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            <th className="py-2.5 px-5">Título</th>
                            <th className="py-2.5 px-3">Produto</th>
                            <th className="py-2.5 px-3">Período</th>
                            <th className="py-2.5 px-3">Observação</th>
                            <th className="py-2.5 px-3 text-center">Arquivos</th>
                            <th className="py-2.5 px-5 text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                          {items.map((t) => (
                            <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                              {/* Coluna 1: Título */}
                              <td className="py-3 px-5 font-semibold text-slate-900">
                                {t.title}
                              </td>

                              {/* Coluna 2: Produto */}
                              <td className="py-3 px-3 whitespace-nowrap">
                                {t.product ? (
                                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${config.badgeBg}`}>
                                    {t.product}
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-slate-400 font-medium">
                                    {clusterName === "Tabela" ? "Tabela Geral" : "Sem produto"}
                                  </span>
                                )}
                              </td>

                              {/* Coluna 3: Período */}
                              <td className="py-3 px-3 whitespace-nowrap text-slate-600 font-medium">
                                {t.periodo || "—"}
                              </td>

                              {/* Coluna 4: Observação */}
                              <td className="py-3 px-3 text-slate-500 max-w-xs truncate" title={t.observacao || t.subtitle || ""}>
                                {t.observacao || t.subtitle || "—"}
                              </td>

                              {/* Coluna 5: Arquivos (PDF e Excel) */}
                              <td className="py-3 px-3 whitespace-nowrap">
                                <div className="flex items-center justify-center gap-1.5">
                                  {t.pdfDataUri ? (
                                    <a
                                      href={t.pdfDataUri}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded border border-rose-200 transition-colors"
                                      title="Visualizar PDF"
                                    >
                                      <FileText size={12} className="text-rose-600" />
                                      <span>PDF</span>
                                    </a>
                                  ) : null}
                                  {t.xlsDataUri ? (
                                    <a
                                      href={t.xlsDataUri}
                                      download={t.xlsFileName || "valores.xlsx"}
                                      className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded border border-emerald-200 transition-colors"
                                      title="Baixar Planilha Excel"
                                    >
                                      <FileSpreadsheet size={12} className="text-emerald-600" />
                                      <span>Excel</span>
                                    </a>
                                  ) : null}
                                  {!t.pdfDataUri && !t.xlsDataUri && (
                                    <span className="text-[11px] text-slate-400">—</span>
                                  )}
                                </div>
                              </td>

                              {/* Coluna 6: Ações (Editar e Excluir) */}
                              <td className="py-3 px-5 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEdit(t)}
                                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                                    title="Editar"
                                  >
                                    <Edit2 size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(t.id, t.title)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                                    title="Excluir"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal de Cadastro/Edição (Sem ícones nos botões de seleção) */}
      {showModal && (
        <div
          className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl flex flex-col gap-4 max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                  <Layers size={18} />
                </span>
                <h3 className="font-bold text-slate-800 text-sm">
                  {editingItem ? "Editar Cadastro" : "Novo Cadastro - Tabela / Proposta"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* 1. Título */}
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">
                  Título *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Ex: Tabela Geral de Preços 2026 ou Patrocínio SuperPop"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent bg-slate-50/50"
                  required
                />
              </div>

              {/* 2. Botões das 4 Seções (Sem ícones, ordem: Tabela, Televisão, Digital, Projetos Especiais) */}
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                  Seção *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {CLUSTERS_LIST.map((cName) => {
                    const isSelected = form.cluster === cName;
                    return (
                      <button
                        key={cName}
                        type="button"
                        onClick={() => {
                          setForm({ ...form, cluster: cName, product: "" });
                        }}
                        className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all cursor-pointer text-center ${
                          isSelected
                            ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {cName}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Produto (Lista Suspensa conectada à aba Produtos) */}
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">
                  Produto {form.cluster === "Tabela" ? "(Opcional)" : "(Grade da emissora)"}
                </label>
                <div className="relative">
                  <select
                    value={form.product}
                    onChange={(e) => setForm({ ...form, product: e.target.value })}
                    className="w-full appearance-none border border-slate-200 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-800 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent cursor-pointer"
                  >
                    <option value="">
                      {form.cluster === "Tabela"
                        ? "Tabela Geral (Sem produto específico)..."
                        : `Selecione o produto de ${form.cluster}...`}
                    </option>
                    {(clustersProducts[form.cluster] || []).map((prodName) => (
                      <option key={prodName} value={prodName}>
                        {prodName}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {form.cluster === "Tabela"
                    ? "Para tabelas de preços gerais, você pode deixar este campo em branco."
                    : `Exibindo ${clustersProducts[form.cluster]?.length || 0} produtos de ${form.cluster} em ordem alfabética.`}
                </p>
              </div>

              {/* 4. Período */}
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">
                  Período
                </label>
                <input
                  type="text"
                  value={form.periodo}
                  onChange={(e) => setForm({ ...form, periodo: e.target.value })}
                  placeholder="Ex: 2026, 12 meses, Anual, Temporada"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent bg-slate-50/50"
                />
              </div>

              {/* 5. Observação */}
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">
                  Observação
                </label>
                <textarea
                  rows={3}
                  value={form.observacao}
                  onChange={(e) => setForm({ ...form, observacao: e.target.value })}
                  placeholder="Informações adicionais sobre descontos, cotas, formato comercial ou vigência..."
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent bg-slate-50/50 resize-none"
                />
              </div>

              {/* 6. Upload de Arquivos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                {/* Upload PDF */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <FileText size={13} className="text-rose-600" />
                    Arquivo PDF
                  </label>
                  <label className="border border-dashed border-slate-300 rounded-lg p-3 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-slate-50 transition-colors bg-slate-50/30">
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handlePdfFileChange}
                      className="hidden"
                    />
                    <FileText size={18} className="text-slate-400" />
                    <span className="text-[11px] font-semibold text-rose-600">
                      {form.pdfFileName ? "Substituir PDF" : "Selecionar PDF"}
                    </span>
                    <span className="text-[10px] text-slate-400">Até 30MB</span>
                  </label>
                  {form.pdfFileName && (
                    <div className="flex items-center justify-between text-[11px] bg-slate-100 px-2.5 py-1.5 rounded text-slate-700 font-medium">
                      <span className="truncate max-w-[170px]">{form.pdfFileName}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setPdfFile(null);
                          setForm({ ...form, pdfFileName: "", pdfDataUri: "" });
                        }}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Upload Excel */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <FileSpreadsheet size={13} className="text-emerald-600" />
                    Planilha Excel
                  </label>
                  <label className="border border-dashed border-slate-300 rounded-lg p-3 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-slate-50 transition-colors bg-slate-50/30">
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleXlsFileChange}
                      className="hidden"
                    />
                    <FileSpreadsheet size={18} className="text-slate-400" />
                    <span className="text-[11px] font-semibold text-emerald-700">
                      {form.xlsFileName ? "Substituir Excel" : "Selecionar Excel"}
                    </span>
                    <span className="text-[10px] text-slate-400">Até 30MB</span>
                  </label>
                  {form.xlsFileName && (
                    <div className="flex items-center justify-between text-[11px] bg-emerald-50 px-2.5 py-1.5 rounded text-emerald-800 font-medium border border-emerald-200">
                      <span className="truncate max-w-[170px]">{form.xlsFileName}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setXlsFile(null);
                          setForm({ ...form, xlsFileName: "", xlsDataUri: "" });
                        }}
                        className="text-emerald-700 hover:text-rose-600"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 mt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 size={13} className="animate-spin" /> {uploadStatus || "Salvando..."}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={13} /> {editingItem ? "Atualizar" : "Salvar"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
