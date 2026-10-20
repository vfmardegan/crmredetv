const { pool } = require("./db");

function normalizeWord(w) {
  return w.toLowerCase().replace(/[^a-z0-9áéíóúãõâêîôûç]/g, "");
}

function getKeywords(title) {
  const stopWords = new Set([
    "e", "de", "da", "do", "das", "dos", "em", "no", "na", "nos", "nas",
    "para", "com", "por", "a", "o", "as", "os", "um", "uma", "uns", "umas",
    "se", "sua", "seu", "suas", "seus", "que", "ao", "aos", "à", "às",
    "mais", "como", "sobre", "pela", "pelo", "novo", "nova", "novos", "novas"
  ]);
  return new Set(
    title
      .split(/\s+/)
      .map(normalizeWord)
      .filter((w) => w.length > 2 && !stopWords.has(w))
  );
}

function jaccard(setA, setB) {
  if (setA.size === 0 || setB.size === 0) return 0;
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
}

function normalizeEntity(name) {
  if (!name || name === "N/A") return "";
  return name.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
}

async function deduplicate() {
  console.log("Iniciando auditoria e deduplicação semântica do Radar de Mercado...");

  const res = await pool.query(
    "SELECT id, data_publicacao, fonte, titulo_original, anunciante_mencionado, agencia_mencionada, resumo_executivo, tags, created_at FROM market_news ORDER BY created_at ASC"
  );
  const news = res.rows;
  console.log(`Total de notícias no banco antes da limpeza: ${news.length}`);

  const visited = new Set();
  const duplicateIdsToRemove = [];
  const consolidationReport = [];

  for (let i = 0; i < news.length; i++) {
    const itemA = news[i];
    if (visited.has(itemA.id)) continue;

    const group = [itemA];
    visited.add(itemA.id);
    const kwA = getKeywords(itemA.titulo_original);
    const advA = normalizeEntity(itemA.anunciante_mencionado);
    const ageA = normalizeEntity(itemA.agencia_mencionada);

    for (let j = i + 1; j < news.length; j++) {
      const itemB = news[j];
      if (visited.has(itemB.id)) continue;

      const kwB = getKeywords(itemB.titulo_original);
      const advB = normalizeEntity(itemB.anunciante_mencionado);
      const ageB = normalizeEntity(itemB.agencia_mencionada);

      // Critério 1: Mesmo Anunciante E Mesma Agência (ex: GOL + Druid, Fini + Greenz)
      const sameAdvAndAge = advA && advB && advA === advB && ageA && ageB && ageA === ageB;

      // Critério 2: Mesmo Anunciante E Similaridade de Título >= 30%
      const sim = jaccard(kwA, kwB);
      const sameAdvAndTitleSim = advA && advB && (advA.includes(advB) || advB.includes(advA)) && sim >= 0.25;

      // Critério 3: Similaridade textual pura do título >= 45%
      const highTitleSim = sim >= 0.45;

      if (sameAdvAndAge || sameAdvAndTitleSim || highTitleSim) {
        group.push(itemB);
        visited.add(itemB.id);
      }
    }

    if (group.length > 1) {
      // Ordena o grupo para eleger a matéria principal mais completa
      // Prioriza a que tem resumo mais longo ou fonte tradicional
      group.sort((a, b) => {
        const scoreB = (b.resumo_executivo || "").length + (b.anunciante_mencionado !== "N/A" ? 50 : 0);
        const scoreA = (a.resumo_executivo || "").length + (a.anunciante_mencionado !== "N/A" ? 50 : 0);
        return scoreB - scoreA;
      });

      const master = group[0];
      const duplicates = group.slice(1);

      consolidationReport.push({
        master,
        duplicates
      });

      for (const d of duplicates) {
        duplicateIdsToRemove.push(d.id);
      }
    }
  }

  console.log(`\nIdentificados ${consolidationReport.length} grupos de repetição.`);
  console.log(`Total de notícias duplicadas a serem removidas: ${duplicateIdsToRemove.length}\n`);

  for (const report of consolidationReport) {
    console.log(`[MANTIDA] (${report.master.fonte}) "${report.master.titulo_original}"`);
    for (const d of report.duplicates) {
      console.log(`   └─ [REMOVER] (${d.fonte}) "${d.titulo_original}" (ID: ${d.id})`);
    }
  }

  if (duplicateIdsToRemove.length > 0) {
    const delRes = await pool.query(
      "DELETE FROM market_news WHERE id = ANY($1) RETURNING id",
      [duplicateIdsToRemove]
    );
    console.log(`\n>>> Excluídas com sucesso ${delRes.rowCount} notícias duplicadas do banco de dados!`);
  }

  const finalCountRes = await pool.query("SELECT COUNT(*) FROM market_news");
  console.log(`Total final de notícias únicas no Radar: ${finalCountRes.rows[0].count}`);
}

deduplicate()
  .then(() => pool.end())
  .catch((err) => {
    console.error("Erro na deduplicação:", err);
    process.exit(1);
  });
