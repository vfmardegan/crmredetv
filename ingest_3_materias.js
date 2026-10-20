const { pool } = require("./db");
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

const itemsToIngest = [
  {
    source: "Montepio Associação Mutualista",
    title: "Nova campanha Repsol acumula vantagens nos abastecimentos em combustível",
    date: "2026-10-08",
    link: "https://news.google.com/rss/articles/CBMi1AFBVV95cUxPWXhZNG53ZWhqWUVTTHB6dUlkVXU1VzNIdGI5aFFSZVkyUXp5eWhuWnF6d1FNcnFQSnFWZjdfMVdWc3g2aTBFblRtOUQ4WTRiRjJuSnhrSWFIaFRpdHNka29tNW82VDdjYmJOTGQ5OThNaUhlZmRCa0lxaUIyazBZZ25kUkg1cUFvRE96aEZtaEY1aWR5WENCcFRBUFJLRnNPU2tqcE1aY0dpVlM0Z2J6X3o0SWw0VzdnV3JOZktkUkNxQ19Tal9SblRkUy1JdVoxMlNLOQ?oc=5"
  },
  {
    source: "Valor Econômico",
    title: "DIVIA apresenta nova marca e reforça foco em IA",
    date: "2026-10-08",
    link: "https://news.google.com/rss/articles/CBMitgFBVV95cUxNVGdRWmhiOFFBX0tzMlc2UnAwVVg3c0xvV1BKQjg2SjIzU1YyVzlRYjBCVlNyUnhqR2d3V3RyYzd3STYybzFKZUdpWlN2ejJvMm0tVU1zYjJhZjVhWm9hX2FqaG1PTVpBZC1FNGM1WnlvQlNmODlZZ3pJUXRPSzlLVmlrNkdXN0lfRzNsLWhNN0R4SHE4X2VJUExHRGFKUjJfaDU2OGRUeDgtVTFDdTBnZlFNQUN1Z9IBxAFBVV95cUxPM1FCaFJRbTVJbVNyYTVybXZtcERkVDE0RDNrZmJRVkd1U21paTgzWm55Nk9DTkpkQ3VWSmxmWVBwbjVnWWxYemZqc1Bqenh4N1JUY2cwYmw3NHdjY2NmaXJpSEt2S2tXTDVKMUZTTWhMdk9XZC16eDBUbktVRjVMcUdsaVBvQVYwb282VGFPZHluS1gydWNmQmZvT254MjBrZ3k1Nk43NVF3S1JSVzgwZ19hbUZ3U3hsZXFaRl8wSHUtT0Ro?oc=5"
  },
  {
    source: "InfoMoney",
    title: "Cimed descarta patrocinar Brasileirão e Morumbi, mas amplia ofensiva sobre clubes",
    date: "2026-10-08",
    link: "https://news.google.com/rss/articles/CBMiuwFBVV95cUxNYnpVVW1ERm9oU1lzZkdVV255T0ktZ29DUUxJRGpkd2tFeC1NakppV05sdEVLbmpreFlxN2c0OGVTSjQ3T1F3dDJXNDY0VzZRZzR4N1E1RlVOUXhjMTJ1Z3lmZUNkLXRmclo0TEUwWVU5OVdZWnNkNWtnX19OQlR4a1BPcy1YZlBhRGUybFFIR3Y2cFRLNFZ3U0dzODBpbkcybldFX215SVgyOUxjSzN6ZXRjT1I2V0hhTTFN0gHAAUFVX3lxTE1XSGdXNENfNVhqeWxndS1Ed2JKd3VaeUJOVkE4QWRtRURvUW84eFAwTWtlWFVJNTl6c0JSTF9iNlhYcmFMSlRGYkZya0M4aWk0SDFRamI1Zm43UXV4b0FLeWNnX2ZCTmdJV0xKVDIwcHhfQkNUc2N4MWd6aEd2LXpPaGVFajRmWUlBblNTSWFxdl9vM2pxOTd0QmhXcjEtZHpsamViVlZfSzZ5N2lWRmxmeGR5TDR3eWdaTTdqcTgybw?oc=5"
  }
];

async function run() {
  const promptInput = itemsToIngest.map((it, idx) => ({
    id: idx,
    titulo: it.title,
    fonte: it.source,
    data: it.date
  }));

  const systemPrompt = `Você é o Diretor de Inteligência Comercial e Mídia da RedeTV!.
Todas as notícias enviadas nesta lista foram APROVADAS pelo comitê comercial como matérias estratégicas para prospecção de vendas da RedeTV!.

Para cada notícia, faça a classificação e enriquecimento comercial retornando um JSON:
{
  "results": [
    {
      "id": 0,
      "segmento_crm": "Automotivo | Agro e Meio-Ambiente | Apostas Esportivas | Alimentos | Bebidas | Atacarejo & Supermercados | Vestuário e Moda | Educação | Telecom | Entretenimento | Tech e E-Commerce | Financeiro e Seguros | Higiene e Beleza | Farma e Saúde | Construção, Imobiliário e Decoração | Petroquímica, Energia e Lubrificantes | Eletro-Eletrônicos | Turismo",
      "anunciante_mencionado": "Marca ou empresa anunciante",
      "agencia_mencionada": "Agência de publicidade envolvida ou N/A",
      "resumo_executivo": "Resumo executivo de exatamente duas frases, destacando o investimento, fatos comerciais, estratégia da marca ou expansão.",
      "gatilho_comercial": "Por que esse fato abre oportunidade de negócios e verba publicitária para a equipe comercial da RedeTV! (TV Aberta e Digital).",
      "acao_sugerida": "Ação direta e recomendação prática para o executivo comercial da RedeTV!.",
      "tags": ["Tag1", "Tag2", "Tag3"]
    }
  ]
}
Retorne exclusivamente o JSON.`;

  console.log("Enviando matérias para enriquecimento com IA...");
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
  console.log(`IA concluiu análise de ${results.length} matérias.`);

  let insertedCount = 0;
  for (const r of results) {
    const orig = itemsToIngest[r.id];
    if (!orig) continue;

    const newsId = `noticia_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const q = `
      INSERT INTO market_news (
        id, data_publicacao, fonte, url, titulo_original, segmento_crm,
        anunciante_mencionado, agencia_mencionada, resumo_executivo,
        gatilho_comercial, acao_sugerida, tags
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (id) DO NOTHING
      RETURNING id, titulo_original, segmento_crm, anunciante_mencionado;
    `;
    const values = [
      newsId,
      orig.date,
      orig.source,
      orig.link,
      orig.title,
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
      const row = res.rows[0];
      console.log(`[+] Inserida no Radar: "${row.titulo_original}"`);
      console.log(`    Segmento: ${row.segmento_crm} | Anunciante: ${row.anunciante_mencionado}`);
    }
  }

  console.log(`\n>>> Sucesso: ${insertedCount} de 3 notícias aprovadas e salvas no banco de dados do Radar de Mercado!`);
}

run().catch(err => {
  console.error("Erro ao executar inserção:", err);
  process.exit(1);
}).finally(() => {
  pool.end();
});
