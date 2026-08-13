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
        {isAdmin && (
          <button
            type="button"
            onClick={() => {
              setNewExecutivoForm({ nome: "" });
              setShowNewExecutivo(true);
            }}
            className="flex items-center gap-1.5 text-sm bg-slate-900 text-white px-3 py-1.5 rounded-md hover:bg-slate-800"
          >
            <Plus size={15} /> Novo Executivo
          </button>
        )}
      </div>

      {executivos.length === 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-6 text-sm text-slate-400 text-center">
          Nenhum executivo cadastrado ainda.
        </div>
      )}

      {executivos.map((executivo) => {
        const kpis = computeExecutivoKpis(executivo);
        const isEditing = editingCarteiraId === executivo.id;

        // Anunciantes Key Account vinculados a este executivo
        const linkedKeyAccounts = advertisers.filter((a) => keyAccounts.includes(a.id));

        return (
          <div key={executivo.id} className="bg-white rounded-lg border border-slate-200 p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-medium text-slate-800 flex items-center gap-2">
                  {executivo.nome}
                  {users.some(u => u.executivo_id === executivo.id) && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Usuário Ativo" />
                  )}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {kpis.segmentos.length === 0
                    ? "Nenhum segmento na carteira ainda"
                    : `Carteira: ${kpis.segmentos.join(", ")}`}
                  {linkedKeyAccounts.length > 0 && ` · Key-Accounts: ${linkedKeyAccounts.map(k => k.name).join(", ")}`}
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
                          placeholder="Buscar anunciante para adicionar..."
                          className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 pl-8 text-xs focus:outline-none focus:border-slate-300"
                        />
                      </div>
                      <div className="max-h-36 overflow-y-auto flex flex-col gap-1">
                        {advertisers
                          .filter(
                            (a) =>
                              a.type === "Anunciante" &&
                              !keyAccounts.includes(a.id) &&
                              a.name.toLowerCase().includes(keyAccountSearch.toLowerCase())
                          )
                          .map((a) => (
                            <div key={a.id} className="flex items-center justify-between p-1.5 hover:bg-slate-50 rounded text-xs">
                              <span>{a.name} <span className="text-[10px] text-slate-400">({a.segmento})</span></span>
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
              <KpiCard label="Meta" value={formatBRL(kpis.meta)} sub={`${kpis.segmentos.length} segmento(s)`} />
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

            <div>
              <button
                type="button"
                onClick={() => setExpandedClientsId(expandedClientsId === executivo.id ? null : executivo.id)}
                className="flex items-center gap-1 text-xs font-medium text-slate-500 mb-2 hover:text-slate-800"
              >
                Clientes da carteira ({kpis.clientesDaCarteira.length})
                {expandedClientsId === executivo.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>

              {expandedClientsId !== executivo.id && (
                <div className="flex flex-wrap gap-1.5">
                  {kpis.clientesDaCarteira.length === 0 && (
                    <div className="text-xs text-slate-350">Nenhum cliente nos segmentos desta carteira.</div>
                  )}
                  {kpis.clientesDaCarteira.map((c) => (
                    <span key={c.id} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                      {c.name}
                    </span>
                  ))}
                </div>
              )}

              {expandedClientsId === executivo.id && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="text-slate-500 border-b border-slate-200 text-left">
                        <th className="py-2 pr-3 font-medium">Cliente</th>
                        <th className="py-2 px-3 font-medium text-right">Faturamento</th>
                        <th className="py-2 px-3 font-medium text-right">Valor Total das Oportunidades</th>
                        <th className="py-2 pl-3 font-medium text-right">Pipeline</th>
                      </tr>
                    </thead>
                    {kpis.clientesDaCarteira.length === 0 && (
                      <tbody>
                        <tr>
                          <td colSpan={4} className="py-3 text-slate-300">Nenhum cliente nos segmentos desta carteira.</td>
                        </tr>
                      </tbody>
                    )}
                    {kpis.segmentos.map((seg, segIdx) => {
                      const headerPalette = [
                        "bg-sky-50 text-sky-800 border-sky-200",
                        "bg-violet-50 text-violet-800 border-violet-200",
                        "bg-amber-50 text-amber-800 border-amber-200",
                        "bg-emerald-50 text-emerald-800 border-emerald-200",
                        "bg-rose-50 text-rose-800 border-rose-200",
                      ];
                      const clientesDoSegmento = kpis.clientesDaCarteira.filter((c) => c.segmento === seg);
                      if (clientesDoSegmento.length === 0) return null;
                      const rows = clientesDoSegmento.map((c) => ({ client: c, ...computeClientRowForExecutivo(c, executivoYear) }));
                      const subtotal = rows.reduce(
                        (acc, r) => ({
                          faturamento: acc.faturamento + r.faturamento,
                          valorTotalOportunidades: acc.valorTotalOportunidades + r.valorTotalOportunidades,
                          pipeline: acc.pipeline + r.pipeline,
                        }),
                        { faturamento: 0, valorTotalOportunidades: 0, pipeline: 0 }
                      );
                      return (
                        <tbody key={seg}>
                          <tr>
                            <td colSpan={4} className="pt-3 pb-0">
                              <div className={"text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-md border " + headerPalette[segIdx % headerPalette.length]}>
                                {seg}
                              </div>
                            </td>
                          </tr>
                          {rows.map((r) => (
                            <tr key={r.client.id} className="border-b border-slate-50 text-slate-600">
                              <td className="py-1.5 pr-3 text-slate-700">{r.client.name}</td>
                              <td className="py-1.5 px-3 text-right font-mono">{formatBRL(r.faturamento)}</td>
                              <td className="py-1.5 px-3 text-right font-mono">{formatBRL(r.valorTotalOportunidades)}</td>
                              <td className="py-1.5 pl-3 text-right font-mono">{formatBRL(r.pipeline)}</td>
                            </tr>
                          ))}
                          <tr className="border-b border-slate-200 font-medium text-slate-800">
                            <td className="py-1.5 pr-3">Total {seg}</td>
                            <td className="py-1.5 px-3 text-right font-mono">{formatBRL(subtotal.faturamento)}</td>
                            <td className="py-1.5 px-3 text-right font-mono">{formatBRL(subtotal.valorTotalOportunidades)}</td>
                            <td className="py-1.5 pl-3 text-right font-mono">{formatBRL(subtotal.pipeline)}</td>
                          </tr>
                        </tbody>
                      );
                    })}
                  </table>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
