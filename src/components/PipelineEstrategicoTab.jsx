import React, { useState, useEffect, useMemo } from "react";
import {
  Compass,
  Plus,
  Search,
  Building2,
  Users,
  CheckCircle2,
  Calendar,
  X,
  Phone,
  Mail,
  Trash2,
  Activity,
  ArrowUpRight,
  TrendingUp,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Mic,
  Send,
  Briefcase,
  Tag,
  Clock,
  Sparkles,
  ExternalLink,
  Check,
  Utensils,
  FileText,
  Pencil
} from "lucide-react";
import AudioRecorder from "./AudioRecorder";
import {
  SEGMENTOS,
  formatBRL,
  DECISION_LEVELS,
  HOBBIES,
  SPORTS
} from "../utils/helpers";
import {
  getPipelineEstrategico,
  savePipelineEstrategico,
  updatePipelineEstrategico,
  deletePipelineEstrategico,
  apiGet
} from "../services/api";

// Máscara e formatação de moeda R$ 000.000.000
function formatCurrencyInput(val) {
  if (!val) return "";
  const digits = String(val).replace(/\D/g, "");
  if (!digits) return "";
  const num = parseInt(digits, 10);
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(num);
}

function parseCurrencyToNumber(val) {
  if (!val) return 0;
  const digits = String(val).replace(/\D/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

function formatDateDisplay(dateStr) {
  if (!dateStr) return "";
  if (dateStr.includes("-")) {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const [y, m, d] = parts;
      return `${d}/${m}/${y}`;
    }
  }
  return dateStr;
}

// Ícones por Tipo de Atividade: Almoço (garfo e faca), Reunião (calendário), Pesquisa (lupa), Apresentação (documento)
function getActivityTypeIcon(tipo) {
  switch ((tipo || "").toLowerCase()) {
    case "almoço":
    case "almoco":
      return <Utensils className="w-4 h-4 text-amber-600 shrink-0" title="Almoço" />;
    case "reunião":
    case "reuniao":
      return <Calendar className="w-4 h-4 text-indigo-600 shrink-0" title="Reunião" />;
    case "pesquisa":
      return <Search className="w-4 h-4 text-sky-600 shrink-0" title="Pesquisa" />;
    case "apresentação":
    case "apresentacao":
      return <FileText className="w-4 h-4 text-purple-600 shrink-0" title="Apresentação" />;
    default:
      return <Calendar className="w-4 h-4 text-slate-600 shrink-0" title={tipo || "Atividade"} />;
  }
}

// Escala de cor do Nível de Relacionamento:
// Até 70%: vermelho
// 70% a 90%: amarelo
// Acima de 90%: verde
function getMaturityColor(score) {
  const num = Number(score) || 0;
  if (num > 90) {
    return {
      bar: "bg-emerald-500",
      text: "text-emerald-700",
      badge: "text-emerald-700 bg-emerald-50 border-emerald-200",
    };
  }
  if (num >= 70) {
    return {
      bar: "bg-amber-400",
      text: "text-amber-600",
      badge: "text-amber-700 bg-amber-50 border-amber-200",
    };
  }
  return {
    bar: "bg-rose-500",
    text: "text-rose-600",
    badge: "text-rose-700 bg-rose-50 border-rose-200",
  };
}

// Critério estrito de decisor executivo (Presidência, C-Level ou Diretoria)
const DECISOR_LEVELS = new Set(["presidência", "presidencia", "c-level", "diretoria"]);

function isStrictDecisor(c) {
  if (!c) return false;
  const nivel = (c.nivelDecisao || c.decisionLevel || "").toLowerCase().trim();
  if (DECISOR_LEVELS.has(nivel)) return true;
  const cargo = (c.cargo || "").toLowerCase().trim();
  return (
    cargo.startsWith("diretor") ||
    cargo.startsWith("vice-presidente") ||
    cargo.startsWith("vp ") ||
    cargo.startsWith("ceo") ||
    cargo.startsWith("presidente")
  );
}

// Seletor de Cliente do CRM com botão para criar empresa
function SearchableClientSelect({
  label,
  required,
  placeholder,
  items,
  selectedId,
  selectedName,
  onSelect,
  onCreateNew,
}) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!query.trim()) return items.slice(0, 50);
    const q = query.toLowerCase();
    return items
      .filter((it) => {
        const name = (it.nomeFantasia || it.razaoSocial || it.name || "").toLowerCase();
        const code = (it.codigo || "").toLowerCase();
        const seg = (it.segmento || "").toLowerCase();
        return name.includes(q) || code.includes(q) || seg.includes(q);
      })
      .slice(0, 50);
  }, [items, query]);

  return (
    <div className="relative">
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
        {label} {required && <span className="text-rose-500 font-bold">*</span>}
      </label>

      {selectedId ? (
        <div className="w-full h-10 bg-slate-50 border border-slate-300 rounded-lg px-3.5 flex items-center justify-between text-xs text-slate-800 font-semibold shadow-2xs">
          <span className="truncate">{selectedName || "Selecionado"}</span>
          <button
            type="button"
            onClick={() => onSelect("", "")}
            className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-200/50 transition-colors cursor-pointer"
            title="Remover seleção"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            type="text"
            required={required}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className="w-full h-10 bg-white border border-slate-300 rounded-lg px-3.5 pr-8 text-xs font-medium text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />

          {isOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setIsOpen(false)}
              />
              <div className="absolute z-30 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-hidden text-xs flex flex-col">
                <div className="overflow-y-auto max-h-48 divide-y divide-slate-100">
                  {filtered.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        onSelect(item.id, item.nomeFantasia || item.razaoSocial || item.name);
                        setIsOpen(false);
                        setQuery("");
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-50 transition-colors flex items-center justify-between group cursor-pointer"
                    >
                      <div>
                        <span className="font-semibold text-slate-800 group-hover:text-slate-900 block truncate">
                          {item.nomeFantasia || item.razaoSocial || item.name}
                        </span>
                        {item.razaoSocial && item.razaoSocial !== item.nomeFantasia && (
                          <span className="text-[10px] text-slate-400 block truncate">
                            {item.razaoSocial}
                          </span>
                        )}
                      </div>
                      {item.segmento && (
                        <span className="text-[10px] text-slate-400 font-medium shrink-0 ml-2">
                          {item.segmento}
                        </span>
                      )}
                    </button>
                  ))}
                  {filtered.length === 0 && (
                    <div className="p-3 text-slate-400 text-center text-xs">
                      Nenhum cliente encontrado para "{query}".
                    </div>
                  )}
                </div>

                {onCreateNew && (
                  <div className="p-2 bg-slate-50 border-t border-slate-200 shrink-0">
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        onCreateNew(query);
                        setIsOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50/80 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Criar Empresa {query ? `"${query}"` : ""}</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Seletor de Múltiplas Agências
function SearchableMultiAgencySelect({
  label,
  items,
  selectedAgencies = [],
  onChange,
  onCreateNew,
}) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const selectedIds = useMemo(
    () => new Set(selectedAgencies.map((a) => a.id)),
    [selectedAgencies]
  );

  const filtered = useMemo(() => {
    const available = items.filter((it) => !selectedIds.has(it.id));
    if (!query.trim()) return available.slice(0, 50);
    const q = query.toLowerCase();
    return available
      .filter((it) => {
        const name = (it.nomeFantasia || it.razaoSocial || it.name || "").toLowerCase();
        const code = (it.codigo || "").toLowerCase();
        return name.includes(q) || code.includes(q);
      })
      .slice(0, 50);
  }, [items, selectedIds, query]);

  const handleAdd = (item) => {
    const agencyObj = {
      id: item.id,
      name: item.nomeFantasia || item.razaoSocial || item.name,
    };
    onChange([...selectedAgencies, agencyObj]);
    setQuery("");
  };

  const handleRemove = (idToRemove) => {
    onChange(selectedAgencies.filter((a) => a.id !== idToRemove));
  };

  return (
    <div className="relative">
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
        {label}
      </label>

      {selectedAgencies.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedAgencies.map((ag) => (
            <span
              key={ag.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-300 text-xs font-medium shadow-2xs"
            >
              <span className="truncate max-w-[200px]">{ag.name}</span>
              <button
                type="button"
                onClick={() => handleRemove(ag.id)}
                className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                title={`Remover ${ag.name}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Buscar e adicionar agências cadastradas no CRM..."
          className="w-full h-10 bg-white border border-slate-300 rounded-lg px-3.5 pr-8 text-xs font-medium text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
        />
        <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-20"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute z-30 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-hidden text-xs flex flex-col">
              <div className="overflow-y-auto max-h-44 divide-y divide-slate-100">
                {filtered.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleAdd(item);
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 transition-colors flex items-center justify-between group cursor-pointer"
                  >
                    <div>
                      <span className="font-semibold text-slate-800 group-hover:text-slate-900 block truncate">
                        {item.nomeFantasia || item.razaoSocial || item.name}
                      </span>
                      {item.razaoSocial && item.razaoSocial !== item.nomeFantasia && (
                        <span className="text-[10px] text-slate-400 block truncate">
                          {item.razaoSocial}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium shrink-0 ml-2">
                      + Adicionar
                    </span>
                  </button>
                ))}
                {filtered.length === 0 && (
                  <div className="p-3 text-slate-400 text-center text-xs">
                    {query ? `Nenhuma agência encontrada para "${query}".` : "Todas as agências disponíveis foram adicionadas."}
                  </div>
                )}
              </div>

              {onCreateNew && (
                <div className="p-2 bg-slate-50 border-t border-slate-200 shrink-0">
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onCreateNew(query);
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50/80 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Cadastrar Agência {query ? `"${query}"` : ""}</span>
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Seletor de Responsável Pesquisável para Atividades (todos os usuários do CRM)
function SearchableResponsavelSelect({
  value,
  onChange,
  users = [],
  executivos = [],
  currentUser,
}) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const candidateList = users && users.length > 0 ? users : executivos;

  const options = useMemo(() => {
    const list = [];
    const seen = new Set();
    if (currentUser?.nome) {
      list.push({ id: "me", nome: currentUser.nome, label: `${currentUser.nome} (Você)` });
      seen.add(currentUser.nome.toLowerCase().trim());
    }
    (candidateList || []).forEach((ex) => {
      const name = ex.nome || ex.name;
      if (name && !seen.has(name.toLowerCase().trim())) {
        list.push({ id: ex.id || name, nome: name, label: name });
        seen.add(name.toLowerCase().trim());
      }
    });
    return list;
  }, [candidateList, currentUser]);

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter((op) => op.nome.toLowerCase().includes(q));
  }, [options, query]);

  return (
    <div className="relative">
      <label className="block text-xs font-semibold text-slate-700 mb-1">
        Responsável:
      </label>
      {value ? (
        <div className="w-full h-10 bg-slate-50 border border-slate-300 rounded-lg px-3 flex items-center justify-between text-xs text-slate-800 font-semibold shadow-2xs">
          <span className="truncate">{value}</span>
          <button
            type="button"
            onClick={() => {
              onChange("");
              setQuery("");
            }}
            className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-200/50 transition-colors cursor-pointer"
            title="Trocar responsável"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Buscar responsável pelo nome..."
            className="w-full h-10 bg-slate-50 border border-slate-300 rounded-lg px-3 pr-8 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />

          {isOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setIsOpen(false)}
              />
              <div className="absolute z-30 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-100 text-xs">
                {filtered.map((op) => (
                  <button
                    key={op.id}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onChange(op.nome);
                      setIsOpen(false);
                      setQuery("");
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors flex items-center justify-between group cursor-pointer"
                  >
                    <span className="font-semibold text-slate-800 group-hover:text-slate-900 block truncate">
                      {op.label}
                    </span>
                  </button>
                ))}
                {filtered.length === 0 && (
                  <div className="p-3 text-slate-400 text-center text-xs">
                    Nenhum usuário encontrado para "{query}".
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ==========================================
// CARD RESUMIDO DO CLIENTE NA TELA
// ==========================================
function CompactClientCard({
  item,
  mat,
  signal,
  faturamentoRealizado = 0,
  pipelineTotal = 0,
  onClick,
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200 ${signal.borderColor} p-3.5 shadow-2xs hover:shadow-md hover:border-slate-400 transition-all cursor-pointer group flex flex-col justify-between gap-2.5`}
    >
      {/* Linha 1: Nome da Empresa */}
      <div>
        <h3 className="font-bold text-slate-900 text-xs sm:text-sm tracking-tight truncate group-hover:text-sky-600 transition-colors">
          {item.nome_marca}
        </h3>
      </div>

      {/* Barra Compacta de Nível de Relacionamento */}
      <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Nível de Relacionamento:
        </span>
        <div className="flex-1 bg-slate-200 h-1.5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${getMaturityColor(mat.score).bar}`}
            style={{ width: `${mat.score}%` }}
          />
        </div>
        <span
          className={`font-mono font-bold text-xs ${getMaturityColor(mat.score).text}`}
        >
          {mat.score}%
        </span>
      </div>

      {/* Rodapé Resumido: Inv. Publicitário, Faturamento RedeTV! e Pipeline */}
      <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-1.5 text-[10px]">
        <div className="bg-slate-50 rounded-md p-1.5 text-center min-w-0">
          <span className="text-[9px] font-bold uppercase text-slate-400 block truncate">
            Inv. Publicitário
          </span>
          <span className="font-mono font-bold text-slate-800 text-[11px] block truncate" title={Number(item.investimento_estimado || 0) > 0 ? formatBRL(item.investimento_estimado) : "-"}>
            {Number(item.investimento_estimado || 0) > 0 ? formatBRL(item.investimento_estimado) : "-"}
          </span>
        </div>

        <div className="bg-slate-50 rounded-md p-1.5 text-center min-w-0">
          <span className="text-[9px] font-bold uppercase text-slate-400 block truncate">
            Fat. RedeTV!
          </span>
          <span className="font-mono font-bold text-emerald-700 text-[11px] block truncate" title={faturamentoRealizado > 0 ? formatBRL(faturamentoRealizado) : "-"}>
            {faturamentoRealizado > 0 ? formatBRL(faturamentoRealizado) : "-"}
          </span>
        </div>

        <div className="bg-slate-50 rounded-md p-1.5 text-center min-w-0">
          <span className="text-[9px] font-bold uppercase text-slate-400 block truncate">
            Pipeline
          </span>
          <span className="font-mono font-bold text-slate-800 text-[11px] block truncate" title={pipelineTotal > 0 ? formatBRL(pipelineTotal) : "-"}>
            {pipelineTotal > 0 ? formatBRL(pipelineTotal) : "-"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// CONTEÚDO COMPLETO DO MODAL POP-UP DO CLIENTE
// ==========================================
function ClientActionPlanDetailContent({
  item,
  client,
  mat,
  signal,
  faturamentoRealizado = 0,
  pipelineTotal = 0,
  opps2026_2027 = [],
  executivos = [],
  users = [],
  currentUser,
  onUpdateItem,
  onDeleteItem,
  onOpenContactPopup,
  addInteraction,
}) {
  const [expandedRelacionamento, setExpandedRelacionamento] = useState(false);
  const [expandedDecisores, setExpandedDecisores] = useState(false);
  const [expandedPlanoAcao, setExpandedPlanoAcao] = useState(false);
  const [expandedPipeline, setExpandedPipeline] = useState(false);
  const [expandedAtualizacoes, setExpandedAtualizacoes] = useState(false);

  // Estados locais para cadastrar e editar Atividade
  const [showAddAtividadeForm, setShowAddAtividadeForm] = useState(false);
  const [editingAtividadeId, setEditingAtividadeId] = useState(null);
  const [novaAtividadeTipo, setNovaAtividadeTipo] = useState("Reunião");
  const [novaAtividadeTexto, setNovaAtividadeTexto] = useState("");
  const [novaAtividadeResponsavel, setNovaAtividadeResponsavel] = useState("");
  const [novaAtividadeDataLimite, setNovaAtividadeDataLimite] = useState("");
  const [salvandoAtividade, setSalvandoAtividade] = useState(false);

  // Estados locais para registrar Atualização
  const [interactionType, setInteractionType] = useState("call");
  const [interactionText, setInteractionText] = useState("");
  const [salvandoInteracao, setSalvandoInteracao] = useState(false);

  const iniciativas = item.iniciativas || [];

  // Ranking do Plano de Ação: 1º Status ("Em Execução" primeiro), 2º Data Limite (menor para maior)
  const getStatusWeight = (st) => {
    const s = (st || "Em Execução").toLowerCase().trim();
    if (s.startsWith("em execu")) return 1;
    if (s.startsWith("não") || s.startsWith("nao")) return 2;
    if (s.startsWith("sucesso")) return 3;
    if (s.startsWith("cancel")) return 4;
    return 5;
  };

  const sortedIniciativas = useMemo(() => {
    return [...iniciativas].sort((a, b) => {
      const wA = getStatusWeight(a.status);
      const wB = getStatusWeight(b.status);
      if (wA !== wB) return wA - wB;

      // Ordenar por data limite crescente (menor para maior)
      const dateA = a.dataLimite ? new Date(a.dataLimite).getTime() : Infinity;
      const dateB = b.dataLimite ? new Date(b.dataLimite).getTime() : Infinity;
      if (dateA !== dateB) return dateA - dateB;

      return (a.createdAt || a.id || "").localeCompare(b.createdAt || b.id || "");
    });
  }, [iniciativas]);

  const handleStartCreateAtividade = () => {
    setEditingAtividadeId(null);
    setNovaAtividadeTipo("Reunião");
    setNovaAtividadeTexto("");
    setNovaAtividadeResponsavel("");
    setNovaAtividadeDataLimite("");
    setShowAddAtividadeForm(true);
  };

  const handleStartEditAtividade = (ini) => {
    setEditingAtividadeId(ini.id);
    setNovaAtividadeTipo(ini.tipo || "Reunião");
    setNovaAtividadeTexto(ini.text || "");
    setNovaAtividadeResponsavel(ini.responsavel === "Não atribuído" ? "" : ini.responsavel || "");
    setNovaAtividadeDataLimite(ini.dataLimite || "");
    setShowAddAtividadeForm(true);
  };

  const handleCancelAtividadeForm = () => {
    setShowAddAtividadeForm(false);
    setEditingAtividadeId(null);
    setNovaAtividadeTipo("Reunião");
    setNovaAtividadeTexto("");
    setNovaAtividadeResponsavel("");
    setNovaAtividadeDataLimite("");
  };

  // Salvar ou atualizar atividade
  const handleAddAtividade = async (e) => {
    e.preventDefault();
    if (!novaAtividadeTexto.trim()) return;
    setSalvandoAtividade(true);

    let updatedIniciativas;
    if (editingAtividadeId) {
      updatedIniciativas = iniciativas.map((ini) =>
        ini.id === editingAtividadeId
          ? {
              ...ini,
              tipo: novaAtividadeTipo || "Reunião",
              text: novaAtividadeTexto.trim(),
              responsavel: novaAtividadeResponsavel.trim() || "Não atribuído",
              dataLimite: novaAtividadeDataLimite || null,
            }
          : ini
      );
    } else {
      const novaAtiv = {
        id: `ini_${Date.now()}`,
        tipo: novaAtividadeTipo || "Reunião",
        text: novaAtividadeTexto.trim(),
        responsavel: novaAtividadeResponsavel.trim() || "Não atribuído",
        dataLimite: novaAtividadeDataLimite || null,
        status: "Em Execução",
        done: false,
        date: new Date().toLocaleDateString("pt-BR"),
        createdAt: new Date().toISOString(),
      };
      updatedIniciativas = [...iniciativas, novaAtiv];
    }

    await onUpdateItem(item.id, { iniciativas: updatedIniciativas });
    handleCancelAtividadeForm();
    setSalvandoAtividade(false);
  };

  // Alterar Status de uma tarefa criada
  const handleChangeStatus = async (iniId, newStatus) => {
    const updated = iniciativas.map((ini) =>
      ini.id === iniId
        ? {
            ...ini,
            status: newStatus,
            done: newStatus === "Sucesso",
          }
        : ini
    );
    await onUpdateItem(item.id, { iniciativas: updated });
  };

  const handleDeleteAtividade = async (iniId) => {
    const updated = iniciativas.filter((ini) => ini.id !== iniId);
    await onUpdateItem(item.id, { iniciativas: updated });
  };

  // Registrar atualização
  const handleRegisterInteraction = (e) => {
    e.preventDefault();
    if (!interactionText.trim() || !item.client_id) return;
    setSalvandoInteracao(true);

    if (addInteraction) {
      addInteraction(item.client_id, interactionType, interactionText.trim());
    }
    setInteractionText("");
    setSalvandoInteracao(false);
  };

  const clientInteractions = client?.interactions || [];

  const getStatusBadge = (status) => {
    switch (status) {
      case "Sucesso":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Em Execução":
        return "bg-sky-50 text-sky-700 border-sky-200";
      case "Não Realizada":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Cancelada":
        return "bg-slate-100 text-slate-600 border-slate-300";
      default:
        return "bg-sky-50 text-sky-700 border-sky-200";
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. CAIXA EXPANSÍVEL: NÍVEL DE RELACIONAMENTO */}
      <div className="bg-slate-50/80 border border-slate-200 rounded-xl overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => setExpandedRelacionamento(!expandedRelacionamento)}
          className="w-full p-3 flex items-center justify-between gap-3 text-left hover:bg-slate-100/70 transition-colors cursor-pointer select-none"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 truncate">
              Nível de Relacionamento
            </span>
          </div>

          <div className="flex-1 max-w-xs bg-slate-200 h-2 rounded-full overflow-hidden shrink-0 hidden sm:block">
            <div
              className={`h-full rounded-full transition-all duration-300 ${getMaturityColor(mat.score).bar}`}
              style={{ width: `${mat.score}%` }}
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`font-mono font-bold text-xs sm:text-sm ${getMaturityColor(mat.score).text}`}
            >
              {mat.score}%
            </span>
            {expandedRelacionamento ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </div>
        </button>

        {expandedRelacionamento && (
          <div className="p-3 border-t border-slate-200 bg-white space-y-2 animate-in fade-in duration-150">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              {/* 1. Marcas Mapeadas */}
              <div className={`flex items-center gap-2 p-2 rounded-lg border ${
                mat.pillars.hasCompany ? "bg-emerald-50/60 border-emerald-200 text-slate-800" : "bg-slate-50 border-slate-200 text-slate-400"
              }`}>
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                  mat.pillars.hasCompany ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-500"
                }`}>
                  {mat.pillars.hasCompany ? "✓" : "○"}
                </span>
                <span className={mat.pillars.hasCompany ? "font-semibold text-slate-800" : "text-slate-500"}>
                  1. Marcas Mapeadas
                </span>
              </div>

              {/* 2. Agências Mapeadas */}
              <div className={`flex items-center gap-2 p-2 rounded-lg border ${
                mat.pillars.hasAgency ? "bg-emerald-50/60 border-emerald-200 text-slate-800" : "bg-slate-50 border-slate-200 text-slate-400"
              }`}>
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                  mat.pillars.hasAgency ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-500"
                }`}>
                  {mat.pillars.hasAgency ? "✓" : "○"}
                </span>
                <span className={mat.pillars.hasAgency ? "font-semibold text-slate-800" : "text-slate-500"}>
                  2. Agências Mapeadas
                </span>
              </div>

              {/* 3. Decisores Mapeados */}
              <div className={`flex items-center gap-2 p-2 rounded-lg border ${
                mat.pillars.hasCLevel ? "bg-emerald-50/60 border-emerald-200 text-slate-800" : "bg-slate-50 border-slate-200 text-slate-400"
              }`}>
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                  mat.pillars.hasCLevel ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-500"
                }`}>
                  {mat.pillars.hasCLevel ? "✓" : "○"}
                </span>
                <span className={mat.pillars.hasCLevel ? "font-semibold text-slate-800" : "text-slate-500"}>
                  3. Decisores Mapeados
                </span>
              </div>

              {/* 4. Hobbies e Interesses */}
              <div className={`flex items-center gap-2 p-2 rounded-lg border ${
                mat.pillars.hasHobbiesOrSports ? "bg-emerald-50/60 border-emerald-200 text-slate-800" : "bg-slate-50 border-slate-200 text-slate-400"
              }`}>
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                  mat.pillars.hasHobbiesOrSports ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-500"
                }`}>
                  {mat.pillars.hasHobbiesOrSports ? "✓" : "○"}
                </span>
                <span className={mat.pillars.hasHobbiesOrSports ? "font-semibold text-slate-800" : "text-slate-500"}>
                  4. Hobbies e Interesses
                </span>
              </div>

              {/* 5. Plano de Ação */}
              <div className={`flex items-center gap-2 p-2 rounded-lg border ${
                mat.pillars.hasActionPlan ? "bg-emerald-50/60 border-emerald-200 text-slate-800" : "bg-slate-50 border-slate-200 text-slate-400"
              }`}>
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                  mat.pillars.hasActionPlan ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-500"
                }`}>
                  {mat.pillars.hasActionPlan ? "✓" : "○"}
                </span>
                <span className={mat.pillars.hasActionPlan ? "font-semibold text-slate-800" : "text-slate-500"}>
                  5. Plano de Ação
                </span>
              </div>

              {/* 6. Proposta no Pipeline */}
              <div className={`flex items-center gap-2 p-2 rounded-lg border ${
                mat.pillars.hasPipelineOpp ? "bg-emerald-50/60 border-emerald-200 text-slate-800" : "bg-slate-50 border-slate-200 text-slate-400"
              }`}>
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                  mat.pillars.hasPipelineOpp ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-500"
                }`}>
                  {mat.pillars.hasPipelineOpp ? "✓" : "○"}
                </span>
                <span className={mat.pillars.hasPipelineOpp ? "font-semibold text-slate-800" : "text-slate-500"}>
                  6. Proposta no Pipeline
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. DOIS BOXES FIXOS: "Marcas" e "Agências" */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
            <Tag className="w-3 h-3 text-slate-400" />
            Marcas
          </span>
          <div className="flex flex-wrap gap-1 items-center">
            {(item.sub_marcas || []).map((m) => (
              <span
                key={m}
                className="inline-flex items-center px-2 py-0.5 rounded-md bg-white border border-slate-300 text-slate-800 text-[11px] font-semibold shadow-2xs"
              >
                #{m.replace(/^#/, "")}
              </span>
            ))}
            {(!item.sub_marcas || item.sub_marcas.length === 0) && (
              <span className="text-slate-400 text-xs italic">Nenhuma marca mapeada</span>
            )}
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
            <Briefcase className="w-3 h-3 text-slate-400" />
            Agências
          </span>
          <div className="text-xs font-semibold text-slate-800 truncate" title={item.agencia_nome || "Nenhuma agência mapeada"}>
            {item.agencia_nome || <span className="text-slate-400 italic font-normal">Nenhuma agência mapeada</span>}
          </div>
        </div>
      </div>

      {/* 3. TRÊS BOXES FIXOS: "Estimativa de Investimento Publicitário", "Faturamento RedeTV!" e "Pipeline Total" */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            INV. PUBLICITÁRIO
          </span>
          <div className="font-mono font-bold text-slate-900 text-xs sm:text-sm truncate" title={Number(item.investimento_estimado || 0) > 0 ? formatBRL(item.investimento_estimado) : "-"}>
            {Number(item.investimento_estimado || 0) > 0 ? formatBRL(item.investimento_estimado) : "-"}
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Faturamento RedeTV!
          </span>
          <div className="font-mono font-bold text-emerald-700 text-xs sm:text-sm truncate" title={formatBRL(faturamentoRealizado)}>
            {formatBRL(faturamentoRealizado)}
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Pipeline Total
          </span>
          <div className="font-mono font-bold text-slate-900 text-xs sm:text-sm truncate" title={formatBRL(pipelineTotal)}>
            {formatBRL(pipelineTotal)}
          </div>
        </div>
      </div>

      {/* 4. CAIXA EXPANSÍVEL: DECISORES MAPEADOS */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
        <button
          type="button"
          onClick={() => setExpandedDecisores(!expandedDecisores)}
          className="w-full p-3 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer select-none"
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-violet-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Decisores Mapeados
            </span>
            <span className="text-[11px] font-semibold text-violet-700 bg-violet-50 px-2 py-0.2 rounded-full border border-violet-200">
              {mat.decisores.length} decisor(es)
            </span>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              ({mat.totalContactsCount} contatos totais no CRM)
            </span>
          </div>
          {expandedDecisores ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {expandedDecisores && (
          <div className="p-3 border-t border-slate-100 space-y-2 bg-slate-50/50 animate-in fade-in duration-150">
            {mat.decisores.map((decisor) => (
              <div
                key={decisor.id}
                onClick={() => onOpenContactPopup(decisor)}
                className="bg-white p-3 rounded-xl border border-slate-200 hover:border-violet-300 hover:shadow-xs transition-all cursor-pointer group"
                title="Clique para ver os dados completos do contato"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 text-xs group-hover:text-violet-600 transition-colors">
                        {decisor.name}
                      </span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-violet-600 transition-colors" />
                    </div>
                    <span className="text-[11px] text-slate-500">
                      {decisor.cargo || decisor.departamento || "Sem cargo"}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-violet-50 text-violet-700 border border-violet-200 shrink-0">
                    {decisor.nivelDecisao || decisor.decisionLevel || "Decisor"}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono mt-1.5 flex-wrap">
                  {decisor.celular && <span>📞 {decisor.celular}</span>}
                  {decisor.email && <span>✉️ {decisor.email}</span>}
                </div>

                <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-[10px] flex-wrap gap-1.5">
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-slate-400 font-bold uppercase tracking-wider">Interesses:</span>
                    {(decisor.hobbies || []).map((h) => (
                      <span key={h} className="px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
                        {h}
                      </span>
                    ))}
                    {(decisor.sports || []).map((s) => (
                      <span key={s} className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                        {s}
                      </span>
                    ))}
                    {(!decisor.hobbies || decisor.hobbies.length === 0) && (!decisor.sports || decisor.sports.length === 0) && (
                      <span className="text-slate-400 italic">Nenhum hobby/esporte cadastrado</span>
                    )}
                  </div>
                  <span className="text-violet-600 font-semibold group-hover:underline">
                    Ver ficha detalhada →
                  </span>
                </div>
              </div>
            ))}

            {mat.decisores.length === 0 && (
              <div className="p-4 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-400">
                Nenhum contato cadastrado como Presidência, C-Level ou Diretoria para este cliente.
                {mat.allContacts.length > 0 && (
                  <span className="block mt-1 text-slate-500 font-medium">
                    ({mat.allContacts.length} contato(s) cadastrados no CRM com outros cargos)
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. CAIXA EXPANSÍVEL: PLANO DE AÇÃO (ATIVIDADES) */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
        <button
          type="button"
          onClick={() => setExpandedPlanoAcao(!expandedPlanoAcao)}
          className="w-full p-3 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer select-none"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Plano de Ação
            </span>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded-full border border-emerald-200">
              Atividades Concluídas: {iniciativas.filter((i) => i.status === "Sucesso" || i.done).length} / {iniciativas.length}
            </span>
          </div>
          {expandedPlanoAcao ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {expandedPlanoAcao && (
          <div className="p-3.5 border-t border-slate-100 space-y-3.5 bg-slate-50/50 animate-in fade-in duration-150 text-xs">
            {/* Lista de Atividades Cadastradas */}
            <div className="space-y-2">
              {sortedIniciativas.map((ini) => {
                const isConcluida = ini.status === "Sucesso" || ini.done;
                const isInactive = isConcluida || ini.status === "Cancelada";

                return (
                  <div
                    key={ini.id}
                    className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                      isInactive
                        ? "bg-slate-100/90 border-slate-200 text-slate-500 shadow-none"
                        : "bg-white border-slate-200 shadow-2xs text-slate-900"
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className={`mt-0.5 p-1 rounded-md shrink-0 ${isInactive ? "bg-slate-200/80 grayscale opacity-80" : "bg-slate-100"}`}>
                        {getActivityTypeIcon(ini.tipo)}
                      </span>
                      <div className="min-w-0">
                        <p className={`font-semibold ${isConcluida ? "line-through text-slate-400" : isInactive ? "text-slate-500" : "text-slate-900"}`}>
                          {ini.text}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap text-[11px] text-slate-500">
                          <span>
                            Resp: <strong className={isInactive ? "text-slate-600" : "text-slate-700"}>{ini.responsavel || "Não atribuído"}</strong>
                          </span>
                          <span>
                            • Criado em: <strong className={isInactive ? "text-slate-500" : "text-slate-600"}>{ini.date || formatDateDisplay(ini.createdAt?.slice(0, 10)) || "-"}</strong>
                          </span>
                          <span>
                            • Data Limite: <strong className={isInactive ? "text-slate-600" : "text-slate-800"}>{ini.dataLimite ? formatDateDisplay(ini.dataLimite) : "-"}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {/* Menu Suspenso de Status */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status:</span>
                      <select
                        value={ini.status || "Em Execução"}
                        onChange={(e) => handleChangeStatus(ini.id, e.target.value)}
                        className={`h-8 px-2.5 rounded-lg border text-xs font-bold cursor-pointer focus:outline-none transition-colors ${getStatusBadge(
                          ini.status || "Em Execução"
                        )}`}
                      >
                        <option value="Em Execução">Em Execução</option>
                        <option value="Sucesso">Sucesso</option>
                        <option value="Não Realizada">Não Realizada</option>
                        <option value="Cancelada">Cancelada</option>
                      </select>
                    </div>

                    {/* Botão Editar */}
                    <button
                      type="button"
                      onClick={() => handleStartEditAtividade(ini)}
                      className="text-slate-400 hover:text-sky-600 p-1.5 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Editar atividade"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    {/* Botão Excluir */}
                    <button
                      type="button"
                      onClick={() => handleDeleteAtividade(ini.id)}
                      className="text-slate-400 hover:text-rose-600 p-1.5 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Excluir atividade"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

              {iniciativas.length === 0 && (
                <div className="p-4 bg-white rounded-xl border border-dashed border-slate-200 text-center text-slate-400 text-xs">
                  Nenhuma atividade cadastrada no plano de ação deste cliente.
                </div>
              )}
            </div>

            {/* Formulário: Atividade, Tipo, Responsável e Data Limite */}
            {showAddAtividadeForm && (
              <form onSubmit={handleAddAtividade} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs uppercase tracking-wider block">
                    {editingAtividadeId ? "Editar Atividade" : "Cadastrar Nova Atividade"}
                  </span>
                  <button
                    type="button"
                    onClick={handleCancelAtividadeForm}
                    className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Cancelar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tipo de Atividade:
                    </label>
                    <div className="relative">
                      <select
                        value={novaAtividadeTipo}
                        onChange={(e) => setNovaAtividadeTipo(e.target.value)}
                        className="w-full h-10 appearance-none bg-slate-50 border border-slate-300 rounded-lg px-3 pr-8 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all cursor-pointer"
                      >
                        <option value="Reunião">📅 Reunião</option>
                        <option value="Almoço">🍴 Almoço</option>
                        <option value="Pesquisa">🔍 Pesquisa</option>
                        <option value="Apresentação">📄 Apresentação</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Atividade <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={novaAtividadeTexto}
                      onChange={(e) => setNovaAtividadeTexto(e.target.value)}
                      placeholder="Breve descrição da atividade (ex: Reunião com VP de Marketing para apresentar projeto)"
                      className="w-full h-10 bg-slate-50 border border-slate-300 rounded-lg px-3 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Responsável com Caixa de Busca */}
                  <SearchableResponsavelSelect
                    value={novaAtividadeResponsavel}
                    onChange={(novoResp) => setNovaAtividadeResponsavel(novoResp)}
                    users={users && users.length > 0 ? users : executivos}
                    executivos={executivos}
                    currentUser={currentUser}
                  />

                  {/* Data Limite */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Data Limite:
                    </label>
                    <input
                      type="date"
                      value={novaAtividadeDataLimite}
                      onChange={(e) => setNovaAtividadeDataLimite(e.target.value)}
                      className="w-full h-10 bg-slate-50 border border-slate-300 rounded-lg px-3 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex justify-end items-center gap-2 pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleCancelAtividadeForm}
                    className="h-9 px-3 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={salvandoAtividade || !novaAtividadeTexto.trim()}
                    className="h-9 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shrink-0 cursor-pointer transition-colors shadow-xs disabled:opacity-50"
                  >
                    {salvandoAtividade ? "Salvando..." : editingAtividadeId ? "Salvar Alterações" : "Salvar Atividade"}
                  </button>
                </div>
              </form>
            )}

            {/* Botão + Atividade na parte inferior (quando formulário não estiver aberto) */}
            {!showAddAtividadeForm && (
              <div className="flex justify-start pt-1">
                <button
                  type="button"
                  onClick={handleStartCreateAtividade}
                  className="h-9 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Atividade</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 6. CAIXA EXPANSÍVEL: PROPOSTAS NO PIPELINE (2026/2027) */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
        <button
          type="button"
          onClick={() => setExpandedPipeline(!expandedPipeline)}
          className="w-full p-3 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer select-none"
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-sky-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Propostas no Pipeline
            </span>
            <span className="text-[11px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.2 rounded-full border border-sky-200">
              {opps2026_2027.length} proposta(s)
            </span>
            {opps2026_2027.length > 0 && (
              <span className="text-[11px] font-mono font-bold text-slate-700 hidden sm:inline">
                ({formatBRL(opps2026_2027.reduce((s, o) => s + (Number(o.value) || 0), 0))})
              </span>
            )}
          </div>
          {expandedPipeline ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {expandedPipeline && (
          <div className="p-3 border-t border-slate-100 space-y-2 bg-slate-50/50 animate-in fade-in duration-150 text-xs">
            {opps2026_2027.map((opp) => (
              <div
                key={opp.id}
                className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-xs">
                      {opp.title || "Proposta sem título"}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {opp.stage || "Em Aberto"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1 flex-wrap">
                    {opp.executivo && <span>Resp: <strong>{opp.executivo}</strong></span>}
                    {opp.periodMonths && opp.periodMonths.length > 0 && (
                      <span>• Meses: {opp.periodMonths.join(", ")}</span>
                    )}
                    {opp.probability && <span>• Prob: {opp.probability}%</span>}
                  </div>
                </div>

                <div className="text-right sm:shrink-0">
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {formatBRL(opp.value || 0)}
                  </span>
                </div>
              </div>
            ))}

            {opps2026_2027.length === 0 && (
              <div className="p-4 bg-white rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
                Nenhuma proposta cadastrada no pipeline para o ano vigente (2026) ou ano seguinte (2027).
              </div>
            )}
          </div>
        )}
      </div>

      {/* 7. CAIXA EXPANSÍVEL: ATUALIZAÇÕES & REUNIÕES */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
        <button
          type="button"
          onClick={() => setExpandedAtualizacoes(!expandedAtualizacoes)}
          className="w-full p-3 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer select-none"
        >
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Atualizações & Contatos
            </span>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded-full border border-emerald-200">
              {clientInteractions.length} registro(s)
            </span>
          </div>
          {expandedAtualizacoes ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {expandedAtualizacoes && (
          <div className="p-3.5 border-t border-slate-100 space-y-3.5 bg-slate-50/50 animate-in fade-in duration-150 text-xs">
            <form onSubmit={handleRegisterInteraction} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  Registrar Nova Atualização
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setInteractionType("call")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                      interactionType === "call"
                        ? "bg-slate-900 text-white shadow-2xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <Phone className="w-3 h-3" />
                    <span>Ligação</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInteractionType("whatsapp")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                      interactionType === "whatsapp"
                        ? "bg-emerald-700 text-white shadow-2xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <MessageCircle className="w-3 h-3" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInteractionType("meeting")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                      interactionType === "meeting"
                        ? "bg-indigo-700 text-white shadow-2xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <Calendar className="w-3 h-3" />
                    <span>Reunião</span>
                  </button>
                </div>
              </div>

              <div className="relative">
                <textarea
                  rows={3}
                  value={interactionText}
                  onChange={(e) => setInteractionText(e.target.value)}
                  placeholder={`Descreva os detalhes da ${
                    interactionType === "call" ? "ligação" : interactionType === "whatsapp" ? "conversa no WhatsApp" : "reunião"
                  } com o cliente...`}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all resize-y"
                />
              </div>

              {/* Botão de Enviar Alinhado com Gravar e Upload (sem o texto "Grave áudio...") */}
              <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                <div className="flex items-center gap-2">
                  <AudioRecorder
                    onTranscribeComplete={(result) => {
                      const transcript = result?.text || result?.transcription || "";
                      if (transcript) {
                        setInteractionText((prev) => (prev ? `${prev}\n\n[Áudio Transcrito]: ${transcript}` : transcript));
                      }
                    }}
                    onError={(err) => alert(err)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={salvandoInteracao || !interactionText.trim() || !item.client_id}
                  className="h-9 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{salvandoInteracao ? "Salvando..." : "Registrar Atualização"}</span>
                </button>
              </div>
            </form>

            <div className="space-y-2">
              <span className="font-bold text-slate-700 text-xs uppercase tracking-wider block">
                Histórico Integrado ({clientInteractions.length})
              </span>

              {clientInteractions.map((inter) => (
                <div
                  key={inter.id}
                  className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                      {inter.type === "call" ? "📞 Ligação" : inter.type === "whatsapp" ? "💬 WhatsApp" : inter.type === "meeting" ? "🤝 Reunião" : "📝 Nota"}
                    </span>
                    <span className="font-mono">{inter.date}</span>
                  </div>
                  <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {inter.note}
                  </p>
                  {inter.aiSummary && (
                    <div className="p-2 rounded bg-indigo-50/70 border border-indigo-100 text-[11px] text-indigo-900">
                      <strong>Resumo IA:</strong> {inter.aiSummary}
                    </div>
                  )}
                </div>
              ))}

              {clientInteractions.length === 0 && (
                <div className="p-4 bg-white rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
                  Nenhuma atualização registrada para este cliente ainda. O que for registrado aqui será refletido imediatamente no card do Cliente.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export default function PipelineEstrategicoTab({
  currentUser,
  advertisers = [],
  contacts = [],
  opportunities = [],
  faturamentoEfetivo = [],
  executivos = [],
  segmentoExecutivo = {},
  setView,
  setSelectedContactId,
  openCreateClient,
  newlyCreatedClient,
  addInteraction,
  allUsers = [],
  responsaveis = [],
}) {
  const [selectedSegment, setSelectedSegment] = useState(SEGMENTOS[0] || "Farmacêutico & Higiene");
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingClientId, setEditingClientId] = useState(null);
  const [activeClientModal, setActiveClientModal] = useState(null); // Modal Pop-up do Cliente
  const [selectedContactPopup, setSelectedContactPopup] = useState(null); // Pop-up do Contato Decisor

  // Todos os usuários do CRM para seleção de responsáveis
  const [userList, setUserList] = useState(
    allUsers && allUsers.length > 0 ? allUsers : (responsaveis && responsaveis.length > 0 ? responsaveis : executivos)
  );

  useEffect(() => {
    if (allUsers && allUsers.length > 0) {
      setUserList(allUsers);
    } else {
      apiGet("/users/all")
        .then((res) => {
          if (Array.isArray(res) && res.length > 0) {
            setUserList(res);
          }
        })
        .catch(() => {});
    }
  }, [allUsers]);

  const [addForm, setAddForm] = useState({
    tipo: "mercado",
    client_id: "",
    nome_marca: "",
    marcas_str: "",
    agencias: [],
    investimento_estimado: "",
    racional: "",
  });

  // Atualiza automaticamente o formulário caso uma nova empresa ou agência seja cadastrada via modal do CRM
  useEffect(() => {
    if (newlyCreatedClient?.id) {
      if (newlyCreatedClient.type === "Agência") {
        setAddForm((prev) => {
          const exists = (prev.agencias || []).some((a) => a.id === newlyCreatedClient.id);
          if (exists) return prev;
          return {
            ...prev,
            agencias: [...(prev.agencias || []), { id: newlyCreatedClient.id, name: newlyCreatedClient.name }],
          };
        });
      } else {
        setAddForm((prev) => ({
          ...prev,
          client_id: newlyCreatedClient.id,
          nome_marca: newlyCreatedClient.name || "",
        }));
      }
      setShowAddModal(true);
    }
  }, [newlyCreatedClient]);

  // Clientes do tipo Anunciante para Empresa
  const advertiserClients = useMemo(() => {
    return (advertisers || [])
      .filter((a) => a.type !== "Agência")
      .sort((a, b) => (a.nomeFantasia || a.razaoSocial || a.name || "").localeCompare(b.nomeFantasia || b.razaoSocial || b.name || "", "pt-BR"));
  }, [advertisers]);

  // Clientes do tipo Agência para Agências de Publicidade
  const agencyClients = useMemo(() => {
    return (advertisers || [])
      .filter((a) => a.type === "Agência")
      .sort((a, b) => (a.nomeFantasia || a.razaoSocial || a.name || "").localeCompare(b.nomeFantasia || b.razaoSocial || b.name || "", "pt-BR"));
  }, [advertisers]);

  // Carregar dados da API
  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getPipelineEstrategico(selectedSegment);
      setItems(data || []);
    } catch (err) {
      console.error("Erro ao carregar dados do Plano de Ação:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedSegment]);

  // Navegar para o card do contato no CRM
  const handleGoToContact = (contactId) => {
    if (setSelectedContactId && setView) {
      setSelectedContactPopup(null);
      setActiveClientModal(null);
      setSelectedContactId(contactId);
      setView("contacts");
    }
  };

  // Mapeamento de contatos por cliente
  const contactsByClient = useMemo(() => {
    const map = new Map();
    contacts.forEach((c) => {
      if (!c.clientId) return;
      if (!map.has(c.clientId)) map.set(c.clientId, []);
      map.get(c.clientId).push(c);
    });
    return map;
  }, [contacts]);

  // Mapeamento de oportunidades abertas por cliente
  const openOppsByClient = useMemo(() => {
    const map = new Map();
    opportunities.forEach((o) => {
      if (!o.advertiserId) return;
      if (["Fechado", "Negado", "Cancelado"].includes(o.stage)) return;
      if (!map.has(o.advertiserId)) map.set(o.advertiserId, []);
      map.get(o.advertiserId).push(o);
    });
    return map;
  }, [opportunities]);

  // Mapeamento de propostas do ano vigente (2026) e ano seguinte (2027) por cliente
  const opps2026_2027ByClient = useMemo(() => {
    const map = new Map();
    opportunities.forEach((o) => {
      if (!o.advertiserId) return;
      const pMonths = o.periodMonths || [];
      const has2026or2027 = pMonths.some((m) => m && (m.includes("2026") || m.includes("2027")));
      const createdYear = o.createdAt ? String(o.createdAt).slice(0, 4) : "";
      const isCreated2026or2027 = createdYear === "2026" || createdYear === "2027";
      if (has2026or2027 || isCreated2026or2027 || (!pMonths.length && !createdYear)) {
        if (!map.has(o.advertiserId)) map.set(o.advertiserId, []);
        map.get(o.advertiserId).push(o);
      }
    });
    return map;
  }, [opportunities]);

  // Mapeamento de faturamento por código de cliente (ano vigente 2026)
  const faturamentoByCodigo = useMemo(() => {
    const map = new Map();
    (faturamentoEfetivo || []).forEach((f) => {
      const cod = String(f.clienteCodigo || "").trim();
      const per = String(f.periodo || "").toLowerCase().trim();
      if (!cod || !per.startsWith("2026-")) return;
      map.set(cod, (map.get(cod) || 0) + (Number(f.valor) || 0));
    });
    return map;
  }, [faturamentoEfetivo]);

  // Função para calcular faturamento realizado na RedeTV! (faturamento efetivo 2026 + negócios fechados 2026)
  const getInvestimentoRealizado = (item) => {
    if (!item?.client_id) return 0;
    const client = (advertisers || []).find((a) => a.id === item.client_id);
    let totalFat = 0;
    if (client?.codigo) {
      totalFat += faturamentoByCodigo.get(String(client.codigo).trim()) || 0;
    }
    const closedOppsVal = (opportunities || [])
      .filter((o) => {
        if (o.advertiserId !== item.client_id || o.stage !== "Fechado") return false;
        const pMonths = o.periodMonths || [];
        const has2026 = pMonths.some((m) => m && m.includes("2026"));
        const createdYear = o.createdAt ? String(o.createdAt).slice(0, 4) : "";
        return has2026 || createdYear === "2026" || (!pMonths.length && !createdYear);
      })
      .reduce((sum, o) => sum + (Number(o.value) || 0), 0);
    return totalFat + closedOppsVal;
  };

  // Sinalizador de status do cliente no card:
  const getCardSignal = (item) => {
    const invRealizado = getInvestimentoRealizado(item);
    const activeOpps = item.client_id ? openOppsByClient.get(item.client_id) || [] : [];
    const hasActivePipeline = activeOpps.length > 0 && activeOpps.some((o) => (o.value || 0) > 0 || o.title);

    if (invRealizado > 0) {
      return {
        type: "investimento_realizado",
        borderColor: "border-l-4 border-l-emerald-500",
        badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
        label: "Investimento Realizado",
        valueText: formatBRL(invRealizado),
      };
    }
    if (hasActivePipeline) {
      const oppsVal = activeOpps.reduce((s, o) => s + (o.value || 0), 0);
      return {
        type: "pipeline_ativo",
        borderColor: "border-l-4 border-l-amber-400",
        badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
        label: "Pipeline Ativo",
        valueText: oppsVal > 0 ? formatBRL(oppsVal) : `${activeOpps.length} opp(s)`,
      };
    }
    return {
      type: "sem_investimento_sem_pipeline",
      borderColor: "border-l-4 border-l-rose-500",
      badgeBg: "bg-rose-50 text-rose-700 border-rose-200",
      label: "Sem Investimento & Sem Pipeline",
      valueText: "R$ 0",
    };
  };

  // Cálculo dinâmico do Nível de Relacionamento (0 a 100%)
  const computeMaturity = (item) => {
    const clientContacts = item.client_id ? contactsByClient.get(item.client_id) || [] : [];
    const clientOpps = item.client_id ? openOppsByClient.get(item.client_id) || [] : [];
    const iniciativas = item.iniciativas || [];

    const hasCompany = Boolean(
      (item.sub_marcas && item.sub_marcas.length > 0) ||
      (item.nome_marca && item.nome_marca.trim().length > 1) ||
      item.client_id
    );

    const hasAgency = Boolean(item.agencia_nome && item.agencia_nome.trim().length > 1);

    const decisores = clientContacts.filter(isStrictDecisor);
    const hasCLevel = decisores.length > 0;

    const hasHobbiesOrSports = clientContacts.some(
      (c) => (c.hobbies && c.hobbies.length > 0) || (c.sports && c.sports.length > 0)
    );

    const hasActionPlan = iniciativas.length > 0;
    const hasPipelineOpp = clientOpps.length > 0;

    let score = 0;
    if (hasCompany) score += 15;
    if (hasAgency) score += 15;
    if (hasCLevel) score += 20;
    if (hasHobbiesOrSports) score += 20;
    if (hasActionPlan) score += 15;
    if (hasPipelineOpp) score += 15;

    return {
      score,
      pillars: {
        hasCompany,
        hasAgency,
        hasCLevel,
        hasHobbiesOrSports,
        hasActionPlan,
        hasPipelineOpp,
      },
      allContacts: clientContacts,
      totalContactsCount: clientContacts.length,
      decisores,
      decisoresCount: decisores.length,
      clientOpps,
      pipelineVal: clientOpps.reduce((sum, o) => sum + (o.value || 0), 0),
    };
  };

  // Separação em Top Mercado e Top Estratégicos
  const mercadoItems = useMemo(() => {
    return items
      .filter((i) => i.tipo === "mercado")
      .sort((a, b) => (a.posicao || 0) - (b.posicao || 0) || (a.nome_marca || "").localeCompare(b.nome_marca || "", "pt-BR"));
  }, [items]);

  const estrategicoItems = useMemo(() => {
    return items
      .filter((i) => i.tipo === "estrategico")
      .sort((a, b) => (a.posicao || 0) - (b.posicao || 0) || (a.nome_marca || "").localeCompare(b.nome_marca || "", "pt-BR"));
  }, [items]);

  // Métricas Globais do Segmento (4 Boxes)
  const segmentStats = useMemo(() => {
    if (items.length === 0) {
      return {
        avgMaturity: 0,
        decisoresCount: 0,
        totalContatosCount: 0,
        totalPipeline: 0,
        totalInvestimentoEstimado: 0,
        totalInvestimentoRedeTV: 0,
        clientesAtivosCount: 0,
        totalClientesCadastrados: 0,
      };
    }

    let totalScore = 0;
    let totalPipeline = 0;
    let totalInvestimentoEstimado = 0;
    let totalInvestimentoRedeTV = 0;
    let clientesAtivosCount = 0;
    const seenDecisorIds = new Set();
    const seenAllContactIds = new Set();

    items.forEach((item) => {
      const mat = computeMaturity(item);
      totalScore += mat.score;
      totalPipeline += mat.pipelineVal;
      totalInvestimentoEstimado += Number(item.investimento_estimado || 0);
      mat.decisores.forEach((c) => seenDecisorIds.add(c.id));
      mat.allContacts.forEach((c) => seenAllContactIds.add(c.id));

      const invRealizado = getInvestimentoRealizado(item);
      totalInvestimentoRedeTV += invRealizado;
      if (invRealizado > 0) {
        clientesAtivosCount++;
      }
    });

    return {
      avgMaturity: Math.round(totalScore / Math.max(1, items.length)),
      decisoresCount: seenDecisorIds.size,
      totalContatosCount: seenAllContactIds.size,
      totalPipeline,
      totalInvestimentoEstimado,
      totalInvestimentoRedeTV,
      clientesAtivosCount,
      totalClientesCadastrados: items.length,
    };
  }, [items, contactsByClient, openOppsByClient, faturamentoByCodigo, opportunities]);

  // Filtragem por busca
  const filterMatches = (item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const marcasStr = (item.sub_marcas || []).join(" ").toLowerCase();
    return (
      (item.nome_marca || "").toLowerCase().includes(q) ||
      (item.holding || "").toLowerCase().includes(q) ||
      (item.agencia_nome || "").toLowerCase().includes(q) ||
      marcasStr.includes(q)
    );
  };

  // Atualizar item no backend e no estado local
  const handleUpdateItem = async (itemId, updatedFields) => {
    try {
      const res = await updatePipelineEstrategico(itemId, updatedFields);
      setItems((prev) => prev.map((it) => (it.id === itemId ? { ...it, ...updatedFields } : it)));
      if (activeClientModal && activeClientModal.id === itemId) {
        setActiveClientModal((prev) => ({ ...prev, ...updatedFields }));
      }
      return res;
    } catch (err) {
      console.error("Erro ao atualizar item do plano de ação:", err);
      alert("Erro ao salvar alterações no Plano de Ação.");
    }
  };

  // Excluir item do Plano de Ação
  const handleDeleteItem = async (itemId) => {
    try {
      await deletePipelineEstrategico(itemId);
      setItems((prev) => prev.filter((it) => it.id !== itemId));
      if (activeClientModal && activeClientModal.id === itemId) {
        setActiveClientModal(null);
      }
    } catch (err) {
      console.error("Erro ao excluir item do plano de ação:", err);
      alert("Erro ao excluir do Plano de Ação.");
    }
  };

  // Iniciar edição de um cliente existente no Plano de Ação
  const handleStartEditClient = (item) => {
    let ags = [];
    if (item.agencia_id || item.agencia_nome) {
      const ids = (item.agencia_id || "").split(",").map((s) => s.trim()).filter(Boolean);
      const names = (item.agencia_nome || "").split(",").map((s) => s.trim()).filter(Boolean);
      if (ids.length > 0) {
        ags = ids.map((id, idx) => ({
          id,
          name: names[idx] || id,
        }));
      } else if (names.length > 0) {
        ags = names.map((name) => {
          const match = (advertisers || []).find(
            (a) => (a.nomeFantasia || a.razaoSocial || a.name || "").toLowerCase().trim() === name.toLowerCase().trim()
          );
          return {
            id: match?.id || name,
            name: match?.nomeFantasia || match?.razaoSocial || match?.name || name,
          };
        });
      }
    }

    setEditingClientId(item.id);
    setAddForm({
      tipo: item.tipo || "mercado",
      client_id: item.client_id || item.holding_id || "",
      nome_marca: item.nome_marca || "",
      marcas_str: Array.isArray(item.sub_marcas) ? item.sub_marcas.join(", ") : "",
      agencias: ags,
      investimento_estimado: item.investimento_estimado ? formatCurrencyInput(String(item.investimento_estimado)) : "",
      racional: item.racional || "",
    });
    setShowAddModal(true);
  };

  // Cadastrar ou atualizar cliente no plano de ação
  const handleCreateBrand = async (e) => {
    e.preventDefault();
    if (!addForm.nome_marca.trim()) {
      alert("A Empresa é um campo obrigatório.");
      return;
    }

    const parsedMarcas = (addForm.marcas_str || "")
      .split(",")
      .map((m) => m.trim().replace(/^#/, ""))
      .filter(Boolean);

    const agenciaNomes = (addForm.agencias || []).map((a) => a.name).join(", ");
    const agenciaIds = (addForm.agencias || []).map((a) => a.id).join(",");

    try {
      const payload = {
        segmento: selectedSegment,
        tipo: addForm.tipo,
        client_id: addForm.client_id || null,
        nome_marca: addForm.nome_marca.trim(),
        holding: addForm.nome_marca.trim(),
        holding_id: addForm.client_id || null,
        sub_marcas: parsedMarcas,
        agencia_nome: agenciaNomes || null,
        agencia_id: agenciaIds || null,
        racional: addForm.racional.trim() || null,
        investimento_estimado: parseCurrencyToNumber(addForm.investimento_estimado),
      };

      if (editingClientId) {
        await updatePipelineEstrategico(editingClientId, payload);
        setItems((prev) => prev.map((it) => (it.id === editingClientId ? { ...it, ...payload } : it)));
        if (activeClientModal && activeClientModal.id === editingClientId) {
          setActiveClientModal((prev) => ({ ...prev, ...payload }));
        }
      } else {
        await savePipelineEstrategico({
          ...payload,
          ultima_reuniao: null,
          iniciativas: [],
        });
      }

      handleCloseAddModal();
      loadData();
    } catch (err) {
      console.error("Erro ao salvar no plano de ação:", err);
      const msg = err.response?.data?.error || err.message || "Erro ao salvar no Plano de Ação.";
      alert(`Erro ao salvar no Plano de Ação: ${msg}`);
    }
  };

  const handleOpenAddModal = () => {
    setEditingClientId(null);
    setAddForm({
      tipo: "mercado",
      client_id: "",
      nome_marca: "",
      marcas_str: "",
      agencias: [],
      investimento_estimado: "",
      racional: "",
    });
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setEditingClientId(null);
    setAddForm({
      tipo: "mercado",
      client_id: "",
      nome_marca: "",
      marcas_str: "",
      agencias: [],
      investimento_estimado: "",
      racional: "",
    });
  };

  // Share da RedeTV! no Investimento Publicitário total do segmento com 2 casas decimais
  const shareRedeTV = useMemo(() => {
    if (!segmentStats.totalInvestimentoEstimado || segmentStats.totalInvestimentoEstimado <= 0) return "0,00";
    const share = (segmentStats.totalInvestimentoRedeTV / segmentStats.totalInvestimentoEstimado) * 100;
    return share.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, [segmentStats.totalInvestimentoRedeTV, segmentStats.totalInvestimentoEstimado]);

  return (
    <div className="flex flex-col gap-5 max-w-7xl mx-auto">
      
      {/* 1. TOPO: TÍTULO, SELETOR DE SEGMENTO, BUSCA & BOTÃO CRIAR PLANO DE AÇÃO */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Plano de Ação
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              Piloto
            </span>
          </h1>
        </div>

        {/* Controles no Header: Seletor de Segmento | Caixa de Busca | Botão Criar Plano de Ação */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
          {/* Seletor de Segmento */}
          <div className="relative w-full sm:w-60 md:w-64">
            <select
              value={selectedSegment}
              onChange={(e) => setSelectedSegment(e.target.value)}
              className="w-full h-10 appearance-none bg-slate-50 hover:bg-slate-100/70 border border-slate-300 rounded-xl px-3.5 pr-9 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all cursor-pointer shadow-2xs"
            >
              {SEGMENTOS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Caixa de Busca */}
          <div className="relative w-full sm:w-64 md:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar empresa, marcas, decisor, agência..."
              className="w-full h-10 bg-white border border-slate-300 rounded-xl pl-9 pr-3 text-xs font-medium text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all shadow-2xs"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Botão Criar Plano de Ação */}
          <button
            onClick={handleOpenAddModal}
            className="h-10 px-4 text-xs font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors shadow-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Plano de Ação</span>
          </button>
        </div>
      </div>

      {/* 2. CARDS DE MÉTRICAS (4 BOXES INICIAIS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* Box 1: Nível de Relacionamento */}
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nível de Relacionamento</span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className={`text-xl font-bold font-mono ${getMaturityColor(segmentStats.avgMaturity).text}`}>
              {segmentStats.avgMaturity}%
            </span>
            <span className={`text-[11px] font-semibold px-1.5 py-0.2 rounded border ${getMaturityColor(segmentStats.avgMaturity).badge}`}>
              Top Clientes
            </span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1.5">
            <div
              className={`h-full rounded-full transition-all duration-300 ${getMaturityColor(segmentStats.avgMaturity).bar}`}
              style={{ width: `${segmentStats.avgMaturity}%` }}
            />
          </div>
        </div>

        {/* Box 2: Clientes Ativos (X / Y e barra com %) */}
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Clientes Ativos</span>
          <div className="mt-1 flex items-baseline justify-between gap-1.5">
            <span className="text-xl font-bold font-mono text-emerald-700">
              {segmentStats.clientesAtivosCount} / {segmentStats.totalClientesCadastrados}
            </span>
            <span className="text-xs font-bold font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {segmentStats.totalClientesCadastrados > 0
                ? `${Math.round((segmentStats.clientesAtivosCount / segmentStats.totalClientesCadastrados) * 100)}%`
                : "0%"}
            </span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-300"
              style={{
                width: `${
                  segmentStats.totalClientesCadastrados > 0
                    ? Math.min(100, (segmentStats.clientesAtivosCount / segmentStats.totalClientesCadastrados) * 100)
                    : 0
                }%`,
              }}
            />
          </div>
        </div>

        {/* Box 3: Investimento RedeTV! */}
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Investimento RedeTV!</span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-emerald-700 truncate" title={formatBRL(segmentStats.totalInvestimentoRedeTV)}>
              {formatBRL(segmentStats.totalInvestimentoRedeTV)}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 truncate" title={`Investimento Publicitário: ${formatBRL(segmentStats.totalInvestimentoEstimado)} (${shareRedeTV}%)`}>
            Investimento Publicitário: <strong className="text-slate-800">{formatBRL(segmentStats.totalInvestimentoEstimado)}</strong> <span className="text-emerald-700 font-bold">({shareRedeTV}%)</span>
          </span>
        </div>

        {/* Box 4: Decisores / Contatos no CRM */}
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Decisores / Contatos</span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-slate-900">
              {segmentStats.decisoresCount}
            </span>
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded">
              Decisores
            </span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 font-medium">
            <strong>{segmentStats.totalContatosCount}</strong> Contatos Cadastrados no CRM
          </span>
        </div>

      </div>

      {/* 3. GRID DE CARDS RESUMIDOS (2 COLUNAS: TOP MERCADO & TOP ESTRATÉGICOS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        
        {/* COLUNA A: TOP MERCADO */}
        <div className="space-y-2.5">
          <div className="bg-slate-900 text-white rounded-xl px-4 py-2.5 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-100">Top Mercado</h2>
            </div>
            <span className="text-[10px] font-mono font-bold bg-slate-800 px-2 py-0.5 rounded text-sky-300 border border-slate-700">
              {mercadoItems.length} Clientes
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {mercadoItems.filter(filterMatches).map((item) => {
              const client = (advertisers || []).find((a) => a.id === item.client_id);
              const mat = computeMaturity(item);
              const signal = getCardSignal(item);
              const invRealizado = getInvestimentoRealizado(item);
              const clientOpps = item.client_id ? openOppsByClient.get(item.client_id) || [] : [];
              const pipelineVal = clientOpps.reduce((sum, o) => sum + (o.value || 0), 0);

              return (
                <CompactClientCard
                  key={item.id}
                  item={item}
                  client={client}
                  mat={mat}
                  signal={signal}
                  faturamentoRealizado={invRealizado}
                  pipelineTotal={pipelineVal}
                  onClick={() => setActiveClientModal(item)}
                />
              );
            })}

            {mercadoItems.length === 0 && (
              <div className="p-5 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-400">
                Nenhum cliente cadastrado no grupo Top Mercado para este segmento.
              </div>
            )}
          </div>
        </div>

        {/* COLUNA B: TOP ESTRATÉGICOS */}
        <div className="space-y-2.5">
          <div className="bg-indigo-950 text-white rounded-xl px-4 py-2.5 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-100">Top Estratégicos</h2>
            </div>
            <span className="text-[10px] font-mono font-bold bg-indigo-900 px-2 py-0.5 rounded text-indigo-200 border border-indigo-700/50">
              {estrategicoItems.length} Clientes
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {estrategicoItems.filter(filterMatches).map((item) => {
              const client = (advertisers || []).find((a) => a.id === item.client_id);
              const mat = computeMaturity(item);
              const signal = getCardSignal(item);
              const invRealizado = getInvestimentoRealizado(item);
              const clientOpps = item.client_id ? openOppsByClient.get(item.client_id) || [] : [];
              const pipelineVal = clientOpps.reduce((sum, o) => sum + (o.value || 0), 0);

              return (
                <CompactClientCard
                  key={item.id}
                  item={item}
                  client={client}
                  mat={mat}
                  signal={signal}
                  faturamentoRealizado={invRealizado}
                  pipelineTotal={pipelineVal}
                  onClick={() => setActiveClientModal(item)}
                />
              );
            })}

            {estrategicoItems.length === 0 && (
              <div className="p-5 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-400">
                Nenhum cliente cadastrado no grupo Top Estratégico para este segmento.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 4. MODAL POP-UP DO CLIENTE EXPANDIDO (AO CLICAR NO CARD RESUMIDO) */}
      {activeClientModal && (() => {
        const client = (advertisers || []).find((a) => a.id === activeClientModal.client_id);
        const mat = computeMaturity(activeClientModal);
        const signal = getCardSignal(activeClientModal);
        const invRealizado = getInvestimentoRealizado(activeClientModal);
        const clientOpps = activeClientModal.client_id ? openOppsByClient.get(activeClientModal.client_id) || [] : [];
        const pipelineVal = clientOpps.reduce((sum, o) => sum + (o.value || 0), 0);
        const opps2026_2027 = activeClientModal.client_id ? opps2026_2027ByClient.get(activeClientModal.client_id) || [] : [];

        const isVerde = signal.type === "investimento_realizado";
        const isAmarelo = signal.type === "pipeline_ativo";
        const headerClasses = isVerde
          ? "bg-emerald-600 text-white border-b border-emerald-700"
          : isAmarelo
          ? "bg-amber-400 text-slate-900 border-b border-amber-500"
          : "bg-rose-600 text-white border-b border-rose-700";

        const headerBtnClasses = isAmarelo
          ? "text-slate-800 hover:text-black hover:bg-amber-500/50"
          : "text-white/80 hover:text-white hover:bg-black/20";

        const headerDividerClasses = isAmarelo
          ? "text-slate-700/60"
          : "text-white/60";

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              
              {/* Header do Pop-up do Cliente com cor dinâmica conforme o sinalizador */}
              <div className={`${headerClasses} px-5 py-4 flex items-center justify-between gap-3 transition-colors`}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-extrabold text-xs uppercase tracking-wider shrink-0">
                    {activeClientModal.tipo === "mercado" ? "TOP MERCADO" : "TOP ESTRATÉGICO"}
                  </span>
                  <span className={`text-base font-light select-none ${headerDividerClasses}`}>|</span>
                  <h3 className="text-base sm:text-lg font-bold truncate">
                    {activeClientModal.nome_marca}
                  </h3>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleStartEditClient(activeClientModal)}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${headerBtnClasses}`}
                    title="Editar Plano de Ação"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Tem certeza que deseja remover "${activeClientModal.nome_marca}" do Plano de Ação?`)) {
                        handleDeleteItem(activeClientModal.id);
                      }
                    }}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${headerBtnClasses}`}
                    title="Excluir do Plano de Ação"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveClientModal(null)}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${headerBtnClasses}`}
                    title="Fechar modal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Corpo com Scroll do Detalhe Completo */}
              <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
                <ClientActionPlanDetailContent
                  item={activeClientModal}
                  client={client}
                  mat={mat}
                  signal={signal}
                  faturamentoRealizado={invRealizado}
                  pipelineTotal={pipelineVal}
                  opps2026_2027={opps2026_2027}
                  executivos={userList}
                  users={userList}
                  currentUser={currentUser}
                  onUpdateItem={handleUpdateItem}
                  onDeleteItem={handleDeleteItem}
                  onOpenContactPopup={(contact) => setSelectedContactPopup(contact)}
                  addInteraction={addInteraction}
                />
              </div>

              {/* Rodapé do Modal */}
              <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveClientModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Fechar
                </button>
                <div className="text-[11px] text-slate-400">
                  Todas as alterações são salvas automaticamente
                </div>
              </div>

            </div>
          </div>
        );
      })()}

      {/* 5. MODAL POP-UP DE CONTATO DECISOR (ABRE SOBRE A PÁGINA) */}
      {selectedContactPopup && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-violet-900/80 text-violet-200 border border-violet-700/60">
                  {selectedContactPopup.nivelDecisao || selectedContactPopup.decisionLevel || "Decisor"}
                </span>
                <h3 className="text-base font-bold text-white mt-1.5">
                  {selectedContactPopup.name}
                </h3>
                <p className="text-xs text-slate-300">
                  {selectedContactPopup.cargo || selectedContactPopup.departamento || "Sem cargo definido"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedContactPopup(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-700">
              <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Canais de Contato
                </span>
                {selectedContactPopup.celular && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Celular / WhatsApp:</span>
                    <a
                      href={`tel:${selectedContactPopup.celular}`}
                      className="font-mono font-bold text-slate-900 hover:text-sky-600"
                    >
                      {selectedContactPopup.celular}
                    </a>
                  </div>
                )}
                {selectedContactPopup.telefone && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Telefone Fixo:</span>
                    <a
                      href={`tel:${selectedContactPopup.telefone}`}
                      className="font-mono font-bold text-slate-900 hover:text-sky-600"
                    >
                      {selectedContactPopup.telefone}
                    </a>
                  </div>
                )}
                {selectedContactPopup.email && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">E-mail:</span>
                    <a
                      href={`mailto:${selectedContactPopup.email}`}
                      className="font-medium text-sky-600 hover:underline truncate max-w-[200px]"
                      title={selectedContactPopup.email}
                    >
                      {selectedContactPopup.email}
                    </a>
                  </div>
                )}
                {!selectedContactPopup.celular && !selectedContactPopup.telefone && !selectedContactPopup.email && (
                  <span className="text-slate-400 italic">Nenhum telefone ou email cadastrado.</span>
                )}
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Hobbies & Gostos Pessoais
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedContactPopup.hobbies || []).map((h) => (
                    <span key={h} className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold text-[11px]">
                      {h}
                    </span>
                  ))}
                  {(!selectedContactPopup.hobbies || selectedContactPopup.hobbies.length === 0) && (
                    <span className="text-slate-400 italic text-[11px]">Nenhum hobby cadastrado</span>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Esportes
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedContactPopup.sports || []).map((s) => (
                    <span key={s} className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[11px]">
                      {s}
                    </span>
                  ))}
                  {(!selectedContactPopup.sports || selectedContactPopup.sports.length === 0) && (
                    <span className="text-slate-400 italic text-[11px]">Nenhum esporte cadastrado</span>
                  )}
                </div>
              </div>

              {selectedContactPopup.observacoes && (
                <div className="space-y-1 bg-amber-50/60 border border-amber-200 p-2.5 rounded-xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                    Observações
                  </span>
                  <p className="text-amber-900 leading-relaxed text-[11px]">
                    {selectedContactPopup.observacoes}
                  </p>
                </div>
              )}
            </div>

            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedContactPopup(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-lg cursor-pointer"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => handleGoToContact(selectedContactPopup.id)}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>Ver Ficha na Aba Contatos</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL PARA CRIAR PLANO DE AÇÃO */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingClientId ? "Editar Plano de Ação" : "Criar Plano de Ação"}
              </h3>
              <button
                type="button"
                onClick={handleCloseAddModal}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBrand} className="p-5 space-y-3.5 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Segmento</label>
                  <input
                    type="text"
                    disabled
                    value={selectedSegment}
                    className="w-full h-10 bg-slate-100/90 border border-slate-200 rounded-lg px-3.5 text-xs font-medium text-slate-700 cursor-not-allowed select-none focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Grupo</label>
                  <div className="relative">
                    <select
                      value={addForm.tipo}
                      onChange={(e) => setAddForm({ ...addForm, tipo: e.target.value })}
                      className="w-full h-10 appearance-none bg-white border border-slate-300 rounded-lg px-3.5 pr-9 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all cursor-pointer"
                    >
                      <option value="mercado">Top Mercado</option>
                      <option value="estrategico">Top Estratégico</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Empresa * (seleção do CRM) */}
              <SearchableClientSelect
                label="Empresa"
                required={true}
                placeholder="Buscar e selecionar a Empresa cadastrada no CRM..."
                items={advertiserClients}
                selectedId={addForm.client_id}
                selectedName={addForm.nome_marca}
                onSelect={(id, name) => setAddForm((prev) => ({ ...prev, client_id: id, nome_marca: name }))}
                onCreateNew={openCreateClient ? (queryText) => openCreateClient(queryText, selectedSegment) : null}
              />

              {/* Marcas (separadas por vírgula) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Marcas <span className="text-slate-400 font-normal">(separadas por vírgula)</span>
                </label>
                <input
                  type="text"
                  value={addForm.marcas_str || ""}
                  onChange={(e) => setAddForm({ ...addForm, marcas_str: e.target.value })}
                  placeholder="Ex: Carmed, Lavitan, Dermafeme"
                  className="w-full h-10 bg-white border border-slate-300 rounded-lg px-3.5 text-xs font-medium text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
                />
                {addForm.marcas_str && addForm.marcas_str.trim() && (
                  <div className="flex items-center gap-1.5 flex-wrap mt-2">
                    {addForm.marcas_str
                      .split(",")
                      .map((m) => m.trim().replace(/^#/, ""))
                      .filter(Boolean)
                      .map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-semibold"
                        >
                          #{tag}
                        </span>
                      ))}
                  </div>
                )}
              </div>

              {/* Agências de Publicidade */}
              <SearchableMultiAgencySelect
                label="Agências de Publicidade"
                items={agencyClients}
                selectedAgencies={addForm.agencias}
                onChange={(agencias) => setAddForm((prev) => ({ ...prev, agencias }))}
                onCreateNew={openCreateClient ? (queryText) => openCreateClient(queryText, selectedSegment, "Agência") : null}
              />

              {/* Estimativa Investimento Publicitário (R$) com máscara */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Estimativa Investimento Publicitário (R$)
                </label>
                <input
                  type="text"
                  value={addForm.investimento_estimado || ""}
                  onChange={(e) =>
                    setAddForm({
                      ...addForm,
                      investimento_estimado: formatCurrencyInput(e.target.value),
                    })
                  }
                  placeholder="R$ 000.000.000"
                  className="w-full h-10 bg-white border border-slate-300 rounded-lg px-3.5 text-xs font-medium text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all font-mono"
                />
              </div>

              {/* Racional Estratégico */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Racional Estratégico</label>
                <textarea
                  rows={3}
                  value={addForm.racional}
                  onChange={(e) => setAddForm({ ...addForm, racional: e.target.value })}
                  placeholder="Por que essa marca é prioritária na RedeTV!?"
                  className="w-full bg-white border border-slate-300 rounded-lg p-3 text-xs font-medium text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all resize-y min-h-[76px]"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleCloseAddModal}
                  className="h-10 px-4 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="h-10 px-5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs flex items-center justify-center cursor-pointer"
                >
                  {editingClientId ? "Salvar Alterações" : "Criar Plano de Ação"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
