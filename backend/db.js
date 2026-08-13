// Conexão com o Postgres. Lê DATABASE_URL do ambiente — já está definida
// no docker-compose.yml do projeto:
//   postgresql://postgres:redetv@db:5432/crm_redetv
const { Pool } = require("pg");

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

    // 11. Coluna de alocação de valores por produto nas oportunidades
    await pool.query(`
      ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS product_values JSONB DEFAULT '{}'::jsonb;
    `);

    // Sincronização retroativa de usuários executivos sem vínculo
    const unlinkedExecs = await pool.query(
      "SELECT id, nome FROM usuarios WHERE perfil = 'executivo' AND (executivo_id IS NULL OR executivo_id = '')"
    );
    for (const user of unlinkedExecs.rows) {
      const execId = `e_${user.id}`;
      await pool.query(
        `INSERT INTO executivos (id, nome) VALUES ($1, $2)
         ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome`,
        [execId, user.nome]
      );
      await pool.query(
        "UPDATE usuarios SET executivo_id = $1 WHERE id = $2",
        [execId, user.id]
      );
      console.log(`[SYNC] Usuário executivo "${user.nome}" vinculado retroativamente ao executivo "${execId}".`);
    }

    console.log("Banco de dados inicializado: tabelas de interações, credenciais Google, notificações, logs de auditoria, produtos e alocações de oportunidades verificados.");
  } catch (err) {
    console.error("Erro ao inicializar o banco de dados:", err);
  }
};
initDb();

module.exports = { pool };
