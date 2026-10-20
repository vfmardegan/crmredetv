import React, { useState, useEffect } from "react";
import { apiGet } from "../../services/api";

export default function AdminAuditTab() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditSearch, setAuditSearch] = useState("");
  const [authorFilter, setAuthorFilter] = useState("all");

  useEffect(() => {
    setLoadingAudit(true);
    apiGet("/admin/audit-logs")
      .then((data) => setAuditLogs(data))
      .catch((err) => console.error("Erro ao carregar logs de auditoria:", err))
      .finally(() => setLoadingAudit(false));
  }, []);

  const availableAuthors = React.useMemo(() => {
    const set = new Set();
    (auditLogs || []).forEach((log) => {
      const author = (log.actor_name || "").trim();
      if (author) set.add(author);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [auditLogs]);

  const filteredLogs = React.useMemo(() => {
    return (auditLogs || []).filter((log) => {
      if (authorFilter !== "all" && (log.actor_name || "").trim() !== authorFilter) {
        return false;
      }
      if (!auditSearch.trim()) return true;
      const s = auditSearch.toLowerCase();
      return (
        (log.actor_name || "").toLowerCase().includes(s) ||
        (log.action || "").toLowerCase().includes(s) ||
        (log.target_name || "").toLowerCase().includes(s) ||
        (log.details || "").toLowerCase().includes(s)
      );
    });
  }, [auditLogs, authorFilter, auditSearch]);

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 mt-4">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h3 className="font-semibold text-slate-800 text-sm">Histórico de Alterações de Acesso</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Exibindo <strong className="text-slate-700">{filteredLogs.length}</strong> de <strong className="text-slate-700">{auditLogs.length}</strong> registros
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Filtro por Autor */}
          <div className="flex items-center gap-1.5 shrink-0">
            <label className="text-xs text-slate-500 font-medium whitespace-nowrap">Autor:</label>
            <select
              value={authorFilter}
              onChange={(e) => setAuthorFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              <option value="all">Todos os Autores ({availableAuthors.length})</option>
              {availableAuthors.map((author) => (
                <option key={author} value={author}>
                  {author}
                </option>
              ))}
            </select>
          </div>

          {/* Campo de Busca Geral */}
          <input
            type="text"
            placeholder="Buscar por usuário, ação ou alvo..."
            value={auditSearch}
            onChange={(e) => setAuditSearch(e.target.value)}
            className="border border-slate-200 rounded-md px-3 py-1.5 text-xs w-full sm:w-64 focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
        </div>
      </div>

      {loadingAudit ? (
        <div className="text-sm text-slate-400 text-center py-6">Carregando histórico...</div>
      ) : filteredLogs.length === 0 ? (
        <div className="text-sm text-slate-400 text-center py-6">
          {auditLogs.length === 0
            ? "Nenhum registro de auditoria encontrado."
            : "Nenhum registro encontrado para os filtros selecionados."}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="py-2.5 px-3 font-medium text-slate-500">Data/Hora</th>
                <th className="py-2.5 px-3 font-medium text-slate-500">Autor (Quem)</th>
                <th className="py-2.5 px-3 font-medium text-slate-500">Ação</th>
                <th className="py-2.5 px-3 font-medium text-slate-500">Alvo</th>
                <th className="py-2.5 px-3 font-medium text-slate-500">Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 text-slate-500">
                      {new Date(log.created_at).toLocaleString("pt-BR")}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-700">{log.actor_name || "Desconhecido"}</td>
                    <td className="py-2.5 px-3">
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-medium uppercase">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{log.target_name || "-"}</td>
                    <td className="py-2.5 px-3 text-slate-500 whitespace-pre-wrap font-mono text-[10px]">
                      {log.details || "-"}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
