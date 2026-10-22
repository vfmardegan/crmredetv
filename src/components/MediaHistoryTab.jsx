import React from "react";

export default function MediaHistoryTab() {
  return (
    <div className="w-full h-full min-h-[calc(100vh-64px)] bg-slate-50 flex flex-col">
      <iframe
        src="/media-planner/historico.html"
        title="Histórico de Propostas"
        className="w-full flex-1 min-h-[calc(100vh-64px)] border-0"
      />
    </div>
  );
}
