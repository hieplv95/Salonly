import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { db } from "./auth/db";
import { isGuest } from "./auth/guest";
import type { SessionUser } from "./auth/session";
import type { Visitor } from "./auth/visitor";

// Lịch sử ảnh khách đã tạo: ảnh gốc + ảnh thu nhỏ (để lưới xem lại tải nhanh trên điện thoại)
// lưu trong data/media; mỗi chủ sở hữu giữ tối đa HISTORY_MAX ảnh mới nhất.

export const HISTORY_MAX = 100;
const MEDIA_DIR = path.join(process.cwd(), "data", "media");
const THUMB_SIZE = 480;

// Thành viên: theo tài khoản (xem được trên mọi thiết bị). Khách chưa đăng nhập: theo trình duyệt.
export type Owner = { userId: number; visitor: string | null };
export const ownerOf = (user: SessionUser, visitor?: Visitor | null): Owner | null =>
  isGuest(user) ? (visitor ? { userId: user.id, visitor: visitor.key } : null) : { userId: user.id, visitor: null };

export type HistoryItem = { id: string; style: string; createdAt: number };

const ownerSql = "user_id = ? AND visitor IS ?";
const fileOf = (id: string, ext: string) => path.join(MEDIA_DIR, `${id}.${ext}`);
const thumbOf = (id: string) => path.join(MEDIA_DIR, `${id}.thumb.webp`);
const MIME: Record<string, string> = { png: "image/png", jpg: "image/jpeg", webp: "image/webp" };

async function removeFiles(id: string, ext: string) {
  await Promise.all([rm(fileOf(id, ext), { force: true }), rm(thumbOf(id), { force: true })]);
}

// Lưu ảnh vừa tạo (data URL base64). Lỗi lưu không được làm hỏng lượt tạo ảnh, nên nơi gọi bỏ qua lỗi.
export async function saveToHistory(owner: Owner, dataUrl: string, style: string, model: string): Promise<string> {
  const m = /^data:image\/(png|jpeg|webp);base64,(.+)$/.exec(dataUrl);
  if (!m) throw new Error("Ảnh không hợp lệ");
  const ext = m[1] === "jpeg" ? "jpg" : m[1];
  const buf = Buffer.from(m[2], "base64");
  const id = randomBytes(12).toString("base64url");
  await mkdir(MEDIA_DIR, { recursive: true });
  await writeFile(fileOf(id, ext), buf);
  await sharp(buf).rotate().resize(THUMB_SIZE, THUMB_SIZE, { fit: "inside" }).webp({ quality: 78 }).toFile(thumbOf(id));
  const d = db();
  d.prepare("INSERT INTO images (id, user_id, visitor, style, model, ext, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)").run(id, owner.userId, owner.visitor, style.slice(0, 60), model.slice(0, 80), ext, Date.now());

  // Quá số ảnh tối đa thì xoá ảnh cũ nhất.
  const old = d.prepare(`SELECT id, ext FROM images WHERE ${ownerSql} ORDER BY created_at DESC LIMIT -1 OFFSET ?`).all(owner.userId, owner.visitor, HISTORY_MAX) as { id: string; ext: string }[];
  for (const o of old) {
    d.prepare("DELETE FROM images WHERE id = ?").run(o.id);
    await removeFiles(o.id, o.ext);
  }
  return id;
}

export function listHistory(owner: Owner): HistoryItem[] {
  return (db().prepare(`SELECT id, style, created_at FROM images WHERE ${ownerSql} ORDER BY created_at DESC LIMIT ?`).all(owner.userId, owner.visitor, HISTORY_MAX) as { id: string; style: string; created_at: number }[]).map((r) => ({ id: r.id, style: r.style, createdAt: r.created_at }));
}

const findOwned = (owner: Owner, id: string) =>
  db().prepare(`SELECT id, ext FROM images WHERE id = ? AND ${ownerSql}`).get(id, owner.userId, owner.visitor) as { id: string; ext: string } | undefined;

// Chỉ trả ảnh của đúng chủ sở hữu; không có thì null.
export async function readHistory(owner: Owner, id: string, thumb: boolean): Promise<{ data: Buffer; mime: string } | null> {
  const row = findOwned(owner, id);
  if (!row) return null;
  try {
    return thumb ? { data: await readFile(thumbOf(row.id)), mime: "image/webp" } : { data: await readFile(fileOf(row.id, row.ext)), mime: MIME[row.ext] ?? "image/png" };
  } catch {
    return null;
  }
}

export async function deleteHistory(owner: Owner, id: string): Promise<boolean> {
  const row = findOwned(owner, id);
  if (!row) return false;
  db().prepare("DELETE FROM images WHERE id = ?").run(row.id);
  await removeFiles(row.id, row.ext);
  return true;
}
