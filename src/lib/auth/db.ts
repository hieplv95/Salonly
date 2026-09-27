import "server-only";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

// Cơ sở dữ liệu của app: 1 file SQLite trong thư mục data/ (đã loại khỏi git).
// Giữ 1 kết nối trên globalThis để không mở lại mỗi lần Next.js tải lại code;
// khi cấu trúc bảng đổi (SCHEMA tăng) thì tự nâng cấp cả kết nối đang mở.

export type Role = "admin" | "member";

export type UserRow = {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  role: Role;
  created_at: string;
  disabled: number; // 1 = bị khoá, không đăng nhập được
  image_quota: number | null; // lượt tạo ảnh / tháng; null = theo mặc định
  video_quota: number | null;
};

const SCHEMA = 3;
const g = globalThis as unknown as { __naileDb?: DatabaseSync; __naileDbSchema?: number };

function migrate(db: DatabaseSync) {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE COLLATE NOCASE,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      kind TEXT NOT NULL CHECK (kind IN ('image', 'video')),
      model TEXT NOT NULL,
      cost_vnd INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS usage_user_time ON usage (user_id, created_at);
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
  const cols = new Set((db.prepare("PRAGMA table_info(users)").all() as { name: string }[]).map((c) => c.name));
  if (!cols.has("disabled")) db.exec("ALTER TABLE users ADD COLUMN disabled INTEGER NOT NULL DEFAULT 0");
  if (!cols.has("image_quota")) db.exec("ALTER TABLE users ADD COLUMN image_quota INTEGER");
  if (!cols.has("video_quota")) db.exec("ALTER TABLE users ADD COLUMN video_quota INTEGER");
  // Lượt tạo ghi thêm nguồn AI đã xử lý (để tính credit từng tài khoản Google Cloud) và chi phí theo USD.
  const ucols = new Set((db.prepare("PRAGMA table_info(usage)").all() as { name: string }[]).map((c) => c.name));
  if (!ucols.has("source")) db.exec("ALTER TABLE usage ADD COLUMN source TEXT");
  if (!ucols.has("cost_usd")) db.exec("ALTER TABLE usage ADD COLUMN cost_usd REAL NOT NULL DEFAULT 0");
  db.exec("CREATE INDEX IF NOT EXISTS usage_source_time ON usage (source, created_at)");
}

export function db() {
  if (!g.__naileDb) {
    const dir = path.join(process.cwd(), "data");
    mkdirSync(dir, { recursive: true });
    g.__naileDb = new DatabaseSync(path.join(dir, "naile.db"));
  }
  if (g.__naileDbSchema !== SCHEMA) {
    migrate(g.__naileDb);
    g.__naileDbSchema = SCHEMA;
  }
  return g.__naileDb;
}
