import React from "react";
import {
  BarChart,
  ComposedChart,
  Bar,
  Cell,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  LabelList,
} from "recharts";
import { X } from "lucide-react";
import {
  SEGMENTOS,
  ALL_PRODUCTS,
  YEARS,
  MONTHS,
  formatBRL,
  toggleArrayValue,
  STAGES
} from "../utils/helpers";
import { MultiSelectFilterButton } from "./UI/Filters";
import { MetaGauge } from "./UI/MetaGauge";
import { ResultadoTooltip, ResultadoMensalTooltip, StageStackTooltip } from "./UI/Tooltips";
import { KpiCard } from "./UI/KpiCard";
import ClientBilledTable from "./ClientBilledTable";

const STAGE_CHART_COLORS = {
  "Desenvolvimento": "#94a3b8",
  "Desenv…":          "#94a3b8",
  "Frio":             "#3b82f6",
  "Morno":            "#eab308",
  "Quente":           "#f97316",
  "Fechado":          "#22c55e",
  "Negado":           "#64748b",
  "Cancelado":        "#64748b",
};

function RotatedTick90({ x, y, payload }) {
  if (!payload || payload.value === undefined) return null;
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={6}
        y={0}
        textAnchor="start"
        dominantBaseline="central"
        fill="#64748b"
        fontSize={11}
        transform="rotate(90)"
      >
        {payload.value}
      </text>
    </g>
  );
}

