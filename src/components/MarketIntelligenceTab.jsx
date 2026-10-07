import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  ExternalLink,
  PlusCircle,
  RefreshCw,
  Sparkles,
  Building2,
  Briefcase,
  Zap,
  Globe,
  Tag,
  Star,
  CheckCircle2,
} from "lucide-react";
import { getMarketNews } from "../services/api";

export default function MarketIntelligenceTab({
  currentUser,
  segmentoExecutivo,
  onCreateOpportunityFromNews,
}) {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSegment, setSelectedSegment] = useState("all"); // 'all' | 'my' | <SegmentoName>
  const [triggerFilter, setTriggerFilter] = useState("all"); // 'all' | 'troca' | 'lideranca' | 'campanha'

  // Carrega notícias da API
  async function loadNews() {
    setLoading(true);
    try {
      const data = await getMarketNews();
      setNews(data.news || []);
    } catch (err) {
      console.error("Erro ao carregar notícias do radar:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNews();
  }, []);

  // Determina os segmentos pertencentes ao usuário logado
  const mySegments = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.perfil === "admin" || currentUser.perfil === "diretor") {
      return []; // Admins/Diretores veem tudo por padrão
    }
    const execIdStr = String(currentUser.executivo_id || currentUser.id || "");
    return Object.keys(segmentoExecutivo || {}).filter(
      (seg) => String(segmentoExecutivo[seg]) === execIdStr
    );
  }, [currentUser, segmentoExecutivo]);

  // Contagem de notícias por segmento
  const segmentCounts = useMemo(() => {
    const counts = {};
    for (const item of news) {
      const seg = item.segmento_crm || "Outros";
      counts[seg] = (counts[seg] || 0) + 1;
    }
    return counts;
  }, [news]);

  // Contagem para "Meus Segmentos"
  const myNewsCount = useMemo(() => {
    if (mySegments.length === 0) return 0;
    return news.filter((item) => mySegments.includes(item.segmento_crm)).length;
  }, [news, mySegments]);

  // Filtra as notícias com base nas seleções atuais
  const filteredNews = useMemo(() => {
    return news.filter((item) => {
      // 1. Filtro de segmento
      if (selectedSegment === "my") {
        if (!mySegments.includes(item.segmento_crm)) return false;
      } else if (selectedSegment !== "all") {
        if (item.segmento_crm !== selectedSegment) return false;
      }

      // 2. Filtro por tipo de gatilho
      if (triggerFilter !== "all") {
        const gatilhoLower = (item.gatilho_comercial || "").toLowerCase();
        if (triggerFilter === "troca" && !gatilhoLower.includes("agência") && !gatilhoLower.includes("concorrência")) {
          return false;
        }
        if (triggerFilter === "lideranca" && !gatilhoLower.includes("cmo") && !gatilhoLower.includes("liderança") && !gatilhoLower.includes("diretor")) {
          return false;
        }
        if (triggerFilter === "campanha" && !gatilhoLower.includes("campanha") && !gatilhoLower.includes("mídia") && !gatilhoLower.includes("lançamento")) {
          return false;
        }
      }

      // 3. Busca textual
      if (search.trim() !== "") {
        const s = search.toLowerCase();
        const inTitle = (item.titulo_original || "").toLowerCase().includes(s);
        const inResumo = (item.resumo_executivo || "").toLowerCase().includes(s);
        const inGatilho = (item.gatilho_comercial || "").toLowerCase().includes(s);
        const inAdv = (item.anunciante_mencionado || "").toLowerCase().includes(s);
        const inAge = (item.agencia_mencionada || "").toLowerCase().includes(s);
        const inTags = Array.isArray(item.tags) && item.tags.some((t) => t.toLowerCase().includes(s));
        if (!inTitle && !inResumo && !inGatilho && !inAdv && !inAge && !inTags) {
          return false;
        }
      }

      return true;
    });
  }, [news, selectedSegment, mySegments, triggerFilter, search]);

  // Cor temática suave para cada segmento
  function getSegmentBadgeColor(seg) {
    switch (seg) {
      case "Petroquímica":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Tech e E-Commerce":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Apostas Esportivas":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Construção, Imobiliário e Decoração":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "Higiene e Beleza":
        return "bg-pink-50 text-pink-700 border-pink-200";
      case "Financeiro e Seguros":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "Eletro-Eletrônicos":
        return "bg-cyan-50 text-cyan-700 border-cyan-200";
      case "Alimentos":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "Automotivo":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* 1. Header do Radar de Mercado */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Sparkles size={22} />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
              Radar de Mercado
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadNews}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? "animate-spin text-indigo-600" : "text-slate-500"} />
              <span>Atualizar</span>
            </button>
          </div>
        </div>

        {/* 2. Barra de Busca e Filtros Rápidos */}
        <div className="mt-5 pt-5 border-t border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Campo de Busca */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por marca, agência, executivo ou termo..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-50/50"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-600"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Filtro por Gatilho */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs font-semibold">
            <span className="text-slate-400 text-[11px] mr-1 uppercase tracking-wider hidden sm:inline">Gatilho:</span>
            {[
              { id: "all", label: "Todos" },
              { id: "troca", label: "Troca de Agência" },
              { id: "lideranca", label: "Novo CMO / Liderança" },
              { id: "campanha", label: "Campanha & Mídia" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTriggerFilter(t.id)}
                className={`px-2.5 py-1.5 rounded-md whitespace-nowrap transition-colors ${
                  triggerFilter === t.id
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Pílulas de Segmentos Comerciais */}
        <div className="mt-4 flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
          {/* Todos */}
          <button
            type="button"
            onClick={() => setSelectedSegment("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              selectedSegment === "all"
                ? "bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-200"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <span>Todos os Segmentos</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedSegment === "all" ? "bg-indigo-700 text-white" : "bg-slate-200 text-slate-700"}`}>
              {news.length}
            </span>
          </button>

          {/* Meus Segmentos (se houver segmentos vinculados) */}
          {mySegments.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedSegment("my")}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedSegment === "my"
                  ? "bg-amber-500 text-white shadow-sm ring-2 ring-amber-200"
                  : "bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
              }`}
            >
              <Star size={13} className={selectedSegment === "my" ? "text-white" : "text-amber-500"} />
              <span>Meus Segmentos</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedSegment === "my" ? "bg-amber-600 text-white" : "bg-amber-200 text-amber-900"}`}>
                {myNewsCount}
              </span>
            </button>
          )}

          {/* Segmentos que possuem notícias */}
          {Object.entries(segmentCounts).map(([segName, count]) => (
            <button
              key={segName}
              type="button"
              onClick={() => setSelectedSegment(segName)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedSegment === segName
                  ? "bg-slate-900 text-white shadow-sm ring-2 ring-slate-300"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <span>{segName}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedSegment === segName ? "bg-slate-700 text-white" : "bg-slate-200 text-slate-600"}`}>
                {count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Grade de Cards de Notícias */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 flex flex-col items-center justify-center gap-3">
          <RefreshCw size={28} className="animate-spin text-indigo-600" />
          <p className="text-sm font-semibold text-slate-600">Sincronizando radar de inteligência de mercado...</p>
        </div>
      ) : filteredNews.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Globe size={40} className="mx-auto text-slate-300 mb-3" />
          <h3 className="text-base font-bold text-slate-700">Nenhuma notícia encontrada</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            Não há movimentações registradas com os filtros selecionados. Tente limpar a busca ou selecionar outro segmento.
          </p>
          {(selectedSegment !== "all" || triggerFilter !== "all" || search) && (
            <button
              type="button"
              onClick={() => {
                setSelectedSegment("all");
                setTriggerFilter("all");
                setSearch("");
              }}
              className="mt-4 px-4 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
            >
              Redefinir Filtros
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredNews.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col justify-between gap-4"
            >
              {/* Top Row: Segmento, Fonte e Data */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-md border ${getSegmentBadgeColor(
                      item.segmento_crm
                    )}`}
                  >
                    {item.segmento_crm}
                  </span>

                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="font-semibold text-slate-500">{item.fonte}</span>
                    <span>•</span>
                    <span>
                      {item.data_publicacao
                        ? new Date(item.data_publicacao + "T12:00:00Z").toLocaleDateString("pt-BR")
                        : "Recente"}
                    </span>
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-indigo-600 transition-colors p-1"
                        title="Ver matéria original na fonte"
                      >
                        <ExternalLink size={13} />
                      </a>
                    )}
                  </div>
                </div>

                {/* Título Principal */}
                <h3 className="text-base font-bold text-slate-900 leading-snug tracking-tight mb-2">
                  {item.titulo_original}
                </h3>

                {/* Texto da Matéria / Resumo Executivo */}
                <p className="text-xs text-slate-600 leading-relaxed mb-3">
                  {item.resumo_executivo}
                </p>

                {/* Box Único: Gatilho Comercial & Ação Recomendada */}
                <div className="bg-amber-50/70 border border-amber-200/80 rounded-lg p-3 mb-3 flex flex-col gap-2.5">
                  {/* Gatilho Comercial */}
                  <div>
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-900 uppercase tracking-wider mb-1">
                      <Zap size={13} className="text-amber-600 shrink-0" />
                      <span>Gatilho Comercial</span>
                    </div>
                    <p className="text-xs text-amber-950 font-medium leading-relaxed pl-5">
                      {item.gatilho_comercial}
                    </p>
                  </div>

                  {/* Ação Recomendada (se houver) */}
                  {item.acao_sugerida && (
                    <div className="pt-2 border-t border-amber-200/60">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-1">
                        <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                        <span>Ação Recomendada</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed pl-5">
                        {item.acao_sugerida}
                      </p>
                    </div>
                  )}
                </div>

                {/* Metadados: Anunciante e Agência */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
                  {item.anunciante_mencionado && item.anunciante_mencionado !== "N/A" && (
                    <div className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-md text-slate-700 border border-slate-100">
                      <Building2 size={12} className="text-slate-400" />
                      <span className="font-bold">Anunciante:</span>
                      <span>{item.anunciante_mencionado}</span>
                    </div>
                  )}

                  {item.agencia_mencionada && item.agencia_mencionada !== "N/A" && (
                    <div className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-md text-slate-700 border border-slate-100">
                      <Briefcase size={12} className="text-slate-400" />
                      <span className="font-bold">Agência:</span>
                      <span>{item.agencia_mencionada}</span>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {Array.isArray(item.tags) && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {item.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded"
                      >
                        <Tag size={9} className="text-slate-400" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Botões de Ação */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (typeof onCreateOpportunityFromNews === "function") {
                      onCreateOpportunityFromNews(item);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                >
                  <PlusCircle size={14} />
                  <span>Criar Oportunidade no Pipeline</span>
                </button>

                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors py-2 px-1"
                  >
                    <span>Ver na Fonte</span>
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
