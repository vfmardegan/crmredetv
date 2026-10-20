const { pool } = require("./db");

async function migrate() {
  console.log("Iniciando migração de segmentos e replicação em tags...");

  // 1. Dako -> Eletro-Eletrônicos
  const r1 = await pool.query(
    "UPDATE market_news SET segmento_crm = 'Eletro-Eletrônicos' WHERE titulo_original ILIKE '%dako%'"
  );
  console.log(`[Dako] Atualizada para Eletro-Eletrônicos (${r1.rowCount} linhas).`);

  // 2. Turismo -> Turismo e Serviços
  const r2 = await pool.query(
    "UPDATE market_news SET segmento_crm = 'Turismo e Serviços' WHERE segmento_crm = 'Turismo'"
  );
  console.log(`[Turismo] Atualizadas para Turismo e Serviços (${r2.rowCount} linhas).`);

  // 3. Farma e Saúde -> Saúde e Bem-Estar
  const r3 = await pool.query(
    "UPDATE market_news SET segmento_crm = 'Saúde e Bem-Estar' WHERE segmento_crm = 'Farma e Saúde'"
  );
  console.log(`[Farma e Saúde] Atualizadas para Saúde e Bem-Estar (${r3.rowCount} linhas).`);

  // 4. Petroquímica -> Petroquímica, Energia e Lubrificantes
  const r4 = await pool.query(
    "UPDATE market_news SET segmento_crm = 'Petroquímica, Energia e Lubrificantes' WHERE segmento_crm = 'Petroquímica'"
  );
  console.log(`[Petroquímica] Atualizadas para Petroquímica, Energia e Lubrificantes (${r4.rowCount} linhas).`);

  // 5. Replicar nome do segmento nas tags de TODAS as notícias
  const res = await pool.query("SELECT id, titulo_original, segmento_crm, tags FROM market_news");
  let updatedCount = 0;

  for (const row of res.rows) {
    const seg = row.segmento_crm;
    let tags = Array.isArray(row.tags) ? [...row.tags] : [];

    // Se for notícia da Dako, remover 'Entretenimento' que estava incorreto
    if (row.titulo_original.toLowerCase().includes("dako")) {
      tags = tags.filter((t) => t.toLowerCase() !== "entretenimento");
    }

    // Se for Turismo e Serviços, remover 'Turismo' isolado para evitar duplicação redundante
    if (seg === "Turismo e Serviços") {
      tags = tags.filter((t) => t !== "Turismo");
    }

    // Se for Petroquímica, Energia e Lubrificantes, remover 'Petroquímica' isolado
    if (seg === "Petroquímica, Energia e Lubrificantes") {
      tags = tags.filter((t) => t !== "Petroquímica");
    }

    // Se for Saúde e Bem-Estar, remover tags fragmentadas se desejado ou manter complementares
    if (seg === "Saúde e Bem-Estar") {
      tags = tags.filter((t) => t !== "Farma e Saúde" && t !== "Saúde e Bem-Estar");
    }

    // Garante que o nome exato do segmento fique na primeira posição das tags
    tags = [seg, ...tags.filter((t) => t !== seg)];

    await pool.query("UPDATE market_news SET tags = $1 WHERE id = $2", [tags, row.id]);
    updatedCount++;
  }

  console.log(`\nSucesso total: ${updatedCount} notícias com segmentos atualizados e replicados nas tags!`);
}

migrate()
  .then(() => pool.end())
  .catch((err) => {
    console.error("Erro na migração:", err);
    process.exit(1);
  });
