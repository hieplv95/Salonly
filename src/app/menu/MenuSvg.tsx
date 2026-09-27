import qrcode from "qrcode-generator";
import { useId, type ReactNode, type Ref } from "react";
import { useMeasure } from "../design/measure";
import { F, Icon, Photo, Sprig, Blossom, Txt, arch, mix, rn, rounded, seeded, star, twoLines, type Font } from "../flyer/PromoFlyerSvg";
import type { Emblem, MenuDesign, MenuIcon, MenuSection, MenuTemplate } from "@/lib/menu-templates";

// Menu bảng giá 2 mặt (A4, khung 600×849): mặt trước là nhận diện tiệm (logo, ảnh móng, liên hệ, mã QR, khuyến mãi),
// mặt sau là bảng giá đầy đủ (8 nhóm, 2 cột).

const W = 600;
const H = 849;
const C = W / 2;
const cl = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const offsets = <T,>(list: T[], start: number, size: (item: T) => number) =>
  list.reduce<number[]>((acc, item, i) => [...acc, i ? acc[i - 1] + size(list[i - 1]) : start], []);

type Colors = { bg: string; ink: string; accent: string; soft: string; muted: string; card: string; head: Font };

/* ---------- Biểu tượng nhóm dịch vụ (ô 24×24, nét) ---------- */

