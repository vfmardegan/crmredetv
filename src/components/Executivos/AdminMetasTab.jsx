import React, { useEffect, useState, useRef } from "react";
import { Target, Calendar, Save, Check, AlertCircle, Layers, Star, Search, Download, Upload } from "lucide-react";
import { apiGet, apiPut, apiPost } from "../../services/api";
import { YEARS, SEGMENTOS } from "../../utils/helpers";

const MESES = [
  { key: "Jan", label: "Janeiro" },
  { key: "Fev", label: "Fevereiro" },
  { key: "Mar", label: "Março" },
  { key: "Abr", label: "Abril" },
  { key: "Mai", label: "Maio" },
  { key: "Jun", label: "Junho" },
  { key: "Jul", label: "Julho" },
  { key: "Ago", label: "Agosto" },
  { key: "Set", label: "Setembro" },
  { key: "Out", label: "Outubro" },
  { key: "Nov", label: "Novembro" },
  { key: "Dez", label: "Dezembro" },
];

export default function AdminMetasTab({ onRefreshData }) {
  const [selectedYear, setSelectedYear] = useState("2026");
  const [metaType, setMetaType] = useState("segment"); // 'segment' | 'key_account'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  const [segmentos, setSegmentos] = useState([]);
  const [keyAccounts, setKeyAccounts] = useState([]);
  const [metasRaw, setMetasRaw] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTargetId, setSelectedTargetId] = useState("");
  const [monthlyInputs, setMonthlyInputs] = useState(() => {
    const init = {};
    MESES.forEach((m) => (init[m.key] = "0"));
    return init;
  });

  const fileInputRef = useRef(null);

  useEffect(() => {
    loadMetas();
  }, [selectedYear]);

  function loadMetas() {
    setLoading(true);
    setError("");
    apiGet(`/admin/metas?year=${selectedYear}`)
      .then((data) => {
        const segs = Array.from(new Set([...SEGMENTOS, ...(data.segmentos || [])])).sort((a, b) => a.localeCompare(b, "pt-BR"));
        const kas = data.keyAccounts || [];
        setSegmentos(segs);
        setKeyAccounts(kas);
        setMetasRaw(data.metas || []);

        // Auto-selecionar o primeiro elemento se não houver seleção válida
        if (metaType === "segment" && segs.length > 0) {
          setSelectedTargetId((prev) => (segs.includes(prev) ? prev : segs[0]));
        } else if (metaType === "key_account" && kas.length > 0) {
          setSelectedTargetId((prev) => (kas.some((k) => String(k.id) === String(prev)) ? prev : String(kas[0].id)));
        }
      })
      .catch((err) => {
        console.error("Erro ao carregar metas:", err);
        setError("Não foi possível carregar as metas do sistema.");
      })
      .finally(() => setLoading(false));
  }

  // Atualiza os valores mensais quando muda o alvo selecionado
  useEffect(() => {
    if (!selectedTargetId) return;

    const newInputs = {};
    MESES.forEach((m) => {
      const periodoStr = `${selectedYear}-${m.key}`;
      let row = null;
      if (metaType === "segment") {
        row = metasRaw.find((r) => r.segmento === selectedTargetId && !r.client_id && r.periodo === periodoStr);
      } else {
        row = metasRaw.find((r) => String(r.client_id) === String(selectedTargetId) && r.periodo === periodoStr);
      }
      const numVal = row ? Number(row.valor) || 0 : 0;
      newInputs[m.key] = numVal > 0
        ? numVal.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })
        : "0";
    });
    setMonthlyInputs(newInputs);
  }, [metaType, selectedTargetId, metasRaw, selectedYear]);

  // Handler para troca de tipo (Segmento x Key Account)
  function handleTypeChange(newType) {
    setMetaType(newType);
    setSearchTerm("");
    setSuccessMessage("");
    setError("");
    if (newType === "segment" && segmentos.length > 0) {
      setSelectedTargetId(segmentos[0]);
    } else if (newType === "key_account" && keyAccounts.length > 0) {
      setSelectedTargetId(String(keyAccounts[0].id));
    } else {
      setSelectedTargetId("");
    }
  }

  function handleInputChange(mesKey, value) {
    setMonthlyInputs((prev) => ({
      ...prev,
      [mesKey]: value,
    }));
  }

  function parseFormattedNumber(valStr) {
    if (!valStr) return 0;
    const clean = String(valStr).replace(/\./g, "").replace(",", ".");
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  }

  const totalAnnualGoal = MESES.reduce((sum, m) => {
    return sum + parseFormattedNumber(monthlyInputs[m.key]);
  }, 0);

  // Filtro dinâmico para a busca
  const filteredSegmentos = segmentos.filter((s) =>
    s.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredKeyAccounts = keyAccounts.filter((k) =>
    (k.nome || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (k.segmento || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayedKeyAccounts = searchTerm.trim() ? filteredKeyAccounts : filteredKeyAccounts.slice(0, 300);

  // Baixar Planilha CSV
  function handleDownloadCSV() {
    const isSeg = metaType === "segment";
    const delimiter = ";";
    let csvContent = "\uFEFF"; // UTF-8 BOM
    csvContent += ["Tipo", "ID_Alvo", "Nome_Alvo", "Segmento", "Ano", ...MESES.map((m) => m.key)].join(delimiter) + "\r\n";

    if (isSeg) {
      segmentos.forEach((seg) => {
        const rowVals = MESES.map((m) => {
          const periodoStr = `${selectedYear}-${m.key}`;
          const row = metasRaw.find((r) => r.segmento === seg && !r.client_id && r.periodo === periodoStr);
          return row ? (Number(row.valor) || 0) : 0;
        });
        const line = [
          "Segmento",
          `"${seg.replace(/"/g, '""')}"`,
          `"${seg.replace(/"/g, '""')}"`,
          `"${seg.replace(/"/g, '""')}"`,
          selectedYear,
          ...rowVals
        ];
        csvContent += line.join(delimiter) + "\r\n";
      });
    } else {
      keyAccounts.forEach((ka) => {
        const kaName = ka.nome || "";
        const kaSeg = ka.segmento || "";
        const rowVals = MESES.map((m) => {
          const periodoStr = `${selectedYear}-${m.key}`;
          const row = metasRaw.find((r) => String(r.client_id) === String(ka.id) && r.periodo === periodoStr);
          return row ? (Number(row.valor) || 0) : 0;
        });
        const line = [
          "Key Account",
          `"${String(ka.id).replace(/"/g, '""')}"`,
          `"${kaName.replace(/"/g, '""')}"`,
          `"${kaSeg.replace(/"/g, '""')}"`,
          selectedYear,
          ...rowVals
        ];
        csvContent += line.join(delimiter) + "\r\n";
      });
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Metas_${isSeg ? "Segmentos" : "KeyAccounts"}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Importar Planilha CSV
  async function handleFileUpload(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setSaving(true);
    setError("");
    setSuccessMessage("");

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
        if (lines.length < 2) {
          throw new Error("A planilha está vazia ou não contém linhas de dados válidas.");
        }

        const firstLine = lines[0];
        const delimiter = firstLine.includes(";") ? ";" : ",";

        const parseCSVLine = (line) => {
          const values = [];
          let current = "";
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === delimiter && !inQuotes) {
              values.push(current.trim().replace(/^"|"$/g, ""));
              current = "";
            } else {
              current += char;
            }
          }
          values.push(current.trim().replace(/^"|"$/g, ""));
          return values;
        };

        const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim());

        const tipoIdx = headers.findIndex((h) => h.includes("tipo"));
        const idIdx = headers.findIndex((h) => h.includes("id"));
        const nomeIdx = headers.findIndex((h) => h.includes("nome"));
        const segIdx = headers.findIndex((h) => h.includes("segmento"));
        const anoIdx = headers.findIndex((h) => h.includes("ano"));

        const monthIndexes = {};
        MESES.forEach((m) => {
          monthIndexes[m.key] = headers.findIndex((h) => h === m.key.toLowerCase());
        });

        const itemsToImport = [];

        for (let i = 1; i < lines.length; i++) {
          const cols = parseCSVLine(lines[i]);
          if (cols.length === 0 || !cols.some((c) => c !== "")) continue;

          const rawType = tipoIdx !== -1 ? cols[tipoIdx] : "Segmento";
          const isKeyAcc = rawType && (rawType.toLowerCase().includes("key") || rawType.toLowerCase().includes("account"));
          const targetType = isKeyAcc ? "key_account" : "segment";

          let targetId = idIdx !== -1 && cols[idIdx] ? cols[idIdx] : (nomeIdx !== -1 ? cols[nomeIdx] : cols[segIdx]);
          if (!targetId) continue;

          const segmentoName = segIdx !== -1 ? cols[segIdx] : targetId;
          const rowYear = anoIdx !== -1 && cols[anoIdx] ? cols[anoIdx] : selectedYear;

          const monthlyValues = {};
          MESES.forEach((m) => {
            const idx = monthIndexes[m.key];
            if (idx !== -1 && cols[idx] !== undefined) {
              const cleanStr = String(cols[idx]).replace(/\./g, "").replace(",", ".");
              const num = parseFloat(cleanStr);
              monthlyValues[m.key] = isNaN(num) ? 0 : num;
            } else {
              monthlyValues[m.key] = 0;
            }
          });

          itemsToImport.push({
            type: targetType,
            targetId: targetId,
            segmento: segmentoName,
            year: rowYear,
            monthlyValues: monthlyValues,
          });
        }

        if (itemsToImport.length === 0) {
          throw new Error("Nenhuma meta válida pôde ser extraída da planilha.");
        }

        const res = await apiPost("/admin/metas/import", { items: itemsToImport });
        setSuccessMessage(`Planilha importada com sucesso! ${res.count || itemsToImport.length * 12} registros de metas mensais salvas/atualizadas.`);
        setTimeout(() => setSuccessMessage(""), 5000);

        loadMetas();
        if (typeof onRefreshData === "function") {
          onRefreshData();
        }
      } catch (err) {
        console.error("Erro ao importar CSV:", err);
        setError(err.message || "Erro ao processar arquivo CSV.");
      } finally {
        setSaving(false);
        if (e.target) e.target.value = "";
      }
    };
    reader.readAsText(file, "UTF-8");
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!selectedTargetId) {
      setError("Selecione um segmento ou key account válido.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccessMessage("");

    const numericMonthlyValues = {};
    MESES.forEach((m) => {
      numericMonthlyValues[m.key] = parseFormattedNumber(monthlyInputs[m.key]);
    });

    let currentSegmento = null;
    if (metaType === "segment") {
      currentSegmento = selectedTargetId;
    } else {
      const kaObj = keyAccounts.find((k) => String(k.id) === String(selectedTargetId));
      currentSegmento = kaObj ? kaObj.segmento : null;
    }

    try {
      await apiPut("/admin/metas", {
        type: metaType,
        targetId: selectedTargetId,
        segmento: currentSegmento,
        year: selectedYear,
        monthlyValues: numericMonthlyValues,
      });

      setSuccessMessage("Metas salvas com sucesso!");
      setTimeout(() => setSuccessMessage(""), 4000);

      loadMetas();
      if (typeof onRefreshData === "function") {
        onRefreshData();
      }
    } catch (err) {
      console.error("Erro ao salvar metas:", err);
      setError(err.message || "Erro ao salvar metas.");
    } finally {
      setSaving(false);
    }
  }

  if (loading && metasRaw.length === 0 && segmentos.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-8 text-center text-sm text-slate-500">
        Carregando dados das metas...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Input de arquivo invisível para importação CSV */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".csv"
        className="hidden"
      />

      {/* Cabeçalho e Controles Superiores */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Target className="text-rose-600" size={20} />
            Gestão de Metas
          </h2>
        </div>

        {/* Seletor de Ano & Botões de Planilha (CSV) */}
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          {/* Seletor de Ano */}
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
            <Calendar size={16} className="text-slate-500 ml-1" />
            <span className="text-xs font-semibold text-slate-600">Ano:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-white border border-slate-300 text-slate-800 text-xs font-bold rounded px-2.5 py-1 focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              {YEARS.map((y) => (
                <option key={y} value={String(y)}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Botão Baixar CSV */}
          <button
            type="button"
            onClick={handleDownloadCSV}
            title="Baixar planilha de metas no formato CSV"
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition-all cursor-pointer"
          >
            <Download size={14} className="text-slate-600" />
            Baixar CSV
          </button>

          {/* Botão Importar CSV */}
          <button
            type="button"
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            title="Importar ou atualizar metas a partir de um arquivo CSV"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-all cursor-pointer"
          >
            <Upload size={14} className="text-slate-300" />
            Importar CSV
          </button>
        </div>
      </div>

      {/* Alternador de Tipo (Segmentos x Key Accounts) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <button
          type="button"
          onClick={() => handleTypeChange("segment")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-xs transition-all border ${
            metaType === "segment"
              ? "bg-slate-900 text-white border-slate-900 shadow-sm"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Layers size={16} className={metaType === "segment" ? "text-rose-400" : "text-slate-400"} />
          Metas por Segmento ({segmentos.length})
        </button>

        <button
          type="button"
          onClick={() => handleTypeChange("key_account")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-xs transition-all border ${
            metaType === "key_account"
              ? "bg-slate-900 text-white border-slate-900 shadow-sm"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Star size={16} className={metaType === "key_account" ? "text-amber-400" : "text-slate-400"} />
          Metas por Key Account ({keyAccounts.length})
        </button>
      </div>

      {/* Alerta de Feedback / Sucesso */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs px-4 py-3 rounded-lg flex items-center gap-2">
          <Check size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Painel Principal de Seleção e Edição */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-6">
        {/* Seletor do Alvo com Filtro de Busca */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex flex-col gap-2 flex-1 max-w-md">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              {metaType === "segment" ? (
                <>
                  <Layers size={14} className="text-slate-500" /> Selecionar Segmento:
                </>
              ) : (
                <>
                  <Star size={14} className="text-amber-500" /> Selecionar Key Account:
                </>
              )}
            </label>

            {/* Campo de Busca rápida */}
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={metaType === "segment" ? "Filtrar segmentos..." : "Filtrar key accounts..."}
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium rounded-lg pl-8 pr-3 py-1.5 focus:bg-white focus:outline-none focus:border-rose-400"
              />
            </div>

            {/* Dropdown Menu Suspenso */}
            {metaType === "segment" ? (
              <select
                value={selectedTargetId}
                onChange={(e) => setSelectedTargetId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs font-semibold rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:border-rose-500 cursor-pointer"
              >
                {filteredSegmentos.length === 0 && <option value="">Nenhum segmento encontrado</option>}
                {filteredSegmentos.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={selectedTargetId}
                onChange={(e) => setSelectedTargetId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs font-semibold rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:border-rose-500 cursor-pointer"
              >
                {displayedKeyAccounts.length === 0 && <option value="">Nenhuma key account encontrada</option>}
                {displayedKeyAccounts.map((k) => (
                  <option key={k.id} value={String(k.id)}>
                    {k.nome} {k.segmento ? `(${k.segmento})` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Resumo da Meta Anual */}
          <div className="flex items-center gap-4 bg-slate-50 rounded-xl p-3.5 border border-slate-200 self-start md:self-auto">
            <div className="text-right">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Total Meta Anual ({selectedYear})
              </span>
              <span className="text-base font-extrabold text-slate-900">
                {totalAnnualGoal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
            </div>
          </div>
        </div>

        {/* Grid dos 12 Meses */}
        <form onSubmit={handleSave} className="flex flex-col gap-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {MESES.map((m) => (
              <div
                key={m.key}
                className="flex flex-col gap-1.5 bg-slate-50/70 border border-slate-200 p-3 rounded-lg hover:border-slate-300 transition-all focus-within:border-rose-400 focus-within:bg-rose-50/20"
              >
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                  <span>{m.label}</span>
                  <span className="text-[10px] text-slate-400 font-normal">{m.key}</span>
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-2 text-xs font-semibold text-slate-400">R$</span>
                  <input
                    type="text"
                    value={monthlyInputs[m.key] || ""}
                    onChange={(e) => handleInputChange(m.key, e.target.value)}
                    placeholder="0"
                    className="w-full bg-white border border-slate-300 focus:border-rose-500 rounded pl-7 pr-2 py-1 text-xs font-bold text-slate-800 text-right focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Ação de Salvar */}
          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              type="submit"
              disabled={saving || !selectedTargetId}
              className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <Save size={15} />
              {saving ? "Salvando Metas..." : "Salvar Metas"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
