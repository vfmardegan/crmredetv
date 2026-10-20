/**
 * Serviço de Coleta Automática e Inteligência Comercial do Radar de Mercado
 * Monitora fontes da curadoria via feeds nativos e buscas segmentadas por vertical no Google News (when:1d),
 * filtra ruído e analisa 100% das matérias candidatas com IA (OpenAI gpt-4o-mini) salvando no PostgreSQL.
 */

const { pool } = require("../db");
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

const CRM_SEGMENTS = [
  "Agro e Meio-Ambiente",
  "Alimentos",
  "Apostas Esportivas",
  "Atacarejo",
  "Automotivo",
  "Bebidas",
  "Construção, Imobiliário e Decoração",
  "Educação",
  "Eletro-Eletrônicos",
  "Entretenimento",
  "Facilities",
  "Farma e Saúde",
  "Financeiro e Seguros",
  "Governo Federal",
  "Governo Local - MG",
  "Governo Local - NE",
  "Governo Local - RJ",
  "Governo Local - SP",
  "Higiene e Beleza",
  "Igrejas",
  "Petroquímica",
  "Tech e E-Commerce",
  "Telecom",
  "Turismo",
  "Vestuário e Moda",
  "Agências de Publicidade"
];

// 1. Feeds RSS Nativos das Redações (Bypass do Google News)
const NATIVE_FEEDS = [
  { name: "Propmark", url: "https://propmark.com.br/feed/" },
  { name: "AdNews", url: "https://adnews.com.br/feed/" },
  { name: "Promoview", url: "https://www.promoview.com.br/feed/" },
  { name: "Grandes Nomes da Propaganda", url: "https://grandesnomesdapropaganda.com.br/feed/" },
  { name: "TeleSíntese", url: "https://telesintese.com.br/feed/" },
  { name: "Canal Rural", url: "https://www.canalrural.com.br/feed/" },
];

