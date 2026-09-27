"use client";

import { useEffect, useState } from "react";
import type { ExportKind } from "./export";

const icon = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const IconImage = () => (
  <svg {...icon}>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <circle cx="9" cy="9" r="1.6" />
    <path d="m21 15-4.5-4.5L6 21" />
  </svg>
);
const IconDoc = () => (
  <svg {...icon}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
    <path d="M14 3v5h5M9 13h6M9 17h4" />
  </svg>
);
const IconVector = () => (
  <svg {...icon}>
    <path d="M4 20 12 4l8 16" />
    <circle cx="12" cy="4" r="1.6" />
    <circle cx="4" cy="20" r="1.6" />
    <circle cx="20" cy="20" r="1.6" />
  </svg>
);

export const EXPORT_OPTIONS: { id: ExportKind; label: string; desc: string; icon: () => React.ReactNode }[] = [
  { id: "jpg", label: "JPG", desc: "Phù hợp nhất để chia sẻ, dung lượng nhẹ", icon: IconImage },
  { id: "png", label: "PNG", desc: "Chất lượng cao, giữ được nền trong suốt", icon: IconImage },
  { id: "pdf", label: "PDF", desc: "Phù hợp nhất để in ấn", icon: IconDoc },
  { id: "svg", label: "SVG", desc: "Phóng to không vỡ nét, dùng cho web", icon: IconVector },
];

// Thanh tải xuống: chọn loại tệp (JPG/PNG/PDF/SVG) rồi bấm tải.
// Điện thoại: thông tin ở trên, nút ở dưới. Máy tính: thông tin bên trái, nút bên phải.
export function ExportBar({
  info,
  busy,
  onDownload,
  recommended = "png",
}: {
  info: React.ReactNode;
  busy: boolean;
  onDownload: (kind: ExportKind) => void;
  recommended?: ExportKind;
}) {
  const [kind, setKind] = useState<ExportKind>(recommended);
  const [open, setOpen] = useState(false);
  const current = EXPORT_OPTIONS.find((o) => o.id === kind)!;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="lg:flex lg:items-center lg:gap-6">
      <p className="truncate px-1 text-[11px] text-taupe lg:min-w-0 lg:flex-1 lg:text-[12px]">{info}</p>
      <div className="relative mt-2 flex gap-2 lg:mt-0 lg:w-[440px] lg:shrink-0">
        {open && <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />}
        {open && (
          <div role="listbox" aria-label="Loại tệp" className="absolute bottom-full left-0 z-40 mb-2 w-[min(320px,calc(100vw-2rem))] rounded-xl border border-line bg-cream p-2 shadow-[0_20px_40px_-20px_rgb(40_76_84/0.3)]">
            <p className="px-3 pb-1 pt-2 text-[11px] font-semibold text-taupe">Loại tệp</p>
            {EXPORT_OPTIONS.map((o) => (
              <button
                key={o.id}
                type="button"
                role="option"
                aria-selected={o.id === kind}
                onClick={() => {
                  setKind(o.id);
                  setOpen(false);
                }}
                className={`flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-gold/10 ${o.id === kind ? "bg-gold/10" : ""}`}
              >
                <span className="mt-0.5 text-ink/80">{o.icon()}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-[14px] font-semibold">
                    {o.label}
                    {o.id === recommended && <span className="rounded-full bg-gold px-2 py-0.5 text-[9px] font-semibold text-cream">Đề xuất</span>}
                  </span>
                  <span className="block text-[11.5px] leading-snug text-taupe">{o.desc}</span>
                </span>
                {o.id === kind && (
                  <svg {...icon} className="mt-1 text-gold">
                    <path d="m5 12 5 5 9-10" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={open}
          disabled={busy}
          className="flex h-[44px] shrink-0 items-center gap-2 rounded-lg border border-line bg-cream pl-3.5 pr-3 text-sm font-semibold active:scale-95 disabled:opacity-50"
        >
          {current.icon()}
          {current.label}
          <svg {...icon} width={14} height={14} className={`transition ${open ? "rotate-180" : ""}`}>
            <path d="m6 15 6-6 6 6" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => onDownload(kind)}
          disabled={busy}
          className="gold-btn flex h-[44px] min-w-0 flex-1 items-center justify-center gap-2 rounded-lg text-sm font-medium text-cream active:scale-[0.98] disabled:opacity-60"
        >
          {busy ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-cream/40 border-t-cream" />
          ) : (
            <svg {...icon} width={16} height={16}>
              <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
            </svg>
          )}
          Tải xuống {current.label}
        </button>
      </div>
    </div>
  );
}
