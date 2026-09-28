import React, { useState, useEffect } from "react";
import { Shield, X, Save, Plus, KeyRound, CheckCircle2, AlertCircle } from "lucide-react";
import { apiPatch, apiPost, apiPut } from "../../services/api";

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
  onRefreshData,
}) {
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newForm, setNewForm] = useState({ nome: "", email: "", perfil: "executivo", senha: "" });
  const [togglingId, setTogglingId] = useState(null);
  const [showInactive, setShowInactive] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [resetFeedback, setResetFeedback] = useState(null);

  useEffect(() => {
    setResetFeedback(null);
  }, [editingUserId]);

  async function handleResetPassword() {
    if (!editingUserId) return;
    const editingUser = users.find((x) => x.id === editingUserId);
    const userName = editingUser ? editingUser.nome : "o colaborador";
    const novaSenha = window.prompt(`Defina a nova senha temporária para ${userName} (mínimo 8 caracteres):`);
    if (novaSenha === null) return;
    if (novaSenha.trim().length < 8) {
      alert("A nova senha temporária deve ter no mínimo 8 caracteres.");
      return;
    }
    setResettingPassword(true);
    setResetFeedback(null);
    try {
      const res = await apiPut(`/admin/users/${editingUserId}/reset-password`, { senha: novaSenha.trim() });
      setResetFeedback({
        type: "success",
        message: res.message || "Senha temporária atualizada com sucesso! Ao fazer login com ela, o colaborador será solicitado a cadastrar sua nova senha definitiva.",
      });
      if (typeof loadUsers === "function") loadUsers();
    } catch (err) {
      setResetFeedback({
        type: "error",
        message: err.message || "Erro ao redefinir senha do usuário.",
      });
    } finally {
      setResettingPassword(false);
    }
  }

  async function handleToggleAtivo(user) {
    setTogglingId(user.id);
    try {
      await apiPatch(`/admin/users/${user.id}/toggle-ativo`);
      if (typeof loadUsers === "function") loadUsers();
    } catch (err) {
      alert(err.message || "Erro ao alterar status do usuário.");
    } finally {
      setTogglingId(null);
    }
  }

  const inactiveCount = users.filter((u) => u.ativo === false).length;
  const displayedUsers = users.filter((u) => showInactive || u.ativo !== false);

  return (
    <>
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Shield className="text-slate-700" size={18} />
            <h2 className="text-sm font-semibold text-slate-800">Usuários e Permissões do Sistema</h2>
          </div>
          <div className="flex items-center gap-2">
            {inactiveCount > 0 && (
              <button
                type="button"
                onClick={() => setShowInactive(!showInactive)}
                className="text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-md font-medium transition-colors"
              >
                {showInactive ? "Ocultar desativados" : `Mostrar desativados (${inactiveCount})`}
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowCreateUserModal(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white rounded-md px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Plus size={14} /> Cadastrar Novo Usuário
            </button>
          </div>
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
                  <th className="py-2 px-3 font-medium text-center">Status / Acesso</th>
                  <th className="py-2 pl-3 font-medium text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                {displayedUsers.map((u) => {
                  const isInactive = u.ativo === false;
                  return (
                    <tr
                      key={u.id}
                      className={
                        "border-b border-slate-100 text-slate-600 last:border-0 transition-colors " +
                        (isInactive ? "bg-slate-50/60 opacity-60" : "")
                      }
                    >
                      <td className="py-2.5 pr-3 text-slate-800 font-medium flex items-center gap-2">
                        {u.foto_url ? (
                          <img src={u.foto_url} alt="" className="w-6 h-6 rounded-full border border-slate-200" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[10px]">
                            {u.nome.charAt(0)}
                          </div>
                        )}
                        <span>{u.nome}</span>
                        {isInactive && (
                          <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-normal">
                            Desativado
                          </span>
                        )}
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

                      {/* Switch de Ativação / Desativação */}
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          disabled={togglingId === u.id}
                          onClick={() => handleToggleAtivo(u)}
                          title={isInactive ? "Ativar acesso do usuário" : "Desativar acesso do usuário"}
                          className="inline-flex items-center gap-2 cursor-pointer focus:outline-none disabled:opacity-50"
                        >
                          <div
                            className={
                              "w-8 h-4.5 flex items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out " +
                              (isInactive ? "bg-slate-300" : "bg-emerald-500")
                            }
                          >
                            <div
                              className={
                                "bg-white w-3.5 h-3.5 rounded-full shadow-md transform transition-transform duration-200 ease-in-out " +
                                (isInactive ? "translate-x-0" : "translate-x-3.5")
                              }
                            />
                          </div>
                          <span
                            className={
                              "text-[11px] font-medium " + (isInactive ? "text-slate-400" : "text-emerald-700")
                            }
                          >
                            {isInactive ? "Inativo" : "Ativo"}
                          </span>
                        </button>
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
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-edit-user-title"
          className="fixed inset-0 bg-slate-900/30 flex items-center justify-center z-50"
          onClick={() => setEditingUserId(null)}
        >
          <form
            onSubmit={handleSaveUser}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg p-6 w-full max-w-md flex flex-col gap-4 shadow-xl border border-slate-200"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 id="modal-edit-user-title" className="font-semibold text-slate-800">
                Acessos de {users.find((x) => x.id === editingUserId)?.nome}
              </h2>
              <button
                type="button"
                aria-label="Fechar modal"
                onClick={() => setEditingUserId(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div>
              <label className="text-xs text-slate-700 font-medium mb-1 block">Perfil / Permissão</label>
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
                <label className="text-xs text-slate-700 font-medium mb-1 block">Executivos Subordinados</label>
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

            {/* Redefinição de Senha */}
            <div className="pt-2 border-t border-slate-100">
              <label className="text-xs font-medium text-slate-700 mb-1 flex items-center gap-1.5">
                <KeyRound size={14} className="text-slate-500" />
                Redefinição de Senha
              </label>
              <p className="text-[11px] text-slate-500 mb-2.5 leading-relaxed">
                Define uma nova senha temporária. Ao efetuar o login com essa senha temporária, o sistema solicitará imediatamente a criação de uma senha definitiva.
              </p>
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={resettingPassword}
                className="w-full border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-md py-2 px-3 text-xs font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <KeyRound size={14} />
                {resettingPassword ? "Atualizando senha..." : "Definir Senha Temporária / Resetar"}
              </button>

              {resetFeedback && (
                <div
                  className={`mt-2.5 p-2.5 rounded-md text-xs flex items-start gap-2 ${
                    resetFeedback.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-rose-50 text-rose-800 border border-rose-200"
                  }`}
                >
                  {resetFeedback.type === "success" ? (
                    <CheckCircle2 size={15} className="text-emerald-600 mt-0.5 shrink-0" />
                  ) : (
                    <AlertCircle size={15} className="text-rose-600 mt-0.5 shrink-0" />
                  )}
                  <div className="leading-snug">{resetFeedback.message}</div>
                </div>
              )}
            </div>

            <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-md py-2.5 text-sm mt-2 flex items-center justify-center gap-1.5 font-medium">
              <Save size={15} /> Salvar Permissões
            </button>
          </form>
        </div>
      )}
      {showCreateUserModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-create-user-title"
          className="fixed inset-0 bg-slate-900/30 flex items-center justify-center z-50 animate-fade-in"
          onClick={() => setShowCreateUserModal(false)}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!newForm.nome.trim() || !newForm.email.trim() || !newForm.perfil || !newForm.senha || newForm.senha.trim().length < 8) {
                alert("Todos os campos são obrigatórios e a senha provisória deve conter no mínimo 8 caracteres.");
                return;
              }
              try {
                await apiPost("/admin/users", { ...newForm, senha: newForm.senha.trim() });
                setShowCreateUserModal(false);
                setNewForm({ nome: "", email: "", perfil: "executivo", senha: "" });
                if (typeof loadUsers === "function") loadUsers();
                if (typeof onRefreshData === "function") onRefreshData();
              } catch (err) {
                alert("Erro ao cadastrar usuário: " + err.message);
              }
            }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg p-6 w-full max-w-md flex flex-col gap-4 shadow-xl border border-slate-200 animate-slide-up"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 id="modal-create-user-title" className="font-semibold text-slate-800">
                Cadastrar Novo Usuário
              </h2>
              <button
                type="button"
                aria-label="Fechar modal"
                onClick={() => setShowCreateUserModal(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div>
              <label className="text-xs text-slate-700 font-medium mb-1 block">Nome Completo</label>
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
              <label className="text-xs text-slate-700 font-medium mb-1 block">E-mail Corporativo</label>
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
              <label className="text-xs text-slate-700 font-medium mb-1 block">Perfil / Permissão</label>
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

            <div>
              <label className="text-xs text-slate-700 font-medium mb-1 block">Senha Inicial Provisória (Mín. 8 caracteres)</label>
              <input
                type="password"
                required
                minLength={8}
                value={newForm.senha}
                onChange={(e) => setNewForm({ ...newForm, senha: e.target.value })}
                placeholder="Ex: RedeTV@2026"
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400"
              />
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
