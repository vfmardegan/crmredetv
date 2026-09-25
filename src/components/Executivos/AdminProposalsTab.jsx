import React, { useState } from "react";
import { Plus, Trash2, Edit2, FileText, FileSpreadsheet, CheckCircle2, Loader2, X } from "lucide-react";
import { apiPost, apiPut, apiDelete } from "../../services/api";

export default function AdminProposalsTab({ proposalTemplates = [], onRefresh }) {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "",
    product: "",
    subtitle: "",
    horario: "",
    periodo: "",
    pdfFileName: "",
    pdfDataUri: "",
    xlsFileName: "",
    xlsDataUri: ""
  });

  function handleOpenCreate() {
    setEditingItem(null);
    setForm({
      title: "",
      product: "",
      subtitle: "",
      horario: "",
      periodo: "",
      pdfFileName: "",
      pdfDataUri: "",
      xlsFileName: "",
      xlsDataUri: ""
    });
    setShowModal(true);
  }

  function handleOpenEdit(item) {
    setEditingItem(item);
    setForm({
      title: item.title || "",
      product: item.product || "",
      subtitle: item.subtitle || "",
      horario: item.horario || "",
      periodo: item.periodo || "",
      pdfFileName: item.pdfFileName || "",
      pdfDataUri: item.pdfDataUri || "",
      xlsFileName: item.xlsFileName || "",
      xlsDataUri: item.xlsDataUri || ""
    });
    setShowModal(true);
  }

  function handlePdfFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setForm((prev) => ({
        ...prev,
        pdfFileName: file.name,
        pdfDataUri: event.target.result
      }));
    };
    reader.readAsDataURL(file);
  }

  function handleXlsFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setForm((prev) => ({
        ...prev,
        xlsFileName: file.name,
        xlsDataUri: event.target.result
      }));
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) {
      alert("Por favor, informe o título da proposta.");
      return;
    }

    setSaving(true);
    try {
      if (editingItem) {
        await apiPut(`/proposal-templates/${editingItem.id}`, form);
      } else {
        await apiPost("/proposal-templates", form);
      }
      setShowModal(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert("Erro ao salvar proposta padrão: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id, title) {
    if (!window.confirm(`Tem certeza que deseja excluir o modelo de proposta "${title}"?`)) {
      return;
    }
    try {
      await apiDelete(`/proposal-templates/${id}`);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert("Erro ao excluir proposta padrão: " + err.message);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-800">Propostas Padrão & Apresentações</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cadastre os projetos e modelos de proposta da emissora com seus respectivos arquivos PDF e planilhas Excel.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="bg-rose-600 text-white px-3.5 py-2 rounded-md text-xs font-semibold hover:bg-rose-700 transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
        >
          <Plus size={14} /> Nova Proposta Padrão
        </button>
      </div>

      {/* Lista de Propostas Padrão */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {proposalTemplates.length === 0 && (
          <div className="col-span-full bg-white rounded-lg border border-slate-200 p-8 text-center text-sm text-slate-400">
            Nenhuma proposta padrão cadastrada ainda.
          </div>
        )}
        {proposalTemplates.map((t) => (
          <div
            key={t.id}
            className="bg-white rounded-lg border border-slate-200 p-4 flex flex-col justify-between gap-3 shadow-xs hover:border-slate-300 transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-md bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0 mt-0.5">
                  <FileText size={18} className="text-rose-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-800 text-sm">{t.title}</span>
                    {t.product && (
                      <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 font-medium">
                        {t.product}
                      </span>
                    )}
                  </div>
                  {t.subtitle && <div className="text-xs text-slate-500 mt-1">{t.subtitle}</div>}
                  {(t.horario || t.periodo) && (
                    <div className="text-[11px] text-slate-400 mt-1">
                      {t.horario} {t.horario && t.periodo ? "·" : ""} {t.periodo}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(t)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                  title="Editar"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(t.id, t.title)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                  title="Excluir"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Badges de Arquivos */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-1 text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                <FileText size={12} className="text-rose-500" />
                <span className="truncate max-w-[140px] font-medium">{t.pdfFileName || "Nenhum PDF"}</span>
              </div>
              <div className="flex items-center gap-1 text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                <FileSpreadsheet size={12} className="text-emerald-600" />
                <span className="truncate max-w-[140px] font-medium">{t.xlsFileName || "Nenhum Excel"}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Cadastro/Edição */}
      {showModal && (
        <div
          className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-150 pb-3">
              <h3 className="font-semibold text-slate-800 text-sm">
                {editingItem ? "Editar Proposta Padrão" : "Cadastrar Nova Proposta Padrão"}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Título da Proposta *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Ex: Patrocínio SuperPop"
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-slate-350"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Produto Associado</label>
                  <input
                    type="text"
                    value={form.product}
                    onChange={(e) => setForm({ ...form, product: e.target.value })}
                    placeholder="Ex: Superpop"
                    className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-slate-350"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Período</label>
                  <input
                    type="text"
                    value={form.periodo}
                    onChange={(e) => setForm({ ...form, periodo: e.target.value })}
                    placeholder="Ex: 12 meses"
                    className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-slate-350"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Horário / Exibição</label>
                <input
                  type="text"
                  value={form.horario}
                  onChange={(e) => setForm({ ...form, horario: e.target.value })}
                  placeholder="Ex: Quarta-feira, 22h45"
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-slate-350"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Subtítulo / Descrição Resumida</label>
                <input
                  type="text"
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  placeholder="Ex: Cota nacional + cota de patrocínio local..."
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-slate-350"
                />
              </div>

              {/* Seção de Uploads */}
              <div className="border-t border-slate-150 pt-3 mt-1 flex flex-col gap-3">
                <div className="text-xs font-semibold text-slate-700">Arquivos da Proposta</div>

                {/* Upload PDF */}
                <div className="bg-slate-50 border border-slate-200 rounded-md p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                      <FileText size={14} className="text-rose-600" /> Arquivo PDF
                    </div>
                    {form.pdfFileName && (
                      <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 size={12} /> {form.pdfFileName}
                      </span>
                    )}
                  </div>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handlePdfFileChange}
                    className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100 cursor-pointer w-full"
                  />
                </div>

                {/* Upload Excel */}
                <div className="bg-slate-50 border border-slate-200 rounded-md p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                      <FileSpreadsheet size={14} className="text-emerald-600" /> Planilha Excel (.xlsx)
                    </div>
                    {form.xlsFileName && (
                      <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 size={12} /> {form.xlsFileName}
                      </span>
                    )}
                  </div>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleXlsFileChange}
                    className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer w-full"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-slate-150">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-2 text-xs border border-slate-200 text-slate-600 rounded-md hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-xs bg-rose-600 text-white font-semibold rounded-md hover:bg-rose-700 flex items-center gap-1.5 disabled:opacity-50"
                >
                  {saving && <Loader2 size={12} className="animate-spin" />}
                  {editingItem ? "Salvar Alterações" : "Cadastrar Proposta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
