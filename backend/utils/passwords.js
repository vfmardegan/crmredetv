const crypto = require("crypto");

/**
 * Deriva um hash seguro scrypt com salt aleatório para armazenamento no banco de dados.
 * @param {string} password - Senha em texto claro
 * @returns {string} - Formato "salt:hash"
 */
function hashPassword(password) {
  if (!password || typeof password !== "string") {
    throw new Error("Senha inválida para hashing.");
  }
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

/**
 * Verifica se a senha fornecida corresponde ao hash armazenado no banco de dados.
 * Utiliza crypto.timingSafeEqual para prevenir timing attacks.
 * @param {string} password - Senha informada na tentativa de login
 * @param {string} storedHash - Hash no formato "salt:hash" salvo em usuarios.senha_hash
 * @returns {boolean}
 */
function verifyPassword(password, storedHash) {
  try {
    if (!password || !storedHash || typeof storedHash !== "string") return false;
    const parts = storedHash.split(":");
    if (parts.length !== 2) return false;
    const [salt, expectedHashHex] = parts;
    const expectedBuffer = Buffer.from(expectedHashHex, "hex");
    const derivedKey = crypto.scryptSync(password, salt, 64);
    if (expectedBuffer.length !== derivedKey.length) return false;
    return crypto.timingSafeEqual(expectedBuffer, derivedKey);
  } catch (err) {
    console.error("Erro ao verificar hash de senha:", err);
    return false;
  }
}

module.exports = {
  hashPassword,
  verifyPassword,
};