function GroupIcon({ kind, x, y, s, c }: { kind: MenuIcon; x: number; y: number; s: number; c: string }) {
  const line = { fill: "none", stroke: c, strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const paths: Record<MenuIcon, ReactNode> = {
    hand: <path d="M8 21v-6L5.6 11.3a1.5 1.5 0 0 1 2.5-1.6L9 11V4.5a1.5 1.5 0 0 1 3 0V10V3.6a1.5 1.5 0 0 1 3 0V10.5V5.2a1.5 1.5 0 0 1 3 0V14c0 4-2.5 7-6 7Z" {...line} />,
    foot: (
      <>
        <path d="M10 22c-3 0-4.2-3-3.6-6.6.4-2.6.9-4.6.5-6.8C6.5 6.4 7.7 5 9.6 5.3c2.4.4 3 2.9 2.7 5.6-.2 2.1.6 3.5 1 5.4.6 3.4-.9 5.7-3.3 5.7Z" {...line} />
        {[[8.5, 2.6], [11.4, 2.2], [13.9, 3], [15.9, 4.4], [17.2, 6.3]].map(([cx, cy]) => <circle key={cx} cx={cx} cy={cy} r={1} fill={c} />)}
      </>
    ),
    nail: (
      <>
        <path d="M12 2.5c3 2.5 4.5 6 4.5 10v5a4.5 4.5 0 0 1-9 0v-5c0-4 1.5-7.5 4.5-10Z" {...line} />
        <path d="M10 8c-.6 1.8-.7 3.6-.5 5.4" {...line} strokeWidth={1.4} />
      </>
    ),
    art: <path d="M4 20.5c2 0 3.5-1.5 3.5-3.5 0-1 .8-1.8 1.8-1.8 1.4 0 2.2 1.6 1.4 2.8C9.6 19.6 7 21.2 4 20.5Z M11 14.6l8.4-8.5a1.8 1.8 0 0 0-2.5-2.5l-8.5 8.4" {...line} />,
    spa: (
      <>
        <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z" {...line} />
        <path d="M9.5 15a2.8 2.8 0 0 0 2.5 2.5" {...line} strokeWidth={1.4} />
      </>
    ),
    gift: (
      <>
        <path d="M4 11h16v10H4z M3 7h18v4H3z M12 7v14" {...line} />
        <path d="M12 7C10 3 6 3.5 7 6.5 7.5 7 9 7 12 7 15 7 16.5 7 17 6.5 18 3.5 14 3 12 7Z" {...line} />
      </>
    ),
    eye: (
      <>
        <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" {...line} />
        <circle cx="12" cy="12" r="2.8" {...line} />
      </>
    ),
    plus: (
      <>
        <circle cx="12" cy="12" r="9" {...line} />
        <path d="M12 8v8M8 12h8" {...line} />
      </>
    ),
  };
  return <g transform={`translate(${rn(x - s / 2)} ${rn(y - s / 2)}) scale(${rn(s / 24)})`}>{paths[kind]}</g>;
}

/* ---------- Một dòng dịch vụ ---------- */

function Row({ x, y, w, it, size, c, rule, rowH, priceNode, centered = false }: {
  x: number; y: number; w: number; it: MenuSection["items"][number]; size: number; c: Colors; rule?: boolean; rowH: number; priceNode?: ReactNode; centered?: boolean;
}) {
  const measure = useMeasure();
  const pw = measure(it.price, F.vietB[0], F.vietB[1], size, 0) ?? it.price.length * size * 0.6;
  const ds = size * 0.78;
  if (centered) {
    return (
      <>
        <Txt x={x + w / 2} y={y} t={`${it.name}  ·  ${it.price}`} f={F.viet} size={size} fill={c.ink} anchor="middle" max={w} />
        {it.desc && <Txt x={x + w / 2} y={y + rowH * 0.56} t={it.desc} f={F.viet} size={ds} fill={c.muted} anchor="middle" max={w} />}
      </>
    );
  }
  return (
    <>
      <Txt x={x} y={y} t={it.name} f={F.viet} size={size} fill={c.ink} max={Math.max(40, w - pw - 16)} />
      {priceNode ?? <Txt x={x + w} y={y} t={it.price} f={F.vietB} size={size} fill={c.accent} anchor="end" />}
      {it.desc && <Txt x={x} y={y + rowH * 0.56} t={it.desc} f={F.viet} size={ds} fill={c.muted} max={w - 50} />}
      {rule && <path d={`M${rn(x)} ${rn(y + rowH * (it.desc ? 0.84 : 0.36))} H${rn(x + w)}`} stroke={c.muted} strokeOpacity={0.4} strokeWidth={0.7} strokeDasharray="2 3" />}
    </>
  );
}

function PricePill({ x, y, t, size, c }: { x: number; y: number; t: string; size: number; c: Colors }) {
  const measure = useMeasure();
  const w = (measure(t, F.vietB[0], F.vietB[1], size, 0) ?? t.length * size * 0.6) + size * 1.2;
  return (
    <>
      <rect x={rn(x - w)} y={rn(y - size * 1.05)} width={rn(w)} height={rn(size * 1.5)} rx={rn(size * 0.75)} fill={c.accent} />
      <Txt x={x - w / 2} y={y} t={t} f={F.vietB} size={size} fill="#fff" anchor="middle" />
    </>
  );
}

/* ---------- Nhóm dịch vụ theo từng kiểu ---------- */

type SectionStyle = MenuTemplate["section"];
const HEAD_UNITS: Record<SectionStyle, number> = { leader: 1.5, cards: 2.4, pill: 1.7, wide: 1.6, numbered: 1.7, icon: 1.7, tags: 1.5, table: 1.6, centered: 1.8, sidebar: 1.5 };
const itemUnits = (s: MenuSection, style: SectionStyle) =>
  style === "wide"
    ? Array.from({ length: Math.ceil(s.items.length / 2) }, (_, r) => 1 + (s.items[r * 2]?.desc || s.items[r * 2 + 1]?.desc ? 0.62 : 0)).reduce((a, b) => a + b, 0)
    : s.items.reduce((a, i) => a + 1 + (i.desc ? 0.62 : 0), 0);
const unitsOf = (s: MenuSection, style: SectionStyle) => HEAD_UNITS[style] + itemUnits(s, style) + 0.7;

function Section({ style, s, x, y, w, rowH, size, c, index }: { style: SectionStyle; s: MenuSection; x: number; y: number; w: number; rowH: number; size: number; c: Colors; index: number }) {
  const head = HEAD_UNITS[style] * rowH;
  const rows = offsets(s.items, y + head, (i) => rowH * (1 + (i.desc ? 0.62 : 0)));
  const up = s.title.toLocaleUpperCase("vi");
  const items = (ix = x, iw = w, extra?: (i: number) => Partial<Parameters<typeof Row>[0]>) =>
    s.items.map((it, i) => <Row key={i} x={ix} y={rows[i] + size * 0.3} w={iw} it={it} size={size} c={c} rowH={rowH} rule={i < s.items.length - 1} {...extra?.(i)} />);
  const hsize = size * 0.95;
  switch (style) {
    case "leader":
      return (
        <>
          <Txt x={x} y={y + hsize * 1.1} t={up} f={F.montB} size={hsize} fill={c.accent} sp={1.5} max={w} />
          <path d={`M${x} ${rn(y + hsize * 1.6)} H${x + w}`} stroke={c.accent} strokeWidth={1} />
          {items()}
        </>
      );
    case "sidebar":
      return (
        <>
          <rect x={x} y={y} width={3} height={rn(unitsOf(s, style) * rowH - rowH * 0.9)} fill={c.accent} />
          <Txt x={x + 14} y={y + hsize * 1.1} t={up} f={c.head} size={hsize * 1.25} fill={c.accent} sp={2} max={w - 14} />
          {items(x + 14, w - 14)}
        </>
      );
    case "cards": {
      const h = unitsOf(s, style) * rowH - rowH * 0.7;
      return (
        <>
          <rect x={x - 8} y={y} width={w + 16} height={rn(h)} rx={14} fill={c.card} stroke={c.soft} strokeWidth={1.5} />
          <path d={`M${x - 8} ${rn(y + rowH * 1.55)} V${y + 14} Q${x - 8} ${y} ${x + 6} ${y} H${x + w - 6} Q${x + w + 8} ${y} ${x + w + 8} ${y + 14} V${rn(y + rowH * 1.55)} Z`} fill={c.accent} />
          <Txt x={x + w / 2} y={y + rowH * 1.05} t={up} f={F.montB} size={hsize} fill="#fff" anchor="middle" sp={1.5} max={w - 12} />
          {items(x + 6, w - 12)}
        </>
      );
    }
    case "pill": {
      return (
        <>
          <rect x={x} y={rn(y + 2)} width={Math.min(w, 44 + up.length * hsize * 0.72)} height={rn(hsize * 1.7)} rx={rn(hsize * 0.85)} fill={c.accent} />
          <Txt x={x + 14} y={y + hsize * 1.3} t={up} f={F.montB} size={hsize} fill="#fff" sp={1.2} max={w - 28} />
          {items()}
        </>
      );
    }
    case "wide": {
      const sub = (w - 36) / 2;
      const rowTops = offsets(Array.from({ length: Math.ceil(s.items.length / 2) }, (_, r) => r), y + head, (r) => rowH * (1 + (s.items[r * 2]?.desc || s.items[r * 2 + 1]?.desc ? 0.62 : 0)));
      return (
        <>
          <GroupIcon kind={s.icon} x={x + 11} y={y + hsize * 0.7} s={22} c={c.accent} />
          <Txt x={x + 30} y={y + hsize * 1.2} t={s.title} f={c.head} size={hsize * 1.55} fill={c.ink} max={w - 30} />
          <path d={`M${x} ${rn(y + hsize * 1.9)} H${x + w}`} stroke={c.accent} strokeWidth={0.8} />
          {s.items.map((it, i) => (
            <Row key={i} x={x + (i % 2) * (sub + 36)} y={rowTops[Math.floor(i / 2)] + size * 0.3} w={sub} it={it} size={size} c={c} rowH={rowH} />
          ))}
        </>
      );
    }
    case "numbered":
      return (
        <>
          <Txt x={x} y={y + hsize * 1.55} t={String(index + 1).padStart(2, "0")} f={c.head} size={hsize * 2} fill={c.accent} />
          <Txt x={x + hsize * 2.8} y={y + hsize * 1.3} t={up} f={F.montB} size={hsize} fill={c.ink} sp={1.5} max={w - hsize * 2.8} />
          <path d={`M${rn(x + hsize * 2.8)} ${rn(y + hsize * 1.8)} H${x + w}`} stroke={c.ink} strokeOpacity={0.3} strokeWidth={0.8} />
          {items()}
        </>
      );
    case "icon":
      return (
        <>
          <circle cx={x + 13} cy={y + hsize * 0.9} r={13} fill={c.soft} />
          <GroupIcon kind={s.icon} x={x + 13} y={y + hsize * 0.9} s={17} c={c.accent} />
          <Txt x={x + 34} y={y + hsize * 1.3} t={s.title} f={c.head} size={hsize * 1.4} fill={c.ink} max={w - 34} />
          {items()}
        </>
      );
    case "tags":
      return (
        <>
          <Txt x={x} y={y + hsize * 1.2} t={s.title} f={c.head} size={hsize * 1.45} fill={c.ink} max={w} />
          <path d={`M${x} ${rn(y + hsize * 1.75)} q6 -4 12 0 t12 0 t12 0 t12 0`} fill="none" stroke={c.accent} strokeWidth={2} strokeLinecap="round" />
          {items(x, w, (i) => ({ rule: false, priceNode: <PricePill x={x + w} y={rows[i] + size * 0.3} t={s.items[i].price} size={size * 0.9} c={c} /> }))}
        </>
      );
    case "table": {
      const h = unitsOf(s, style) * rowH - rowH * 0.7;
      return (
        <>
          <rect x={x - 8} y={y} width={w + 16} height={rn(h)} rx={6} fill={c.card} />
          <rect x={x - 8} y={y} width={w + 16} height={rn(rowH * 1.3)} rx={6} fill={c.accent} />
          <Txt x={x + 2} y={y + rowH * 0.88} t={up} f={F.montB} size={hsize * 0.95} fill="#fff" sp={1.2} max={w - 60} />
          <Txt x={x + w} y={y + rowH * 0.88} t="GIÁ" f={F.montB} size={hsize * 0.8} fill="#fff" anchor="end" sp={1.5} />
          {s.items.map((it, i) =>
            i % 2 ? <rect key={`z${i}`} x={x - 8} y={rn(rows[i] - rowH * 0.62)} width={w + 16} height={rn(rowH * (1 + (it.desc ? 0.62 : 0)))} fill={mix(c.card, c.ink, 0.05)} /> : null,
          )}
          {items(x + 2, w - 4, () => ({ rule: false }))}
        </>
      );
    }
    case "centered":
      return (
        <>
          <Txt x={x + w / 2} y={y + hsize * 1.3} t={s.title} f={c.head} size={hsize * 1.5} fill={c.accent} anchor="middle" max={w} />
          <path d={`M${rn(x + w / 2 - 46)} ${rn(y + hsize * 2)} H${rn(x + w / 2 - 10)} M${rn(x + w / 2 + 10)} ${rn(y + hsize * 2)} H${rn(x + w / 2 + 46)}`} stroke={c.accent} strokeWidth={0.8} />
          <path d={star(rn(x + w / 2), rn(y + hsize * 2), 4)} fill={c.accent} />
          {items(x, w, () => ({ centered: true, rule: false }))}
        </>
      );
  }
}

// Xếp các nhóm vào 1 hoặc 2 cột, tự tính cỡ dòng cho vừa khung.
function Sections({ secs, style, box, cols, c, startIndex }: { secs: MenuSection[]; style: SectionStyle; box: { x: number; y: number; w: number; h: number }; cols: 1 | 2; c: Colors; startIndex: number }) {
  const n = style === "wide" ? 1 : cols;
  const buckets: { s: MenuSection; i: number }[][] = Array.from({ length: n }, () => []);
  const load = Array.from({ length: n }, () => 0);
  secs.forEach((s, i) => {
    const k = load.indexOf(Math.min(...load));
    buckets[k].push({ s, i });
    load[k] += unitsOf(s, style);
  });
  const gap = 34;
  const cw = (box.w - gap * (n - 1)) / n;
  const rowH = cl(box.h / Math.max(1, ...load), 14, 34);
  const size = cl(rowH * 0.5, 9.5, 14.5);
  return (
    <>
      {buckets.map((col, ci) => {
        // Khoảng trống còn thừa chia đều vào giữa các nhóm để nội dung phủ đều trang.
        const spare = col.length > 1 ? Math.min(46, (box.h - load[ci] * rowH) / (col.length - 1)) : 0;
        const tops = offsets(col, box.y, ({ s }) => unitsOf(s, style) * rowH + spare);
        return col.map(({ s, i }, k) => (
          <Section key={i} style={style} s={s} x={box.x + ci * (cw + gap)} y={tops[k]} w={cw} rowH={rowH} size={size} c={c} index={startIndex + i} />
        ));
      })}
    </>
  );
}

/* ---------- Hoạ tiết nền ---------- */

function Decor({ t, c, side }: { t: MenuTemplate; c: Colors; side: "front" | "back" }) {
  const rnd = seeded(t.id.length * 7 + (side === "back" ? 3 : 0));
  switch (t.decor) {
    case "frame":
      return (
        <>
          <rect x={16} y={16} width={W - 32} height={H - 32} fill="none" stroke={c.accent} strokeWidth={1.2} />
          <rect x={23} y={23} width={W - 46} height={H - 46} fill="none" stroke={c.accent} strokeWidth={0.5} />
        </>
      );
    case "deco":
      return (
        <>
          {[0, 1].map((k) => (
            <g key={k} transform={k ? `translate(${W} 0) scale(-1 1)` : undefined}>
              {Array.from({ length: 7 }, (_, i) => {
                const a = (i * Math.PI) / 12;
                return <path key={i} d={`M0 0 L${rn(120 * Math.cos(a))} ${rn(120 * Math.sin(a))}`} stroke={c.accent} strokeWidth={0.8} />;
              })}
              <path d="M0 60 A60 60 0 0 0 60 0" fill="none" stroke={c.accent} strokeWidth={1.2} />
            </g>
          ))}
          <rect x={14} y={14} width={W - 28} height={H - 28} fill="none" stroke={c.accent} strokeWidth={0.8} />
        </>
      );
    case "veins":
      return (
        <g fill="none" stroke={c.accent} strokeOpacity={0.22} strokeWidth={1}>
          <path d="M-20 120 C120 80 180 200 320 150 S520 60 640 130" />
          <path d="M-20 760 C100 700 240 800 360 740 S540 680 640 720" />
          <path d="M-20 140 C140 110 200 230 340 175" strokeOpacity={0.12} />
        </g>
      );
    case "leaves":
      return (
        <>
          <Sprig x={14} y={H + 6} s={0.62} rot={38} color={c.accent} />
          <Sprig x={W - 14} y={H + 6} s={0.62} rot={-38} color={c.accent} />
        </>
      );
    case "sun":
      return (
        <>
          {[[70, c.accent], [52, c.soft]].map(([r, col]) => (
            <path key={String(r)} d={`M${C - Number(r)} 0 A${r} ${r} 0 0 0 ${C + Number(r)} 0 Z`} fill={String(col)} fillOpacity={0.5} />
          ))}
          <rect x={0} y={H - 12} width={W} height={12} fill={c.accent} fillOpacity={0.7} />
        </>
      );
    case "roses":
      return (
        <>
          <Blossom x={40} y={40} r={22} petal={c.soft} center={c.accent} />
          <Blossom x={78} y={24} r={13} petal={c.soft} center={c.accent} />
          <Blossom x={W - 40} y={H - 40} r={22} petal={c.soft} center={c.accent} />
          <Blossom x={W - 78} y={H - 24} r={13} petal={c.soft} center={c.accent} />
        </>
      );
    case "confetti":
      return (
        <>
          {Array.from({ length: 30 }, (_, i) => {
            const x = rn(10 + rnd() * 580);
            const y = rn(i % 2 ? 8 + rnd() * 70 : H - 8 - rnd() * 40);
            return i % 3 ? <circle key={i} cx={x} cy={y} r={rn(2 + rnd() * 2.5)} fill={[c.accent, c.soft, "#C6F432"][i % 3]} /> : <path key={i} d={star(x, y, 5)} fill={c.accent} />;
          })}
        </>
      );
    case "stripes":
      return (
        <>
          {Array.from({ length: 30 }, (_, i) => (
            <rect key={i} x={i * 20} y={0} width={10} height={10} fill={c.accent} fillOpacity={0.85} />
          ))}
          {Array.from({ length: 30 }, (_, i) => (
            <rect key={`b${i}`} x={i * 20 + 10} y={H - 10} width={10} height={10} fill={c.accent} fillOpacity={0.85} />
          ))}
        </>
      );
    case "waves":
      return <path d={`M0 ${H - 34} Q75 ${H - 50} 150 ${H - 34} T300 ${H - 34} T450 ${H - 34} T600 ${H - 34} V${H} H0 Z`} fill={c.soft} />;
    case "rings":
      return (
        <g fill="none" stroke={c.accent} strokeOpacity={0.35} strokeWidth={1.2}>
          {[70, 90, 110, 130].map((r) => (
            <path key={r} d={`M0 ${r} A${r} ${r} 0 0 0 ${r} 0 M${W} ${H - r} A${r} ${r} 0 0 0 ${W - r} ${H}`} />
          ))}
        </g>
      );
    case "band":
      return null;
    case "dots":
      return (
        <>
          {Array.from({ length: 14 }, (_, i) => (
            <circle key={i} cx={20 + i * 43} cy={14} r={3} fill={c.soft} />
          ))}
          {Array.from({ length: 14 }, (_, i) => (
            <circle key={`b${i}`} cx={20 + i * 43} cy={H - 14} r={3} fill={c.soft} />
          ))}
        </>
      );
  }
  return null;
}

/* ---------- Mã QR ---------- */

function qrPath(value: string) {
  qrcode.stringToBytes = (s: string) => [...new TextEncoder().encode(s)];
  const code = qrcode(0, "M");
  code.addData(value.trim() || " ");
  code.make();
  const n = code.getModuleCount();
  let d = "";
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (code.isDark(y, x)) d += `M${x} ${y}h1v1h-1z`;
  return { n, d };
}

function QrRow({ x, y, w, d, c, max = 84, label }: { x: number; y: number; w: number; d: MenuDesign; c: Colors; max?: number; label?: string }) {
  const list = d.qrs.filter((q) => q.url.trim()).slice(0, 4);
  if (!list.length) return null;
  const slot = w / list.length;
  const size = Math.min(max, slot - 14);
  return (
    <g>
      {list.map((q, i) => {
        const { n, d: path } = qrPath(q.url);
        const qx = x + slot * i + (slot - size) / 2;
        const k = (size - 10) / n;
        return (
          <g key={i}>
            <rect x={rn(qx)} y={y} width={rn(size)} height={rn(size)} rx={8} fill="#ffffff" stroke={c.soft} strokeWidth={1} />
            <path d={path} transform={`translate(${rn(qx + 5)} ${y + 5}) scale(${rn(k)})`} fill="#1a1a1a" />
            <Txt x={qx + size / 2} y={y + size + 15} t={q.label} f={F.montB} size={9.5} fill={label ?? c.ink} anchor="middle" sp={0.8} max={slot - 6} />
          </g>
        );
      })}
    </g>
  );
}

/* ---------- Logo tiệm ---------- */

const EMBLEM_H: Record<Emblem, number> = { serif: 100, script: 92, badge: 150, ring: 124 };
const emblemHeight = (t: MenuTemplate, d: MenuDesign, w: number) => (d.logo ? rn(w * 0.5) : EMBLEM_H[t.emblem]);

function EmblemArt({ t, d, c, cx, y, w, uid, onDark = false }: { t: MenuTemplate; d: MenuDesign; c: Colors; cx: number; y: number; w: number; uid: string; onDark?: boolean }) {
  const ink = onDark ? "#ffffff" : c.ink;
  if (d.logo) return <image href={d.logo} x={rn(cx - w / 2)} y={y} width={w} height={rn(w * 0.5)} preserveAspectRatio="xMidYMid meet" />;
  const tag = d.tagline.toLocaleUpperCase("vi");
  switch (t.emblem) {
    case "serif":
      return (
        <>
          <GroupIcon kind="nail" x={cx} y={y + 14} s={24} c={c.accent} />
          <Txt x={cx} y={y + 64} t={d.salon} f={c.head} size={38} fill={ink} anchor="middle" max={w} />
          <path d={`M${rn(cx - w / 2 + 10)} ${y + 84} H${rn(cx - 70)} M${rn(cx + 70)} ${y + 84} H${rn(cx + w / 2 - 10)}`} stroke={c.accent} strokeWidth={0.8} />
          <Txt x={cx} y={y + 88} t={tag} f={F.mont} size={9.5} fill={c.accent} anchor="middle" sp={3} max={130} />
        </>
      );
    case "script":
      return (
        <>
          <Txt x={cx} y={y + 56} t={d.salon} f={F.dancing} size={50} fill={c.accent} anchor="middle" max={w} />
          <path d={star(rn(cx + Math.min(w / 2, 150)), y + 14, 9)} fill={c.accent} />
          <Txt x={cx} y={y + 84} t={tag} f={F.mont} size={9.5} fill={ink} anchor="middle" sp={4} max={w} />
        </>
      );
    case "badge": {
      const lines = twoLines(d.salon);
      return (
        <>
          <circle cx={cx} cy={y + 64} r={62} fill={c.accent} />
          <circle cx={cx} cy={y + 64} r={55} fill="none" stroke={c.bg} strokeOpacity={0.7} strokeWidth={1} />
          <path d={star(cx, y + 22, 6)} fill={c.bg} />
          {lines.map((ln, i) => (
            <Txt key={i} x={cx} y={y + 70 + (i - (lines.length - 1) / 2) * 24} t={ln} f={c.head} size={21} fill={c.bg} anchor="middle" max={98} />
          ))}
          <Txt x={cx} y={y + 146} t={tag} f={F.montB} size={9} fill={ink} anchor="middle" sp={3} max={w} />
        </>
      );
    }
    case "ring": {
      const r = 50;
      const cy = y + 62;
      return (
        <>
          <circle cx={cx} cy={cy} r={r + 8} fill="none" stroke={c.accent} strokeWidth={1.6} />
          <circle cx={cx} cy={cy} r={r - 12} fill="none" stroke={c.accent} strokeWidth={0.8} />
          <defs>
            <path id={`${uid}-rt`} d={`M${cx - r + 2} ${cy} A${r - 2} ${r - 2} 0 0 1 ${cx + r - 2} ${cy}`} />
            <path id={`${uid}-rb`} d={`M${cx - r + 10} ${cy} A${r - 10} ${r - 10} 0 0 0 ${cx + r - 10} ${cy}`} />
          </defs>
          <text fontFamily={`'${F.montB[0]}'`} fontWeight={F.montB[1]} fontSize={10.5} fill={ink} letterSpacing={2} textAnchor="middle">
            <textPath href={`#${uid}-rt`} startOffset="50%">
              {d.salon.toLocaleUpperCase("vi")}
            </textPath>
          </text>
          <text fontFamily={`'${F.mont[0]}'`} fontWeight={F.mont[1]} fontSize={8} fill={c.accent} letterSpacing={2} textAnchor="middle" dominantBaseline="hanging">
            <textPath href={`#${uid}-rb`} startOffset="50%">
              {tag}
            </textPath>
          </text>
          <GroupIcon kind="nail" x={cx} y={cy - 2} s={26} c={c.accent} />
        </>
      );
    }
  }
}

/* ---------- Liên hệ ---------- */

function Contact({ x, y, w, d, c, phone = 24, center = false, ink }: { x: number; y: number; w: number; d: MenuDesign; c: Colors; phone?: number; center?: boolean; ink?: string }) {
  const col = ink ?? c.ink;
  const hours = d.hours.split("|").map((s) => s.trim()).filter(Boolean);
  const anchor = center ? "middle" : "start";
  const tx = center ? x + w / 2 : x + 28;
  const iconX = (text: string, size: number) => (center ? x + w / 2 - Math.min(w / 2 - 10, text.length * size * 0.3) - 16 : x + 10);
  let yy = y;
  const rows: ReactNode[] = [];
  if (d.phone) {
    rows.push(
      <g key="p">
        <Icon kind="phone" x={iconX(d.phone, phone)} y={yy - phone * 0.36} s={phone * 0.9} c={c.accent} />
        <Txt x={tx} y={yy} t={d.phone} f={F.montB} size={phone} fill={col} anchor={anchor} max={w - 30} />
      </g>,
    );
    yy += phone * 0.6 + 20;
  }
  if (d.address) {
    rows.push(
      <g key="a">
        {!center && <Icon kind="pin" x={x + 10} y={yy - 4.5} s={15} c={c.accent} />}
        <Txt x={tx} y={yy} t={d.address} f={F.viet} size={12.5} fill={col} anchor={anchor} max={w - 30} />
      </g>,
    );
    yy += 24;
  }
  hours.forEach((h, i) => {
    rows.push(
      <g key={`h${i}`}>
        {!center && i === 0 && <Icon kind="clock" x={x + 10} y={yy - 4.5} s={15} c={c.accent} />}
        <Txt x={tx} y={yy} t={h} f={F.viet} size={12.5} fill={col} anchor={anchor} max={w - 30} />
      </g>,
    );
    yy += 19;
  });
  return <g>{rows}</g>;
}

const hasPromo = (d: MenuDesign) => !!d.promoDiscount.trim();
const promoLine = (d: MenuDesign) => [d.promoTitle, d.promoDiscount && `GIẢM ${d.promoDiscount}`].filter(Boolean).join(" · ");

function Burst({ cx, cy, r, d, c }: { cx: number; cy: number; r: number; d: MenuDesign; c: Colors }) {
  const pts = Array.from({ length: 36 }, (_, i) => {
    const rr = i % 2 ? r * 0.8 : r;
    const a = (Math.PI * i) / 18 - Math.PI / 2;
    return `${i ? "L" : "M"}${rn(cx + rr * Math.cos(a))} ${rn(cy + rr * Math.sin(a))}`;
  }).join(" ");
  return (
    <g>
      <path d={`${pts} Z`} fill={c.accent} />
      <Txt x={cx} y={cy + r * 0.12} t={d.promoDiscount} f={F.fraun} size={r * 0.62} fill={c.bg} anchor="middle" max={r * 1.4} />
      <Txt x={cx} y={cy + r * 0.42} t="GIẢM GIÁ" f={F.montB} size={r * 0.17} fill={c.bg} anchor="middle" sp={1} />
    </g>
  );
}

/* ---------- Mặt trước: 10 bố cục ---------- */

function Front({ t, d, c, uid }: { t: MenuTemplate; d: MenuDesign; c: Colors; uid: string }) {
  const ph = (i: number) => d.photos[i] || t.photos[i];
  const promo = hasPromo(d);
  const ring = t.dark ? c.soft : "#ffffff";
  const em = (cx: number, y: number, w: number, onDark = false) => <EmblemArt t={t} d={d} c={c} cx={cx} y={y} w={w} uid={uid} onDark={onDark} />;
  const eh = (w: number) => emblemHeight(t, d, w);
  const circle = (i: number, cx: number, cy: number, r: number, stroke = ring, sw = 6) => (
    <>
      <Photo href={ph(i)} x={cx - r} y={cy - r} w={r * 2} h={r * 2} clip={`M${cx - r} ${cy} A${r} ${r} 0 1 1 ${cx + r} ${cy} A${r} ${r} 0 1 1 ${cx - r} ${cy} Z`} id={`${uid}-c${i}`} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={stroke} strokeWidth={sw} />
    </>
  );
  // Khối liên hệ (trái) + mã QR (phải) bám đáy trang.
  const bottom = (
    <>
      <Contact x={44} y={H - 168} w={292} d={d} c={c} phone={23} />
      <QrRow x={338} y={H - 186} w={218} d={d} c={c} max={74} />
    </>
  );
  const heading = (x: number, y: number, w: number, anchor: "start" | "middle" = "start", size = 40) => {
    const lines = twoLines(promo ? d.promoTitle : d.tagline);
    return lines.map((ln, i) => <Txt key={i} x={x} y={y + i * size * 1.05} t={ln} f={c.head} size={size} fill={c.ink} anchor={anchor} max={w} />);
  };

  switch (t.front) {
    case "archHero": {
      const y0 = 44 + eh(300) + 26;
      return (
        <>
          {em(C, 44, 300)}
          {heading(44, y0 + 44, 270)}
          <path d={`M44 ${y0 + 110} H300`} stroke={c.ink} strokeWidth={1} />
          <Txt x={44} y={y0 + 138} t={promo ? d.promoNote : d.highlights} f={F.viet} size={14} fill={c.ink} max={270} op={0.9} />
          <Photo href={ph(0)} x={334} y={y0} w={222} h={372} clip={arch(334, y0, 222, 372)} id={`${uid}-ar`} />
          <path d={arch(326, y0 - 8, 238, 388)} fill="none" stroke={c.accent} strokeWidth={1.2} />
          {promo && <Burst cx={322} cy={y0 + 52} r={56} d={d} c={c} />}
          <Contact x={44} y={y0 + 196} w={272} d={d} c={c} />
          <path d={`M44 ${y0 + 424} H556`} stroke={c.accent} strokeWidth={0.8} />
          <Txt x={C} y={y0 + 454} t="ĐẶT LỊCH & THEO DÕI CHÚNG TÔI" f={F.montB} size={12} fill={c.accent} anchor="middle" sp={3} />
          <QrRow x={60} y={y0 + 474} w={480} d={d} c={c} max={96} />
        </>
      );
    }
    case "bigCircle":
      return (
        <>
          <path d="M600 0 H470 C540 40 548 170 600 250 Z" fill={c.accent} />
          <path d="M0 849 H150 C90 800 70 700 0 640 Z" fill={c.soft} />
          {em(210, 40, 330)}
          {circle(0, 300, 318, 146)}
          {circle(1, 112, 432, 66)}
          {circle(2, 488, 432, 66)}
          <rect x={120} y={494} width={360} height={40} rx={20} fill={promo ? c.accent : c.soft} />
          <Txt x={C} y={520} t={promo ? promoLine(d) : d.highlights} f={F.montB} size={13} fill={promo ? "#fff" : c.ink} anchor="middle" sp={1} max={330} />
          {promo && <Txt x={C} y={556} t={d.promoNote} f={F.viet} size={12} fill={c.muted} anchor="middle" max={440} />}
          <Contact x={40} y={624} w={270} d={d} c={c} />
          <rect x={314} y={600} width={242} height={138} rx={14} fill="none" stroke={c.accent} strokeWidth={1.4} strokeDasharray="6 4" />
          <rect x={357} y={588} width={156} height={24} rx={12} fill={c.accent} />
          <Txt x={435} y={604} t="THEO DÕI CHÚNG TÔI" f={F.montB} size={9.5} fill="#fff" anchor="middle" sp={1} />
          <QrRow x={320} y={632} w={230} d={d} c={c} max={80} />
        </>
      );
    case "badgeCard":
      return (
        <>
          {em(130, 30, 220)}
          <g transform="rotate(-3 428 130)">
            <rect x={300} y={54} width={256} height={150} rx={18} fill="#ffffff" stroke={c.accent} strokeWidth={1.6} />
            {promo ? (
              <>
                <Txt x={428} y={98} t={d.promoTitle} f={c.head} size={26} fill={c.accent} anchor="middle" max={230} />
                <Txt x={428} y={148} t={`GIẢM ${d.promoDiscount}`} f={F.fraun} size={36} fill={c.ink} anchor="middle" max={230} />
                <Txt x={428} y={178} t={d.promoNote} f={F.viet} size={11} fill={c.muted} anchor="middle" max={230} />
              </>
            ) : (
              <>
                <Txt x={428} y={112} t={d.tagline} f={c.head} size={22} fill={c.accent} anchor="middle" max={230} />
                <Txt x={428} y={150} t={d.highlights} f={F.viet} size={12} fill={c.ink} anchor="middle" max={230} />
              </>
            )}
          </g>
          <Txt x={44} y={250} t="DỊCH VỤ CỦA CHÚNG TÔI" f={F.montB} size={11} fill={c.accent} sp={2.5} max={290} />
          {d.sections.slice(0, 5).map((s, i) => (
            <g key={i}>
              <Icon kind="check" x={54} y={284 + i * 32 - 6} s={18} c={c.accent} />
              <Txt x={72} y={284 + i * 32} t={s.title} f={c.head} size={20} fill={c.ink} max={250} />
            </g>
          ))}
          {circle(0, 452, 320, 104)}
          {circle(1, 546, 414, 44)}
          <rect x={44} y={446} width={512} height={96} rx={14} fill="none" stroke={c.accent} strokeWidth={1.4} />
          <rect x={220} y={434} width={160} height={26} rx={13} fill={c.accent} />
          <Txt x={C} y={452} t="GIỜ MỞ CỬA" f={F.montB} size={10.5} fill="#fff" anchor="middle" sp={2} />
          {d.hours.split("|").map((h, i) => (
            <Txt key={i} x={C} y={488 + i * 24} t={h.trim()} f={F.montB} size={14} fill={c.ink} anchor="middle" max={480} />
          ))}
          <Txt x={C} y={594} t={d.phone} f={F.fraun} size={30} fill={c.accent} anchor="middle" max={400} />
          <Txt x={C} y={620} t={d.address} f={F.montB} size={11} fill={c.ink} anchor="middle" sp={0.6} max={480} />
          <QrRow x={70} y={648} w={460} d={d} c={c} max={92} />
        </>
      );
    case "photoTop":
      return (
        <>
          <Photo href={ph(0)} x={0} y={0} w={W} h={440} clip={`M0 0 H${W} V440 H0 Z`} id={`${uid}-pt`} />
          <rect x={140} y={352} width={320} height={178} rx={20} fill={c.bg} />
          {em(C, 364, 290)}
          <rect x={44} y={560} width={512} height={52} rx={26} fill={promo ? c.accent : c.soft} />
          <Txt x={C} y={593} t={promo ? promoLine(d) : d.highlights} f={F.montB} size={16} fill={promo ? "#fff" : c.ink} anchor="middle" sp={1} max={470} />
          {promo && <Txt x={C} y={636} t={d.promoNote} f={F.viet} size={12.5} fill={c.muted} anchor="middle" max={480} />}
          {bottom}
        </>
      );
    case "collage": {
      const y0 = 36 + eh(300) + 16;
      const h = H - 300 - y0;
      const sh = (h - 12) / 2;
      return (
        <>
          {em(C, 36, 300)}
          <Photo href={ph(0)} x={44} y={y0} w={330} h={h} clip={rounded(44, y0, 330, h, 14)} id={`${uid}-g0`} />
          <Photo href={ph(1)} x={386} y={y0} w={170} h={sh} clip={rounded(386, y0, 170, sh, 14)} id={`${uid}-g1`} />
          <Photo href={ph(2)} x={386} y={y0 + sh + 12} w={170} h={sh} clip={rounded(386, y0 + sh + 12, 170, sh, 14)} id={`${uid}-g2`} />
          <rect x={70} y={y0 + h - 26} width={460} height={52} fill={c.accent} />
          <path d={`M70 ${y0 + h - 26} l-14 26 14 26 Z M530 ${y0 + h - 26} l14 26 -14 26 Z`} fill={mix(c.accent, "#000000", 0.2)} />
          <Txt x={C} y={y0 + h + 7} t={promo ? promoLine(d) : d.highlights} f={F.montB} size={15} fill="#fff" anchor="middle" sp={1.5} max={430} />
          {promo && <Txt x={C} y={y0 + h + 52} t={d.promoNote} f={F.viet} size={12.5} fill={c.muted} anchor="middle" max={480} />}
          {bottom}
        </>
      );
    }
    case "split":
      return (
        <>
          <Photo href={ph(0)} x={0} y={0} w={270} h={H} clip={`M0 0 H270 V${H} H0 Z`} id={`${uid}-sp`} />
          {circle(1, 270, 560, 70, c.bg, 8)}
          {em(432, 50, 250)}
          {promo ? (
            <>
              {twoLines(d.promoTitle).map((ln, i) => (
                <Txt key={i} x={314} y={250 + i * 40} t={ln} f={c.head} size={36} fill={c.ink} max={250} />
              ))}
              <Txt x={314} y={362} t={`-${d.promoDiscount}`} f={F.fraun} size={64} fill={c.accent} max={250} />
              <Txt x={314} y={392} t={d.promoNote} f={F.viet} size={12.5} fill={c.muted} max={250} />
            </>
          ) : (
            <>
              <Txt x={314} y={260} t={d.tagline} f={c.head} size={30} fill={c.ink} max={250} />
              <Txt x={314} y={292} t={d.highlights} f={F.viet} size={12.5} fill={c.muted} max={250} />
            </>
          )}
          <Contact x={314} y={446} w={250} d={d} c={c} phone={21} />
          <QrRow x={300} y={H - 180} w={264} d={d} c={c} max={74} />
        </>
      );
    case "polaroids": {
      const y0 = 34 + eh(320) + 20;
      // Xếp từ đáy lên: mã QR, liên hệ, dòng khuyến mãi; ảnh polaroid nằm giữa phần còn lại.
      const promoY = H - 300;
      const cy = rn((y0 + promoY - 30) / 2);
      const shots: [number, number, number][] = [
        [118, -7, 0],
        [482, 7, 2],
        [300, 2, 1],
      ];
      return (
        <>
          {em(C, 34, 320)}
          {shots.map(([cx, rot, i]) => (
            <g key={i} transform={`rotate(${rot} ${cx} ${cy})`}>
              <rect x={cx - 104} y={cy - 134} width={208} height={262} fill="#ffffff" stroke="#00000014" strokeWidth={1} />
              <Photo href={ph(i)} x={cx - 92} y={cy - 122} w={184} h={184} clip={`M${cx - 92} ${cy - 122} h184 v184 h-184 Z`} id={`${uid}-po${i}`} />
              <Txt x={cx} y={cy + 102} t={d.sections[[0, 1, 3][i]]?.title ?? ""} f={F.dancing} size={21} fill={c.accent} anchor="middle" max={i === 1 ? 176 : 148} />
            </g>
          ))}
          {promo && <Burst cx={516} cy={cy - 150} r={50} d={d} c={c} />}
          <Txt x={C} y={promoY} t={promo ? `${d.promoTitle} · ${d.promoNote}` : d.highlights} f={F.montB} size={14} fill={c.ink} anchor="middle" sp={1} max={500} />
          <Contact x={100} y={promoY + 52} w={400} d={d} c={c} center phone={26} />
          <QrRow x={90} y={H - 150} w={420} d={d} c={c} max={86} />
        </>
      );
    }
    case "minimal": {
      const y0 = 60 + eh(360) + 34;
      return (
        <>
          {em(C, 60, 360)}
          {circle(0, 138, y0 + 84, 84, c.accent, 1.5)}
          {circle(1, 300, y0 + 84, 84, c.accent, 1.5)}
          {circle(2, 462, y0 + 84, 84, c.accent, 1.5)}
          <Txt x={C} y={y0 + 214} t={promo ? promoLine(d) : d.highlights} f={F.montB} size={15} fill={c.accent} anchor="middle" sp={2} max={500} />
          {promo && <Txt x={C} y={y0 + 240} t={d.promoNote} f={F.viet} size={12.5} fill={c.muted} anchor="middle" max={480} />}
          <Contact x={100} y={y0 + 296} w={400} d={d} c={c} center phone={26} />
          <QrRow x={90} y={H - 178} w={420} d={d} c={c} max={88} />
        </>
      );
    }
    case "frame": {
      const y0 = 30 + eh(300) + 18;
      const h = H - 290 - y0;
      return (
        <>
          {em(C, 30, 300)}
          <rect x={96} y={y0} width={408} height={h} fill="none" stroke={c.accent} strokeWidth={2} />
          <rect x={104} y={y0 + 8} width={392} height={h - 16} fill="none" stroke={c.accent} strokeWidth={0.7} />
          {[[96, y0], [504, y0], [96, y0 + h], [504, y0 + h]].map(([x, y]) => (
            <path key={`${x}${y}`} d={`M${x} ${y - 7} L${x + 7} ${y} L${x} ${y + 7} L${x - 7} ${y} Z`} fill={c.accent} />
          ))}
          <Photo href={ph(0)} x={112} y={y0 + 16} w={376} h={h - 32} clip={`M112 ${y0 + 16} h376 v${h - 32} h-376 Z`} id={`${uid}-fr`} />
          {promo && <Burst cx={492} cy={y0 + 12} r={54} d={d} c={c} />}
          <Txt x={C} y={y0 + h + 40} t={promo ? `${d.promoTitle} · ${d.promoNote}` : d.highlights} f={F.montB} size={13} fill={c.accent} anchor="middle" sp={1.5} max={500} />
          {bottom}
        </>
      );
    }
    case "strip": {
      const y0 = 36 + eh(300) + 22;
      const ah = H - 386 - y0;
      const band = y0 + ah + 24;
      return (
        <>
          {em(C, 36, 300)}
          {[0, 1, 2].map((i) => (
            <Photo key={i} href={ph(i)} x={44 + i * 176} y={y0} w={160} h={ah} clip={arch(44 + i * 176, y0, 160, ah)} id={`${uid}-st${i}`} />
          ))}
          <rect x={0} y={band} width={W} height={70} fill={c.accent} />
          {promo ? (
            <>
              <Txt x={44} y={band + 44} t={d.promoTitle} f={c.head} size={28} fill="#fff" max={300} />
              <Txt x={556} y={band + 50} t={`-${d.promoDiscount}`} f={F.fraun} size={44} fill="#fff" anchor="end" max={200} />
            </>
          ) : (
            <Txt x={C} y={band + 42} t={d.highlights} f={F.montB} size={16} fill="#fff" anchor="middle" sp={1.5} max={500} />
          )}
          {promo && <Txt x={C} y={band + 98} t={d.promoNote} f={F.viet} size={12.5} fill={c.muted} anchor="middle" max={480} />}
          {bottom}
        </>
      );
    }
  }
}

/* ---------- Mặt sau: bảng giá ---------- */

function BackHeader({ t, d, c, uid }: { t: MenuTemplate; d: MenuDesign; c: Colors; uid: string }) {
  const salon = d.salon.toLocaleUpperCase("vi");
  switch (t.back) {
    case "serif":
      return (
        <>
          <Txt x={C} y={60} t={salon} f={F.montB} size={10.5} fill={c.accent} anchor="middle" sp={4} max={440} />
          <Txt x={C} y={106} t={d.title} f={c.head} size={38} fill={c.ink} anchor="middle" sp={1} max={480} />
          <path d={`M${C - 70} 126 H${C - 12} M${C + 12} 126 H${C + 70}`} stroke={c.accent} strokeWidth={0.8} />
          <path d={star(C, 126, 5)} fill={c.accent} />
        </>
      );
    case "script":
      return (
        <>
          <Txt x={C} y={52} t={salon} f={F.montB} size={10.5} fill={c.ink} anchor="middle" sp={4} max={440} />
          <Txt x={C} y={116} t="Bảng giá" f={F.dancing} size={64} fill={c.accent} anchor="middle" max={440} />
        </>
      );
    case "big":
      return (
        <>
          <Txt x={44} y={112} t={d.title} f={c.head} size={50} fill={c.accent} max={400} />
          <Txt x={556} y={56} t={salon} f={F.montB} size={10} fill={c.ink} anchor="end" sp={2.5} max={260} />
          <path d={`M44 128 H556`} stroke={c.ink} strokeWidth={1} />
        </>
      );
    case "band":
      return (
        <>
          <rect x={0} y={0} width={W} height={116} fill={c.accent} />
          <Txt x={C} y={66} t={d.title} f={c.head} size={36} fill="#fff" anchor="middle" max={480} />
          <Txt x={C} y={94} t={salon} f={F.montB} size={10} fill="#fff" anchor="middle" sp={4} max={440} />
        </>
      );
    case "photo":
      return (
        <>
          <Photo href={d.photos[1] || t.photos[1]} x={0} y={0} w={W} h={124} clip={`M0 0 H${W} V124 H0 Z`} id={`${uid}-bh`} />
          <rect x={0} y={0} width={W} height={124} fill="#000" fillOpacity={0.35} />
          <Txt x={C} y={70} t={d.title} f={c.head} size={36} fill="#fff" anchor="middle" max={480} />
          <Txt x={C} y={98} t={salon} f={F.montB} size={10} fill="#fff" anchor="middle" sp={4} max={440} />
        </>
      );
  }
}

/* ---------- Menu ---------- */

export function MenuSvg({ design: d, template: t, side = "front", svgRef, className }: {
  design: MenuDesign; template: MenuTemplate; side?: "front" | "back"; svgRef?: Ref<SVGSVGElement>; className?: string;
}) {
  const uid = useId().replace(/[^\w-]/g, "");
  const { bg, ink, accent, soft } = t.colors;
  const c: Colors = { bg, ink, accent, soft, muted: mix(ink, bg, 0.45), card: t.dark ? soft : mix(bg, "#ffffff", 0.7), head: t.head };
  const front = side === "front";
  const secs = d.sections.slice(0, 8).map((s) => ({ ...s, items: s.items.filter((i) => i.name || i.price).slice(0, 8) })).filter((s) => s.title || s.items.length);
  const top = t.back === "band" || t.back === "photo" ? 156 : 158;
  return (
    <svg ref={svgRef} className={className} viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg" role="img" aria-label={`Menu ${t.title} ${front ? "mặt trước" : "mặt sau"} của ${d.salon}`}>
      <rect width={W} height={H} fill={bg} />
      <Decor t={t} c={c} side={side} />
      {front ? (
        <Front t={t} d={d} c={c} uid={uid} />
      ) : (
        <>
          <BackHeader t={t} d={d} c={c} uid={uid} />
          <Sections secs={secs} style={t.section} box={{ x: 44, y: top, w: 512, h: H - 112 - top }} cols={2} c={c} startIndex={0} />
          <path d={`M44 ${H - 94} H556`} stroke={accent} strokeWidth={0.8} />
          <Txt x={C} y={H - 70} t={[d.phone, d.address].filter(Boolean).join("  ·  ")} f={F.montB} size={11} fill={ink} anchor="middle" sp={0.5} max={512} />
          <Txt x={C} y={H - 50} t={d.hours.split("|").map((s) => s.trim()).join("  ·  ")} f={F.viet} size={10.5} fill={ink} anchor="middle" max={512} />
          <Txt x={C} y={H - 30} t={d.policy.filter(Boolean).join("  ·  ")} f={F.viet} size={9.5} fill={c.muted} anchor="middle" max={512} />
        </>
      )}
    </svg>
  );
}
