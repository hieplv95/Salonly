import "server-only";
import { db, type UserRow } from "./auth/db";
import { GUEST_EMAIL } from "./auth/guest";
import { limitsFor, monthStart, type Kind } from "./usage";

// Số liệu cho trang quản trị: khách hàng (tài khoản đã đăng ký) và lượt dùng AI của họ.

// Khoảng thời gian thống kê [from, to) tính bằng ms.
export type Period = { from: number; to: number };

export type CustomerRow = Pick<UserRow, "id" | "username" | "email" | "role" | "disabled" | "created_at"> & {
  imgMonth: number;
  vidMonth: number;
  img: number;
  vid: number;
  cost: number;
  costAll: number;
  lastUsed: number | null;
  limits: Record<Kind, number | null>;
};

// Mặc định: tháng này (cũng là chu kỳ của hạn mức).
const thisMonth = (): Period => ({ from: monthStart(), to: Number.MAX_SAFE_INTEGER });

function queryCustomers(where: string, params: (string | number)[], p: Period): CustomerRow[] {
  const m = monthStart();
  const rows = db()
    .prepare(
      `SELECT u.id, u.username, u.email, u.role, u.disabled, u.created_at, u.image_quota, u.video_quota,
         COALESCE(SUM(g.kind = 'image' AND g.created_at >= ?), 0) AS imgMonth,
         COALESCE(SUM(g.kind = 'video' AND g.created_at >= ?), 0) AS vidMonth,
         COALESCE(SUM(g.kind = 'image' AND g.created_at >= ? AND g.created_at < ?), 0) AS img,
         COALESCE(SUM(g.kind = 'video' AND g.created_at >= ? AND g.created_at < ?), 0) AS vid,
         COALESCE(SUM(CASE WHEN g.created_at >= ? AND g.created_at < ? THEN g.cost_vnd END), 0) AS cost,
         COALESCE(SUM(g.cost_vnd), 0) AS costAll,
         MAX(g.created_at) AS lastUsed
       FROM users u LEFT JOIN usage g ON g.user_id = u.id
       WHERE ${where}
       GROUP BY u.id
       ORDER BY u.created_at DESC, u.id DESC`,
    )
    .all(m, m, p.from, p.to, p.from, p.to, p.from, p.to, ...params) as unknown as (Omit<CustomerRow, "limits"> & Pick<UserRow, "image_quota" | "video_quota">)[];
  return rows.map(({ image_quota, video_quota, ...r }) => ({ ...r, limits: limitsFor({ role: r.role, image_quota, video_quota }) }));
}

// role: "member" = khách hàng; "admin" = tài khoản quản trị hệ thống. Không gồm tài khoản "Khách vãng lai".
export function listCustomers(search = "", role: UserRow["role"] = "member", period = thisMonth()): CustomerRow[] {
  const like = `%${search.replace(/[%_]/g, (c) => `\\${c}`)}%`;
  return queryCustomers(
    "u.role = ? AND u.email != ? AND (? = '' OR u.username LIKE ? ESCAPE '\\' OR u.email LIKE ? ESCAPE '\\')",
    [role, GUEST_EMAIL, search, like, like],
    period,
  );
}

// Tổng lượt dùng của người chưa đăng nhập (khi admin tắt "Bắt buộc đăng nhập"); null nếu chưa ai dùng.
export const guestCustomer = (period = thisMonth()): CustomerRow | null => queryCustomers("u.email = ?", [GUEST_EMAIL], period)[0] ?? null;

export function overview(p = thisMonth()) {
  const d = db();
  const users = d
    .prepare(
      `SELECT COALESCE(SUM(role = 'member' AND email != ?), 0) AS members, COALESCE(SUM(role = 'admin'), 0) AS admins,
              COALESCE(SUM(role = 'member' AND email != ? AND disabled = 1), 0) AS locked FROM users`,
    )
    .get(GUEST_EMAIL, GUEST_EMAIL) as { members: number; admins: number; locked: number };
  const usage = d
    .prepare(
      `SELECT COALESCE(SUM(kind = 'image' AND created_at >= ? AND created_at < ?), 0) AS img,
              COALESCE(SUM(kind = 'video' AND created_at >= ? AND created_at < ?), 0) AS vid,
              COALESCE(SUM(CASE WHEN created_at >= ? AND created_at < ? THEN cost_vnd END), 0) AS cost,
              COALESCE(SUM(cost_vnd), 0) AS costAll
       FROM usage`,
    )
    .get(p.from, p.to, p.from, p.to, p.from, p.to) as { img: number; vid: number; cost: number; costAll: number };
  return { ...users, ...usage };
}

export type CustomerDetail = UserRow & {
  month: Record<Kind, number> & { cost: number };
  all: Record<Kind, number> & { cost: number };
  limits: Record<Kind, number | null>;
  recent: { id: number; kind: Kind; model: string; cost_vnd: number; created_at: number }[];
};

export function customerDetail(id: number): CustomerDetail | null {
  const d = db();
  const user = d.prepare("SELECT * FROM users WHERE id = ?").get(id) as UserRow | undefined;
  if (!user) return null;
  const sum = (since: number) =>
    d
      .prepare(
        `SELECT COALESCE(SUM(kind = 'image'), 0) AS image, COALESCE(SUM(kind = 'video'), 0) AS video, COALESCE(SUM(cost_vnd), 0) AS cost
         FROM usage WHERE user_id = ? AND created_at >= ?`,
      )
      .get(id, since) as Record<Kind, number> & { cost: number };
  const recent = d
    .prepare("SELECT id, kind, model, cost_vnd, created_at FROM usage WHERE user_id = ? ORDER BY created_at DESC LIMIT 30")
    .all(id) as CustomerDetail["recent"];
  return { ...user, month: sum(monthStart()), all: sum(0), limits: limitsFor(user), recent };
}
