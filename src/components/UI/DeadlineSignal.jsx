import React from "react";

export function DeadlineSignal({ deliveryDate }) {
  if (!deliveryDate) {
    return <span className="text-xs text-slate-300">—</span>;
  }
  const deadline = new Date(`${deliveryDate}T23:59:59`);
  const diffHours = (deadline.getTime() - Date.now()) / (1000 * 60 * 60);
  let color = "bg-emerald-500";
  let label = "No prazo";
  if (diffHours < 0) {
    color = "bg-rose-500";
    label = "Atrasado";
  } else if (diffHours <= 24) {
    color = "bg-amber-400";
    label = "Até 24h";
  }
  return (
    <span className="flex items-center gap-1.5 whitespace-nowrap">
      <span className={"w-2.5 h-2.5 rounded-full shrink-0 " + color} />
      <span className="text-xs text-slate-500">{label}</span>
    </span>
  );
}
export default DeadlineSignal;
