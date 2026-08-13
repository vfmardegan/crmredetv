import React, { useState } from "react";
import { Filter } from "lucide-react";
import { toggleArrayValue, MONTHS, YEARS, CURRENT_YEAR } from "../../utils/helpers";

export function MultiSelectFilterButton({ label, options, selected, onChange, searchPlaceholder }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const visibleOptions = query.trim()
    ? options.filter((opt) => opt.label.toLowerCase().includes(query.trim().toLowerCase()))
    : options;
  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => {
          setQuery("");
          setOpen((v) => !v);
        }}
        className={
          "flex items-center gap-1.5 text-xs border rounded-md px-3 py-1.5 " +
          (selected.length > 0
            ? "bg-rose-50 border-rose-300 text-rose-700"
            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50")
        }
      >
        <Filter size={13} />
        {label}{selected.length > 0 ? ` (${selected.length})` : ""}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1 w-64 bg-white border border-slate-200 rounded-md shadow-sm p-2 max-h-80 overflow-y-auto">
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder || `Buscar ${label.toLowerCase()}...`}
              className="w-full border border-slate-200 rounded-md px-2 py-1 text-xs mb-1"
            />
            {selected.length > 0 && (
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-xs text-rose-600 hover:text-rose-700 mb-1 px-1"
              >
                Limpar filtros
              </button>
            )}
            {visibleOptions.length === 0 && (
              <div className="text-xs text-slate-400 px-1.5 py-1">
                {options.length === 0 ? "Nenhuma opção disponível." : `Nenhum resultado para "${query}".`}
              </div>
            )}
            <div className="flex flex-col gap-0.5">
              {visibleOptions.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 text-xs px-1.5 py-1 hover:bg-slate-50 rounded cursor-pointer text-slate-600">
                  <input
                    type="checkbox"
                    checked={selected.includes(opt.value)}
                    onChange={() => onChange(toggleArrayValue(selected, opt.value))}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function PeriodFilterButton({ selected, onChange }) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(CURRENT_YEAR);
  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={
          "flex items-center gap-1.5 text-xs border rounded-md px-3 py-1.5 " +
          (selected.length > 0
            ? "bg-rose-50 border-rose-300 text-rose-700"
            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50")
        }
      >
        <Filter size={13} />
        Mês{selected.length > 0 ? ` (${selected.length})` : ""}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1 w-72 bg-white border border-slate-200 rounded-md shadow-sm p-2">
            {selected.length > 0 && (
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-xs text-rose-600 hover:text-rose-700 mb-2 px-1"
              >
                Limpar filtros
              </button>
            )}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {YEARS.map((y) => (
                <button
                  type="button"
                  key={y}
                  onClick={() => setViewYear(y)}
                  className={
                    "text-xs border rounded-md px-2 py-1 " +
                    (viewYear === y ? "bg-slate-900 border-slate-900 text-white" : "border-slate-200 text-slate-600")
                  }
                >
                  {y}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {MONTHS.map((m) => {
                const code = `${viewYear}-${m}`;
                return (
                  <label
                    key={m}
                    className={
                      "flex items-center justify-center text-xs border rounded-md px-2 py-1 cursor-pointer " +
                      (selected.includes(code) ? "bg-rose-50 border-rose-300 text-rose-700" : "border-slate-200 text-slate-600")
                    }
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={selected.includes(code)}
                      onChange={() => onChange(toggleArrayValue(selected, code))}
                    />
                    {m}
                  </label>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
