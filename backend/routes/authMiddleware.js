const jwt = require("jsonwebtoken");
const { pool } = require("../db");

const JWT_SECRET = process.env.JWT_SECRET || "crm_redetv_secret_key_prod_default_2026";
if (process.env.NODE_ENV === "production" && (!process.env.JWT_SECRET || process.env.JWT_SECRET === "crm_redetv_secret_key_prod_default_2026")) {
  console.warn("ALERTA DE SEGURANÇA: JWT_SECRET fraco ou padrão detectado no middleware de autenticação.");
}

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Não autorizado. Token de sessão ausente." });
  }

  const token = authHeader.split(" ")[1];

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    console.error("Erro na verificação do token JWT:", err.message);
    return res.status(401).json({ error: "Não autorizado. Sessão inválida ou expirada." });
  }

  try {
    let userRes;
    const numericId = parseInt(decoded.id, 10);
    if (!isNaN(numericId) && String(numericId) === String(decoded.id)) {
      userRes = await pool.query(
        "SELECT id, email, nome, perfil, executivo_id, ativo, token_version FROM usuarios WHERE id = $1",
        [numericId]
      );
    } else if (decoded.email) {
      userRes = await pool.query(
        "SELECT id, email, nome, perfil, executivo_id, ativo, token_version FROM usuarios WHERE LOWER(email) = LOWER($1)",
        [decoded.email]
      );
    } else {
      return res.status(401).json({ error: "Não autorizado. Token de sessão malformatado." });
    }

    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: "Não autorizado. Usuário não encontrado." });
    }

    const user = userRes.rows[0];

    if (user.ativo === false) {
      return res.status(403).json({ error: "Acesso bloqueado. Esta conta foi desativada pelo administrador." });
    }

    // Invalidação de sessão JWT: compara versão do token com a versão ativa do banco
    const userTokenVersion = user.token_version || 1;
    const jwtTokenVersion = decoded.token_version || 1;
    if (jwtTokenVersion !== userTokenVersion) {
      return res.status(401).json({ error: "Não autorizado. Sessão expirada devido à alteração de credenciais. Faça login novamente." });
    }

    // Mantém req.user atualizado com as permissões mais recentes do banco
    req.user = {
      ...decoded,
      perfil: user.perfil,
      executivo_id: user.executivo_id,
      nome: user.nome,
      email: user.email,
    };
    next();
  } catch (dbErr) {
    console.error("Erro ao validar status do usuário na sessão:", dbErr);
    return res.status(500).json({ error: "Erro interno ao validar autenticação." });
  }
}

module.exports = requireAuth;

