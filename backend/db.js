// Conexão com o Postgres. Lê DATABASE_URL do ambiente — já está definida
// no docker-compose.yml do projeto:
//   postgresql://postgres:redetv@db:5432/crm_redetv
const { Pool, types } = require("pg");

// OID 1082 = DATE no PostgreSQL. Retorna string no formato 'YYYY-MM-DD'
// Previne conversão para JS Date (que gera UTC timestamp e problemas com inputs HTML5)
types.setTypeParser(1082, (val) => val);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on("error", (err) => {
  console.error("Erro inesperado no pool do Postgres:", err);
});

// Inicialização automática da tabela de usuários se não existir
const initDb = async () => {
  try {
    // 1. Tabela base de usuários
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        google_id VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        nome VARCHAR(255) NOT NULL,
        foto_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // 2. Colunas para perfis de acesso
    await pool.query(`
      ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS perfil VARCHAR(50) DEFAULT 'executivo';
    `);
    await pool.query(`
      ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS executivo_id VARCHAR(255) REFERENCES executivos(id) ON DELETE SET NULL;
    `);

    // 3. Tabela de vínculo entre diretores (usuarios) e executivos
    await pool.query(`
      CREATE TABLE IF NOT EXISTS diretor_executivos (
        diretor_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
        executivo_id VARCHAR(255) REFERENCES executivos(id) ON DELETE CASCADE,
        PRIMARY KEY (diretor_id, executivo_id)
      );
    `);

    // 4. Tabela de vínculo de key-accounts personalizados para executivos
    await pool.query(`
      CREATE TABLE IF NOT EXISTS carteira_key_accounts (
        executivo_id VARCHAR(255) REFERENCES executivos(id) ON DELETE CASCADE,
        client_id VARCHAR(255) REFERENCES clients(id) ON DELETE CASCADE,
        PRIMARY KEY (executivo_id, client_id)
      );
    `);

    // 5. Tabela de histórico de interações/histórico de clientes
    await pool.query(`
      CREATE TABLE IF NOT EXISTS client_interactions (
        id VARCHAR(255) PRIMARY KEY,
        client_id VARCHAR(255) REFERENCES clients(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
        date DATE NOT NULL,
        note TEXT NOT NULL,
        ai_summary TEXT,
        ai_next_action TEXT,
        ai_risk VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 6. Colunas de token de acesso e refresh do Google nos usuários
    await pool.query(`
      ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS google_refresh_token TEXT;
    `);
    await pool.query(`
      ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS google_access_token TEXT;
    `);
    await pool.query(`
      ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS google_token_expires_at TIMESTAMP;
    `);

    // 7. Tabela de notificações persistidas
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notificacoes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 8. Coluna de tipo de interação em client_interactions
    await pool.query(`
      ALTER TABLE client_interactions ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'note';
    `);

    // 8.1 Coluna de resumo global de IA nos clientes
    await pool.query(`
      ALTER TABLE clients ADD COLUMN IF NOT EXISTS ai_summary TEXT;
    `);

    // 9. Tabela de logs de auditoria (Audit Trail)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
        user_email VARCHAR(255) NOT NULL,
        action VARCHAR(255) NOT NULL,
        details TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 10. Tabela de produtos cadastrados (Televisão, Digital, Projetos Especiais)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS produtos (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        categoria VARCHAR(50) NOT NULL CHECK (categoria IN ('televisao', 'digital', 'especiais')),
        ativo BOOLEAN DEFAULT TRUE,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(nome, categoria)
      );
    `);

    // Seed inicial dos produtos, se a tabela estiver vazia
    const prodCount = await pool.query("SELECT COUNT(*) FROM produtos");
    if (parseInt(prodCount.rows[0].count) === 0) {
      const tvProducts = [
        'A Tarde É Sua','A Tarde É Sua - 1ª Edição','American Zone','Bola Na Rede',
        'Brasil Do Povo','É Notícia','Fica Com A Gente','Leitura Dinâmica','Mega Sonho',
        'Nordeste Do Povo','Operação De Risco','Para Aqui','Programmatic TV','RedeTV! News',
        'RedeTV! Notícias - 1ª Edição','RedeTV! Notícias - 2ª Edição','RJ Do Povo',
        'Rodada De Negócios','Rotativo','Sensacional','Superpop','TV Fama'
      ];
      const digitalProducts = [
        'Esportes','Google Partner Sales','Pegadinhas','RedeTV! Noticias','Social Media','Soft News'
      ];
      const specialProjects = ['Bezona','Eleições 2026','Liga Monstro','Liga Universitária'];

      for (const nome of tvProducts)
        await pool.query("INSERT INTO produtos (nome, categoria) VALUES ($1, 'televisao') ON CONFLICT DO NOTHING", [nome]);
      for (const nome of digitalProducts)
        await pool.query("INSERT INTO produtos (nome, categoria) VALUES ($1, 'digital') ON CONFLICT DO NOTHING", [nome]);
      for (const nome of specialProjects)
        await pool.query("INSERT INTO produtos (nome, categoria) VALUES ($1, 'especiais') ON CONFLICT DO NOTHING", [nome]);
    }

    // 11. Coluna de alocação de valores por produto e anexos nas oportunidades
    await pool.query(`
      ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS product_values JSONB DEFAULT '{}'::jsonb;
      ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;
    `);

    // 12. Garantia da tabela proposal_templates e suas colunas
    await pool.query(`
      CREATE TABLE IF NOT EXISTS proposal_templates (
        id text primary key,
        product text,
        title text not null,
        subtitle text,
        horario text,
        periodo text,
        pdf_file_name text,
        pdf_data_uri text,
        xls_file_name text,
        xls_data_uri text,
        created_at timestamptz not null default now()
      );
      ALTER TABLE proposal_templates ADD COLUMN IF NOT EXISTS xls_file_name text;
      ALTER TABLE proposal_templates ADD COLUMN IF NOT EXISTS xls_data_uri text;
    `);

    // 13. Coluna ativo para controle de acesso de usuários
    await pool.query(`
      ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE;
    `);

    // 14. Coluna de anexos em oportunidades
    await pool.query(`
      ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;
    `);

    // 15. Suporte a metas por Key Account e flexibilização da coluna segmento
    await pool.query(`
      CREATE TABLE IF NOT EXISTS metas (
        id text primary key,
        segmento text,
        client_id text,
        periodo text not null,
        valor numeric(14,2) not null default 0,
        created_at timestamptz not null default now()
      );
      ALTER TABLE metas ALTER COLUMN segmento DROP NOT NULL;
      ALTER TABLE metas ADD COLUMN IF NOT EXISTS client_id TEXT;
      ALTER TABLE metas DROP CONSTRAINT IF EXISTS metas_segmento_periodo_key;
      CREATE UNIQUE INDEX IF NOT EXISTS idx_metas_seg_per ON metas (segmento, periodo) WHERE client_id IS NULL;
      CREATE UNIQUE INDEX IF NOT EXISTS idx_metas_cli_per ON metas (client_id, periodo) WHERE client_id IS NOT NULL;
    `);

    // 16. Suporte a autenticação local por e-mail e senha corporativa e controle de versão de sessão
    await pool.query(`
      ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS senha_hash TEXT;
      ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS token_version INTEGER DEFAULT 1;
      ALTER TABLE usuarios ALTER COLUMN google_id DROP NOT NULL;
    `);

    // Sincronização retroativa de usuários executivos sem vínculo
    const unlinkedExecs = await pool.query(
      "SELECT id, nome FROM usuarios WHERE perfil = 'executivo' AND (executivo_id IS NULL OR executivo_id = '')"
    );
    for (const user of unlinkedExecs.rows) {
      const match = await pool.query("SELECT id FROM executivos WHERE LOWER(TRIM(nome)) = LOWER(TRIM($1))", [user.nome]);
      let execId;
      if (match.rows.length > 0) {
        execId = match.rows[0].id;
      } else {
        execId = `e_${user.id}`;
        await pool.query(
          `INSERT INTO executivos (id, nome) VALUES ($1, $2)
           ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome`,
          [execId, user.nome]
        );
      }
      await pool.query(
        "UPDATE usuarios SET executivo_id = $1 WHERE id = $2",
        [execId, user.id]
      );
      console.log(`[SYNC] Usuário executivo "${user.nome}" vinculado ao executivo "${execId}".`);
    }

    // 17. Chave estrangeira de executivo em oportunidades
    await pool.query(`
      ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS executivo_id VARCHAR(255) REFERENCES executivos(id) ON UPDATE CASCADE ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_opportunities_executivo_id ON opportunities(executivo_id);
      CREATE INDEX IF NOT EXISTS idx_opportunities_executivo ON opportunities(executivo);
      UPDATE opportunities o SET executivo_id = e.id FROM executivos e WHERE LOWER(TRIM(o.executivo)) = LOWER(TRIM(e.nome)) AND o.executivo_id IS NULL;
    `);

    // 18. Índices para busca e paginação de clientes e contatos ([ARQ-002])
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_clients_nome_fantasia ON clients (nome_fantasia);
      CREATE INDEX IF NOT EXISTS idx_clients_razao_social ON clients (razao_social);
      CREATE INDEX IF NOT EXISTS idx_clients_type ON clients (type);
      CREATE INDEX IF NOT EXISTS idx_clients_segmento ON clients (segmento);
      CREATE INDEX IF NOT EXISTS idx_contacts_client_id ON contacts (client_id);
      CREATE INDEX IF NOT EXISTS idx_contacts_name ON contacts (name);
      CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts (email);
    `);

    // 19. Flexibilização de campos no cadastro de clientes (apenas nome_fantasia é obrigatório)
    await pool.query(`
      ALTER TABLE clients ALTER COLUMN razao_social DROP NOT NULL;
    `);

    // 20. Controle de senha temporária e exigência de cadastro de nova senha definitiva
    await pool.query(`
      ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS deve_trocar_senha BOOLEAN DEFAULT FALSE;
    `);

    // 21. Tabela de Notícias de Inteligência de Mercado & Radar Comercial
    await pool.query(`
      CREATE TABLE IF NOT EXISTS market_news (
        id text primary key,
        data_publicacao date not null,
        fonte text not null,
        url text not null,
        titulo_original text not null,
        segmento_crm text not null,
        anunciante_mencionado text,
        agencia_mencionada text,
        resumo_executivo text not null,
        gatilho_comercial text not null,
        acao_sugerida text,
        tags text[] default '{}',
        created_at timestamptz not null default now()
      );
      CREATE INDEX IF NOT EXISTS idx_market_news_data ON market_news (data_publicacao DESC);
      CREATE INDEX IF NOT EXISTS idx_market_news_seg ON market_news (segmento_crm);
    `);

    // Seed inicial de notícias do Radar de Mercado se tabela estiver vazia
    const countNewsRes = await pool.query("SELECT COUNT(*) FROM market_news");
    if (parseInt(countNewsRes.rows[0].count, 10) === 0) {
      const initialNews = [
        {
          id: "noticia_0810_picpay_drum",
          data_publicacao: "2026-10-08",
          fonte: "Meio & Mensagem",
          url: "https://www.meioemensagem.com.br/comunicacao/drum-vence-concorrencia-pelo-picpay",
          titulo_original: "Drum vence concorrência e assume a conta de comunicação do PicPay",
          segmento_crm: "Financeiro e Seguros",
          anunciante_mencionado: "PicPay",
          agencia_mencionada: "Drum (Omnicom Media Group)",
          resumo_executivo: "A agência Drum, parte do Omnicom Media, venceu a concorrência pela conta de comunicação do PicPay. A agência contará com uma estrutura dedicada para atender ao novo cliente, que era anteriormente atendido pela BETC Havas.",
          gatilho_comercial: "Troca de agência de grande player financeiro com verba pesada e montagem de nova operação de atendimento.",
          acao_sugerida: "Agendar reunião de alinhamento com a diretoria de mídia da nova agência Drum para apresentar formatos institucionais do RedeTV! News e projetos de finanças pessoais.",
          tags: ["Financeiro e Seguros", "Troca de Agência", "Concorrência", "PicPay", "Drum"]
        },
        {
          id: "noticia_0810_gol_druid",
          data_publicacao: "2026-10-08",
          fonte: "PropMark",
          url: "https://propmark.com.br/agencias/druid-cria-unidade-feature-e-conquista-conta-da-gol/",
          titulo_original: "Druid cria unidade Feature e conquista a conta da GOL Linhas Aéreas",
          segmento_crm: "Turismo e Serviços",
          anunciante_mencionado: "GOL Linhas Aéreas / Smiles / GOLLOG",
          agencia_mencionada: "Druid Feature",
          resumo_executivo: "A agência Druid anunciou a criação da Druid Feature, unidade voltada para inovação e tecnologia, e estreou com a conquista da conta de redes sociais da GOL Linhas Aéreas, Smiles e GOLLOG após processo de concorrência.",
          gatilho_comercial: "Troca de agência para a divisão de conteúdo e ativação de fidelidade das marcas do grupo GOL.",
          acao_sugerida: "Fazer aproximação comercial com a equipe de marketing da Smiles e da Druid para projetos de conteúdo de turismo e passagens em programas de variedades da RedeTV!.",
          tags: ["Turismo e Serviços", "Troca de Agência", "Concorrência", "GOL", "Smiles"]
        },
        {
          id: "noticia_0810_unidas_rosh",
          data_publicacao: "2026-10-06",
          fonte: "Grandes Nomes da Propaganda",
          url: "https://grandesnomesdapropaganda.com.br/agencias/rosh-conquista-a-conta-da-unidas/",
          titulo_original: "Rosh conquista a conta da Unidas e assume estratégia de mídia e branding",
          segmento_crm: "Automotivo",
          anunciante_mencionado: "Unidas (Locação de Veículos e Frotas)",
          agencia_mencionada: "Rosh",
          resumo_executivo: "A Unidas escolheu a Rosh como sua nova agência para comandar a estratégia integrada de comunicação, englobando branding, campanhas de massa, mídia offline, marketing de influência e gestão de comunidade.",
          gatilho_comercial: "Definição de nova agência para gigante de locação e mobilidade com retomada de campanhas e mídia.",
          acao_sugerida: "Apresentar pacote comercial nos telejornais e no programa Operação de Risco para a liderança de mídia da Rosh e marketing da Unidas.",
          tags: ["Automotivo", "Troca de Agência", "Concorrência", "Unidas", "Mobilidade"]
        },
        {
          id: "noticia_0810_denza_samy",
          data_publicacao: "2026-10-05",
          fonte: "Meio & Mensagem",
          url: "https://www.meioemensagem.com.br/comunicacao/danca-das-contas-byd-bling-e-outras",
          titulo_original: "Samy assume a conta da Denza, marca premium do ecossistema BYD no Brasil",
          segmento_crm: "Automotivo",
          anunciante_mencionado: "Denza (BYD Brasil)",
          agencia_mencionada: "Samy Alliance",
          resumo_executivo: "A agência Samy assumiu a operação de comunicação da Denza, divisão premium de luxo do ecossistema BYD, focando no posicionamento da marca e no lançamento do ecossistema de recarga rápida e modelos de ponta.",
          gatilho_comercial: "Chegada de nova marca de luxo no mercado automotivo com verba de lançamento e awareness qualificado.",
          acao_sugerida: "Apresentar cotas nos programas de alta renda e atrações noturnas da RedeTV!, destacando a tecnologia dos eletrificados de luxo.",
          tags: ["Automotivo", "Nova Conta", "Eletrificados", "BYD", "Denza", "Luxo"]
        },
        {
          id: "noticia_0710_nestle_nba",
          data_publicacao: "2026-10-07",
          fonte: "Meio & Mensagem",
          url: "https://www.meioemensagem.com.br/marketing/nestle-e-nba-se-juntam-em-acordo-global",
          titulo_original: "Nestlé e NBA se juntam em acordo global para as marcas Nescau, Milo e Nesquik",
          segmento_crm: "Alimentos",
          anunciante_mencionado: "Nestlé Brasil",
          agencia_mencionada: "Ogilvy / Dentsu",
          resumo_executivo: "A Nestlé oficializou um acordo plurianual global com a NBA contemplando 21 mercados, incluindo o Brasil. A parceria engloba Nescau, Milo e Nesquik em grandes campanhas de mídia, promoções no varejo e ativações de basquete.",
          gatilho_comercial: "Nova grande plataforma de comunicação e patrocínio esportivo com previsão de forte apoio de mídia nacional.",
          acao_sugerida: "Apresentar cotas de integração esportiva nos telejornais e programas de entretenimento jovem da RedeTV!, conectando o apelo de basquete e estilo de vida da marca Nescau.",
          tags: ["Alimentos", "Patrocínio Esportivo", "Campanha", "Nescau", "Nestlé"]
        },
        {
          id: "noticia_0710_vivo_disney",
          data_publicacao: "2026-10-07",
          fonte: "PropMark",
          url: "https://propmark.com.br/anunciantes/vivo-e-disney-apresentam-campanha-para-chegada-de-toy-story-5-ao-streaming/",
          titulo_original: "Vivo e Disney+ apresentam campanha para chegada de Toy Story 5 ao streaming",
          segmento_crm: "Tech e E-Commerce",
          anunciante_mencionado: "Vivo (Telefônica Brasil)",
          agencia_mencionada: "Polvo / Galeria",
          resumo_executivo: "A Vivo e o Disney+ lançaram campanha publicitária celebrando a estreia de Toy Story 5 e promovendo os pacotes convergentes Vivo Total. A divulgação é multiplataforma, abrangendo TV aberta, TV paga e canais digitais.",
          gatilho_comercial: "Grande esforço conjunto de mídia com foco no consumidor residencial e famílias em todo o país.",
          acao_sugerida: "Ofertar cotas nos intervalos comerciais nobres do horário nobre e no programa Operação de Risco para amplificação de audiência de massa.",
          tags: ["Tech e E-Commerce", "Telecom", "Campanha Multicanal", "Vivo", "Disney"]
        },
        {
          id: "noticia_0610_sephora_juliette",
          data_publicacao: "2026-10-06",
          fonte: "Meio & Mensagem",
          url: "https://www.meioemensagem.com.br/comunicacao/sephora-anuncia-juliette-como-embaixadora-do-baile-de-2027",
          titulo_original: "Sephora anuncia Juliette como embaixadora do Baile de Halloween",
          segmento_crm: "Higiene e Beleza",
          anunciante_mencionado: "Sephora Brasil",
          agencia_mencionada: "Hood / Publicis",
          resumo_executivo: "A Sephora confirmou Juliette como embaixadora da sétima edição de seu Baile de Halloween. A artista protagonizará uma websérie para as redes sociais da marca com foco em beleza e maquiagem, mobilizando os maiores patrocinadores do setor de cosméticos.",
          gatilho_comercial: "Grande projeto de experiência e branding no setor de beleza com copatrocínio de dezenas de marcas de cosméticos.",
          acao_sugerida: "Mapear as marcas patrocinadoras do projeto Sephora para oferecer pacotes de cobertura especial e matérias no programa TV Fama.",
          tags: ["Higiene e Beleza", "Cosméticos", "Influência", "Sephora", "Eventos"]
        },
        {
          id: "noticia_0610_sabin_wmcann",
          data_publicacao: "2026-10-06",
          fonte: "PropMark",
          url: "https://propmark.com.br/anunciantes/sabin-lanca-campanha-prevencao-sem-vergonha-com-a-wmccann/",
          titulo_original: "Sabin lança campanha Prevenção sem Vergonha com a WMcCann",
          segmento_crm: "Saúde e Bem-Estar",
          anunciante_mencionado: "Grupo Sabin Diagnóstico e Saúde",
          agencia_mencionada: "WMcCann",
          resumo_executivo: "O Grupo Sabin colocou no ar a campanha \"Prevenção sem Vergonha\", desenvolvida pela WMcCann, com o objetivo de incentivar o cuidado com a saúde e a realização de exames preventivos regulares ao longo do Outubro Rosa e Novembro Azul.",
          gatilho_comercial: "Campanha institucional de conscientização com plano de mídia voltado ao público adulto e sênior.",
          acao_sugerida: "Apresentar oportunidades de apoio e patrocínio no quadro de saúde dos telejornais da emissora.",
          tags: ["Saúde e Bem-Estar", "Campanha Institucional", "Sabin", "WMcCann"]
        },
        {
          id: "noticia_0510_outback_korea",
          data_publicacao: "2026-10-07",
          fonte: "Meio & Mensagem",
          url: "https://www.meioemensagem.com.br/marketing/outback-entra-na-cultura-coreana-com-cardapio-especial",
          titulo_original: "Outback entra na cultura coreana com novo cardápio especial e campanha nacional",
          segmento_crm: "Alimentos",
          anunciante_mencionado: "Outback Steakhouse (Bloomin Brands)",
          agencia_mencionada: "Ampfy",
          resumo_executivo: "A rede Outback Steakhouse iniciou a veiculação de sua campanha nacional \"Outbac-K\", celebrando os sabores da Coreia com receitas exclusivas e plano de mídia massivo com influenciadores e formatos de vídeo.",
          gatilho_comercial: "Lançamento de produto sazonal com investimento concentrado de curto e médio prazo.",
          acao_sugerida: "Oferecer inserções de merchandising e ações especiais nos programas de entretenimento da RedeTV! direcionadas ao público jovem e jovem-adulto.",
          tags: ["Alimentos", "Lançamento de Produto", "Campanha", "Outback", "Gastronomia"]
        },
        {
          id: "noticia_0510_bling_artplan",
          data_publicacao: "2026-10-01",
          fonte: "PropMark",
          url: "https://propmark.com.br/agencias/artplan-assume-conta-do-bling-e-apresenta-nova-campanha-da-marca/",
          titulo_original: "Artplan assume conta do Bling e apresenta nova campanha da marca",
          segmento_crm: "Tech e E-Commerce",
          anunciante_mencionado: "Bling (Locaweb Company)",
          agencia_mencionada: "Artplan",
          resumo_executivo: "O sistema de gestão Bling, da Locaweb Company, escolheu a Artplan como nova agência de publicidade e lançou a campanha \"Bling. Tem tudo pra dar certo\", visando expandir a marca entre micro e pequenas empresas em todo o país.",
          gatilho_comercial: "Contratação de agência de grande porte para estratégia de branding em massa de software de gestão para empreendedores.",
          acao_sugerida: "Apresentar à Artplan formatos no Dinheiro na Conta e inserções na grade diária para falar com o público microempreendedor.",
          tags: ["Tech e E-Commerce", "Bling", "Locaweb", "Artplan", "PMEs"]
        },
        {
          id: "noticia_0510_kopenhagen_smurfs",
          data_publicacao: "2026-10-05",
          fonte: "PropMark",
          url: "https://propmark.com.br/anunciantes/kopenhagen-lanca-campanha-para-nova-linha-de-produtos-dos-smurfs/",
          titulo_original: "Kopenhagen lança campanha para nova linha de produtos dos Smurfs",
          segmento_crm: "Alimentos",
          anunciante_mencionado: "Kopenhagen (Grupo CRM / Nestlé)",
          agencia_mencionada: "WMcCann",
          resumo_executivo: "A Kopenhagen colocou no ar campanha criada pela WMcCann para promover sua linha de produtos licenciados dos Smurfs para o Dia das Crianças, com storytelling corporativo e ativações em lojas físicas e e-commerce.",
          gatilho_comercial: "Campanha de impulso de vendas e branding com presença de mídia massiva pré-datas comemorativas.",
          acao_sugerida: "Apresentar formatos de branded content gastronômico e vinhetas nos programas matinais e vespertinos.",
          tags: ["Alimentos", "Campanha", "Kopenhagen", "Varejo", "Licenciamento"]
        },
        {
          id: "noticia_0510_fanta_halloween",
          data_publicacao: "2026-10-05",
          fonte: "PropMark",
          url: "https://propmark.com.br/anunciantes/fanta-transforma-anuncios-de-streaming-em-jump-scares-no-halloween/",
          titulo_original: "Fanta transforma anúncios de streaming em jump scares no Halloween",
          segmento_crm: "Bebidas",
          anunciante_mencionado: "Coca-Cola Brasil (Fanta)",
          agencia_mencionada: "WPP Open X / VML / Ogilvy",
          resumo_executivo: "A Fanta lançou o projeto \"Jump Scares\", iniciativa que transforma anúncios em plataformas de streaming e vídeo em experiências de suspense e sustos digitais durante a temporada de Halloween.",
          gatilho_comercial: "A maior ativação anual da marca com verba expressiva alocada em mídia audiovisual de impacto.",
          acao_sugerida: "Ofertar inserções comerciais exclusivas em programas de alta afinidade com o público jovem e gamer da RedeTV!.",
          tags: ["Bebidas", "Campanha Nacional", "Fanta", "Coca-Cola"]
        }
      ];




      for (const item of initialNews) {
        await pool.query(
          `INSERT INTO market_news (id, data_publicacao, fonte, url, titulo_original, segmento_crm, anunciante_mencionado, agencia_mencionada, resumo_executivo, gatilho_comercial, acao_sugerida, tags)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           ON CONFLICT (id) DO NOTHING`,
          [
            item.id,
            item.data_publicacao,
            item.fonte,
            item.url,
            item.titulo_original,
            item.segmento_crm,
            item.anunciante_mencionado,
            item.agencia_mencionada,
            item.resumo_executivo,
            item.gatilho_comercial,
            item.acao_sugerida,
            item.tags
          ]
        );
      }
      console.log(`[SEED] ${initialNews.length} notícias iniciais de inteligência de mercado inseridas com sucesso.`);
    }

    // 22. Tabela do Pipeline Estratégico (Top 30 por Segmento)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pipeline_estrategico (
        id SERIAL PRIMARY KEY,
        segmento VARCHAR(100) NOT NULL,
        tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('mercado', 'estrategico')),
        posicao INTEGER NOT NULL CHECK (posicao >= 1 AND posicao <= 15),
        client_id VARCHAR(255) REFERENCES clients(id) ON DELETE SET NULL,
        nome_marca VARCHAR(255) NOT NULL,
        holding VARCHAR(255),
        holding_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
        sub_marcas TEXT[] DEFAULT '{}',
        agencia_nome VARCHAR(255),
        agencia_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
        racional TEXT,
        ultima_reuniao TEXT,
        investimento_estimado NUMERIC DEFAULT 0,
        iniciativas JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      ALTER TABLE pipeline_estrategico DROP CONSTRAINT IF EXISTS pipeline_estrategico_posicao_check;
      ALTER TABLE pipeline_estrategico DROP CONSTRAINT IF EXISTS pipeline_estrategico_segmento_tipo_posicao_key;
      ALTER TABLE pipeline_estrategico DROP CONSTRAINT IF EXISTS pipeline_estrategico_agencia_id_fkey;
      ALTER TABLE pipeline_estrategico DROP CONSTRAINT IF EXISTS pipeline_estrategico_holding_id_fkey;
      ALTER TABLE pipeline_estrategico ALTER COLUMN posicao DROP NOT NULL;
      ALTER TABLE pipeline_estrategico ALTER COLUMN posicao SET DEFAULT 1;
      ALTER TABLE pipeline_estrategico ADD COLUMN IF NOT EXISTS holding_id TEXT;
      ALTER TABLE pipeline_estrategico ADD COLUMN IF NOT EXISTS agencia_id TEXT;
      ALTER TABLE pipeline_estrategico ADD COLUMN IF NOT EXISTS investimento_estimado NUMERIC DEFAULT 0;
      CREATE UNIQUE INDEX IF NOT EXISTS idx_pipe_strat_seg_tipo_marca ON pipeline_estrategico (segmento, tipo, nome_marca);
      CREATE INDEX IF NOT EXISTS idx_pipeline_estrategico_seg ON pipeline_estrategico (segmento);
    `);

    // Seed inicial para Farmacêutico e Higiene se tabela estiver vazia
    const countStratRes = await pool.query("SELECT COUNT(*) FROM pipeline_estrategico");
    if (parseInt(countStratRes.rows[0].count, 10) === 0) {
      const initialStrat = [
        {
          segmento: "Farmacêutico & Higiene",
          tipo: "mercado",
          posicao: 1,
          nome_marca: "Hypera Pharma",
          holding: "Grupo Hypera",
          sub_marcas: ["Neo Química", "Benegrip", "Engov", "Epocler"],
          agencia_nome: "Mynd8 / In-house",
          racional: "Líder de investimentos de farma em TV aberta. Merchandising rotativo diário.",
          ultima_reuniao: "Reunião em 14/10 com Ernesto Piva na sede da Hypera. Alinhado retorno positivo das ações de Benegrip no 'A Tarde é Sua'. Solicitado novo plano para o 1º trimestre de 2027.",
          iniciativas: JSON.stringify([
            { id: "ini_1", text: "Apresentar projeto de patrocínio de Verão para Engov", done: false, date: "24/10" },
            { id: "ini_2", text: "Enviar relatório pós-venda consolidado de audiência", done: true, date: "15/10" }
          ])
        },
        {
          segmento: "Farmacêutico & Higiene",
          tipo: "mercado",
          posicao: 2,
          nome_marca: "EMS Farmacêutica",
          holding: "Grupo NC",
          sub_marcas: ["EMS Genéricos", "Gerovital", "Calman"],
          agencia_nome: "We / Fbiz",
          racional: "Líder em genéricos com forte presença institucional.",
          ultima_reuniao: "Apresentação de proposta no valor de R$ 850.000 para cota anual de institucionais no RedeTV! News com a agência We.",
          iniciativas: JSON.stringify([
            { id: "ini_3", text: "Follow-up com Diretor de Mídia da agência We", done: false, date: "21/10" },
            { id: "ini_4", text: "Mapear Gerente de Produto de Gerovital", done: false, date: "28/10" }
          ])
        },
        {
          segmento: "Farmacêutico & Higiene",
          tipo: "mercado",
          posicao: 3,
          nome_marca: "Eurofarma",
          holding: "Eurofarma Lab.",
          sub_marcas: ["Lactulona", "Aspirina Prevent"],
          agencia_nome: "AlmapBBDO",
          racional: "Grande presença em consultórios e expansão em OTC.",
          ultima_reuniao: "Sem reuniões realizadas nos últimos 60 dias.",
          iniciativas: JSON.stringify([
            { id: "ini_5", text: "Descobrir contato do Diretor de Mídia na AlmapBBDO", done: false, date: "25/10" }
          ])
        },
        {
          segmento: "Farmacêutico & Higiene",
          tipo: "estrategico",
          posicao: 1,
          nome_marca: "Cimed Farmacêutica",
          holding: "Grupo Cimed",
          sub_marcas: ["Carmed", "Lavitan", "Dermafeme", "Ressaliv"],
          agencia_nome: "In-house (Direto)",
          racional: "Marca ágil e pop. Fit total com SuperPop e PodKasts digitais.",
          ultima_reuniao: "Alinhamento com Fernando Sodré sobre a renovação de Lavitan no 'A Tarde é Sua'. Apresentado estudo de audiência feminina jovem para a linha Carmed no SuperPop e PodKasts digitais.",
          iniciativas: JSON.stringify([
            { id: "ini_6", text: "Enviar desenho de cota integrada Carmed (SuperPop + TikTok RedeTV!)", done: false, date: "22/10" },
            { id: "ini_7", text: "Confirmar presença no evento de relacionamento de fim de ano", done: false, date: "05/11" }
          ])
        },
        {
          segmento: "Farmacêutico & Higiene",
          tipo: "estrategico",
          posicao: 2,
          nome_marca: "Ultrafarma",
          holding: "Grupo Sidney Oliveira",
          sub_marcas: ["Sidney Oliveira Vitaminas", "Linha Rahda"],
          agencia_nome: "Direto (Sidney Oliveira)",
          racional: "Fit histórico e resposta direta imediata em variedades.",
          ultima_reuniao: "Almoço comercial semanal na emissora. Contrato anual de rotativos e merchan diário 100% adimplente.",
          iniciativas: JSON.stringify([
            { id: "ini_8", text: "Renovação contratual do pacote anual 2027", done: false, date: "10/11" }
          ])
        },
        {
          segmento: "Farmacêutico & Higiene",
          tipo: "estrategico",
          posicao: 3,
          nome_marca: "Max Titanium / Supley",
          holding: "Grupo Supley",
          sub_marcas: ["Max Titanium", "Probiótica", "Dr. Peanut"],
          agencia_nome: "In-house / Digital",
          racional: "Nutrição esportiva. Perfeito para a NFL e programas de auditório.",
          ultima_reuniao: "Reunião remota via Teams com Mariany. Apresentadas cotas de intervalo e branded content nas transmissões da NFL e jornalismo esportivo.",
          iniciativas: JSON.stringify([
            { id: "ini_9", text: "Enviar tabela de audiência masculina da NFL RedeTV!", done: true, date: "16/10" },
            { id: "ini_10", text: "Cobrar retorno da aprovação da cota de patrocínio", done: false, date: "23/10" }
          ])
        }
      ];

      for (const item of initialStrat) {
        // Tenta vincular client_id automaticamente se existir cliente com nome parecido
        const clientMatch = await pool.query(
          "SELECT id FROM clients WHERE LOWER(TRIM(nome_fantasia)) ILIKE $1 OR LOWER(TRIM(razao_social)) ILIKE $1 LIMIT 1",
          [`%${item.nome_marca.split(" ")[0]}%`]
        );
        const resolvedClientId = clientMatch.rows[0]?.id || null;

        await pool.query(
          `INSERT INTO pipeline_estrategico 
           (segmento, tipo, posicao, client_id, nome_marca, holding, sub_marcas, agencia_nome, racional, ultima_reuniao, iniciativas)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (segmento, tipo, posicao) DO NOTHING`,
          [
            item.segmento,
            item.tipo,
            item.posicao,
            resolvedClientId,
            item.nome_marca,
            item.holding,
            item.sub_marcas,
            item.agencia_nome,
            item.racional,
            item.ultima_reuniao,
            item.iniciativas
          ]
        );
      }
      console.log(`[SEED] ${initialStrat.length} marcas iniciais do Pipeline Estratégico inseridas.`);
    }

    // Garante valores de investimento estimado para o piloto de Farmacêutico & Higiene
    await pool.query(`
      UPDATE pipeline_estrategico SET investimento_estimado = 45000000 WHERE nome_marca ILIKE '%Hypera%' AND (investimento_estimado IS NULL OR investimento_estimado = 0);
      UPDATE pipeline_estrategico SET investimento_estimado = 28000000 WHERE nome_marca ILIKE '%EMS%' AND (investimento_estimado IS NULL OR investimento_estimado = 0);
      UPDATE pipeline_estrategico SET investimento_estimado = 18000000 WHERE nome_marca ILIKE '%Eurofarma%' AND (investimento_estimado IS NULL OR investimento_estimado = 0);
      UPDATE pipeline_estrategico SET investimento_estimado = 32000000 WHERE nome_marca ILIKE '%Cimed%' AND (investimento_estimado IS NULL OR investimento_estimado = 0);
      UPDATE pipeline_estrategico SET investimento_estimado = 22000000 WHERE nome_marca ILIKE '%Ultrafarma%' AND (investimento_estimado IS NULL OR investimento_estimado = 0);
      UPDATE pipeline_estrategico SET investimento_estimado = 12000000 WHERE nome_marca ILIKE '%Max Titanium%' AND (investimento_estimado IS NULL OR investimento_estimado = 0);
    `);

    // 21. Tabela corporativa de propostas de valoração de mídia (Valoração Online & Med.IA Planner)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tabelas_propostas_midia (
        id VARCHAR(255) PRIMARY KEY,
        cliente VARCHAR(255) NOT NULL,
        agencia VARCHAR(255),
        projeto VARCHAR(255),
        usuario_criador VARCHAR(255),
        usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
        valor_total NUMERIC(15, 2) DEFAULT 0,
        desconto NUMERIC(5, 2) DEFAULT 0,
        grade_json JSONB NOT NULL,
        data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_propostas_midia_data ON tabelas_propostas_midia(data_criacao DESC);
      CREATE INDEX IF NOT EXISTS idx_propostas_midia_cliente ON tabelas_propostas_midia(LOWER(cliente));
    `);

    // 22. Tabela corporativa de catálogo e tabelas de preços de mídia (Rate Cards)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS media_rate_cards (
        id VARCHAR(255) PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        vigencia VARCHAR(100) NOT NULL,
        ativo BOOLEAN DEFAULT TRUE,
        dados_json JSONB NOT NULL,
        atualizado_por VARCHAR(255),
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_media_rate_cards_ativo ON media_rate_cards(ativo);
    `);

    console.log("Banco de dados inicializado: tabelas de interações, credenciais Google, notificações, logs de auditoria, produtos, alocações de oportunidades, inteligência de mercado e pipeline estratégico verificados.");
  } catch (err) {
    console.error("Erro ao inicializar o banco de dados:", err);
  }
};
initDb();

module.exports = { pool };
