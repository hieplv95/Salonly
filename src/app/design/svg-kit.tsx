import { fit, useMeasure } from "./measure";

// Bộ công cụ vẽ SVG dùng chung cho thẻ tích điểm và voucher: font, màu, chữ tự co cho vừa chỗ.

export const F = {
  script: { family: "Great Vibes", weight: 400, width: 0.52 },
  serif: { family: "Playfair Display", weight: 600, width: 0.56 },
  serif2: { family: "Cormorant Garamond", weight: 600, width: 0.5 },
  sans: { family: "Montserrat", weight: 500, width: 0.62 },
  bold: { family: "Montserrat", weight: 700, width: 0.68 },
};
export type Font = (typeof F)[keyof typeof F];
export type Anchor = "start" | "middle" | "end";
export type TextOpts = { anchor?: Anchor; fill?: string; spacing?: number; upper?: boolean; opacity?: number };

// Trộn 2 màu (t = 0 → a, t = 1 → b).
export function mix(a: string, b: string, t: number) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t);
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, "0")}`;
}

// Ngôi sao lấp lánh 4 cánh.
export function star(cx: number, cy: number, r: number) {
  const a = r * 0.1;
  const b = r * 0.25;
  return `M${cx} ${cy - r} C${cx + a} ${cy - b} ${cx + b} ${cy - a} ${cx + r} ${cy} C${cx + b} ${cy + a} ${cx + a} ${cy + b} ${cx} ${cy + r} C${cx - a} ${cy + b} ${cx - b} ${cy + a} ${cx - r} ${cy} C${cx - b} ${cy - a} ${cx - a} ${cy - b} ${cx} ${cy - r} Z`;
}

// Trái tim vẽ trong ô 100×100 (tâm ~ 50,55).
export const HEART = "M50 88 C22 68 10 50 18 34 C25 20 44 20 50 34 C56 20 75 20 82 34 C90 50 78 68 50 88 Z";

// T(): chữ SVG tự thu nhỏ cho vừa bề rộng tối đa. key(): khoá duy nhất cho từng phần tử trong 1 lần vẽ.
export function useSvgText(ink: string) {
  const measure = useMeasure();
  let n = 0;
  const key = () => `k${n++}`;
  const T = (s: string, x: number, y: number, font: Font, size: number, maxW: number, o: TextOpts = {}) => {
    const str = (o.upper ? s.toLocaleUpperCase("vi") : s).trim();
    if (!str) return null;
    const ratio = o.spacing ?? 0;
    const f = fit(str, font.width * (o.upper ? 1.12 : 1), size, size * 0.45, maxW, size * ratio, measure(str, font.family, font.weight, size, size * ratio));
    return (
      <text
        key={key()}
        x={x}
        y={y}
        textAnchor={o.anchor ?? "middle"}
        fontFamily={`'${font.family}'`}
        fontWeight={font.weight}
        fontSize={f.size}
        letterSpacing={f.size * ratio || undefined}
        fill={o.fill ?? ink}
        fillOpacity={o.opacity}
        textLength={f.length}
        lengthAdjust={f.length ? "spacingAndGlyphs" : undefined}
      >
        {str}
      </text>
    );
  };
  const widthOf = (s: string, font: Font, size: number) => fit(s, font.width, size, size, 1e6, 0, measure(s, font.family, font.weight, size, 0)).width;
  return { T, key, widthOf };
}
