import React from "react";
import { X } from "lucide-react";
import { formatCelular } from "../utils/helpers";

export default function ContactsTab({
  advertisers,
  contacts,
  contactSearch,
  setContactSearch,
  filteredContacts,
  selectedContactId,
  setSelectedContactId,
  setSelectedAdvertiserId,
  openSendCustomEmail
}) {
  const selectedContact = contacts.find((c) => c.id === selectedContactId);
  const selectedContactClient = selectedContact ? advertisers.find((a) => a.id === selectedContact.clientId) : null;

  return (
    <div className="flex flex-col gap-3">
      <input
        type="text"
        value={contactSearch}
        onChange={(e) => setContactSearch(e.target.value)}
        placeholder="Buscar por nome, empresa ou agência..."
        className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white"
      />
      <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100">
        {filteredContacts.length === 0 && (
          <div className="p-6 text-sm text-slate-400 text-center">
            {contacts.length === 0 ? "Nenhum contato cadastrado ainda." : `Nenhum contato encontrado para "${contactSearch}".`}
          </div>
        )}
        {filteredContacts.map((c) => {
          const client = advertisers.find((a) => a.id === c.clientId);
          return (
            <button
              key={c.id}
              onClick={() => setSelectedContactId(c.id)}
              className="w-full text-left p-4 flex items-center justify-between hover:bg-slate-50"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-800">{c.name}</span>
                  {client && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-semibold ${
                      client.type === "Anunciante"
                        ? "bg-rose-50 border-rose-200 text-rose-700"
                        : "bg-blue-50 border-blue-200 text-blue-700"
                    }`}>
                      {client.type}
                    </span>
                  )}
                  {c.nivelDecisao && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full border bg-violet-50 text-violet-700 border-violet-200 font-semibold">
                      {c.nivelDecisao}
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {c.cargo}{c.cargo && client ? " · " : ""}{client ? client.name : "Cliente não vinculado"}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500">{c.celular ? formatCelular(c.celular) : "—"}</div>
                <div className="text-xs text-slate-400">{c.email || "—"}</div>
              </div>
            </button>
          );
        })}
      </div>

      {selectedContact && (
        <div
          className="fixed inset-0 bg-slate-900/30 flex justify-end z-40"
          onClick={() => setSelectedContactId(null)}
        >
          <div className="w-full max-w-md bg-white h-full overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
             <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="text-lg font-medium text-slate-800">{selectedContact.name}</div>
                  {selectedContactClient && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-semibold ${
                      selectedContactClient.type === "Anunciante"
                        ? "bg-rose-50 border-rose-200 text-rose-700"
                        : "bg-blue-50 border-blue-200 text-blue-700"
                    }`}>
                      {selectedContactClient.type}
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {selectedContact.cargo}{selectedContact.cargo && selectedContact.departamento ? " · " : ""}{selectedContact.departamento}
                </div>
              </div>
              <button onClick={() => setSelectedContactId(null)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            {selectedContactClient && (
              <button
                onClick={() => {
                  setSelectedContactId(null);
                  setSelectedAdvertiserId(selectedContactClient.id);
                }}
                className="text-xs text-rose-600 hover:text-rose-700 mb-4 block"
              >
                Ver cliente: {selectedContactClient.name} →
              </button>
            )}

            <div className="grid grid-cols-2 gap-3 text-sm mb-5">
              <div className="bg-slate-50 rounded-md p-3">
                <div className="text-xs text-slate-400">Nível de decisão</div>
                <div className="text-slate-700">{selectedContact.nivelDecisao || "—"}</div>
              </div>
              <div className="bg-slate-50 rounded-md p-3">
                <div className="text-xs text-slate-400">Filhos</div>
                <div className="text-slate-700">{selectedContact.filhos === "" ? "—" : selectedContact.filhos}</div>
              </div>
              <div className="bg-slate-50 rounded-md p-3">
                <div className="text-xs text-slate-400">Celular</div>
                <div className="text-slate-700 font-mono">{selectedContact.celular ? formatCelular(selectedContact.celular) : "—"}</div>
              </div>
              <div className="bg-slate-50 rounded-md p-3 flex flex-col justify-between">
                <div>
                  <div className="text-xs text-slate-400">E-mail</div>
                  <div className="text-slate-700 break-all">{selectedContact.email || "—"}</div>
                </div>
                {selectedContact.email && (
                  <button
                    type="button"
                    onClick={() => openSendCustomEmail(selectedContact.id)}
                    className="text-[10px] text-rose-650 hover:text-rose-700 font-bold uppercase tracking-wider text-left mt-2 block transition-colors"
                  >
                    Enviar E-mail →
                  </button>
                )}
              </div>
              <div className="bg-slate-50 rounded-md p-3 col-span-2">
                <div className="text-xs text-slate-400">Time do coração</div>
                <div className="text-slate-700">{selectedContact.timeCoracao || "—"}</div>
              </div>
            </div>

            <div className="mb-5">
              <div className="text-xs font-medium text-slate-500 mb-2">Hobbies</div>
              <div className="flex flex-wrap gap-1.5">
                {(selectedContact.hobbies || []).length === 0 && (
                  <div className="text-xs text-slate-300">Nenhum hobby cadastrado.</div>
                )}
                {(selectedContact.hobbies || []).map((h) => (
                  <span key={h} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                    {h === "Outros" && selectedContact.hobbiesOutro ? `Outros: ${selectedContact.hobbiesOutro}` : h}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-slate-500 mb-2">Esportes</div>
              <div className="flex flex-wrap gap-1.5">
                {(selectedContact.esportes || []).length === 0 && (
                  <div className="text-xs text-slate-300">Nenhum esporte cadastrado.</div>
                )}
                {(selectedContact.esportes || []).map((s) => (
                  <span key={s} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                    {s === "Outros" && selectedContact.esportesOutro ? `Outros: ${selectedContact.esportesOutro}` : s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
