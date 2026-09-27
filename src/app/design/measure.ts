import { useSyncExternalStore } from "react";

// Dùng chung cho logo và bảng giá: đo bề rộng chữ thật để tự co chữ vừa khung.

/* ---------- Đo chữ thật sau khi font đã tải ---------- */

// Mỗi lần trình duyệt tải xong font, tăng phiên bản để logo vẽ lại với số đo thật.
let fontVersion = 0;
const fontListeners = new Set<() => void>();
const bumpFonts = () => {
  fontVersion++;
  fontListeners.forEach((l) => l());
};
if (typeof document !== "undefined" && document.fonts) {
  document.fonts.addEventListener("loadingdone", bumpFonts);
  document.fonts.ready.then(bumpFonts);
}

export type Measure = (text: string, family: string, weight: number, size: number, spacing: number) => number | undefined;

let ctx: CanvasRenderingContext2D | null = null;
const measureText: Measure = (text, family, weight, size, spacing) => {
  const font = `${weight} ${size}px '${family}'`;
  if (!document.fonts.check(font, text)) return undefined;
  ctx ??= document.createElement("canvas").getContext("2d");
  if (!ctx) return undefined;
  ctx.font = font;
  return ctx.measureText(text).width + spacing * text.length;
};

// Trên server và trước khi font tải xong trả undefined → dùng ước lượng (tránh lệch khi hydrate).
export function useMeasure(): Measure {
  const version = useSyncExternalStore(
    (cb) => {
      fontListeners.add(cb);
      return () => {
        fontListeners.delete(cb);
      };
    },
    () => fontVersion,
    () => 0,
  );
  return version > 0 ? measureText : () => undefined;
}

/* ---------- Chữ tự co cho vừa khung ---------- */

export type Fit = { size: number; length?: number; width: number };

// Thu nhỏ tên dài cho vừa khung; nếu nhỏ nhất vẫn tràn thì ép bằng textLength.
// measured: bề rộng đo thật ở cỡ `base` (nếu có), không thì ước lượng theo số ký tự.
export function fit(text: string, charWidth: number, base: number, min: number, maxWidth: number, spacing = 0, measured?: number): Fit {
  const est = (s: number) =>
    measured !== undefined ? (measured * s) / base : text.length * (charWidth * s + spacing * (s / base));
  const size = Math.max(min, Math.min(base, (base * maxWidth) / Math.max(1, est(base))));
  const width = est(size);
  return { size, width: Math.min(width, maxWidth), length: width > maxWidth ? maxWidth : undefined };
}
