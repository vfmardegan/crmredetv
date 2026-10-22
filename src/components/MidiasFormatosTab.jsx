import React from "react";

export default function MidiasFormatosTab() {
  return (
    <div className="w-full h-full min-h-[calc(100vh-64px)] bg-slate-50 flex flex-col">
      <iframe
        src="/media-planner/tabelas.html"
        title="Mídias e Formatos"
        className="w-full flex-1 min-h-[calc(100vh-64px)] border-0"
      />
    </div>
  );
}
