import React from "react";
import { X } from "lucide-react";
import { DECISION_LEVELS, formatCelular, HOBBIES, toggleMultiWithNone, SPORTS } from "../../utils/helpers";
import { AnyClientSearchField } from "../UI/SearchFields";

export default function NewContactModal({
  show,
  onClose,
  onSubmit,
  newContactForm,
  setNewContactForm,
  advertisers,
  openCreateClientForContact,
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/30 flex items-start justify-center z-50 overflow-y-auto py-8" style={{ zIndex: 60 }} onClick={onClose}>
      <form onSubmit={onSubmit} onClick={(e) => e.stopPropagation()} className="bg-white rounded-lg p-6 w-full max-w-lg flex flex-col gap-4">
        <div className="flex items-center justify-between mb-1">
          <div className="font-medium text-slate-800">Novo Contato</div>
          <button type="button" onClick={onClose}><X size={16} className="text-slate-400" /></button>
        </div>

        <div>
          <label className="text-xs text-slate-500 mb-1 block">Nome</label>
          <input
            required
            placeholder="Nome completo"
            value={newContactForm.name}
            onChange={(e) => setNewContactForm({ ...newContactForm, name: e.target.value })}
            className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div>
          <AnyClientSearchField
            label="Empresa"
            advertisers={advertisers}
            valueId={newContactForm.clientId}
            onSelect={(id) => setNewContactForm({ ...newContactForm, clientId: id })}
            onCreateNew={(text) => openCreateClientForContact(text)}
            placeholder="Buscar agência ou anunciante..."
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Cargo</label>
            <input
              placeholder="Cargo"
              value={newContactForm.cargo}
              onChange={(e) => setNewContactForm({ ...newContactForm, cargo: e.target.value })}
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Departamento</label>
            <input
              placeholder="Departamento"
              value={newContactForm.departamento}
              onChange={(e) => setNewContactForm({ ...newContactForm, departamento: e.target.value })}
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-500 mb-1 block">Nível de decisão</label>
          <div className="flex flex-wrap gap-2">
            {DECISION_LEVELS.map((lvl) => (
              <label
                key={lvl}
                className={
                  "flex items-center gap-1.5 text-xs border rounded-md px-2 py-1 cursor-pointer " +
                  (newContactForm.nivelDecisao === lvl
                    ? "bg-rose-50 border-rose-300 text-rose-700"
                    : "border-slate-200 text-slate-600")
                }
              >
                <input
                  type="radio"
                  name="nivelDecisao"
                  className="hidden"
                  checked={newContactForm.nivelDecisao === lvl}
                  onChange={() => setNewContactForm((prev) => ({ ...prev, nivelDecisao: lvl }))}
                />
                {lvl}
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Celular</label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="(11) 98765-4321"
              value={formatCelular(newContactForm.celular)}
              onChange={(e) => setNewContactForm({ ...newContactForm, celular: e.target.value.replace(/\D/g, "").slice(0, 11) })}
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">E-mail</label>
            <input
              placeholder="nome@empresa.com.br"
              value={newContactForm.email}
              onChange={(e) => setNewContactForm({ ...newContactForm, email: e.target.value })}
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-500 mb-1 block">Hobbies</label>
          <div className="flex flex-wrap gap-2">
            {HOBBIES.map((h) => (
              <label
                key={h}
                className={
                  "flex items-center gap-1.5 text-xs border rounded-md px-2 py-1 cursor-pointer " +
                  (newContactForm.hobbies.includes(h)
                    ? "bg-rose-50 border-rose-300 text-rose-700"
                    : "border-slate-200 text-slate-600")
                }
              >
                <input
                  type="checkbox"
                  className="hidden"
                  checked={newContactForm.hobbies.includes(h)}
                  onChange={() => setNewContactForm((prev) => ({ ...prev, hobbies: toggleMultiWithNone(prev.hobbies, h) }))}
                />
                {h}
              </label>
            ))}
          </div>
          {newContactForm.hobbies.includes("Outros") && (
            <input
              type="text"
              placeholder="Qual hobby?"
              value={newContactForm.hobbiesOutro}
              onChange={(e) => setNewContactForm({ ...newContactForm, hobbiesOutro: e.target.value })}
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm mt-2"
            />
          )}
        </div>

        <div>
          <label className="text-xs text-slate-500 mb-1 block">Esportes</label>
          <div className="flex flex-wrap gap-2">
            {SPORTS.map((s) => (
              <label
                key={s}
                className={
                  "flex items-center gap-1.5 text-xs border rounded-md px-2 py-1 cursor-pointer " +
                  (newContactForm.esportes.includes(s)
                    ? "bg-rose-50 border-rose-300 text-rose-700"
                    : "border-slate-200 text-slate-600")
                }
              >
                <input
                  type="checkbox"
                  className="hidden"
                  checked={newContactForm.esportes.includes(s)}
                  onChange={() => setNewContactForm((prev) => ({ ...prev, esportes: toggleMultiWithNone(prev.esportes, s) }))}
                />
                {s}
              </label>
            ))}
          </div>
          {newContactForm.esportes.includes("Outros") && (
            <input
              type="text"
              placeholder="Qual esporte?"
              value={newContactForm.esportesOutro}
              onChange={(e) => setNewContactForm({ ...newContactForm, esportesOutro: e.target.value })}
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm mt-2"
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Time do coração</label>
            <input
              placeholder="Ex: Flamengo"
              value={newContactForm.timeCoracao}
              onChange={(e) => setNewContactForm({ ...newContactForm, timeCoracao: e.target.value })}
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Filhos</label>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={newContactForm.filhos}
              onChange={(e) => setNewContactForm({ ...newContactForm, filhos: e.target.value })}
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>

        <button type="submit" className="w-full bg-slate-900 text-white rounded-md py-2 text-sm mt-1 hover:bg-slate-800">Salvar contato</button>
      </form>
    </div>
  );
}
