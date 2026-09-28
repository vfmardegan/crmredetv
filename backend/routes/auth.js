const express = require("express");
const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const { pool } = require("../db");
const { hashPassword, verifyPassword } = require("../utils/passwords");
const { encryptToken } = require("../utils/crypto");
const { logAudit } = require("../utils/audit");

const router = express.Router();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const JWT_SECRET = process.env.JWT_SECRET || "crm_redetv_secret_key_prod_default_2026";
if (process.env.NODE_ENV === "production" && (!process.env.JWT_SECRET || process.env.JWT_SECRET === "crm_redetv_secret_key_prod_default_2026")) {
  console.warn("ALERTA DE SEGURANÇA: JWT_SECRET não configurado com entropia alta em ambiente de produção.");
}
const ALLOWED_DOMAINS = process.env.ALLOWED_DOMAINS || "redetv.com.br";
const ALLOW_DEV_MOCK_LOGIN = process.env.NODE_ENV !== "production" && process.env.ALLOW_DEV_MOCK_LOGIN === "true";

// Mapeamento fixo de e-mails corporativos para perfis padrão
const EMAIL_PROFILE_MAP = {
  "admincrm@redetv.com.br": "admin",
  "vitor.mardegan@redetv.com.br": "admin",
  "neto@redetv.com.br": "admin",
  "nicolle.carvalho@redetv.com.br": "diretor",
  "silvia.szekely@redetv.com.br": "executivo",
  "bruno.camargo@redetv.com.br": "executivo",
  "andre.barcellos@redetv.com.br": "especialista",
  "tarco@redetv.com.br": "especialista",
};

router.post("/auth/google", (req, res) => {
  return res.status(403).json({
    error: "Autenticação via Google desativada. Por favor, utilize seu e-mail corporativo (@redetv.com.br) e senha.",
  });
});

