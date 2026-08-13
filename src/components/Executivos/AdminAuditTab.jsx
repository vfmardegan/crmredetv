import React, { useState, useEffect } from "react";
import { apiGet } from "../../services/api";

export default function AdminAuditTab() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditSearch, setAuditSearch] = useState("");

  useEffect(() => {
    setLoadingAudit(true);
    apiGet("/admin/audit-logs")
      .then((data) => setAuditLogs(data))
      .catch((err) => console.error("Erro ao carregar logs de auditoria:", err))
      .finally(() => setLoadingAudit(false));
  }, []);

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 mt-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-800 text-sm">Histórico de Alterações de Acesso</h3>
        <input
          type="text"
          placeholder="Buscar por usuário, ação ou alvo..."
          value={auditSearch}
          onChange={(e) => setAuditSearch(e.target.value)}
          className="border border-slate-200 rounded-md px-3 py-1.5 text-xs w-64 focus:outline-none focus:border-slate-400"
        />
      </div>

      {loadingAudit ? (
        <div className="text-sm text-slate-400 text-center py-6">Carregando histórico...</div>
      ) : auditLogs.length === 0 ? (
        <div className="text-sm text-slate-400 text-center py-6">Nenhum registro de auditoria encontrado.</div>
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
              {auditLogs
                .filter((log) => {
                  if (!auditSearch.trim()) return true;
                  const s = auditSearch.toLowerCase();
                  return (
                    (log.actor_name || "").toLowerCase().includes(s) ||
                    (log.action || "").toLowerCase().includes(s) ||
                    (log.target_name || "").toLowerCase().includes(s) ||
                    (log.details || "").toLowerCase().includes(s)
                  );
                })
                .map((log) => (
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
