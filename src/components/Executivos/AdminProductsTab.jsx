import React, { useEffect, useState } from "react";
import { Tv, Globe, Star, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { apiGet, apiPost, apiPut, apiDelete } from "../../services/api";

const CATEGORIES = [
  { key: "televisao",  label: "Televisão",          icon: Tv,     color: "text-blue-600",   bg: "bg-blue-50",   border: "border-blue-200",  dot: "bg-blue-500" },
  { key: "digital",   label: "Digital",             icon: Globe,  color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-200", dot: "bg-violet-500" },
  { key: "especiais", label: "Projetos Especiais",  icon: Star,   color: "text-amber-600",  bg: "bg-amber-50",  border: "border-amber-200",  dot: "bg-amber-500" },
];

export default function AdminProductsTab({ onRefreshData }) {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("televisao");
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { load(); }, []);

  function load() {
    setLoading(true);
    apiGet("/admin/produtos")
      .then(setProdutos)
      .catch(() => setError("Erro ao carregar produtos."))
      .finally(() => setLoading(false));
  }

  const filtered = produtos
    .filter((p) => p.categoria === activeCategory)
    .sort((a, b) => {
      const aAtivo = a.ativo !== false;
      const bAtivo = b.ativo !== false;
      if (aAtivo !== bAtivo) {
        return aAtivo ? -1 : 1;
      }
      return a.nome.localeCompare(b.nome, "pt-BR");
    });

  async function handleToggleActive(p) {
    const nextAtivo = p.ativo === false ? true : false;
    setSaving(true);
    setError("");
    try {
      await apiPut(`/admin/produtos/${p.id}`, { ativo: nextAtivo });
      load();
      onRefreshData?.();
    } catch (err) {
      setError(err.message || "Erro ao atualizar status do produto.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    setError("");
    try {
      await apiPost("/admin/produtos", { nome: newName.trim(), categoria: activeCategory });
      setNewName("");
      load();
      onRefreshData?.();
    } catch (err) {
      setError(err.message || "Erro ao adicionar produto.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveEdit(id) {
    if (!editingName.trim()) return;
    setSaving(true);
    setError("");
    try {
      await apiPut(`/admin/produtos/${id}`, { nome: editingName.trim() });
      setEditingId(null);
      load();
      onRefreshData?.();
    } catch (err) {
      setError(err.message || "Erro ao atualizar produto.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id, nome) {
    if (!window.confirm(`Remover o produto "${nome}"? Esta ação não pode ser desfeita.`)) return;
    setSaving(true);
    setError("");
    try {
      await apiDelete(`/admin/produtos/${id}`);
      load();
      onRefreshData?.();
    } catch (err) {
      setError(err.message || "Erro ao remover produto.");
    } finally {
      setSaving(false);
    }
  }

  const cat = CATEGORIES.find((c) => c.key === activeCategory);

  return (
    <div className="flex flex-col gap-5">
      {/* Category tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-px">
        {CATEGORIES.map((c) => {
          const Icon = c.icon;
          const active = c.key === activeCategory;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => { setActiveCategory(c.key); setNewName(""); setEditingId(null); setError(""); }}
              className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
                active
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              <Icon size={13} />
              {c.label}
              <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"
              }`}>
                {produtos.filter((p) => p.categoria === c.key).length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Error banner */}
      {error && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6">
        {/* Product list */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="text-xs text-slate-400 py-8 text-center">Carregando...</div>
          ) : filtered.length === 0 ? (
            <div className="text-xs text-slate-400 py-8 text-center">
              Nenhum produto cadastrado nesta categoria.
            </div>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {filtered.map((p) => (
                <li
                  key={p.id}
                  className={`flex items-center justify-between gap-4 px-3 py-2.5 rounded-lg border transition-all ${
                    p.ativo !== false 
                      ? `${cat.border} ${cat.bg}` 
                      : "border-slate-200 bg-slate-50 opacity-60"
                  } group`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${p.ativo !== false ? cat.dot : "bg-slate-400"}`} />
                    
                    {editingId === p.id ? (
                      <input
                        autoFocus
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleSaveEdit(p.id); if (e.key === "Escape") setEditingId(null); }}
                        className="flex-1 text-xs border border-slate-300 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-slate-400 bg-white"
                      />
                    ) : (
                      <span className={`text-xs font-medium truncate ${p.ativo !== false ? cat.color : "text-slate-500 line-through"}`}>
                        {p.nome}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {editingId === p.id ? (
                      <>
                        <button onClick={() => handleSaveEdit(p.id)} disabled={saving}
                          className="p-1 rounded text-emerald-600 hover:bg-emerald-100 transition-colors">
                          <Check size={13} />
                        </button>
                        <button onClick={() => setEditingId(null)}
                          className="p-1 rounded text-slate-400 hover:bg-slate-200 transition-colors">
                          <X size={13} />
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Switch / Toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleActive(p)}
                          disabled={saving}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            p.ativo !== false ? "bg-slate-900" : "bg-slate-200"
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              p.ativo !== false ? "translate-x-4" : "translate-x-0"
                            }`}
                          />
                        </button>

                        <button
                          onClick={() => { setEditingId(p.id); setEditingName(p.nome); }}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-white/60 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.nome)}
                          className="p-1 rounded text-red-400 hover:text-red-600 hover:bg-white/60 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={12} />
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Add form */}
        <div className={`shrink-0 md:w-64 rounded-xl border ${cat.border} ${cat.bg} p-4 flex flex-col gap-3 h-fit`}>
          <div className={`text-xs font-semibold ${cat.color} flex items-center gap-1.5`}>
            {React.createElement(cat.icon, { size: 13 })}
            Novo produto em {cat.label}
          </div>
          <form onSubmit={handleAdd} className="flex flex-col gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nome do produto..."
              className="text-xs border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-slate-400 bg-white"
            />
            <button
              type="submit"
              disabled={saving || !newName.trim()}
              className="flex items-center justify-center gap-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg px-3 py-2 hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={12} /> Adicionar
            </button>
          </form>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            Produtos cadastrados aqui ficam disponíveis na criação de oportunidades.
          </p>
        </div>
      </div>
    </div>
  );
}
