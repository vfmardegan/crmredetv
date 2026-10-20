import React from "react";
import { X, Trash2, ChevronDown } from "lucide-react";
import { formatCNPJ, SEGMENTOS } from "../../utils/helpers";
import { MultiClientSearchField } from "../UI/SearchFields";

export default function NewAdvertiserModal({
  show,
  onClose,
  onSubmit,
  editingClientId,
  newAdvForm,
  setNewAdvForm,
  advertisers,
  openQuickCreateClient,
  currentUser,
  onDeleteClient,
}) {
  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-adv-title"
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto"
      style={{ zIndex: 65 }}
      onClick={onClose}
    >
      <form
        onSubmit={onSubmit}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl p-5 sm:p-6 w-full max-w-md max-h-[92vh] overflow-y-auto flex flex-col gap-3.5 shadow-2xl border border-slate-200 my-auto animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h2 id="modal-adv-title" className="font-bold text-slate-900 text-base">
            {editingClientId ? "Editar Cliente" : "Novo Cliente"}
          </h2>
          <button
            type="button"
            aria-label="Fechar modal"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tipo de Cliente */}
        <div>
          <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Tipo de cliente</label>
          <div className="relative">
            <select
              value={newAdvForm.type}
              onChange={(e) =>
                setNewAdvForm({
                  ...newAdvForm,
                  type: e.target.value,
                  segmento: e.target.value === "Agência" ? "" : newAdvForm.segmento,
                  atendeAnunciantes: e.target.value === "Agência" ? newAdvForm.atendeAnunciantes : [],
                  vinculoAgencias: e.target.value === "Anunciante" ? newAdvForm.vinculoAgencias : [],
                })
              }
              className="w-full h-10 appearance-none bg-white border border-slate-300 rounded-lg px-3.5 pr-9 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all cursor-pointer"
            >
              <option>Anunciante</option>
              <option>Agência</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Código */}
        <div>
          <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Código</label>
          <input
            type="number"
            placeholder="Ex: 1007"
            value={newAdvForm.codigo}
            onChange={(e) => setNewAdvForm({ ...newAdvForm, codigo: e.target.value })}
            className="w-full h-10 bg-white border border-slate-300 rounded-lg px-3.5 text-xs font-medium text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all font-mono"
          />
        </div>

        {/* Razão Social */}
        <div>
          <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Razão social</label>
          <input
            placeholder="Razão social (opcional)"
            value={newAdvForm.razaoSocial}
            onChange={(e) => setNewAdvForm({ ...newAdvForm, razaoSocial: e.target.value })}
            className="w-full h-10 bg-white border border-slate-300 rounded-lg px-3.5 text-xs font-medium text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
          />
        </div>

        {/* CNPJ */}
        <div>
          <label className="text-xs font-semibold text-slate-700 mb-1.5 block">CNPJ</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={18}
            placeholder="00.000.000/0000-00"
            value={formatCNPJ(newAdvForm.cnpj)}
            onChange={(e) => setNewAdvForm({ ...newAdvForm, cnpj: e.target.value.replace(/\D/g, "").slice(0, 14) })}
            className="w-full h-10 bg-white border border-slate-300 rounded-lg px-3.5 text-xs font-medium text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all font-mono"
          />
        </div>

        {/* Nome Fantasia */}
        <div>
          <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
            Nome fantasia <span className="text-rose-500 font-bold">*</span>
          </label>
          <input
            required
            placeholder="Nome fantasia"
            value={newAdvForm.nomeFantasia}
            onChange={(e) => setNewAdvForm({ ...newAdvForm, nomeFantasia: e.target.value })}
            className="w-full h-10 bg-white border border-slate-300 rounded-lg px-3.5 text-xs font-medium text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
          />
        </div>

        {/* Segmento */}
        {newAdvForm.type === "Anunciante" && (
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
              Segmento <span className="text-rose-500 font-bold">*</span>
            </label>
            <div className="relative">
              <select
                required
                value={newAdvForm.segmento}
                onChange={(e) => setNewAdvForm({ ...newAdvForm, segmento: e.target.value })}
                className="w-full h-10 appearance-none bg-white border border-slate-300 rounded-lg px-3.5 pr-9 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all cursor-pointer"
              >
                <option value="">Selecionar segmento</option>
                {SEGMENTOS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        )}

        {/* Anunciantes para Agência */}
        {newAdvForm.type === "Agência" && (
          <MultiClientSearchField
            label="Anunciantes"
            type="Anunciante"
            advertisers={advertisers}
            selectedIds={newAdvForm.atendeAnunciantes}
            onChange={(ids) => setNewAdvForm((prev) => ({ ...prev, atendeAnunciantes: ids }))}
            onCreateNew={(text) => openQuickCreateClient("Anunciante", text, "atendeAnunciantes")}
            placeholder="Buscar anunciante..."
          />
        )}

        {/* Agências para Anunciante */}
        {newAdvForm.type === "Anunciante" && (
          <MultiClientSearchField
            label="Agências"
            type="Agência"
            advertisers={advertisers}
            selectedIds={newAdvForm.vinculoAgencias}
            onChange={(ids) => setNewAdvForm((prev) => ({ ...prev, vinculoAgencias: ids }))}
            onCreateNew={(text) => openQuickCreateClient("Agência", text, "vinculoAgencias")}
            placeholder="Buscar agência..."
          />
        )}

        {/* Botões com altura h-10 e estilo padronizado */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
          <button
            type="submit"
            className="flex-1 h-10 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs flex items-center justify-center cursor-pointer"
          >
            {editingClientId ? "Salvar alterações" : "Salvar cliente"}
          </button>
          {editingClientId && currentUser?.perfil === "admin" && (
            <button
              type="button"
              onClick={() => onDeleteClient(editingClientId)}
              className="h-10 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Excluir cadastro (Apenas Administrador)"
            >
              <Trash2 size={14} />
              <span>Excluir</span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
