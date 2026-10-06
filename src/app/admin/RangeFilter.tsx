import Link from "next/link";
import { RANGE_OPTIONS, rangeQuery, type Range } from "./range";

// Thanh lọc thời gian: Hôm nay / Hôm qua / Tuần này / Tháng này / Tuỳ chỉnh (chọn từ ngày – tới ngày).
// Giữ ô tìm kiếm (q) khi đổi khoảng. Không cần JS: tất cả là link / form GET.
export function RangeFilter({ range, q }: { range: Range; q: string }) {
  const href = (key: string) => {
    const p = new URLSearchParams(q ? { q } : {});
    if (key === "custom") {
      p.set("range", "custom");
      p.set("from", range.fromDay);
      p.set("to", range.toDay);
    } else if (key !== "month") p.set("range", key);
    const s = p.toString();
    return s ? `/admin?${s}` : "/admin";
  };
  const date = "h-9 w-full min-w-0 rounded-full border border-line bg-white/80 px-3 text-[13px] outline-none focus:border-gold sm:w-auto";
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <nav aria-label="Khoảng thời gian" className="grid w-full grid-cols-5 gap-1 sm:flex sm:w-auto sm:gap-1.5">
        {RANGE_OPTIONS.map((o) => {
          const active = o.key === range.key;
          return (
            <Link
              key={o.key}
              href={href(o.key)}
              aria-current={active ? "true" : undefined}
              className={`h-9 truncate rounded-full px-0.5 text-center text-[11.5px] leading-9 transition active:scale-95 sm:shrink-0 sm:px-4 sm:text-[13px] ${
                active ? "bg-ink font-medium text-cream" : "border border-line bg-cream/90 text-ink hover:border-gold/60"
              }`}
            >
              {o.label}
            </Link>
          );
        })}
      </nav>
      {range.key === "custom" && (
        <form className="grid w-full grid-cols-2 items-center gap-2 sm:flex sm:w-auto" action="/admin">
          <input type="hidden" name="range" value="custom" />
          {q && <input type="hidden" name="q" value={q} />}
          <label className="flex min-w-0 items-center gap-1.5 text-[12.5px] text-taupe">
            Từ
            <input type="date" name="from" defaultValue={range.fromDay} required className={date} />
          </label>
          <label className="flex min-w-0 items-center gap-1.5 text-[12.5px] text-taupe">
            đến
            <input type="date" name="to" defaultValue={range.toDay} required className={date} />
          </label>
          <button className="gold-btn col-span-2 h-9 shrink-0 rounded-full px-4 text-[13px] font-medium text-cream active:scale-95">Áp dụng</button>
        </form>
      )}
    </div>
  );
}

// Các tham số cần giữ lại khi gửi form tìm kiếm.
export function RangeHidden({ range }: { range: Range }) {
  return (
    <>
      {Object.entries(rangeQuery(range)).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
    </>
  );
}
