import { useId, type ReactNode, type Ref } from "react";
import { fit, useMeasure } from "../design/measure";
import type { PromoFlyerDesign, PromoFlyerTemplate, PromoOffer } from "@/lib/promo-flyer-templates";

// Tờ rơi quảng cáo A4 (khung 600×849): 20 bố cục riêng, nhiều nội dung (bảng giá, quà tặng, liên hệ).

const W = 600;
const H = 849;
const C = W / 2;
export const rn = (n: number) => Math.round(n * 100) / 100;

export type Font = readonly [string, number];
export const F = {
  play: ["Playfair Display", 600],
  play4: ["Playfair Display", 400],
  corm: ["Cormorant Garamond", 600],
  dancing: ["Dancing Script", 700],
  mont: ["Montserrat", 500],
  montB: ["Montserrat", 700],
  fraun: ["Fraunces", 900],
  oswald: ["Oswald", 500],
  viet: ["Be Vietnam Pro", 500],
  vietB: ["Be Vietnam Pro", 700],
} as const satisfies Record<string, Font>;

export function mix(a: string, b: string, t: number) {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  if (x.some(Number.isNaN) || y.some(Number.isNaN)) return a;
  return `#${x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join("")}`;
}

export function twoLines(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length < 2) return [text.trim() || " "];
  let best = 1;
  const diff = (i: number) => Math.abs(words.slice(0, i).join(" ").length - words.slice(i).join(" ").length);
  for (let i = 1; i < words.length; i++) if (diff(i) < diff(best)) best = i;
  return [words.slice(0, best).join(" "), words.slice(best).join(" ")];
}

// "150K" → 150; không đọc được thì NaN.
const kOf = (s: string) => {
  const m = s.replace(/\./g, "").match(/(\d+)/);
  return m ? Number(m[1]) : NaN;
};

export function star(cx: number, cy: number, r: number) {
  const a = r * 0.1;
  const b = r * 0.25;
  return `M${cx} ${cy - r} C${cx + a} ${cy - b} ${cx + b} ${cy - a} ${cx + r} ${cy} C${cx + b} ${cy + a} ${cx + a} ${cy + b} ${cx} ${cy + r} C${cx - a} ${cy + b} ${cx - b} ${cy + a} ${cx - r} ${cy} C${cx - b} ${cy - a} ${cx - a} ${cy - b} ${cx} ${cy - r} Z`;
}

export function burst(cx: number, cy: number, ro: number, ri: number, n: number) {
  return (
    Array.from({ length: n * 2 }, (_, i) => {
      const r = i % 2 ? ri : ro;
      const a = (Math.PI * i) / n - Math.PI / 2;
      return `${i ? "L" : "M"}${rn(cx + r * Math.cos(a))} ${rn(cy + r * Math.sin(a))}`;
    }).join(" ") + " Z"
  );
}

// Số giả ngẫu nhiên cố định (hoa giấy giống nhau trên server và trình duyệt).
export function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/* ---------- Chữ tự co ---------- */

export function Txt({ x, y, t, f, size, fill, anchor = "start", max, sp = 0, op, stroke, sw }: {
  x: number; y: number; t: string; f: Font; size: number; fill: string; anchor?: "start" | "middle" | "end"; max?: number; sp?: number; op?: number; stroke?: string; sw?: number;
}) {
  const measure = useMeasure();
  if (!t) return null;
  const [family, weight] = f;
  const ft = max ? fit(t, 0.58, size, Math.min(size, 7), max, sp, measure(t, family, weight, size, sp)) : { size, width: 0, length: undefined };
  return (
    <text
      x={rn(x)}
      y={rn(y)}
      textAnchor={anchor}
      fontFamily={`'${family}'`}
      fontWeight={weight}
      fontSize={rn(ft.size)}
      letterSpacing={sp ? rn((sp * ft.size) / size) : undefined}
      fill={fill}
      fillOpacity={op}
      stroke={stroke}
      strokeWidth={sw}
      strokeLinejoin={stroke ? "round" : undefined}
      textLength={ft.length ? rn(ft.length) : undefined}
      lengthAdjust={ft.length ? "spacingAndGlyphs" : undefined}
    >
      {t}
    </text>
  );
}

/* ---------- Biểu tượng nhỏ (ô 24×24) ---------- */

export type IconKind = "gift" | "pin" | "phone" | "clock" | "fb" | "check" | "heart" | "star";
export function Icon({ kind, x, y, s = 16, c }: { kind: IconKind; x: number; y: number; s?: number; c: string }) {
  const line = { fill: "none", stroke: c, strokeWidth: 1.9, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const body: Record<IconKind, ReactNode> = {
    gift: (
      <>
        <path d="M4 11h16v10H4z M3 7h18v4H3z M12 7v14" {...line} />
        <path d="M12 7C10 3 6 3.5 7 6.5 7.5 7 9 7 12 7 15 7 16.5 7 17 6.5 18 3.5 14 3 12 7Z" {...line} />
      </>
    ),
    pin: (
      <>
        <path d="M12 22s-7-6.8-7-12a7 7 0 0 1 14 0c0 5.2-7 12-7 12Z" {...line} />
        <circle cx="12" cy="10" r="2.5" {...line} />
      </>
    ),
    phone: <path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2Z" {...line} />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" {...line} />
        <path d="M12 7v5l3.5 2" {...line} />
      </>
    ),
    fb: (
      <>
        <circle cx="12" cy="12" r="10" {...line} />
        <path d="M13.5 20v-6.5h2.3l.4-2.7h-2.7V9.2c0-.8.3-1.3 1.4-1.3h1.4V5.6c-.3 0-1.1-.1-2-.1-2 0-3.3 1.2-3.3 3.4v1.9H8.7v2.7H11V20" {...line} strokeWidth={1.6} />
      </>
    ),
    check: (
      <>
        <circle cx="12" cy="12" r="9.5" {...line} />
        <path d="M7.5 12.3l3 3 6-6.3" {...line} />
      </>
    ),
    heart: <path d="M12 20C6 16 3 12.5 3.5 9 4 6 7.5 4.5 10 6.5L12 8.5 14 6.5C16.5 4.5 20 6 20.5 9 21 12.5 18 16 12 20Z" {...line} />,
    star: <path d={star(12, 12, 9)} fill={c} />,
  };
  return <g transform={`translate(${rn(x - s / 2)} ${rn(y - s / 2)}) scale(${rn(s / 24)})`}>{body[kind]}</g>;
}

/* ---------- Khối nội dung dùng chung ---------- */

type Ink = { ink: string; muted: string; price: string };

// Giá cũ gạch ngang.
function OldPrice({ x, y, t, size, fill, anchor = "end", f = F.viet }: { x: number; y: number; t: string; size: number; fill: string; anchor?: "start" | "middle" | "end"; f?: Font }) {
  const measure = useMeasure();
  if (!t) return null;
  const w = measure(t, f[0], f[1], size, 0) ?? t.length * size * 0.56;
  const x0 = anchor === "end" ? x - w : anchor === "middle" ? x - w / 2 : x;
  return (
    <>
      <Txt x={x} y={y} t={t} f={f} size={size} fill={fill} anchor={anchor} />
      <path d={`M${rn(x0 - 1)} ${rn(y - size * 0.32)} H${rn(x0 + w + 1)}`} stroke={fill} strokeWidth={1} />
    </>
  );
}

// Bảng giá: tên dịch vụ trái, giá cũ gạch + giá mới phải; chia 1 hoặc 2 cột.
function Offers({ x, y, w, offers, c, rowH = 34, size = 14, cols = 1, gap = 30, rule = true, nameF = F.viet, priceF = F.vietB, numbered = false }: {
  x: number; y: number; w: number; offers: PromoOffer[]; c: Ink; rowH?: number; size?: number; cols?: number; gap?: number; rule?: boolean; nameF?: Font; priceF?: Font; numbered?: boolean;
}) {
  const measure = useMeasure();
  const list = offers.filter((o) => o.name || o.now).slice(0, 6);
  const per = Math.max(1, Math.ceil(list.length / cols));
  const cw = (w - gap * (cols - 1)) / cols;
  return (
    <g>
      {list.map((o, i) => {
        const col = Math.floor(i / per);
        const row = i % per;
        const x0 = x + col * (cw + gap) + (numbered ? 34 : 0);
        const w0 = cw - (numbered ? 34 : 0);
        const yy = y + row * rowH;
        const pw = measure(o.now, priceF[0], priceF[1], size + 1, 0) ?? o.now.length * (size + 1) * 0.6;
        const osz = size * 0.8;
        const ow = o.old ? (measure(o.old, nameF[0], nameF[1], osz, 0) ?? o.old.length * osz * 0.56) + 10 : 0;
        return (
          <g key={i}>
            {numbered && <Txt x={x0 - 34} y={yy} t={String(i + 1).padStart(2, "0")} f={F.montB} size={size * 0.8} fill={c.price} />}
            <Txt x={x0} y={yy} t={o.name} f={nameF} size={size} fill={c.ink} max={Math.max(40, w0 - pw - ow - 12)} />
            {o.old && <OldPrice x={x0 + w0 - pw - 8} y={yy} t={o.old} size={osz} fill={c.muted} f={nameF} />}
            <Txt x={x0 + w0} y={yy} t={o.now} f={priceF} size={size + 1} fill={c.price} anchor="end" />
            {rule && row < per - 1 && i < list.length - 1 && (
              <path d={`M${rn(x0 - (numbered ? 34 : 0))} ${rn(yy + rowH * 0.42)} H${rn(x0 + w0)}`} stroke={c.muted} strokeOpacity={0.45} strokeWidth={0.8} strokeDasharray="2 3" />
            )}
          </g>
        );
      })}
    </g>
  );
}

// Quà tặng kèm: ngang (mỗi món 1 ô) hoặc dọc.
function Perks({ x, y, w, items, ink, icon, cols = 3, size = 12, rowH = 28, kind = "gift" }: {
  x: number; y: number; w: number; items: string[]; ink: string; icon: string; cols?: number; size?: number; rowH?: number; kind?: IconKind;
}) {
  const list = items.filter(Boolean).slice(0, 3);
  const cw = w / cols;
  return (
    <g>
      {list.map((t, i) => {
        const x0 = x + (i % cols) * cw;
        const y0 = y + Math.floor(i / cols) * rowH;
        return (
          <g key={i}>
            <Icon kind={kind} x={x0 + 9} y={y0 - size * 0.36} s={17} c={icon} />
            <Txt x={x0 + 24} y={y0} t={t} f={F.viet} size={size} fill={ink} max={cw - 30} />
          </g>
        );
      })}
    </g>
  );
}

// Liên hệ: địa chỉ, điện thoại, giờ mở cửa, mạng xã hội.
function Contact({ x, y, w, d, ink, icon, cols = 2, size = 12, rowH = 26 }: {
  x: number; y: number; w: number; d: PromoFlyerDesign; ink: string; icon: string; cols?: number; size?: number; rowH?: number;
}) {
  const items: [IconKind, string][] = ([["pin", d.address], ["phone", d.phone], ["clock", d.hours], ["fb", d.social]] as [IconKind, string][]).filter(([, t]) => t);
  const cw = w / cols;
  return (
    <g>
      {items.map(([k, t], i) => {
        const x0 = x + (i % cols) * cw;
        const y0 = y + Math.floor(i / cols) * rowH;
        return (
          <g key={k}>
            <Icon kind={k} x={x0 + 8} y={y0 - size * 0.36} s={16} c={icon} />
            <Txt x={x0 + 23} y={y0} t={t} f={k === "phone" ? F.vietB : F.viet} size={k === "phone" ? size + 1 : size} fill={ink} max={cw - 30} />
          </g>
        );
      })}
    </g>
  );
}

export function Photo({ href, x, y, w, h, clip, id }: { href?: string; x: number; y: number; w: number; h: number; clip: string; id: string }) {
  if (!href) return null;
  return (
    <>
      <clipPath id={id}>
        <path d={clip} />
      </clipPath>
      <image href={href} x={x} y={y} width={w} height={h} preserveAspectRatio="xMidYMid slice" clipPath={`url(#${id})`} />
    </>
  );
}

