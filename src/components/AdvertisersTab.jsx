import React from "react";
import { X, Sparkles, Loader2, Mail, Calendar, FileText, Mic, ClipboardList, Phone, MessageCircle } from "lucide-react";
import AudioRecorder from "./AudioRecorder";
import {
  formatBRL,
  formatCNPJ,
  formatCelular,
  riskStyle,
  STAGE_STYLES,
  getClientInactivityStatus,
  getAgencyInactivityStatus
} from "../utils/helpers";

export default function AdvertisersTab({
  advertisers,
  opportunities,
  contacts,
  clientSearch,
  setClientSearch,
  filteredAdvertisers,
  selectedAdvertiserId,
  setSelectedAdvertiserId,
  getServedAdvertisers,
  getServingAgencies,
  openEditClient,
  addInteraction,
  noteDraft,
  setNoteDraft,
  summarizeInteraction,
  summarizingId,
  goToOpportunityInPipeline,
  setSelectedContactId,
  openScheduleMeeting,
  onTranscribeComplete,
  openSendCustomEmail,
  generateClientAiSummary,
  contactDaysFilter,
  setContactDaysFilter
}) {
  const selectedAdvertiser = advertisers.find((a) => a.id === selectedAdvertiserId);
  const [selectedType, setSelectedType] = React.useState("call");
  const [loadingSummary, setLoadingSummary] = React.useState(false);

  return (
    <div className="flex flex-col gap-3">
      <input
        type="text"
        value={clientSearch}
        onChange={(e) => setClientSearch(e.target.value)}
        placeholder="Buscar por nome fantasia, razão social, código ou CNPJ..."
        className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white"
      />
      {/* Filtro de dias sem contato */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        <span className="text-slate-400 font-medium whitespace-nowrap mr-1">Sem contato:</span>
        {[
          { key: "all", label: "Todos" },
          { key: "10",  label: "10 dias" },
          { key: "20",  label: "20 dias" },
          { key: "30",  label: "30 dias" },
        ].map((opt) => {
          const active = contactDaysFilter === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => setContactDaysFilter(opt.key)}
              className={`px-2.5 py-1 rounded-full border text-[10px] font-semibold transition-all shrink-0 ${
                active
                  ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                  : "bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100">
        {filteredAdvertisers.length === 0 && (
          <div className="p-6 text-sm text-slate-400 text-center">
            {advertisers.length === 0 ? "Nenhum cliente cadastrado ainda." : `Nenhum cliente encontrado para "${clientSearch}".`}
          </div>
        )}
        {filteredAdvertisers.map((a) => {
          const advOpps = opportunities.filter((o) => o.advertiserId === a.id || o.agencyId === a.id);
          const totalValue = advOpps.reduce((s, o) => s + o.value, 0);
          const relatedCount = a.type === "Agência" ? getServedAdvertisers(a).length : getServingAgencies(a.id).length;
          return (
            <button
              key={a.id}
              onClick={() => setSelectedAdvertiserId(a.id)}
              className="w-full text-left p-4 flex items-center justify-between hover:bg-slate-50"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-800">{a.nomeFantasia || a.razaoSocial}</span>
                  <span
                    className={
                      "text-xs px-1.5 py-0.5 rounded border " +
                      (a.type === "Agência"
                        ? "bg-violet-50 text-violet-700 border-violet-200"
                        : "bg-sky-50 text-sky-700 border-sky-200")
                    }
                  >
                    {a.type}
                  </span>
                  {(() => {
                    const status = a.type === "Agência"
                      ? getAgencyInactivityStatus(a, getServedAdvertisers(a))
                      : getClientInactivityStatus(a);
                    if (!status) return null;
                    return (
                      <span 
                        className={`text-[10px] px-1.5 py-0.5 rounded border font-medium flex items-center gap-0.5 uppercase tracking-wide ${status.badgeClass}`}
                        title={status.label}
                      >
                        <span>{status.icon}</span>
                        <span>
                          {status.level === 30 ? "Sem Contato +30" : status.level === 20 ? "Sem Contato +20" : "Sem Contato +10"}
                        </span>
                      </span>
                    );
                  })()}
                </div>
                {a.razaoSocial && <div className="text-xs text-slate-400 mt-0.5">{a.razaoSocial}</div>}
                {a.segmento && <div className="text-xs text-slate-400 mt-0.5">{a.segmento}</div>}
                {relatedCount > 0 && (
                  <div className="text-xs text-slate-400 mt-0.5">
                    {a.type === "Agência"
                      ? `Atende ${relatedCount} anunciante${relatedCount !== 1 ? "s" : ""}`
                      : `${relatedCount} agência${relatedCount !== 1 ? "s" : ""} vinculada${relatedCount !== 1 ? "s" : ""}`}
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-sm font-mono text-slate-700">{formatBRL(totalValue)}</div>
                <div className="text-xs text-slate-400">
                  {advOpps.length} oportunidade{advOpps.length !== 1 ? "s" : ""}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {selectedAdvertiser && (
        <div
          className="fixed inset-0 bg-slate-900/30 flex justify-end z-40"
          onClick={() => setSelectedAdvertiserId(null)}
        >
          <div className="w-full max-w-md bg-white h-full overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-lg font-semibold text-slate-800">{selectedAdvertiser.name}</span>
                  {(() => {
                    const status = selectedAdvertiser.type === "Agência"
                      ? getAgencyInactivityStatus(selectedAdvertiser, getServedAdvertisers(selectedAdvertiser))
                      : getClientInactivityStatus(selectedAdvertiser);
                    if (!status) return null;
                    return (
                      <span className={`text-xs px-2 py-0.5 rounded border font-medium flex items-center gap-1 ${status.badgeClass}`}>
                        <span>{status.icon}</span>
                        <span>{status.label}</span>
                      </span>
                    );
                  })()}
                </div>
                <div className="text-xs text-slate-500 mt-1">{selectedAdvertiser.razaoSocial}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditClient(selectedAdvertiser)}
                  className="text-xs border border-slate-200 text-slate-600 px-2.5 py-1.5 rounded-md hover:bg-slate-50"
                >
                  Editar
                </button>
                <button onClick={() => setSelectedAdvertiserId(null)} className="text-slate-400 hover:text-slate-700">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm mb-5">
              <div className="bg-slate-50 rounded-md p-3">
                <div className="text-xs text-slate-400">Código</div>
                <div className="text-slate-700 font-mono">{selectedAdvertiser.codigo || "—"}</div>
              </div>
              <div className="bg-slate-50 rounded-md p-3">
                <div className="text-xs text-slate-400">CNPJ</div>
                <div className="text-slate-700 font-mono">{selectedAdvertiser.cnpj ? formatCNPJ(selectedAdvertiser.cnpj) : "—"}</div>
              </div>
              {selectedAdvertiser.type === "Anunciante" && (
                <div className="bg-slate-50 rounded-md p-3 col-span-2">
                  <div className="text-xs text-slate-400">Segmento</div>
                  <div className="text-slate-700">{selectedAdvertiser.segmento || "—"}</div>
                </div>
              )}
            </div>

            <div className="bg-slate-50 rounded-md p-3 text-sm text-slate-600 mb-5 flex flex-col gap-2">
              <div className="text-xs font-medium text-slate-500">
                {selectedAdvertiser.type === "Agência" ? "Anunciantes atendidos" : "Agências vinculadas"}
              </div>
              {selectedAdvertiser.type === "Agência" ? (
                getServedAdvertisers(selectedAdvertiser).length === 0 ? (
                  <div className="text-xs text-slate-400">Nenhum anunciante vinculado ainda.</div>
                ) : (
                  getServedAdvertisers(selectedAdvertiser).map((rel) => (
                    <button
                      key={rel.id}
                      onClick={() => setSelectedAdvertiserId(rel.id)}
                      className="text-left text-slate-700 hover:text-rose-600"
                    >
                      {rel.name}
                    </button>
                  ))
                )
              ) : getServingAgencies(selectedAdvertiser.id).length === 0 ? (
                <div className="text-xs text-slate-400">Nenhuma agência vinculada ainda.</div>
              ) : (
                getServingAgencies(selectedAdvertiser.id).map((rel) => (
                  <button
                    key={rel.id}
                    onClick={() => setSelectedAdvertiserId(rel.id)}
                    className="text-left text-slate-700 hover:text-rose-600"
                  >
                    {rel.name}
                  </button>
                ))
              )}
            </div>

            <div className="bg-slate-50 rounded-md p-3 text-sm text-slate-600 mb-5 flex flex-col gap-2">
              <div className="text-xs font-medium text-slate-500">Contatos</div>
              {contacts.filter((c) => c.clientId === selectedAdvertiser.id).length === 0 && (
                <div className="text-xs text-slate-400">Nenhum contato cadastrado na aba Contatos para este cliente.</div>
              )}
              {contacts
                .filter((c) => c.clientId === selectedAdvertiser.id)
                .map((c) => (
                  <div key={c.id} className="flex items-center justify-between py-1 border-b border-slate-100/50 last:border-b-0">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAdvertiserId(null);
                        setSelectedContactId(c.id);
                      }}
                      className="text-left flex-1 hover:text-rose-600 pr-2"
                    >
                      <div className="font-semibold text-slate-700">{c.name} · {c.cargo}</div>
                      <div className="text-xs text-slate-400">{c.celular ? formatCelular(c.celular) : c.email || "Sem contato direto"}</div>
                    </button>
                    {c.email && (
                      <button
                        type="button"
                        onClick={() => openSendCustomEmail(c.id)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
                        title={`Enviar e-mail para ${c.name}`}
                      >
                        <Mail size={14} />
                      </button>
                    )}
                  </div>
                ))}
            </div>

            <div className="mb-8">
              <div className="text-xs font-medium text-slate-500 mb-2">Oportunidades</div>
              <div className="flex flex-col gap-2">
                {opportunities
                  .filter((o) => o.advertiserId === selectedAdvertiser.id || o.agencyId === selectedAdvertiser.id)
                  .sort((a, b) => {
                    const order = ["Fechado", "Quente", "Morno", "Frio", "Desenvolvimento", "Negado"];
                    const stageDiff = order.indexOf(a.stage) - order.indexOf(b.stage);
                    if (stageDiff !== 0) return stageDiff;
                    return b.value - a.value;
                  })
                  .map((o) => (
                    <button
                      key={o.id}
                      onClick={() => goToOpportunityInPipeline(o.id)}
                      className="w-full flex items-center justify-between text-sm border border-slate-100 rounded-md px-3 py-2 hover:border-rose-200 hover:bg-rose-50/40 text-left"
                    >
                      <span className="text-slate-700 hover:text-rose-700">{o.title}</span>
                      <span className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-mono text-slate-400">{formatBRL(o.value)}</span>
                        <span className={"text-xs px-1.5 py-0.5 rounded border " + STAGE_STYLES[o.stage]}>{o.stage}</span>
                      </span>
                    </button>
                  ))}
                {opportunities.filter((o) => o.advertiserId === selectedAdvertiser.id || o.agencyId === selectedAdvertiser.id).length === 0 && (
                  <div className="text-xs text-slate-300">Nenhuma oportunidade registrada.</div>
                )}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Registrar Nova Atividade</div>
              <div className="flex flex-col gap-2 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                {/* Seletor de Tipo de Interação */}
                <div className="flex gap-1 border-b border-slate-200/60 pb-2 mb-1 shrink-0 overflow-x-auto">
                  {[
                    { id: "call", label: "📞 Ligação" },
                    { id: "whatsapp", label: "💬 WhatsApp" },
                    { id: "meeting", label: "🤝 Reunião" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSelectedType(tab.id)}
                      className={`text-[10px] px-2.5 py-1 rounded-md font-semibold transition-colors shrink-0 ${
                        selectedType === tab.id
                          ? "bg-slate-900 text-white shadow-sm"
                          : "text-slate-550 hover:bg-slate-200"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <textarea
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  placeholder={
                    selectedType === "call" ? "Registrar resumo da ligação telefônica..." :
                    selectedType === "whatsapp" ? "Registrar resumo da conversa de WhatsApp..." :
                    selectedType === "meeting" ? "Registrar ata ou pontos acordados na reunião..." :
                    "Registrar nova atividade com este cliente..."
                  }
                  className="w-full text-sm border border-slate-250 rounded-md p-2 bg-white resize-none h-20 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />

                <div className="flex justify-between items-center mt-1">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        addInteraction(selectedAdvertiser.id, selectedType);
                        setSelectedType("call");
                      }}
                      className="text-xs bg-slate-900 text-white px-3 py-1.5 rounded-md hover:bg-slate-800 font-semibold shadow-sm transition-colors"
                    >
                      Salvar
                    </button>
                  </div>
                  <AudioRecorder
                    onTranscribeComplete={onTranscribeComplete}
                    onError={(err) => alert(err)}
                  />
                </div>
              </div>

              {/* Bloco Agendar Reunião */}
              <div className="flex items-center justify-between mb-4 mt-8 border-t border-slate-100 pt-4">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Agendar Reunião</div>
                <button
                  type="button"
                  onClick={() => openScheduleMeeting(selectedAdvertiser.id)}
                  className="text-xs border border-slate-200 text-slate-700 bg-white px-3 py-1.5 rounded-md hover:bg-slate-50 font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Calendar size={13} className="text-slate-400" />
                  Enviar Invite
                </button>
              </div>

              {/* Bloco Enviar Proposta */}
              <div className="flex items-center justify-between mb-4 mt-4 pt-4 border-t border-slate-100/60">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Enviar Proposta</div>
                <button
                  type="button"
                  onClick={() => {
                    const clientContacts = contacts.filter(c => c.clientId === selectedAdvertiser.id);
                    if (clientContacts.length === 0) {
                      alert("Por favor, cadastre um contato na aba Contatos para este cliente antes de enviar uma proposta.");
                      return;
                    }
                    openSendCustomEmail(clientContacts[0].id, true);
                  }}
                  className="text-xs border border-slate-200 text-slate-700 bg-white px-3 py-1.5 rounded-md hover:bg-slate-50 font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Mail size={13} className="text-slate-400" />
                  Enviar Proposta
                </button>
              </div>

              {/* Divisor Fino */}
              <div className="border-t border-slate-150 my-6"></div>

              {/* Resumo Executivo IA Consolidado */}
              <div className="bg-slate-50 border border-slate-200/65 rounded-xl p-4 mb-4 mt-0 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
                
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="text-indigo-500 animate-pulse" size={15} />
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Resumo Executivo da IA
                    </span>
                  </div>
                  
                  <button
                    type="button"
                    disabled={loadingSummary}
                    onClick={async () => {
                      setLoadingSummary(true);
                      try {
                        await generateClientAiSummary(selectedAdvertiser.id);
                      } catch (err) {
                        alert("Não foi possível gerar o resumo comercial: " + err.message);
                      } finally {
                        setLoadingSummary(false);
                      }
                    }}
                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-850 flex items-center gap-1 transition-colors bg-indigo-50 hover:bg-indigo-100/80 px-2 py-1 rounded-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {loadingSummary ? (
                      <>
                        <Loader2 className="animate-spin" size={10} />
                        <span>Consolidando...</span>
                      </>
                    ) : selectedAdvertiser.aiSummary ? (
                      <span>🔄 Recalcular Resumo</span>
                    ) : (
                      <span>🤖 Gerar Resumo</span>
                    )}
                  </button>
                </div>

                {loadingSummary ? (
                  <div className="flex flex-col items-center justify-center py-6 gap-2">
                    <Loader2 className="animate-spin text-indigo-500" size={24} />
                    <div className="text-xs text-slate-500 font-semibold">Analisando histórico de interações com o cliente...</div>
                  </div>
                ) : selectedAdvertiser.aiSummary ? (
                  <div className="text-xs text-slate-650 leading-relaxed font-normal whitespace-pre-wrap">
                    {selectedAdvertiser.aiSummary}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 text-center py-4 italic border border-dashed border-slate-200 rounded-lg">
                    Consolide o histórico comercial deste cliente em um diagnóstico inteligente clicando no botão acima.
                  </div>
                )}
              </div>

              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 mt-2">Histórico de Atividades</div>
              
              {/* Feed Container */}
              <div className="relative pl-6 border-l-2 border-slate-200 ml-3.5 flex flex-col gap-5 py-2">
                {(selectedAdvertiser.interactions || []).map((i) => {
                  // Configurações de ícones e cores por tipo
                  const typeConfigs = {
                    whatsapp: {
                      icon: MessageCircle,
                      bg: "bg-emerald-50 border-emerald-200 text-emerald-600",
                      label: "WhatsApp / Mensagem"
                    },
                    email: {
                      icon: Mail,
                      bg: "bg-blue-50 border-blue-200 text-blue-600",
                      label: "E-mail Enviado"
                    },
                    meeting: {
                      icon: Calendar,
                      bg: "bg-emerald-50 border-emerald-200 text-emerald-600",
                      label: "Reunião / Agenda"
                    },
                    proposal: {
                      icon: FileText,
                      bg: "bg-violet-50 border-violet-200 text-violet-600",
                      label: "Proposta Comercial"
                    },
                    transcription: {
                      icon: Mic,
                      bg: "bg-rose-50 border-rose-200 text-rose-600",
                      label: "Áudio Transcrito"
                    },
                    call: {
                      icon: Phone,
                      bg: "bg-amber-50 border-amber-200 text-amber-600",
                      label: "Ligação Telefônica"
                    },
                    note: {
                      icon: ClipboardList,
                      bg: "bg-slate-50 border-slate-200 text-slate-650",
                      label: "Anotação Manual"
                    }
                  };
                  
                  const config = typeConfigs[i.type] || typeConfigs.note;
                  const TypeIcon = config.icon;

                  return (
                    <div key={i.id} className="relative group">
                      {/* Timeline Icon Badge */}
                      <span className={`absolute -left-[36px] top-1 w-6 h-6 rounded-full border flex items-center justify-center shadow-sm z-10 ${config.bg}`}>
                        <TypeIcon size={12} />
                      </span>
                      
                      {/* Content Box */}
                      <div className="bg-white border border-slate-150 rounded-lg p-3 shadow-sm hover:shadow transition-shadow">
                        {/* Feed Item Header */}
                        <div className="flex items-center justify-between mb-1.5 shrink-0">
                          <span className="text-[9px] font-bold text-slate-800 uppercase tracking-wider">{config.label}</span>
                          <span className="text-[9px] text-slate-400 font-normal">
                            {new Date(i.date).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                        
                        {/* Feed Item Note Body */}
                        <div className="text-xs text-slate-650 whitespace-pre-wrap leading-relaxed">
                          {i.note}
                        </div>
                        
                        {/* AI Summary Block */}
                        {i.aiSummary ? (
                          <div className="mt-2.5 bg-violet-50/50 border border-violet-100 rounded-lg p-2.5">
                            <div className="text-[9px] font-bold text-violet-800 flex items-center gap-1 uppercase tracking-wider">
                              <Sparkles size={11} /> Resumo Executivo da IA
                            </div>
                            <div className="text-xs text-slate-600 mt-1 leading-relaxed">{i.aiSummary}</div>
                            {i.aiNextAction && (
                              <div className="text-xs text-slate-650 mt-1.5 pt-1.5 border-t border-violet-100/50 leading-relaxed">
                                <span className="font-semibold text-slate-700">Próxima ação: </span>{i.aiNextAction}
                              </div>
                            )}
                            {i.aiRisk && (
                              <span className={`inline-block mt-2 text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${riskStyle(i.aiRisk)}`}>
                                Risco {i.aiRisk}
                              </span>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => summarizeInteraction(selectedAdvertiser.id, i.id)}
                            disabled={summarizingId === i.id}
                            className="mt-2.5 flex items-center gap-1 text-[9px] text-rose-600 hover:text-rose-700 font-bold uppercase tracking-wider disabled:opacity-50"
                          >
                            {summarizingId === i.id ? (
                              <Loader2 size={11} className="animate-spin" />
                            ) : (
                              <Sparkles size={11} />
                            )}
                            Resumir com IA
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {(selectedAdvertiser.interactions || []).length === 0 && (
                  <div className="text-xs text-slate-400 p-4 border border-dashed border-slate-200 rounded-lg text-center bg-slate-50/50 -ml-6">
                    Nenhuma atividade ou interação registrada para este cliente.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
