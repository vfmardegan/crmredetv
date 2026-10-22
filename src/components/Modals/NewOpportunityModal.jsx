import React, { useState } from "react";
import { X, Paperclip, Trash2, Upload, FileText, Loader2 } from "lucide-react";
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
import { uploadFileInChunks } from "../../services/api";

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
  editingOppId,
}) {
  const tvProducts       = (allProducts?.televisao?.length  > 0 ? allProducts.televisao  : TV_PRODUCTS).slice().sort((a,b) => a.localeCompare(b, 'pt-BR'));
  const digitalProducts  = (allProducts?.digital?.length    > 0 ? allProducts.digital    : DIGITAL_PRODUCTS).slice().sort((a,b) => a.localeCompare(b, 'pt-BR'));
  const specialProjects  = (allProducts?.especiais?.length  > 0 ? allProducts.especiais  : SPECIAL_PROJECTS).slice().sort((a,b) => a.localeCompare(b, 'pt-BR'));

  const [tvExpanded, setTvExpanded] = useState(false);
  const [digitalExpanded, setDigitalExpanded] = useState(false);
  const [specialExpanded, setSpecialExpanded] = useState(false);
  const [periodViewYear, setPeriodViewYear] = useState(2026);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState("");

  if (!show) return null;

  async function handleFileAttach(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    e.target.value = "";
    setIsUploading(true);
    if (setErrorMsg) setErrorMsg("");

    try {
      for (const file of files) {
        setUploadProgressText(`Enviando ${file.name} (0%)...`);
        const uploaded = await uploadFileInChunks(file, (pct) => {
          setUploadProgressText(`Enviando ${file.name} (${pct}%)...`);
        });

        if (uploaded?.fileUrl) {
          const fileObj = {
            id: "att-" + Math.random().toString(36).slice(2, 9),
            name: file.name,
            url: uploaded.fileUrl,
            type: file.type || "application/octet-stream",
            size: file.size,
          };
          setNewOppForm((prev) => ({
            ...prev,
            attachments: [...(prev.attachments || []), fileObj],
          }));
        } else {
          throw new Error("Não foi possível processar o upload do arquivo.");
        }
      }
    } catch (err) {
      console.error("Erro no upload de anexo:", err);
      if (setErrorMsg) {
        setErrorMsg("Falha ao anexar arquivo: " + (err.message || ""));
      } else {
        alert("Falha ao anexar arquivo: " + (err.message || ""));
      }
    } finally {
      setIsUploading(false);
      setUploadProgressText("");
    }
  }

  function removeAttachment(attId) {
    if (isUploading) return;
    setNewOppForm((prev) => ({
      ...prev,
      attachments: (prev.attachments || []).filter((a) => (a.id || a.name) !== attId),
    }));
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-opp-title"
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center sm:items-start justify-center z-50 overflow-y-auto p-3 sm:p-6 md:py-8"
    >
      <form onSubmit={onSubmit} onClick={(e) => e.stopPropagation()} className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-lg max-h-[92vh] overflow-y-auto flex flex-col gap-4 shadow-xl my-auto sm:my-0">
        <div className="flex items-center justify-between mb-1">
          <h2 id="modal-opp-title" className="font-semibold text-slate-800 text-base">
            {editingOppId ? "Editar Oportunidade" : "Nova Oportunidade"}
          </h2>
          <button
            type="button"
            aria-label="Fechar modal"
            onClick={() => { setErrorMsg(""); onClose(); }}
            className="p-1 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-md text-xs flex items-center justify-between">
            <span>{errorMsg}</span>
            <button type="button" aria-label="Dispensar aviso de erro" onClick={() => setErrorMsg("")} className="text-rose-500 hover:text-rose-700 font-bold ml-2">X</button>
          </div>
        )}

        <div>
          <label className="text-xs text-slate-700 font-medium mb-1 block">Nome da oportunidade</label>
          <input
            required
            placeholder="Ex: Patrocínio TV Fama"
            value={newOppForm.title}
            onChange={(e) => setNewOppForm({ ...newOppForm, title: e.target.value })}
            className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs text-slate-700 font-medium mb-1 block">Executivo</label>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            className="w-full flex items-center justify-between text-xs text-slate-700 font-medium mb-1"
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
                      : "border-slate-200 text-slate-700")
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
            className="w-full flex items-center justify-between text-xs text-slate-700 font-medium mb-1"
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
                      : "border-slate-200 text-slate-700")
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
            className="w-full flex items-center justify-between text-xs text-slate-700 font-medium mb-1"
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
                      : "border-slate-200 text-slate-700")
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
          <label className="text-xs text-slate-700 font-medium mb-1 block">Investimento previsto</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 font-medium">R$</span>
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
          <label className="text-xs text-slate-700 font-medium mb-1 block">Período</label>
          <div className="flex flex-col gap-2">
            <div>
              <div className="text-xs text-slate-600 font-medium mb-1">Ano exibido</div>
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

        {/* Switch: Solicitar proposta ao planejamento */}
        <div className="bg-slate-50 border border-slate-200 rounded-md p-3 flex items-center justify-between mt-1">
          <div className="text-xs font-semibold text-slate-800">Solicitar proposta ao planejamento</div>
          <button
            type="button"
            onClick={() => setNewOppForm((prev) => ({ ...prev, solicitarPlanejamento: !prev.solicitarPlanejamento }))}
            className={"w-9 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer " + (newOppForm.solicitarPlanejamento ? "bg-rose-600" : "bg-slate-300")}
          >
            <div className={"bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out " + (newOppForm.solicitarPlanejamento ? "translate-x-4" : "translate-x-0")} />
          </button>
        </div>

        {newOppForm.solicitarPlanejamento ? (
          <>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs text-slate-700 block font-semibold">Briefing para o planejamento comercial *</label>
                <AudioRecorder
                  onTranscribeComplete={(result) => {
                    const text = result?.transcription || result?.transcricao || result?.briefing || result?.text || "";
                    if (!text) return;
                    setNewOppForm((prev) => ({
                      ...prev,
                      briefing: prev.briefing ? `${prev.briefing}\n\n${text}` : text,
                    }));
                  }}
                  onError={(err) => alert(err)}
                />
              </div>
              <textarea
                required
                value={newOppForm.briefing}
                onChange={(e) => setNewOppForm({ ...newOppForm, briefing: e.target.value })}
                placeholder="Descreva o contexto da negociação, expectativas do cliente..."
                rows={4}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm resize-y"
              />
            </div>

            <div className="border border-slate-200 rounded-md p-3 bg-slate-50 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Paperclip size={14} className="text-rose-600" /> Anexar Arquivos
                </div>
                <label className={"text-xs bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium px-2.5 py-1 rounded-md cursor-pointer flex items-center gap-1 transition-all " + (isUploading ? "opacity-50 pointer-events-none" : "")}>
                  {isUploading ? (
                    <>
                      <Loader2 size={12} className="animate-spin text-rose-600" />
                      <span>{uploadProgressText || "Enviando..."}</span>
                    </>
                  ) : (
                    <>
                      <Upload size={12} /> Escolher
                    </>
                  )}
                  <input type="file" multiple onChange={handleFileAttach} disabled={isUploading} className="hidden" />
                </label>
              </div>

              {isUploading && (
                <div className="flex items-center gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded px-2.5 py-1.5 animate-pulse">
                  <Loader2 size={13} className="animate-spin shrink-0 text-rose-600" />
                  <span>{uploadProgressText || "Enviando anexo de forma segura (imune ao WAF)..."}</span>
                </div>
              )}

              {(newOppForm.attachments || []).map((att) => (
                <div key={att.id || att.name} className="flex items-center justify-between bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-700">
                  <div className="flex items-center gap-2 truncate">
                    <FileText size={14} className="text-rose-500 shrink-0" />
                    <span className="truncate">{att.name}</span>
                  </div>
                  <button type="button" onClick={() => removeAttachment(att.id || att.name)} disabled={isUploading} className="text-slate-400 hover:text-rose-600 cursor-pointer"><Trash2 size={13} /></button>
                </div>
              ))}
            </div>

            {/* 03 Datas quando switch acionado: Criação, Entrega, Fechamento */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-700 font-medium mb-1 block">Data de criação</label>
                <input
                  type="date"
                  value={newOppForm.createdAt}
                  disabled
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-xs bg-slate-50 text-slate-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-700 mb-1 block font-semibold">Data de entrega *</label>
                <input
                  type="date"
                  required
                  value={newOppForm.deliveryDate || ""}
                  onChange={(e) => setNewOppForm({ ...newOppForm, deliveryDate: e.target.value })}
                  className="w-full border border-slate-200 rounded-md px-2.5 py-2 text-xs"
                />
              </div>
              <div>
                <label className="text-xs text-slate-700 mb-1 block font-semibold">Previsão fechamento</label>
                <input
                  type="date"
                  value={newOppForm.expectedCloseDate || ""}
                  onChange={(e) => setNewOppForm({ ...newOppForm, expectedCloseDate: e.target.value })}
                  className="w-full border border-slate-200 rounded-md px-2.5 py-2 text-xs"
                />
              </div>
            </div>
          </>
        ) : (
          /* 02 Datas quando switch não acionado: Criação, Fechamento */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-700 font-medium mb-1 block">Data de criação</label>
              <input
                type="date"
                value={newOppForm.createdAt || ""}
                disabled
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-xs bg-slate-50 text-slate-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-700 mb-1 block font-semibold">Previsão de fechamento *</label>
              <input
                type="date"
                required
                value={newOppForm.expectedCloseDate || ""}
                onChange={(e) => setNewOppForm({ ...newOppForm, expectedCloseDate: e.target.value })}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-xs"
              />
            </div>
          </div>
        )}

        {/* Seção Estágio / Temperatura do Projeto */}
        <div>
          <label className="text-xs text-slate-700 mb-1.5 block font-semibold">
            {editingOppId ? "Estágio no Pipeline Comercial *" : "Temperatura do projeto *"}
          </label>
          {editingOppId ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1.5 sm:gap-2">
              {[
                { value: "Desenvolvimento", label: "Desenvolvimento", style: "border-slate-300 bg-slate-100 text-slate-700 font-semibold" },
                { value: "Frio", label: "❄️ Frio", style: "border-sky-300 bg-sky-50 text-sky-700 font-semibold" },
                { value: "Morno", label: "⛅ Morno", style: "border-amber-300 bg-amber-50 text-amber-700 font-semibold" },
                { value: "Quente", label: "🔥 Quente", style: "border-rose-300 bg-rose-50 text-rose-700 font-semibold" },
                { value: "Fechado", label: "✅ Fechado", style: "border-emerald-300 bg-emerald-50 text-emerald-700 font-semibold" },
                { value: "Negado", label: "❌ Negado", style: "border-gray-300 bg-gray-100 text-gray-700 font-semibold" },
              ].map((item) => {
                const currentStage = newOppForm.stage || newOppForm.temperatura || "Morno";
                const selected = currentStage === item.value;
                return (
                  <button
                    type="button"
                    key={item.value}
                    onClick={() =>
                      setNewOppForm((prev) => ({
                        ...prev,
                        stage: item.value,
                        temperatura: ["Quente", "Morno", "Frio"].includes(item.value) ? item.value : prev.temperatura,
                      }))
                    }
                    className={
                      "py-2 px-1 text-[11px] rounded-md border text-center transition-all cursor-pointer truncate " +
                      (selected
                        ? item.style + " shadow-sm ring-1 ring-offset-1 ring-slate-300"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50")
                    }
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "Quente", label: "🔥 Quente", style: "border-rose-300 bg-rose-50 text-rose-700 font-semibold" },
                { value: "Morno", label: "⛅ Morno", style: "border-amber-300 bg-amber-50 text-amber-700 font-semibold" },
                { value: "Frio", label: "❄️ Frio", style: "border-sky-300 bg-sky-50 text-sky-700 font-semibold" },
              ].map((item) => {
                const selected = (newOppForm.temperatura || "Morno") === item.value;
                return (
                  <button
                    type="button"
                    key={item.value}
                    onClick={() => setNewOppForm((prev) => ({ ...prev, temperatura: item.value, stage: item.value }))}
                    className={
                      "py-2 text-xs rounded-md border text-center transition-all cursor-pointer " +
                      (selected
                        ? item.style + " shadow-sm ring-1 ring-offset-1 ring-slate-300"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50")
                    }
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isUploading}
          className={"w-full bg-slate-900 text-white rounded-md py-2 text-sm mt-1 hover:bg-slate-800 transition-all flex items-center justify-center gap-2 " + (isUploading ? "opacity-60 cursor-not-allowed" : "cursor-pointer")}
        >
          {isUploading && <Loader2 size={15} className="animate-spin text-rose-500" />}
          {isUploading ? (uploadProgressText || "Enviando anexo...") : (editingOppId ? "Salvar Alterações" : "Salvar oportunidade")}
        </button>
      </form>
    </div>
  );
}