export default function DashboardTab({
  dashboardSegmentFilter,
  setDashboardSegmentFilter,
  dashboardProductFilter,
  setDashboardProductFilter,
  dashboardAgencyFilter,
  setDashboardAgencyFilter,
  dashboardAdvertiserFilter,
  setDashboardAdvertiserFilter,
  dashboardExecutivoFilter,
  setDashboardExecutivoFilter,
  dashboardYear,
  setDashboardYear,
  dashboardMonths,
  setDashboardMonths,
  executivos,
  agencyFilterOptions,
  advertiserFilterOptions,
  metaVisible,
  resumoAnoData,
  visaoGeralAtingimentoPercent,
  metaAtingida,
  faturadoMenosMeta,
  visaoGeralFaturamentoEfetivoTotal,
  visaoGeralFaturamentoPotencialTotal,
  visaoGeralFaturamentoData,
  pipelineTotal,
  pipelineTotalGeralValor,
  pipelineTotalGeralCount,
  pipelinePeriodoValor,
  pipelinePeriodoCount,
  periodLabel,
  dashboardOpps,
  emDesenvolvimentoValor,
  emAbertoValor,
  emAbertoCount,
  estimativaFaturamento,
  fechadosValor,
  negadosValor,
  taxaConversao,
  stageData,
  monthlyOpenData,
  countByStage,
  tvProductRows,
  tvProductTotals,
  digitalProductRows,
  digitalProductTotals,
  specialProductRows,
  specialProductTotals,
  userPerfil,
  advertisers = [],
  faturamentoEfetivo = [],
  segmentoExecutivo = {},
  executivoKeyAccounts = {},
}) {
  const periodSubtitle =
    dashboardMonths.length === 0
      ? dashboardYear
      : dashboardMonths.length === 1
      ? `${dashboardMonths[0]}/${dashboardYear}`
      : `${dashboardYear} · ${dashboardMonths.length} meses`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        {/* Filtros Gerais */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-slate-400">Geral</span>
          <div className="flex items-center gap-2 flex-wrap">
            <MultiSelectFilterButton
              label="Segmento"
              options={SEGMENTOS.map((s) => ({ value: s, label: s }))}
              selected={dashboardSegmentFilter}
              onChange={setDashboardSegmentFilter}
            />
            <MultiSelectFilterButton
              label="Produtos"
              options={ALL_PRODUCTS.map((p) => ({ value: p, label: p }))}
              selected={dashboardProductFilter}
              onChange={setDashboardProductFilter}
            />
            <MultiSelectFilterButton
              label="Agência"
              options={agencyFilterOptions}
              selected={dashboardAgencyFilter}
              onChange={setDashboardAgencyFilter}
            />
            <MultiSelectFilterButton
              label="Anunciante"
              options={advertiserFilterOptions}
              selected={dashboardAdvertiserFilter}
              onChange={setDashboardAdvertiserFilter}
            />
            {(userPerfil === "admin" || userPerfil === "diretor") && (
              <MultiSelectFilterButton
                label="Executivo"
                options={executivos.map((ex) => ({ value: ex.id, label: ex.nome }))}
                selected={dashboardExecutivoFilter}
                onChange={setDashboardExecutivoFilter}
              />
            )}
            {[
              ...dashboardSegmentFilter.map((v) => ({ label: "Segmento: " + v, clear: () => setDashboardSegmentFilter(dashboardSegmentFilter.filter((x) => x !== v)) })),
              ...dashboardProductFilter.map((v) => ({ label: "Produto: " + v, clear: () => setDashboardProductFilter(dashboardProductFilter.filter((x) => x !== v)) })),
              ...dashboardAgencyFilter.map((v) => {
                const opt = agencyFilterOptions.find((o) => o.value === v);
                return { label: "Agência: " + (opt ? opt.label : v), clear: () => setDashboardAgencyFilter(dashboardAgencyFilter.filter((x) => x !== v)) };
              }),
              ...dashboardAdvertiserFilter.map((v) => {
                const opt = advertiserFilterOptions.find((o) => o.value === v);
                return { label: "Anunciante: " + (opt ? opt.label : v), clear: () => setDashboardAdvertiserFilter(dashboardAdvertiserFilter.filter((x) => x !== v)) };
              }),
              ...((userPerfil === "admin" || userPerfil === "diretor")
                ? dashboardExecutivoFilter.map((v) => {
                    const ex = executivos.find((e) => e.id === v);
                    return { label: "Executivo: " + (ex ? ex.nome : v), clear: () => setDashboardExecutivoFilter(dashboardExecutivoFilter.filter((x) => x !== v)) };
                  })
                : []),
            ].map((f, i) => (
              <span key={i} className="text-xs bg-slate-100 text-slate-600 pl-2 pr-1 py-1 rounded-md flex items-center gap-1">
                {f.label}
                <button type="button" onClick={f.clear} className="hover:text-slate-900">
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Filtro Ano */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-slate-400">Ano</span>
          <div className="flex flex-wrap gap-1.5">
            {YEARS.map((y) => (
              <button
                type="button"
                key={y}
                onClick={() => setDashboardYear(y)}
                className={
                  "w-16 text-xs border rounded-md py-1.5 " +
                  (dashboardYear === y ? "bg-slate-900 border-slate-900 text-white" : "border-slate-200 text-slate-600 bg-white hover:bg-slate-50")
                }
              >
                {y}
              </button>
            ))}
          </div>
        </div>

        {/* Filtro Mês */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-400">Mês</span>
            {dashboardMonths.length > 0 && (
              <button
                type="button"
                onClick={() => setDashboardMonths([])}
                className="text-xs text-rose-600 hover:text-rose-700"
              >
                Limpar meses
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {MONTHS.map((m) => (
              <label
                key={m}
                className={
                  "w-16 flex items-center justify-center text-xs border rounded-md py-1.5 cursor-pointer " +
                  (dashboardMonths.includes(m) ? "bg-rose-50 border-rose-300 text-rose-700" : "border-slate-200 text-slate-600 bg-white")
                }
              >
                <input
                  type="checkbox"
                  className="hidden"
                  checked={dashboardMonths.includes(m)}
                  onChange={() => setDashboardMonths((prev) => toggleArrayValue(prev, m))}
                />
                {m}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-3 sm:p-5">
        <div className="text-sm font-medium text-slate-700 mb-3">
          Resultado <span className="text-slate-400 font-normal">({dashboardYear})</span>
        </div>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 min-w-0">
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={resumoAnoData} margin={{ top: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 14, fill: "#64748b" }} />
                <Tooltip content={<ResultadoTooltip />} />
                <Legend wrapperStyle={{ fontSize: 13 }} />
                <Bar dataKey="Meta" stackId="resumo" fill="#0f172a" name="Meta" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Faturado" stackId="resumo" fill="#059669" name="Faturado" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Pipeline" stackId="resumo" fill="#0284c7" name="Pipeline" />
                <Bar dataKey="AProduzir" stackId="resumo" fill="#e11d48" name="GAP" radius={[4, 4, 0, 0]}>
                  <LabelList
                    dataKey="totalTop"
                    position="top"
                    formatter={(v) => (v !== 0 ? formatBRL(v) : "")}
                    style={{ fontSize: 13, fill: "#334155" }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div
            className={
              "shrink-0 md:w-72 rounded-lg border p-4 flex flex-col items-center justify-center gap-1 " +
              (dashboardProductFilter.length > 0
                ? "bg-slate-50 border-slate-200"
                : metaAtingida
                ? "bg-emerald-50 border-emerald-200"
                : "bg-rose-50 border-rose-200")
            }
          >
            <div className="text-sm font-bold text-slate-700">Meta</div>
            <MetaGauge
              percent={dashboardProductFilter.length > 0 ? 0 : visaoGeralAtingimentoPercent}
              positive={dashboardProductFilter.length > 0 ? false : metaAtingida}
            />
            <div
              className={
                "text-xl font-mono font-medium -mt-2 " +
                (dashboardProductFilter.length > 0
                  ? "text-slate-500"
                  : metaAtingida
                  ? "text-emerald-700"
                  : "text-rose-700")
              }
            >
              {formatBRL(dashboardProductFilter.length > 0 ? 0 : faturadoMenosMeta)}
            </div>
          </div>
        </div>
        {(!metaVisible || dashboardProductFilter.length > 0) && (
          <div className="text-xs text-slate-400 mt-2">
            {dashboardProductFilter.length > 0
              ? "Os dados de Resultado ficam zerados enquanto houver filtro de Produto ativo (o faturamento não possui divisão por produto)."
              : "Meta e GAP ficam zerados enquanto houver filtro de Agência ou Anunciante ativo."}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-3 sm:p-5">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="text-sm font-medium text-slate-700">
            Resultado Mensal <span className="text-slate-400 font-normal">({dashboardYear})</span>
          </div>
          <div className="text-xs text-slate-400">
            Faturamento {formatBRL(visaoGeralFaturamentoEfetivoTotal)} · Pipeline {formatBRL(visaoGeralFaturamentoPotencialTotal)}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={visaoGeralFaturamentoData} margin={{ top: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
            <XAxis dataKey="month" interval={0} height={45} tick={<RotatedTick90 />} />
            <Tooltip content={<ResultadoMensalTooltip />} />
            <Legend wrapperStyle={{ fontSize: 13 }} />
            <Bar dataKey="Faturamento" stackId="fat" fill="#059669" name="Faturamento" />
            <Bar dataKey="Pipeline" stackId="fat" fill="#0284c7" name="Pipeline" radius={[4, 4, 0, 0]} />
            {metaVisible && <Line type="monotone" dataKey="Meta" name="Meta" stroke="#0f172a" strokeWidth={2} dot={{ r: 3 }} />}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Tabela detalhada de todos os clientes com faturamento */}
      <ClientBilledTable
        advertisers={advertisers}
        faturamentoEfetivo={faturamentoEfetivo}
        executivos={executivos}
        segmentoExecutivo={segmentoExecutivo}
        executivoKeyAccounts={executivoKeyAccounts}
        dashboardYear={dashboardYear}
        dashboardMonths={dashboardMonths}
        dashboardSegmentFilter={dashboardSegmentFilter}
        dashboardAdvertiserFilter={dashboardAdvertiserFilter}
        dashboardAgencyFilter={dashboardAgencyFilter}
        dashboardExecutivoFilter={dashboardExecutivoFilter}
        dashboardProductFilter={dashboardProductFilter}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          label="Pipeline Total Aberto"
          value={formatBRL(pipelineTotalGeralValor ?? pipelineTotal)}
          sub={`${pipelineTotalGeralCount ?? dashboardOpps.length} oportunidades`}
        />
        <KpiCard
          label={periodLabel || `Pipeline ${dashboardYear} Aberto`}
          value={formatBRL(pipelinePeriodoValor ?? pipelineTotal)}
          sub={`${pipelinePeriodoCount ?? dashboardOpps.length} oportunidades`}
        />
        <KpiCard
          label="Em Desenvolvimento"
          value={formatBRL(emDesenvolvimentoValor)}
          sub={`${countByStage("Desenvolvimento")} oportunidades`}
        />
        <KpiCard
          label="Em Aberto"
          value={formatBRL(emAbertoValor)}
          sub={`${emAbertoCount} · frio, morno e quente`}
        />
        <KpiCard
          label="Estimativa de Faturamento"
          value={formatBRL(estimativaFaturamento)}
          sub="0% frio + 10% morno + 70% quente"
        />
        <KpiCard
          label="Fechados"
          value={formatBRL(fechadosValor)}
          sub={`${countByStage("Fechado")} oportunidades`}
        />
        <KpiCard
          label="Negados"
          value={formatBRL(negadosValor)}
          sub={`${countByStage("Negado")} oportunidades`}
        />
        <KpiCard
          label="Taxa de Conversão"
          value={`${Math.round(taxaConversao * 100)}%`}
          sub={`${countByStage("Fechado")} fechadas · ${countByStage("Negado")} negadas`}
        />
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-3 sm:p-5">
        <div className="text-sm font-medium text-slate-700 mb-3">Pipeline Total <span className="text-slate-400 font-normal">({periodSubtitle})</span></div>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={stageData} margin={{ top: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
            <XAxis dataKey="stage" interval={0} height={105} tick={<RotatedTick90 />} />
            <Tooltip formatter={(v) => formatBRL(v)} />
            <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
              {stageData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={STAGE_CHART_COLORS[entry.stage] || "#94a3b8"} />
              ))}
              <LabelList
                dataKey="valor"
                position="top"
                formatter={(v) => formatBRL(v)}
                style={{ fontSize: 13, fill: "#334155" }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-3 sm:p-5">
        <div className="text-sm font-medium text-slate-700 mb-3">Pipeline Mensal <span className="text-slate-400 font-normal">({periodSubtitle})</span></div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={monthlyOpenData} margin={{ top: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
            <XAxis dataKey="month" interval={0} height={45} tick={<RotatedTick90 />} />
            <Tooltip content={<StageStackTooltip />} />
            <Legend wrapperStyle={{ fontSize: 13 }} />
            <Bar dataKey="Frio" stackId="pipeline" fill="#3b82f6" name="Frio" />
            <Bar dataKey="Morno" stackId="pipeline" fill="#eab308" name="Morno" />
            <Bar dataKey="Quente" stackId="pipeline" fill="#f97316" name="Quente" radius={[4, 4, 0, 0]}>
              <LabelList dataKey="total" position="top" formatter={(v) => formatBRL(v)} style={{ fontSize: 12, fill: "#334155" }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-3 sm:p-5">
        <div className="text-sm font-medium text-slate-700 mb-3">Pipeline por Produto</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse whitespace-nowrap">
            <thead>
              <tr className="text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-3 font-medium text-left">Programa</th>
                <th className="py-2 px-3 font-medium text-right">Valor Total</th>
                <th className="py-2 px-3 font-medium text-right">Em Aberto</th>
                {STAGES.map((s) => (
                  <th key={s} className="py-2 px-3 font-medium text-right">{s}</th>
                ))}
                <th className="py-2 pl-3 font-medium text-right">Taxa Conv.</th>
              </tr>
            </thead>
            {[
              { label: "Televisão", rows: tvProductRows, totals: tvProductTotals },
              { label: "Digital", rows: digitalProductRows, totals: digitalProductTotals },
              { label: "Projetos Especiais", rows: specialProductRows, totals: specialProductTotals },
            ].map((group) => {
              const headerStyles = {
                "Televisão": "bg-sky-50 text-sky-800 border-sky-200",
                "Digital": "bg-violet-50 text-violet-800 border-violet-200",
                "Projetos Especiais": "bg-amber-50 text-amber-800 border-amber-200",
              };
              const colSpanTotal = STAGES.length + 4;
              return (
                <tbody key={group.label}>
                  <tr>
                    <td colSpan={colSpanTotal} className="pt-4 pb-0 pl-0">
                      <div className={"text-sm font-bold uppercase tracking-wide px-3 py-2 rounded-md border " + headerStyles[group.label]}>
                        {group.label}
                      </div>
                    </td>
                  </tr>
                  {group.rows.length === 0 && (
                    <tr>
                      <td colSpan={colSpanTotal} className="py-2 text-slate-300">Nenhuma oportunidade nesse grupo, no período filtrado.</td>
                    </tr>
                  )}
                  {group.rows.map((r) => (
                    <tr key={r.product} className="border-b border-slate-50 text-slate-600">
                      <td className="py-1.5 pr-3 text-slate-700 font-medium">{r.product}</td>
                      <td className="py-1.5 px-3 text-right font-mono font-semibold text-slate-900">{r.total > 0 ? formatBRL(r.total) : "—"}</td>
                      <td className="py-1.5 px-3 text-right font-mono font-medium text-slate-700">{r.emAberto > 0 ? formatBRL(r.emAberto) : "—"}</td>
                      {STAGES.map((s) => (
                        <td key={s} className="py-1.5 px-3 text-right font-mono">{r.stageValues[s] > 0 ? formatBRL(r.stageValues[s]) : "—"}</td>
                      ))}
                      <td className="py-1.5 pl-3 text-right font-mono">{r.taxaConversao === null ? "—" : `${Math.round(r.taxaConversao * 100)}%`}</td>
                    </tr>
                  ))}
                  {group.rows.length > 0 && (
                    <tr className="border-t border-slate-200 font-medium text-slate-800 bg-slate-50/50">
                      <td className="py-1.5 pr-3 font-bold">Total {group.label}</td>
                      <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-900">{group.totals.total > 0 ? formatBRL(group.totals.total) : "—"}</td>
                      <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-800">{group.totals.emAberto > 0 ? formatBRL(group.totals.emAberto) : "—"}</td>
                      {STAGES.map((s) => (
                        <td key={s} className="py-1.5 px-3 text-right font-mono">{group.totals.stageValues[s] > 0 ? formatBRL(group.totals.stageValues[s]) : "—"}</td>
                      ))}
                      <td className="py-1.5 pl-3 text-right font-mono font-bold">{group.totals.taxaConversao === null ? "—" : `${Math.round(group.totals.taxaConversao * 100)}%`}</td>
                    </tr>
                  )}
                </tbody>
              );
            })}
          </table>
        </div>
      </div>
    </div>
  );
}
