"use server";

import { redirect } from "next/navigation";
import { db, type Role, type UserRow } from "@/lib/auth/db";
import { GUEST_EMAIL } from "@/lib/auth/guest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, deleteSession } from "@/lib/auth/session";

export type AuthState =
  | {
      error?: string;
      fieldErrors?: { username?: string; email?: string; password?: string };
      values?: { username?: string; email?: string; identifier?: string };
    }
  | undefined;

const USERNAME_RE = /^[a-zA-Z0-9._]{3,30}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PASSWORD_MIN = 6;
const PASSWORD_MAX = 72;

// Chỉ cho quay lại đường dẫn nội bộ sau khi đăng nhập (chặn chuyển hướng sang trang lạ).
const safeNext = (v: FormDataEntryValue | null) => {
  const s = typeof v === "string" ? v : "";
  return s.startsWith("/") && !s.startsWith("//") && !s.startsWith("/\\") ? s : "/";
};

// Admin chỉ quản trị hệ thống (không dùng studio) nên luôn vào trang quản trị; thành viên vào studio.
const landing = (role: Role, v: FormDataEntryValue | null) => {
  const next = safeNext(v);
  if (role === "admin") return next.startsWith("/admin") ? next : "/admin";
  return next.startsWith("/admin") ? "/" : next;
};

/* ---------- Đăng ký ---------- */

export async function register(_: AuthState, fd: FormData): Promise<AuthState> {
  const username = String(fd.get("username") ?? "").trim();
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  const values = { username, email };

  const fieldErrors: NonNullable<AuthState>["fieldErrors"] = {};
  if (!USERNAME_RE.test(username)) fieldErrors.username = "3–30 ký tự: chữ không dấu, số, dấu chấm hoặc gạch dưới.";
  if (!EMAIL_RE.test(email) || email.length > 120) fieldErrors.email = "Email chưa đúng định dạng.";
  if (password.length < PASSWORD_MIN) fieldErrors.password = `Mật khẩu tối thiểu ${PASSWORD_MIN} ký tự.`;
  else if (password.length > PASSWORD_MAX) fieldErrors.password = `Mật khẩu tối đa ${PASSWORD_MAX} ký tự.`;
  if (Object.keys(fieldErrors).length) return { fieldErrors, values };

  const d = db();
  const taken = d.prepare("SELECT username, email FROM users WHERE username = ? OR email = ?").all(username, email) as Pick<UserRow, "username" | "email">[];
  if (taken.some((u) => u.username.toLowerCase() === username.toLowerCase())) fieldErrors.username = "Tên tài khoản đã có người dùng.";
  if (taken.some((u) => u.email.toLowerCase() === email)) fieldErrors.email = "Email này đã được đăng ký.";
  if (Object.keys(fieldErrors).length) return { fieldErrors, values };

  // Tài khoản đầu tiên của hệ thống là quản trị viên; các tài khoản sau là thành viên.
  const hash = await hashPassword(password);
  let userId: number;
  let role: Role;
  try {
    const { count } = d.prepare("SELECT COUNT(*) AS count FROM users WHERE email != ?").get(GUEST_EMAIL) as { count: number };
    role = count === 0 ? "admin" : "member";
    const result = d.prepare("INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)").run(username, email, hash, role);
    userId = Number(result.lastInsertRowid);
  } catch {
    return { error: "Không tạo được tài khoản, vui lòng thử lại.", values };
  }

  await createSession(userId);
  redirect(landing(role, fd.get("next")));
}

/* ---------- Đăng nhập ---------- */

// Chống dò mật khẩu: sai 5 lần trong 10 phút thì khoá tên đăng nhập đó 10 phút.
const MAX_FAILS = 5;
const WINDOW_MS = 10 * 60 * 1000;
const g = globalThis as unknown as { __naileFails?: Map<string, { n: number; since: number }> };
const fails = (g.__naileFails ??= new Map());

// Băm giả để thời gian trả lời như nhau dù tài khoản có tồn tại hay không.
let dummyHash: Promise<string> | undefined;

export async function login(_: AuthState, fd: FormData): Promise<AuthState> {
  const identifier = String(fd.get("identifier") ?? "").trim();
  const password = String(fd.get("password") ?? "");
  const values = { identifier };
  if (!identifier || !password) return { error: "Nhập tên tài khoản (hoặc email) và mật khẩu.", values };

  const key = identifier.toLowerCase();
  const f = fails.get(key);
  if (f && Date.now() - f.since < WINDOW_MS && f.n >= MAX_FAILS) {
    const mins = Math.ceil((WINDOW_MS - (Date.now() - f.since)) / 60000);
    return { error: `Sai mật khẩu quá nhiều lần. Vui lòng thử lại sau ${mins} phút.`, values };
  }

  const user = db().prepare("SELECT * FROM users WHERE username = ? OR email = ?").get(identifier, key) as UserRow | undefined;
  const ok = user ? await verifyPassword(password, user.password_hash) : await verifyPassword(password, await (dummyHash ??= hashPassword("khong-dung")));
  if (!user || !ok) {
    const cur = f && Date.now() - f.since < WINDOW_MS ? f : { n: 0, since: Date.now() };
    fails.set(key, { n: cur.n + 1, since: cur.since });
    return { error: "Sai tên tài khoản/email hoặc mật khẩu.", values };
  }

  fails.delete(key);
  if (user.disabled) return { error: "Tài khoản này đang bị khoá. Vui lòng liên hệ quản trị viên.", values };
  await createSession(user.id);
  redirect(landing(user.role, fd.get("next")));
}

/* ---------- Đăng xuất ---------- */

export async function logout() {
  await deleteSession();
  redirect("/login");
}