// 2. Feeds Agregadores por Verticais Exclusivas no Google News (Base Queries)
const VERTICAL_GOOGLE_FEEDS_TEMPLATES = [
  // 1. Núcleo Publicidade, Propaganda & Mídia
  { name: "Publicidade & Mídia", baseQuery: "(site:meioemensagem.com.br OR site:propmark.com.br OR site:adnews.com.br OR site:grandesnomesdapropaganda.com.br OR site:promoview.com.br)" },

  // 2. Conquistas de Contas, Trocas de Agência & Concorrências
  { name: "Concorrências & Contas", baseQuery: '("conquista a conta" OR "assume a conta" OR "vence concorrência" OR "troca de agência" OR "nova agência" OR "vence disputa")' },

  // 3. Lideranças de Marketing & Novos CMOs
  { name: "Lideranças de Marketing", baseQuery: '("novo CMO" OR "nova CMO" OR "head de marketing" OR "diretor de marketing" OR "diretora de marketing" OR "vp de marketing" OR "liderança de marketing")' },

  // 4. Lançamento de Campanhas, Filmes & Naming Rights
  { name: "Campanhas & Patrocínios", baseQuery: '("nova campanha" OR "filme publicitário" OR "patrocínio master" OR "naming rights" OR "garoto-propaganda" OR "embaixador da marca" OR "estreia campanha")' },

  // 5. Apostas Esportivas & iGaming
  { name: "Apostas & iGaming", baseQuery: '(site:gamesbras.com OR site:bnldata.com.br OR (("casa de apostas" OR "aposta esportiva" OR "bet" OR "igaming") AND ("patrocínio" OR "campanha" OR "marketing" OR "publicidade")))' },

  // 6. Automotivo & Mobilidade
  { name: "Automotivo", baseQuery: '(site:automotivebusiness.com.br OR site:autodata.com.br OR (("montadora" OR "concessionária" OR "veículos" OR "carros" OR "motos") AND ("campanha" OR "lançamento" OR "marketing" OR "publicidade")))' },

  // 7. Agro & Meio-Ambiente
  { name: "Agronegócio", baseQuery: '(site:canalrural.com.br OR site:globorural.globo.com OR site:agroemdia.com.br OR (("agronegócio" OR "agro" OR "fertilizantes" OR "safra") AND ("campanha" OR "patrocínio" OR "marketing")))' },

  // 8. Alimentos, Bebidas & Bens de Consumo (FMCG)
  { name: "Alimentos & Bebidas", baseQuery: '(("indústria de alimentos" OR "cervejaria" OR "refrigerante" OR "laticínios" OR "frigorífico" OR "snacks") AND ("campanha" OR "lançamento" OR "marketing" OR "patrocínio"))' },

  // 9. Varejo, Supermercados, Atacarejo & Franquias
  { name: "Varejo & Supermercados", baseQuery: '(site:gironews.com OR site:mercadoeconsumo.com.br OR (("supermercado" OR "atacarejo" OR "franquia" OR "redes varejistas") AND ("campanha" OR "expansão" OR "inauguração" OR "marketing")))' },

  // 10. Farma, Saúde, Higiene & Beleza
  { name: "Farma & Beleza", baseQuery: '(("farmacêutica" OR "drogaria" OR "remédio" OR "cosméticos" OR "beleza" OR "higiene") AND ("campanha" OR "lançamento" OR "marketing" OR "patrocínio"))' },

  // 11. Financeiro, Bancos, Fintechs & Seguros
  { name: "Financeiro & Seguros", baseQuery: '(("banco" OR "fintech" OR "seguradora" OR "cartão de crédito" OR "investimentos") AND ("nova campanha" OR "patrocínio" OR "publicidade" OR "marketing"))' },

  // 12. Telecom, Tecnologia & E-Commerce
  { name: "Telecom & Tecnologia", baseQuery: '(site:telesintese.com.br OR site:tecmundo.com.br OR site:startse.com OR (("operadora" OR "telecom" OR "5G" OR "e-commerce" OR "marketplace") AND ("campanha" OR "patrocínio" OR "marketing")))' },

  // 13. Turismo, Hotelaria & Companhias Aéreas
  { name: "Turismo & Aviação", baseQuery: '(site:panrotas.com.br OR site:brasilturis.com.br OR (("companhia aérea" OR "resort" OR "hotelaria" OR "agência de viagens") AND ("campanha" OR "promoção" OR "marketing")))' },

  // 14. Construção, Imobiliário & Casa/Decoração
  { name: "Construção & Imobiliário", baseQuery: '(("construtora" OR "incorporadora" OR "lançamento imobiliário" OR "tintas" OR "decoração") AND ("campanha" OR "marketing" OR "publicidade"))' },

  // 15. Eletro-Eletrônicos & Linha Branca
  { name: "Eletro & Eletrônicos", baseQuery: '(("linha branca" OR "eletrodomésticos" OR "smart tv" OR "eletrônicos") AND ("campanha" OR "lançamento" OR "marketing"))' },

  // 16. Educação & Ensino Superior
  { name: "Educação", baseQuery: '(("ensino superior" OR "universidade" OR "faculdade" OR "edtech") AND ("vestibular" OR "matrículas" OR "campanha" OR "marketing"))' },

  // 17. Entretenimento, Festivais & Grandes Eventos
  { name: "Entretenimento & Festivais", baseQuery: '(("festival" OR "show" OR "rock in rio" OR "lollapalooza" OR "the town" OR "ccxp") AND ("patrocinador" OR "patrocínio" OR "naming rights" OR "marca"))' },

  // 18. Negócios, Economia & Grandes Marcas
  { name: "Negócios & Grandes Marcas", baseQuery: '(site:valor.globo.com OR site:exame.com OR site:infomoney.com.br OR site:braziljournal.com OR site:neofeed.com.br) AND ("marketing" OR "campanha" OR "publicidade" OR "patrocínio")' },
];

const VERTICAL_GOOGLE_FEEDS = VERTICAL_GOOGLE_FEEDS_TEMPLATES.map(t => ({
  name: t.name,
  query: `${t.baseQuery} when:1d`
}));

/**
 * Converte XML de RSS em lista de itens, tratando tanto feeds nativos quanto Google News RSS
 */
