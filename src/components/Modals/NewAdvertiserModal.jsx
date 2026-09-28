import React from "react";
import { X, Trash2 } from "lucide-react";
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
      className="fixed inset-0 bg-slate-900/30 flex items-center justify-center z-50"
      style={{ zIndex: 65 }}
      onClick={onClose}
    >
      <form onSubmit={onSubmit} onClick={(e) => e.stopPropagation()} className="bg-white rounded-lg p-6 w-full max-w-sm flex flex-col gap-3">
        <div className="flex items-center justify-between mb-1">
          <h2 id="modal-adv-title" className="font-semibold text-slate-800 text-base">
            {editingClientId ? "Editar Cliente" : "Novo Cliente"}
          </h2>
          <button
            type="button"
            aria-label="Fechar modal"
            onClick={onClose}
            className="p-1 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div>
          <label className="text-xs text-slate-700 font-medium mb-1 block">Tipo de cliente</label>
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
            className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
          >
            <option>Agência</option>
            <option>Anunciante</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-slate-700 font-medium mb-1 block">Código</label>
          <input
            type="number"
            placeholder="Ex: 1007"
            value={newAdvForm.codigo}
            onChange={(e) => setNewAdvForm({ ...newAdvForm, codigo: e.target.value })}
            className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs text-slate-700 font-medium mb-1 block">Razão social *</label>
          <input
            required
            placeholder="Razão social"
            value={newAdvForm.razaoSocial}
            onChange={(e) => setNewAdvForm({ ...newAdvForm, razaoSocial: e.target.value })}
            className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs text-slate-700 font-medium mb-1 block">CNPJ</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={18}
            placeholder="00.000.000/0000-00"
            value={formatCNPJ(newAdvForm.cnpj)}
            onChange={(e) => setNewAdvForm({ ...newAdvForm, cnpj: e.target.value.replace(/\D/g, "").slice(0, 14) })}
            className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs text-slate-700 font-medium mb-1 block">Nome fantasia</label>
          <input
            placeholder="Nome fantasia (opcional)"
            value={newAdvForm.nomeFantasia}
            onChange={(e) => setNewAdvForm({ ...newAdvForm, nomeFantasia: e.target.value })}
            className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
          />
        </div>

        {newAdvForm.type === "Anunciante" && (
          <div>
            <label className="text-xs text-slate-700 font-medium mb-1 block">Segmento *</label>
            <select
              required
              value={newAdvForm.segmento}
              onChange={(e) => setNewAdvForm({ ...newAdvForm, segmento: e.target.value })}
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
            >
              <option value="">Selecionar segmento</option>
              {SEGMENTOS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        )}

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

        <div className="flex items-center gap-2 mt-2">
          <button type="submit" className="flex-1 bg-slate-900 text-white rounded-md py-2 text-sm font-semibold hover:bg-slate-800 transition-colors">
            {editingClientId ? "Salvar alterações" : "Salvar cliente"}
          </button>
          {editingClientId && currentUser?.perfil === "admin" && (
            <button
              type="button"
              onClick={() => onDeleteClient(editingClientId)}
              className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors"
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
