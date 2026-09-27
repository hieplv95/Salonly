// Thành phần giao diện dùng chung cho các trình thiết kế (logo, bảng giá).

// Nền caro để thấy rõ logo nền trong suốt.
export const CHECKER = {
  backgroundImage:
    "linear-gradient(45deg,#e9e1d8 25%,transparent 25%),linear-gradient(-45deg,#e9e1d8 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#e9e1d8 75%),linear-gradient(-45deg,transparent 75%,#e9e1d8 75%)",
  backgroundSize: "20px 20px",
  backgroundPosition: "0 0,0 10px,10px -10px,-10px 0",
  backgroundColor: "#fff",
};

export function Panel({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-line bg-cream p-4">
      {title && <p className="mb-3 px-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">{title}</p>}
      {children}
    </div>
  );
}

export function Label({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-2 mt-4 flex items-baseline justify-between px-1 first:mt-0">
      <span className="text-xs font-semibold">{children}</span>
      {hint && <span className="text-[10px] text-taupe">{hint}</span>}
    </div>
  );
}

export const inputCls =
  "block w-full rounded-2xl border border-line bg-white/80 px-4 py-3 text-[15px] outline-none placeholder:text-taupe/70 focus:border-gold focus:ring-2 focus:ring-gold/20";
export const chip = (on: boolean) =>
  `rounded-2xl border transition active:scale-[0.97] ${on ? "border-gold bg-gold/10 shadow-[inset_0_0_0_1px_var(--color-gold)]" : "border-line bg-white/70"}`;

// Phân trang cho thư viện mẫu: ‹ 1 2 3 ›
export function Pager({ page, pages, onChange }: { page: number; pages: number; onChange: (p: number) => void }) {
  if (pages <= 1) return null;
  const btn = "grid h-10 min-w-10 place-items-center rounded-full border px-3 text-sm font-medium transition active:scale-95 disabled:opacity-35";
  return (
    <nav aria-label="Trang mẫu" className="mt-4 flex items-center justify-center gap-1.5">
      <button type="button" onClick={() => onChange(page - 1)} disabled={page === 0} aria-label="Trang trước" className={`${btn} border-line bg-white/70`}>
        ‹
      </button>
      {Array.from({ length: pages }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          aria-current={i === page ? "page" : undefined}
          className={`${btn} ${i === page ? "gold-btn border-transparent text-cream" : "border-line bg-white/70"}`}
        >
          {i + 1}
        </button>
      ))}
      <button type="button" onClick={() => onChange(page + 1)} disabled={page === pages - 1} aria-label="Trang sau" className={`${btn} border-line bg-white/70`}>
        ›
      </button>
    </nav>
  );
}
