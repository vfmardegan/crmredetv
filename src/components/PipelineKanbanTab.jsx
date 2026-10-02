import React, { useRef, useState, useEffect } from "react";
import { Maximize2, Pencil, X } from "lucide-react";
import {
  STAGES,
  STAGE_STYLES,
  ALL_PRODUCTS,
  SEGMENTOS,
  DIRECT_CLIENT_ID,
  formatBRL,
  formatPeriod,
  formatDate
} from "../utils/helpers";
import { MultiSelectFilterButton, PeriodFilterButton } from "./UI/Filters";

export default function PipelineKanbanTab({
  productFilterOptions,
  segmentFilter,
  setSegmentFilter,
  productFilter,
  setProductFilter,
  agencyFilter,
  setAgencyFilter,
  executivoFilter = [],
  setExecutivoFilter,
  executivoFilterOptions = [],
  monthFilter,
  setMonthFilter,
  pipelineActiveFilters,
  pipelineOpportunities,
  opportunities,
  agencyFilterOptions,
  advertisers,
  highlightedOppId,
  setSelectedOppId,
  updateStage,
  pipelineSearch,
  setPipelineSearch,
  openEditOpportunity
}) {
  const kanbanRef = useRef(null);
  const trackRef = useRef(null);
  const dragStartRef = useRef({ startX: 0, startScrollLeft: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [scrollMetrics, setScrollMetrics] = useState({
    scrollWidth: 0,
    clientWidth: 0,
    scrollLeft: 0,
  });

  const updateMetrics = () => {
    if (kanbanRef.current) {
      setScrollMetrics({
        scrollWidth: kanbanRef.current.scrollWidth,
        clientWidth: kanbanRef.current.clientWidth,
        scrollLeft: kanbanRef.current.scrollLeft,
      });
    }
  };

  useEffect(() => {
    updateMetrics();
    window.addEventListener("resize", updateMetrics);
    const observer = new ResizeObserver(updateMetrics);
    if (kanbanRef.current) {
      observer.observe(kanbanRef.current);
    }
    return () => {
      window.removeEventListener("resize", updateMetrics);
      observer.disconnect();
    };
  }, [pipelineOpportunities]);

  const handleKanbanScroll = () => {
    if (kanbanRef.current) {
      setScrollMetrics((prev) => ({
        ...prev,
        scrollLeft: kanbanRef.current.scrollLeft,
      }));
    }
  };

  const { scrollWidth, clientWidth, scrollLeft } = scrollMetrics;
  const maxScroll = Math.max(0, scrollWidth - clientWidth);
  const visibleRatio = scrollWidth > 0 ? clientWidth / scrollWidth : 1;
  const thumbWidthPct = Math.max(Math.min(visibleRatio * 100, 100), 8);
  const maxThumbLeftPct = 100 - thumbWidthPct;
  const thumbLeftPct = maxScroll > 0 ? Math.min(Math.max((scrollLeft / maxScroll) * maxThumbLeftPct, 0), maxThumbLeftPct) : 0;

  const handleThumbMouseDown = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!kanbanRef.current || !trackRef.current) return;

    setIsDragging(true);
    document.body.style.userSelect = "none";
    dragStartRef.current = {
      startX: e.clientX,
      startScrollLeft: kanbanRef.current.scrollLeft,
    };

    const handleMouseMove = (moveEvent) => {
      if (!kanbanRef.current || !trackRef.current) return;
      const deltaX = moveEvent.clientX - dragStartRef.current.startX;
      const trackWidth = trackRef.current.clientWidth;
      const thumbPixelWidth = (thumbWidthPct / 100) * trackWidth;
      const availableTrackPixels = trackWidth - thumbPixelWidth;

      if (availableTrackPixels > 0 && maxScroll > 0) {
        const ratio = maxScroll / availableTrackPixels;
        const newScrollLeft = Math.max(0, Math.min(dragStartRef.current.startScrollLeft + deltaX * ratio, maxScroll));
        kanbanRef.current.scrollLeft = newScrollLeft;
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleThumbTouchStart = (e) => {
    e.stopPropagation();
    if (!kanbanRef.current || !trackRef.current || !e.touches[0]) return;

    setIsDragging(true);
    dragStartRef.current = {
      startX: e.touches[0].clientX,
      startScrollLeft: kanbanRef.current.scrollLeft,
    };

    const handleTouchMove = (moveEvent) => {
      if (!kanbanRef.current || !trackRef.current || !moveEvent.touches[0]) return;
      const deltaX = moveEvent.touches[0].clientX - dragStartRef.current.startX;
      const trackWidth = trackRef.current.clientWidth;
      const thumbPixelWidth = (thumbWidthPct / 100) * trackWidth;
      const availableTrackPixels = trackWidth - thumbPixelWidth;

      if (availableTrackPixels > 0 && maxScroll > 0) {
        const ratio = maxScroll / availableTrackPixels;
        const newScrollLeft = Math.max(0, Math.min(dragStartRef.current.startScrollLeft + deltaX * ratio, maxScroll));
        kanbanRef.current.scrollLeft = newScrollLeft;
      }
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };

    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleTouchEnd);
  };

  const handleTrackClick = (e) => {
    if (!kanbanRef.current || !trackRef.current || maxScroll <= 0) return;
    const trackRect = trackRef.current.getBoundingClientRect();
    const clickX = e.clientX - trackRect.left;
    const thumbPixelWidth = (thumbWidthPct / 100) * trackRect.width;
    const availableTrackPixels = trackRect.width - thumbPixelWidth;

    if (availableTrackPixels > 0) {
      const targetThumbLeft = clickX - thumbPixelWidth / 2;
      const targetPct = Math.max(0, Math.min(targetThumbLeft / availableTrackPixels, 1));
      kanbanRef.current.scrollTo({
        left: targetPct * maxScroll,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Campo de Busca de Texto */}
        <input
          type="text"
          value={pipelineSearch || ""}
          onChange={(e) => setPipelineSearch(e.target.value)}
          placeholder="Buscar no pipeline..."
          className="border border-slate-200 rounded-md px-3 py-1.5 text-xs bg-white w-full sm:w-52 outline-none focus:ring-2 focus:ring-slate-400 placeholder:text-slate-400 shrink-0"
        />
        <MultiSelectFilterButton
          label="Segmento"
          options={SEGMENTOS.map((s) => ({ value: s, label: s }))}
          selected={segmentFilter}
          onChange={setSegmentFilter}
        />
        <MultiSelectFilterButton
          label="Produtos"
          options={(productFilterOptions || ALL_PRODUCTS).map((p) => ({ value: p, label: p }))}
          selected={productFilter}
          onChange={setProductFilter}
        />
        <MultiSelectFilterButton
          label="Agência"
          options={agencyFilterOptions}
          selected={agencyFilter}
          onChange={setAgencyFilter}
        />
        <MultiSelectFilterButton
          label="Executivo"
          options={executivoFilterOptions}
          selected={executivoFilter}
          onChange={setExecutivoFilter}
        />
        <PeriodFilterButton selected={monthFilter} onChange={setMonthFilter} />
        {pipelineActiveFilters.map((f, i) => (
          <span key={f.type + f.label + i} className="text-xs bg-slate-100 text-slate-600 pl-2 pr-1 py-1 rounded-md flex items-center gap-1">
            {f.type}: {f.label}
            <button type="button" onClick={f.clear} className="hover:text-slate-900">
              <X size={11} />
            </button>
          </span>
        ))}
        {pipelineActiveFilters.length > 0 && (
          <span className="text-xs text-slate-400">{pipelineOpportunities.length} de {opportunities.length} oportunidades</span>
        )}
      </div>

      {/* Barra de rolagem e indicador de posição superior SEMPRE VISÍVEL */}
      {maxScroll > 0 && (
        <div className="w-full py-0.5">
          <div
            ref={trackRef}
            onClick={handleTrackClick}
            className="w-full h-3 bg-slate-200/90 hover:bg-slate-200 border border-slate-300 rounded-full relative cursor-pointer select-none transition-colors"
            title="Barra de rolagem do Pipeline - clique ou arraste para navegar"
          >
            <div
              onMouseDown={handleThumbMouseDown}
              onTouchStart={handleThumbTouchStart}
              style={{
                left: `${thumbLeftPct}%`,
                width: `${thumbWidthPct}%`,
              }}
              className={`absolute top-0 bottom-0 rounded-full cursor-grab active:cursor-grabbing shadow-sm transition-colors ${
                isDragging ? "bg-slate-700" : "bg-slate-500 hover:bg-slate-600"
              }`}
            />
          </div>
        </div>
      )}

      <div
        ref={kanbanRef}
        onScroll={handleKanbanScroll}
        className="flex gap-4 overflow-x-auto pb-4 always-visible-scrollbar"
      >
        {STAGES.map((stage) => {
          const stageOpps = pipelineOpportunities.filter((o) => o.stage === stage);
          const stageTotal = stageOpps.reduce((s, o) => s + o.value, 0);
          return (
            <div key={stage} className="w-72 shrink-0 bg-white rounded-lg border border-slate-200 flex flex-col">
              <div className="p-3 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <span className={"text-xs font-medium px-2 py-0.5 rounded border " + STAGE_STYLES[stage]}>
                    {stage}
                  </span>
                  <span className="text-xs text-slate-400">{stageOpps.length}</span>
                </div>
                <div className="text-sm font-mono text-slate-600 mt-1">{formatBRL(stageTotal)}</div>
              </div>
              <div className="p-2 flex flex-col gap-2 flex-1 min-h-20">
                {stageOpps.map((o) => {
                  const advertiser = advertisers.find((a) => a.id === o.advertiserId);
                  const agency = o.agencyId && o.agencyId !== DIRECT_CLIENT_ID ? advertisers.find((a) => a.id === o.agencyId) : null;
                  return (
                    <div
                      key={o.id}
                      id={`opp-card-${o.id}`}
                      className={
                        "bg-slate-50 border rounded-md p-3 text-sm transition-shadow " +
                        (highlightedOppId === o.id
                          ? "border-rose-400 ring-2 ring-rose-300"
                          : "border-slate-200")
                      }
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-medium text-slate-800">{o.title}</div>
                        <div className="flex items-center gap-1 shrink-0">
                          {openEditOpportunity && (
                            <button
                              type="button"
                              onClick={() => openEditOpportunity(o.id)}
                              className="text-slate-400 hover:text-slate-700 p-1.5 rounded transition-colors"
                              title="Editar Oportunidade"
                            >
                              <Pencil size={13} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setSelectedOppId(o.id)}
                            className="text-slate-400 hover:text-rose-600 p-1.5 rounded transition-colors"
                            title="Ver card completo"
                          >
                            <Maximize2 size={13} />
                          </button>
                        </div>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {agency ? `${agency.name} → ${advertiser ? advertiser.name : ""}` : advertiser ? advertiser.name : ""}
                      </div>
                      {advertiser && advertiser.segmento && (
                        <div className="text-xs text-slate-500 mt-0.5">{advertiser.segmento}</div>
                      )}
                      {o.executivo && (
                        <div className="text-xs text-slate-500 mt-0.5 font-medium">Executivo: {o.executivo}</div>
                      )}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(o.products || []).map((p) => (
                          <span key={p} className="text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">{p}</span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="text-sm font-mono font-semibold text-slate-700">{formatBRL(o.value)}</div>
                        {o.winProbability !== null && o.winProbability !== undefined && (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 uppercase tracking-wider ${
                              o.winProbability > 80 ? "bg-emerald-50 text-emerald-700 border-emerald-250 font-bold" :
                              o.winProbability >= 60 ? "bg-amber-50 text-amber-700 border-amber-250 font-bold" :
                              "bg-rose-50 text-rose-700 border-rose-250 font-bold"
                            }`}
                            title="Probabilidade de fechamento estimada por estatísticas históricas"
                          >
                            {o.winProbability}% win
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {formatPeriod(o.periodMonths)}
                      </div>
                      <div className="text-xs text-slate-400">Fechamento previsto: {formatDate(o.expectedCloseDate)}</div>
                      {o.briefing && (
                        <div className="text-xs text-slate-400 italic mt-1 line-clamp-2">"{o.briefing}"</div>
                      )}
                      <select
                        value={o.stage}
                        onChange={(e) => updateStage(o.id, e.target.value)}
                        className="mt-2 w-full text-xs border border-slate-200 rounded px-1 py-1 bg-white"
                      >
                        {STAGES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  );
                })}
                {stageOpps.length === 0 && (
                  <div className="text-xs text-slate-300 text-center py-6">Sem oportunidades</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