export const arch = (x: number, y: number, w: number, h: number) => `M${x} ${y + h} V${y + w / 2} A${w / 2} ${w / 2} 0 0 1 ${x + w} ${y + w / 2} V${y + h} Z`;
export const rounded = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r} ${y} H${x + w - r} Q${x + w} ${y} ${x + w} ${y + r} V${y + h - r} Q${x + w} ${y + h} ${x + w - r} ${y + h} H${x + r} Q${x} ${y + h} ${x} ${y + h - r} V${y + r} Q${x} ${y} ${x + r} ${y} Z`;

function Balloon({ cx, cy, r, color, to }: { cx: number; cy: number; r: number; color: string; to: [number, number] }) {
  const by = cy + r * 1.18;
  return (
    <g>
      <path d={`M${cx} ${by + 6} C${cx - 10} ${by + 40} ${to[0] + 14} ${to[1] - 50} ${to[0]} ${to[1]}`} fill="none" stroke={mix(color, "#000000", 0.35)} strokeWidth={1.2} />
      <ellipse cx={cx} cy={cy} rx={r} ry={rn(r * 1.18)} fill={color} />
      <path d={`M${cx - 5} ${by + 6} L${cx} ${by - 1} L${cx + 5} ${by + 6} Z`} fill={color} />
      <ellipse cx={rn(cx - r * 0.38)} cy={rn(cy - r * 0.45)} rx={rn(r * 0.16)} ry={rn(r * 0.3)} transform={`rotate(25 ${rn(cx - r * 0.38)} ${rn(cy - r * 0.45)})`} fill="#fff" fillOpacity={0.55} />
    </g>
  );
}

export function Sprig({ x, y, s = 1, rot = 0, color }: { x: number; y: number; s?: number; rot?: number; color: string }) {
  const leaf = "M0 0 C-6 -7 -6 -18 0 -26 C6 -18 6 -7 0 0 Z";
  const pts: [number, number, number][] = [[-4, -20, -55], [2, -38, 50], [-3, -56, -55], [3, -74, 48], [-1, -92, -50], [1, -106, 5]];
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <path d="M0 0 C-4 -40 4 -80 0 -110" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      {pts.map(([px, py, r]) => (
        <path key={py} d={leaf} transform={`translate(${px} ${py}) rotate(${r})`} fill={color} />
      ))}
    </g>
  );
}

export function Blossom({ x, y, r, petal, center }: { x: number; y: number; r: number; petal: string; center: string }) {
  return (
    <g>
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx={x} cy={rn(y - r * 0.55)} rx={rn(r * 0.42)} ry={rn(r * 0.55)} transform={`rotate(${a} ${x} ${y})`} fill={petal} />
      ))}
      <circle cx={x} cy={y} r={rn(r * 0.24)} fill={center} />
    </g>
  );
}

function Bottle({ x, y, s = 1, body, cap, outline }: { x: number; y: number; s?: number; body: string; cap: string; outline?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-18} y={-110} width={36} height={56} rx={9} fill={cap} />
      <rect x={-25} y={-58} width={50} height={11} rx={3} fill={cap} />
      <rect x={-46} y={-49} width={92} height={86} rx={22} fill={body} stroke={outline} strokeWidth={outline ? 3 : 0} />
      <rect x={-34} y={-36} width={8} height={46} rx={4} fill="#fff" fillOpacity={0.55} />
    </g>
  );
}

/* ---------- Mặt sau: bảng giá đầy đủ, mỗi mẫu một kiểu trình bày ---------- */

type Sec = { title: string; items: { name: string; price: string }[] };
type MenuStyle =
  | "leader" | "centered" | "cards" | "stacked" | "tiles" | "tickets" | "leaves" | "pills" | "magazine" | "numbered"
  | "bars" | "chips" | "timeline" | "circles" | "ribbons" | "table" | "priceFirst" | "checks" | "rows" | "roman";
// ink: chữ trong khung/thẻ · page: chữ trực tiếp trên nền trang · fill: nền thẻ/khung tự vẽ.
type MC = { ink: string; page: string; muted: string; price: string; accent: string; soft: string; fill: string; head: Font; bg: string };
type Box = { x: number; y: number; w: number; h: number };

const cl = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
// Vị trí bắt đầu của từng khối xếp chồng (tính trước, không cộng dồn lúc vẽ).
const offsets = <T,>(list: T[], start: number, size: (item: T) => number) =>
  list.reduce<number[]>((acc, item, i) => [...acc, i ? acc[i - 1] + size(list[i - 1]) : start], []);

function balance(secs: Sec[], n: number, weight = (s: Sec) => s.items.length + 1.8) {
  const cols: Sec[][] = Array.from({ length: n }, () => []);
  const load = Array.from({ length: n }, () => 0);
  for (const s of secs) {
    const i = load.indexOf(Math.min(...load));
    cols[i].push(s);
    load[i] += weight(s);
  }
  return { cols, max: Math.max(1, ...load) };
}

// Một dòng dịch vụ: tên trái, giá phải; tuỳ chọn gạch chấm phía dưới.
function Item({ x, y, w, it, size, c, rule, nameF = F.viet, priceF = F.vietB, upper = false, priceFill, nameFill }: {
  x: number; y: number; w: number; it: Sec["items"][number]; size: number; c: MC; rule?: number; nameF?: Font; priceF?: Font; upper?: boolean; priceFill?: string; nameFill?: string;
}) {
  const measure = useMeasure();
  const pw = measure(it.price, priceF[0], priceF[1], size, 0) ?? it.price.length * size * 0.6;
  return (
    <>
      <Txt x={x} y={y} t={upper ? it.name.toLocaleUpperCase("vi") : it.name} f={nameF} size={upper ? size * 0.86 : size} sp={upper ? 0.8 : 0} fill={nameFill ?? c.ink} max={Math.max(30, w - pw - 10)} />
      <Txt x={x + w} y={y} t={it.price} f={priceF} size={size} fill={priceFill ?? c.price} anchor="end" />
      {rule !== undefined && <path d={`M${rn(x)} ${rn(y + rule)} H${rn(x + w)}`} stroke={c.muted} strokeOpacity={0.5} strokeWidth={0.7} strokeDasharray="2 3" />}
    </>
  );
}

// Khung chung cho các kiểu 2 cột: tự chia cột, tính cỡ dòng; head/item vẽ theo từng kiểu.
function TwoCols({ box, secs, gap = 34, minRow = 15, maxRow = 34, headK = 1.25, cols: n = 2, weight, children }: {
  box: Box; secs: Sec[]; gap?: number; minRow?: number; maxRow?: number; headK?: number; cols?: number; weight?: (s: Sec) => number;
  children: (a: { s: Sec; x: number; cw: number; y: number; rowH: number; size: number; si: number; first: number; col: number }) => ReactNode;
}) {
  const { cols, max } = balance(secs, n, weight ?? ((s) => s.items.length + headK + 0.55));
  const cw = (box.w - gap * (n - 1)) / n;
  const rowH = cl(box.h / max, minRow, maxRow);
  const size = cl(rowH * 0.5, 9.5, 14.5);
  return (
    <>
      {cols.map((col, ci) => {
        const x = box.x + ci * (cw + gap);
        const heads = offsets(col, box.y + size * 1.1, (s) => rowH * headK + s.items.length * rowH + rowH * 0.55);
        return (
          <g key={ci}>
            {col.map((s, k) => {
              const head = heads[k];
              const first = head + rowH * headK;
              return <g key={s.title + head}>{children({ s, x, cw, y: head, rowH, size, si: secs.indexOf(s), first, col: ci })}</g>;
            })}
          </g>
        );
      })}
    </>
  );
}

function CenterItem({ cx, y, it, size, maxW, c }: { cx: number; y: number; it: Sec["items"][number]; size: number; maxW: number; c: MC }) {
  const measure = useMeasure();
  const w = (measure(it.name, F.viet[0], F.viet[1], size, 0) ?? it.name.length * size * 0.55) + (measure(it.price, F.vietB[0], F.vietB[1], size, 0) ?? it.price.length * size * 0.6) + size * 1.6;
  const s = rn(size * Math.min(1, maxW / w));
  return (
    <text x={rn(cx)} y={rn(y)} textAnchor="middle" fontFamily={`'${F.viet[0]}'`} fontWeight={F.viet[1]} fontSize={s}>
      <tspan fill={c.ink}>{it.name}</tspan>
      <tspan fill={c.muted}>{" · "}</tspan>
      <tspan fill={c.price} fontFamily={`'${F.vietB[0]}'`} fontWeight={F.vietB[1]}>
        {it.price}
      </tspan>
    </text>
  );
}

function PillPrice({ x, y, t, size, fill, color }: { x: number; y: number; t: string; size: number; fill: string; color: string }) {
  const measure = useMeasure();
  const w = (measure(t, F.vietB[0], F.vietB[1], size, 0) ?? t.length * size * 0.6) + size * 1.2;
  const h = size * 1.5;
  return (
    <>
      <rect x={rn(x - w)} y={rn(y - size * 1.05)} width={rn(w)} height={rn(h)} rx={rn(h / 2)} fill={fill} />
      <Txt x={x - w / 2} y={y} t={t} f={F.vietB} size={size} fill={color} anchor="middle" />
    </>
  );
}

function Ribbon({ cx, y, t, size, fill, color, maxW }: { cx: number; y: number; t: string; size: number; fill: string; color: string; maxW: number }) {
  const measure = useMeasure();
  const w = Math.min(maxW, (measure(t, F.montB[0], F.montB[1], size, size * 0.08) ?? t.length * size * 0.7) + 44);
  const h = size * 1.9;
  const [x0, x1, top] = [cx - w / 2, cx + w / 2, y - size * 1.3];
  return (
    <>
      <path d={`M${rn(x0)} ${rn(top)} H${rn(x1)} L${rn(x1 - 9)} ${rn(top + h / 2)} L${rn(x1)} ${rn(top + h)} H${rn(x0)} L${rn(x0 + 9)} ${rn(top + h / 2)} Z`} fill={fill} />
      <Txt x={cx} y={y} t={t} f={F.montB} size={size} fill={color} anchor="middle" sp={1} max={w - 30} />
    </>
  );
}

function OutlinePill({ x, y, t, size, stroke }: { x: number; y: number; t: string; size: number; stroke: string }) {
  const measure = useMeasure();
  const w = (measure(t, F.montB[0], F.montB[1], size, 0) ?? t.length * size * 0.7) + 28;
  return (
    <>
      <rect x={rn(x)} y={rn(y - size * 1.15)} width={rn(w)} height={rn(size * 1.65)} rx={rn(size * 0.82)} fill="none" stroke={stroke} strokeWidth={1.6} />
      <Txt x={x + 14} y={y} t={t} f={F.montB} size={size} fill={stroke} />
    </>
  );
}

const ROMAN = ["I", "II", "III", "IV"];
const leaf = "M0 0 C-4 -5 -4 -12 0 -17 C4 -12 4 -5 0 0 Z";

function PromoMenu({ style, box, secs, c }: { style: MenuStyle; box: Box; secs: Sec[]; c: MC }) {
  const upper = (t: string) => t.toLocaleUpperCase("vi");
  switch (style) {
    case "leader":
      return (
        <TwoCols box={box} secs={secs}>
          {({ s, x, cw, y, rowH, size, first }) => (
            <>
              <Txt x={x} y={y} t={upper(s.title)} f={F.montB} size={size * 0.92} fill={c.price} sp={1.2} max={cw} />
              <path d={`M${rn(x)} ${rn(y + 7)} H${rn(x + cw)}`} stroke={c.price} strokeWidth={1} />
              {s.items.map((it, i) => <Item key={i} x={x} y={first + i * rowH} w={cw} it={it} size={size} c={c} rule={i < s.items.length - 1 ? rowH * 0.36 : undefined} />)}
            </>
          )}
        </TwoCols>
      );

    case "centered":
      return (
        <TwoCols box={box} secs={secs} headK={1.5}>
          {({ s, x, cw, y, rowH, size, first }) => (
            <>
              <Txt x={x + cw / 2} y={y} t={s.title} f={F.dancing} size={size * 1.55} fill={c.price} anchor="middle" max={cw} />
              <path d={`M${rn(x + cw / 2 - 44)} ${rn(y + 10)} H${rn(x + cw / 2 - 10)} M${rn(x + cw / 2 + 10)} ${rn(y + 10)} H${rn(x + cw / 2 + 44)}`} stroke={c.price} strokeWidth={0.8} />
              <path d={star(rn(x + cw / 2), rn(y + 10), 4)} fill={c.price} />
              {s.items.map((it, i) => <CenterItem key={i} cx={x + cw / 2} y={first + i * rowH} it={it} size={size} maxW={cw} c={c} />)}
            </>
          )}
        </TwoCols>
      );

    case "cards":
    case "tickets": {
      const n = secs.length;
      const cols = n > 1 ? 2 : 1;
      const rows = Math.ceil(n / cols);
      const gap = 14;
      const cw = (box.w - gap * (cols - 1)) / cols;
      const ch = (box.h - gap * (rows - 1)) / rows;
      const bandH = style === "cards" ? 34 : 40;
      const most = Math.max(1, ...secs.map((s) => s.items.length));
      const rowH = cl((ch - bandH - 20) / most, 14, 30);
      const size = cl(rowH * 0.52, 9.5, 14);
      const palette = [c.accent, c.soft, "#A8E6CF", "#A0C4FF"];
      return (
        <>
          {secs.map((s, i) => {
            const x = box.x + (i % cols) * (cw + gap);
            const y = box.y + Math.floor(i / cols) * (ch + gap);
            const band = palette[i % 4];
            return (
              <g key={i}>
                {style === "cards" ? (
                  <>
                    <rect x={x} y={y} width={cw} height={ch} rx={16} fill={c.fill} stroke={band} strokeWidth={2} />
                    <path d={`M${x} ${y + bandH} V${y + 16} Q${x} ${y} ${x + 16} ${y} H${x + cw - 16} Q${x + cw} ${y} ${x + cw} ${y + 16} V${y + bandH} Z`} fill={band} />
                    <Txt x={x + cw / 2} y={y + bandH * 0.66} t={upper(s.title)} f={F.montB} size={12} fill={c.ink} anchor="middle" sp={1.2} max={cw - 24} />
                  </>
                ) : (
                  <>
                    <rect x={x} y={y} width={cw} height={ch} rx={12} fill={c.fill} />
                    <circle cx={x} cy={y + bandH} r={9} fill={c.bg} />
                    <circle cx={x + cw} cy={y + bandH} r={9} fill={c.bg} />
                    <path d={`M${x + 14} ${y + bandH} H${x + cw - 14}`} stroke={c.price} strokeOpacity={0.6} strokeWidth={1.2} strokeDasharray="6 5" />
                    <Txt x={x + 16} y={y + bandH * 0.68} t={s.title} f={c.head} size={17} fill={c.ink} max={cw - 32} />
                  </>
                )}
                {s.items.map((it, j) => (
                  <Item key={j} x={x + 16} y={y + bandH + 10 + rowH * (j + 0.75)} w={cw - 32} it={it} size={size} c={c} rule={j < s.items.length - 1 ? rowH * 0.36 : undefined} />
                ))}
              </g>
            );
          })}
        </>
      );
    }

    case "stacked":
    case "leaves": {
      const headH = 44;
      const gapB = 12;
      const rowsOf = (s: Sec) => Math.ceil(s.items.length / 2);
      const total = Math.max(1, secs.reduce((a, s) => a + rowsOf(s), 0));
      const rowH = cl((box.h - secs.length * (headH + gapB)) / total, 15, 30);
      const size = cl(rowH * 0.5, 9.5, 14);
      const sub = (box.w - 34) / 2;
      const tops = offsets(secs, box.y, (s) => headH + rowsOf(s) * rowH + gapB);
      return (
        <>
          {secs.map((s, i) => {
            const top = tops[i];
            const cx = box.x + box.w / 2;
            return (
              <g key={i}>
                {style === "stacked" ? (
                  <>
                    <Txt x={cx} y={top + 22} t={upper(s.title)} f={c.head} size={18} fill={c.page} anchor="middle" sp={5} max={box.w - 40} />
                    <path d={`M${cx - 60} ${top + 32} H${cx + 60} M${cx - 60} ${top + 35.5} H${cx + 60}`} stroke={c.price} strokeWidth={0.8} />
                  </>
                ) : (
                  <>
                    <Txt x={cx} y={top + 24} t={s.title} f={c.head} size={19} fill={c.page} anchor="middle" max={box.w - 120} />
                    {[-1, 1].map((dir) => (
                      <g key={dir} transform={`translate(${cx + dir * 120} ${top + 18})`}>
                        <path d={`M0 0 H${dir * 40}`} stroke={c.price} strokeWidth={1} />
                        <path d={leaf} transform={`translate(${dir * 12} 0) rotate(${dir * 60})`} fill={c.price} />
                        <path d={leaf} transform={`translate(${dir * 24} 0) rotate(${dir * 120})`} fill={c.price} />
                      </g>
                    ))}
                  </>
                )}
                {s.items.map((it, j) => {
                  const col = j % 2;
                  const row = Math.floor(j / 2);
                  return (
                    <Item key={j} x={box.x + col * (sub + 34)} y={top + headH + rowH * (row + 0.7)} w={sub} it={it} size={size} c={{ ...c, ink: c.page }} upper={style === "stacked"} nameF={style === "stacked" ? F.mont : F.viet} priceF={style === "stacked" ? F.play : F.vietB} rule={style === "leaves" && row < rowsOf(s) - 1 ? rowH * 0.36 : undefined} />
                  );
                })}
              </g>
            );
          })}
        </>
      );
    }

    case "tiles": {
      const gap = 10;
      const tw = (box.w - gap * 2) / 3;
      const hh = 26;
      const rowsOf = (s: Sec) => Math.ceil(s.items.length / 3);
      const totalRows = Math.max(1, secs.reduce((a, s) => a + rowsOf(s), 0));
      const th = cl((box.h - secs.length * hh - totalRows * gap) / totalRows, 30, 70);
      const palette = [c.accent, c.soft, "#06D6A0", "#118AB2"];
      const tops = offsets(secs, box.y, (s) => hh + rowsOf(s) * (th + gap));
      return (
        <>
          {secs.map((s, i) => {
            const top = tops[i];
            const col = palette[i % 4];
            return (
              <g key={i}>
                <circle cx={box.x + 6} cy={top + 12} r={5} fill={col} />
                <Txt x={box.x + 18} y={top + 17} t={upper(s.title)} f={F.montB} size={12} fill={c.page} sp={1.5} max={box.w - 20} />
                {s.items.map((it, j) => {
                  const x = box.x + (j % 3) * (tw + gap);
                  const ty = top + hh + Math.floor(j / 3) * (th + gap);
                  return (
                    <g key={j}>
                      <rect x={rn(x)} y={rn(ty)} width={rn(tw)} height={rn(th)} rx={10} fill={c.fill} stroke={col} strokeWidth={2} />
                      <Txt x={x + tw / 2} y={ty + th * 0.42} t={it.name} f={F.viet} size={cl(th * 0.22, 9, 12.5)} fill={c.ink} anchor="middle" max={tw - 12} />
                      <Txt x={x + tw / 2} y={ty + th * 0.8} t={it.price} f={F.fraun} size={cl(th * 0.32, 11, 20)} fill={c.price} anchor="middle" max={tw - 12} />
                    </g>
                  );
                })}
              </g>
            );
          })}
        </>
      );
    }

    case "pills":
      return (
        <TwoCols box={box} secs={secs} minRow={18}>
          {({ s, x, cw, y, rowH, size, first }) => (
            <>
              <Txt x={x} y={y} t={s.title} f={F.fraun} size={size * 1.25} fill={c.ink} max={cw} />
              <path d={`M${x} ${rn(y + 8)} q6 -4 12 0 t12 0 t12 0 t12 0`} fill="none" stroke={c.accent} strokeWidth={2} strokeLinecap="round" />
              {s.items.map((it, i) => (
                <g key={i}>
                  <Txt x={x} y={first + i * rowH} t={it.name} f={F.viet} size={size} fill={c.ink} max={cw - 70} />
                  <PillPrice x={x + cw} y={first + i * rowH} t={it.price} size={size * 0.92} fill={c.price} color="#fff" />
                </g>
              ))}
            </>
          )}
        </TwoCols>
      );

    case "magazine":
      return (
        <>
          <path d={`M${rn(box.x + box.w / 3)} ${box.y} V${box.y + box.h} M${rn(box.x + (box.w * 2) / 3)} ${box.y} V${box.y + box.h}`} stroke={c.page} strokeOpacity={0.2} strokeWidth={1} />
          <TwoCols box={box} secs={secs} cols={3} gap={24} maxRow={32} headK={1.5}>
            {({ s, x, cw, y, rowH, size, first }) => (
              <>
                <Txt x={x} y={y + 2} t={s.title} f={c.head} size={size * 1.35} fill={c.page} max={cw} />
                <rect x={x} y={rn(y + 9)} width={26} height={3} fill={c.price} />
                {s.items.map((it, i) => <Item key={i} x={x} y={first + i * rowH} w={cw} it={it} size={size * 0.92} c={{ ...c, ink: c.page }} />)}
              </>
            )}
          </TwoCols>
        </>
      );

    case "numbered": {
      const starts = offsets(secs, 0, (s) => s.items.length);
      const offset = new Map(secs.map((s, i) => [s, starts[i]]));
      return (
        <TwoCols box={box} secs={secs}>
          {({ s, x, cw, y, rowH, size, first }) => (
            <>
              <Txt x={x} y={y} t={upper(s.title)} f={F.montB} size={size * 0.82} fill={c.muted} sp={3} max={cw} />
              <path d={`M${rn(x)} ${rn(y + 7)} H${rn(x + cw)}`} stroke={c.page} strokeOpacity={0.3} strokeWidth={1} />
              {s.items.map((it, i) => (
                <g key={i}>
                  <Txt x={x} y={first + i * rowH} t={String((offset.get(s) ?? 0) + i + 1).padStart(2, "0")} f={F.montB} size={size * 1.25} fill={c.accent} />
                  <Item x={x + size * 2.4} y={first + i * rowH} w={cw - size * 2.4} it={it} size={size} c={{ ...c, ink: c.page, price: c.page }} priceF={F.montB} />
                </g>
              ))}
            </>
          )}
        </TwoCols>
      );
    }

    case "bars":
      return (
        <TwoCols box={box} secs={secs} headK={1.45}>
          {({ s, x, cw, y, rowH, size, first }) => (
            <>
              <rect x={x} y={rn(y - size * 1.2)} width={cw} height={rn(size * 1.75)} rx={3} fill={c.price} />
              <Txt x={x + 10} y={y} t={upper(s.title)} f={F.montB} size={size * 0.95} fill="#fff" sp={1.2} max={cw - 20} />
              {s.items.map((it, i) => (
                <g key={i}>
                  <Item x={x + 4} y={first + i * rowH} w={cw - 8} it={it} size={size} c={c} />
                  {i < s.items.length - 1 && <path d={`M${x} ${rn(first + i * rowH + rowH * 0.36)} H${x + cw}`} stroke={c.ink} strokeOpacity={0.1} strokeWidth={1} />}
                </g>
              ))}
            </>
          )}
        </TwoCols>
      );

    case "chips":
      return (
        <TwoCols box={box} secs={secs} minRow={18} headK={1.4}>
          {({ s, x, cw, y, rowH, size, first }) => (
            <>
              <Txt x={x} y={y} t={s.title} f={F.fraun} size={size * 1.3} fill={c.page} max={cw} />
              {s.items.map((it, i) => {
                const yy = first + i * rowH;
                return (
                  <g key={i}>
                    <rect x={x} y={rn(yy - rowH * 0.62)} width={cw} height={rn(rowH * 0.84)} rx={rn(rowH * 0.3)} fill={c.fill} stroke={c.soft} strokeWidth={1.2} />
                    <Item x={x + 12} y={yy} w={cw - 24} it={it} size={size * 0.94} c={c} />
                  </g>
                );
              })}
            </>
          )}
        </TwoCols>
      );

    case "timeline":
      return (
        <TwoCols box={box} secs={secs}>
          {({ s, x, cw, y, rowH, size, first }) => (
            <>
              <path d={`M${x + 7} ${rn(y - size * 0.35)} V${rn(first + (s.items.length - 1) * rowH - size * 0.35)}`} stroke={c.accent} strokeWidth={1.6} />
              <circle cx={x + 7} cy={rn(y - size * 0.35)} r={6} fill={c.accent} />
              <Txt x={x + 22} y={y} t={upper(s.title)} f={F.montB} size={size * 0.95} fill={c.accent} sp={1} max={cw - 22} />
              {s.items.map((it, i) => (
                <g key={i}>
                  <circle cx={x + 7} cy={rn(first + i * rowH - size * 0.35)} r={3.4} fill={c.fill} stroke={c.accent} strokeWidth={1.6} />
                  <Item x={x + 22} y={first + i * rowH} w={cw - 22} it={it} size={size} c={c} />
                </g>
              ))}
            </>
          )}
        </TwoCols>
      );

    case "circles":
      return (
        <TwoCols box={box} secs={secs} minRow={24} headK={1.35}>
          {({ s, x, cw, y, rowH, size, first }) => {
            const r = rowH * 0.43;
            return (
              <>
                <Txt x={x} y={y} t={s.title} f={F.fraun} size={size * 1.25} fill={c.ink} max={cw} />
                <path d={`M${x} ${rn(y + 8)} q8 -5 16 0 t16 0 t16 0`} fill="none" stroke={c.accent} strokeWidth={2} strokeLinecap="round" />
                {s.items.map((it, i) => {
                  const yy = first + i * rowH;
                  return (
                    <g key={i}>
                      <Txt x={x} y={yy} t={it.name} f={F.viet} size={size} fill={c.ink} max={cw - r * 2 - 12} />
                      <circle cx={rn(x + cw - r)} cy={rn(yy - size * 0.35)} r={rn(r)} fill={c.accent} />
                      <Txt x={x + cw - r} y={yy - size * 0.35 + r * 0.22} t={it.price} f={F.vietB} size={r * 0.6} fill="#fff" anchor="middle" max={r * 1.7} />
                    </g>
                  );
                })}
              </>
            );
          }}
        </TwoCols>
      );

    case "ribbons":
      return (
        <TwoCols box={box} secs={secs} headK={1.6}>
          {({ s, x, cw, y, rowH, size, first }) => (
            <>
              <Ribbon cx={x + cw / 2} y={y} t={upper(s.title)} size={size * 0.9} fill={c.price} color="#fff" maxW={cw} />
              {s.items.map((it, i) => (
                <g key={i}>
                  <Icon kind="heart" x={x + 6} y={first + i * rowH - size * 0.36} s={size * 1.05} c={c.accent} />
                  <Item x={x + 18} y={first + i * rowH} w={cw - 18} it={it} size={size} c={c} />
                </g>
              ))}
            </>
          )}
        </TwoCols>
      );

    case "table": {
      const hh = 30;
      const { cols, max } = balance(secs, 2, (s) => s.items.length + 1.3);
      const gap = 16;
      const cw = (box.w - gap) / 2;
      const rowH = cl((box.h - hh - 10) / max, 15, 30);
      const size = cl(rowH * 0.5, 9.5, 14);
      return (
        <>
          {cols.map((col, ci) => {
            const x = box.x + ci * (cw + gap);
            const tops = offsets(col, box.y + hh, (s) => (s.items.length + 1.3) * rowH);
            const used = col.reduce((a, s) => a + (s.items.length + 1.3) * rowH, 0);
            return (
              <g key={ci}>
                <rect x={x} y={box.y} width={cw} height={rn(hh + used + 8)} rx={10} fill={c.fill} />
                <path d={`M${x} ${box.y + hh} V${box.y + 10} Q${x} ${box.y} ${x + 10} ${box.y} H${x + cw - 10} Q${x + cw} ${box.y} ${x + cw} ${box.y + 10} V${box.y + hh} Z`} fill={c.price} />
                <Txt x={x + 12} y={box.y + hh * 0.66} t="DỊCH VỤ" f={F.montB} size={10} fill={c.fill} sp={2} />
                <Txt x={x + cw - 12} y={box.y + hh * 0.66} t="GIÁ" f={F.montB} size={10} fill={c.fill} anchor="end" sp={2} />
                {col.map((s, k) => {
                  const top = tops[k];
                  return (
                    <g key={s.title + top}>
                      <rect x={x} y={rn(top)} width={cw} height={rn(rowH * 1.3)} fill={mix(c.fill, c.price, 0.14)} />
                      <Txt x={x + 12} y={top + rowH * 0.9} t={upper(s.title)} f={F.montB} size={size * 0.9} fill={c.price} sp={1} max={cw - 24} />
                      {s.items.map((it, j) => {
                        const ry = top + rowH * (1.3 + j);
                        return (
                          <g key={j}>
                            {j % 2 === 1 && <rect x={x} y={rn(ry)} width={cw} height={rn(rowH)} fill={mix(c.fill, c.ink, 0.05)} />}
                            <Item x={x + 12} y={ry + rowH * 0.68} w={cw - 24} it={it} size={size} c={c} />
                          </g>
                        );
                      })}
                    </g>
                  );
                })}
              </g>
            );
          })}
        </>
      );
    }

    case "priceFirst":
      return (
        <TwoCols box={box} secs={secs} headK={1.4}>
          {({ s, x, cw, y, rowH, size, first }) => (
            <>
              <Txt x={x} y={y} t={upper(s.title)} f={F.oswald} size={size * 1.35} fill={c.page} sp={1} max={cw} />
              <rect x={x} y={rn(y + 7)} width={40} height={3} fill={c.accent} />
              {s.items.map((it, i) => (
                <g key={i}>
                  <Txt x={x + size * 4.4} y={first + i * rowH} t={it.price} f={F.fraun} size={size * 1.2} fill={c.accent} anchor="end" max={size * 4.2} />
                  <Txt x={x + size * 5.2} y={first + i * rowH} t={it.name} f={F.viet} size={size} fill={c.ink} max={cw - size * 5.2} />
                </g>
              ))}
            </>
          )}
        </TwoCols>
      );

    case "checks":
      return (
        <TwoCols box={box} secs={secs} headK={1.6}>
          {({ s, x, cw, y, rowH, size, first }) => (
            <>
              <OutlinePill x={x} y={y} t={upper(s.title)} size={size * 0.85} stroke={c.ink} />
              {s.items.map((it, i) => (
                <g key={i}>
                  <Icon kind="check" x={x + 7} y={first + i * rowH - size * 0.36} s={size * 1.15} c={c.accent} />
                  <Item x={x + 20} y={first + i * rowH} w={cw - 20} it={it} size={size} c={c} />
                </g>
              ))}
            </>
          )}
        </TwoCols>
      );

    case "rows": {
      const labelW = 128;
      const gapB = 12;
      const rowsOf = (s: Sec) => Math.max(2.4, Math.ceil(s.items.length / 2));
      const total = Math.max(1, secs.reduce((a, s) => a + rowsOf(s), 0));
      const rowH = cl((box.h - secs.length * (gapB + 14)) / total, 15, 30);
      const size = cl(rowH * 0.5, 9.5, 14);
      const sub = (box.w - labelW - 18 - 24) / 2;
      const tops = offsets(secs, box.y, (s) => rowsOf(s) * rowH + 14 + gapB);
      return (
        <>
          {secs.map((s, i) => {
            const top = tops[i];
            const bh = rowsOf(s) * rowH + 14;
            const lines = twoLines(s.title);
            return (
              <g key={i}>
                <rect x={box.x} y={top} width={labelW} height={bh} rx={10} fill={c.fill} />
                {lines.map((ln, k) => (
                  <Txt key={k} x={box.x + labelW / 2} y={top + bh / 2 + (k - (lines.length - 1) / 2) * 17 + 5} t={ln} f={c.head} size={14} fill={c.soft} anchor="middle" max={labelW - 16} />
                ))}
                <path d={`M${box.x + labelW + 18} ${top + bh + gapB / 2} H${box.x + box.w}`} stroke={c.page} strokeOpacity={0.12} strokeWidth={1} />
                {s.items.map((it, j) => (
                  <Item key={j} x={box.x + labelW + 18 + (j % 2) * (sub + 24)} y={top + 7 + rowH * (Math.floor(j / 2) + 0.72)} w={sub} it={it} size={size} c={{ ...c, ink: c.page }} />
                ))}
              </g>
            );
          })}
        </>
      );
    }

    case "roman":
      return (
        <TwoCols box={box} secs={secs} headK={1.5}>
          {({ s, x, cw, y, rowH, size, first, si }) => (
            <>
              <Txt x={x} y={y + 2} t={ROMAN[si] ?? String(si + 1)} f={c.head} size={size * 1.8} fill={c.accent} />
              <Txt x={x + size * 2.6} y={y} t={upper(s.title)} f={F.montB} size={size * 0.85} fill={c.page} sp={1.5} max={cw - size * 2.6} />
              <path d={`M${rn(x + size * 2.6)} ${rn(y + 7)} H${rn(x + cw)}`} stroke={c.accent} strokeWidth={0.8} />
              {s.items.map((it, i) => (
                <g key={i}>
                  <Icon kind="star" x={x + 5} y={first + i * rowH - size * 0.36} s={size * 0.75} c={c.accent} />
                  <Item x={x + 16} y={first + i * rowH} w={cw - 16} it={it} size={size} c={{ ...c, ink: c.page }} />
                </g>
              ))}
            </>
          )}
        </TwoCols>
      );
  }
}

type BackCfg = {
  menu: MenuStyle;
  head: Font; // phông tiêu đề
  titleColor?: string;
  card?: string; // khung lớn bao bảng giá
  cardStroke?: string;
  ink?: string; // chữ trong khung/thẻ
  fill?: string; // nền thẻ tự vẽ của kiểu bảng giá
  price?: string;
  top?: number; // đường chân chữ của tiêu đề
  deco?: ReactNode;
};

function backCfg(t: PromoFlyerTemplate, photo: string | undefined, uid: string): BackCfg {
  const { bg, ink, accent, soft } = t.colors;
  const rnd = seeded(t.id.length * 13);
  const confetti = (colors: string[], n = 26, maxY = 150) =>
    Array.from({ length: n }, (_, i) => {
      const x = rn(16 + rnd() * 568);
      const y = rn(12 + rnd() * maxY);
      return i % 2 ? <circle key={i} cx={x} cy={y} r={rn(2 + rnd() * 2.5)} fill={colors[i % colors.length]} /> : <rect key={i} x={x} y={y} width={10} height={4} rx={1} transform={`rotate(${Math.round(rnd() * 180)} ${x} ${y})`} fill={colors[i % colors.length]} />;
    });
  switch (t.id) {
    case "open-gold-gala":
      return {
        menu: "leader",
        head: F.play,
        card: soft,
        cardStroke: accent,
        deco: (
          <>
            <rect x={18} y={18} width={564} height={813} fill="none" stroke={accent} strokeWidth={1.2} />
            <rect x={26} y={26} width={548} height={797} fill="none" stroke={accent} strokeWidth={0.6} />
          </>
        ),
      };
    case "open-blush-photo":
      return {
        menu: "centered",
        head: F.play,
        card: mix(bg, "#ffffff", 0.75),
        cardStroke: soft,
        deco: (
          <>
            <path d="M200 158 H270 M330 158 H400" stroke={accent} strokeWidth={1} />
            <path d={star(C, 158, 6)} fill={accent} />
          </>
        ),
      };
    case "open-balloons":
      return {
        menu: "cards",
        head: F.fraun,
        fill: "#ffffff",
        deco: (
          <>
            {confetti([accent, soft, "#A8E6CF", "#A0C4FF"])}
            <Balloon cx={40} cy={64} r={20} color={accent} to={[52, 170]} />
            <Balloon cx={72} cy={44} r={16} color={soft} to={[52, 170]} />
            <Balloon cx={560} cy={64} r={20} color={soft} to={[548, 170]} />
            <Balloon cx={528} cy={44} r={16} color="#A0C4FF" to={[548, 170]} />
          </>
        ),
      };
    case "open-editorial":
      return { menu: "stacked", head: F.play4, price: ink, deco: <path d={`M60 40 H540 M60 ${H - 40} H540`} stroke={ink} strokeWidth={0.6} /> };
    case "open-confetti":
      return {
        menu: "tiles",
        head: F.fraun,
        fill: "#ffffff",
        deco: (
          <>
            {confetti([accent, soft, "#06D6A0", "#118AB2"], 34)}
            {[accent, soft, "#06D6A0", "#118AB2"].map((col, i) => (
              <rect key={col} x={i * 150} y={H - 14} width={150} height={14} fill={col} />
            ))}
          </>
        ),
      };
    case "open-ticket":
      return { menu: "tickets", head: F.play, fill: ink, ink: bg, price: soft };
    case "open-botanical":
      return {
        menu: "leaves",
        head: F.play,
        deco: (
          <>
            <Sprig x={34} y={170} s={0.9} rot={-24} color={accent} />
            <Sprig x={566} y={170} s={0.9} rot={24} color={accent} />
          </>
        ),
      };
    case "open-retro-sun":
      return {
        menu: "pills",
        head: F.fraun,
        card: "#ffffff",
        cardStroke: ink,
        deco: (
          <>
            {([[92, accent], [72, soft], [52, mix(soft, bg, 0.55)]] as const).map(([rr, col]) => (
              <path key={rr} d={`M${C - rr} 100 A${rr} ${rr} 0 0 1 ${C + rr} 100 Z`} fill={col} fillOpacity={0.35} />
            ))}
            <rect x={0} y={H - 30} width={W} height={10} fill={accent} />
            <rect x={0} y={H - 20} width={W} height={10} fill={soft} />
            <rect x={0} y={H - 10} width={W} height={10} fill={ink} />
          </>
        ),
      };
    case "open-magazine":
      return {
        menu: "magazine",
        head: F.play,
        top: 214,
        deco: (
          <>
            <Photo href={photo} x={0} y={0} w={W} h={150} clip={`M0 0 H${W} V150 H0 Z`} id={`${uid}-bp`} />
            <rect x={0} y={0} width={W} height={150} fill="#000" fillOpacity={0.3} />
          </>
        ),
      };
    case "open-swiss":
      return { menu: "numbered", head: F.montB, deco: <path d="M40 40 V809 M560 40 V809 M40 150 H560" stroke={ink} strokeOpacity={0.18} strokeWidth={1} /> };
    case "sale-red-burst":
      return { menu: "bars", head: F.fraun, card: "#ffffff", ink: "#222222", price: bg, deco: <path d={burst(530, 70, 44, 34, 16)} fill={accent} /> };
    case "sale-combo":
      return { menu: "chips", head: F.fraun, fill: "#ffffff" };
    case "sale-happy-hour":
      return {
        menu: "timeline",
        head: F.fraun,
        card: soft,
        fill: soft,
        deco: (
          <>
            <circle cx={70} cy={80} r={34} fill={soft} stroke={accent} strokeWidth={3} />
            <path d="M70 80 V58 M70 80 L56 88" stroke={ink} strokeWidth={3} strokeLinecap="round" />
          </>
        ),
      };
    case "sale-summer":
      return {
        menu: "circles",
        head: F.fraun,
        card: "#ffffff",
        deco: (
          <>
            <circle cx={534} cy={66} r={38} fill={accent} fillOpacity={0.9} />
            <path d="M0 150 Q75 132 150 150 T300 150 T450 150 T600 150 V170 H0 Z" fill={soft} fillOpacity={0.6} />
          </>
        ),
      };
    case "sale-women-day":
      return {
        menu: "ribbons",
        head: F.play,
        card: "#ffffff",
        cardStroke: soft,
        deco: (
          <>
            <Blossom x={52} y={60} r={18} petal={soft} center={accent} />
            <Blossom x={548} y={70} r={14} petal={soft} center={accent} />
            <Icon kind="heart" x={96} y={112} s={20} c={accent} />
            <Icon kind="heart" x={506} y={120} s={16} c={accent} />
          </>
        ),
      };
    case "sale-tet":
      return {
        menu: "table",
        head: F.play,
        titleColor: accent,
        fill: ink,
        ink: "#5a1414",
        price: bg,
        deco: (
          <>
            <rect x={16} y={16} width={568} height={817} fill="none" stroke={accent} strokeWidth={1.4} />
            <Blossom x={58} y={58} r={14} petal={accent} center="#E65100" />
            <Blossom x={44} y={96} r={9} petal={accent} center="#E65100" />
            <Blossom x={542} y={58} r={14} petal={accent} center="#E65100" />
            <Blossom x={556} y={96} r={9} petal={accent} center="#E65100" />
          </>
        ),
      };
    case "sale-black-friday":
      return { menu: "priceFirst", head: F.oswald, card: soft, deco: <path d="M0 0 H120 L0 120 Z" fill={accent} /> };
    case "sale-bogo":
      return {
        menu: "checks",
        head: F.fraun,
        card: "#ffffff",
        cardStroke: ink,
        deco: (
          <>
            {Array.from({ length: 20 }, (_, i) => (
              <rect key={i} x={i * 30} y={i % 2 ? H - 22 : H - 12} width={30} height={i % 2 ? 22 : 12} fill={i % 2 ? ink : accent} />
            ))}
          </>
        ),
      };
    case "sale-member":
      return { menu: "rows", head: F.play, fill: ink };
    case "sale-pedicure":
      return { menu: "roman", head: F.play, top: 252, deco: <Photo href={photo} x={40} y={36} w={520} h={150} clip={rounded(40, 36, 520, 150, 20)} id={`${uid}-bp`} /> };
  }
  return { menu: "leader", head: F.play };
}

function PromoBack({ d, t, photo, uid }: { d: PromoFlyerDesign; t: PromoFlyerTemplate; photo?: string; uid: string }) {
  const { bg, ink, accent, soft } = t.colors;
  const cfg = backCfg(t, photo, uid);
  const top = cfg.top ?? 116;
  const bodyTop = top + 56;
  const bodyBottom = H - 150;
  const secs = d.menu
    .map((s) => ({ ...s, items: s.items.filter((i) => i.name || i.price).slice(0, 8) }))
    .filter((s) => s.title || s.items.length)
    .slice(0, 4);
  const pad = cfg.card ? 24 : 4;
  const box = { x: 40 + pad, y: bodyTop + (cfg.card ? 22 : 6), w: 520 - pad * 2, h: bodyBottom - bodyTop - (cfg.card ? 44 : 12) };
  const inkIn = cfg.ink ?? ink;
  const surface = cfg.card ?? cfg.fill ?? bg;
  const c: MC = {
    ink: inkIn,
    page: cfg.card ? inkIn : ink,
    muted: mix(inkIn, surface, 0.5),
    price: cfg.price ?? accent,
    accent,
    soft,
    fill: cfg.fill ?? "#ffffff",
    head: cfg.head,
    bg,
  };

  return (
    <>
      {cfg.deco}
      <Txt x={C} y={top - 54} t={d.salon} f={F.montB} size={11} fill={cfg.titleColor ?? ink} anchor="middle" sp={4} max={440} op={0.85} />
      <Txt x={C} y={top} t={d.backTitle} f={cfg.head} size={44} fill={cfg.titleColor ?? ink} anchor="middle" sp={cfg.head === F.play4 ? 6 : 1} max={420} />
      <Txt x={C} y={top + 26} t={d.backNote} f={F.viet} size={12.5} fill={ink} anchor="middle" op={0.75} max={480} />
      {cfg.card && <rect x={40} y={bodyTop} width={520} height={bodyBottom - bodyTop} rx={18} fill={cfg.card} stroke={cfg.cardStroke} strokeWidth={cfg.cardStroke ? 2 : 0} />}
      <PromoMenu style={cfg.menu} box={box} secs={secs} c={c} />
      <Contact x={56} y={H - 112} w={488} d={d} ink={ink} icon={accent} />
      <Txt x={C} y={H - 46} t={d.note} f={F.mont} size={9} fill={ink} anchor="middle" op={0.65} max={500} />
    </>
  );
}

/* ---------- Tờ rơi ---------- */

// photo: ảnh đã chuyển sang data URL (để mở trong trình thiết kế tự do); mặc định dùng ảnh của mẫu.
export function PromoFlyerSvg({ design: d, template: t, photo = t.photo, side = "front", svgRef, className }: { design: PromoFlyerDesign; template: PromoFlyerTemplate; photo?: string; side?: "front" | "back"; svgRef?: Ref<SVGSVGElement>; className?: string }) {
  const uid = useId().replace(/[^\w-]/g, "");
  const { bg, ink, accent, soft } = t.colors;
  const muted = mix(ink, bg, 0.45);
  const base: Ink = { ink, muted, price: accent };
  let body: ReactNode = null;

  if (side === "back") body = <PromoBack d={d} t={t} photo={photo} uid={uid} />;
  else switch (t.id) {
    case "open-gold-gala":
      body = (
        <>
          <rect x={18} y={18} width={564} height={813} fill="none" stroke={accent} strokeWidth={1.2} />
          <rect x={26} y={26} width={548} height={797} fill="none" stroke={accent} strokeWidth={0.6} />
          <Txt x={C} y={78} t={d.salon} f={F.play} size={22} fill={accent} anchor="middle" sp={3} max={460} />
          <Txt x={C} y={104} t={d.eyebrow} f={F.mont} size={11} fill={ink} anchor="middle" sp={5} op={0.8} max={460} />
          <path d="M40 152 C150 122 250 182 300 152 C350 122 450 182 560 152" fill="none" stroke={accent} strokeWidth={9} strokeLinecap="round" />
          <path d="M300 152 C282 128 252 132 256 150 C260 166 286 160 300 152 C314 160 340 166 344 150 C348 132 318 128 300 152 Z" fill={accent} />
          <circle cx={C} cy={152} r={8} fill={mix(accent, "#000000", 0.25)} />
          <Txt x={C} y={240} t={d.headline} f={F.play} size={72} fill={ink} anchor="middle" sp={2} max={500} />
          <Txt x={C} y={274} t={d.subhead} f={F.corm} size={22} fill={accent} anchor="middle" max={480} />
          <circle cx={C} cy={360} r={72} fill="none" stroke={accent} strokeWidth={1.5} />
          <circle cx={C} cy={360} r={64} fill="none" stroke={accent} strokeWidth={0.6} />
          <Txt x={C} y={378} t={d.discount} f={F.play} size={56} fill={accent} anchor="middle" max={112} />
          <Txt x={C} y={400} t="GIẢM GIÁ" f={F.montB} size={9} fill={ink} anchor="middle" sp={2} />
          <Txt x={128} y={352} t="THỜI GIAN" f={F.montB} size={9} fill={accent} anchor="middle" sp={2} />
          <Txt x={128} y={374} t={d.dates} f={F.viet} size={13} fill={ink} anchor="middle" max={170} />
          <Txt x={472} y={352} t="GIỜ MỞ CỬA" f={F.montB} size={9} fill={accent} anchor="middle" sp={2} />
          <Txt x={472} y={374} t={d.hours} f={F.viet} size={13} fill={ink} anchor="middle" max={170} />
          <rect x={56} y={448} width={488} height={168} rx={4} fill={soft} stroke={accent} strokeWidth={0.6} />
          <Txt x={C} y={476} t={d.discountLabel} f={F.montB} size={10} fill={accent} anchor="middle" sp={3} max={440} />
          <Offers x={80} y={514} w={440} offers={d.offers} c={base} cols={2} gap={36} size={13.5} />
          <Perks x={56} y={662} w={488} items={d.perks} ink={ink} icon={accent} size={11.5} />
          <path d="M56 690 H544" stroke={accent} strokeWidth={0.5} />
          <Contact x={70} y={726} w={460} d={d} ink={ink} icon={accent} />
          <Txt x={C} y={800} t={d.note} f={F.mont} size={9} fill={ink} anchor="middle" op={0.65} max={480} />
        </>
      );
      break;

    case "open-blush-photo":
      body = (
        <>
          <Photo href={photo} x={60} y={40} w={480} h={330} clip={arch(60, 40, 480, 330)} id={`${uid}-p`} />
          <path d={arch(50, 30, 500, 346)} fill="none" stroke={accent} strokeWidth={1.2} />
          <circle cx={500} cy={338} r={58} fill={accent} />
          <circle cx={500} cy={338} r={51} fill="none" stroke="#fff" strokeOpacity={0.6} strokeWidth={1} />
          <Txt x={500} y={348} t={d.discount} f={F.fraun} size={34} fill="#fff" anchor="middle" max={90} />
          <Txt x={500} y={368} t="ƯU ĐÃI" f={F.montB} size={8.5} fill="#fff" anchor="middle" sp={2} />
          <Txt x={C} y={404} t={d.salon} f={F.montB} size={12} fill={accent} anchor="middle" sp={4} max={420} />
          <Txt x={C} y={456} t={d.headline} f={F.play} size={54} fill={ink} anchor="middle" max={520} />
          <Txt x={C} y={484} t={d.subhead} f={F.viet} size={15} fill={ink} anchor="middle" op={0.75} max={500} />
          <Txt x={C} y={508} t={d.dates} f={F.montB} size={11} fill={accent} anchor="middle" sp={2} max={400} />
          <rect x={48} y={524} width={504} height={148} rx={16} fill={mix(bg, "#ffffff", 0.75)} stroke={soft} strokeWidth={1.5} />
          <Offers x={72} y={564} w={456} offers={d.offers} c={base} cols={2} gap={32} size={13.5} rowH={38} />
          <Perks x={48} y={708} w={504} items={d.perks} ink={ink} icon={accent} size={11.5} />
          <Contact x={62} y={748} w={476} d={d} ink={ink} icon={accent} />
          <Txt x={C} y={822} t={d.note} f={F.mont} size={9} fill={ink} anchor="middle" op={0.6} max={500} />
        </>
      );
      break;

    case "open-balloons": {
      const rnd = seeded(7);
      const lines = twoLines(d.headline);
      const mint = "#A8E6CF";
      const sky = "#A0C4FF";
      const confetti = Array.from({ length: 34 }, (_, i) => {
        const x = rn(20 + rnd() * 560);
        const y = rn(20 + rnd() * 380);
        const col = [accent, soft, mint, sky][i % 4];
        return i % 3 ? <circle key={i} cx={x} cy={y} r={rn(2 + rnd() * 3)} fill={col} /> : <rect key={i} x={x} y={y} width={9} height={4} rx={1} transform={`rotate(${Math.round(rnd() * 180)} ${x} ${y})`} fill={col} />;
      });
      body = (
        <>
          {confetti}
          <Balloon cx={96} cy={130} r={38} color={accent} to={[130, 300]} />
          <Balloon cx={150} cy={86} r={32} color={soft} to={[130, 300]} />
          <Balloon cx={68} cy={214} r={28} color={mint} to={[130, 300]} />
          <Balloon cx={504} cy={124} r={38} color={soft} to={[470, 300]} />
          <Balloon cx={450} cy={84} r={30} color={sky} to={[470, 300]} />
          <Balloon cx={534} cy={210} r={27} color={accent} to={[470, 300]} />
          <Txt x={C} y={92} t={d.salon} f={F.play} size={24} fill={ink} anchor="middle" max={260} />
          <Txt x={C} y={118} t={d.eyebrow} f={F.montB} size={10} fill={accent} anchor="middle" sp={3} max={260} />
          <Txt x={C} y={lines.length > 1 ? 206 : 250} t={lines[0]} f={F.fraun} size={82} fill={ink} anchor="middle" max={300} />
          {lines[1] && <Txt x={C} y={284} t={lines[1]} f={F.fraun} size={82} fill={ink} anchor="middle" max={330} />}
          <rect x={120} y={310} width={360} height={46} rx={23} fill={accent} />
          <Txt x={C} y={340} t={`${d.discountLabel} ${d.discount}`} f={F.vietB} size={16} fill="#fff" anchor="middle" max={330} />
          <Txt x={C} y={384} t={d.dates} f={F.viet} size={13} fill={ink} anchor="middle" op={0.8} max={400} />
          {d.offers.slice(0, 6).map((o, i) => {
            const x = 48 + (i % 3) * 172;
            const y = 404 + Math.floor(i / 3) * 112;
            return (
              <g key={i}>
                <rect x={x} y={y} width={160} height={100} rx={14} fill="#fff" stroke={i % 2 ? soft : mix(accent, "#ffffff", 0.5)} strokeWidth={2} />
                <Txt x={x + 80} y={y + 30} t={o.name} f={F.viet} size={12.5} fill={ink} anchor="middle" max={140} />
                <Txt x={x + 80} y={y + 64} t={o.now} f={F.fraun} size={26} fill={accent} anchor="middle" max={140} />
                <OldPrice x={x + 80} y={y + 84} t={o.old} size={11} fill={muted} anchor="middle" />
              </g>
            );
          })}
          <Perks x={48} y={660} w={504} items={d.perks} ink={ink} icon={accent} size={11.5} />
          <rect x={0} y={690} width={W} height={H - 690} fill={ink} />
          <Contact x={62} y={734} w={476} d={d} ink={bg} icon={soft} />
          <Txt x={C} y={816} t={d.note} f={F.mont} size={9} fill={bg} anchor="middle" op={0.7} max={500} />
        </>
      );
      break;
    }

    case "open-editorial":
      body = (
        <>
          <Txt x={C} y={66} t={d.salon} f={F.play4} size={20} fill={ink} anchor="middle" sp={5} max={460} />
          <path d="M60 86 H540" stroke={ink} strokeWidth={0.6} />
          <Txt x={C} y={114} t={d.eyebrow} f={F.mont} size={11} fill={accent} anchor="middle" sp={5} max={460} />
          <Txt x={C} y={176} t={d.headline} f={F.play4} size={64} fill={ink} anchor="middle" sp={6} max={520} />
          <circle cx={190} cy={338} r={124} fill="none" stroke={accent} strokeWidth={0.8} />
          <Photo href={photo} x={75} y={223} w={230} h={230} clip={`M190 223 A115 115 0 1 1 189.9 223 Z`} id={`${uid}-p`} />
          <Txt x={430} y={312} t={d.discount} f={F.play4} size={92} fill={ink} anchor="middle" max={210} />
          <Txt x={430} y={342} t={d.discountLabel} f={F.montB} size={9} fill={accent} anchor="middle" sp={2} max={210} />
          <path d="M370 360 H490" stroke={accent} strokeWidth={0.8} />
          <Txt x={430} y={386} t={d.dates} f={F.viet} size={13} fill={ink} anchor="middle" max={210} />
          <Txt x={430} y={412} t={d.subhead} f={F.corm} size={17} fill={ink} anchor="middle" op={0.8} max={220} />
          <Txt x={60} y={500} t="BẢNG GIÁ ƯU ĐÃI" f={F.montB} size={10} fill={accent} sp={3} />
          <Offers x={60} y={536} w={480} offers={d.offers} c={{ ink, muted, price: ink }} cols={2} gap={40} size={13.5} />
          <Perks x={60} y={640} w={480} items={d.perks} ink={ink} icon={accent} size={11.5} />
          <rect x={0} y={676} width={W} height={H - 676} fill={ink} />
          <path d="M60 700 H540" stroke={accent} strokeWidth={0.6} />
          <Contact x={74} y={740} w={452} d={d} ink={bg} icon={accent} />
          <Txt x={C} y={816} t={d.note} f={F.mont} size={9} fill={bg} anchor="middle" op={0.65} max={480} />
        </>
      );
      break;

    case "open-confetti": {
      const rnd = seeded(11);
      const palette = [accent, soft, "#06D6A0", "#118AB2"];
      const lines = twoLines(d.headline);
      body = (
        <>
          {Array.from({ length: 46 }, (_, i) => {
            const x = rn(10 + rnd() * 580);
            const y = rn(10 + rnd() * 360);
            const col = palette[i % 4];
            return i % 2 ? <circle key={i} cx={x} cy={y} r={rn(2.5 + rnd() * 3)} fill={col} /> : <rect key={i} x={x} y={y} width={12} height={5} rx={1.5} transform={`rotate(${Math.round(rnd() * 180)} ${x} ${y})`} fill={col} />;
          })}
          <Txt x={C} y={74} t={d.eyebrow} f={F.montB} size={12} fill={ink} anchor="middle" sp={4} max={480} />
          <Txt x={C} y={lines.length > 1 ? 180 : 230} t={lines[0]} f={F.fraun} size={104} fill={ink} anchor="middle" max={520} />
          {lines[1] && <Txt x={C} y={276} t={lines[1]} f={F.fraun} size={96} fill={accent} anchor="middle" max={520} />}
          <Txt x={C} y={326} t={d.subhead} f={F.dancing} size={26} fill="#118AB2" anchor="middle" max={500} />
          <rect x={56} y={388} width={504} height={246} rx={18} fill={ink} />
          <rect x={48} y={380} width={504} height={246} rx={18} fill="#fff" stroke={ink} strokeWidth={2.5} />
          <Txt x={72} y={414} t={d.salon} f={F.montB} size={13} fill={ink} sp={1} max={340} />
          <Txt x={72} y={436} t={d.dates} f={F.viet} size={12} fill={accent} max={340} />
          <Offers x={72} y={472} w={456} offers={d.offers} c={base} size={14} rowH={28} />
          <g transform="rotate(-12 492 380)">
            <circle cx={492} cy={380} r={56} fill={soft} stroke={ink} strokeWidth={2.5} />
            <Txt x={492} y={392} t={d.discount} f={F.fraun} size={34} fill={ink} anchor="middle" max={90} />
            <Txt x={492} y={410} t="GIẢM GIÁ" f={F.montB} size={8} fill={ink} anchor="middle" sp={1.5} />
          </g>
          <Perks x={48} y={672} w={504} items={d.perks} ink={ink} icon={accent} size={11.5} />
          <Contact x={60} y={716} w={480} d={d} ink={ink} icon={accent} />
          <Txt x={C} y={794} t={d.note} f={F.mont} size={9} fill={ink} anchor="middle" op={0.6} max={500} />
          {palette.map((col, i) => (
            <rect key={col} x={i * 150} y={818} width={150} height={31} fill={col} />
          ))}
        </>
      );
      break;
    }

    case "open-ticket": {
      const cream = ink;
      const dark = bg;
      body = (
        <>
          <Txt x={C} y={62} t={d.salon} f={F.play} size={22} fill={cream} anchor="middle" max={460} />
          <path d={`${rounded(44, 88, 512, 478, 18)}`} fill={cream} />
          <circle cx={44} cy={396} r={16} fill={dark} />
          <circle cx={556} cy={396} r={16} fill={dark} />
          <path d="M72 396 H528" stroke={dark} strokeOpacity={0.35} strokeWidth={1.4} strokeDasharray="7 6" />
          <Txt x={C} y={136} t={d.eyebrow} f={F.montB} size={13} fill={dark} anchor="middle" sp={6} max={440} />
          <Txt x={C} y={204} t={d.headline} f={F.play} size={60} fill={dark} anchor="middle" max={460} />
          <Txt x={C} y={236} t={d.subhead} f={F.viet} size={14} fill={dark} anchor="middle" op={0.75} max={440} />
          <Txt x={C} y={322} t={d.discount} f={F.fraun} size={82} fill={soft} anchor="middle" max={260} />
          <Txt x={C} y={352} t={d.discountLabel} f={F.montB} size={10} fill={dark} anchor="middle" sp={2} max={400} />
          <Txt x={C} y={374} t={d.dates} f={F.viet} size={12} fill={dark} anchor="middle" op={0.75} max={400} />
          <Offers x={76} y={438} w={448} offers={d.offers} c={{ ink: dark, muted: mix(dark, cream, 0.45), price: soft }} cols={2} gap={32} size={13} rowH={40} />
          <rect x={60} y={594} width={480} height={108} rx={10} fill="none" stroke={accent} strokeWidth={1.5} strokeDasharray="7 5" />
          <g transform="translate(76 594) rotate(-90)">
            <path d="M-8 -6 L6 6 M-8 6 L6 -6" stroke={accent} strokeWidth={1.8} strokeLinecap="round" />
            <circle cx={-11} cy={-8} r={3.5} fill="none" stroke={accent} strokeWidth={1.5} />
            <circle cx={-11} cy={8} r={3.5} fill="none" stroke={accent} strokeWidth={1.5} />
          </g>
          <Txt x={C} y={636} t="PHIẾU QUÀ TẶNG" f={F.fraun} size={24} fill={accent} anchor="middle" />
          <Txt x={C} y={662} t={d.perks.filter(Boolean).join(" · ")} f={F.viet} size={12} fill={cream} anchor="middle" max={450} />
          <Txt x={C} y={686} t="Mang tờ rơi này đến tiệm để nhận quà" f={F.mont} size={10} fill={cream} anchor="middle" op={0.75} max={450} />
          <Contact x={70} y={740} w={460} d={d} ink={cream} icon={accent} />
          <Txt x={C} y={816} t={d.note} f={F.mont} size={9} fill={cream} anchor="middle" op={0.65} max={500} />
        </>
      );
      break;
    }

    case "open-botanical": {
      const lines = twoLines(d.headline);
      body = (
        <>
          <Sprig x={22} y={846} s={0.9} rot={32} color={accent} />
          <Sprig x={580} y={846} s={0.9} rot={-32} color={accent} />
          <Photo href={photo} x={318} y={56} w={236} h={330} clip={rounded(318, 56, 236, 330, 118)} id={`${uid}-p`} />
          <path d={rounded(308, 46, 256, 350, 128)} fill="none" stroke={accent} strokeWidth={1} />
          <Txt x={52} y={100} t={d.salon} f={F.play} size={20} fill={ink} max={250} />
          <Txt x={52} y={130} t={d.eyebrow} f={F.montB} size={10} fill={accent} sp={3} max={250} />
          <Txt x={52} y={200} t={lines[0]} f={F.play} size={56} fill={ink} max={250} />
          {lines[1] && <Txt x={52} y={262} t={lines[1]} f={F.play} size={56} fill={ink} max={250} />}
          <Txt x={52} y={300} t={d.subhead} f={F.corm} size={19} fill={ink} op={0.8} max={250} />
          <Txt x={52} y={366} t={d.discount} f={F.play} size={60} fill={accent} max={200} />
          <Txt x={52} y={390} t={d.discountLabel} f={F.montB} size={9} fill={ink} sp={1.5} max={250} />
          <rect x={44} y={420} width={512} height={196} rx={16} fill={soft} />
          <Txt x={68} y={452} t="BẢNG GIÁ ƯU ĐÃI" f={F.montB} size={11} fill={accent} sp={2.5} />
          <Txt x={532} y={452} t={d.dates} f={F.viet} size={12} fill={ink} anchor="end" max={240} />
          <Offers x={68} y={492} w={464} offers={d.offers} c={base} cols={2} gap={30} size={13.5} rowH={38} />
          <Perks x={44} y={656} w={512} items={d.perks} ink={ink} icon={accent} size={11.5} />
          <Contact x={58} y={708} w={484} d={d} ink={ink} icon={accent} />
          <Txt x={C} y={792} t={d.note} f={F.mont} size={9} fill={ink} anchor="middle" op={0.6} max={500} />
        </>
      );
      break;
    }

    case "open-retro-sun": {
      const [l, r] = [[C - 152, 250], [C + 152, 250]];
      body = (
        <>
          <defs>
            <clipPath id={`${uid}-top`}>
              <rect x={0} y={0} width={W} height={250} />
            </clipPath>
            <path id={`${uid}-arc`} d={`M${l[0]} ${l[1]} A152 152 0 0 1 ${r[0]} ${r[1]}`} />
          </defs>
          <g clipPath={`url(#${uid}-top)`}>
            {Array.from({ length: 18 }, (_, i) => {
              const a0 = Math.PI + (i * Math.PI) / 18;
              const a1 = a0 + Math.PI / 36;
              return <path key={i} d={`M${C} 250 L${rn(C + 520 * Math.cos(a0))} ${rn(250 + 520 * Math.sin(a0))} L${rn(C + 520 * Math.cos(a1))} ${rn(250 + 520 * Math.sin(a1))} Z`} fill={soft} fillOpacity={0.22} />;
            })}
          </g>
          {[[118, accent], [96, soft], [74, mix(soft, bg, 0.55)]].map(([rr, col]) => (
            <path key={String(rr)} d={`M${C - Number(rr)} 250 A${rr} ${rr} 0 0 1 ${C + Number(rr)} 250 Z`} fill={String(col)} />
          ))}
          <Txt x={C} y={46} t={d.salon} f={F.fraun} size={20} fill={ink} anchor="middle" max={440} />
          <text textAnchor="middle" fontFamily="'Fraunces'" fontWeight={900} fontSize={36} fill={ink} letterSpacing={2}>
            <textPath href={`#${uid}-arc`} startOffset="50%">
              {d.headline}
            </textPath>
          </text>
          <Txt x={C} y={236} t={d.discount} f={F.fraun} size={48} fill={ink} anchor="middle" max={130} />
          <path d="M40 250 H560" stroke={ink} strokeWidth={2.5} />
          <Txt x={C} y={292} t={d.subhead} f={F.dancing} size={26} fill={accent} anchor="middle" max={500} />
          <Txt x={C} y={322} t={`${d.discountLabel} · ${d.dates}`} f={F.montB} size={11} fill={ink} anchor="middle" sp={1.5} max={500} />
          <rect x={48} y={350} width={504} height={232} rx={26} fill="#fff" stroke={ink} strokeWidth={2.2} />
          <Offers x={76} y={396} w={448} offers={d.offers} c={base} size={14} rowH={30} />
          <Perks x={48} y={622} w={504} items={d.perks} ink={ink} icon={accent} size={11.5} />
          <Contact x={60} y={666} w={480} d={d} ink={ink} icon={accent} />
          <Txt x={C} y={748} t={d.note} f={F.mont} size={9} fill={ink} anchor="middle" op={0.6} max={500} />
          <rect x={0} y={786} width={W} height={14} fill={accent} />
          <rect x={0} y={800} width={W} height={14} fill={soft} />
          <rect x={0} y={814} width={W} height={35} fill={ink} />
        </>
      );
      break;
    }

    case "open-magazine":
      body = (
        <>
          <Photo href={photo} x={0} y={0} w={W} h={520} clip={`M0 0 H${W} V520 H0 Z`} id={`${uid}-p`} />
          <rect x={0} y={0} width={W} height={150} fill="#000" fillOpacity={0.28} />
          <Txt x={C} y={98} t={d.salon} f={F.play} size={62} fill="#fff" anchor="middle" sp={1} max={540} />
          <Txt x={C} y={128} t={d.eyebrow} f={F.montB} size={11} fill="#fff" anchor="middle" sp={5} max={500} />
          <rect x={40} y={290} width={170} height={150} fill={accent} />
          <Txt x={125} y={372} t={d.discount} f={F.fraun} size={60} fill="#fff" anchor="middle" max={150} />
          <Txt x={125} y={402} t={d.discountLabel} f={F.montB} size={8.5} fill="#fff" anchor="middle" sp={1} max={150} />
          <rect x={0} y={460} width={W} height={60} fill="#000" fillOpacity={0.5} />
          <Txt x={40} y={503} t={d.headline} f={F.play} size={40} fill="#fff" max={520} />
          <Txt x={40} y={560} t={d.subhead} f={F.corm} size={21} fill={ink} max={330} />
          <Txt x={560} y={560} t={d.dates} f={F.montB} size={12} fill={accent} anchor="end" max={200} />
          <Offers x={40} y={604} w={520} offers={d.offers} c={base} cols={2} gap={40} size={13.5} rowH={33} />
          <Perks x={40} y={722} w={520} items={d.perks} ink={ink} icon={accent} size={11.5} />
          <Contact x={48} y={762} w={512} d={d} ink={ink} icon={accent} size={11.5} rowH={24} />
          <Txt x={C} y={834} t={d.note} f={F.mont} size={8.5} fill={ink} anchor="middle" op={0.6} max={520} />
        </>
      );
      break;

    case "open-swiss":
      body = (
        <>
          <path d="M40 40 V809 M560 40 V809 M40 120 H560 M40 380 H560 M40 620 H560" stroke={ink} strokeOpacity={0.18} strokeWidth={1} />
          <Txt x={48} y={70} t={d.eyebrow} f={F.mont} size={11} fill={ink} sp={4} max={440} />
          <Txt x={48} y={100} t={d.salon} f={F.montB} size={22} fill={ink} max={440} />
          <Txt x={40} y={276} t={d.discount} f={F.montB} size={190} fill={accent} max={440} />
          <Txt x={48} y={312} t={d.discountLabel} f={F.montB} size={15} fill={ink} sp={2} max={440} />
          <Txt x={48} y={340} t={d.subhead} f={F.viet} size={14} fill={ink} op={0.75} max={440} />
          <Txt x={48} y={366} t={d.dates} f={F.montB} size={13} fill={accent} max={440} />
          <g transform="translate(546 368) rotate(-90)">
            <Txt x={0} y={0} t={d.headline} f={F.montB} size={40} fill={ink} sp={4} max={320} />
          </g>
          <Offers x={48} y={420} w={464} offers={d.offers} c={base} size={14} rowH={36} numbered />
          <Perks x={48} y={660} w={250} items={d.perks} ink={ink} icon={accent} cols={1} size={11.5} rowH={28} kind="check" />
          <Contact x={312} y={660} w={240} d={d} ink={ink} icon={accent} cols={1} size={11.5} rowH={28} />
          <Txt x={48} y={790} t={d.note} f={F.mont} size={9} fill={ink} op={0.6} max={500} />
        </>
      );
      break;

    case "sale-red-burst":
      body = (
        <>
          <Txt x={C} y={70} t={d.eyebrow} f={F.montB} size={14} fill={accent} anchor="middle" sp={5} max={480} />
          <Txt x={C} y={104} t={d.salon} f={F.play} size={20} fill={ink} anchor="middle" max={440} />
          <Txt x={44} y={276} t={d.headline} f={F.fraun} size={180} fill={ink} max={362} />
          <g transform="rotate(12 494 214)">
            <path d={burst(494, 214, 74, 58, 18)} fill={accent} />
            <Txt x={494} y={200} t={d.discountLabel} f={F.montB} size={10} fill={bg} anchor="middle" max={96} />
            <Txt x={494} y={238} t={d.discount} f={F.fraun} size={40} fill={bg} anchor="middle" max={104} />
          </g>
          <Txt x={52} y={320} t={d.subhead} f={F.vietB} size={18} fill={ink} max={496} />
          <Txt x={52} y={348} t={d.dates} f={F.montB} size={13} fill={accent} sp={1} max={496} />
          <rect x={40} y={380} width={520} height={262} rx={16} fill="#fff" />
          <Txt x={64} y={414} t="DỊCH VỤ GIẢM GIÁ" f={F.montB} size={13} fill={bg} sp={2} />
          <Offers x={64} y={456} w={472} offers={d.offers} c={{ ink: "#222222", muted: "#9a9a9a", price: bg }} size={14.5} rowH={30} />
          <Perks x={40} y={682} w={520} items={d.perks} ink={ink} icon={accent} size={11.5} />
          <Contact x={56} y={726} w={488} d={d} ink={ink} icon={accent} />
          <Txt x={C} y={812} t={d.note} f={F.mont} size={9} fill={ink} anchor="middle" op={0.75} max={500} />
        </>
      );
      break;

    case "sale-combo":
      body = (
        <>
          <Txt x={C} y={46} t={d.salon} f={F.play} size={18} fill={ink} anchor="middle" max={440} />
          <Txt x={C} y={82} t={d.eyebrow} f={F.montB} size={11} fill={accent} anchor="middle" sp={4} max={460} />
          <Txt x={C} y={140} t={d.headline} f={F.fraun} size={52} fill={ink} anchor="middle" max={520} />
          <Txt x={C} y={174} t={d.subhead} f={F.viet} size={15} fill={ink} anchor="middle" op={0.8} max={500} />
          {[0, 1, 2].map((i) => {
            const x = 40 + i * 176;
            const pair = d.offers.slice(i * 2, i * 2 + 2).filter((o) => o.name);
            const now = pair.reduce((s, o) => s + kOf(o.now), 0);
            const old = pair.reduce((s, o) => s + kOf(o.old), 0);
            const ok = pair.length > 0 && !Number.isNaN(now);
            return (
              <g key={i}>
                <rect x={x} y={200} width={168} height={300} rx={18} fill="#fff" stroke={soft} strokeWidth={2} />
                <path d={`M${x} 256 V218 Q${x} 200 ${x + 18} 200 H${x + 150} Q${x + 168} 200 ${x + 168} 218 V256 Z`} fill={i === 1 ? ink : accent} />
                <Txt x={x + 84} y={236} t={`COMBO ${i + 1}`} f={F.montB} size={15} fill="#fff" anchor="middle" sp={2} />
                {pair.map((o, j) => (
                  <g key={j}>
                    <Icon kind="check" x={x + 22} y={286 + j * 30} s={15} c={accent} />
                    <Txt x={x + 36} y={291 + j * 30} t={o.name} f={F.viet} size={12} fill={ink} max={120} />
                  </g>
                ))}
                <Txt x={x + 84} y={392} t={ok ? `${now}K` : (pair[0]?.now ?? "")} f={F.fraun} size={40} fill={accent} anchor="middle" max={140} />
                {ok && !Number.isNaN(old) && old > now && (
                  <>
                    <OldPrice x={x + 84} y={418} t={`${old}K`} size={13} fill={muted} anchor="middle" />
                    <rect x={x + 24} y={440} width={120} height={28} rx={14} fill={soft} />
                    <Txt x={x + 84} y={459} t={`Tiết kiệm ${old - now}K`} f={F.vietB} size={11.5} fill={ink} anchor="middle" max={110} />
                  </>
                )}
              </g>
            );
          })}
          <Txt x={C} y={540} t={d.dates} f={F.montB} size={14} fill={accent} anchor="middle" sp={1} max={500} />
          <Perks x={40} y={588} w={520} items={d.perks} ink={ink} icon={accent} size={11.5} />
          <Contact x={56} y={636} w={488} d={d} ink={ink} icon={accent} />
          <Txt x={C} y={728} t={d.note} f={F.mont} size={9} fill={ink} anchor="middle" op={0.6} max={500} />
          <rect x={0} y={770} width={W} height={H - 770} fill={ink} />
          <Txt x={C} y={818} t={d.salon} f={F.play} size={26} fill={bg} anchor="middle" max={500} />
        </>
      );
      break;

    case "sale-happy-hour":
      body = (
        <>
          <Txt x={C} y={54} t={d.eyebrow} f={F.montB} size={12} fill={accent} anchor="middle" sp={4} max={480} />
          <circle cx={C} cy={186} r={96} fill={soft} stroke={accent} strokeWidth={4} />
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i * Math.PI) / 6;
            const r0 = i % 3 ? 80 : 74;
            return <path key={i} d={`M${rn(C + r0 * Math.sin(a))} ${rn(186 - r0 * Math.cos(a))} L${rn(C + 88 * Math.sin(a))} ${rn(186 - 88 * Math.cos(a))}`} stroke={ink} strokeWidth={i % 3 ? 1.5 : 3} strokeLinecap="round" />;
          })}
          <path d={`M${C} 186 L${rn(C - 40)} ${rn(186 - 24)}`} stroke={ink} strokeWidth={5} strokeLinecap="round" />
          <path d={`M${C} 186 V114`} stroke={ink} strokeWidth={3.5} strokeLinecap="round" />
          <circle cx={C} cy={186} r={7} fill={accent} />
          <circle cx={456} cy={120} r={50} fill={accent} />
          <Txt x={456} y={124} t={d.discount} f={F.fraun} size={30} fill={bg} anchor="middle" max={80} />
          <Txt x={456} y={142} t={d.discountLabel} f={F.montB} size={7.5} fill={bg} anchor="middle" sp={1} max={80} />
          <Txt x={C} y={350} t={d.headline} f={F.fraun} size={64} fill={ink} anchor="middle" max={520} />
          <Txt x={C} y={384} t={d.subhead} f={F.montB} size={15} fill={accent} anchor="middle" sp={1} max={520} />
          <Txt x={C} y={410} t={`${d.salon} · ${d.dates}`} f={F.viet} size={13} fill={ink} anchor="middle" op={0.8} max={500} />
          <rect x={48} y={436} width={504} height={172} rx={14} fill={soft} />
          <Offers x={72} y={476} w={456} offers={d.offers} c={{ ink, muted: mix(ink, soft, 0.45), price: accent }} cols={2} gap={32} size={13.5} rowH={40} />
          <Perks x={48} y={654} w={504} items={d.perks} ink={ink} icon={accent} size={11.5} />
          <Contact x={60} y={700} w={480} d={d} ink={ink} icon={accent} />
          <Txt x={C} y={790} t={d.note} f={F.mont} size={9} fill={ink} anchor="middle" op={0.65} max={500} />
        </>
      );
      break;

    case "sale-summer": {
      const lines = twoLines(d.headline);
      body = (
        <>
          <circle cx={520} cy={84} r={56} fill={accent} fillOpacity={0.9} />
          {Array.from({ length: 10 }, (_, i) => {
            const a = (i * Math.PI) / 5;
            return <path key={i} d={`M${rn(520 + 66 * Math.cos(a))} ${rn(84 + 66 * Math.sin(a))} L${rn(520 + 80 * Math.cos(a))} ${rn(84 + 80 * Math.sin(a))}`} stroke={accent} strokeWidth={3} strokeLinecap="round" />;
          })}
          <circle cx={170} cy={206} r={128} fill="#fff" />
          <Photo href={photo} x={50} y={86} w={240} h={240} clip="M170 86 A120 120 0 1 1 169.9 86 Z" id={`${uid}-p`} />
          <Txt x={324} y={170} t={d.eyebrow} f={F.montB} size={13} fill={accent} sp={3} max={240} />
          <Txt x={324} y={226} t={lines[0]} f={F.fraun} size={52} fill={ink} max={240} />
          {lines[1] && <Txt x={324} y={280} t={lines[1]} f={F.fraun} size={52} fill={ink} max={240} />}
          <Txt x={324} y={318} t={d.discount} f={F.fraun} size={36} fill={accent} max={120} />
          <Txt x={420} y={316} t={d.discountLabel} f={F.montB} size={8} fill={ink} sp={1} max={150} />
          <path d="M0 372 Q75 350 150 372 T300 372 T450 372 T600 372 V849 H0 Z" fill={soft} fillOpacity={0.55} />
          <path d="M0 392 Q75 372 150 392 T300 392 T450 392 T600 392 V849 H0 Z" fill="#fff" fillOpacity={0.85} />
          <Txt x={C} y={432} t={d.subhead} f={F.viet} size={15} fill={ink} anchor="middle" max={500} />
          <Txt x={C} y={456} t={d.dates} f={F.montB} size={12} fill={accent} anchor="middle" sp={1.5} max={500} />
          <Offers x={60} y={500} w={480} offers={d.offers} c={base} cols={2} gap={40} size={13.5} rowH={38} />
          <Perks x={48} y={630} w={504} items={d.perks} ink={ink} icon={accent} size={11.5} />
          <Contact x={60} y={674} w={480} d={d} ink={ink} icon={accent} />
          <Txt x={C} y={748} t={d.note} f={F.mont} size={9} fill={ink} anchor="middle" op={0.6} max={500} />
          <rect x={0} y={778} width={W} height={H - 778} fill={ink} />
          <Txt x={C} y={822} t={d.salon} f={F.play} size={24} fill="#fff" anchor="middle" max={500} />
        </>
      );
      break;
    }

    case "sale-women-day": {
      const deco: [number, number, number, boolean][] = [[60, 70, 20, true], [540, 90, 16, false], [96, 300, 12, false], [520, 290, 22, true], [40, 520, 14, false], [566, 560, 12, true], [300, 800, 14, false]];
      body = (
        <>
          {deco.map(([x, y, r, flower], i) =>
            flower ? <Blossom key={i} x={x} y={y} r={r} petal={soft} center={accent} /> : <Icon key={i} kind="heart" x={x} y={y} s={r * 2} c={accent} />,
          )}
          <Txt x={C} y={82} t={d.eyebrow} f={F.montB} size={12} fill={ink} anchor="middle" sp={3} max={480} />
          <Txt x={C} y={226} t={d.headline} f={F.play} size={140} fill={accent} anchor="middle" max={460} />
          <Txt x={C} y={272} t={d.subhead} f={F.dancing} size={28} fill={ink} anchor="middle" max={500} />
          <path d="M160 296 H440 L428 318 L440 340 H160 L172 318 Z" fill={ink} />
          <Txt x={C} y={324} t={`ƯU ĐÃI ${d.discount}`} f={F.montB} size={16} fill="#fff" anchor="middle" sp={2} max={240} />
          <rect x={48} y={366} width={504} height={172} rx={20} fill="#fff" stroke={soft} strokeWidth={2} />
          <Offers x={76} y={408} w={448} offers={d.offers} c={{ ink: "#4a2238", muted: "#b08a9c", price: accent }} cols={2} gap={32} size={13.5} rowH={40} />
          <Txt x={C} y={570} t={d.dates} f={F.montB} size={13} fill={ink} anchor="middle" sp={1.5} max={500} />
          <Perks x={48} y={614} w={504} items={d.perks} ink={ink} icon={accent} size={11.5} />
          <Contact x={60} y={662} w={480} d={d} ink={ink} icon={accent} />
          <Txt x={C} y={738} t={d.note} f={F.mont} size={9} fill={ink} anchor="middle" op={0.6} max={500} />
          <Txt x={C} y={778} t={d.salon} f={F.play} size={26} fill={accent} anchor="middle" max={460} />
        </>
      );
      break;
    }

    case "sale-tet": {
      const cream = ink;
      const lantern = (x: number) => (
        <g key={x}>
          <path d={`M${x} 0 V40`} stroke={accent} strokeWidth={1.5} />
          <rect x={x - 10} y={38} width={20} height={6} rx={2} fill={accent} />
          <ellipse cx={x} cy={72} rx={26} ry={30} fill={accent} />
          <path d={`M${x - 14} 48 Q${x - 22} 72 ${x - 14} 96 M${x} 42 V102 M${x + 14} 48 Q${x + 22} 72 ${x + 14} 96`} fill="none" stroke={bg} strokeOpacity={0.45} strokeWidth={1.4} />
          <rect x={x - 10} y={100} width={20} height={6} rx={2} fill={accent} />
          <path d={`M${x - 5} 108 V130 M${x} 108 V134 M${x + 5} 108 V130`} stroke={accent} strokeWidth={1.4} />
        </g>
      );
      const branch = (flip: boolean) => (
        <g transform={flip ? "translate(600 0) scale(-1 1)" : undefined}>
          <path d="M0 330 C40 320 70 300 96 262 M52 318 C60 300 58 284 50 270" fill="none" stroke="#5A2A12" strokeWidth={3} strokeLinecap="round" />
          <Blossom x={96} y={258} r={14} petal={accent} center="#E65100" />
          <Blossom x={50} y={266} r={11} petal={accent} center="#E65100" />
          <Blossom x={72} y={296} r={9} petal={accent} center="#E65100" />
        </g>
      );
      body = (
        <>
          <rect x={16} y={16} width={568} height={817} fill="none" stroke={accent} strokeWidth={1.4} />
          {lantern(70)}
          {lantern(530)}
          {branch(false)}
          {branch(true)}
          <Txt x={C} y={70} t={d.salon} f={F.play} size={20} fill={accent} anchor="middle" max={360} />
          <Txt x={C} y={100} t={d.eyebrow} f={F.montB} size={11} fill={cream} anchor="middle" sp={4} max={360} />
          <Txt x={C} y={160} t={d.headline} f={F.play} size={46} fill={accent} anchor="middle" max={380} />
          <Txt x={C} y={194} t={d.subhead} f={F.viet} size={15} fill={cream} anchor="middle" max={380} />
          <rect x={232} y={214} width={136} height={160} rx={10} fill={accent} />
          <path d="M232 226 Q300 270 368 226 V224 Q368 214 358 214 H242 Q232 214 232 224 Z" fill={mix(accent, "#000000", 0.12)} />
          <circle cx={C} cy={252} r={12} fill={bg} />
          <Txt x={C} y={326} t={d.discount} f={F.fraun} size={44} fill={bg} anchor="middle" max={120} />
          <Txt x={C} y={350} t="LÌ XÌ GIẢM" f={F.montB} size={9} fill={bg} anchor="middle" sp={1.5} />
          <Txt x={C} y={404} t={d.dates} f={F.montB} size={13} fill={accent} anchor="middle" sp={1.5} max={480} />
          <rect x={48} y={422} width={504} height={170} rx={14} fill={cream} />
          <Offers x={72} y={464} w={456} offers={d.offers} c={{ ink: "#5a1414", muted: "#b07a6e", price: bg }} cols={2} gap={32} size={13.5} rowH={40} />
          <Perks x={48} y={648} w={504} items={d.perks} ink={cream} icon={accent} size={12} />
          <path d="M48 676 H552" stroke={accent} strokeOpacity={0.5} strokeWidth={0.8} />
          <Contact x={60} y={716} w={480} d={d} ink={cream} icon={accent} size={13} rowH={30} />
          <Txt x={C} y={800} t={d.note} f={F.mont} size={9.5} fill={cream} anchor="middle" op={0.7} max={500} />
        </>
      );
      break;
    }

    case "sale-black-friday": {
      const lines = twoLines(d.headline);
      body = (
        <>
          <path d="M0 0 H180 L0 180 Z" fill={accent} />
          <Txt x={30} y={62} t="SALE" f={F.montB} size={22} fill={bg} sp={2} />
          <Txt x={C} y={80} t={d.eyebrow} f={F.montB} size={13} fill={accent} anchor="middle" sp={6} max={300} />
          <Txt x={C} y={212} t={lines[0]} f={F.oswald} size={130} fill={ink} anchor="middle" sp={4} max={520} />
          {lines[1] && <Txt x={C} y={336} t={lines[1]} f={F.oswald} size={130} fill={ink} anchor="middle" sp={4} max={520} />}
          <Txt x={C} y={386} t={d.discountLabel} f={F.montB} size={12} fill={accent} anchor="middle" sp={3} max={480} />
          <Txt x={C + 5} y={493} t={`-${d.discount}`} f={F.fraun} size={104} fill={soft} anchor="middle" max={440} />
          <Txt x={C} y={488} t={`-${d.discount}`} f={F.fraun} size={104} fill="none" anchor="middle" max={440} stroke={accent} sw={3} />
          <Txt x={C} y={530} t={d.subhead} f={F.viet} size={15} fill={ink} anchor="middle" op={0.85} max={500} />
          <Txt x={C} y={556} t={`${d.salon} · ${d.dates}`} f={F.montB} size={12} fill={accent} anchor="middle" sp={1} max={500} />
          <rect x={48} y={576} width={504} height={128} rx={6} fill={soft} />
          <Offers x={72} y={612} w={456} offers={d.offers} c={{ ink, muted: "#8a8a8a", price: accent }} cols={2} gap={32} size={13} rowH={34} />
          <Perks x={48} y={740} w={504} items={d.perks} ink={ink} icon={accent} size={11.5} />
          <Contact x={60} y={782} w={480} d={d} ink={ink} icon={accent} size={11.5} rowH={24} />
          <Txt x={C} y={838} t={d.note} f={F.mont} size={8.5} fill={ink} anchor="middle" op={0.55} max={520} />
        </>
      );
      break;
    }

    case "sale-bogo":
      body = (
        <>
          <Txt x={C} y={56} t={d.eyebrow} f={F.montB} size={12} fill={ink} anchor="middle" sp={4} max={480} />
          <Txt x={C} y={86} t={d.salon} f={F.play} size={20} fill={accent} anchor="middle" max={440} />
          <Bottle x={200} y={244} s={1.15} body={accent} cap={ink} />
          <Bottle x={400} y={244} s={1.15} body={soft} cap={ink} outline={ink} />
          <circle cx={C} cy={210} r={28} fill={ink} />
          <path d="M300 196 V224 M286 210 H314" stroke="#fff" strokeWidth={5} strokeLinecap="round" />
          <Txt x={C} y={352} t={d.headline} f={F.fraun} size={60} fill={ink} anchor="middle" max={520} />
          <Txt x={C} y={388} t={d.subhead} f={F.viet} size={16} fill={ink} anchor="middle" op={0.85} max={500} />
          <rect x={180} y={404} width={240} height={30} rx={15} fill={soft} />
          <Txt x={C} y={424} t={d.dates} f={F.montB} size={11.5} fill={ink} anchor="middle" sp={1} max={220} />
          <rect x={48} y={454} width={504} height={160} rx={18} fill="#fff" stroke={ink} strokeWidth={2} />
          <Offers x={72} y={496} w={456} offers={d.offers} c={base} cols={2} gap={32} size={13.5} rowH={40} />
          <Perks x={48} y={654} w={504} items={d.perks} ink={ink} icon={accent} size={11.5} />
          <Contact x={60} y={700} w={480} d={d} ink={ink} icon={accent} />
          <Txt x={C} y={780} t={d.note} f={F.mont} size={9} fill={ink} anchor="middle" op={0.6} max={500} />
          {Array.from({ length: 20 }, (_, i) => (
            <rect key={i} x={i * 30} y={i % 2 ? 804 : 822} width={30} height={i % 2 ? 45 : 27} fill={i % 2 ? ink : accent} />
          ))}
        </>
      );
      break;

    case "sale-member":
      body = (
        <>
          <g transform="rotate(-7 300 190)">
            <rect x={152} y={92} width={296} height={184} rx={18} fill={ink} />
            <rect x={152} y={92} width={296} height={184} rx={18} fill="none" stroke={accent} strokeWidth={1.2} />
            <Txt x={178} y={130} t={d.salon} f={F.play} size={18} fill={accent} max={200} />
            <rect x={178} y={150} width={42} height={32} rx={6} fill={accent} />
            <path d="M178 166 H220 M192 150 V182 M206 150 V182" stroke={ink} strokeOpacity={0.35} strokeWidth={1} />
            <Txt x={178} y={236} t="•••• •••• 2026" f={F.mont} size={15} fill={bg} sp={2} />
            <Txt x={424} y={258} t="MEMBER" f={F.montB} size={12} fill={accent} anchor="end" sp={4} />
          </g>
          <circle cx={466} cy={96} r={46} fill={accent} />
          <Txt x={466} y={102} t={d.discount} f={F.fraun} size={28} fill="#fff" anchor="middle" max={74} />
          <Txt x={466} y={118} t="GIẢM" f={F.montB} size={8} fill="#fff" anchor="middle" sp={1.5} />
          <Txt x={C} y={338} t={d.eyebrow} f={F.montB} size={12} fill={accent} anchor="middle" sp={4} max={480} />
          <Txt x={C} y={390} t={d.headline} f={F.play} size={48} fill={ink} anchor="middle" max={520} />
          <Txt x={C} y={424} t={d.subhead} f={F.viet} size={16} fill={ink} anchor="middle" op={0.85} max={500} />
          <rect x={48} y={446} width={504} height={104} rx={14} fill={soft} />
          <Perks x={78} y={482} w={444} items={d.perks} ink={ink} icon={accent} cols={1} size={13} rowH={26} kind="check" />
          <Txt x={60} y={590} t="BẢNG GIÁ DỊCH VỤ" f={F.montB} size={11} fill={accent} sp={2.5} />
          <Txt x={540} y={590} t={d.dates} f={F.viet} size={12} fill={ink} anchor="end" max={240} />
          <Offers x={60} y={626} w={480} offers={d.offers} c={base} cols={2} gap={40} size={13.5} rowH={33} />
          <Contact x={60} y={738} w={480} d={d} ink={ink} icon={accent} />
          <Txt x={C} y={818} t={d.note} f={F.mont} size={9} fill={ink} anchor="middle" op={0.6} max={500} />
        </>
      );
      break;

    case "sale-pedicure":
      body = (
        <>
          <Photo href={photo} x={40} y={40} w={520} h={300} clip={rounded(40, 40, 520, 300, 24)} id={`${uid}-p`} />
          <circle cx={482} cy={332} r={62} fill={accent} stroke={bg} strokeWidth={6} />
          <Txt x={482} y={340} t={d.discount} f={F.fraun} size={38} fill="#fff" anchor="middle" max={96} />
          <Txt x={482} y={360} t="GIẢM GIÁ" f={F.montB} size={8.5} fill="#fff" anchor="middle" sp={1.5} />
          <Txt x={48} y={392} t={d.eyebrow} f={F.montB} size={12} fill={accent} sp={3} max={360} />
          <Txt x={48} y={446} t={d.headline} f={F.play} size={50} fill={ink} max={400} />
          <Txt x={48} y={478} t={d.subhead} f={F.viet} size={14} fill={ink} op={0.8} max={504} />
          <Txt x={48} y={504} t={`${d.salon} · ${d.dates}`} f={F.montB} size={12} fill={accent} sp={1} max={504} />
          <path d="M48 524 H552" stroke={accent} strokeWidth={0.8} />
          <Offers x={48} y={560} w={504} offers={d.offers} c={base} cols={2} gap={36} size={13.5} rowH={36} />
          <Perks x={48} y={688} w={504} items={d.perks} ink={ink} icon={accent} size={11.5} />
          <Contact x={60} y={732} w={480} d={d} ink={ink} icon={accent} />
          <Txt x={C} y={812} t={d.note} f={F.mont} size={9} fill={ink} anchor="middle" op={0.6} max={500} />
        </>
      );
      break;
  }

  return (
    <svg ref={svgRef} className={className} viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg" role="img" aria-label={`${side === "back" ? "Mặt sau bảng giá" : "Tờ rơi"} ${t.title} của ${d.salon}`}>
      <rect width={W} height={H} fill={bg} />
      {body}
    </svg>
  );
}
