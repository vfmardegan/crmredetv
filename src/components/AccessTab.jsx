import React, { useEffect, useState } from "react";
import { Users, Shield, Package, FileText, Target } from "lucide-react";
import { apiGet, apiPut } from "../services/api";
import AdminUsersTab from "./Executivos/AdminUsersTab";
import AdminAuditTab from "./Executivos/AdminAuditTab";
import AdminProductsTab from "./Executivos/AdminProductsTab";
import AdminProposalsTab from "./Executivos/AdminProposalsTab";
import AdminMetasTab from "./Executivos/AdminMetasTab";

export default function AccessTab({ executivos, currentUser, proposalTemplates, onRefreshProposals, onRefreshData, allProducts }) {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [userForm, setUserForm] = useState({ perfil: "executivo", executivo_id: "" });
  const [selectedSubordinates, setSelectedSubordinates] = useState([]);
  const [adminSubTab, setAdminSubTab] = useState("users");

  const isAdmin = currentUser && currentUser.perfil === "admin";

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [currentUser]);

  useEffect(() => {
    if (editingUserId) {
      const u = users.find((x) => x.id === editingUserId);
      if (u) {
        setUserForm({
          perfil: u.perfil || "executivo",
          executivo_id: u.executivo_id || "",
        });

        if (u.perfil === "diretor") {
          apiGet(`/admin/diretores/${editingUserId}/executivos`)
            .then((data) => setSelectedSubordinates(data))
            .catch((err) => console.error("Erro ao carregar subordinados:", err));
        } else {
          setSelectedSubordinates([]);
        }
      }
    }
  }, [editingUserId, users]);

  function loadUsers() {
    setLoadingUsers(true);
    apiGet("/admin/users")
      .then((data) => setUsers(data))
      .catch((err) => console.error("Erro ao carregar usuários:", err))
      .finally(() => setLoadingUsers(false));
  }
  async function handleSaveUser(e) {
    e.preventDefault();
    try {
      await apiPut(`/admin/users/${editingUserId}`, {
        perfil: userForm.perfil,
      });

      if (userForm.perfil === "diretor") {
        await apiPut(`/admin/diretores/${editingUserId}/executivos`, {
          executivo_ids: selectedSubordinates,
        });
      }

      setEditingUserId(null);
      loadUsers();
      if (typeof onRefreshData === "function") onRefreshData();
    } catch (err) {
      alert("Falha ao salvar configurações do usuário: " + err.message);
    }
  }

  function toggleSubordinate(execId) {
    setSelectedSubordinates((prev) =>
      prev.includes(execId) ? prev.filter((id) => id !== execId) : [...prev, execId]
    );
  }

  if (!isAdmin) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6 text-sm text-slate-400 text-center">
        Acesso restrito para administradores.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Seletor de sub-abas Administrativas */}
      <div className="flex gap-2 border-b border-slate-200 pb-px mb-2 shrink-0 overflow-x-auto">
        <button
          type="button"
          onClick={() => setAdminSubTab("users")}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
            adminSubTab === "users"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Users size={14} /> Usuários & Permissões
        </button>
        <button
          type="button"
          onClick={() => setAdminSubTab("metas")}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
            adminSubTab === "metas"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Target size={14} /> Metas
        </button>
        <button
          type="button"
          onClick={() => setAdminSubTab("audit")}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
            adminSubTab === "audit"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Shield size={14} /> Logs de Auditoria
        </button>
        <button
          type="button"
          onClick={() => setAdminSubTab("produtos")}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
            adminSubTab === "produtos"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Package size={14} /> Produtos
        </button>
        <button
          type="button"
          onClick={() => setAdminSubTab("propostas")}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
            adminSubTab === "propostas"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <FileText size={14} /> Tabela e Propostas
        </button>
      </div>

      {adminSubTab === "users" ? (
        <AdminUsersTab
          users={users}
          loadingUsers={loadingUsers}
          executivos={executivos}
          editingUserId={editingUserId}
          setEditingUserId={setEditingUserId}
          userForm={userForm}
          setUserForm={setUserForm}
          selectedSubordinates={selectedSubordinates}
          toggleSubordinate={toggleSubordinate}
          handleSaveUser={handleSaveUser}
          loadUsers={loadUsers}
          onRefreshData={onRefreshData}
        />
      ) : adminSubTab === "metas" ? (
        <AdminMetasTab onRefreshData={onRefreshData} />
      ) : adminSubTab === "produtos" ? (
        <AdminProductsTab onRefreshData={onRefreshData} />
      ) : adminSubTab === "propostas" ? (
        <AdminProposalsTab proposalTemplates={proposalTemplates} onRefresh={onRefreshProposals} allProducts={allProducts} />
      ) : (
        <AdminAuditTab />
      )}
    </div>
  );
}
