// src/components/Modals/FechamentoComercialOpecModal.jsx
import React, { useState } from "react";
import * as XLSX from "xlsx";
import {
  X,
  FileSpreadsheet,
  CheckCircle2,
  Plus,
  Trash2,
  Upload,
  Download,
  Loader2
} from "lucide-react";

// Utilitários de formatação e máscara para Moeda Brasileira (R$ 1.000.000,00)
function formatBRL(value) {
  const num = Number(value) || 0;
  return num.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function parseBRLDigits(str) {
  const cleanDigits = String(str || "").replace(/\D/g, "");
  if (!cleanDigits) return 0;
  return Number(cleanDigits) / 100;
}

export default function FechamentoComercialOpecModal({
  isOpen,
  onClose,
  opportunity,
  advertiserName,
  agencyName,
  onConfirmFechamento
}) {
  if (!isOpen || !opportunity) return null;

  // Valor numérico e string mascarada de Investimento Líquido no padrão R$ 1.000.000,00
  const initialValue = Number(opportunity.value) || 0;
  const [investimentoLiquido, setInvestimentoLiquido] = useState(initialValue);
  const [investimentoLiquidoStr, setInvestimentoLiquidoStr] = useState(formatBRL(initialValue));

  // Controle de upload da planilha padrão
  const [planilhaCarregada, setPlanilhaCarregada] = useState(false);
  const [nomeArquivoPlanilha, setNomeArquivoPlanilha] = useState("");
  const [isLendoPlanilha, setIsLendoPlanilha] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState("");

  // Entregas identificadas após o upload da planilha
  // Colunas estritas: Programa, Cobertura, Formato, Inserções, Valor Unitário Líquido, Investimento Total Líquido
  const [entregas, setEntregas] = useState([]);

  // Catálogo oficial de Programas extraídos da grade e planilha padrão RedeTV!
  const programasSugeridos = [
    "SUPERPOP",
    "REDETV! NEWS",
    "OPERAÇÃO DE RISCO",
    "A TARDE É SUA",
    "REDETV! NOTÍCIAS 1ª EDIÇÃO",
    "REDETV! NOTÍCIAS 2ª EDIÇÃO",
    "FICA COM A GENTE",
    "BOLA NA REDE",
    "BRASIL DO POVO",
    "RAPIDINHAS DA FAMA",
    "TV FAMA",
    "SENSACIONAL",
    "É NOTÍCIA",
    "O GRANDE VENCEDOR",
    "DINHEIRO NA CONTA",
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
    "VHT INTEGRADA DE ABERTURA 5\"",
    "VHT INTEGRADA DE ENCERRAMENTO 5\"",
    "VHT BREAK COMERCIAL (5\")",
    "INTERVENÇÃO NA TELA 15\""
  ];

  // Máscara interativa do Investimento Líquido ao digitar no modelo R$ 1.000.000,00
  function handleInvestimentoInputChange(e) {
    const raw = e.target.value;
    const num = parseBRLDigits(raw);
    setInvestimentoLiquido(num);
    setInvestimentoLiquidoStr(formatBRL(num));
  }

  // Gera e baixa o arquivo com o modelo padrão simplificado exato
  function handleDownloadModeloPadrao() {
    const header = [
      "PROGRAMA",
      "COBERTURA",
      "FORMATO",
      "INSERÇÕES",
      "VALOR UNITÁRIO LÍQUIDO",
      "INVESTIMENTO TOTAL LÍQUIDO"
    ];
    const sampleRows = [
      ["SUPERPOP", "NACIONAL", "VHT INTEGRADA DE ABERTURA 5\"", 52, 1116.64, 58065.02],
      ["SUPERPOP", "NACIONAL", "COMERCIAL 30\"", 52, 4466.54, 232260.08],
      ["SUPERPOP", "NACIONAL", "MERCHANDISING 60\"", 52, 8933.08, 464520.16],
      ["SUPERPOP", "NACIONAL", "INTERVENÇÃO NA TELA 15\"", 104, 3349.91, 348390.12],
      ["SUPERPOP", "NACIONAL", "VHT INTEGRADA DE ENCERRAMENTO 5\"", 52, 1116.64, 58065.02]
    ];
    const ws = XLSX.utils.aoa_to_sheet([header, ...sampleRows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Modelo Padrão");
    XLSX.writeFile(wb, "Modelo_Padrao_Fechamento_RedeTV.xlsx");
  }

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

  // Leitura exclusiva e estrita do Modelo Padrão Oficial de 6 Colunas:
  // PROGRAMA, COBERTURA, FORMATO, INSERÇÕES, VALOR UNITÁRIO LÍQUIDO, INVESTIMENTO TOTAL LÍQUIDO
  function handleExcelUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLendoPlanilha(true);
    setNomeArquivoPlanilha(file.name);
    setUploadFeedback(`Lendo e processando planilha "${file.name}"...`);

    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const buffer = evt.target.result;
        const workbook = XLSX.read(buffer, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

        const parsedEntregas = [];

        // Localiza a linha do cabeçalho estrito de 6 colunas
        let headerRowIdx = -1;
        let colMap = {
          programa: 0,
          cobertura: 1,
          formato: 2,
          insercoes: 3,
          unitarioLiquido: 4,
          totalLiquido: 5
        };

        for (let i = 0; i < sheetData.length; i++) {
          const row = sheetData[i];
          if (!Array.isArray(row)) continue;
          const rowText = row.map((cell) => String(cell || "").toUpperCase().trim()).join(" | ");

          if (rowText.includes("PROGRAMA") && (rowText.includes("COBERTURA") || rowText.includes("FORMATO"))) {
            headerRowIdx = i;

            row.forEach((cell, colIdx) => {
              const h = String(cell || "").toUpperCase().replace(/\r?\n/g, " ").trim();
              if (h === "PROGRAMA") colMap.programa = colIdx;
              else if (h === "COBERTURA") colMap.cobertura = colIdx;
              else if (h === "FORMATO") colMap.formato = colIdx;
              else if (h.includes("INSERÇ")) colMap.insercoes = colIdx;
              else if (h.includes("UNITÁRIO") && (h.includes("LÍQUIDO") || h.includes("LIQUIDO"))) {
                colMap.unitarioLiquido = colIdx;
              } else if (h.includes("TOTAL") && (h.includes("LÍQUIDO") || h.includes("LIQUIDO"))) {
                colMap.totalLiquido = colIdx;
              }
            });
            break;
          }
        }

        if (headerRowIdx !== -1) {
          for (let i = headerRowIdx + 1; i < sheetData.length; i++) {
            const row = sheetData[i];
            if (!Array.isArray(row) || row.length === 0) continue;

            const progRaw = String(row[colMap.programa] || "").trim();
            const firstCellUpper = progRaw.toUpperCase();

            // Pula linhas vazias, cabeçalhos repetidos ou linhas de totais
            if (
              !progRaw ||
              firstCellUpper === "PROGRAMA" ||
              firstCellUpper === "TOTAL" ||
              firstCellUpper.startsWith("TOTAIS")
            ) {
              continue;
            }

            const coberturaRaw = String(row[colMap.cobertura] || "NACIONAL").trim();
            const formatoRaw = String(row[colMap.formato] || "COMERCIAL 30\"").trim();

            // Inserções (coluna 3)
            const insVal = row[colMap.insercoes];
            const insercoes =
              typeof insVal === "number"
                ? insVal
                : parseFloat(String(insVal || "").replace(/\./g, "").replace(",", ".")) || 0;

            // Valor Unitário Líquido (coluna 4)
            const unitVal = row[colMap.unitarioLiquido];
            let unitarioLiquido =
              typeof unitVal === "number"
                ? unitVal
                : parseFloat(String(unitVal || "").replace(/\./g, "").replace(",", ".")) || 0;

            // Investimento Total Líquido (coluna 5)
            const totVal = row[colMap.totalLiquido];
            let totalLiquido =
              typeof totVal === "number"
                ? totVal
                : parseFloat(String(totVal || "").replace(/\./g, "").replace(",", ".")) || 0;

            if (totalLiquido === 0 && insercoes > 0 && unitarioLiquido > 0) {
              totalLiquido = insercoes * unitarioLiquido;
            } else if (unitarioLiquido === 0 && insercoes > 0 && totalLiquido > 0) {
              unitarioLiquido = totalLiquido / insercoes;
            }

            if (progRaw.length >= 2) {
              parsedEntregas.push({
                id: `imp-${i}-${Date.now()}`,
                programa: progRaw.toUpperCase(),
                cobertura: coberturaRaw.toUpperCase(),
                formato: formatoRaw,
                insercoes: Math.round(insercoes),
                valorUnitarioLiquido: Math.round(unitarioLiquido * 100) / 100,
                investimentoTotalLiquido: Math.round(totalLiquido * 100) / 100
              });
            }
          }
        }

        if (parsedEntregas.length > 0) {
          setEntregas(parsedEntregas);
          setPlanilhaCarregada(true);

          const totalConsolidado = parsedEntregas.reduce(
            (acc, r) => acc + (Number(r.investimentoTotalLiquido) || 0),
            0
          );
          setInvestimentoLiquido(totalConsolidado);
          setInvestimentoLiquidoStr(formatBRL(totalConsolidado));
          setUploadFeedback(
            `✅ Planilha "${file.name}" importada com sucesso! ${parsedEntregas.length} entregas identificadas no Modelo Padrão.`
          );
        } else {
          setUploadFeedback(
            `Nenhuma linha identificada em "${file.name}". O arquivo deve conter o cabeçalho: PROGRAMA, COBERTURA, FORMATO, INSERÇÕES, VALOR UNITÁRIO LÍQUIDO, INVESTIMENTO TOTAL LÍQUIDO.`
          );
        }
      } catch (err) {
        console.error("Erro ao analisar planilha:", err);
        setUploadFeedback(`Erro ao processar "${file.name}". Utilize o Modelo Padrão oficial de 6 colunas.`);
      } finally {
        setIsLendoPlanilha(false);
      }
    };

    reader.onerror = (err) => {
      console.error("Erro no FileReader:", err);
      setIsLendoPlanilha(false);
      setUploadFeedback(`Erro ao ler o arquivo "${file.name}". Tente novamente.`);
    };

    reader.readAsArrayBuffer(file);
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
        praca: ent.cobertura,
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

            {/* Investimento Líquido com máscara monetária R$ 1.000.000,00 */}
            <div className="sm:text-right bg-white sm:bg-transparent p-3 sm:p-0 rounded-lg border sm:border-0 border-slate-200">
              <label className="text-[11px] text-slate-500 uppercase font-semibold tracking-wider block mb-1">
                Investimento Líquido
              </label>
              <div className="relative inline-block w-full sm:w-auto">
                <input
                  type="text"
                  value={investimentoLiquidoStr}
                  onChange={handleInvestimentoInputChange}
                  className="px-3 py-1.5 text-base sm:text-lg font-bold text-slate-900 font-mono bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 w-full sm:w-52 text-right shadow-2xs tracking-tight"
                  placeholder="R$ 0,00"
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
                      : "Faça o upload da planilha (.xlsx, .csv) com as 6 colunas padrão para carregar as entregas contratadas."}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleDownloadModeloPadrao}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:border-slate-400 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                  title="Baixar planilha padrão (.xlsx) com as 6 colunas oficiais da RedeTV!"
                >
                  <Download size={14} className="text-slate-500" />
                  Baixar Modelo (.xlsx)
                </button>

                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 rounded-lg text-xs font-semibold text-white transition-colors shadow-2xs">
                  {isLendoPlanilha ? (
                    <>
                      <Loader2 size={15} className="animate-spin text-white" />
                      Lendo...
                    </>
                  ) : (
                    <>
                      <Upload size={15} className="text-white" />
                      {planilhaCarregada ? "Substituir Planilha" : "Escolher Planilha"}
                    </>
                  )}
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    disabled={isLendoPlanilha}
                    onClick={(e) => {
                      e.target.value = null;
                    }}
                    onChange={handleExcelUpload}
                  />
                </label>
              </div>
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
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Extraídas da Planilha ({entregas.length})
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
                          <input
                            type="text"
                            value={row.programa}
                            onChange={(e) => updateRow(row.id, "programa", e.target.value.toUpperCase())}
                            className="w-full py-1 px-2 border border-slate-200 rounded-md bg-white font-medium text-slate-900 focus:ring-1 focus:ring-rose-500 focus:outline-none"
                            list="programas-list"
                          />
                          <datalist id="programas-list">
                            {programasSugeridos.map((prog) => (
                              <option key={prog} value={prog} />
                            ))}
                          </datalist>
                        </td>

                        {/* 2. Cobertura */}
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={row.cobertura}
                            onChange={(e) => updateRow(row.id, "cobertura", e.target.value.toUpperCase())}
                            className="w-full py-1 px-2 border border-slate-200 rounded-md bg-white text-slate-700 focus:ring-1 focus:ring-rose-500 focus:outline-none"
                            list="coberturas-list"
                          />
                          <datalist id="coberturas-list">
                            {coberturasSugeridas.map((c) => (
                              <option key={c} value={c} />
                            ))}
                          </datalist>
                        </td>

                        {/* 3. Formato */}
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={row.formato}
                            onChange={(e) => updateRow(row.id, "formato", e.target.value)}
                            className="w-full py-1 px-2 border border-slate-200 rounded-md bg-white text-slate-700 focus:ring-1 focus:ring-rose-500 focus:outline-none"
                            list="formatos-list"
                          />
                          <datalist id="formatos-list">
                            {formatosSugeridos.map((f) => (
                              <option key={f} value={f} />
                            ))}
                          </datalist>
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
                          <div className="relative inline-block w-32">
                            <span className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-slate-400 text-[10px]">
                              R$
                            </span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={row.valorUnitarioLiquido}
                              onChange={(e) =>
                                updateRow(row.id, "valorUnitarioLiquido", Number(e.target.value))
                              }
                              className="w-full pl-6 pr-2 py-1 text-right border border-slate-200 rounded-md bg-white font-mono text-slate-900 focus:ring-1 focus:ring-rose-500 focus:outline-none"
                            />
                          </div>
                        </td>

                        {/* 6. Investimento Total Líquido */}
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                          {formatBRL(row.investimentoTotalLiquido)}
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
                        {formatBRL(totalInvestimentoLiquidoTabela)}
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
                Suba a planilha comercial com as 6 colunas (Programa, Cobertura, Formato, Inserções, Valor Unitário Líquido e Investimento Total Líquido) para liberar a validação e o envio para a OPEC.
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
