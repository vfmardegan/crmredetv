import React, { useState, useMemo } from "react";
import {
  FileText,
  FileSpreadsheet,
  ChevronDown,
  ChevronRight,
  Mail
} from "lucide-react";
import { TV_PRODUCTS, DIGITAL_PRODUCTS, SPECIAL_PROJECTS } from "../utils/helpers";

const CLUSTER_CONFIG = {
  "Tabela": {
    title: "Tabela de Preços",
    badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  "Televisão": {
    title: "Televisão",
    badgeBg: "bg-red-50 text-red-700 border-red-200",
  },
  "Digital": {
    title: "Digital",
    badgeBg: "bg-blue-50 text-blue-700 border-blue-200",
  },
  "Projetos Especiais": {
    title: "Projetos Especiais",
    badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
  },
};

const CLUSTERS_LIST = ["Tabela", "Televisão", "Digital", "Projetos Especiais"];

export default function ProposalsTab({ openSendProposal, proposalTemplates = [], allProducts }) {
  // Os contêineres iniciam sempre recolhidos ao acessar
  const [expandedClusters, setExpandedClusters] = useState({
    "Tabela": false,
    "Televisão": false,
    "Digital": false,
    "Projetos Especiais": false,
  });

  const clustersProducts = useMemo(() => {
    const tv = (allProducts?.televisao && allProducts.televisao.length > 0 ? allProducts.televisao : TV_PRODUCTS);
    const dig = (allProducts?.digital && allProducts.digital.length > 0 ? allProducts.digital : DIGITAL_PRODUCTS);
    const esp = (allProducts?.especiais && allProducts.especiais.length > 0 ? allProducts.especiais : SPECIAL_PROJECTS);
    return {
      "Televisão": tv,
      "Digital": dig,
      "Projetos Especiais": esp,
    };
  }, [allProducts]);

  function toggleCluster(clusterName) {
    setExpandedClusters((prev) => ({
      ...prev,
      [clusterName]: !prev[clusterName],
    }));
  }

  function resolveCluster(item) {
    if (item.cluster) {
      if (item.cluster === "Tabela" || item.cluster === "Tabela de Preços") return "Tabela";
      if (item.cluster === "Televisão") return "Televisão";
      if (item.cluster === "Digital") return "Digital";
      if (item.cluster === "Projetos Especiais") return "Projetos Especiais";
    }
    const titleLower = (item.title || "").toLowerCase();
    if (titleLower.includes("tabela") || titleLower.includes("preço") || titleLower.includes("lista de preço")) {
      return "Tabela";
    }
    if (item.product) {
      if (clustersProducts["Televisão"]?.includes(item.product)) return "Televisão";
      if (clustersProducts["Digital"]?.includes(item.product)) return "Digital";
      if (clustersProducts["Projetos Especiais"]?.includes(item.product)) return "Projetos Especiais";
    }
    return "Tabela";
  }

  const groupedProposals = useMemo(() => {
    const groups = {
      "Tabela": [],
      "Televisão": [],
      "Digital": [],
      "Projetos Especiais": [],
    };
    (proposalTemplates || []).forEach((item) => {
      const c = resolveCluster(item);
      if (!groups[c]) groups[c] = [];
      groups[c].push(item);
    });

    Object.keys(groups).forEach((key) => {
      groups[key].sort((a, b) => (a.title || "").localeCompare(b.title || "", "pt-BR"));
    });

    return groups;
  }, [proposalTemplates, clustersProducts]);

  return (
    <div className="flex flex-col gap-4">
      {proposalTemplates.length === 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-8 text-center text-sm text-slate-400">
          Nenhuma proposta ou tabela cadastrada no momento.
        </div>
      )}

      {/* Listagem das 4 Seções em formato Tabela/Colunas: Tabela, Televisão, Digital, Projetos Especiais */}
      <div className="flex flex-col gap-4">
        {CLUSTERS_LIST.map((clusterName) => {
          const config = CLUSTER_CONFIG[clusterName];
          const isExpanded = expandedClusters[clusterName];
          const items = groupedProposals[clusterName] || [];

          return (
            <div
              key={clusterName}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs transition-all"
            >
              {/* Barra da Seção (Sem ícones, cabeçalho recolhível) */}
              <div
                onClick={() => toggleCluster(clusterName)}
                className="flex items-center justify-between px-5 py-3.5 bg-slate-50/70 hover:bg-slate-100/70 cursor-pointer transition-colors select-none"
              >
                <div className="flex items-center gap-2.5">
                  <h3 className="text-sm font-bold text-slate-800">{config.title}</h3>
                  <span className="text-[11px] font-semibold bg-white text-slate-600 px-2 py-0.5 rounded-full border border-slate-200 shadow-xs">
                    {items.length} {items.length === 1 ? "item" : "itens"}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-slate-400 p-1">
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </div>
              </div>

              {/* Conteúdo Expandido em Formato de Tabela com Colunas */}
              {isExpanded && (
                <div className="border-t border-slate-200/80">
                  {items.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      Nenhum item disponível na seção <strong>{config.title}</strong>.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            <th className="py-2.5 px-5">Título</th>
                            <th className="py-2.5 px-3">Produto</th>
                            <th className="py-2.5 px-3">Período</th>
                            <th className="py-2.5 px-3">Observação</th>
                            <th className="py-2.5 px-3 text-center">Arquivos</th>
                            <th className="py-2.5 px-5 text-right">Ação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                          {items.map((t) => (
                            <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                              {/* Coluna 1: Título */}
                              <td className="py-3 px-5 font-semibold text-slate-900">
                                {t.title}
                              </td>

                              {/* Coluna 2: Produto */}
                              <td className="py-3 px-3 whitespace-nowrap">
                                {t.product ? (
                                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${config.badgeBg}`}>
                                    {t.product}
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-slate-400 font-medium">
                                    {clusterName === "Tabela" ? "Tabela Geral" : "Geral"}
                                  </span>
                                )}
                              </td>

                              {/* Coluna 3: Período */}
                              <td className="py-3 px-3 whitespace-nowrap text-slate-600 font-medium">
                                {t.periodo || "—"}
                              </td>

                              {/* Coluna 4: Observação */}
                              <td className="py-3 px-3 text-slate-500 max-w-xs truncate" title={t.observacao || t.subtitle || ""}>
                                {t.observacao || t.subtitle || "—"}
                              </td>

                              {/* Coluna 5: Arquivos (PDF e Excel) */}
                              <td className="py-3 px-3 whitespace-nowrap">
                                <div className="flex items-center justify-center gap-1.5">
                                  {t.pdfDataUri && (
                                    <a
                                      href={t.pdfDataUri}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded border border-rose-200 transition-colors"
                                      title="Visualizar PDF"
                                    >
                                      <FileText size={12} className="text-rose-600" />
                                      <span>PDF</span>
                                    </a>
                                  )}
                                  {t.xlsDataUri && (
                                    <a
                                      href={t.xlsDataUri}
                                      download={t.xlsFileName || "valores.xlsx"}
                                      className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded border border-emerald-200 transition-colors"
                                      title="Baixar Planilha Excel"
                                    >
                                      <FileSpreadsheet size={12} className="text-emerald-600" />
                                      <span>Excel</span>
                                    </a>
                                  )}
                                  {!t.pdfDataUri && !t.xlsDataUri && (
                                    <span className="text-[11px] text-slate-400">—</span>
                                  )}
                                </div>
                              </td>

                              {/* Coluna 6: Ação Enviar */}
                              <td className="py-3 px-5 text-right whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => openSendProposal && openSendProposal(t.id)}
                                  className="inline-flex items-center gap-1 text-xs bg-rose-600 text-white px-3 py-1.5 rounded-md hover:bg-rose-700 font-semibold transition-colors cursor-pointer shadow-xs"
                                >
                                  <Mail size={12} /> Enviar
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
