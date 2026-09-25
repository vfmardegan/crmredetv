const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { pool } = require('./db');

async function importClientsFromCsv(csvFilePath) {
  if (!fs.existsSync(csvFilePath)) {
    console.error(`Erro: Arquivo "${csvFilePath}" não foi encontrado.`);
    process.exit(1);
  }

  console.log(`\n🚀 Iniciando importação de clientes a partir de: ${csvFilePath}\n`);

  const fileStream = fs.createReadStream(csvFilePath, { encoding: 'utf-8' });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let lineCount = 0;
  let headers = [];
  let insertedClients = 0;
  let updatedClients = 0;
  let insertedContacts = 0;
  let insertedLinks = 0;

  const agencyNameToIdMap = {};

  for await (const line of rl) {
    lineCount++;
    if (!line.trim()) continue;

    // Detecta delimitador (ponto e vírgula ou vírgula)
    const delimiter = line.includes(';') ? ';' : ',';
    const columns = line.split(delimiter).map(c => c.trim().replace(/^"|"$/g, ''));

    if (lineCount === 1) {
      headers = columns.map(h => h.toLowerCase().replace(/[^a-z0-9_]/g, ''));
      console.log('📋 Colunas identificadas:', headers.join(', '));
      continue;
    }

    const row = {};
    headers.forEach((h, idx) => {
      row[h] = columns[idx] || '';
    });

    const tipoRaw = row['tipo'] || row['type'] || 'Anunciante';
    const tipo = tipoRaw.toLowerCase().includes('ag') ? 'Agência' : 'Anunciante';
    const razaoSocial = row['razao_social'] || row['nome_fantasia'] || row['nome'];
    if (!razaoSocial) continue;

    const cnpj = row['cnpj'] || null;
    const nomeFantasia = row['nome_fantasia'] || razaoSocial;
    const codigoErp = row['codigo_erp'] || row['codigo'] || null;
    const segmento = row['segmento'] || 'Geral';
    const executivoEmail = row['executivo_email'] || row['executivo'] || null;
    const agenciaVinculada = row['agencia_vinculada_nome'] || row['agencia'] || null;
    const contatoNome = row['contato_nome'] || null;
    const contatoCargo = row['contato_cargo'] || null;
    const contatoEmail = row['contato_email'] || null;
    const contatoTelefone = row['contato_telefone'] || null;

    try {
      // 1. Verifica se a empresa já existe (por CNPJ ou Razão Social)
      let clientId = null;
      let existingRes;
      if (cnpj) {
        existingRes = await pool.query('SELECT id FROM clients WHERE cnpj = $1', [cnpj]);
      } else {
        existingRes = await pool.query('SELECT id FROM clients WHERE LOWER(razao_social) = LOWER($1)', [razaoSocial]);
      }

      if (existingRes.rows.length > 0) {
        clientId = existingRes.rows[0].id;
        await pool.query(
          `UPDATE clients SET razao_social = $1, nome_fantasia = $2, segmento = $3, codigo = COALESCE($4, codigo) WHERE id = $5`,
          [razaoSocial, nomeFantasia, segmento, codigoErp, clientId]
        );
        updatedClients++;
      } else {
        clientId = 'cli_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        await pool.query(
          `INSERT INTO clients (id, codigo, razao_social, cnpj, nome_fantasia, type, segmento)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [clientId, codigoErp, razaoSocial, cnpj, nomeFantasia, tipo, segmento]
        );
        insertedClients++;
      }

      if (tipo === 'Agência') {
        agencyNameToIdMap[razaoSocial.toLowerCase()] = clientId;
        agencyNameToIdMap[nomeFantasia.toLowerCase()] = clientId;
      }

      // 2. Associa com Executivo se e-mail fornecido
      if (executivoEmail) {
        const execRes = await pool.query(
          `SELECT executivo_id FROM usuarios WHERE LOWER(email) = LOWER($1) AND perfil = 'executivo'`,
          [executivoEmail]
        );
        if (execRes.rows.length > 0 && execRes.rows[0].executivo_id) {
          const execId = execRes.rows[0].executivo_id;
          await pool.query(
            `INSERT INTO carteira_key_accounts (executivo_id, client_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [execId, clientId]
          );
        }
      }

      // 3. Vínculo Agência <-> Anunciante
      if (tipo === 'Anunciante' && agenciaVinculada) {
        const agencyMatchRes = await pool.query(
          `SELECT id FROM clients WHERE type = 'Agência' AND (LOWER(razao_social) LIKE $1 OR LOWER(nome_fantasia) LIKE $1)`,
          [`%${agenciaVinculada.toLowerCase()}%`]
        );
        if (agencyMatchRes.rows.length > 0) {
          const agencyId = agencyMatchRes.rows[0].id;
          await pool.query(
            `INSERT INTO agency_links (agency_id, advertiser_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [agencyId, clientId]
          );
          insertedLinks++;
        }
      }

      // 4. Insere Contato se fornecido
      if (contatoNome) {
        const contactId = 'ct_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        await pool.query(
          `INSERT INTO contacts (id, client_id, name, cargo, email, celular)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [contactId, clientId, contatoNome, contatoCargo, contatoEmail, contatoTelefone]
        );
        insertedContacts++;
      }

      console.log(`✅ [${tipo}] ${razaoSocial} ${cnpj ? '(' + cnpj + ')' : ''}`);
    } catch (err) {
      console.error(`❌ Erro ao processar linha ${lineCount} (${razaoSocial}):`, err.message);
    }
  }

  console.log(`\n==================================================`);
  console.log(`🎉 IMPORTAÇÃO CONCLUÍDA COM SUCESSO!`);
  console.log(`   - Novas Empresas Cadastradas: ${insertedClients}`);
  console.log(`   - Empresas Atualizadas: ${updatedClients}`);
  console.log(`   - Contatos Cadastrados: ${insertedContacts}`);
  console.log(`   - Vínculos Agência x Anunciante: ${insertedLinks}`);
  console.log(`==================================================\n`);

  process.exit(0);
}

const targetFile = process.argv[2] || path.join(__dirname, '../modelo_importacao_clientes_crm.csv');
importClientsFromCsv(targetFile).catch(err => {
  console.error('Erro na execução da importação:', err);
  process.exit(1);
});
