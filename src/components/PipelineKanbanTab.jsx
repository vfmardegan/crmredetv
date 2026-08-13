import React from "react";
import { Maximize2, X } from "lucide-react";
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
  segmentFilter,
  setSegmentFilter,
  productFilter,
  setProductFilter,
  agencyFilter,
  setAgencyFilter,
  monthFilter,
  setMonthFilter,
  pipelineActiveFilters,
  pipelineOpportunities,
  opportunities,
  agencyFilterOptions,
  advertisers,
  highlightedOppId,
  setSelectedOppId,
  updateStage
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 flex-wrap">
        <MultiSelectFilterButton
          label="Segmento"
          options={SEGMENTOS.map((s) => ({ value: s, label: s }))}
          selected={segmentFilter}
          onChange={setSegmentFilter}
        />
        <MultiSelectFilterButton
          label="Produtos"
          options={ALL_PRODUCTS.map((p) => ({ value: p, label: p }))}
          selected={productFilter}
          onChange={setProductFilter}
        />
        <MultiSelectFilterButton
          label="Agência"
          options={agencyFilterOptions}
          selected={agencyFilter}
          onChange={setAgencyFilter}
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
      <div className="flex gap-4 overflow-x-auto pb-4">
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
                        <button
                          type="button"
                          onClick={() => setSelectedOppId(o.id)}
                          className="text-slate-400 hover:text-rose-600 shrink-0"
                          title="Ver card completo"
                        >
                          <Maximize2 size={13} />
                        </button>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {agency ? `${agency.name} → ${advertiser ? advertiser.name : ""}` : advertiser ? advertiser.name : ""}
                      </div>
                      {advertiser && advertiser.segmento && (
                        <div className="text-xs text-slate-500 mt-0.5">{advertiser.segmento}</div>
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
                              o.winProbability >= 75 ? "bg-emerald-50 text-emerald-700 border-emerald-250 font-bold" :
                              o.winProbability >= 45 ? "bg-amber-50 text-amber-700 border-amber-250 font-bold" :
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
