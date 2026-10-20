const fs = require("fs");
const { pool } = require("./db");
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

const rawItems = JSON.parse(fs.readFileSync("./logs_varredura_recente.json", "utf8"));

const targets = [
  "Dako estreia como patrocinadora do MasterChef",
  "Nubank estreia nova campanha nacional para o NuCoin",
  "Shake Shack desembarca no Brasil",
  "Grupo Supley reestrutura liderança",
  "MXM Sistemas anuncia head de marketing",
  "Petrobras assume naming right da Copa Maria Bonita",
  "Boticário traz estrela de Emily em Paris",
  "NextJor assina sua primeira campanha nacional para o Giraffas",
  "Bradesco Principal une duplas de celebridades",
  "Betânia celebra Dia do Nordestino",
  "Bradesco lança filme com Selton Mello",
  "Centauro incentiva esporte na infância",
  "Youse apresenta nova marca",
  "Sanfarma lança adesivo para febre",
  "Greenz assume conta da Fini",
  "Leroy Merlin coloca a Bahia",
  "Hellmann’s transforma mais de 60 anos",
  "Wellhub usa frase de apostas",
  "The Best Açaí aposta em pudim",
  "João Gomes estrela nova campanha da Coca-Cola",
  "GRINGO assina a nova campanha da Akto",
  "Copacol mostra que bons hábitos",
  "L’Oréal investe em cursos",
  "Com nova campanha, Bradesco Principal mira alta",
  "MSC Cruzeiros será patrocinadora de três"
];

const selected = [];
for (const t of targets) {
  for (const it of rawItems) {
    if (it.title.toLowerCase().includes(t.toLowerCase())) {
      selected.push(it);
      break;
    }
  }
}

console.log("Selecionados para aprovação e enriquecimento:", selected.length);

async function run() {
  const promptInput = selected.map((it, idx) => ({
    id: idx,
    titulo: it.title,
    fonte: it.source,
    pubDate: it.pubDate
  }));

  const systemPrompt = `Você é o Diretor de Inteligência Comercial e Mídia da RedeTV!.
Todas as notícias enviadas nesta lista foram APROVADAS pelo comitê comercial como matérias estratégicas para prospecção de vendas.
Para cada notícia, faça a classificação e enriquecimento comercial retornando um JSON:
{
  "results": [
    {
      "id": 0,
      "data_publicacao": "YYYY-MM-DD",
      "segmento_crm": "Automotivo | Agro e Meio-Ambiente | Apostas Esportivas | Alimentos | Bebidas | Atacarejo & Supermercados | Vestuário e Moda | Educação | Telecom | Entretenimento | Tech e E-Commerce | Financeiro e Seguros | Higiene e Beleza | Farma e Saúde | Construção, Imobiliário e Decoração | Petroquímica, Energia e Lubrificantes | Eletro-Eletrônicos | Turismo",
      "anunciante_mencionado": "Marca ou empresa anunciante",
      "agencia_mencionada": "Agência de publicidade envolvida ou N/A",
      "resumo_executivo": "Resumo executivo de exatamente duas frases, destacando o valor, investimento, novo produto ou agência.",
      "gatilho_comercial": "Por que esse fato abre oportunidade de negócios para a equipe comercial da RedeTV!.",
      "acao_sugerida": "Ação direta e recomendação prática para o executivo comercial da RedeTV!.",
      "tags": ["Tag1", "Tag2", "Tag3"]
    }
  ]
}
Retorne exclusivamente o JSON.`;

  const comp = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: JSON.stringify(promptInput) }
    ],
    response_format: { type: "json_object" },
    temperature: 0.1
  });

  const parsed = JSON.parse(comp.choices[0].message.content);
  const results = parsed.results || [];
  console.log("IA concluiu análise de", results.length, "matérias.");

  let insertedCount = 0;
  for (const r of results) {
    const orig = selected[r.id];
    if (!orig) continue;

    let cleanTitle = orig.title;
    const lastDash = cleanTitle.lastIndexOf(" - ");
    if (lastDash > 10) cleanTitle = cleanTitle.substring(0, lastDash).trim();

    let cleanDate = "2026-10-08";
    try {
      const d = new Date(orig.pubDate);
      if (!isNaN(d.getTime())) cleanDate = d.toISOString().split("T")[0];
    } catch (_) {}
    if (r.data_publicacao && r.data_publicacao.startsWith("2026-")) cleanDate = r.data_publicacao;

    const newsId = `noticia_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const q = `
      INSERT INTO market_news (
        id, data_publicacao, fonte, url, titulo_original, segmento_crm,
        anunciante_mencionado, agencia_mencionada, resumo_executivo,
        gatilho_comercial, acao_sugerida, tags
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (id) DO NOTHING
      RETURNING id, titulo_original;
    `;
    const values = [
      newsId,
      cleanDate,
      orig.source,
      orig.link,
      cleanTitle,
      r.segmento_crm,
      r.anunciante_mencionado || "N/A",
      r.agencia_mencionada || "N/A",
      r.resumo_executivo,
      r.gatilho_comercial,
      r.acao_sugerida || "",
      r.tags || ["Radar Comercial"]
    ];
    const res = await pool.query(q, values);
    if (res.rows.length > 0) {
      insertedCount++;
      console.log(`[+] Inserida: ${cleanTitle} (${r.segmento_crm})`);
    }
  }

  console.log(`\n>>> Sucesso: ${insertedCount} de 25 notícias aprovadas e salvas no Radar de Mercado!`);
}

run().catch(err => {
  console.error("Erro fatal:", err);
  process.exit(1);
}).finally(() => {
  pool.end();
});
