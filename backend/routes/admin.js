const express = require("express");
const { pool } = require("../db");
const { hasPermission } = require("../utils/acl");

const router = express.Router();

// Middleware para garantir que apenas administradores acessem rotas administrativas
function requireAdmin(req, res, next) {
  if (req.user && hasPermission(req.user.perfil, "can_manage_users")) {
    next();
  } else {
    res.status(403).json({ error: "Acesso negado. Esta operação exige a permissão: can_manage_users" });
  }
}

router.use(requireAdmin);

// Lista todos os usuários do sistema
router.get("/admin/users", async (req, res) => {
  try {
    const dbRes = await pool.query(
      "SELECT id, email, nome, foto_url, perfil, executivo_id FROM usuarios ORDER BY nome"
    );
    res.json(dbRes.rows);
  } catch (err) {
    console.error("Erro ao listar usuários:", err);
    res.status(500).json({ error: "Erro interno ao buscar lista de usuários." });
  }
});

// Atualiza o perfil e o vínculo de executivo de um usuário
router.put("/admin/users/:id", async (req, res) => {
  const { id } = req.params;
  const { perfil } = req.body;
  try {
    const userRes = await pool.query("SELECT nome, perfil, executivo_id FROM usuarios WHERE id = $1", [id]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }
    const oldUser = userRes.rows[0];
    
    let nextExecutivoId = oldUser.executivo_id;

    if (perfil === "executivo") {
      if (!nextExecutivoId) {
        nextExecutivoId = `e_${id}`;
      }
      // Cria ou atualiza o executivo com o nome do usuário correspondente
      await pool.query(
        `INSERT INTO executivos (id, nome) VALUES ($1, $2)
         ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome`,
        [nextExecutivoId, oldUser.nome]
      );
    } else {
      if (oldUser.executivo_id) {
        nextExecutivoId = null;
        await pool.query("DELETE FROM executivos WHERE id = $1", [oldUser.executivo_id]);
      }
    }

    await pool.query(
      "UPDATE usuarios SET perfil = $1, executivo_id = $2 WHERE id = $3",
      [perfil, nextExecutivoId, id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error("Erro ao atualizar usuário:", err);
    res.status(500).json({ error: "Erro interno ao atualizar perfil do usuário." });
  }
});

// POST /admin/users - Cadastra um novo usuário previamente no sistema
router.post("/admin/users", async (req, res) => {
  const { nome, email, perfil } = req.body;
  
  if (!nome || !email || !perfil) {
    return res.status(400).json({ error: "Nome, e-mail e perfil são obrigatórios." });
  }

  try {
    const emailClean = email.toLowerCase().trim();
    const nomeClean = nome.trim();

    // Verifica se já existe um usuário com este e-mail
    const checkUser = await pool.query("SELECT id FROM usuarios WHERE email = $1", [emailClean]);
    if (checkUser.rows.length > 0) {
      return res.status(400).json({ error: "Já existe um usuário cadastrado com este e-mail." });
    }

    // GoogleId temporário é o próprio e-mail
    const googleId = emailClean;

    // Insere o usuário
    const insertRes = await pool.query(
      "INSERT INTO usuarios (google_id, email, nome, perfil) VALUES ($1, $2, $3, $4) RETURNING id",
      [googleId, emailClean, nomeClean, perfil]
    );
    const newUserId = insertRes.rows[0].id;

    // Se o perfil for executivo, cria na tabela de executivos automaticamente
    let nextExecutivoId = null;
    if (perfil === "executivo") {
      nextExecutivoId = `e_${newUserId}`;
      await pool.query(
        `INSERT INTO executivos (id, nome) VALUES ($1, $2)
         ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome`,
        [nextExecutivoId, nomeClean]
      );
      await pool.query(
        "UPDATE usuarios SET executivo_id = $1 WHERE id = $2",
        [nextExecutivoId, newUserId]
      );
    }

    res.json({ ok: true, id: newUserId });
  } catch (err) {
    console.error("Erro ao cadastrar novo usuário:", err);
    res.status(500).json({ error: "Erro interno ao cadastrar novo usuário." });
  }
});

// Busca a lista de executivos vinculados a um diretor
router.get("/admin/diretores/:id/executivos", async (req, res) => {
  const { id } = req.params;
  try {
    const dbRes = await pool.query(
      "SELECT executivo_id FROM diretor_executivos WHERE diretor_id = $1",
      [id]
    );
    res.json(dbRes.rows.map(r => r.executivo_id));
  } catch (err) {
    console.error("Erro ao buscar executivos do diretor:", err);
    res.status(500).json({ error: "Erro interno ao buscar executivos do diretor." });
  }
});

// Atualiza a lista de executivos vinculados a um diretor
router.put("/admin/diretores/:id/executivos", async (req, res) => {
  const { id } = req.params;
  const { executivo_ids } = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM diretor_executivos WHERE diretor_id = $1", [id]);
    if (Array.isArray(executivo_ids) && executivo_ids.length > 0) {
      for (const execId of executivo_ids) {
        await client.query(
          "INSERT INTO diretor_executivos (diretor_id, executivo_id) VALUES ($1, $2)",
          [id, execId]
        );
      }
    }
    await client.query("COMMIT");
    res.json({ ok: true });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Erro ao salvar executivos do diretor:", err);
    res.status(500).json({ error: "Erro interno ao salvar executivos do diretor." });
  } finally {
    client.release();
  }
});

// Busca a lista de key-accounts (clientes) adicionais de um executivo
router.get("/admin/executivos/:id/key-accounts", async (req, res) => {
  const { id } = req.params; // executivo_id
  try {
    const dbRes = await pool.query(
      "SELECT client_id FROM carteira_key_accounts WHERE executivo_id = $1",
      [id]
    );
    res.json(dbRes.rows.map(r => r.client_id));
  } catch (err) {
    console.error("Erro ao buscar key-accounts do executivo:", err);
    res.status(500).json({ error: "Erro interno ao buscar key-accounts do executivo." });
  }
});

// Atualiza a lista de key-accounts de um executivo
router.put("/admin/executivos/:id/key-accounts", async (req, res) => {
  const { id } = req.params; // executivo_id
  const { client_ids } = req.body; // array de IDs de clientes
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM carteira_key_accounts WHERE executivo_id = $1", [id]);
    if (Array.isArray(client_ids) && client_ids.length > 0) {
      for (const clientId of client_ids) {
        await client.query(
          "INSERT INTO carteira_key_accounts (executivo_id, client_id) VALUES ($1, $2)",
          [id, clientId]
        );
      }
    }
    await client.query("COMMIT");
    res.json({ ok: true });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Erro ao salvar key-accounts do executivo:", err);
    res.status(500).json({ error: "Erro interno ao salvar key-accounts do executivo." });
  } finally {
    client.release();
  }
});

