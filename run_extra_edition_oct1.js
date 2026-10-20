/**
 * Executa Edição Extra da Varredura de Mercado
 * Coletando todas as matérias desde o dia 01 de Outubro de 2026
 * Feeds Nativos + 18 Verticais Setoriais no Google News
 */

require("dotenv").config({ path: __dirname + "/.env" });
const { pool } = require("./backend/db");
const { crawlAndIngest } = require("./backend/services/marketCrawler");

async function main() {
  console.log("================================================================================");
  console.log("🚀 INICIANDO EDIÇÃO EXTRA DA VARREDURA DE MERCADO (DESDE 01/10/2026)");
  console.log("================================================================================");

  const startTime = Date.now();

  try {
    const result = await crawlAndIngest("edicao_extra_desde_01_outubro", {
      timeWindow: "after:2026-09-30",
      minDate: "2026-10-01",
    });

    const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log("\n================================================================================");
    console.log("📊 RESULTADO DA EDIÇÃO EXTRA");
    console.log("================================================================================");
    console.log(`⏱️ Tempo total: ${elapsedSeconds}s`);
    console.log(`📰 Total de matérias brutas coletadas: ${result.totalScanned}`);
    console.log(`🔍 Candidatas inéditas analisadas por IA: ${result.analyzed}`);
    console.log(`✅ Novas oportunidades catalogadas no banco: ${result.insertedCount}`);

    // Consulta contagem atualizada no PostgreSQL
    const dbRes = await pool.query(
      "SELECT count(*) as total, min(data_publicacao) as data_min, max(data_publicacao) as data_max FROM market_news"
    );
    console.log(`\n📦 Total atual no Radar de Mercado: ${dbRes.rows[0].total} notícias (${dbRes.rows[0].data_min} a ${dbRes.rows[0].data_max})`);

    const segRes = await pool.query(
      "SELECT segmento_crm, count(*) as total FROM market_news GROUP BY segmento_crm ORDER BY total DESC"
    );
    console.log("\n🏷️ Distribuição por segmento oficial no CRM:");
    segRes.rows.forEach(r => console.log(`   - ${r.segmento_crm}: ${r.total}`));

    console.log("\n================================================================================");
    console.log("🏁 Edição Extra concluída com sucesso!");
    console.log("================================================================================");
    process.exit(0);
  } catch (err) {
    console.error("❌ Erro ao executar edição extra:", err);
    process.exit(1);
  }
}

main();
