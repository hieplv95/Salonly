import "server-only";
import { db, type UserRow } from "./auth/db";
import { isGuest } from "./auth/guest";
import type { SessionUser } from "./auth/session";
import { DEFAULT_IMAGE_MODEL, DEFAULT_VIDEO_MODEL, IMAGE_MODEL_OPTIONS, USD_TO_EUR, VIDEO_MODEL_OPTIONS } from "./presets";
import { getDefaultQuotas, type Credit } from "./settings";

// Lượt tạo ảnh / video của từng tài khoản: để thống kê chi phí và giới hạn theo tháng.
// Chi phí là ước tính theo bảng giá model (presets.ts), không phải hoá đơn thật của Google.

export type Kind = "image" | "video";
export type QuotaInfo = { used: number; limit: number | null }; // limit null = không giới hạn
export type QuotaSummary = Record<Kind, QuotaInfo>;

const OPTIONS = { image: IMAGE_MODEL_OPTIONS, video: VIDEO_MODEL_OPTIONS };
const DEFAULT_MODEL = { image: DEFAULT_IMAGE_MODEL, video: DEFAULT_VIDEO_MODEL };

const optionOf = (kind: Kind, model: string) => {
  const all = OPTIONS[kind];
  return all.find((o) => o.id === model) ?? all.find((o) => o.id === DEFAULT_MODEL[kind]) ?? all[0];
};
export const priceOf = (kind: Kind, model: string) => optionOf(kind, model).vnd;
const usdOf = (kind: Kind, model: string) => optionOf(kind, model).usd;

export const modelLabel = (kind: Kind, model: string) => OPTIONS[kind].find((o) => o.id === model)?.label ?? model;

// Đầu tháng hiện tại theo giờ Việt Nam (UTC+7, không đổi giờ mùa hè).
export function monthStart(now = Date.now()) {
  const vn = new Date(now + 7 * 3600_000);
  return Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth(), 1) - 7 * 3600_000;
}

// Hạn mức áp dụng cho 1 tài khoản: admin không giới hạn; thành viên dùng hạn mức riêng nếu có, không thì mặc định.
export function limitsFor(user: Pick<UserRow, "role" | "image_quota" | "video_quota">): Record<Kind, number | null> {
  if (user.role === "admin") return { image: null, video: null };
  const d = getDefaultQuotas();
  return { image: user.image_quota ?? d.image, video: user.video_quota ?? d.video };
}

function usedSince(userId: number, kind: Kind, since: number) {
  return (db().prepare("SELECT COUNT(*) AS n FROM usage WHERE user_id = ? AND kind = ? AND created_at >= ?").get(userId, kind, since) as { n: number }).n;
}

function userRow(id: number) {
  return db().prepare("SELECT role, image_quota, video_quota FROM users WHERE id = ?").get(id) as Pick<UserRow, "role" | "image_quota" | "video_quota">;
}

export function quotaSummary(user: SessionUser): QuotaSummary {
  const limits = limitsFor(userRow(user.id));
  const since = monthStart();
  return {
    image: { used: usedSince(user.id, "image", since), limit: limits.image },
    video: { used: usedSince(user.id, "video", since), limit: limits.video },
  };
}

// Giữ chỗ 1 lượt trước khi gọi AI (chặn gửi dồn nhiều yêu cầu cùng lúc để vượt hạn mức).
// Tạo lỗi thì trả lại lượt (release); thành công thì cập nhật model thực tế (finalize).
export function reserve(user: SessionUser, kind: Kind, model?: string): { id: number } | { error: string } {
  const m = model ?? DEFAULT_MODEL[kind];
  const d = db();
  d.exec("BEGIN IMMEDIATE");
  try {
    const limit = limitsFor(userRow(user.id))[kind];
    const used = usedSince(user.id, kind, monthStart());
    if (limit !== null && used >= limit) {
      d.exec("ROLLBACK");
      const what = kind === "image" ? "ảnh" : "video";
      return {
        error: isGuest(user)
          ? `Đã hết lượt tạo ${what} dùng thử cho khách chưa đăng nhập. Tạo tài khoản miễn phí để dùng tiếp.`
          : `Bạn đã dùng hết ${limit} lượt tạo ${what} của tháng này. Liên hệ admin để tăng hạn mức.`,
      };
    }
    const r = d
      .prepare("INSERT INTO usage (user_id, kind, model, cost_vnd, cost_usd, created_at) VALUES (?, ?, ?, ?, ?, ?)")
      .run(user.id, kind, m, priceOf(kind, m), usdOf(kind, m), Date.now());
    d.exec("COMMIT");
    return { id: Number(r.lastInsertRowid) };
  } catch (e) {
    d.exec("ROLLBACK");
    throw e;
  }
}

// Ghi model thực tế và nguồn AI đã xử lý (tài khoản Google Cloud / API key) sau khi tạo thành công.
export function finalize(id: number, kind: Kind, model: string, source: string) {
  db().prepare("UPDATE usage SET model = ?, cost_vnd = ?, cost_usd = ?, source = ? WHERE id = ?").run(model, priceOf(kind, model), usdOf(kind, model), source, id);
}

/* ---------- Credit từng nguồn AI (ước tính) ---------- */

export type CreditState = { spent: number; remaining: number; exhausted: boolean; daysLeft: number | null };

const fromUsd = (usd: number, currency: Credit["currency"]) => (currency === "EUR" ? usd * USD_TO_EUR : usd);

// Số dư admin chép từ Google Cloud tại thời điểm "since", trừ chi phí các lượt tạo qua nguồn này từ đó tới nay.
export function creditState(sourceId: string, credit: Credit, now = Date.now()): CreditState {
  const usd = (db().prepare("SELECT COALESCE(SUM(cost_usd), 0) AS n FROM usage WHERE source = ? AND created_at >= ?").get(sourceId, credit.since) as { n: number }).n;
  const spent = fromUsd(usd, credit.currency);
  const remaining = credit.amount - spent;
  const daysLeft = credit.expires ? Math.ceil((Date.parse(`${credit.expires}T23:59:59+07:00`) - now) / 86_400_000) : null;
  return { spent, remaining, exhausted: remaining <= (credit.reserve ?? 0) || (daysLeft !== null && daysLeft < 0), daysLeft };
}

// Tổng chi phí ước tính của mọi tài khoản kể từ một thời điểm (để trừ vào credit Google Cloud).
export function totalCostSince(since: number) {
  return (db().prepare("SELECT COALESCE(SUM(cost_vnd), 0) AS n FROM usage WHERE created_at >= ?").get(since) as { n: number }).n;
}

export function release(id: number) {
  db().prepare("DELETE FROM usage WHERE id = ?").run(id);
}
