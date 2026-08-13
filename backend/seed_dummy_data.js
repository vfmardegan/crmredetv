const { Pool } = require("pg");
const crypto = require("crypto");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:redetv@localhost:5432/crm_redetv",
});

const SEGMENTOS = [
  "Alimentos e Bebidas",
  "Higiene e Beleza",
  "Finanças e Seguros",
  "Varejo",
  "Farmacêutico",
  "Tecnologia e Telecom",
];

const ESTAGIOS_FINALIZADOS = ["Fechado", "Negado"];
const ESTAGIOS_EM_ABERTO = ["Frio", "Morno", "Quente", "Desenvolvimento"];
const TIPOS_INTERACAO = ["note", "meeting", "whatsapp", "call"];
const MESES_MAP = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomEl = (arr) => arr[randomInt(0, arr.length - 1)];
const randomUUID = () => crypto.randomUUID();

// Retorna uma data no formato YYYY-MM-DD
function formatDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

async function seed() {
  console.log("Iniciando o Seed de dados fictícios...");

  try {
    // 1. Limpeza Segura (TRUNCATE nas tabelas com CASCADE)
    console.log("1. Limpando tabelas de negócios...");
    await pool.query(`
      TRUNCATE TABLE 
        notificacoes,
        client_interactions,
        sent_proposals,
        opportunities,
        contacts,
        agency_links,
        carteira_key_accounts,
        metas,
        faturamento_efetivo,
        clients
      CASCADE;
    `);

    // 2. Obter Executivos e Segmentos
    console.log("2. Consultando Executivos e Segmentos...");
    const execRes = await pool.query("SELECT * FROM executivos");
    let executivos = execRes.rows;
    if (executivos.length === 0) {
      console.log("Nenhum executivo encontrado. Usando fallback...");
      executivos = [{ id: "e1", nome: "Bruno Camargo" }];
    }

    const segRes = await pool.query("SELECT * FROM segmento_executivo");
    let existingSegmentos = segRes.rows.map(s => s.segmento);
    if (existingSegmentos.length === 0) {
      existingSegmentos = SEGMENTOS;
    }

    // 3. Obter produtos reais do banco de dados (cadastrados em Gestão e Acessos)
    console.log("3. Buscando produtos cadastrados...");
    const prodRes = await pool.query("SELECT nome FROM produtos WHERE ativo = true");
    let PRODUTOS = prodRes.rows.map(r => r.nome);
    if (PRODUTOS.length === 0) {
      PRODUTOS = ["A Tarde É Sua", "Esportes", "Liga Monstro", "RedeTV! News"];
    }

    // 4. Criar Agências (Lista Expandida)
    console.log("4. Criando Agências...");
    const agencies = [
      { id: randomUUID(), name: "VMLY&R Brasil", codigo: "AG01" },
      { id: randomUUID(), name: "Africa Creative", codigo: "AG02" },
      { id: randomUUID(), name: "WMcCann", codigo: "AG03" },
      { id: randomUUID(), name: "AlmapBBDO", codigo: "AG04" },
      { id: randomUUID(), name: "GALERIA.ag", codigo: "AG05" },
      { id: randomUUID(), name: "DPZ", codigo: "AG06" },
      { id: randomUUID(), name: "Publicis Brasil", codigo: "AG07" },
      { id: randomUUID(), name: "Artplan", codigo: "AG08" },
      { id: randomUUID(), name: "Lew'Lara\\TBWA", codigo: "AG09" },
      { id: randomUUID(), name: "Leo Burnett TM", codigo: "AG10" },
    ];
    for (const ag of agencies) {
      await pool.query(
        "INSERT INTO clients (id, codigo, razao_social, nome_fantasia, type) VALUES ($1, $2, $3, $4, $5)",
        [ag.id, ag.codigo, ag.name + " LTDA", ag.name, "Agência"]
      );
    }

    // 5. Criar Anunciantes (Lista Expandida)
    console.log("5. Criando Anunciantes...");
    const advertisers = [
      { name: "Unilever", seg: "Higiene e Beleza" },
      { name: "Ambev", seg: "Alimentos e Bebidas" },
      { name: "Itaú", seg: "Finanças e Seguros" },
      { name: "Magazine Luiza", seg: "Varejo" },
      { name: "Hypera Pharma", seg: "Farmacêutico" },
      { name: "Vivo", seg: "Tecnologia e Telecom" },
      { name: "L'Oréal", seg: "Higiene e Beleza" },
      { name: "Nestlé", seg: "Alimentos e Bebidas" },
      { name: "Samsung", seg: "Tecnologia e Telecom" },
      { name: "Nubank", seg: "Finanças e Seguros" },
      { name: "Casas Bahia", seg: "Varejo" },
      { name: "Bayer", seg: "Farmacêutico" },
      { name: "Coca-Cola", seg: "Alimentos e Bebidas" },
      { name: "P&G", seg: "Higiene e Beleza" },
      { name: "Bradesco", seg: "Finanças e Seguros" },
      { name: "Mercado Livre", seg: "Varejo" },
      { name: "EMS", seg: "Farmacêutico" },
      { name: "Claro", seg: "Tecnologia e Telecom" },
      { name: "JBS", seg: "Alimentos e Bebidas" },
      { name: "Natura", seg: "Higiene e Beleza" },
      { name: "Banco do Brasil", seg: "Finanças e Seguros" },
      { name: "Amazon Brasil", seg: "Varejo" },
      { name: "Sanofi", seg: "Farmacêutico" },
      { name: "TIM", seg: "Tecnologia e Telecom" },
      { name: "PepsiCo", seg: "Alimentos e Bebidas" },
      { name: "Colgate-Palmolive", seg: "Higiene e Beleza" },
      { name: "Santander", seg: "Finanças e Seguros" },
      { name: "Carrefour", seg: "Varejo" },
      { name: "Eurofarma", seg: "Farmacêutico" },
      { name: "Motorola", seg: "Tecnologia e Telecom" },
    ];

    const adRecords = [];
    let cod = 100;
    for (const ad of advertisers) {
      const validSeg = existingSegmentos.includes(ad.seg) ? ad.seg : randomEl(existingSegmentos);
      const id = randomUUID();
      adRecords.push({ id, name: ad.name, seg: validSeg });
      await pool.query(
        "INSERT INTO clients (id, codigo, razao_social, nome_fantasia, type, segmento) VALUES ($1, $2, $3, $4, $5, $6)",
        [id, `CLI${cod++}`, ad.name + " S.A.", ad.name, "Anunciante", validSeg]
      );
      
      // Associar de forma aleatória a uma agência (70% de chance)
      if (Math.random() > 0.3) {
        const agId = randomEl(agencies).id;
        await pool.query("INSERT INTO agency_links (agency_id, advertiser_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [agId, id]);
      }
    }

    // 6. Criar Contatos para Agências e Anunciantes
    console.log("6. Criando Contatos...");
    const contactRecords = [];
    const nomesContatos = [
      "Ana Silva", "Bruno Camargo", "Carla Dias", "Daniel Costa", "Eduarda Lima",
      "Felipe Souza", "Gabriela Ramos", "Hugo Santos", "Isabela Cruz", "João Rocha",
      "Karina Mendes", "Lucas Pinheiro", "Mariana Barbosa", "Nuno Gomes", "Olívia Reis",
      "Pedro Ferreira", "Renata Cardoso", "Samuel Silva", "Tatiana Martins", "Vitor Lima"
    ];

    for (const ad of adRecords) {
      const numContacts = randomInt(1, 3);
      for (let i = 0; i < numContacts; i++) {
        const id = randomUUID();
        const nome = randomEl(nomesContatos) + " " + randomInt(1, 99);
        contactRecords.push({ id, clientId: ad.id });
        await pool.query(
          "INSERT INTO contacts (id, client_id, name, cargo, email, celular) VALUES ($1, $2, $3, $4, $5, $6)",
          [id, ad.id, nome, "Gerente de Marketing", `${nome.replace(/ /g,"").toLowerCase()}@teste.com`, "(11) 9" + randomInt(70000000, 99999999)]
        );
      }
    }

    for (const ag of agencies) {
      const id = randomUUID();
      contactRecords.push({ id, clientId: ag.id });
      await pool.query(
        "INSERT INTO contacts (id, client_id, name, cargo, email, celular) VALUES ($1, $2, $3, $4, $5, $6)",
        [id, ag.id, "Mídia de Contato " + ag.name, "Supervisor de Mídia", `contato@${ag.name.replace(/[^a-zA-Z]/g,"").toLowerCase()}.com.br`, "(11) 9" + randomInt(70000000, 99999999)]
      );
    }

    // 7. Criar 200 Oportunidades com regras de previsão de fechamento
    console.log("7. Criando 200 Oportunidades...");
    
    // Gerar oportunidades distribuídas em 2026
    for (let i = 0; i < 200; i++) {
      const id = randomUUID();
      const ad = randomEl(adRecords);
      
      // Buscar agência vinculada se houver
      const res = await pool.query("SELECT agency_id FROM agency_links WHERE advertiser_id = $1 LIMIT 1", [ad.id]);
      const agId = res.rows.length > 0 ? res.rows[0].agency_id : null;
      
      // Associar contato do anunciante ou da agência
      const possibleContacts = contactRecords.filter(c => c.clientId === ad.id || (agId && c.clientId === agId));
      const contactId = possibleContacts.length > 0 ? randomEl(possibleContacts).id : null;
      
      const exName = randomEl(executivos).nome;
      const val = randomInt(10, 800) * 1000;
      const chosenProducts = Array.from(new Set([randomEl(PRODUTOS), randomEl(PRODUTOS)]));

      // Sorteia um mês de 2026 (0 a 11)
      const monthVal = randomInt(0, 11);
      const previsaoFechamentoDate = new Date(2026, monthVal, randomInt(1, 28));
      const previsaoFechamentoStr = formatDateString(previsaoFechamentoDate);

      // Define estágio e status finalizado se <= Julho de 2026 (meses 0 a 6)
      let stage;
      let status = "Pendente";
      if (monthVal <= 6) { // Jan a Jul inclusive
        stage = randomEl(ESTAGIOS_FINALIZADOS);
        status = stage === "Fechado" ? "Comercializado" : "Negativado";
      } else { // Ago a Dez
        stage = randomEl(ESTAGIOS_EM_ABERTO);
      }

      // Data de criação: entre 15 e 60 dias antes da previsão de fechamento
      const dataCriacaoDate = new Date(previsaoFechamentoDate);
      dataCriacaoDate.setDate(dataCriacaoDate.getDate() - randomInt(15, 60));
      const dataCriacaoStr = formatDateString(dataCriacaoDate);

      // Período correspondente
      const periodoStr = `2026-${MESES_MAP[monthVal]}`;

      await pool.query(`
        INSERT INTO opportunities 
        (id, title, executivo, agency_id, advertiser_id, contact_id, value, stage, status, period_months, products, previsao_fechamento, data_criacao) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, [
        id, 
        `Campanha ${ad.name} - ${randomEl(chosenProducts)}`,
        exName,
        agId,
        ad.id,
        contactId,
        val,
        stage,
        status,
        [periodoStr],
        chosenProducts,
        previsaoFechamentoStr,
        dataCriacaoStr
      ]);
    }

    // 8. Preencher Faturamento Efetivo e Metas (Consistente com 2026)
    console.log("8. Preenchendo Faturamento Efetivo e Metas...");
    const mesesFaturamento = ["2026-Jan", "2026-Fev", "2026-Mar", "2026-Abr", "2026-Mai", "2026-Jun", "2026-Jul", "2026-Ago", "2026-Set", "2026-Out", "2026-Nov", "2026-Dez"];
    
    for (const ad of adRecords) {
      if (Math.random() > 0.4) {
        for (const m of mesesFaturamento) {
          // Apenas gera faturamento para meses passados (até hoje ou proporcional ao ano)
          if (Math.random() > 0.4) {
            await pool.query(
              "INSERT INTO faturamento_efetivo (id, cliente_codigo, periodo, valor) VALUES ($1, $2, $3, $4)",
              [randomUUID(), `CLI${adRecords.indexOf(ad) + 100}`, m, randomInt(15, 250) * 1000]
            );
          }
        }
      }
    }
    
    for (const seg of existingSegmentos) {
      for (const m of mesesFaturamento) {
        await pool.query(
          "INSERT INTO metas (id, segmento, periodo, valor) VALUES ($1, $2, $3, $4)",
          [randomUUID(), seg, m, randomInt(300, 1200) * 1000]
        );
      }
    }

    // 9. Interações retroativas para o Win Probability
    console.log("9. Gerando interações para a timeline (Engajamento)...");
    for (const ad of adRecords) {
      const numInteractions = randomInt(3, 10);
      for (let i = 0; i < numInteractions; i++) {
        const type = randomEl(TIPOS_INTERACAO);
        let note = "Contato de relacionamento comercial regular.";
        if (type === "meeting") note = "Reunião de apresentação do novo plano comercial e grade de programação.";
        if (type === "whatsapp") note = "WhatsApp enviado com detalhes da audiência e conversões do último trimestre.";
        if (type === "call") note = "Alinhamento rápido por telefone para ajuste de valores da proposta.";

        const interactionDate = new Date();
        interactionDate.setDate(interactionDate.getDate() - randomInt(1, 90));

        await pool.query(
          "INSERT INTO client_interactions (id, client_id, date, note, type) VALUES ($1, $2, $3, $4, $5)",
          [randomUUID(), ad.id, formatDateString(interactionDate), note, type]
        );
      }
    }

    console.log("✅ Seed de 200 oportunidades e dados expandidos concluído com sucesso!");
    process.exit(0);

  } catch (err) {
    console.error("❌ Erro ao rodar seed:", err);
    process.exit(1);
  }
}

seed();
