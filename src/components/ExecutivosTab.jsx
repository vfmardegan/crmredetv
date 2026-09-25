import React, { useEffect, useState } from "react";
import { Plus, ChevronDown, ChevronUp, Trash2, Search } from "lucide-react";
import { YEARS, SEGMENTOS, formatBRL } from "../utils/helpers";
import { KpiCard } from "./UI/KpiCard";
import { apiGet, apiPut } from "../services/api";

export default function ExecutivosTab({
  executivoYear,
  setExecutivoYear,
  executivos,
  setShowNewExecutivo,
  setNewExecutivoForm,
  computeExecutivoKpis,
  editingCarteiraId,
  setEditingCarteiraId,
  deleteExecutivo,
  segmentoExecutivo,
  assignSegmentoToExecutivo,
  expandedClientsId,
  setExpandedClientsId,
  computeClientRowForExecutivo,
  advertisers,
  executivoKeyAccounts = {},
  currentUser,
}) {
  const [users, setUsers] = useState([]);
  const [keyAccounts, setKeyAccounts] = useState([]);
  const [showAddKeyAccount, setShowAddKeyAccount] = useState(false);
  const [keyAccountSearch, setKeyAccountSearch] = useState("");

  const isAdmin = currentUser && currentUser.perfil === "admin";

  useEffect(() => {
    if (isAdmin) {
      apiGet("/admin/users")
        .then((data) => setUsers(data))
        .catch((err) => console.error("Erro ao carregar usuários:", err));
    }
  }, [currentUser]);

  useEffect(() => {
    if (editingCarteiraId) {
      apiGet(`/admin/executivos/${editingCarteiraId}/key-accounts`)
        .then((data) => setKeyAccounts(data))
        .catch((err) => console.error("Erro ao carregar key accounts:", err));
    } else {
      setKeyAccounts([]);
    }
  }, [editingCarteiraId]);

  async function addKeyAccount(clientId) {
    const updated = [...keyAccounts, clientId];
    setKeyAccounts(updated);
    try {
      await apiPut(`/admin/executivos/${editingCarteiraId}/key-accounts`, {
        client_ids: updated,
      });
    } catch (err) {
      alert("Falha ao salvar key-account: " + err.message);
    }
  }

  async function removeKeyAccount(clientId) {
    const updated = keyAccounts.filter((id) => id !== clientId);
    setKeyAccounts(updated);
    try {
      await apiPut(`/admin/executivos/${editingCarteiraId}/key-accounts`, {
        client_ids: updated,
      });
    } catch (err) {
      alert("Falha ao remover key-account: " + err.message);
    }
  }

  return (
    <div className="flex flex-col gap-6">

      {/* 2. Visualização das Carteiras e Metas */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Ano:</span>
          {YEARS.map((y) => (
            <button
              type="button"
              key={y}
              onClick={() => setExecutivoYear(y)}
              className={
                "text-xs border rounded-md px-3 py-1.5 " +
                (executivoYear === y ? "bg-slate-900 border-slate-900 text-white" : "border-slate-200 text-slate-600 bg-white hover:bg-slate-50")
              }
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      {executivos.length === 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-6 text-sm text-slate-400 text-center">
          Nenhum executivo cadastrado ainda.
        </div>
      )}

      {executivos.map((executivo) => {
        const kpis = computeExecutivoKpis(executivo);
        const isEditing = editingCarteiraId === executivo.id;

        const currentKeyAccountIds = isEditing ? keyAccounts : (executivoKeyAccounts[executivo.id] || []);
        const linkedKeyAccounts = advertisers.filter((a) => currentKeyAccountIds.includes(a.id));

        return (
          <div key={executivo.id} className="bg-white rounded-lg border border-slate-200 p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-medium text-slate-800 flex items-center gap-2">
                  {executivo.nome}
                  {executivo.email && <span className="text-xs font-normal text-slate-400">({executivo.email})</span>}
                  {users.some(u => u.executivo_id === executivo.id) && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Usuário Ativo" />
                  )}
                </div>
              </div>
              {isAdmin && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditingCarteiraId(isEditing ? null : executivo.id)}
                    className="flex items-center gap-1 text-xs border border-slate-200 text-slate-600 px-2.5 py-1.5 rounded-md hover:bg-slate-50"
                  >
                    Editar carteira {isEditing ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteExecutivo(executivo.id)}
                    className="text-slate-300 hover:text-rose-600"
                    title="Excluir executivo"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              )}
            </div>

            {isEditing && isAdmin && (
              <div className="flex flex-col gap-3 p-4 bg-slate-50 rounded-md mb-4 border border-slate-200">
                <div>
                  <div className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Segmentos Associados</div>
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                    {SEGMENTOS.map((seg) => {
                      const ownerId = segmentoExecutivo[seg];
                      const isMine = ownerId === executivo.id;
                      const ownerName = ownerId && !isMine ? executivos.find((e) => e.id === ownerId)?.nome : null;
                      return (
                        <label
                          key={seg}
                          className={
                            "flex items-center gap-1.5 text-xs border rounded-md px-2 py-1 cursor-pointer bg-white " +
                            (isMine ? "bg-rose-50 border-rose-350 text-rose-700 font-medium" : "border-slate-200 text-slate-600 hover:bg-slate-50")
                          }
                          title={ownerName ? `Hoje é da carteira de ${ownerName}` : ""}
                        >
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={isMine}
                            onChange={() => assignSegmentoToExecutivo(seg, executivo.id)}
                          />
                          {seg}
                          {ownerName && <span className="text-slate-400 text-[10px] ml-1">({ownerName})</span>}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Key-Accounts Corporativos</div>
                    <button
                      type="button"
                      onClick={() => setShowAddKeyAccount(!showAddKeyAccount)}
                      className="text-rose-600 text-xs font-medium hover:underline"
                    >
                      {showAddKeyAccount ? "Fechar busca" : "+ Adicionar Key-Account"}
                    </button>
                  </div>

                  {showAddKeyAccount && (
                    <div className="bg-white border border-slate-200 rounded-md p-3 mb-2 flex flex-col gap-2">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input
                          type="text"
                          value={keyAccountSearch}
                          onChange={(e) => setKeyAccountSearch(e.target.value)}
                          placeholder="Buscar cliente (anunciante ou agência)..."
                          className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 pl-8 text-xs focus:outline-none focus:border-slate-300"
                        />
                      </div>
                      <div className="max-h-36 overflow-y-auto flex flex-col gap-1">
                        {advertisers
                          .filter(
                            (a) =>
                              !keyAccounts.includes(a.id) &&
                              a.name.toLowerCase().includes(keyAccountSearch.toLowerCase())
                          )
                          .map((a) => (
                            <div key={a.id} className="flex items-center justify-between p-1.5 hover:bg-slate-50 rounded text-xs">
                              <span>{a.name} <span className="text-[10px] text-slate-400">({a.type} · {a.segmento || "Geral"})</span></span>
                              <button
                                type="button"
                                onClick={() => addKeyAccount(a.id)}
                                className="text-rose-600 font-medium text-[10px] hover:underline"
                              >
                                Vincular
                              </button>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1.5">
                    {linkedKeyAccounts.length === 0 && (
                      <div className="text-xs text-slate-350">Nenhuma conta-chave personalizada associada a este executivo.</div>
                    )}
                    {linkedKeyAccounts.map((k) => (
                      <span key={k.id} className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-md border border-slate-200 flex items-center gap-1.5 bg-white">
                        {k.name}
                        <button
                          type="button"
                          onClick={() => removeKeyAccount(k.id)}
                          className="text-slate-400 hover:text-rose-600 font-bold text-[10px] ml-1"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3 mb-3">
              <KpiCard
                label="Meta"
                value={formatBRL(kpis.meta)}
                sub={`${kpis.segmentos.length} segmento(s) · ${linkedKeyAccounts.length} Key Account(s)`}
              />
              <KpiCard label="Faturamento" value={formatBRL(kpis.faturamento)} sub={`${executivoYear}`} />
              <KpiCard
                label="GAP"
                value={formatBRL(kpis.gap)}
                sub={`${Math.round(kpis.percent)}% da meta atingido`}
              />
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <KpiCard label="Oportunidades (Pipeline Total)" value={formatBRL(kpis.pipelineTotal)} sub="Frio + Morno + Quente, sem ponderar" />
              <KpiCard label="Pipeline" value={formatBRL(kpis.pipeline)} sub="Frio 0% + Morno 10% + Quente 70%" />
            </div>

            <div className="flex flex-col gap-3 pt-3 border-t border-slate-100">
              <div>
                <div className="text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                  Segmentos da Carteira ({kpis.segmentos.length})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {kpis.segmentos.length === 0 ? (
                    <div className="text-xs text-slate-400">Nenhum segmento associado a este executivo.</div>
                  ) : (
                    kpis.segmentos.map((seg) => (
                      <span key={seg} className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200 font-medium">
                        {seg}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {linkedKeyAccounts.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                    Key-Accounts Corporativos ({linkedKeyAccounts.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {linkedKeyAccounts.map((k) => (
                      <span key={k.id} className="text-xs bg-amber-50 text-amber-800 px-2.5 py-1 rounded-md border border-amber-200 font-medium">
                        {k.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
