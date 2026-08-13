const express = require("express");
const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const { pool } = require("../db");

const router = express.Router();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const JWT_SECRET = process.env.JWT_SECRET || "redetv_fallback_secret_key";
const ALLOWED_DOMAINS = process.env.ALLOWED_DOMAINS; // ex: "redetv.com.br"

router.post("/auth/google", async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ error: "Token do Google (credential) ausente na requisição." });
  }

  // Verifica se o GOOGLE_CLIENT_ID foi configurado
  if (!GOOGLE_CLIENT_ID) {
    console.warn("Aviso: GOOGLE_CLIENT_ID não está configurado no ambiente. Validando token localmente sem verificação de assinatura (apenas para testes).");
    try {
      // Decodificação insegura apenas para fins de sandbox caso as chaves não estejam prontas
      const decoded = jwt.decode(credential);
      if (!decoded) throw new Error("Token malformatado");
      return await handleUserSignIn(res, {
        sub: decoded.sub,
        email: decoded.email,
        name: decoded.name || decoded.email.split("@")[0],
        picture: decoded.picture || ""
      });
    } catch (err) {
      return res.status(400).json({ error: "Erro ao decodificar token de teste: " + err.message });
    }
  }

  const client = new OAuth2Client(GOOGLE_CLIENT_ID);

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      return res.status(400).json({ error: "Token do Google inválido ou sem e-mail disponível." });
    }

    await handleUserSignIn(res, {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture
    });

  } catch (err) {
    console.error("Falha ao autenticar com o Google:", err);
    return res.status(400).json({ error: "Assinatura do token do Google inválida ou expirada." });
  }
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
    // Mapeamento fixo de e-mails corporativos para seus perfis padrão
    const EMAIL_PROFILE_MAP = {
      "admincrm@redetv.com.br": "admin",
      "vitor.mardegan@redetv.com.br": "admin",
      "neto@redetv.com.br": "admin",
      "nicolle.carvalho@redetv.com.br": "diretor",
      "silvia.szekely@redetv.com.br": "executivo",
      "andre.barcellos@redetv.com.br": "especialista",
      "tarco@redetv.com.br": "especialista",
    };

    const mappedPerfil = EMAIL_PROFILE_MAP[email.toLowerCase()];
    const initialPerfil = mappedPerfil || "executivo";
    const isProtectedEmail = !!mappedPerfil;

    // Procura o usuário pelo google_id; se não achar, tenta pelo e-mail (para contas pré-cadastradas via seed)
    let checkRes = await pool.query("SELECT id, perfil, executivo_id FROM usuarios WHERE google_id = $1", [sub]);
    if (checkRes.rows.length === 0) {
      checkRes = await pool.query("SELECT id, perfil, executivo_id FROM usuarios WHERE email = $1", [email.toLowerCase()]);
    }
    let userId;
    let perfil = initialPerfil;
    let executivoId = null;

    if (checkRes.rows.length > 0) {
      userId = checkRes.rows[0].id;
      perfil = checkRes.rows[0].perfil;
      executivoId = checkRes.rows[0].executivo_id;

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
    const sessionToken = jwt.sign(
      { id: userId, email, nome: name, foto_url: picture, perfil, executivo_id: executivoId },
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

// Rota para receber o authorization code do frontend e obter o refresh/access token
const requireAuth = require("./authMiddleware");
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
        [refresh_token, access_token, expiresAt, req.user.id]
      );
    } else {
      await pool.query(
        `UPDATE usuarios 
         SET google_access_token = $1, google_token_expires_at = $2 
         WHERE id = $3`,
        [access_token, expiresAt, req.user.id]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Erro ao trocar authorization code:", err);
    res.status(500).json({ error: "Não foi possível obter os tokens com o Google: " + err.message });
  }
});

module.exports = router;
