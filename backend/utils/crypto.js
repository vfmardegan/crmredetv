const crypto = require("crypto");

// Chave derivada de 32 bytes (256 bits) usando SHA-256 sobre o segredo da aplicação
const JWT_SECRET = process.env.JWT_SECRET || "crm_redetv_secret_key_prod_default_2026";
const ENCRYPTION_KEY = crypto.createHash("sha256").update(JWT_SECRET).digest();
const ALGORITHM = "aes-256-gcm";

/**
 * Criptografa uma string sensível (ex: tokens OAuth2, refresh tokens) em repouso.
 * Retorna no formato seguro: enc:v1:<iv_hex>:<auth_tag_hex>:<ciphertext_hex>
 */
function encryptToken(plainText) {
  if (!plainText) return null;
  if (typeof plainText !== "string") plainText = String(plainText);
  if (plainText.startsWith("enc:v1:")) return plainText; // já criptografado

  try {
    const iv = crypto.randomBytes(12); // 96 bits recomendado para GCM
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `enc:v1:${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
  } catch (err) {
    console.error("Erro ao criptografar token em repouso:", err.message);
    throw err;
  }
}

/**
 * Descriptografa um token protegido com AES-256-GCM.
 * Se o token for em texto claro legado, retorna o texto original de forma transparente.
 */
function decryptToken(cipherText) {
  if (!cipherText) return null;
  if (typeof cipherText !== "string") return cipherText;

  // Compatibilidade com tokens legados pré-existentes
  if (!cipherText.startsWith("enc:v1:")) {
    return cipherText;
  }

  try {
    const parts = cipherText.slice(7).split(":");
    if (parts.length !== 3) {
      console.warn("Formato de token criptografado inválido.");
      return null;
    }

    const iv = Buffer.from(parts[0], "hex");
    const tag = Buffer.from(parts[1], "hex");
    const encrypted = Buffer.from(parts[2], "hex");

    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString("utf8");
  } catch (err) {
    console.error("Erro ao descriptografar token em repouso:", err.message);
    return null;
  }
}

module.exports = {
  encryptToken,
  decryptToken,
};
