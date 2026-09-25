import React, { useState } from "react";
import { X } from "lucide-react";

export function ClientSearchField({ label, type, advertisers, valueId, onSelect, onCreateNew, placeholder, required, directOption }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const selected = directOption && valueId === directOption.id ? directOption : advertisers.find((a) => a.id === valueId);
  const pool = advertisers.filter((a) => a.type === type);
  const q = query.trim().toLowerCase();
  const results = q
    ? pool.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          (a.razaoSocial || "").toLowerCase().includes(q)
      )
    : pool;

  return (
    <div className="relative">
      <label className="text-xs text-slate-700 font-medium mb-1 block">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {selected ? (
        <div className="flex items-center justify-between border border-slate-200 rounded-md px-3 py-2 text-sm bg-slate-50">
          <span className="text-slate-700">{selected.name}</span>
          <button type="button" onClick={() => onSelect("")} className="text-slate-400 hover:text-slate-700">
            <X size={14} />
          </button>
        </div>
      ) : (
        <>
          <input
            type="text"
            required={required}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 200)}
            placeholder={placeholder}
            className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
          />
          {open && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg max-h-56 overflow-y-auto flex flex-col">
              {directOption && !query && (
                <button
                  type="button"
                  onMouseDown={() => {
                    onSelect(directOption.id);
                    setQuery("");
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 text-rose-600 font-medium border-b border-slate-100 shrink-0"
                >
                  {directOption.name}
                </button>
              )}
              <div className="overflow-y-auto flex-1 max-h-40">
                {results.length > 0 ? (
                  results.map((a) => (
                    <button
                      type="button"
                      key={a.id}
                      onMouseDown={() => {
                        onSelect(a.id);
                        setQuery("");
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 text-slate-700 block"
                    >
                      {a.name}
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-xs text-slate-400">
                    Nenhum resultado para "{query}".
                  </div>
                )}
              </div>
              {onCreateNew && (
                <div className="p-2 bg-slate-50 border-t border-slate-150 shrink-0">
                  <button
                    type="button"
                    onMouseDown={() => {
                      onCreateNew(query);
                      setQuery("");
                    }}
                    className="w-full text-left px-2 py-1.5 text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1"
                  >
                    + Cadastrar {type === "Agência" ? "nova Agência" : "novo Anunciante"} {query ? `"${query}"` : ""}
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function MultiClientSearchField({ label, type, advertisers, selectedIds, onChange, placeholder, onCreateNew }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const pool = advertisers.filter((a) => a.type === type && !selectedIds.includes(a.id));
  const q = query.trim().toLowerCase();
  const results = q
    ? pool.filter((a) => a.name.toLowerCase().includes(q) || (a.razaoSocial || "").toLowerCase().includes(q))
    : pool;
  const selectedItems = selectedIds.map((id) => advertisers.find((a) => a.id === id)).filter(Boolean);

  return (
    <div>
      <label className="text-xs text-slate-700 font-medium mb-1 block">{label}</label>
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-1.5">
          {selectedItems.map((a) => (
            <span key={a.id} className="text-xs bg-rose-50 border border-rose-200 text-rose-700 pl-2 pr-1 py-0.5 rounded-md flex items-center gap-1">
              {a.name}
              <button type="button" onClick={() => onChange(selectedIds.filter((id) => id !== a.id))} className="hover:text-rose-900">
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
        />
        {open && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-md shadow-sm max-h-48 overflow-y-auto">
            {results.length > 0 ? (
              results.map((a) => (
                <button
                  type="button"
                  key={a.id}
                  onMouseDown={() => {
                    onChange([...selectedIds, a.id]);
                    setQuery("");
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 text-slate-700"
                >
                  {a.name}
                </button>
              ))
            ) : (
              <div className="p-3 flex flex-col gap-2">
                <span className="text-xs text-slate-400">Nenhum resultado para "{query}".</span>
                {onCreateNew && (
                  <button
                    type="button"
                    onMouseDown={() => onCreateNew(query)}
                    className="text-xs text-rose-600 hover:text-rose-700 font-medium text-left"
                  >
                    + Cadastrar {type}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function ContactSearchField({ label, options, valueId, onSelect, onCreateNew, disabled }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const selected = options.find((c) => c.id === valueId);
  const q = query.trim().toLowerCase();
  const results = q
    ? options.filter((c) => c.name.toLowerCase().includes(q) || (c.cargo || "").toLowerCase().includes(q))
    : options;

  return (
    <div className="relative">
      <label className="text-xs text-slate-700 font-medium mb-1 block">{label}</label>
      {selected ? (
        <div className="flex items-center justify-between border border-slate-200 rounded-md px-3 py-2 text-sm bg-slate-50">
          <span className="text-slate-700">{selected.name} — {selected.cargo} ({selected.ownerName})</span>
          <button type="button" onClick={() => onSelect("")} className="text-slate-400 hover:text-slate-700">
            <X size={14} />
          </button>
        </div>
      ) : (
        <>
          <input
            type="text"
            disabled={disabled}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 200)}
            placeholder={disabled ? "Selecione agência ou anunciante primeiro" : "Buscar contato..."}
            className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-400"
          />
          {open && !disabled && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg max-h-56 overflow-y-auto flex flex-col">
              <div className="overflow-y-auto flex-1 max-h-40">
                {results.length > 0 ? (
                  results.map((c) => (
                    <button
                      type="button"
                      key={c.id}
                      onMouseDown={() => {
                        onSelect(c.id);
                        setQuery("");
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 text-slate-700 block"
                    >
                      {c.name} — {c.cargo} ({c.ownerName})
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-xs text-slate-400">
                    Nenhum contato encontrado{query ? ` para "${query}"` : ""}.
                  </div>
                )}
              </div>
              {onCreateNew && (
                <div className="p-2 bg-slate-50 border-t border-slate-150 shrink-0">
                  <button
                    type="button"
                    onMouseDown={() => {
                      onCreateNew(query);
                      setQuery("");
                    }}
                    className="w-full text-left px-2 py-1.5 text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1"
                  >
                    + Cadastrar novo Contato {query ? `"${query}"` : ""}
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function AnyClientSearchField({ label, advertisers, valueId, onSelect, onCreateNew, placeholder }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const selected = advertisers.find((a) => a.id === valueId);
  const q = query.trim().toLowerCase();
  const results = q
    ? advertisers.filter((a) => a.name.toLowerCase().includes(q) || (a.razaoSocial || "").toLowerCase().includes(q))
    : advertisers;

  return (
    <div className="relative">
      <label className="text-xs text-slate-700 font-medium mb-1 block">{label}</label>
      {selected ? (
        <div className="flex items-center justify-between border border-slate-200 rounded-md px-3 py-2 text-sm bg-slate-50">
          <span className="text-slate-700">{selected.name} <span className="text-slate-400">({selected.type})</span></span>
          <button type="button" onClick={() => onSelect("")} className="text-slate-400 hover:text-slate-700">
            <X size={14} />
          </button>
        </div>
      ) : (
        <>
          <input
            type="text"
            required
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 200)}
            placeholder={placeholder}
            className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
          />
          {open && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg max-h-56 overflow-y-auto flex flex-col">
              <div className="overflow-y-auto flex-1 max-h-40">
                {results.length > 0 ? (
                  results.map((a) => (
                    <button
                      type="button"
                      key={a.id}
                      onMouseDown={() => {
                        onSelect(a.id);
                        setQuery("");
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 text-slate-700 block"
                    >
                      {a.name} <span className="text-slate-400">({a.type})</span>
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-xs text-slate-400">
                    Nenhum resultado para "{query}".
                  </div>
                )}
              </div>
              {onCreateNew && (
                <div className="p-2 bg-slate-50 border-t border-slate-150 shrink-0">
                  <button
                    type="button"
                    onMouseDown={() => {
                      onCreateNew(query);
                      setQuery("");
                    }}
                    className="w-full text-left px-2 py-1.5 text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1"
                  >
                    + Cadastrar novo Cliente {query ? `"${query}"` : ""}
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
