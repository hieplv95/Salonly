import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

// Mã hoá AES-256-GCM cho dữ liệu nhạy cảm lưu trong cơ sở dữ liệu (khoá Google Cloud, API key).
// Chìa khoá lấy từ APP_SECRET trong .env.local: lộ riêng file dữ liệu cũng không đọc được khoá.

function key() {
  const s = process.env.APP_SECRET;
  if (!s || s.length < 16) throw new Error("Thiếu APP_SECRET trong .env.local nên chưa lưu được khoá bí mật.");
  return createHash("sha256").update(s).digest();
}

export function encrypt(plain: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return ["v1", iv, cipher.getAuthTag(), data].map((p) => (typeof p === "string" ? p : p.toString("base64"))).join(":");
}

export function decrypt(sealed: string) {
  const [v, iv, tag, data] = sealed.split(":");
  if (v !== "v1") throw new Error("Dữ liệu mã hoá không hợp lệ");
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(data, "base64")), decipher.final()]).toString("utf8");
}
