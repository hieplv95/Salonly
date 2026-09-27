import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getRequireLogin } from "../settings";
import { db, type Role, type UserRow } from "./db";
import { getGuestUser } from "./guest";

// Phiên đăng nhập lưu trong cơ sở dữ liệu. Trình duyệt chỉ giữ mã ngẫu nhiên (cookie httpOnly);
// cơ sở dữ liệu chỉ giữ bản băm của mã đó, nên lộ file dữ liệu cũng không dùng lại được phiên.

export const SESSION_COOKIE = "naile_session";
const SESSION_DAYS = 30;

// Thông tin người dùng được phép gửi xuống trình duyệt (không có mật khẩu).
export type SessionUser = { id: number; username: string; email: string; role: Role };

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
const toSessionUser = (u: Pick<UserRow, "id" | "username" | "email" | "role">): SessionUser => ({
  id: u.id,
  username: u.username,
  email: u.email,
  role: u.role,
});

export async function createSession(userId: number) {
  const token = randomBytes(32).toString("base64url");
  const expires = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const d = db();
  d.prepare("DELETE FROM sessions WHERE expires_at < ?").run(Date.now());
  d.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)").run(sha256(token), userId, expires);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expires),
  });
}

export async function deleteSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) db().prepare("DELETE FROM sessions WHERE token_hash = ?").run(sha256(token));
  store.delete(SESSION_COOKIE);
}

// Người đang đăng nhập (kiểm tra thật với cơ sở dữ liệu), hoặc null.
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const row = db()
    .prepare(
      `SELECT u.id, u.username, u.email, u.role FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ? AND s.expires_at > ? AND u.disabled = 0`,
    )
    .get(sha256(token), Date.now()) as Pick<UserRow, "id" | "username" | "email" | "role"> | undefined;
  return row ? toSessionUser(row) : null;
});

// Dùng trong trang: chưa đăng nhập thì chuyển sang trang đăng nhập.
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

// Dùng trong trang quản trị: chưa đăng nhập thì sang trang đăng nhập (rồi quay lại), không phải admin thì về trang chính.
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "admin") redirect("/");
  return user;
}

// Dùng trong API: trả về Response 401 nếu chưa đăng nhập (hoặc tài khoản đã bị khoá).
export async function apiGuard() {
  return (await apiUser()).denied;
}

type Access = { user: SessionUser; denied: null } | { user: null; denied: Response };
const deny = (error: string, status: number): Access => ({ user: null, denied: Response.json({ error }, { status }) });

// Người dùng studio: thành viên đã đăng nhập; nếu admin tắt "Bắt buộc đăng nhập" thì người chưa đăng nhập
// được tính là "Khách vãng lai" (dùng chung hạn mức).
export async function apiAccess(): Promise<Access> {
  const user = await getCurrentUser();
  if (user) return { user, denied: null };
  if (getRequireLogin()) return deny("Vui lòng đăng nhập để dùng tính năng này.", 401);
  const guest = getGuestUser();
  const locked = (db().prepare("SELECT disabled FROM users WHERE id = ?").get(guest.id) as { disabled: number }).disabled;
  return locked ? deny("Chức năng này tạm ngưng với khách chưa đăng nhập. Vui lòng đăng nhập để tiếp tục.", 403) : { user: guest, denied: null };
}

// Chức năng tạo ảnh / video chỉ dành cho thành viên (hoặc khách vãng lai); tài khoản quản trị không dùng.
export async function apiMember(): Promise<Access> {
  const r = await apiAccess();
  if (r.user?.role === "admin") return deny("Tài khoản quản trị không dùng chức năng tạo ảnh / video.", 403);
  return r;
}

export async function apiUser(): Promise<{ user: SessionUser; denied: null } | { user: null; denied: Response }> {
  const user = await getCurrentUser();
  return user ? { user, denied: null } : { user: null, denied: Response.json({ error: "Vui lòng đăng nhập để dùng tính năng này." }, { status: 401 }) };
}