function parseRssXml(xml, defaultSource = "Radar Comercial") {
  const items = [];
  const regex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = regex.exec(xml)) !== null) {
    const itemContent = match[1];
    const titleMatch = /<title>([\s\S]*?)<\/title>/.exec(itemContent);
    const linkMatch = /<link>([\s\S]*?)<\/link>/.exec(itemContent);
    const pubDateMatch = /<pubDate>(.*?)<\/pubDate>/.exec(itemContent);
    const sourceMatch = /<source url="([^"]*)">([\s\S]*?)<\/source>/.exec(itemContent);

    if (titleMatch && linkMatch) {
      let rawTitle = titleMatch[1]
        .replace(/<!\[CDATA\[/g, "")
        .replace(/\]\]>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();

      // Remove sufixo de fonte adicionado pelo Google News (ex: "- Meio e Mensagem")
      let cleanTitle = rawTitle;
      const lastDash = rawTitle.lastIndexOf(" - ");
      if (lastDash > 15) {
        cleanTitle = rawTitle.substring(0, lastDash).trim();
      }

      let sourceName = defaultSource;
      if (sourceMatch && sourceMatch[2]) {
        sourceName = sourceMatch[2].replace(/<!\[CDATA\[/g, "").replace(/\]\]>/g, "").trim();
      }

      let link = linkMatch[1]
        .replace(/<!\[CDATA\[/g, "")
        .replace(/\]\]>/g, "")
        .trim();

      // Converte data pubDate para YYYY-MM-DD
      let dateStr = new Date().toISOString().split("T")[0];
      if (pubDateMatch) {
        try {
          const d = new Date(pubDateMatch[1]);
          if (!isNaN(d.getTime())) {
            dateStr = d.toISOString().split("T")[0];
          }
        } catch (_) {}
      }

      items.push({
        title: cleanTitle,
        originalTitle: rawTitle,
        link,
        source: sourceName,
        date: dateStr,
      });
    }
  }

  return items;
}

/**
 * Funções auxiliares para deduplicação semântica e por entidades
 */
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
    (title || "")
      .split(/\s+/)
      .map(normalizeWord)
      .filter((w) => w.length > 2 && !stopWords.has(w))
  );
}

function jaccard(setA, setB) {
  if (!setA || !setB || setA.size === 0 || setB.size === 0) return 0;
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
}

function normalizeEntity(name) {
  if (!name || name === "N/A") return "";
  return name.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
}

/**
 * Filtro preliminar de ruído por palavras-chave (antes de gastar qualquer chamada de IA)
 */
function isObviouslyIrrelevant(title) {
  const t = title.toLowerCase();
  const noiseTerms = [
    "eleição", "eleições", "votação", "urna eletrônica", "prefeito", "vereador", "candidato", "zona eleitoral",
    "acidente", "preso em", "assassinato", "homicídio", "polícia prende", "morte de", "tráfico",
    "receita de", "como fazer bolo", "horóscopo", "novela das", "capítulo de hoje",
    "resultado do jogo", "escalação do time", "gols da rodada", "tabela do brasileirão"
  ];

  return noiseTerms.some(term => t.includes(term));
}

/**
 * Executa a esteira de captura e ingestão no Radar de Mercado
 */
