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
  Clock,
  ChevronDown,
  Trash2,
} from "lucide-react";
import { getMarketNews, deleteMarketNews } from "../services/api";


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
  const [timeFilter, setTimeFilter] = useState("all"); // 'all' | 'today'
  const [scheduleInfo, setScheduleInfo] = useState(null);

  // Retorna a data no formato YYYY-MM-DD no fuso de São Paulo
  function getTodayBr() {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
  }

  // Verifica se a notícia foi publicada na data de hoje
  function isNewsToday(item) {
    if (!item || !item.data_publicacao) return false;
    const pubStr = String(item.data_publicacao).substring(0, 10);
    return pubStr === getTodayBr();
  }

  // Carrega notícias da API
  async function loadNews() {
    setLoading(true);
    try {
      const data = await getMarketNews();
      setNews(data.news || []);
      if (data.schedule) {
        setScheduleInfo(data.schedule);
      }
    } catch (err) {
      console.error("Erro ao carregar notícias do radar:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNews();
  }, []);


  // Permissão total: Especialistas, Diretores e Administradores veem todo o mercado
  const isFullAccess = !currentUser || ["admin", "diretor", "especialista"].includes(currentUser.perfil);

  // Apenas Administradores têm permissão para excluir notícias do Radar
  const isAdmin = currentUser?.perfil === "admin";

  async function handleDeleteNews(item) {
    if (!isAdmin) return;
    const confirmDelete = window.confirm(
      `Deseja realmente excluir a notícia do Radar?\n\n"${item.titulo_original}"`
    );
    if (!confirmDelete) return;

    try {
      await deleteMarketNews(item.id);
      setNews((prev) => prev.filter((n) => n.id !== item.id));
    } catch (err) {
      alert("Erro ao excluir notícia: " + (err.message || err));
    }
  }

  // Determina os segmentos pertencentes à carteira do executivo
  const mySegments = useMemo(() => {
    if (!currentUser || isFullAccess) return [];
    const execIdStr = String(currentUser.executivo_id || currentUser.id || "");
    return Object.keys(segmentoExecutivo || {}).filter(
      (seg) => String(segmentoExecutivo[seg]) === execIdStr
    );
  }, [currentUser, isFullAccess, segmentoExecutivo]);

  // Função auxiliar para identificar notícias gerais de agências
  function isAgencyNews(item) {
    if (!item) return false;
    const seg = (item.segmento_crm || "").toLowerCase();
    if (seg.includes("agência") || seg.includes("agencias")) return true;
    if ((!item.anunciante_mencionado || item.anunciante_mencionado === "N/A") && item.agencia_mencionada && item.agencia_mencionada !== "N/A") {
      return true;
    }
    if (Array.isArray(item.tags) && item.tags.some(t => t.toLowerCase().includes("agência") || t.toLowerCase().includes("agencias"))) {
      return true;
    }
    return false;
  }

  // Base de notícias aplicável ao usuário
  // Especialistas e Administradores -> Todas as notícias
  // Executivos -> Apenas sua carteira de segmentos + notícias gerais de agências
  const scopedNews = useMemo(() => {
    if (isFullAccess) return news;
    return news.filter((item) => mySegments.includes(item.segmento_crm) || isAgencyNews(item));
  }, [news, isFullAccess, mySegments]);

  // Contagem de notícias por segmento dentro do escopo permitido
  const segmentCounts = useMemo(() => {
    const counts = {};
    for (const item of scopedNews) {
      const seg = item.segmento_crm || "Outros";
      counts[seg] = (counts[seg] || 0) + 1;
    }
    return counts;
  }, [scopedNews]);

  // Segmentos disponíveis para pílulas
  // Especialistas e Administradores -> Todos os segmentos mapeados
  // Executivos -> Apenas os seus segmentos + agências
  const availableSegments = useMemo(() => {
    if (isFullAccess) {
      return Object.keys(segmentCounts);
    }
    return Object.keys(segmentCounts).filter(
      (seg) => mySegments.includes(seg) || seg.toLowerCase().includes("agência") || seg.toLowerCase().includes("agencias")
    );
  }, [isFullAccess, segmentCounts, mySegments]);

  // Quantidade de notícias de hoje dentro do escopo do usuário
  const todayNewsCount = useMemo(() => {
    return scopedNews.filter(isNewsToday).length;
  }, [scopedNews]);

  // Filtra as notícias com base nas seleções atuais
  const filteredNews = useMemo(() => {
    return scopedNews.filter((item) => {
      // 0. Filtro de período (Hoje vs Todas)
      if (timeFilter === "today" && !isNewsToday(item)) {
        return false;
      }

      // 1. Filtro de segmento
      if (selectedSegment !== "all") {
        if (selectedSegment === "agencias") {
          if (!isAgencyNews(item)) return false;
        } else if (item.segmento_crm !== selectedSegment) {
          return false;
        }
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
  }, [scopedNews, selectedSegment, triggerFilter, timeFilter, search]);


  // Cor temática suave para cada segmento
  function getSegmentBadgeColor(seg) {
    switch (seg) {
      case "Petroquímica":
      case "Petroquímica, Energia e Lubrificantes":
        return "bg-amber-50 text-amber-800 border-amber-200";
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
      case "Bebidas":
        return "bg-amber-50 text-amber-700 border-amber-300";
      case "Automotivo":
        return "bg-red-50 text-red-700 border-red-200";
      case "Turismo":
      case "Turismo e Serviços":
        return "bg-teal-50 text-teal-700 border-teal-200";
      case "Saúde e Bem-Estar":
      case "Farma e Saúde":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Telecom":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "Educação":
        return "bg-violet-50 text-violet-700 border-violet-200";
      case "Entretenimento":
        return "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200";
      case "Vestuário e Moda":
        return "bg-pink-50 text-pink-800 border-pink-300";
      case "Agro e Meio-Ambiente":
        return "bg-lime-50 text-lime-800 border-lime-300";
      case "Atacarejo":
      case "Atacarejo & Supermercados":
        return "bg-yellow-50 text-yellow-800 border-yellow-300";
      case "Agências de Publicidade":
        return "bg-slate-100 text-slate-800 border-slate-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  }

  // Formata os horários para o padrão '08h00', '12h00', etc.
  const formatSlotHour = (slotStr) => {
    if (!slotStr) return "";
    return slotStr.replace(":", "h");
  };

  const lastSlotFormatted = formatSlotHour(scheduleInfo?.lastRun?.slot) || "08h00";
  const nextSlotFormatted = formatSlotHour(scheduleInfo?.nextRun?.slot) || "12h00";

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* 1. Header do Radar de Mercado */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Sparkles size={22} />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
                Radar de Mercado
              </h1>
            </div>
            {!isFullAccess && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200 w-fit">
                Minha Carteira & Agências
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Indicador de Atualizações */}
            <div className="inline-flex items-center gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 shadow-xs">
              <Clock size={13} className="text-indigo-600 shrink-0" />
              <span>
                Última Atualização: <strong className="text-slate-800 font-semibold">{lastSlotFormatted}</strong>
              </span>
              <span className="text-slate-300">|</span>
              <span>
                Próxima Atualização: <strong className="text-indigo-600 font-semibold">{nextSlotFormatted}</strong>
              </span>
            </div>

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

        {/* 2. Barra de Busca, Período e Menus Suspensos */}
        <div className="mt-5 pt-5 border-t border-slate-100 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
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

            {/* Filtro por Período: Todas vs Hoje (sem ícone do raio) */}
            <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200/60 self-start sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => setTimeFilter("all")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  timeFilter === "all"
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Todas ({scopedNews.length})
              </button>
              <button
                type="button"
                onClick={() => setTimeFilter("today")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  timeFilter === "today"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>Hoje</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    timeFilter === "today" ? "bg-indigo-700 text-white" : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {todayNewsCount}
                </span>
              </button>
            </div>
          </div>

          {/* Menus Suspensos: Gatilho e Segmentos */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
            {/* Menu Suspenso de Gatilho */}
            <div className="relative min-w-[175px] flex-1 sm:flex-initial">
              <select
                aria-label="Filtro por Gatilho Comercial"
                value={triggerFilter}
                onChange={(e) => setTriggerFilter(e.target.value)}
                className="w-full appearance-none bg-white border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-xs font-semibold text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer shadow-xs"
              >
                <option value="all">Gatilho: Todos</option>
                <option value="troca">Troca de Agência</option>
                <option value="lideranca">Novo CMO / Liderança</option>
                <option value="campanha">Campanha & Mídia</option>
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>

            {/* Menu Suspenso de Segmentos */}
            <div className="relative min-w-[215px] flex-1 sm:flex-initial">
              <select
                aria-label="Filtro por Segmento"
                value={selectedSegment}
                onChange={(e) => setSelectedSegment(e.target.value)}
                className="w-full appearance-none bg-white border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-xs font-semibold text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer shadow-xs"
              >
                <option value="all">
                  Segmento: Todos ({scopedNews.length})
                </option>
                {availableSegments.map((segName) => (
                  <option key={segName} value={segName}>
                    {segName} ({segmentCounts[segName] || 0})
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
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
          {timeFilter === "today" ? (
            <>
              <Clock size={40} className="mx-auto text-indigo-400 mb-3" />
              <h3 className="text-base font-bold text-slate-700">
                Nenhuma notícia publicada hoje até o momento
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Não há notícias capturadas na data de hoje para os filtros selecionados. As varreduras automáticas de mercado ocorrem às 08h00, 12h00, 16h00 e 20h00.
              </p>
              <button
                type="button"
                onClick={() => {
                  setTimeFilter("all");
                  setSelectedSegment("all");
                  setTriggerFilter("all");
                  setSearch("");
                }}
                className="mt-4 px-4 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
              >
                Ver Todas as Notícias ({scopedNews.length})
              </button>
            </>
          ) : (
            <>
              <Globe size={40} className="mx-auto text-slate-300 mb-3" />
              <h3 className="text-base font-bold text-slate-700">
                {isFullAccess ? "Nenhuma notícia encontrada" : "Nenhuma oportunidade mapeada para a sua carteira"}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                {isFullAccess
                  ? "Não há movimentações registradas com os filtros selecionados. Tente limpar a busca ou selecionar outro segmento."
                  : "Não encontramos movimentações recentes para os segmentos comerciais da sua carteira ou notícias de agências no momento."}
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
            </>
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
                    {isNewsToday(item) && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200 shadow-xs animate-pulse">
                        <Zap size={10} className="fill-amber-600 text-amber-600" />
                        HOJE
                      </span>
                    )}
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

                <div className="flex items-center gap-2">
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors py-2 px-2 rounded-lg hover:bg-indigo-50"
                    >
                      <span>Ver na Fonte</span>
                      <ExternalLink size={12} />
                    </a>
                  )}

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => handleDeleteNews(item)}
                      title="Excluir notícia do Radar de Mercado (Apenas Administrador)"
                      className="inline-flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-lg p-2 transition-colors cursor-pointer"
                      aria-label="Excluir notícia"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
