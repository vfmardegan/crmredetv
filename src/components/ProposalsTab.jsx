import React from "react";
import { FileText } from "lucide-react";

export default function ProposalsTab({ openSendProposal, proposalTemplates = [] }) {
  return (
    <div className="flex flex-col gap-4">
      {proposalTemplates.length === 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-8 text-center text-sm text-slate-400">
          Nenhuma proposta padrão cadastrada. Acesse{" "}
          <strong>Gestão e Acessos → Propostas Padrão</strong> para cadastrar.
        </div>
      )}
      {proposalTemplates.map((t) => (
        <div
          key={t.id}
          className="bg-white rounded-lg border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
              <FileText size={16} className="text-rose-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-slate-800">{t.title}</span>
                {t.product && (
                  <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                    {t.product}
                  </span>
                )}
              </div>
              {t.subtitle && (
                <div className="text-xs text-slate-500 mt-0.5">{t.subtitle}</div>
              )}
              {(t.horario || t.periodo) && (
                <div className="text-xs text-slate-400 mt-0.5">
                  {t.horario}
                  {t.horario && t.periodo ? " · " : ""}
                  {t.periodo}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {t.pdfDataUri && (
              <a
                href={t.pdfDataUri}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs border border-slate-200 text-slate-600 px-3 py-1.5 rounded-md hover:bg-slate-50 whitespace-nowrap"
              >
                Visualizar PDF
              </a>
            )}
            {t.xlsDataUri && (
              <a
                href={t.xlsDataUri}
                download={t.xlsFileName || "tabela.xlsx"}
                className="text-xs border border-emerald-200 text-emerald-700 bg-emerald-50/50 px-3 py-1.5 rounded-md hover:bg-emerald-100/50 whitespace-nowrap font-medium"
              >
                Baixar Excel
              </a>
            )}
            <button
              type="button"
              onClick={() => openSendProposal(t.id)}
              className="text-xs bg-rose-600 text-white px-3 py-1.5 rounded-md hover:bg-rose-700 whitespace-nowrap font-medium"
            >
              Enviar por e-mail
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
