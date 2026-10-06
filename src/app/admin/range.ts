// Bộ lọc khoảng thời gian cho trang quản trị (theo ngày giờ Việt Nam, tuần bắt đầu thứ Hai).

export type RangeKey = "today" | "yesterday" | "week" | "month" | "custom";

export type Range = {
  key: RangeKey;
  from: number; // ms, tính từ
  to: number; // ms, tới trước (không gồm)
  fromDay: string; // YYYY-MM-DD giờ VN, cho ô chọn ngày
  toDay: string; // YYYY-MM-DD giờ VN, ngày cuối (gồm)
  label: string; // "hôm nay", "tuần này", "01/10 – 05/10"…
};

export const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: "today", label: "Hôm nay" },
  { key: "yesterday", label: "Hôm qua" },
  { key: "week", label: "Tuần này" },
  { key: "month", label: "Tháng này" },
  { key: "custom", label: "Tuỳ chỉnh" },
];

const VN = 7 * 3600_000;
const DAY = 86_400_000;
const MAX_DAYS = 366;

// Nửa đêm (giờ VN) của ngày chứa thời điểm t.
const vnMidnight = (t: number) => Math.floor((t + VN) / DAY) * DAY - VN;
const dayString = (t: number) => new Date(t + VN).toISOString().slice(0, 10);
const parseDay = (s: unknown) => (typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s)) ? Date.parse(s) - VN : null);
const short = (t: number) => {
  const d = new Date(t + VN);
  return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
};

function make(key: RangeKey, from: number, to: number, label: string): Range {
  return { key, from, to, fromDay: dayString(from), toDay: dayString(to - DAY), label };
}

export function parseRange(params: { range?: unknown; from?: unknown; to?: unknown }, now = Date.now()): Range {
  const today = vnMidnight(now);
  switch (params.range) {
    case "today":
      return make("today", today, today + DAY, "hôm nay");
    case "yesterday":
      return make("yesterday", today - DAY, today, "hôm qua");
    case "week": {
      const weekday = (new Date(today + VN).getUTCDay() + 6) % 7; // thứ Hai = 0
      return make("week", today - weekday * DAY, today + DAY, "tuần này");
    }
    case "custom": {
      let from = parseDay(params.from) ?? today - 6 * DAY;
      let to = parseDay(params.to) ?? today;
      if (from > to) [from, to] = [to, from];
      from = Math.max(from, to - (MAX_DAYS - 1) * DAY);
      return make("custom", from, to + DAY, from === to ? short(from) : `${short(from)} – ${short(to)}`);
    }
    default: {
      const d = new Date(now + VN);
      return make("month", Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1) - VN, today + DAY, "tháng này");
    }
  }
}

// Tham số URL của khoảng đang chọn (để giữ bộ lọc khi tìm kiếm / chuyển trang).
export function rangeQuery(r: Range): Record<string, string> {
  if (r.key === "month") return {};
  if (r.key === "custom") return { range: "custom", from: r.fromDay, to: r.toDay };
  return { range: r.key };
}