// Busca logs de auditoria
router.get("/admin/audit-logs", async (req, res) => {
  try {
    const dbRes = await pool.query(
      `SELECT a.id, a.user_id, a.user_email, COALESCE(u.nome, a.user_email) as actor_name, a.action, a.details, a.created_at 
       FROM audit_logs a
       LEFT JOIN usuarios u ON u.id = a.user_id
       ORDER BY a.created_at DESC`
    );
    res.json(dbRes.rows);
  } catch (err) {
    console.error("Erro ao buscar logs de auditoria:", err);
    res.status(500).json({ error: "Erro interno ao buscar logs de auditoria." });
  }
});


// ─── PRODUTOS ───────────────────────────────────────────────────────────────

// Lista todos os produtos
router.get("/admin/produtos", async (req, res) => {
  try {
    const dbRes = await pool.query("SELECT * FROM produtos ORDER BY categoria, nome");
    res.json(dbRes.rows);
  } catch (err) {
    console.error("Erro ao listar produtos:", err);
    res.status(500).json({ error: "Erro interno ao buscar produtos." });
  }
});

// Cria novo produto
router.post("/admin/produtos", async (req, res) => {
  const { nome, categoria } = req.body;
  if (!nome || !categoria) return res.status(400).json({ error: "nome e categoria são obrigatórios." });
  try {
    const dbRes = await pool.query(
      "INSERT INTO produtos (nome, categoria) VALUES ($1, $2) RETURNING *",
      [nome.trim(), categoria]
    );
    res.status(201).json(dbRes.rows[0]);
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ error: "Produto já cadastrado nesta categoria." });
    console.error("Erro ao criar produto:", err);
    res.status(500).json({ error: "Erro interno ao criar produto." });
  }
});

// Atualiza produto (nome e/ou status ativo)
router.put("/admin/produtos/:id", async (req, res) => {
  const { nome, ativo } = req.body;
  
  const setClauses = [];
  const values = [];
  let i = 1;

  if (nome !== undefined) {
    setClauses.push(`nome = $${i}`);
    values.push(nome.trim());
    i++;
  }

  if (ativo !== undefined) {
    setClauses.push(`ativo = $${i}`);
    values.push(ativo);
    i++;
  }

  if (setClauses.length === 0) {
    return res.status(400).json({ error: "Nenhum campo informado para atualização." });
  }

  values.push(req.params.id);
  try {
    const dbRes = await pool.query(
      `UPDATE produtos SET ${setClauses.join(", ")} WHERE id = $${i} RETURNING *`,
      values
    );
    if (dbRes.rowCount === 0) return res.status(404).json({ error: "Produto não encontrado." });
    res.json(dbRes.rows[0]);
  } catch (err) {
    console.error("Erro ao atualizar produto:", err);
    res.status(500).json({ error: "Erro interno ao atualizar produto." });
  }
});

// Remove produto
router.delete("/admin/produtos/:id", async (req, res) => {
  try {
    const dbRes = await pool.query("DELETE FROM produtos WHERE id = $1 RETURNING id", [req.params.id]);
    if (dbRes.rowCount === 0) return res.status(404).json({ error: "Produto não encontrado." });
    res.json({ ok: true });
  } catch (err) {
    console.error("Erro ao deletar produto:", err);
    res.status(500).json({ error: "Erro interno ao deletar produto." });
  }
});

module.exports = router;
