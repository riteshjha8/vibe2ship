import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function getKey() {
  const key = process.env.ENCRYPTION_KEY || "";
  if (!key || key.length < 32) {
    // Fallback for development - not secure for production
    return crypto.createHash("sha256").update(String(key || "dev-key")).digest();
  }
  return Buffer.from(key).slice(0, 32);
}

export function encryptText(plain) {
  if (!plain) return "";
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: 16 });
  const encrypted = Buffer.concat([cipher.update(String(plain), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decryptText(enc) {
  if (!enc) return "";
  try {
    const data = Buffer.from(enc, "base64");
    const iv = data.slice(0, IV_LENGTH);
    const tag = data.slice(IV_LENGTH, IV_LENGTH + 16);
    const text = data.slice(IV_LENGTH + 16);
    const key = getKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: 16 });
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(text), decipher.final()]);
    return decrypted.toString("utf8");
  } catch (err) {
    return "";
  }
}
