import React, { useState } from "react";
import { X } from "lucide-react";
import {
  DIRECT_CLIENT_OPTION,
  DIRECT_CLIENT_ID,
  TV_PRODUCTS,
  DIGITAL_PRODUCTS,
  SPECIAL_PROJECTS,
  YEARS,
  MONTHS,
  formatThousandsBR,
  formatPeriod,
  toggleArrayValue
} from "../../utils/helpers";
import { ClientSearchField, ContactSearchField } from "../UI/SearchFields";
import AudioRecorder from "../AudioRecorder";

export default function NewOpportunityModal({
  show,
  onClose,
  onSubmit,
  newOppForm,
  setNewOppForm,
  executivos,
  advertisers,
  availableContacts,
  openCreateClientForOpportunity,
  openCreateContactForOpportunity,
  errorMsg,
  setErrorMsg,
  allProducts,
}) {
  // Usa produtos do backend se disponível, senão cai no fallback estático
  const tvProducts       = (allProducts?.televisao?.length  > 0 ? allProducts.televisao  : TV_PRODUCTS).slice().sort((a,b) => a.localeCompare(b, 'pt-BR'));
  const digitalProducts  = (allProducts?.digital?.length    > 0 ? allProducts.digital    : DIGITAL_PRODUCTS).slice().sort((a,b) => a.localeCompare(b, 'pt-BR'));
  const specialProjects  = (allProducts?.especiais?.length  > 0 ? allProducts.especiais  : SPECIAL_PROJECTS).slice().sort((a,b) => a.localeCompare(b, 'pt-BR'));

  const [tvExpanded, setTvExpanded] = useState(false);
  const [digitalExpanded, setDigitalExpanded] = useState(false);
  const [specialExpanded, setSpecialExpanded] = useState(false);
  const [periodViewYear, setPeriodViewYear] = useState(2026);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/30 flex items-start justify-center z-50 overflow-y-auto py-8" onClick={() => { setErrorMsg(""); onClose(); }}>
      <form onSubmit={onSubmit} onClick={(e) => e.stopPropagation()} className="bg-white rounded-lg p-6 w-full max-w-lg flex flex-col gap-4">
        <div className="flex items-center justify-between mb-1">
          <div className="font-medium text-slate-800">Nova Oportunidade</div>
          <button type="button" onClick={() => { setErrorMsg(""); onClose(); }}><X size={16} className="text-slate-400" /></button>
        </div>

        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-md text-xs flex items-center justify-between">
            <span>{errorMsg}</span>
            <button type="button" onClick={() => setErrorMsg("")} className="text-rose-450 hover:text-rose-600 font-bold ml-2">X</button>
          </div>
        )}

        <div>
          <label className="text-xs text-slate-500 mb-1 block">Nome da oportunidade</label>
          <input
            required
            placeholder="Ex: Patrocínio novela das 21h"
            value={newOppForm.title}
            onChange={(e) => setNewOppForm({ ...newOppForm, title: e.target.value })}
            className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs text-slate-500 mb-1 block">Executivo</label>
          <select
            required
            value={newOppForm.executivo}
            onChange={(e) => setNewOppForm({ ...newOppForm, executivo: e.target.value })}
            className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
          >
            <option value="">
              {executivos.length === 0 ? "Cadastre um executivo na aba Executivos primeiro" : "Selecionar executivo"}
            </option>
            {executivos.map((ex) => (
              <option key={ex.id} value={ex.nome}>{ex.nome}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <ClientSearchField
            label="Agência"
            type="Agência"
            required
            directOption={DIRECT_CLIENT_OPTION}
            advertisers={advertisers}
            valueId={newOppForm.agencyId}
            onSelect={(id) => setNewOppForm((prev) => ({ ...prev, agencyId: id, contactId: "" }))}
            onCreateNew={(text) => openCreateClientForOpportunity("agencyId", "Agência", text)}
            placeholder="Buscar agência ou Cliente Direto"
          />
          <ClientSearchField
            label="Anunciante"
            type="Anunciante"
            required
            advertisers={advertisers}
            valueId={newOppForm.advertiserId}
            onSelect={(id) => setNewOppForm((prev) => ({ ...prev, advertiserId: id, contactId: "" }))}
            onCreateNew={(text) => openCreateClientForOpportunity("advertiserId", "Anunciante", text)}
            placeholder="Buscar anunciante"
          />
        </div>

        <div>
          <ContactSearchField
            label="Contato"
            options={availableContacts}
            valueId={newOppForm.contactId}
            onSelect={(id) => setNewOppForm((prev) => ({ ...prev, contactId: id }))}
            onCreateNew={(text) => openCreateContactForOpportunity(text)}
            disabled={!newOppForm.advertiserId && !(newOppForm.agencyId && newOppForm.agencyId !== DIRECT_CLIENT_ID)}
          />
        </div>

        <div>
          <button
            type="button"
            onClick={() => setTvExpanded((v) => !v)}
            className="w-full flex items-center justify-between text-xs text-slate-500 mb-1"
          >
            <span>
              Televisão{newOppForm.products.filter((p) => tvProducts.includes(p)).length > 0 &&
                ` (${newOppForm.products.filter((p) => tvProducts.includes(p)).length} selecionado${newOppForm.products.filter((p) => tvProducts.includes(p)).length !== 1 ? "s" : ""})`}
            </span>
            <span className="text-rose-600 font-medium">{tvExpanded ? "Recolher ▲" : "Selecionar ▼"}</span>
          </button>
          {!tvExpanded && newOppForm.products.filter((p) => tvProducts.includes(p)).length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {newOppForm.products.filter((p) => tvProducts.includes(p)).map((p) => (
                <span key={p} className="text-xs bg-rose-50 border border-rose-200 text-rose-700 px-2 py-0.5 rounded-md">{p}</span>
              ))}
            </div>
          )}
          {tvExpanded && (
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto border border-slate-100 rounded-md p-2">
              {tvProducts.map((p) => (
                <label
                  key={p}
                  className={
                    "flex items-center gap-1.5 text-xs border rounded-md px-2 py-1 cursor-pointer " +
                    (newOppForm.products.includes(p)
                      ? "bg-rose-50 border-rose-300 text-rose-700"
                      : "border-slate-200 text-slate-600")
                  }
                >
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={newOppForm.products.includes(p)}
                    onChange={() => setNewOppForm((prev) => ({ ...prev, products: toggleArrayValue(prev.products, p) }))}
                  />
                  {p}
                </label>
              ))}
            </div>
          )}
        </div>

        <div>
          <button
            type="button"
            onClick={() => setDigitalExpanded((v) => !v)}
            className="w-full flex items-center justify-between text-xs text-slate-500 mb-1"
          >
            <span>
              Digital{newOppForm.products.filter((p) => digitalProducts.includes(p)).length > 0 &&
                ` (${newOppForm.products.filter((p) => digitalProducts.includes(p)).length} selecionado${newOppForm.products.filter((p) => digitalProducts.includes(p)).length !== 1 ? "s" : ""})`}
            </span>
            <span className="text-rose-600 font-medium">{digitalExpanded ? "Recolher ▲" : "Selecionar ▼"}</span>
          </button>
          {!digitalExpanded && newOppForm.products.filter((p) => digitalProducts.includes(p)).length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {newOppForm.products.filter((p) => digitalProducts.includes(p)).map((p) => (
                <span key={p} className="text-xs bg-rose-50 border border-rose-200 text-rose-700 px-2 py-0.5 rounded-md">{p}</span>
              ))}
            </div>
          )}
          {digitalExpanded && (
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto border border-slate-100 rounded-md p-2">
              {digitalProducts.map((p) => (
                <label
                  key={p}
                  className={
                    "flex items-center gap-1.5 text-xs border rounded-md px-2 py-1 cursor-pointer " +
                    (newOppForm.products.includes(p)
                      ? "bg-rose-50 border-rose-300 text-rose-700"
                      : "border-slate-200 text-slate-600")
                  }
                >
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={newOppForm.products.includes(p)}
                    onChange={() => setNewOppForm((prev) => ({ ...prev, products: toggleArrayValue(prev.products, p) }))}
                  />
                  {p}
                </label>
              ))}
            </div>
          )}
        </div>

        <div>
          <button
            type="button"
            onClick={() => setSpecialExpanded((v) => !v)}
            className="w-full flex items-center justify-between text-xs text-slate-500 mb-1"
          >
            <span>
              Projetos Especiais{newOppForm.products.filter((p) => specialProjects.includes(p)).length > 0 &&
                ` (${newOppForm.products.filter((p) => specialProjects.includes(p)).length} selecionado${newOppForm.products.filter((p) => specialProjects.includes(p)).length !== 1 ? "s" : ""})`}
            </span>
            <span className="text-rose-600 font-medium">{specialExpanded ? "Recolher ▲" : "Selecionar ▼"}</span>
          </button>
          {!specialExpanded && newOppForm.products.filter((p) => specialProjects.includes(p)).length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {newOppForm.products.filter((p) => specialProjects.includes(p)).map((p) => (
                <span key={p} className="text-xs bg-rose-50 border border-rose-200 text-rose-700 px-2 py-0.5 rounded-md">{p}</span>
              ))}
            </div>
          )}
          {specialExpanded && (
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto border border-slate-100 rounded-md p-2">
              {specialProjects.map((p) => (
                <label
                  key={p}
                  className={
                    "flex items-center gap-1.5 text-xs border rounded-md px-2 py-1 cursor-pointer " +
                    (newOppForm.products.includes(p)
                      ? "bg-rose-50 border-rose-300 text-rose-700"
                      : "border-slate-200 text-slate-600")
                  }
                >
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={newOppForm.products.includes(p)}
                    onChange={() => setNewOppForm((prev) => ({ ...prev, products: toggleArrayValue(prev.products, p) }))}
                  />
                  {p}
                </label>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="text-xs text-slate-500 mb-1 block">Investimento previsto</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">R$</span>
            <input
              type="text"
              required
              inputMode="numeric"
              placeholder="0"
              value={formatThousandsBR(newOppForm.value)}
              onChange={(e) => setNewOppForm({ ...newOppForm, value: e.target.value.replace(/\D/g, "") })}
              className="w-full border border-slate-200 rounded-md pl-9 pr-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-500 mb-1 block">Período</label>
          <div className="flex flex-col gap-2">
            <div>
              <div className="text-xs text-slate-400 mb-1">Ano exibido</div>
              <div className="flex flex-wrap gap-2">
                {YEARS.map((y) => (
                  <button
                    type="button"
                    key={y}
                    onClick={() => setPeriodViewYear(y)}
                    className={
                      "text-xs border rounded-md px-2 py-1 " +
                      (periodViewYear === y
                        ? "bg-slate-900 border-slate-900 text-white"
                        : "border-slate-200 text-slate-600")
                    }
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">Meses de {periodViewYear}</div>
              <div className="grid grid-cols-4 gap-1.5">
                {MONTHS.map((m) => {
                  const code = `${periodViewYear}-${m}`;
                  return (
                    <label
                      key={m}
                      className={
                        "flex items-center justify-center gap-1 text-xs border rounded-md px-2 py-1 cursor-pointer " +
                        (newOppForm.periodMonths.includes(code)
                          ? "bg-rose-50 border-rose-300 text-rose-700"
                          : "border-slate-200 text-slate-600")
                      }
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={newOppForm.periodMonths.includes(code)}
                        onChange={() => setNewOppForm((prev) => ({ ...prev, periodMonths: toggleArrayValue(prev.periodMonths, code) }))}
                      />
                      {m}
                    </label>
                  );
                })}
              </div>
            </div>
            {newOppForm.periodMonths.length > 0 && (
              <div className="text-xs text-slate-500">
                Selecionado: {formatPeriod(newOppForm.periodMonths)}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs text-slate-500 block font-semibold">Briefing para o planejamento comercial</label>
            <AudioRecorder
              onTranscribeComplete={(result) => {
                setNewOppForm((prev) => ({
                  ...prev,
                  briefing: `Briefing gerado por IA a partir de gravação:\n\n${result.briefing}\n\nPróxima Ação:\n${result.proxima_acao}`
                }));
              }}
              onError={(err) => alert(err)}
            />
          </div>
          <textarea
            required
            value={newOppForm.briefing}
            onChange={(e) => setNewOppForm({ ...newOppForm, briefing: e.target.value })}
            placeholder="Descreva o contexto da negociação, expectativas do cliente, formatos de interesse, referências de campanhas anteriores e qualquer detalhe relevante para a equipe de planejamento montar a proposta."
            rows={5}
            className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm resize-y"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Data de criação</label>
            <input
              type="date"
              value={newOppForm.createdAt}
              disabled
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-slate-50 text-slate-400"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Data de entrega</label>
            <input
              type="date"
              required
              value={newOppForm.deliveryDate}
              onChange={(e) => setNewOppForm({ ...newOppForm, deliveryDate: e.target.value })}
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Previsão de fechamento</label>
            <input
              type="date"
              required
              value={newOppForm.expectedCloseDate}
              onChange={(e) => setNewOppForm({ ...newOppForm, expectedCloseDate: e.target.value })}
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>

        <button type="submit" className="w-full bg-slate-900 text-white rounded-md py-2 text-sm mt-1 hover:bg-slate-800">Salvar oportunidade</button>
      </form>
    </div>
  );
}