async function handleUserSignIn(res, googleUser) {
  const { sub, email, name, picture } = googleUser;

  // Validação de domínios permitidos
  if (ALLOWED_DOMAINS) {
    const domains = ALLOWED_DOMAINS.split(",").map(d => d.trim().toLowerCase());
    const userDomain = email.split("@")[1]?.toLowerCase();
    
    if (!domains.includes(userDomain)) {
      return res.status(403).json({
        error: `Acesso negado. Apenas e-mails do(s) domínio(s) ${ALLOWED_DOMAINS} são permitidos.`
      });
    }
  }

  try {
    const mappedPerfil = EMAIL_PROFILE_MAP[email.toLowerCase()];
    const initialPerfil = mappedPerfil || "executivo";
    const isProtectedEmail = !!mappedPerfil;

    // Procura o usuário pelo google_id; se não achar, tenta pelo e-mail (para contas pré-cadastradas via seed)
    let checkRes = await pool.query("SELECT id, perfil, executivo_id, ativo, token_version FROM usuarios WHERE google_id = $1", [sub]);
    if (checkRes.rows.length === 0) {
      checkRes = await pool.query("SELECT id, perfil, executivo_id, ativo, token_version FROM usuarios WHERE email = $1", [email.toLowerCase()]);
    }
    let userId;
    let perfil = initialPerfil;
    let executivoId = null;

    if (checkRes.rows.length > 0) {
      userId = checkRes.rows[0].id;
      perfil = checkRes.rows[0].perfil;
      executivoId = checkRes.rows[0].executivo_id;

      // Bloqueia login se o usuário estiver desativado
      if (checkRes.rows[0].ativo === false) {
        return res.status(403).json({
          error: "Acesso bloqueado. Sua conta foi desativada pelo administrador. Entre em contato com o suporte."
        });
      }

      // Força atualização de perfil se o e-mail estiver no mapa fixo
      if (isProtectedEmail) {
        perfil = initialPerfil;
      }

      await pool.query(
        "UPDATE usuarios SET last_login = CURRENT_TIMESTAMP, google_id = $1, nome = $2, foto_url = $3, email = $4, perfil = $5 WHERE id = $6",
        [sub, name, picture, email, perfil, userId]
      );
    } else {
      return res.status(403).json({
        error: `Acesso negado. O e-mail "${email}" não está pré-cadastrado no sistema. Solicite seu cadastro ao administrador.`
      });
    }

    // Assina o token JWT local contendo as permissões de acesso
    const tokenVersion = checkRes.rows[0].token_version || 1;
    const sessionToken = jwt.sign(
      { id: userId, email, nome: name, foto_url: picture, perfil, executivo_id: executivoId, token_version: tokenVersion },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token: sessionToken,
      user: {
        id: userId,
        email,
        nome: name,
        foto_url: picture,
        perfil,
        executivo_id: executivoId
      }
    });

  } catch (dbErr) {
    console.error("Erro de banco de dados na autenticação:", dbErr);
    res.status(500).json({ error: "Erro interno do servidor ao registrar usuário." });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Autenticação corporativa com e-mail e senha
// ─────────────────────────────────────────────────────────────────────────────
router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "E-mail e senha são obrigatórios." });
  }

  const cleanEmail = email.trim().toLowerCase();

  // 1. Validação de domínios corporativos autorizados
  const domain = cleanEmail.split("@")[1];
  const allowedList = ALLOWED_DOMAINS.split(",").map((d) => d.trim().toLowerCase());

  if (!domain || !allowedList.includes(domain)) {
    return res.status(403).json({
      error: `Acesso negado. Apenas e-mails corporativos do(s) domínio(s) ${ALLOWED_DOMAINS} são permitidos.`,
    });
  }

  try {
    // 2. Busca o usuário cadastrado no banco de dados
    const userRes = await pool.query(
      "SELECT id, nome, email, perfil, executivo_id, foto_url, ativo, senha_hash, token_version, deve_trocar_senha FROM usuarios WHERE LOWER(email) = $1",
      [cleanEmail]
    );

    if (userRes.rows.length === 0) {
      console.warn(`Tentativa de login com usuário inexistente: ${cleanEmail}`);
      return res.status(401).json({ error: "Credenciais inválidas. E-mail ou senha incorretos." });
    }

    const user = userRes.rows[0];

    // 3. Verifica se a conta está ativa
    if (user.ativo === false) {
      return res.status(403).json({
        error: "Acesso bloqueado. Sua conta foi desativada pelo administrador. Entre em contato com o suporte.",
      });
    }

    // 4. Validação de credenciais corporativas
    if (!user.senha_hash) {
      console.warn(`Tentativa de login para conta corporativa sem senha definida: ${cleanEmail}`);
      return res.status(401).json({ error: "Credenciais inválidas. E-mail ou senha incorretos." });
    }

    const isValid = verifyPassword(password, user.senha_hash);
    if (!isValid) {
      return res.status(401).json({ error: "Credenciais inválidas. E-mail ou senha incorretos." });
    }

    // 5. Se o usuário está com senha provisória/temporária pendente, exige definição de senha definitiva
    if (user.deve_trocar_senha === true) {
      return res.json({
        requireNewPassword: true,
        email: user.email,
        nome: user.nome,
        message: "Senha temporária validada com sucesso. Por favor, cadastre sua nova senha definitiva.",
      });
    }

    // 6. Atualiza data do último login
    await pool.query("UPDATE usuarios SET last_login = CURRENT_TIMESTAMP WHERE id = $1", [user.id]);

    // 7. Aplica perfil cadastrado no banco; se não houver perfil no banco, usa mapeamento inicial ou executivo
    let perfil = user.perfil || EMAIL_PROFILE_MAP[cleanEmail] || "executivo";

    if (!JWT_SECRET) {
      console.error("ERRO CRÍTICO: JWT_SECRET não configurado.");
      return res.status(500).json({ error: "Configuração interna do servidor incompleta (JWT_SECRET ausente)." });
    }

    // 8. Emissão do token JWT de sessão com controle de versão
    const tokenVersion = user.token_version || 1;
    const sessionToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        nome: user.nome,
        foto_url: user.foto_url,
        perfil,
        executivo_id: user.executivo_id,
        token_version: tokenVersion,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token: sessionToken,
      user: {
        id: user.id,
        email: user.email,
        nome: user.nome,
        foto_url: user.foto_url,
        perfil,
        executivo_id: user.executivo_id,
        deveTrocarSenha: false,
      },
    });
  } catch (err) {
    console.error("Erro na autenticação corporativa com e-mail/senha:", err);
    res.status(500).json({ error: "Erro interno no servidor ao processar autenticação." });
  }
});

