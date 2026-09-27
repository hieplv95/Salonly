import "server-only";
import { db, type UserRow } from "./db";
import type { SessionUser } from "./session";

// Tài khoản hệ thống "Khách vãng lai": khi admin tắt "Bắt buộc đăng nhập", mọi lượt tạo của người
// không đăng nhập được tính vào đây, dùng chung 1 hạn mức (chặn việc người lạ dùng hết credit).
// Mật khẩu "!" không phải dạng băm hợp lệ nên không ai đăng nhập được bằng tài khoản này.

export const GUEST_EMAIL = "guest@naile.local";
const GUEST_USERNAME = "khach.vang.lai";

export function getGuestUser(): SessionUser {
  const d = db();
  let row = d.prepare("SELECT id, username, email, role FROM users WHERE email = ?").get(GUEST_EMAIL) as Pick<UserRow, "id" | "username" | "email" | "role"> | undefined;
  if (!row) {
    const id = Number(d.prepare("INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, '!', 'member')").run(GUEST_USERNAME, GUEST_EMAIL).lastInsertRowid);
    row = { id, username: GUEST_USERNAME, email: GUEST_EMAIL, role: "member" };
  }
  return { id: row.id, username: row.username, email: row.email, role: row.role };
}

export const isGuest = (u: Pick<UserRow, "email">) => u.email === GUEST_EMAIL;
