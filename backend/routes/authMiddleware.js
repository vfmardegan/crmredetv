const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "redetv_fallback_secret_key";

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Não autorizado. Token de sessão ausente." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email, nome }
    next();
  } catch (err) {
    console.error("Erro na verificação do token JWT:", err.message);
    return res.status(401).json({ error: "Não autorizado. Sessão inválida ou expirada." });
  }
}

module.exports = requireAuth;
