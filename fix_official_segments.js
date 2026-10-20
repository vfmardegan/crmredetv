const { pool } = require("./db");

async function fixOfficialSegments() {
  console.log("Iniciando padronização com os segmentos oficiais do CRM...");

  // 1. Padroniza segmento_crm
  await pool.query("UPDATE market_news SET segmento_crm = 'Turismo' WHERE segmento_crm IN ('Turismo e Serviços', 'Turismo')");
  console.log("[1] Segmentos Turismo padronizados.");

  await pool.query("UPDATE market_news SET segmento_crm = 'Farma e Saúde' WHERE segmento_crm IN ('Saúde e Bem-Estar', 'Farma e Saúde')");
  console.log("[2] Segmentos Farma e Saúde padronizados.");

  await pool.query("UPDATE market_news SET segmento_crm = 'Petroquímica' WHERE segmento_crm IN ('Petroquímica, Energia e Lubrificantes', 'Petroquímica')");
  console.log("[3] Segmentos Petroquímica padronizados.");

  await pool.query("UPDATE market_news SET segmento_crm = 'Eletro-Eletrônicos' WHERE titulo_original ILIKE '%dako%'");
  console.log("[4] Dako padronizada para Eletro-Eletrônicos.");

  // 2. Replicar os nomes dos segmentos oficiais exatamente nas tags
  const res = await pool.query("SELECT id, titulo_original, segmento_crm, tags FROM market_news");
  let count = 0;

  for (const row of res.rows) {
    const seg = row.segmento_crm;
    let tags = Array.isArray(row.tags) ? [...row.tags] : [];

    // Limpa tags antigas incompatíveis com o padrão oficial
    tags = tags.filter(t => 
      t !== "Turismo e Serviços" &&
      t !== "Saúde e Bem-Estar" &&
      t !== "Petroquímica, Energia e Lubrificantes"
    );

    if (row.titulo_original.toLowerCase().includes("dako")) {
      tags = tags.filter(t => t.toLowerCase() !== "entretenimento");
    }

    // Coloca o segmento oficial como primeira tag
    tags = [seg, ...tags.filter(t => t !== seg)];

    await pool.query("UPDATE market_news SET tags = $1 WHERE id = $2", [tags, row.id]);
    count++;
  }

  console.log(`\nConcluído com sucesso! ${count} notícias atualizadas com segmentos oficiais e tags replicadas.`);
}

fixOfficialSegments()
  .then(() => pool.end())
  .catch(err => {
    console.error("Erro:", err);
    process.exit(1);
  });