async function crawlAndIngest(triggerSource = "manual", options = {}) {
  const timeWindow = options.timeWindow || "when:1d";
  const minDate = options.minDate || null;
  console.log(`[Market Crawler] Iniciando captura (${triggerSource}) com feeds nativos e verticais dedicadas (${timeWindow}${minDate ? ` >= ${minDate}` : ""})...`);

  // 1. Carrega notícias existentes no banco para deduplicação semântica (últimos 30 dias)
  const existingRes = await pool.query(
    "SELECT id, url, LOWER(titulo_original) as clean_title, LOWER(COALESCE(anunciante_mencionado, '')) as adv, LOWER(COALESCE(agencia_mencionada, '')) as age FROM market_news WHERE created_at >= NOW() - INTERVAL '30 days'"
  );
  const existingUrls = new Set(existingRes.rows.map(r => r.url));
  const existingTitles = new Set(existingRes.rows.map(r => r.clean_title));
  const existingNewsList = existingRes.rows.map(r => ({
    ...r,
    advNorm: normalizeEntity(r.adv),
    ageNorm: normalizeEntity(r.age),
    kw: getKeywords(r.clean_title)
  }));

  // 2. Coleta Feeds Nativos Diretos das Redações
  const collectedItems = [];
  const fetchPromises = [];

  for (const nativeFeed of NATIVE_FEEDS) {
    fetchPromises.push(
      fetch(nativeFeed.url, {
        headers: { "User-Agent": "Mozilla/5.0 RedeTV-Market-Radar/2.0" },
        signal: AbortSignal.timeout(6000)
      })
      .then(async res => {
        if (res.ok) {
          const xml = await res.text();
          const items = parseRssXml(xml, nativeFeed.name);
          collectedItems.push(...items);
        }
      })
      .catch(err => {
        console.warn(`[Market Crawler] Feed Nativo (${nativeFeed.name}): ${err.message}`);
      })
    );
  }

  // 3. Coleta Feeds das 18 Verticais Setoriais no Google News
  for (const vertical of VERTICAL_GOOGLE_FEEDS_TEMPLATES) {
    const fullQuery = `${vertical.baseQuery} ${timeWindow}`;
    const feedUrl = "https://news.google.com/rss/search?q=" + encodeURIComponent(fullQuery) + "&hl=pt-BR&gl=BR&ceid=BR:pt-419";
    fetchPromises.push(
      fetch(feedUrl, {
        headers: { "User-Agent": "Mozilla/5.0 RedeTV-Market-Radar/2.0" },
        signal: AbortSignal.timeout(6000)
      })
      .then(async res => {
        if (res.ok) {
          const xml = await res.text();
          const items = parseRssXml(xml, vertical.name);
          collectedItems.push(...items);
        }
      })
      .catch(err => {
        console.warn(`[Market Crawler] Vertical Google (${vertical.name}): ${err.message}`);
      })
    );
  }

  // Aguarda todos os feeds em paralelo
  await Promise.allSettled(fetchPromises);

  // 4. Deduplica e filtra ruído (Deduplicação Semântica por similaridade de manchete e entidades)
  const seenBatchTitles = new Set();
  const seenBatchUrls = new Set();
  const candidates = [];

  for (const item of collectedItems) {
    // 4.0 Filtro opcional de data mínima (ex: minDate = "2026-10-01")
    if (minDate && item.date && item.date < minDate) continue;

    const normTitle = item.title.toLowerCase();
    if (seenBatchTitles.has(normTitle) || seenBatchUrls.has(item.link)) continue;
    seenBatchTitles.add(normTitle);
    seenBatchUrls.add(item.link);

    // 4.1 Checagem exata por URL ou título idêntico
    if (existingTitles.has(normTitle) || existingUrls.has(item.link)) continue;

    // 4.2 Filtro prévio de ruído não-comercial
    if (isObviouslyIrrelevant(item.title)) continue;

    // 4.3 Deduplicação semântica contra o banco de dados existente
    const kwItem = getKeywords(item.title);
    if (kwItem.size >= 2) {
      const isDbDuplicate = existingNewsList.some(dbItem => jaccard(kwItem, dbItem.kw) >= 0.40);
      if (isDbDuplicate) continue;

      // 4.4 Deduplicação semântica dentro do próprio lote da rodada atual
      const isBatchDuplicate = candidates.some(cand => jaccard(kwItem, cand.kw) >= 0.40);
      if (isBatchDuplicate) continue;
    }

    candidates.push({ ...item, kw: kwItem });
  }

  console.log(`[Market Crawler] Total coletado: ${collectedItems.length} matérias. Candidatas inéditas únicas para IA: ${candidates.length}.`);

  if (candidates.length === 0) {
    return { ok: true, count: 0, totalScanned: collectedItems.length, message: "Nenhuma matéria inédita detectada nesta rodada." };
  }

  // 5. Analisa 100% das candidatas inéditas com IA em sub-lotes para evitar estourar limites
  const systemPrompt = `Você é o Diretor de Inteligência Comercial e Mídia da RedeTV!.
Analise a lista de notícias e identifique as matérias que representam oportunidades comerciais reais para prospecção de anunciantes em TV Aberta e Digital.

DIRETRIZES DE APROVAÇÃO (CRITÉRIOS VALIDADOS PELO COMITÊ COMERCIAL - MACHINE LEARNING):
Considere como ALTA RELEVÂNCIA COMERCIAL (relevante: true):
1. Patrocínios e Naming Rights: marcas patrocinando programas de TV, reality shows, festivais ou eventos esportivos/culturais (ex: Dako no MasterChef, Petrobras em naming rights, MSC Cruzeiros na F1).
2. Lançamento de Novas Campanhas: filmes institucionais, campanhas nacionais, sazonais ou de novos produtos com verba de mídia (ex: Nubank NuCoin, Bradesco com Selton Mello, Betânia com João Gomes, Centauro Dia das Crianças, Hellmann's 60 anos, Coca-Cola retornáveis).
3. Conquistas e Trocas de Contas por Agências: agências conquistando novas marcas ou assumindo comunicação integrada (ex: Greenz assume Fini, NextJor assina Giraffas, GRINGO assina Akto, Omnicom vence PicPay).
4. Chegada ou Expansão de Marcas no Brasil: novas redes internacionais e franquias aportando no país com apetite de marketing (ex: Shake Shack desembarca no Brasil).
5. Movimentação de Lideranças de Marketing: novos CMOs, heads de marketing/vendas e reestruturações de diretorias de marcas (ex: Grupo Supley, MXM Sistemas, Pamella Dias na Assifarma).
6. Collabs e Grandes Embaixadores: parcerias de peso entre marcas e celebridades globais/nacionais (ex: Boticário traz estrela de Emily em Paris, Sanfarma com Disney/Olaf).
7. Estratégias Agressivas de Crescimento: marcas com metas públicas de expansão de base de clientes ou projetos de criadores de conteúdo (ex: Bradesco Principal mira alta de 60%, L'Oréal investe em criadores).
8. Eletrodomésticos, Eletrônicos e Linha Branca: marcas de fogões, fornos, geladeiras, TVs e eletrodomésticos (ex: Dako, Brastemp, Electrolux, Consul, Samsung) pertencem SEMPRE ao segmento "Eletro-Eletrônicos", mesmo quando patrocinarem reality shows gastronômicos ou programas de entretenimento (ex: MasterChef).

Para cada item da lista, retorne um objeto no formato JSON com a seguinte estrutura:
{
  "results": [
    {
      "id": 0,
      "relevante": true ou false,
      "segmento_crm": "Um dos segmentos oficiais do CRM: Agro e Meio-Ambiente, Alimentos, Apostas Esportivas, Atacarejo, Automotivo, Bebidas, Construção, Imobiliário e Decoração, Educação, Eletro-Eletrônicos, Entretenimento, Facilities, Farma e Saúde, Financeiro e Seguros, Higiene e Beleza, Petroquímica, Tech e E-Commerce, Telecom, Turismo, Vestuário e Moda, Agências de Publicidade",
      "anunciante_mencionado": "Nome da marca/empresa ou N/A se for só agência",
      "agencia_mencionada": "Nome da agência ou N/A",
      "resumo_executivo": "Resumo de 2 frases focado nos fatos de negócio, produto e investimento",
      "gatilho_comercial": "Por que isso é uma oportunidade para a equipe comercial da RedeTV!",
      "acao_sugerida": "Ação recomendada para o executivo de vendas",
      "tags": ["Tag1", "Tag2", "Tag3"]
    }
  ]
}

Se a notícia NÃO for de relevância comercial direta (ex: política partidária, crime, fofocas, futebol sem patrocínio, amenidades), defina "relevante": false.
Retorne EXCLUSIVAMENTE o JSON válido sem formatação markdown extra.`;

  const CHUNK_SIZE = 25;
  const approvedCandidates = [];

  for (let i = 0; i < candidates.length; i += CHUNK_SIZE) {
    const chunk = candidates.slice(i, i + CHUNK_SIZE);
    const promptInput = chunk.map((item, idx) => ({
      id: idx,
      titulo: item.title,
      fonte: item.source,
      data: item.date,
    }));

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: JSON.stringify(promptInput) }
        ],
        response_format: { type: "json_object" },
        temperature: 0.15,
      });

      const parsed = JSON.parse(completion.choices[0].message.content);
      const results = parsed.results || [];
      for (const res of results) {
        if (res.relevante) {
          const originalItem = chunk[res.id];
          if (originalItem) {
            approvedCandidates.push({ ...res, originalItem });
          }
        }
      }
    } catch (err) {
      console.error(`[Market Crawler] Erro na análise do lote de IA (${i + 1} a ${i + chunk.length}):`, err.message);
    }
  }

  console.log(`[Market Crawler] Análise de IA concluída para 100% das ${candidates.length} candidatas. Aprovadas: ${approvedCandidates.length}.`);

  // 6. Salva no banco de dados
  const insertedNews = [];

  for (const itemWithRes of approvedCandidates) {
    const originalItem = itemWithRes.originalItem;

    // Checagem de segurança pós-IA: se já existir notícia recente com o mesmo par Anunciante + Agência
    const advNorm = normalizeEntity(itemWithRes.anunciante_mencionado);
    const ageNorm = normalizeEntity(itemWithRes.agencia_mencionada);
    if (advNorm && ageNorm) {
      const isAlreadyInDb = existingNewsList.some(
        dbItem => dbItem.advNorm === advNorm && dbItem.ageNorm === ageNorm
      );
      if (isAlreadyInDb) {
        console.log(`[Market Crawler] Descartada duplicata pós-IA (${itemWithRes.anunciante_mencionado} + ${itemWithRes.agencia_mencionada}): "${originalItem.title}"`);
        continue;
      }
    }

    let seg = CRM_SEGMENTS.find(s => s.toLowerCase() === (itemWithRes.segmento_crm || "").toLowerCase()) || "Agências de Publicidade";

    const newsId = `noticia_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Replica o nome oficial do segmento como a primeira tag obrigatória
    const rawTags = Array.isArray(itemWithRes.tags) ? itemWithRes.tags : ["Radar Comercial"];
    const finalTags = [seg, ...Array.from(new Set(rawTags.filter(t => t !== seg)))];

    try {
      const q = `
        INSERT INTO market_news (
          id, data_publicacao, fonte, url, titulo_original, segmento_crm,
          anunciante_mencionado, agencia_mencionada, resumo_executivo,
          gatilho_comercial, acao_sugerida, tags
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (id) DO NOTHING
        RETURNING *
      `;
      const values = [
        newsId,
        originalItem.date,
        originalItem.source,
        originalItem.link,
        originalItem.title,
        seg,
        itemWithRes.anunciante_mencionado || "N/A",
        itemWithRes.agencia_mencionada || "N/A",
        itemWithRes.resumo_executivo,
        itemWithRes.gatilho_comercial,
        itemWithRes.acao_sugerida || "",
        finalTags
      ];

      const insertRes = await pool.query(q, values);
      if (insertRes.rows.length > 0) {
        insertedNews.push(insertRes.rows[0]);
      }
    } catch (insertErr) {
      console.error("[Market Crawler] Erro ao inserir notícia:", insertErr.message);
    }
  }

  console.log(`[Market Crawler] Varredura finalizada. ${insertedNews.length} novas notícias relevantes catalogadas no banco.`);

  // 7. Grava log detalhado de auditoria da varredura
  try {
    const fs = require("fs");
    const path = require("path");
    const logDir = path.join(__dirname, "../logs");
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const sourcesBreakdown = {};
    for (const it of collectedItems) {
      sourcesBreakdown[it.source] = (sourcesBreakdown[it.source] || 0) + 1;
    }

    const scanLog = {
      timestamp: new Date().toISOString(),
      triggerSource,
      totalScanned: collectedItems.length,
      sourcesBreakdown,
      candidatesCount: candidates.length,
      analyzedWithAiCount: candidates.length,
      insertedCount: insertedNews.length,
      inserted: insertedNews.map(n => ({
        id: n.id,
        titulo: n.titulo_original,
        segmento: n.segmento_crm,
        fonte: n.fonte,
        data: n.data_publicacao,
        gatilho: n.gatilho_comercial,
        anunciante: n.anunciante_mencionado,
        agencia: n.agencia_mencionada,
      })),
      allScannedHeadlines: collectedItems.map(it => ({
        fonte: it.source,
        titulo: it.title,
        data: it.date,
        link: it.link,
      }))
    };

    const dateStr = new Date().toISOString().replace(/[:.]/g, "-");
    fs.writeFileSync(path.join(logDir, `scan_${dateStr}.json`), JSON.stringify(scanLog, null, 2));
    fs.writeFileSync(path.join(logDir, "latest_scan.json"), JSON.stringify(scanLog, null, 2));
    console.log(`[Market Crawler] Log de auditoria salvo em backend/logs/scan_${dateStr}.json`);
  } catch (logErr) {
    console.warn("[Market Crawler] Não foi possível salvar log em disco:", logErr.message);
  }

  return {
    ok: true,
    totalScanned: collectedItems.length,
    analyzed: candidates.length,
    insertedCount: insertedNews.length,
    inserted: insertedNews.map(n => ({
      id: n.id,
      titulo: n.titulo_original,
      segmento: n.segmento_crm,
      fonte: n.fonte,
      data: n.data_publicacao
    }))
  };
}

module.exports = {
  crawlAndIngest,
  CRM_SEGMENTS,
};
