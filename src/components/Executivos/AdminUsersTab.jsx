import React, { useState } from "react";
import { Shield, X, Save, Plus } from "lucide-react";

export default function AdminUsersTab({
  users,
  loadingUsers,
  executivos,
  editingUserId,
  setEditingUserId,
  userForm,
  setUserForm,
  selectedSubordinates,
  toggleSubordinate,
  handleSaveUser,
  loadUsers,
}) {
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newForm, setNewForm] = useState({ nome: "", email: "", perfil: "executivo" });
  return (
    <>
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Shield className="text-slate-700" size={18} />
            <h2 className="text-sm font-semibold text-slate-800">Usuários e Permissões do Sistema</h2>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateUserModal(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white rounded-md px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Plus size={14} /> Cadastrar Novo Usuário
          </button>
        </div>

        {loadingUsers ? (
          <div className="text-xs text-slate-400 py-3">Carregando usuários...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 pr-3 font-medium">Nome</th>
                  <th className="py-2 px-3 font-medium">E-mail</th>
                  <th className="py-2 px-3 font-medium">Nível / Perfil</th>
                  <th className="py-2 pl-3 font-medium text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const linkedExec = executivos.find((e) => e.id === u.executivo_id);
                  return (
                    <tr key={u.id} className="border-b border-slate-100 text-slate-600 last:border-0">
                      <td className="py-2.5 pr-3 text-slate-800 font-medium flex items-center gap-2">
                        {u.foto_url ? (
                          <img src={u.foto_url} alt="" className="w-6 h-6 rounded-full border border-slate-200" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[10px]">
                            {u.nome.charAt(0)}
                          </div>
                        )}
                        {u.nome}
                      </td>
                      <td className="py-2.5 px-3 font-mono">{u.email}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={
                            "px-2 py-0.5 rounded text-[10px] font-semibold uppercase " +
                            (u.perfil === "admin"
                              ? "bg-rose-50 text-rose-700 border border-rose-100"
                              : u.perfil === "diretor"
                              ? "bg-violet-50 text-violet-700 border border-violet-100"
                              : u.perfil === "especialista"
                              ? "bg-amber-50 text-amber-700 border border-amber-100"
                              : "bg-slate-100 text-slate-700 border border-slate-200")
                          }
                        >
                          {u.perfil}
                        </span>
                      </td>

                      <td className="py-2.5 pl-3 text-right">
                        <button
                          type="button"
                          onClick={() => setEditingUserId(u.id)}
                          className="text-rose-600 hover:text-rose-800 font-medium"
                        >
                          Configurar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editingUserId && (
        <div className="fixed inset-0 bg-slate-900/30 flex items-center justify-center z-50" onClick={() => setEditingUserId(null)}>
          <form
            onSubmit={handleSaveUser}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg p-6 w-full max-w-md flex flex-col gap-4 shadow-xl border border-slate-200"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-semibold text-slate-800">
                Acessos de {users.find((x) => x.id === editingUserId)?.nome}
              </span>
              <button type="button" onClick={() => setEditingUserId(null)}>
                <X size={16} className="text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <div>
              <label className="text-xs text-slate-500 mb-1 block">Perfil / Permissão</label>
              <select
                value={userForm.perfil}
                onChange={(e) => setUserForm({ ...userForm, perfil: e.target.value })}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
              >
                <option value="admin">Administrador (Acesso Global)</option>
                <option value="diretor">Diretor (Acesso a Carteira de Executivos)</option>
                <option value="especialista">Especialista (Acesso ao Pipeline e Oportunidades)</option>
                <option value="executivo">Executivo Comercial (Acesso às Próprias Info)</option>
              </select>
            </div>



            {userForm.perfil === "diretor" && (
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Executivos Subordinados</label>
                <div className="border border-slate-200 rounded-md p-3 flex flex-col gap-2 max-h-48 overflow-y-auto bg-slate-50">
                  {executivos.map((ex) => {
                    const active = selectedSubordinates.includes(ex.id);
                    return (
                      <label key={ex.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={active}
                          onChange={() => toggleSubordinate(ex.id)}
                          className="rounded text-rose-500 focus:ring-rose-500"
                        />
                        {ex.nome}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-md py-2.5 text-sm mt-2 flex items-center justify-center gap-1.5 font-medium">
              <Save size={15} /> Salvar Permissões
            </button>
          </form>
        </div>
      )}
      {showCreateUserModal && (
        <div className="fixed inset-0 bg-slate-900/30 flex items-center justify-center z-50 animate-fade-in" onClick={() => setShowCreateUserModal(false)}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!newForm.nome.trim() || !newForm.email.trim() || !newForm.perfil) {
                alert("Todos os campos são obrigatórios.");
                return;
              }
              try {
                const { apiPost } = await import("../../services/api");
                await apiPost("/admin/users", newForm);
                setShowCreateUserModal(false);
                setNewForm({ nome: "", email: "", perfil: "executivo" });
                if (typeof loadUsers === "function") loadUsers();
              } catch (err) {
                alert("Erro ao cadastrar usuário: " + err.message);
              }
            }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg p-6 w-full max-w-md flex flex-col gap-4 shadow-xl border border-slate-200 animate-slide-up"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-semibold text-slate-800">
                Cadastrar Novo Usuário
              </span>
              <button type="button" onClick={() => setShowCreateUserModal(false)}>
                <X size={16} className="text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <div>
              <label className="text-xs text-slate-500 mb-1 block">Nome Completo</label>
              <input
                type="text"
                required
                value={newForm.nome}
                onChange={(e) => setNewForm({ ...newForm, nome: e.target.value })}
                placeholder="Ex: João Silva"
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400"
              />
            </div>

            <div>
              <label className="text-xs text-slate-500 mb-1 block">E-mail Corporativo</label>
              <input
                type="email"
                required
                value={newForm.email}
                onChange={(e) => setNewForm({ ...newForm, email: e.target.value })}
                placeholder="Ex: joao.silva@redetv.com.br"
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400"
              />
            </div>

            <div>
              <label className="text-xs text-slate-500 mb-1 block">Perfil / Permissão</label>
              <select
                value={newForm.perfil}
                onChange={(e) => setNewForm({ ...newForm, perfil: e.target.value })}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
              >
                <option value="admin">Administrador (Acesso Global)</option>
                <option value="diretor">Diretor (Acesso a Carteira de Executivos)</option>
                <option value="especialista">Especialista (Acesso ao Pipeline e Oportunidades)</option>
                <option value="executivo">Executivo Comercial (Acesso às Próprias Info)</option>
              </select>
            </div>

            <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-md py-2.5 text-sm mt-2 flex items-center justify-center gap-1.5 font-medium shadow-sm transition-colors">
              <Save size={15} /> Cadastrar Usuário
            </button>
          </form>
        </div>
      )}
    </>
  );
}