// Rota para definição de nova senha definitiva (após validar senha temporária)
router.post("/auth/definitive-password", async (req, res) => {
  const { email, temporaryPassword, newPassword } = req.body;
  if (!email || !temporaryPassword || !newPassword) {
    return res.status(400).json({ error: "E-mail, senha temporária e nova senha definitiva são obrigatórios." });
  }
  if (newPassword.trim().length < 8) {
    return res.status(400).json({ error: "A nova senha definitiva deve ter no mínimo 8 caracteres." });
  }
  if (temporaryPassword.trim() === newPassword.trim()) {
    return res.status(400).json({ error: "A nova senha definitiva deve ser diferente da senha temporária." });
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    const userRes = await pool.query(
      "SELECT id, nome, email, perfil, executivo_id, foto_url, ativo, senha_hash, token_version, deve_trocar_senha FROM usuarios WHERE LOWER(email) = $1",
      [cleanEmail]
    );
    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: "Credenciais inválidas." });
    }
    const user = userRes.rows[0];
    if (user.ativo === false) {
      return res.status(403).json({ error: "Acesso bloqueado. Conta desativada pelo administrador." });
    }
    if (!user.senha_hash || !verifyPassword(temporaryPassword, user.senha_hash)) {
      return res.status(401).json({ error: "Senha temporária incorreta." });
    }

    const newHash = hashPassword(newPassword.trim());
    const newTokenVersion = (user.token_version || 1) + 1;

    await pool.query(
      "UPDATE usuarios SET senha_hash = $1, deve_trocar_senha = FALSE, token_version = $2, last_login = CURRENT_TIMESTAMP WHERE id = $3",
      [newHash, newTokenVersion, user.id]
    );

    await logAudit(
      user.id,
      user.email,
      "set_definitive_password",
      `Colaborador ${user.nome} cadastrou com sucesso sua senha definitiva.`
    );

    const perfil = user.perfil || EMAIL_PROFILE_MAP[cleanEmail] || "executivo";
    const sessionToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        nome: user.nome,
        foto_url: user.foto_url,
        perfil,
        executivo_id: user.executivo_id,
        token_version: newTokenVersion,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      ok: true,
      token: sessionToken,
      user: {
        id: user.id,
        email: user.email,
        nome: user.nome,
        foto_url: user.foto_url,
        perfil,
        executivo_id: user.executivo_id,
        deveTrocarSenha: false,
      },
      message: "Senha definitiva cadastrada com sucesso! Bem-vindo ao CRM.",
    });
  } catch (err) {
    console.error("Erro em /auth/definitive-password:", err);
    res.status(500).json({ error: "Erro interno ao cadastrar nova senha definitiva." });
  }
});

// Rota para alteração de senha de usuário autenticado
const requireAuth = require("./authMiddleware");
router.post("/auth/change-password", requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: "A nova senha deve ter no mínimo 8 caracteres." });
  }
  try {
    const userRes = await pool.query("SELECT id, senha_hash FROM usuarios WHERE id = $1", [req.user.id]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }
    const storedHash = userRes.rows[0].senha_hash;
    if (storedHash) {
      if (!currentPassword || !verifyPassword(currentPassword, storedHash)) {
        return res.status(401).json({ error: "Senha atual incorreta." });
      }
    }
    const newHash = hashPassword(newPassword);
    await pool.query(
      "UPDATE usuarios SET senha_hash = $1, deve_trocar_senha = FALSE, token_version = COALESCE(token_version, 1) + 1 WHERE id = $2",
      [newHash, req.user.id]
    );
    res.json({ ok: true, message: "Senha alterada com sucesso." });
  } catch (err) {
    console.error("Erro ao alterar senha:", err);
    res.status(500).json({ error: "Erro interno ao alterar senha." });
  }
});

// Rota para receber o authorization code do frontend e obter o refresh/access token
router.post("/auth/google/callback-code", requireAuth, async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: "Código de autorização (code) ausente." });
  }

  if (!GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn("Aviso: GOOGLE_CLIENT_ID ou GOOGLE_CLIENT_SECRET não configurados. Retornando callback mockado.");
    return res.json({ success: true, mocked: true });
  }

  const oauth2Client = new OAuth2Client(
    GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    "postmessage"
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);
    const { access_token, refresh_token, expiry_date } = tokens;
    const expiresAt = expiry_date ? new Date(expiry_date) : null;

    if (refresh_token) {
      await pool.query(
        `UPDATE usuarios 
         SET google_refresh_token = $1, google_access_token = $2, google_token_expires_at = $3 
         WHERE id = $4`,
        [encryptToken(refresh_token), encryptToken(access_token), expiresAt, req.user.id]
      );
    } else {
      await pool.query(
        `UPDATE usuarios 
         SET google_access_token = $1, google_token_expires_at = $2 
         WHERE id = $3`,
        [encryptToken(access_token), expiresAt, req.user.id]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Erro ao trocar authorization code:", err);
    res.status(500).json({ error: "Não foi possível obter os tokens com o Google. Tente novamente mais tarde." });
  }
});

module.exports = router;
