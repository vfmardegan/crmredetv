import React, { useState } from "react";
import { X, ExternalLink } from "lucide-react";
import {
  PLANNING_TYPES,
  PLANNING_STATUSES,
  DIRECT_CLIENT_ID,
  formatDate
} from "../utils/helpers";
import { DeadlineSignal } from "./UI/DeadlineSignal";
import { MultiSelectFilterButton } from "./UI/Filters";

export default function PlanningTab({
  planningGroups,
  advertisers,
  updatePlanningField,
  updateOpportunityProducts,
  allProducts,
  responsaveis,
  goToOpportunityInPipeline
}) {
  const [selectedOpp, setSelectedOpp] = useState(null);
  const [tempProducts, setTempProducts] = useState([]);
  const [valuationForm, setValuationForm] = useState({});
  const [tvExpanded, setTvExpanded] = useState(false);
  const [digitalExpanded, setDigitalExpanded] = useState(false);
  const [specialExpanded, setSpecialExpanded] = useState(false);
  const [openResponsavelOppId, setOpenResponsavelOppId] = useState(null);
  const [responsavelSearch, setResponsavelSearch] = useState("");
  const [planningSearch, setPlanningSearch] = useState("");
  const [responsavelFilter, setResponsavelFilter] = useState([]);

  // Fallbacks estáticos se allProducts for vazio
  const tvProducts = (allProducts?.televisao?.length > 0 ? allProducts.televisao : [
    'A Tarde É Sua','A Tarde É Sua - 1ª Edição','American Zone','Bola Na Rede',
    'Brasil Do Povo','É Notícia','Fica Com A Gente','Leitura Dinâmica','Mega Sonho',
    'Nordeste Do Povo','Operação De Risco','Para Aqui','Programmatic TV','RedeTV! News',
    'RedeTV! Notícias - 1ª Edição','RedeTV! Notícias - 2ª Edição','RJ Do Povo',
    'Rodada De Negócios','Rotativo','Sensacional','Superpop','TV Fama'
  ]).slice().sort((a,b) => a.localeCompare(b, 'pt-BR'));
  
  const digitalProducts = (allProducts?.digital?.length > 0 ? allProducts.digital : [
    'Esportes','Google Partner Sales','Pegadinhas','RedeTV! Noticias','Social Media','Soft News'
  ]).slice().sort((a,b) => a.localeCompare(b, 'pt-BR'));
  
  const specialProjects = (allProducts?.especiais?.length > 0 ? allProducts.especiais : [
    'Bezona','Eleições 2026','Liga Monstro','Liga Universitária'
  ]).slice().sort((a,b) => a.localeCompare(b, 'pt-BR'));

  // Lista de responsáveis únicos para filtro
  const allOppsInGroups = (planningGroups || []).flatMap((g) => g.rows || []);
  const responsavelNamesFromProp = (responsaveis || []).map((r) => (typeof r === "string" ? r : (r.nome || r.name || "")));
  const responsavelNamesFromOpps = allOppsInGroups.flatMap((o) => (o.responsavel || "").split(",").map((x) => x.trim()));
  const availableResponsavelOptions = Array.from(new Set([...responsavelNamesFromProp, ...responsavelNamesFromOpps]))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "pt-BR"))
    .map((name) => ({ value: name, label: name }));

  // Helper de formatação de milhar
  const formatThousandsBR = (val) => String(val).replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  function handleProductToggle(p) {
    setTempProducts((prev) => {
      const nextProducts = prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p];
      setValuationForm((prevVals) => {
        const nextVals = { ...prevVals };
        if (!nextProducts.includes(p)) {
          delete nextVals[p];
        }
        return nextVals;
      });
      return nextProducts;
    });
  }

  const query = planningSearch.trim().toLowerCase();

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-3 sm:p-5">
      {/* Barra de Filtros e Busca do Planejamento */}
      <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <input
            type="text"
            value={planningSearch}
            onChange={(e) => setPlanningSearch(e.target.value)}
            placeholder="Buscar no planejamento (oportunidade, executivo, agência, anunciante)..."
            className="border border-slate-200 rounded-md px-3 py-1.5 text-xs bg-white w-full sm:w-72 outline-none focus:ring-2 focus:ring-slate-400 placeholder:text-slate-400 shadow-sm"
          />
          <MultiSelectFilterButton
            label="Responsável"
            options={availableResponsavelOptions}
            selected={responsavelFilter}
            onChange={setResponsavelFilter}
            searchPlaceholder="Buscar responsável..."
          />
          {(planningSearch || responsavelFilter.length > 0) && (
            <button
              type="button"
              onClick={() => {
                setPlanningSearch("");
                setResponsavelFilter([]);
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium px-2 py-1 bg-rose-50 rounded-md border border-rose-100"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse whitespace-nowrap">
          <thead>
            <tr className="text-slate-500 border-b border-slate-200 text-left">
              <th className="py-2 pr-3 font-medium">Nome da Oportunidade</th>
              <th className="py-2 px-3 font-medium">Executivo</th>
              <th className="py-2 px-3 font-medium">Agência</th>
              <th className="py-2 px-3 font-medium">Anunciante</th>
              <th className="py-2 px-3 font-medium w-36 max-w-[144px]">Responsável</th>
              <th className="py-2 px-3 font-medium">Tipo</th>
              <th className="py-2 px-3 font-medium">Versão</th>
              <th className="py-2 px-3 font-medium">Data de Entrada</th>
              <th className="py-2 px-3 font-medium">Deadline</th>
              <th className="py-2 px-3 font-medium">Valoração / Verba</th>
              <th className="py-2 px-3 font-medium">Prazo</th>
              <th className="py-2 px-3 font-medium">Status</th>
              <th className="py-2 px-3 font-medium">Observação</th>
              <th className="py-2 pl-3 font-medium">Data de Entrega</th>
            </tr>
          </thead>
          {planningGroups.map((group) => {
            const headerStyles = {
              "Em Aberto": "bg-sky-50 text-sky-800 border-sky-200",
              "Entregue": "bg-emerald-50 text-emerald-800 border-emerald-200",
              "Finalizado": "bg-slate-100 text-slate-800 border-slate-300",
            };

            const filteredRows = group.rows.filter((opp) => {
              // Filtro por Responsável selecionado
              if (responsavelFilter.length > 0) {
                const oppResps = (opp.responsavel || "").split(",").map((x) => x.trim()).filter(Boolean);
                const matchResp = oppResps.some((r) => responsavelFilter.includes(r));
                if (!matchResp) return false;
              }

              // Filtro por Texto da busca
              if (query) {
                const adv = advertisers.find((a) => a.id === opp.advertiserId);
                const ag = opp.agencyId && opp.agencyId !== DIRECT_CLIENT_ID ? advertisers.find((a) => a.id === opp.agencyId) : null;
                
                const titleMatch = (opp.title || "").toLowerCase().includes(query);
                const execMatch = (opp.executivo || "").toLowerCase().includes(query);
                const respMatch = (opp.responsavel || "").toLowerCase().includes(query);
                const statusMatch = (opp.status || "").toLowerCase().includes(query);
                const advMatch = adv ? (
                  (adv.nomeFantasia || "").toLowerCase().includes(query) ||
                  (adv.razaoSocial || "").toLowerCase().includes(query)
                ) : false;
                const agMatch = ag ? (
                  (ag.nomeFantasia || "").toLowerCase().includes(query) ||
                  (ag.razaoSocial || "").toLowerCase().includes(query)
                ) : false;

                if (!titleMatch && !execMatch && !respMatch && !statusMatch && !advMatch && !agMatch) {
                  return false;
                }
              }

              return true;
            });

            return (
              <tbody key={group.label}>
                <tr>
                  <td colSpan={14} className="pt-4 pb-0 pl-0">
                    <div className={"text-sm font-bold uppercase tracking-wide px-3 py-2 rounded-md border " + headerStyles[group.label]}>
                      {group.label} <span className="font-normal normal-case text-xs">({filteredRows.length})</span>
                    </div>
                  </td>
                </tr>
                {filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={14} className="py-2 text-slate-300">
                      {query ? "Nenhuma oportunidade encontrada para a busca." : "Nenhuma oportunidade nesta categoria."}
                    </td>
                  </tr>
                )}
                {filteredRows.map((o) => {
                  const agency = o.agencyId && o.agencyId !== DIRECT_CLIENT_ID ? advertisers.find((a) => a.id === o.agencyId) : null;
                  const advertiser = advertisers.find((a) => a.id === o.advertiserId);
                  return (
                    <tr key={o.id} className="border-b border-slate-50 text-slate-600 align-top">
                      <td className="py-2 pr-3 font-medium">
                        <button
                          type="button"
                          onClick={() => {
                            if (typeof goToOpportunityInPipeline === "function") {
                              goToOpportunityInPipeline(o.id);
                            }
                          }}
                          className="text-left text-slate-800 hover:text-rose-600 hover:underline flex items-center gap-1.5 group cursor-pointer transition-colors"
                          title="Abrir oportunidade no pipeline"
                        >
                          <span className="font-medium group-hover:text-rose-600 transition-colors">{o.title}</span>
                          <ExternalLink size={12} className="text-slate-400 group-hover:text-rose-600 opacity-60 group-hover:opacity-100 transition-all shrink-0" />
                        </button>
                      </td>
                      <td className="py-2 px-3 text-slate-700">{o.executivo || "—"}</td>
                      <td className="py-2 px-3">{agency ? agency.name : "Cliente Direto"}</td>
                      <td className="py-2 px-3">{advertiser ? advertiser.name : "—"}</td>
                      <td className="py-2 px-3 relative w-36 max-w-[144px]">
                        {/* Botão de Dropdown de Especialistas */}
                        <button
                          type="button"
                          title={o.responsavel || "Sem responsáveis atribuídos"}
                          onClick={() => {
                            setOpenResponsavelOppId(openResponsavelOppId === o.id ? null : o.id);
                            setResponsavelSearch("");
                          }}
                          className="text-xs border border-slate-200 rounded px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 w-full max-w-[130px] text-left truncate flex items-center justify-between shadow-sm cursor-pointer"
                        >
                          <span className="truncate">{o.responsavel || "Atribuir"}</span>
                          <span className="text-slate-400 text-[9px] ml-1.5 shrink-0">▼</span>
                        </button>

                        {openResponsavelOppId === o.id && (
                          <>
                            {/* Backdrop invisível para fechar */}
                            <div className="fixed inset-0 z-10" onClick={() => setOpenResponsavelOppId(null)}></div>
                            
                            <div className="absolute left-3 top-9 bg-white border border-slate-200 rounded-lg shadow-lg p-3 z-20 min-w-[200px] flex flex-col gap-1.5">
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 pb-1 border-b border-slate-100 mb-1.5">
                                Selecionar Responsáveis
                              </div>
                              
                              {/* Campo de Busca */}
                              <input
                                type="text"
                                value={responsavelSearch}
                                onChange={(e) => setResponsavelSearch(e.target.value)}
                                placeholder="Buscar usuário..."
                                className="w-full border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400 bg-white"
                              />

                              {/* Usuários Já Atribuídos */}
                              {(() => {
                                const selectedList = o.responsavel ? o.responsavel.split(",").map(x => x.trim()).filter(Boolean) : [];
                                if (selectedList.length === 0) return null;
                                return (
                                  <div className="flex flex-col gap-1 mt-1 border-b border-slate-100 pb-2">
                                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Atribuídos</div>
                                    <div className="flex flex-wrap gap-1">
                                      {selectedList.map((esp) => (
                                        <span
                                          key={esp}
                                          className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-[9px] font-medium px-2 py-0.5 rounded-full border border-slate-200"
                                        >
                                          <span>{esp}</span>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const nextList = selectedList.filter(x => x !== esp);
                                              updatePlanningField(o.id, "responsavel", nextList.join(", "));
                                            }}
                                            className="hover:text-red-500 font-bold ml-0.5 text-slate-400 focus:outline-none text-[10px]"
                                          >
                                            ×
                                          </button>
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })()}

                              {/* Candidatos Disponíveis */}
                              {(() => {
                                const query = responsavelSearch.trim().toLowerCase();
                                if (!query) return null;

                                const selectedList = o.responsavel ? o.responsavel.split(",").map(x => x.trim()).filter(Boolean) : [];
                                const candidates = responsaveis.filter((esp) => {
                                  const isSelected = selectedList.includes(esp);
                                  if (isSelected) return false;
                                  return esp.toLowerCase().includes(query);
                                });

                                return (
                                  <div className="flex flex-col gap-1 max-h-36 overflow-y-auto pr-1">
                                    {query && <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Resultados</div>}
                                    {candidates.map((esp) => (
                                      <button
                                        key={esp}
                                        type="button"
                                        onClick={() => {
                                          const nextList = [...selectedList, esp];
                                          updatePlanningField(o.id, "responsavel", nextList.join(", "));
                                          setResponsavelSearch(""); // Limpa campo de busca após adicionar
                                        }}
                                        className="text-left text-xs text-slate-700 hover:bg-slate-50 px-2 py-1.5 rounded cursor-pointer transition-colors w-full font-medium"
                                      >
                                        + {esp}
                                      </button>
                                    ))}
                                    {candidates.length === 0 && (
                                      <div className="text-[10px] text-slate-400 p-2 italic text-center">
                                        {query ? "Nenhum usuário encontrado." : "Nenhum disponível."}
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          </>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <select
                          value={o.tipo}
                          onChange={(e) => updatePlanningField(o.id, "tipo", e.target.value)}
                          className="border border-slate-200 rounded px-1.5 py-1 text-xs bg-white"
                        >
                          {PLANNING_TYPES.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          min="1"
                          value={o.versao}
                          onChange={(e) => updatePlanningField(o.id, "versao", Number(e.target.value) || 1)}
                          className="w-14 border border-slate-200 rounded px-2 py-1 text-xs"
                        />
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-500">{formatDate(o.createdAt)}</td>
                      <td className="py-2 px-3 font-mono text-slate-500">{formatDate(o.deliveryDate)}</td>
                      <td className="py-2 px-3">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOpp(o);
                            setTempProducts(o.products || []);
                            setValuationForm(o.productValues || {});
                            setTvExpanded(false);
                            setDigitalExpanded(false);
                            setSpecialExpanded(false);
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 font-semibold"
                        >
                          <span>
                            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(o.value)}
                          </span>
                          <span className="text-[10px] text-slate-450 font-normal">
                            ({(o.products || []).length} { (o.products || []).length === 1 ? "prod" : "prods" })
                          </span>
                        </button>
                      </td>
                      <td className="py-2 px-3">
                        {["Entregue", "Comercializado", "Negativado", "Cancelado"].includes(o.status) ? (
                          <span className="text-xs text-slate-300">Concluído</span>
                        ) : (
                          <DeadlineSignal deliveryDate={o.deliveryDate} />
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <select
                          value={o.status}
                          onChange={(e) => updatePlanningField(o.id, "status", e.target.value)}
                          className="border border-slate-200 rounded px-1.5 py-1 text-xs bg-white"
                        >
                          {PLANNING_STATUSES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 px-3">
                        <textarea
                          value={o.observacao}
                          onChange={(e) => updatePlanningField(o.id, "observacao", e.target.value)}
                          placeholder="Anotações..."
                          rows={1}
                          className="w-48 border border-slate-200 rounded px-2 py-1 text-xs resize-y whitespace-normal"
                        />
                      </td>
                      <td className="py-2 pl-3 font-mono text-slate-500 text-xs">
                        {o.planDeliveryDate ? formatDate(o.planDeliveryDate) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            );
          })}
        </table>
      </div>

      {/* Modal de Valoração por Produto */}
      {selectedOpp && (
        <div className="fixed inset-0 bg-slate-900/30 flex items-center justify-center z-50 p-3 sm:p-6 overflow-y-auto" onClick={() => setSelectedOpp(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md flex flex-col gap-4 shadow-xl max-h-[92vh] overflow-y-auto my-auto sm:my-0">
            <div className="flex items-center justify-between mb-1">
              <div>
                <div className="font-semibold text-slate-800 text-sm">Valoração por Produto (Mídia)</div>
                <div className="text-xs text-slate-450 mt-0.5 truncate max-w-xs">{selectedOpp.title}</div>
              </div>
              <button onClick={() => setSelectedOpp(null)} className="text-slate-400 hover:text-slate-650">
                <X size={15} />
              </button>
            </div>

            {/* Seletores de Inclusão/Exclusão de Produtos */}
            <div className="flex flex-col gap-2 border-b border-slate-100 pb-3 mb-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Editar Produtos Associados
              </div>
              
              <div className="flex flex-col gap-1.5">
                {/* Televisão Accordion */}
                <div>
                  <button
                    type="button"
                    onClick={() => setTvExpanded(!tvExpanded)}
                    className="w-full flex items-center justify-between text-[11px] text-slate-500 font-semibold"
                  >
                    <span>Televisão ({tempProducts.filter(p => tvProducts.includes(p)).length})</span>
                    <span className="text-blue-600">{tvExpanded ? "Recolher ▲" : "Selecionar ▼"}</span>
                  </button>
                  {tvExpanded && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5 max-h-24 overflow-y-auto border border-slate-100 rounded p-1.5 bg-slate-50">
                      {tvProducts.map(p => (
                        <label key={p} className={`flex items-center gap-1 text-[10px] border rounded px-1.5 py-0.5 cursor-pointer select-none transition-colors ${
                          tempProducts.includes(p) ? "bg-rose-50 border-rose-300 text-rose-700" : "border-slate-200 text-slate-600 bg-white hover:bg-slate-50"
                        }`}>
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={tempProducts.includes(p)}
                            onChange={() => handleProductToggle(p)}
                          />
                          {p}
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Digital Accordion */}
                <div>
                  <button
                    type="button"
                    onClick={() => setDigitalExpanded(!digitalExpanded)}
                    className="w-full flex items-center justify-between text-[11px] text-slate-500 font-semibold"
                  >
                    <span>Digital ({tempProducts.filter(p => digitalProducts.includes(p)).length})</span>
                    <span className="text-blue-600">{digitalExpanded ? "Recolher ▲" : "Selecionar ▼"}</span>
                  </button>
                  {digitalExpanded && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5 max-h-24 overflow-y-auto border border-slate-100 rounded p-1.5 bg-slate-50">
                      {digitalProducts.map(p => (
                        <label key={p} className={`flex items-center gap-1 text-[10px] border rounded px-1.5 py-0.5 cursor-pointer select-none transition-colors ${
                          tempProducts.includes(p) ? "bg-violet-50 border-violet-300 text-violet-700" : "border-slate-200 text-slate-600 bg-white hover:bg-slate-50"
                        }`}>
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={tempProducts.includes(p)}
                            onChange={() => handleProductToggle(p)}
                          />
                          {p}
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Projetos Especiais Accordion */}
                <div>
                  <button
                    type="button"
                    onClick={() => setSpecialExpanded(!specialExpanded)}
                    className="w-full flex items-center justify-between text-[11px] text-slate-500 font-semibold"
                  >
                    <span>Projetos Especiais ({tempProducts.filter(p => specialProjects.includes(p)).length})</span>
                    <span className="text-blue-600">{specialExpanded ? "Recolher ▲" : "Selecionar ▼"}</span>
                  </button>
                  {specialExpanded && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5 max-h-24 overflow-y-auto border border-slate-100 rounded p-1.5 bg-slate-50">
                      {specialProjects.map(p => (
                        <label key={p} className={`flex items-center gap-1 text-[10px] border rounded px-1.5 py-0.5 cursor-pointer select-none transition-colors ${
                          tempProducts.includes(p) ? "bg-amber-50 border-amber-300 text-amber-700" : "border-slate-200 text-slate-600 bg-white hover:bg-slate-50"
                        }`}>
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={tempProducts.includes(p)}
                            onChange={() => handleProductToggle(p)}
                          />
                          {p}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Valores por Produto
            </div>
            <div className="flex flex-col gap-2.5 max-h-48 overflow-y-auto pr-1">
              {tempProducts.length === 0 ? (
                <div className="text-xs text-slate-400 text-center py-4">Nenhum produto selecionado acima.</div>
              ) : (
                tempProducts.map((p) => {
                  return (
                    <div key={p} className="flex items-center justify-between gap-4">
                      <span className="text-xs font-medium text-slate-700 truncate flex-1">{p}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] text-slate-400 font-semibold">R$</span>
                        <input
                          type="text"
                          placeholder="0"
                          value={valuationForm[p] !== undefined ? formatThousandsBR(valuationForm[p]) : ""}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, "");
                            setValuationForm((prev) => {
                              const next = { ...prev };
                              if (raw === "") {
                                delete next[p];
                              } else {
                                next[p] = Number(raw);
                              }
                              return next;
                            });
                          }}
                          className="w-28 border border-slate-200 rounded px-2 py-1 text-xs text-right font-mono outline-none focus:ring-1 focus:ring-slate-400 bg-white"
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Soma total:</span>
              <span className="text-sm font-semibold font-mono text-slate-850">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                  Object.values(valuationForm).map(Number).reduce((s, v) => s + v, 0)
                )}
              </span>
            </div>
            
            <div className="flex gap-2 justify-end mt-2">
              <button
                type="button"
                onClick={() => setSelectedOpp(null)}
                className="text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-lg px-3 py-2 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const activeAllocations = tempProducts.map(prod => valuationForm[prod]).filter(v => v !== undefined && v !== null && v !== "");
                  const sumOfAllocations = activeAllocations.map(Number).reduce((s, v) => s + v, 0);
                  const finalValue = sumOfAllocations > 0 ? sumOfAllocations : selectedOpp.value;
                  
                  updateOpportunityProducts(selectedOpp.id, tempProducts, valuationForm, finalValue);
                  setSelectedOpp(null);
                }}
                className="text-xs font-semibold bg-slate-900 text-white hover:bg-slate-700 rounded-lg px-4 py-2 transition-colors"
              >
                Salvar Verbas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
