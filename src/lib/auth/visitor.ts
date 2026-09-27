import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";

// Khách chưa đăng nhập được nhận diện bằng 1 mã ngẫu nhiên lưu trong cookie (riêng từng trình duyệt)
// và IP đã băm (chặn xoá cookie để dùng lại lượt thử). Không lưu IP gốc.

const VISITOR_COOKIE = "naile_visitor";
export type Visitor = { key: string; ip: string };

const hashIp = (ip: string) => createHash("sha256").update(`naile|${ip}`).digest("hex").slice(0, 32);

async function clientIp() {
  const h = await headers();
  // Nginx đặt X-Real-IP; X-Forwarded-For lấy địa chỉ đầu tiên.
  return h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
}

// Chỉ đọc (dùng trong trang để hiện số lượt còn lại): chưa có cookie = khách mới.
export async function peekVisitor(): Promise<Visitor | null> {
  const key = (await cookies()).get(VISITOR_COOKIE)?.value;
  return key ? { key, ip: hashIp(await clientIp()) } : null;
}

// Dùng trong API: chưa có cookie thì tạo mới (1 năm).
export async function getVisitor(): Promise<Visitor> {
  const store = await cookies();
  let key = store.get(VISITOR_COOKIE)?.value;
  if (!key || !/^[\w-]{16,64}$/.test(key)) {
    key = randomBytes(18).toString("base64url");
    store.set(VISITOR_COOKIE, key, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 365 * 24 * 3600,
    });
  }
  return { key, ip: hashIp(await clientIp()) };
}
