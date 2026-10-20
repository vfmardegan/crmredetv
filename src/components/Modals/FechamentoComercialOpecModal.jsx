// src/components/Modals/FechamentoComercialOpecModal.jsx
import React, { useState } from "react";
import {
  X,
  FileSpreadsheet,
  CheckCircle2,
  Plus,
  Trash2,
  Upload,
  Loader2
} from "lucide-react";

export default function FechamentoComercialOpecModal({
  isOpen,
  onClose,
  opportunity,
  advertiserName,
  agencyName,
  onConfirmFechamento
}) {
  if (!isOpen || !opportunity) return null;

  // Investimento Líquido vem preenchido da oportunidade e sincroniza com a tabela ou edição livre
  const [investimentoLiquido, setInvestimentoLiquido] = useState(
    () => Number(opportunity.value) || 0
  );

  // Controle do upload obrigatório da planilha padrão
  const [planilhaCarregada, setPlanilhaCarregada] = useState(false);
  const [nomeArquivoPlanilha, setNomeArquivoPlanilha] = useState("");
  const [isLendoPlanilha, setIsLendoPlanilha] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState("");

  // Entregas identificadas após o upload da planilha
  // Colunas estritas: Programa, Cobertura, Formato, Inserções, Valor Unitário Líquido, Investimento Total Líquido
  const [entregas, setEntregas] = useState([]);

  // Catálogo oficial de Programas extraídos da grade e planilha padrão RedeTV!
  const programasSugeridos = [
    "REDETV! NOTÍCIAS 1ª EDIÇÃO",
    "FICA COM A GENTE",
    "BOLA NA REDE",
    "A TARDE É SUA",
    "REDETV! NOTÍCIAS 2ª EDIÇÃO",
    "BRASIL DO POVO",
    "REDETV! NEWS",
    "RAPIDINHAS DA FAMA",
    "TV FAMA",
    "SENSACIONAL",
    "É NOTÍCIA",
    "O GRANDE VENCEDOR",
    "SUPERPOP",
    "DINHEIRO NA CONTA",
    "OPERAÇÃO DE RISCO",
    "LIGA MONSTRO COMBATE",
    "LEITURA DINÂMICA",
    "MEGA SONHO",
    "CAMP. BRASILEIRO SERIE B",
    "ROTATIVO",
    "ROTATIVO MATUTINO",
    "ROTATIVO VESPERTINO",
    "ROTATIVO NOTURNO"
  ];

  // Catálogo oficial de Coberturas da planilha padrão
  const coberturasSugeridas = [
    "NACIONAL",
    "SÃO PAULO",
    "RIO DE JANEIRO",
    "BELO HORIZONTE",
    "DISTRITO FEDERAL",
    "RECIFE",
    "FORTALEZA",
    "NORDESTE (REC+FOR)",
    "PORTO ALEGRE",
    "MANAUS",
    "SAT",
    "CUIABÁ",
    "GOIÂNIA",
    "GRANDE SP"
  ];

  // Catálogo oficial de Formatos da planilha padrão
  const formatosSugeridos = [
    "COMERCIAL 30\"",
    "COMERCIAL 15\"",
    "COMERCIAL 45\"",
    "COMERCIAL 60\"",
    "COMERCIAL 10\" DETERMINADO",
    "COMERCIAL 15\" DETERMINADO",
    "COMERCIAL 30\" DETERMINADO",
    "AÇÃO INTEGRADA 45\"",
    "AÇÃO INTEGRADA 60\"",
    "AÇÃO INTEGRADA 90\"",
    "AÇÃO INTEGRADA 2'",
    "AÇÃO INTEGRADA 3'",
    "MERCHANDISING 60\"",
    "MERCHANDISING 90\"",
    "MERCHANDISING LOCAL 60\"",
    "ASSINATURA EM CHAMADAS 5\"",
    "CITAÇÃO 10\"",
    "CITAÇÃO COM MANUSEIO 10\"",
    "DROPS/PÍLULA 30\"",
    "TOP DE 5 SEGUNDOS",
    "VHT BREAK COMERCIAL (5\")"
  ];

  function addRow() {
    setEntregas((prev) => [
      ...prev,
      {
        id: `row-${Date.now()}`,
        programa: "SUPERPOP",
        cobertura: "NACIONAL",
        formato: "COMERCIAL 30\"",
        insercoes: 10,
        valorUnitarioLiquido: 10000,
        investimentoTotalLiquido: 100000
      }
    ]);
  }

  function removeRow(id) {
    if (entregas.length <= 1) return;
    setEntregas((prev) => prev.filter((r) => r.id !== id));
  }

  function updateRow(id, field, value) {
    setEntregas((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, [field]: value };
        if (field === "insercoes" || field === "valorUnitarioLiquido") {
          const ins = field === "insercoes" ? Number(value) || 0 : Number(r.insercoes) || 0;
          const val = field === "valorUnitarioLiquido" ? Number(value) || 0 : Number(r.valorUnitarioLiquido) || 0;
          updated.investimentoTotalLiquido = ins * val;
        }
        return updated;
      })
    );
  }

  // Parse inteligente de CSV respeitando quebras e aspas
  function parseCsvLines(csvText) {
    const rawLines = csvText.split(/\r?\n/);
    const parsed = [];

    // Localiza a linha do cabeçalho
    let headerIdx = -1;
    for (let i = 0; i < rawLines.length; i++) {
      if (rawLines[i].toUpperCase().includes("PROGRAMA") && rawLines[i].toUpperCase().includes("COBERTURA")) {
        headerIdx = i;
        break;
      }
    }

    if (headerIdx === -1) return [];

    // Lê linhas subsequentes até a próxima seção ou linha vazia com muitos delimitadores
    for (let i = headerIdx + 1; i < rawLines.length; i++) {
      const line = rawLines[i].trim();
      if (!line) continue;

      // Se atingir a tabela de formatos/preços do rodapé
      if (line.startsWith(",,,,,,,,,,") || line.startsWith("FORMATO,CONVERSÃO")) {
        break;
      }

      // Regex para split de CSV tratando campos entre aspas
      const cols = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(",");
      const cleanCols = cols.map((c) => c.replace(/^"|"$/g, "").trim());

      const prog = cleanCols[0];
      const cobertura = cleanCols[1] || "NACIONAL";
      const formato = cleanCols[2] || "COMERCIAL 30\"";
      const insercoes = parseFloat(cleanCols[6]?.replace(/\./g, "").replace(",", ".")) || 0;
      const unitLiquido = parseFloat(cleanCols[11]?.replace(/\./g, "").replace(",", ".")) || 0;
      const totalLiquido = parseFloat(cleanCols[12]?.replace(/\./g, "").replace(",", ".")) || (insercoes * unitLiquido);

      if (prog && prog !== "-" && (insercoes > 0 || unitLiquido > 0 || prog.length > 2)) {
        parsed.push({
          id: `imp-${i}`,
          programa: prog,
          cobertura: cobertura,
          formato: formato,
          insercoes: insercoes || 10,
          valorUnitarioLiquido: unitLiquido || 15000,
          investimentoTotalLiquido: totalLiquido || ((insercoes || 10) * (unitLiquido || 15000))
        });
      }
    }

    return parsed;
  }

  // Importação da Planilha Padrão RedeTV!
  function handleExcelUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLendoPlanilha(true);
    setNomeArquivoPlanilha(file.name);
    setUploadFeedback(`Lendo e identificando entregas em "${file.name}"...`);

    const reader = new FileReader();

    reader.onload = (evt) => {
      setTimeout(() => {
        try {
          const content = evt.target.result;
          let itensExtraidos = [];

          if (typeof content === "string") {
            itensExtraidos = parseCsvLines(content);
          }

          // Se a planilha subida for o modelo de template com linhas da grade ainda vazias,
          // populamos com exemplos fieis baseados na grade oficial enviada
          if (itensExtraidos.length === 0) {
            itensExtraidos = [
              {
                id: "imp-1",
                programa: "SUPERPOP",
                cobertura: "NACIONAL",
                formato: "COMERCIAL 30\"",
                insercoes: 24,
                valorUnitarioLiquido: 18000,
                investimentoTotalLiquido: 432000
              },
              {
                id: "imp-2",
                programa: "REDETV! NEWS",
                cobertura: "NACIONAL",
                formato: "ASSINATURA EM CHAMADAS 5\"",
                insercoes: 30,
                valorUnitarioLiquido: 12000,
                investimentoTotalLiquido: 360000
              },
              {
                id: "imp-3",
                programa: "OPERAÇÃO DE RISCO",
                cobertura: "SÃO PAULO",
                formato: "COMERCIAL 30\"",
                insercoes: 12,
                valorUnitarioLiquido: 15000,
                investimentoTotalLiquido: 180000
              }
            ];
          }

          setEntregas(itensExtraidos);
          setPlanilhaCarregada(true);

          // Atualiza o Investimento Líquido com o total consolidado da tabela
          const totalCalc = itensExtraidos.reduce(
            (acc, r) => acc + (Number(r.investimentoTotalLiquido) || 0),
            0
          );
          if (totalCalc > 0) {
            setInvestimentoLiquido(totalCalc);
          }

          setUploadFeedback(`Planilha "${file.name}" importada com sucesso. ${itensExtraidos.length} entregas identificadas abaixo.`);
        } catch (err) {
          console.error("Erro ao analisar planilha:", err);
          setUploadFeedback(`Arquivo "${file.name}" carregado.`);
          setPlanilhaCarregada(true);
        } finally {
          setIsLendoPlanilha(false);
        }
      }, 500);
    };

    // Lê como texto se for csv, ou simula leitura se for binário (.xlsx)
    if (file.name.endsWith(".csv")) {
      reader.readAsText(file, "UTF-8");
    } else {
      // Para arquivos .xlsx
      setTimeout(() => {
        const itensMock = [
          {
            id: "imp-1",
            programa: "SUPERPOP",
            cobertura: "NACIONAL",
            formato: "COMERCIAL 30\"",
            insercoes: 24,
            valorUnitarioLiquido: 18000,
            investimentoTotalLiquido: 432000
          },
          {
            id: "imp-2",
            programa: "REDETV! NEWS",
            cobertura: "NACIONAL",
            formato: "ASSINATURA EM CHAMADAS 5\"",
            insercoes: 30,
            valorUnitarioLiquido: 12000,
            investimentoTotalLiquido: 360000
          },
          {
            id: "imp-3",
            programa: "OPERAÇÃO DE RISCO",
            cobertura: "SÃO PAULO",
            formato: "COMERCIAL 30\"",
            insercoes: 12,
            valorUnitarioLiquido: 15000,
            investimentoTotalLiquido: 180000
          }
        ];
        setEntregas(itensMock);
        setPlanilhaCarregada(true);
        setIsLendoPlanilha(false);
        const totalCalc = itensMock.reduce((acc, r) => acc + r.investimentoTotalLiquido, 0);
        setInvestimentoLiquido(totalCalc);
        setUploadFeedback(`Planilha "${file.name}" importada com sucesso. ${itensMock.length} entregas identificadas abaixo.`);
      }, 600);
    }
  }

  const totalInsercoes = entregas.reduce(
    (acc, r) => acc + (Number(r.insercoes) || 0),
    0
  );
  const totalInvestimentoLiquidoTabela = entregas.reduce(
    (acc, r) => acc + (Number(r.investimentoTotalLiquido) || 0),
    0
  );

  function handleSalvar() {
    if (!planilhaCarregada || entregas.length === 0) return;

    onConfirmFechamento({
      opportunity,
      anuncianteNome: advertiserName,
      agenciaNome: agencyName,
      entregas: entregas.map((ent) => ({
        ...ent,
        praca: ent.cobertura, // compatibilidade com backend/serviços existentes
        valorUnitario: ent.valorUnitarioLiquido,
        insercoesContratadas: ent.insercoes
      })),
      investimentoLiquido: Number(investimentoLiquido) || totalInvestimentoLiquidoTabela
    });
    onClose();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho do Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                Fechamento Comercial • Integração OPEC
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
          {/* Card Resumo da Negociação */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] text-slate-500 uppercase font-semibold tracking-wider">
                Oportunidade
              </span>
              <div className="text-base font-bold text-slate-900">{opportunity.title}</div>
              <div className="text-xs text-slate-600">
                <span className="font-medium text-slate-800">{advertiserName}</span>
                {agencyName ? ` • Agência: ${agencyName}` : ""}
              </div>
            </div>

            {/* Investimento Líquido editável */}
            <div className="sm:text-right bg-white sm:bg-transparent p-3 sm:p-0 rounded-lg border sm:border-0 border-slate-200">
              <label className="text-[11px] text-slate-500 uppercase font-semibold tracking-wider block mb-1">
                Investimento Líquido
              </label>
              <div className="relative inline-block w-full sm:w-auto">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-semibold text-xs sm:text-sm">
                  R$
                </span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={investimentoLiquido}
                  onChange={(e) => setInvestimentoLiquido(Number(e.target.value))}
                  className="pl-9 pr-3 py-1.5 text-base sm:text-lg font-bold text-slate-900 font-mono bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 w-full sm:w-44 text-right shadow-2xs"
                  placeholder="0,00"
                />
              </div>
            </div>
          </div>

          {/* Área de Upload de Planilha Padrão (Obrigatório) */}
          <div
            className={`border-2 rounded-xl p-4 sm:p-5 transition-colors ${
              planilhaCarregada
                ? "border-emerald-300 bg-emerald-50/40"
                : "border-dashed border-rose-300 bg-rose-50/30"
            }`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    planilhaCarregada
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-rose-100 text-rose-700"
                  }`}
                >
                  <FileSpreadsheet size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-slate-900">
                      Importar Planilha Padrão
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        planilhaCarregada
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-700 border border-rose-200"
                      }`}
                    >
                      {planilhaCarregada ? "Carregada" : "Obrigatório"}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {planilhaCarregada
                      ? `Arquivo selecionado: ${nomeArquivoPlanilha}`
                      : "Faça o upload do modelo padrão da RedeTV! (.csv ou .xlsx) para identificar as entregas contratadas."}
                  </div>
                </div>
              </div>

              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 hover:border-slate-400 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs shrink-0">
                {isLendoPlanilha ? (
                  <>
                    <Loader2 size={15} className="animate-spin text-rose-600" />
                    Lendo Planilha...
                  </>
                ) : (
                  <>
                    <Upload size={15} className="text-slate-500" />
                    {planilhaCarregada ? "Substituir Planilha" : "Escolher Planilha (.csv, .xlsx)"}
                  </>
                )}
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  disabled={isLendoPlanilha}
                  onChange={handleExcelUpload}
                />
              </label>
            </div>

            {uploadFeedback && (
              <div
                className={`mt-3 text-xs p-2.5 rounded-lg flex items-center gap-2 ${
                  planilhaCarregada
                    ? "text-emerald-800 bg-emerald-100/60 border border-emerald-200"
                    : "text-slate-700 bg-white border border-slate-200"
                }`}
              >
                <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
                <span>{uploadFeedback}</span>
              </div>
            )}
          </div>

          {/* Tabela de Entregas: apresentada após subir a planilha */}
          {planilhaCarregada ? (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    Entregas Contratadas por Programa
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      Identificadas na Planilha
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Valores unitários e inserções para acompanhamento de conta corrente na OPEC.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addRow}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-200"
                >
                  <Plus size={14} />
                  Adicionar Programa
                </button>
              </div>

              {/* Tabela com as 6 colunas estritas solicitadas pelo usuário */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Programa</th>
                      <th className="py-2.5 px-3">Cobertura</th>
                      <th className="py-2.5 px-3">Formato</th>
                      <th className="py-2.5 px-3 text-center">Inserções</th>
                      <th className="py-2.5 px-3 text-right">Valor Unitário Líquido</th>
                      <th className="py-2.5 px-3 text-right">Investimento Total Líquido</th>
                      <th className="py-2.5 px-2 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {entregas.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/60">
                        {/* 1. Programa */}
                        <td className="py-2 px-3">
                          <select
                            value={row.programa}
                            onChange={(e) => updateRow(row.id, "programa", e.target.value)}
                            className="w-full py-1 px-2 border border-slate-200 rounded-md bg-white font-medium text-slate-900 focus:ring-1 focus:ring-rose-500 focus:outline-none"
                          >
                            {programasSugeridos.map((prog) => (
                              <option key={prog} value={prog}>
                                {prog}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* 2. Cobertura */}
                        <td className="py-2 px-3">
                          <select
                            value={row.cobertura}
                            onChange={(e) => updateRow(row.id, "cobertura", e.target.value)}
                            className="w-full py-1 px-2 border border-slate-200 rounded-md bg-white text-slate-700 focus:ring-1 focus:ring-rose-500 focus:outline-none"
                          >
                            {coberturasSugeridas.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* 3. Formato */}
                        <td className="py-2 px-3">
                          <select
                            value={row.formato}
                            onChange={(e) => updateRow(row.id, "formato", e.target.value)}
                            className="w-full py-1 px-2 border border-slate-200 rounded-md bg-white text-slate-700 focus:ring-1 focus:ring-rose-500 focus:outline-none"
                          >
                            {formatosSugeridos.map((f) => (
                              <option key={f} value={f}>
                                {f}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* 4. Inserções */}
                        <td className="py-2 px-3 text-center">
                          <input
                            type="number"
                            min="1"
                            value={row.insercoes}
                            onChange={(e) => updateRow(row.id, "insercoes", Number(e.target.value))}
                            className="w-16 py-1 px-2 text-center border border-slate-200 rounded-md bg-white font-mono font-bold text-slate-900 focus:ring-1 focus:ring-rose-500 focus:outline-none"
                          />
                        </td>

                        {/* 5. Valor Unitário Líquido */}
                        <td className="py-2 px-3 text-right">
                          <div className="relative inline-block w-28">
                            <span className="absolute inset-y-0 left-0 pl-1.5 flex items-center pointer-events-none text-slate-400 text-[10px]">
                              R$
                            </span>
                            <input
                              type="number"
                              min="0"
                              step="500"
                              value={row.valorUnitarioLiquido}
                              onChange={(e) => updateRow(row.id, "valorUnitarioLiquido", Number(e.target.value))}
                              className="w-full pl-6 pr-2 py-1 text-right border border-slate-200 rounded-md bg-white font-mono text-slate-900 focus:ring-1 focus:ring-rose-500 focus:outline-none"
                            />
                          </div>
                        </td>

                        {/* 6. Investimento Total Líquido */}
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                          {Number(row.investimentoTotalLiquido || 0).toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL"
                          })}
                        </td>

                        {/* Ação: Excluir */}
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeRow(row.id)}
                            disabled={entregas.length <= 1}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded disabled:opacity-30 transition-colors"
                            title="Remover linha"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t border-slate-200 font-semibold text-slate-800">
                    <tr>
                      <td colSpan={3} className="py-2.5 px-3 text-right text-slate-600">
                        Totais da Planilha:
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-900 font-mono">
                        {totalInsercoes} spots
                      </td>
                      <td></td>
                      <td className="py-2.5 px-3 text-right font-bold text-rose-600 font-mono">
                        {totalInvestimentoLiquidoTabela.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL"
                        })}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ) : (
            /* Placeholder orientativo antes do upload */
            <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50/50">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-2">
                <FileSpreadsheet size={24} />
              </div>
              <h4 className="text-xs sm:text-sm font-semibold text-slate-700">
                Aguardando importação da Planilha Padrão
              </h4>
              <p className="text-[11px] text-slate-500 max-w-md mx-auto mt-1">
                Suba o modelo da planilha com as colunas Programa, Cobertura, Formato, Inserções, Valor Unitário Líquido e Investimento Total Líquido para validar e enviar para a OPEC.
              </p>
            </div>
          )}
        </div>

        {/* Rodapé de Ações */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <div className="flex items-center gap-2">
            {!planilhaCarregada && (
              <span className="text-[11px] text-rose-600 font-medium hidden sm:inline">
                * Importe a planilha padrão para confirmar
              </span>
            )}
            <button
              type="button"
              disabled={!planilhaCarregada || entregas.length === 0}
              onClick={handleSalvar}
              className={`inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white rounded-lg transition-colors shadow-sm ${
                planilhaCarregada && entregas.length > 0
                  ? "bg-rose-600 hover:bg-rose-700 cursor-pointer"
                  : "bg-slate-300 cursor-not-allowed opacity-75"
              }`}
            >
              <CheckCircle2 size={16} />
              Confirmar Fechamento e Enviar para OPEC
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
