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
          id: "noticia_01_almap_ipiranga",
          data_publicacao: "2026-10-06",
          fonte: "PropMark",
          url: "https://propmark.com.br/agencias/ipiranga-escolhe-almapbbdo-como-nova-agencia-de-publicidade/",
          titulo_original: "AlmapBBDO assume conta de publicidade da Ipiranga após concorrência",
          segmento_crm: "Petroquímica",
          anunciante_mencionado: "Ipiranga",
          agencia_mencionada: "AlmapBBDO",
          resumo_executivo: "A Ipiranga concluiu seu processo de concorrência e transferiu sua conta de publicidade para a AlmapBBDO. A agência será responsável por todo o planejamento criativo, campanhas institucionais e ações de varejo de combustíveis e conveniência (AmPm). O novo ciclo prevê forte investimento em alcance nacional e formatos de massa.",
          gatilho_comercial: "Troca de agência publicitária — janela aberta para apresentação de formatos proprietários e ações de merchandising na grade da RedeTV! antes do fechamento do split anual.",
          acao_sugerida: "Abordar a equipe de mídia da AlmapBBDO para apresentar as cotas do Operação de Risco e patrocínio esportivo.",
          tags: ["Ipiranga", "AlmapBBDO", "Petroquímica", "Troca de Agência", "Varejo"]
        },
        {
          id: "noticia_02_artplan_bling",
          data_publicacao: "2026-10-05",
          fonte: "PropMark",
          url: "https://propmark.com.br/agencias/artplan-assume-conta-do-bling-e-apresenta-nova-campanha-da-marca/",
          titulo_original: "Artplan conquista a conta de publicidade do Bling",
          segmento_crm: "Tech e E-Commerce",
          anunciante_mencionado: "Bling (Locaweb Company)",
          agencia_mencionada: "Artplan",
          resumo_executivo: "O sistema de gestão e e-commerce Bling, pertencente à Locaweb Company, escolheu a Artplan como sua nova agência de publicidade. O objetivo é expandir o conhecimento da marca entre pequenas e médias empresas em todo o território nacional. A estratégia contemplará mídia de massa e formatos de conteúdo corporativo.",
          gatilho_comercial: "Contratação de agência de grande porte para estratégia de branding em massa de software de gestão para empreendedores.",
          acao_sugerida: "Apresentar à Artplan formatos no Dinheiro na Conta e inserções na grade diária para falar com o público microempreendedor.",
          tags: ["Bling", "Locaweb", "Artplan", "Tech e E-Commerce", "SaaS", "PMEs"]
        },
        {
          id: "noticia_03_galeria_flutter",
          data_publicacao: "2026-10-03",
          fonte: "Meio & Mensagem",
          url: "https://www.meioemensagem.com.br/comunicacao/galeria-sera-a-agencia-principal-da-flutter-brazil-em-2026",
          titulo_original: "Galeria vence concorrência e assume a conta da Flutter Brazil (Betnacional e Betfair)",
          segmento_crm: "Apostas Esportivas",
          anunciante_mencionado: "Flutter Brazil (Betnacional / Betfair)",
          agencia_mencionada: "Galeria",
          resumo_executivo: "A Flutter Brazil unificou o atendimento de suas principais marcas (Betnacional e Betfair) na agência Galeria após longa concorrência. A conta prevê alocação maciça de mídia em transmissões esportivas e programas de entretenimento de alta audiência. O plano busca consolidar as marcas sob o novo ambiente regulatório do setor de apostas.",
          gatilho_comercial: "Definição de nova agência de longo prazo para as maiores operadoras de apostas do país com verba pesada em TV aberta e esportes.",
          acao_sugerida: "Levar à Galeria pacotes de patrocínio de transmissões esportivas e branded content no entretenimento popular.",
          tags: ["Flutter Brazil", "Betnacional", "Betfair", "Galeria", "Apostas Esportivas", "Futebol"]
        },
        {
          id: "noticia_04_leroy_cmo",
          data_publicacao: "2026-10-02",
          fonte: "Meio & Mensagem",
          url: "https://www.meioemensagem.com.br/gente/carolina-braune-assume-como-cmo-da-leroy-merlin-brasil",
          titulo_original: "Carolina Braune assume como Chief Marketing Officer da Leroy Merlin Brasil",
          segmento_crm: "Construção, Imobiliário e Decoração",
          anunciante_mencionado: "Leroy Merlin",
          agencia_mencionada: "N/A",
          resumo_executivo: "A Leroy Merlin Brasil anunciou Carolina Braune como sua nova CMO para liderar branding, retail media e experiência omnichannel. A executiva assume com a missão de renovar a presença da varejista em campanhas de reformas, sazonalidades e projetos de casa. A mudança indica revisão das parcerias e cronogramas de mídia do varejo para o fim de ano.",
          gatilho_comercial: "Nova CMO contratada — oportunidade para agendar reunião de apresentação institucional e propor projetos temáticos de casa e reforma.",
          acao_sugerida: "Solicitar reunião de apresentação com a assessoria da nova CMO para projetos de merchandising de reforma e casa no A Tarde É Sua.",
          tags: ["Leroy Merlin", "Carolina Braune", "CMO", "Construção, Imobiliário e Decoração", "Varejo"]
        },
        {
          id: "noticia_05_akm_neutrox",
          data_publicacao: "2026-10-01",
          fonte: "PropMark",
          url: "https://propmark.com.br/agencias/akm-e-a-nova-agencia-de-comunicacao-da-neutrox/",
          titulo_original: "Neutrox escolhe AKM como nova parceira de comunicação após concorrência",
          segmento_crm: "Higiene e Beleza",
          anunciante_mencionado: "Neutrox (Flora)",
          agencia_mencionada: "AKM",
          resumo_executivo: "A marca de cuidados capilares Neutrox, do Grupo Flora, selecionou a AKM para liderar suas estratégias de comunicação, ativações e mídia. O movimento visa acelerar a penetração da marca em praças regionais e canais populares com forte apelo visual. A campanha de verão é a primeira grande entrega prevista no escopo.",
          gatilho_comercial: "Troca de agência e preparação para campanha de verão de bens de consumo populares de higiene.",
          acao_sugerida: "Enviar proposta de ativações para a temporada de verão em programas de variedades populares da emissora.",
          tags: ["Neutrox", "Flora", "AKM", "Higiene e Beleza", "Campanha de Verão"]
        },
        {
          id: "noticia_06_porto_cmo",
          data_publicacao: "2026-09-29",
          fonte: "Meio & Mensagem",
          url: "https://www.meioemensagem.com.br/gente/oliver-haider-e-promovido-a-cmo-do-grupo-porto",
          titulo_original: "Oliver Haider é promovido a Diretor de Marketing do Grupo Porto",
          segmento_crm: "Financeiro e Seguros",
          anunciante_mencionado: "Grupo Porto",
          agencia_mencionada: "N/A",
          resumo_executivo: "O Grupo Porto oficializou a promoção de Oliver Haider à Diretoria de Marketing da holding. O executivo assume a missão de acelerar o ecossistema que integra seguros, serviços financeiros, Porto Saúde e Porto Bank. A nova gestão reforçará investimentos em TV e patrocínios de relevância comunitária e segurança no trânsito.",
          gatilho_comercial: "Nova liderança de marketing em grande conglomerado financeiro/segurador com apetite para programas de serviços e trânsito.",
          acao_sugerida: "Agendar café de relacionamento com Oliver Haider destacando a audiência qualificada das atrações jornalísticas e prestação de serviços.",
          tags: ["Grupo Porto", "Oliver Haider", "Financeiro e Seguros", "Liderança", "Seguros"]
        },
        {
          id: "noticia_07_monks_ype",
          data_publicacao: "2026-09-27",
          fonte: "PropMark",
          url: "https://propmark.com.br/agencias/monks-e-a-nova-agencia-digital-da-ype/",
          titulo_original: "Monks assume gestão de mídia e estratégia digital da Ypê",
          segmento_crm: "Higiene e Beleza",
          anunciante_mencionado: "Ypê (Química Amparo)",
          agencia_mencionada: "Monks",
          resumo_executivo: "A Química Amparo entregou à Monks o escopo de mídia e estratégia criativa para a marca Ypê. A marca busca integrar mais estreitamente suas ações de TV tradicional com crossmedia e ativações digitais. A revisão da estratégia ocorre às vésperas do planejamento anual de 2027.",
          gatilho_comercial: "Nova agência gerindo mídia de gigante de consumo massivo — oportunidade de crossmedia TV + Digital.",
          acao_sugerida: "Apresentar pacotes integrados que combinam TV linear com distribuição digital e menções nas redes sociais dos talentos da casa.",
          tags: ["Ypê", "Química Amparo", "Monks", "Higiene e Beleza", "Crossmedia"]
        },
        {
          id: "noticia_08_midea_carrier",
          data_publicacao: "2026-09-25",
          fonte: "Meio & Mensagem",
          url: "https://www.meioemensagem.com.br/comunicacao/danca-das-contas-midea-carrier-natura-e-outros",
          titulo_original: "Jotacom conquista a conta de comunicação da Midea Carrier no Brasil",
          segmento_crm: "Eletro-Eletrônicos",
          anunciante_mencionado: "Midea Carrier",
          agencia_mencionada: "Jotacom",
          resumo_executivo: "A Midea Carrier selecionou a Jotacom como sua nova agência de comunicação integrada no Brasil. O escopo abrange o lançamento de novas linhas de ar-condicionado residencial e eletrodomésticos inteligentes para a temporada de verão. A marca planeja intensificar presença em mídias de alta visibilidade e programas vespertinos.",
          gatilho_comercial: "Conquista de conta às vésperas da temporada de alta demanda (verão) para eletrodomésticos e climatização.",
          acao_sugerida: "Ofertar cotas sazonais de verão com inserções testemunhais na grade vespertina.",
          tags: ["Midea Carrier", "Jotacom", "Eletro-Eletrônicos", "Climatização", "Verão"]
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

    console.log("Banco de dados inicializado: tabelas de interações, credenciais Google, notificações, logs de auditoria, produtos, alocações de oportunidades e inteligência de mercado verificados.");
  } catch (err) {
    console.error("Erro ao inicializar o banco de dados:", err);
  }
};
initDb();

module.exports = { pool };
