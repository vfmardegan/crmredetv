import React from "react";
import { FileText } from "lucide-react";
import { PROPOSAL_TEMPLATES } from "../utils/helpers";

export default function ProposalsTab({
  proposals,
  contacts,
  advertisers,
  opportunities,
  openSendProposal
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="text-sm font-medium text-slate-700 mb-3">Propostas padrão</div>
        <div className="flex flex-col gap-3">
          {PROPOSAL_TEMPLATES.map((t) => (
            <div key={t.id} className="bg-white rounded-lg border border-slate-200 p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                  <FileText size={16} className="text-rose-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-800">{t.title}</span>
                    <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">{t.product}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{t.subtitle}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{t.horario} · {t.periodo}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={t.pdfDataUri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs border border-slate-200 text-slate-600 px-3 py-1.5 rounded-md hover:bg-slate-50 whitespace-nowrap"
                >
                  Visualizar
                </a>
                <button
                  type="button"
                  onClick={() => openSendProposal(t.id)}
                  className="text-xs bg-rose-600 text-white px-3 py-1.5 rounded-md hover:bg-rose-700 whitespace-nowrap"
                >
                  Enviar por e-mail
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="text-sm font-medium text-slate-700 mb-3">Propostas enviadas</div>
        <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100">
          {proposals.length === 0 && (
            <div className="p-6 text-sm text-slate-400 text-center">Nenhuma proposta enviada ainda.</div>
          )}
          {proposals.map((p) => {
            const template = PROPOSAL_TEMPLATES.find((t) => t.id === p.templateId);
            const contact = contacts.find((c) => c.id === p.contactId);
            const client = contact ? advertisers.find((a) => a.id === contact.clientId) : null;
            const opp = p.opportunityId ? opportunities.find((o) => o.id === p.opportunityId) : null;
            return (
              <div key={p.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium text-slate-800">{template ? template.title : "Modelo removido"}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {contact ? contact.name : "Contato removido"}{client ? ` · ${client.name}` : ""}{opp ? ` · ${opp.title}` : ""}
                  </div>
                </div>
                <div className="text-xs text-slate-400">{p.sentAt ? new Date(p.sentAt).toLocaleDateString("pt-BR") : ""}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
