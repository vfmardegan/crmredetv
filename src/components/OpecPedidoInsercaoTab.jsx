import React, { useState } from "react";
import {
  FileSpreadsheet,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Calendar,
  Building2,
  Tv,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  ExternalLink,
  Layers,
  FileCheck,
  FileText
} from "lucide-react";

export default function OpecPedidoInsercaoTab({ currentUser }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedPi, setSelectedPi] = useState(null);

  // Dados preliminares estruturados para visualização inicial do fluxo de Pedidos de Inserção
  const mockPis = [
    {
      id: "PI-2026-00891",
      numeroPi: "PI 48291/26",
      agencia: "WPP / Ogilvy Brasil",
      anunciante: "Volkswagen do Brasil",
      marca: "Novo Tera",
      campanha: "Lançamento Nacional 2026",
      periodo: "01/11/2026 a 30/11/2026",
      praca: "Nacional (Rede)",
      programaAlvo: "SuperPop / RedeTV! News / Operação de Risco",
      totalInsercoes: 32,
      valorBruto: 450000.0,
      valorLiquido: 360000.0,
      status: "Em Validação",
      statusColor: "amber",
      dataEntrada: "20/10/2026",
      responsavelOpec: "Mesa de Operações",
      observacao: "Aguardando confirmação de encaixe no break comercial do Operação de Risco."
    },
    {
      id: "PI-2026-00892",
      numeroPi: "PI 10472/26",
      agencia: "Publicis Brasil",
      anunciante: "Heineken Brasil",
      marca: "Amstel",
      campanha: "Futebol & Entretenimento",
      periodo: "15/10/2026 a 15/11/2026",
      praca: "Grande SP + RJ",
      programaAlvo: "Bola na Rede / NFL",
      totalInsercoes: 24,
      valorBruto: 320000.0,
      valorLiquido: 256000.0,
      status: "Aprovado na Grade",
      statusColor: "emerald",
      dataEntrada: "18/10/2026",
      responsavelOpec: "Coordenação de Exibição",
      observacao: "Material em HD recebido via Adstream e aprovado pela engenharia técnica."
    },
    {
      id: "PI-2026-00893",
      numeroPi: "PI 99318/26",
      agencia: "Africa Creative",
      anunciante: "Itaú Unibanco",
      marca: "Itaú Empresas",
      campanha: "Crédito Empreendedor",
      periodo: "05/11/2026 a 20/12/2026",
      praca: "Nacional",
      programaAlvo: "Jornalismo Noturno",
      totalInsercoes: 40,
      valorBruto: 580000.0,
      valorLiquido: 464000.0,
      status: "Em Análise Comercial",
      statusColor: "blue",
      dataEntrada: "19/10/2026",
      responsavelOpec: "Atendimento OPEC",
      observacao: "Verificando concorrência de categoria com Bradesco no mesmo bloco."
    }
  ];

  const filteredPis = mockPis.filter((pi) => {
    const matchesSearch =
      pi.numeroPi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pi.agencia.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pi.anunciante.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pi.campanha.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      selectedStatus === "all" ||
      (selectedStatus === "validacao" && pi.status === "Em Validação") ||
      (selectedStatus === "aprovado" && pi.status === "Aprovado na Grade") ||
      (selectedStatus === "analise" && pi.status === "Em Análise Comercial");

    return matchesSearch && matchesStatus;
  });

  const formatBRL = (val) => {
    return (val || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header do Módulo OPEC */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-indigo-600/10 text-indigo-600 flex items-center justify-center font-bold">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
                  OPEC • Pedidos de Inserção (P.I.)
                </h1>
                <span className="text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                  Branch OPEC
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Central de autorizações, conferência de veiculação e conciliação com a grade da RedeTV!
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Upload size={16} className="text-slate-500" />
            Importar P.I. (XML / PDF)
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
          >
            <Plus size={16} />
            Novo Pedido de Inserção
          </button>
        </div>
      </div>

      {/* Banner Informativo da Branch de Desenvolvimento */}
      <div className="bg-gradient-to-r from-indigo-50 via-sky-50 to-white border border-indigo-100 rounded-xl p-4 flex items-start gap-3.5 shadow-sm">
        <div className="p-2 rounded-lg bg-indigo-600 text-white shrink-0 mt-0.5">
          <Layers size={18} />
        </div>
        <div className="text-xs sm:text-sm text-slate-700 leading-relaxed">
          <span className="font-semibold text-indigo-900 block mb-0.5">
            Ambiente de Integração OPEC Ativo
          </span>
          Esta é a nova frente estrutural do CRM. Aqui estamos desenhando e conectando os fluxos
          de pedidos de inserção, roteiros comerciais e conciliação de grade da emissora de forma 100% isolada
          da operação comercial de produção.
        </div>
      </div>

      {/* Cards de Métricas / Visão Geral da OPEC */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <FileText size={20} />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-slate-500 font-medium">P.Is em Carteira</div>
            <div className="text-lg sm:text-xl font-bold text-slate-800">3 P.Is</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Mês de referência: Nov/2026</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock size={20} />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-slate-500 font-medium">Em Validação de Grade</div>
            <div className="text-lg sm:text-xl font-bold text-amber-600">1 Pendente</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Aguardando disponibilidade de break</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Tv size={20} />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-slate-500 font-medium">Total de Inserções</div>
            <div className="text-lg sm:text-xl font-bold text-emerald-700">96 Spots</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Distribuídos na grade nacional e SP</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <FileCheck size={20} />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-slate-500 font-medium">Volume Líquido OPEC</div>
            <div className="text-lg sm:text-xl font-bold text-indigo-700">R$ 1.080.000</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Em autorizações comerciais</div>
          </div>
        </div>
      </div>

      {/* Controles de Busca e Filtro */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por Nº do P.I., Agência, Anunciante ou Campanha..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setSelectedStatus("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              selectedStatus === "all"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Todos (3)
          </button>
          <button
            type="button"
            onClick={() => setSelectedStatus("validacao")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              selectedStatus === "validacao"
                ? "bg-amber-600 text-white"
                : "bg-amber-50 text-amber-700 hover:bg-amber-100"
            }`}
          >
            Em Validação (1)
          </button>
          <button
            type="button"
            onClick={() => setSelectedStatus("aprovado")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              selectedStatus === "aprovado"
                ? "bg-emerald-600 text-white"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            Aprovados na Grade (1)
          </button>
          <button
            type="button"
            onClick={() => setSelectedStatus("analise")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              selectedStatus === "analise"
                ? "bg-blue-600 text-white"
                : "bg-blue-50 text-blue-700 hover:bg-blue-100"
            }`}
          >
            Em Análise Comercial (1)
          </button>
        </div>
      </div>

      {/* Tabela de Pedidos de Inserção */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Nº P.I.</th>
                <th className="py-3 px-4">Anunciante / Marca</th>
                <th className="py-3 px-4">Agência</th>
                <th className="py-3 px-4">Programa / Praça</th>
                <th className="py-3 px-4 text-center">Inserções</th>
                <th className="py-3 px-4 text-right">Valor Líquido</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredPis.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-sm">
                    Nenhum pedido de inserção encontrado com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredPis.map((pi) => (
                  <tr
                    key={pi.id}
                    onClick={() => setSelectedPi(pi)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-medium text-indigo-600 whitespace-nowrap">
                      {pi.numeroPi}
                      <span className="block text-[10px] text-slate-400 font-sans font-normal mt-0.5">
                        Entrada: {pi.dataEntrada}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-900 whitespace-nowrap">
                      {pi.anunciante}
                      <span className="block text-xs text-slate-500 font-normal mt-0.5">
                        {pi.marca} • {pi.campanha}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                      {pi.agencia}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="font-medium text-slate-800 truncate max-w-[200px]">
                        {pi.programaAlvo}
                      </div>
                      <span className="text-[11px] text-slate-400">{pi.praca}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className="font-semibold text-slate-800">{pi.totalInsercoes}</span>
                      <span className="text-[11px] text-slate-400 block">veiculações</span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap font-medium text-slate-900">
                      {formatBRL(pi.valorLiquido)}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        Bruto: {formatBRL(pi.valorBruto)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          pi.statusColor === "emerald"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : pi.statusColor === "amber"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            pi.statusColor === "emerald"
                              ? "bg-emerald-500"
                              : pi.statusColor === "amber"
                              ? "bg-amber-500"
                              : "bg-blue-500"
                          }`}
                        />
                        {pi.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPi(pi);
                        }}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors"
                        title="Ver detalhes do P.I."
                      >
                        <ChevronRight size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer / Modal Lateral de Detalhes do P.I. */}
      {selectedPi && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs"
          onClick={() => setSelectedPi(null)}
        >
          <div
            className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-[11px] font-semibold tracking-wider uppercase text-indigo-600">
                  Ficha Técnica do P.I.
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                  {selectedPi.numeroPi}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPi(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6 flex-1 text-xs sm:text-sm">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="text-slate-500 text-xs">Anunciante & Agência</div>
                <div className="font-bold text-base text-slate-900">{selectedPi.anunciante}</div>
                <div className="text-slate-700">Marca: <span className="font-medium">{selectedPi.marca}</span></div>
                <div className="text-slate-700">Agência: <span className="font-medium">{selectedPi.agencia}</span></div>
                <div className="text-slate-700">Campanha: <span className="font-medium">{selectedPi.campanha}</span></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-slate-500 text-xs">Valor Bruto</div>
                  <div className="text-base font-bold text-slate-800 mt-1">
                    {formatBRL(selectedPi.valorBruto)}
                  </div>
                </div>
                <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100">
                  <div className="text-indigo-700 text-xs font-medium">Valor Líquido OPEC</div>
                  <div className="text-base font-bold text-indigo-900 mt-1">
                    {formatBRL(selectedPi.valorLiquido)}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-slate-800 text-xs uppercase tracking-wider">
                  Programação & Exibição
                </h3>
                <div className="p-3.5 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Período:</span>
                    <span className="font-medium text-slate-800">{selectedPi.periodo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Praça:</span>
                    <span className="font-medium text-slate-800">{selectedPi.praca}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Programas Alvo:</span>
                    <span className="font-medium text-slate-800">{selectedPi.programaAlvo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total de Inserções:</span>
                    <span className="font-bold text-indigo-700">{selectedPi.totalInsercoes} inserções</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-slate-800 text-xs uppercase tracking-wider">
                  Parecer da Mesa de Operações
                </h3>
                <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl text-amber-900 text-xs leading-relaxed">
                  {selectedPi.observacao}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSelectedPi(null)}
                className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Fechar
              </button>
              <button
                type="button"
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
              >
                Validar Encaixe na Grade
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
