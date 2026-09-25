import React from "react";
import { formatBRL } from "../../utils/helpers";

export function StageStackTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const order = ["Frio", "Morno", "Quente"];
  const items = order.map((key) => payload.find((p) => p.dataKey === key)).filter(Boolean);
  if (items.length === 0) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-md shadow-sm px-3 py-2 flex flex-col gap-1">
      {items.map((item) => (
        <div key={item.dataKey} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
          <span className="text-slate-500">{item.name}</span>
          <span className="font-mono text-slate-800 ml-auto">{formatBRL(item.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function ResultadoMensalTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const order = ["Faturamento", "Pipeline", "Meta"];
  const items = order.map((key) => payload.find((p) => p.dataKey === key)).filter(Boolean);
  if (items.length === 0) return null;
  const faturamento = items.find((i) => i.dataKey === "Faturamento")?.value || 0;
  const pipeline = items.find((i) => i.dataKey === "Pipeline")?.value || 0;
  const meta = items.find((i) => i.dataKey === "Meta")?.value || 0;
  const hasMeta = items.some((i) => i.dataKey === "Meta");
  const gap = faturamento + pipeline - meta;
  return (
    <div className="bg-white border border-slate-200 rounded-md shadow-sm px-3 py-2 flex flex-col gap-1">
      {items.map((item) => (
        <div key={item.dataKey} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
          <span className="text-slate-500">{item.name}</span>
          <span className="font-mono text-slate-800 ml-auto">{formatBRL(item.value)}</span>
        </div>
      ))}
      {hasMeta && (
        <div className="flex items-center gap-2 text-xs border-t border-slate-100 pt-1 mt-0.5">
          <span className="text-slate-500">GAP</span>
          <span className={"font-mono ml-auto " + (gap < 0 ? "text-rose-600" : "text-emerald-600")}>{formatBRL(gap)}</span>
        </div>
      )}
    </div>
  );
}

export function ResultadoTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length || label !== "GAP") return null;
  const order = ["Pipeline", "AProduzir"];
  const items = order.map((key) => payload.find((p) => p.dataKey === key)).filter(Boolean);
  if (items.length === 0) return null;
  const nameMap = { Pipeline: "Pipeline", AProduzir: "GAP" };
  const totalGap = items.reduce((s, i) => s + (i.value || 0), 0);
  const displayGap = totalGap > 0 ? -totalGap : totalGap;
  return (
    <div className="bg-white border border-slate-200 rounded-md shadow-sm px-3 py-2 flex flex-col gap-1">
      <div className="text-xs text-slate-500 font-medium border-b border-slate-100 pb-1 mb-0.5">GAP: {formatBRL(displayGap)}</div>
      {items.map((item) => (
        <div key={item.dataKey} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
          <span className="text-slate-500">{nameMap[item.dataKey]}</span>
          <span className="font-mono text-slate-800 ml-auto">{formatBRL(item.value)}</span>
        </div>
      ))}
    </div>
  );
}
