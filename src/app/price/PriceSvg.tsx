import { useId, type ReactNode, type Ref } from "react";
import { TAGLINE_FONT, fontOf } from "@/lib/logo-templates";
import { bodyFontOf, priceFormatOf, type PriceDesign, type PriceItem, type PriceSection } from "@/lib/price-templates";
import { fit, useMeasure, type Fit } from "../design/measure";
import { LogoIcon } from "../logo/LogoSvg";

type Box = { x: number; y: number; w: number; h: number };
type Anchor = "start" | "middle" | "end";

// Cách trình bày phần danh sách dịch vụ của từng kiểu bố cục.
type BodyCfg = {
  // prefer1: 1 cột, chỉ chia 2 cột khi chữ sẽ quá nhỏ.
  cols: "auto" | "prefer1" | 1 | 2;
  title: "lines" | "left" | "chip" | "number" | "ruled";
  titleFont: "head" | "caps";
  row: "leader" | "line" | "split" | "caps";
  card?: boolean;
};

function T({
  s,
  x,
  y,
  family,
  weight,
  f,
  fill,
  anchor = "start",
  spacing = 0,
  opacity,
}: {
  s: string;
  x: number;
  y: number;
  family: string;
  weight: number;
  f: Fit;
  fill: string;
  anchor?: Anchor;
  spacing?: number;
  opacity?: number;
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      fontFamily={`'${family}'`}
      fontWeight={weight}
      fontSize={f.size}
      letterSpacing={spacing || undefined}
      fill={fill}
      fillOpacity={opacity}
      textLength={f.length}
      lengthAdjust={f.length ? "spacingAndGlyphs" : undefined}
    >
      {s}
    </text>
  );
}

/* ---------- Vân đá cẩm thạch (sinh ngẫu nhiên có hạt giống → mỗi mẫu một vân, lần nào vẽ cũng giống nhau) ---------- */

function mulberry(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const hash = (str: string) => [...str].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7);

export const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255 < 0.45;
};

export function Veins({ W, H, dark, gold, seed, id }: { W: number; H: number; dark: boolean; gold: string; seed: number; id: string }) {
  const r = mulberry(seed);
  const u = W / 100;
  const lines = Array.from({ length: 11 }, (_, i) => {
    let x = -W * 0.15 + r() * W * 0.25;
    let y = r() * H * 1.1 - H * 0.1;
    const steps = 6;
    const dx = (W * 1.3) / steps;
    let d = `M${x} ${y}`;
    for (let st = 0; st < steps; st++) {
      const nx = x + dx * (0.8 + r() * 0.4);
      const ny = y + H * 0.035 + (r() - 0.5) * H * 0.12;
      d += ` C${x + dx * 0.35} ${y + (r() - 0.5) * H * 0.1} ${nx - dx * 0.35} ${ny + (r() - 0.5) * H * 0.1} ${nx} ${ny}`;
      x = nx;
      y = ny;
    }
    const main = i < 5;
    return { d, w: main ? u * (0.25 + r() * 0.45) : u * (0.08 + r() * 0.15), o: main ? 0.3 + r() * 0.3 : 0.25 + r() * 0.3, gold: dark || r() < 0.3 };
  });
  const grey = dark ? gold : "#8E959C";
  return (
    <g fill="none" strokeLinecap="round" data-canvas-bg="true">
      <defs>
        <filter id={`${id}-soft`} x="-5%" y="-5%" width="110%" height="110%">
          <feGaussianBlur stdDeviation={u * 0.18} />
        </filter>
      </defs>
      <g filter={`url(#${id}-soft)`}>
        {lines.map((l, i) => (
          <path key={`c${i}`} d={l.d} stroke={dark ? gold : "#B9BEC3"} strokeOpacity={0.1} strokeWidth={l.w * 6} />
        ))}
        {lines.map((l, i) => (
          <path key={`v${i}`} d={l.d} stroke={l.gold ? gold : grey} strokeOpacity={l.o} strokeWidth={l.w} />
        ))}
      </g>
      {lines
        .filter((l) => l.gold)
        .map((l, i) => (
          <path key={`g${i}`} d={l.d} stroke={gold} strokeOpacity={dark ? 0.8 : 0.55} strokeWidth={u * 0.1} />
        ))}
    </g>
  );
}

export function PriceSvg({ design, svgRef, className }: { design: PriceDesign; svgRef?: Ref<SVGSVGElement>; className?: string }) {
  const measure = useMeasure();
  const fmt = priceFormatOf(design.format);
  const W = fmt.w;
  const H = fmt.h;
  const C = W / 2;
  const u = W / 100; // 1 đơn vị = 1% bề ngang
  const m = u * 8; // lề
  const { bg, surface, primary, text, accent } = design.colors;
  const head = fontOf(design.headFont);
  const body = bodyFontOf(design.bodyFont);
  const headUpper = !head.script && (design.headFont === "montserrat" || design.headFont === "josefin");
  const salon = (headUpper ? design.salon.toLocaleUpperCase("vi") : design.salon).trim() || " ";
  let key = 0;
  const k = () => `e${key++}`;
  const uid = useId().replace(/:/g, "");

  /* ----- Các khối chữ dùng chung ----- */

  const fitHead = (s: string, base: number, maxW: number, upper = headUpper) => {
    const sp = upper ? base * 0.08 : 0;
    return { f: fit(s, head.width * (upper ? 1.15 : 1), base, base * 0.4, maxW, sp, measure(s, head.family, head.weight, base, sp)), ratio: upper ? 0.08 : 0 };
  };
  const fitCaps = (s: string, base: number, maxW: number, ratio = 0.3, bold = false) => {
    const weight = bold ? 700 : TAGLINE_FONT.weight;
    return fit(s, TAGLINE_FONT.width * 1.1, base, base * 0.55, maxW, base * ratio, measure(s, TAGLINE_FONT.family, weight, base, base * ratio));
  };
  // minRatio: được thu nhỏ tới đâu (1 = giữ nguyên cỡ, nếu tràn thì chỉ ép bề ngang).
  const fitBody = (s: string, base: number, maxW: number, bold = false, minRatio = 0.72) =>
    fit(s, body.width, base, base * minRatio, maxW, 0, measure(s, body.family, bold ? body.bold : body.weight, base, 0));

  const fitRow = (s: string, base: number, maxW: number, bold: boolean, minRatio: number, caps: boolean) =>
    caps
      ? fit(s, body.width * 1.15, base, base * minRatio, maxW, base * 0.06, measure(s, body.family, bold ? body.bold : body.weight, base, base * 0.06))
      : fitBody(s, base, maxW, bold, minRatio);

  const salonName = (x: number, y: number, base: number, maxW: number, fill: string, anchor: Anchor = "middle") => {
    const { f, ratio } = fitHead(salon, base, maxW);
    return <T key={k()} s={salon} x={x} y={y} family={head.family} weight={head.weight} f={f} fill={fill} anchor={anchor} spacing={f.size * ratio} />;
  };

  const caps = (s: string, x: number, y: number, size: number, maxW: number, fill: string, anchor: Anchor = "middle", opts: { lines?: string; bold?: boolean; ratio?: number } = {}) => {
    const str = s.trim().toLocaleUpperCase("vi");
    if (!str) return { els: [] as ReactNode[], width: 0 };
    const ratio = opts.ratio ?? 0.3;
    const f = fitCaps(str, size, maxW, ratio, opts.bold);
    const els: ReactNode[] = [
      <T key={k()} s={str} x={x} y={y} family={TAGLINE_FONT.family} weight={opts.bold ? 700 : TAGLINE_FONT.weight} f={f} fill={fill} anchor={anchor} spacing={f.size * ratio} />,
    ];
    if (opts.lines && anchor === "middle") {
      const half = f.width / 2;
      const ly = y - f.size * 0.35;
      els.push(<path key={k()} d={`M${x - half - u * 7} ${ly} H${x - half - u * 2} M${x + half + u * 2} ${ly} H${x + half + u * 7}`} stroke={opts.lines} strokeWidth={u * 0.25} strokeLinecap="round" />);
    }
    return { els, width: f.width };
  };

  const decor = (x: number, y: number, size: number, p = primary, a = accent) => <LogoIcon key={k()} id={design.decor} x={x} y={y} size={size} primary={p} accent={a} />;

  // Thông tin liên hệ (vẽ từ dưới lên), trả về mép trên để phần thân dừng lại.
  const contact = (bottom: number, x: number, maxW: number, color: string, anchor: Anchor = "middle") => {
    const line1 = [design.phone.trim() && `Hotline ${design.phone.trim()}`, design.hours.trim() && `Mở cửa ${design.hours.trim()}`].filter(Boolean).join("   ·   ");
    const lines = [line1, design.address.trim()].filter(Boolean);
    const size = u * 2.3;
    const els: ReactNode[] = [];
    lines.reverse().forEach((s, i) => {
      const f = fitBody(s, size, maxW);
      els.push(<T key={k()} s={s} x={x} y={bottom - i * size * 1.65} family={body.family} weight={body.weight} f={f} fill={color} anchor={anchor} opacity={0.85} />);
    });
    return { els, top: bottom - Math.max(0, lines.length - 1) * size * 1.65 - size * 1.2 };
  };

  /* ----- Danh sách dịch vụ: tự co chữ, tự chia 2 cột ----- */

  const sectionTitle = (s: string, x: number, w: number, y: number, size: number, cfg: BodyCfg, index: number): ReactNode[] => {
    const title = s.trim();
    if (!title) return [];
    if (cfg.title === "chip") {
      const f = fitCaps(title.toLocaleUpperCase("vi"), size * 0.62, w - size * 1.6, 0.18, true);
      const h = f.size * 2.1;
      return [
        <rect key={k()} x={x} y={y - h * 0.72} width={f.width + f.size * 2.2} height={h} rx={h / 2} fill={primary} />,
        <T key={k()} s={title.toLocaleUpperCase("vi")} x={x + f.size * 1.1} y={y - h * 0.72 + h * 0.66} family={TAGLINE_FONT.family} weight={700} f={f} fill={bg} spacing={f.size * 0.18} />,
      ];
    }
    if (cfg.title === "ruled") {
      const str = title.toLocaleUpperCase("vi");
      const f = fitCaps(str, size * 0.62, w * 0.9, 0.3);
      return [
        <path key={k()} d={`M${x} ${y - f.size * 1.45} H${x + w} M${x} ${y + f.size * 0.85} H${x + w}`} stroke={text} strokeOpacity={0.7} strokeWidth={u * 0.14} />,
        <T key={k()} s={str} x={x + w / 2} y={y} family={TAGLINE_FONT.family} weight={TAGLINE_FONT.weight} f={f} fill={primary} anchor="middle" spacing={f.size * 0.3} />,
      ];
    }
    if (cfg.title === "number") {
      const num = String(index + 1).padStart(2, "0");
      const nf = fitHead(num, size * 0.9, w, false).f;
      const tf = fitCaps(title.toLocaleUpperCase("vi"), size * 0.62, w - nf.width - u * 3, 0.22, true);
      return [
        <T key={k()} s={num} x={x} y={y} family={head.family} weight={head.weight} f={nf} fill={accent} />,
        <T key={k()} s={title.toLocaleUpperCase("vi")} x={x + nf.width + u * 2} y={y - (nf.size - tf.size) * 0.18} family={TAGLINE_FONT.family} weight={700} f={tf} fill={primary} spacing={tf.size * 0.22} />,
      ];
    }
    const useCaps = cfg.titleFont === "caps";
    const str = useCaps ? title.toLocaleUpperCase("vi") : title;
    const f = useCaps ? fitCaps(str, size * 0.62, w * 0.8, 0.22, true) : fitHead(str, size, w * 0.8, false).f;
    const family = useCaps ? TAGLINE_FONT.family : head.family;
    const weight = useCaps ? 700 : head.weight;
    const spacing = useCaps ? f.size * 0.22 : 0;
    if (cfg.title === "left") {
      return [
        <T key={k()} s={str} x={x} y={y} family={family} weight={weight} f={f} fill={primary} spacing={spacing} />,
        <path key={k()} d={`M${x} ${y + f.size * 0.38} H${x + Math.min(f.width, u * 10)}`} stroke={accent} strokeWidth={u * 0.35} strokeLinecap="round" />,
      ];
    }
    const cx = x + w / 2;
    const half = f.width / 2;
    const ly = y - f.size * 0.3;
    const room = w / 2 - half - u * 2;
    return [
      <T key={k()} s={str} x={cx} y={y} family={family} weight={weight} f={f} fill={primary} anchor="middle" spacing={spacing} />,
      room > u * 3 && (
        <path
          key={k()}
          d={`M${cx - half - u * 2 - Math.min(room, u * 12)} ${ly} H${cx - half - u * 2} M${cx + half + u * 2} ${ly} H${cx + half + u * 2 + Math.min(room, u * 12)}`}
          stroke={accent}
          strokeWidth={u * 0.22}
          strokeLinecap="round"
        />
      ),
    ];
  };

  const row = (it: PriceItem, x: number, w: number, top: number, rh: number, size: number, style: BodyCfg["row"]): ReactNode[] => {
    const base = top + rh * 0.64;
    const price = it.price.trim();
    const caps = style === "caps";
    const name = caps ? it.name.trim().toLocaleUpperCase("vi") : it.name.trim();
    if (style === "split") {
      const mid = x + w / 2;
      const gap = size * 0.9;
      const nf = fitRow(name, size, w / 2 - gap, false, 1, false);
      const pf = fitRow(price, size, w / 2 - gap, true, 1, false);
      return [
        <T key={k()} s={name} x={mid - gap} y={base} family={body.family} weight={body.weight} f={nf} fill={text} anchor="end" />,
        <T key={k()} s={price} x={mid + gap} y={base} family={body.family} weight={body.bold} f={pf} fill={primary} />,
      ];
    }
    const pf = fitRow(price, size, w * 0.34, !caps, 1, caps);
    const nf = fitRow(name, size, Math.max(u * 5, w - pf.width - size * 1.4), false, 1, caps);
    const sp = caps ? size * 0.06 : 0;
    const els: ReactNode[] = [
      <T key={k()} s={name} x={x} y={base} family={body.family} weight={body.weight} f={nf} fill={text} spacing={sp} />,
      <T key={k()} s={price} x={x + w} y={base} family={body.family} weight={caps ? body.weight : body.bold} f={pf} fill={caps ? text : primary} anchor="end" spacing={sp} />,
    ];
    if (caps) return els;
    if (style === "leader") {
      const x1 = x + nf.width + size * 0.55;
      const x2 = x + w - pf.width - size * 0.55;
      if (x2 - x1 > size * 0.8)
        els.push(
          <path key={k()} d={`M${x1} ${base - size * 0.16} H${x2}`} stroke={accent} strokeWidth={size * 0.13} strokeLinecap="round" strokeDasharray={`0 ${size * 0.36}`} />,
        );
    } else {
      els.push(<path key={k()} d={`M${x} ${top + rh * 0.95} H${x + w}`} stroke={accent} strokeOpacity={0.55} strokeWidth={u * 0.12} />);
    }
    return els;
  };

  const services = (box: Box, cfg: BodyCfg): ReactNode[] => {
    const secs = design.sections.filter((s) => s.title.trim() || s.items.some((i) => i.name.trim() || i.price.trim()));
    if (!secs.length || box.h <= 0) return [];
    const TITLE = cfg.card ? 2 : cfg.title === "ruled" ? 2.5 : 1.8;
    const PAD = cfg.card ? 0.55 : 0;
    const GAP = 0.8;
    const unitsOf = (s: PriceSection) => TITLE + s.items.length + PAD * 2;
    const split = (c: number) => {
      const total = secs.reduce((a, s) => a + unitsOf(s), 0);
      const cols: PriceSection[][] = Array.from({ length: c }, () => []);
      let ci = 0;
      let acc = 0;
      for (const s of secs) {
        const n = unitsOf(s);
        if (ci < c - 1 && acc > 0 && acc + n / 2 > total / c) {
          ci++;
          acc = 0;
        }
        cols[ci].push(s);
        acc += n;
      }
      return cols.filter((col) => col.length);
    };
    const need = (cols: PriceSection[][]) =>
      Math.max(...cols.map((col) => col.reduce((a, s) => a + unitsOf(s), 0) + GAP * (col.length - 1)));

    let cols = split(1);
    let rh = box.h / need(cols);
    const threshold = cfg.cols === "prefer1" ? u * 2.8 : u * 4.6;
    const wantTwo = cfg.cols === 2 || (cfg.cols !== 1 && rh < threshold && box.w > u * 55 && secs.length > 1);
    if (wantTwo) {
      cols = split(2);
      rh = box.h / need(cols);
    }
    // Dòng thưa ra cho kín trang, nhưng cỡ chữ vẫn giới hạn (itemSize/titleSize) để không quá to.
    rh = Math.min(rh, u * 6);

    const colGap = u * 5;
    const cw = (box.w - colGap * (cols.length - 1)) / cols.length;
    const inset = cfg.card ? u * 3 : 0;
    // Mọi dòng dùng chung một cỡ chữ: lấy cỡ nhỏ nhất mà dòng dài nhất cần để vừa cột (tránh chữ to nhỏ lộn xộn).
    // Kiểu chia đôi không có hàng chấm, dòng được sát hơn nên chữ to hơn một chút.
    let itemSize = Math.min(rh * (cfg.row === "split" ? 0.58 : 0.5), u * 3.1);
    const rowW = cw - inset * 2;
    const base = itemSize;
    for (const s of secs)
      for (const it of s.items) {
        const caps = cfg.row === "caps";
        const name = caps ? it.name.trim().toLocaleUpperCase("vi") : it.name.trim();
        if (cfg.row === "split") {
          const half = rowW / 2 - base * 0.9;
          itemSize = Math.min(itemSize, fitRow(name, base, half, false, 0.62, false).size, fitRow(it.price.trim(), base, half, true, 0.62, false).size);
          continue;
        }
        const pf = fitRow(it.price.trim(), base, rowW * 0.34, !caps, 0.62, caps);
        const nf = fitRow(name, base, Math.max(u * 5, rowW - pf.width - base * 1.4), false, 0.62, caps);
        itemSize = Math.min(itemSize, nf.size, pf.size);
      }
    // Tiêu đề nhóm cũng dùng chung một cỡ, theo tiêu đề dài nhất.
    let titleSize = Math.min(rh * 0.7, u * 4.2);
    const tBase = titleSize;
    for (const s of secs) {
      const title = s.title.trim();
      if (!title) continue;
      const upper = title.toLocaleUpperCase("vi");
      const room = cfg.title === "chip" || cfg.title === "number" ? rowW * 0.9 : rowW * 0.8;
      const ratio =
        cfg.titleFont === "caps" || cfg.title === "chip" || cfg.title === "number" || cfg.title === "ruled"
          ? fitCaps(upper, tBase * 0.62, room, 0.22, true).size / (tBase * 0.62)
          : fitHead(title, tBase, room, false).f.size / tBase;
      titleSize = Math.min(titleSize, tBase * ratio);
    }
    const y0 = box.y + Math.max(0, (box.h - need(cols) * rh) / 2);
    const els: ReactNode[] = [];
    let index = 0;
    cols.forEach((col, ci) => {
      const cx = box.x + ci * (cw + colGap);
      let y = y0;
      col.forEach((s) => {
        const blockH = unitsOf(s) * rh;
        if (cfg.card) els.push(<rect key={k()} x={cx} y={y} width={cw} height={blockH} rx={u * 2.4} fill={surface} stroke={accent} strokeOpacity={0.6} strokeWidth={u * 0.15} />);
        els.push(...sectionTitle(s.title, cx + inset, cw - inset * 2, y + PAD * rh + rh * (cfg.title === "ruled" ? 1.5 : 1.2), titleSize, cfg, index++));
        let ry = y + PAD * rh + TITLE * rh;
        const firstRow = ry;
        for (const it of s.items) {
          if (it.name.trim() || it.price.trim()) els.push(...row(it, cx + inset, cw - inset * 2, ry, rh, itemSize, cfg.row));
          ry += rh;
        }
        // Kiểu chia đôi: đường kẻ dọc giữa tên và giá.
        if (cfg.row === "split" && s.items.length) {
          const mx = cx + inset + (cw - inset * 2) / 2;
          els.push(<path key={k()} d={`M${mx} ${firstRow + rh * 0.12} V${ry - rh * 0.12}`} stroke={primary} strokeWidth={u * 0.18} />);
        }
        y += blockH + GAP * rh;
      });
    });
    return els;
  };

  /* ----- 8 kiểu bố cục ----- */

  const layers: ReactNode[] = [];
  switch (design.style) {
    case "classic": {
      layers.push(decor(C, u * 10, u * 8));
      layers.push(salonName(C, u * 24, u * 8.6, W - m * 2, primary));
      const hd = caps(design.heading, C, u * 30, u * 2.4, W - m * 2 - u * 16, text, "middle", { lines: accent });
      layers.push(...hd.els);
      const ct = contact(H - u * 6, C, W - m * 2, text);
      layers.push(<path key={k()} d={`M${C - u * 12} ${ct.top - u * 1.5} H${C + u * 12}`} stroke={accent} strokeWidth={u * 0.25} strokeLinecap="round" />, ...ct.els);
      layers.push(...services({ x: m, y: u * 36, w: W - m * 2, h: ct.top - u * 5 - u * 36 }, { cols: "auto", title: "lines", titleFont: "head", row: "leader" }));
      break;
    }
    case "banner": {
      const band = Math.min(H * 0.22, u * 28);
      const foot = u * 10;
      layers.push(<rect key={k()} width={W} height={band} fill={primary} />);
      layers.push(decor(W - m * 0.9, band * 0.3, u * 7, bg, accent));
      layers.push(decor(m * 0.9, band * 0.7, u * 5, bg, accent));
      layers.push(salonName(C, band * 0.55, u * 9, W - m * 2 - u * 8, bg));
      layers.push(...caps(design.heading, C, band * 0.55 + u * 6, u * 2.3, W - m * 2, bg, "middle", { ratio: 0.32 }).els);
      layers.push(<rect key={k()} y={H - foot} width={W} height={foot} fill={primary} />);
      const line = [design.phone.trim() && `Hotline ${design.phone.trim()}`, design.address.trim(), design.hours.trim()].filter(Boolean).join("   ·   ");
      if (line) {
        const f = fitBody(line, u * 2.2, W - m * 1.5);
        layers.push(<T key={k()} s={line} x={C} y={H - foot / 2 + f.size * 0.35} family={body.family} weight={body.weight} f={f} fill={bg} anchor="middle" />);
      }
      layers.push(...services({ x: m, y: band + u * 6, w: W - m * 2, h: H - foot - u * 5 - band - u * 6 }, { cols: "auto", title: "chip", titleFont: "caps", row: "leader" }));
      break;
    }
    case "cards": {
      layers.push(decor(C, u * 9, u * 7.5));
      layers.push(salonName(C, u * 21, u * 8, W - m * 2, primary));
      const hf = fitCaps(design.heading.toLocaleUpperCase("vi"), u * 2.1, W - m * 3, 0.3);
      if (design.heading.trim()) {
        const pw = hf.width + u * 6;
        layers.push(<rect key={k()} x={C - pw / 2} y={u * 24.6} width={pw} height={u * 4.6} rx={u * 2.3} fill="none" stroke={primary} strokeWidth={u * 0.2} />);
        layers.push(...caps(design.heading, C, u * 27.7, u * 2.1, W - m * 3, primary).els);
      }
      const ct = contact(H - u * 5.5, C, W - m * 2, text);
      layers.push(...ct.els);
      layers.push(...services({ x: m * 0.75, y: u * 33, w: W - m * 1.5, h: ct.top - u * 3.5 - u * 33 }, { cols: "auto", title: "left", titleFont: "head", row: "line", card: true }));
      break;
    }
    case "sidebar": {
      const bw = W * 0.3;
      const cx = bw / 2;
      const cy = H * 0.56;
      layers.push(<rect key={k()} width={bw} height={H} fill={primary} />);
      layers.push(decor(cx, u * 12, u * 12, bg, accent));
      const { f } = fitHead(salon, bw * 0.4, H * 0.62);
      const baseY = cy + f.size * 0.36 - u * 2.6;
      layers.push(
        <g key={k()} transform={`rotate(-90 ${cx} ${cy})`}>
          <T s={salon} x={cx} y={baseY} family={head.family} weight={head.weight} f={f} fill={bg} anchor="middle" spacing={headUpper ? f.size * 0.08 : 0} />
          {caps(design.heading, cx, baseY + u * 5.5, u * 2.2, H * 0.55, bg, "middle", { ratio: 0.35 }).els}
        </g>,
      );
      const x0 = bw + u * 6;
      const w = W - x0 - u * 6;
      const ct = contact(H - u * 6, x0, w, text, "start");
      layers.push(<path key={k()} d={`M${x0} ${ct.top - u * 1.5} H${x0 + u * 14}`} stroke={accent} strokeWidth={u * 0.3} strokeLinecap="round" />, ...ct.els);
      layers.push(...services({ x: x0, y: u * 8, w, h: ct.top - u * 5 - u * 8 }, { cols: "auto", title: "left", titleFont: "head", row: "leader" }));
      break;
    }
    case "minimal": {
      layers.push(...caps(design.salon, m, u * 10, u * 2.4, W - m * 2 - u * 10, primary, "start", { bold: true, ratio: 0.3 }).els);
      layers.push(decor(W - m - u * 3, u * 8.5, u * 6));
      const hf = fitHead(design.heading.trim() || " ", u * 9.5, W - m * 2, false).f;
      layers.push(<T key={k()} s={design.heading.trim()} x={m} y={u * 22} family={head.family} weight={head.weight} f={hf} fill={primary} />);
      layers.push(<path key={k()} d={`M${m} ${u * 26.5} H${W - m}`} stroke={primary} strokeWidth={u * 0.18} />);
      const ct = contact(H - u * 6, m, W - m * 2, text, "start");
      layers.push(<path key={k()} d={`M${m} ${ct.top - u * 1.8} H${W - m}`} stroke={accent} strokeWidth={u * 0.15} />, ...ct.els);
      layers.push(...services({ x: m, y: u * 31, w: W - m * 2, h: ct.top - u * 5 - u * 31 }, { cols: "auto", title: "number", titleFont: "caps", row: "line" }));
      break;
    }
    case "arch": {
      const x1 = m * 0.9;
      const x2 = W - m * 0.9;
      const top = u * 5;
      const bottom = u * 34;
      const rx = (x2 - x1) / 2;
      const ry = Math.min(rx, u * 14);
      layers.push(
        <path key={k()} d={`M${x1} ${bottom} V${top + ry} A${rx} ${ry} 0 0 1 ${x2} ${top + ry} V${bottom} Z`} fill={accent} fillOpacity={0.16} stroke={primary} strokeWidth={u * 0.25} strokeLinejoin="round" />,
        <path key={k()} d={`M${x1 + u * 1.6} ${bottom} V${top + ry} A${rx - u * 1.6} ${ry - u * 1.6} 0 0 1 ${x2 - u * 1.6} ${top + ry} V${bottom}`} fill="none" stroke={accent} strokeWidth={u * 0.15} />,
      );
      layers.push(decor(C, top + u * 8.5, u * 7));
      layers.push(salonName(C, top + u * 21, u * 8.4, (x2 - x1) * 0.86, primary));
      layers.push(...caps(design.heading, C, top + u * 26.5, u * 2.3, (x2 - x1) * 0.8, text).els);
      const ct = contact(H - u * 6, C, W - m * 2, text);
      layers.push(...ct.els);
      layers.push(...services({ x: m, y: bottom + u * 5, w: W - m * 2, h: ct.top - u * 4 - bottom - u * 5 }, { cols: "auto", title: "lines", titleFont: "head", row: "leader" }));
      break;
    }
    case "frame": {
      const o = u * 3;
      const i = u * 4.4;
      layers.push(
        <rect key={k()} x={o} y={o} width={W - o * 2} height={H - o * 2} fill="none" stroke={primary} strokeWidth={u * 0.35} />,
        <rect key={k()} x={i} y={i} width={W - i * 2} height={H - i * 2} fill="none" stroke={accent} strokeWidth={u * 0.15} />,
      );
      for (const [cx, cy] of [
        [i, i],
        [W - i, i],
        [i, H - i],
        [W - i, H - i],
      ])
        layers.push(<circle key={k()} cx={cx} cy={cy} r={u * 3.2} fill={bg} />, decor(cx, cy, u * 5));
      layers.push(decor(C, u * 13, u * 7));
      layers.push(salonName(C, u * 26, u * 8.2, W - m * 2.4, primary));
      layers.push(...caps(design.heading, C, u * 31.5, u * 2.3, W - m * 2.4 - u * 16, text, "middle", { lines: accent }).els);
      const ct = contact(H - u * 9, C, W - m * 2.4, text);
      layers.push(...ct.els);
      layers.push(...services({ x: m * 1.2, y: u * 37, w: W - m * 2.4, h: ct.top - u * 4 - u * 37 }, { cols: "auto", title: "lines", titleFont: "head", row: "leader" }));
      break;
    }
    case "marble": {
      const dark = isDark(bg);
      layers.push(<Veins key={k()} W={W} H={H} dark={dark} gold={primary} seed={hash(design.templateId)} id={uid} />);
      const px = u * 7;
      const py = u * 10;
      const pw = W - u * 14;
      const ph = H - u * 17;
      let top = u * 4;
      if (!dark) {
        // Ô trắng viền vàng + vòng chữ lồng ở đỉnh, như thiệp đá cẩm thạch.
        layers.push(
          <rect key={k()} x={px} y={py} width={pw} height={ph} fill={surface} stroke={primary} strokeWidth={u * 0.4} />,
          <rect key={k()} x={px + u * 1.3} y={py + u * 1.3} width={pw - u * 2.6} height={ph - u * 2.6} fill="none" stroke={primary} strokeOpacity={0.5} strokeWidth={u * 0.12} />,
          <circle key={k()} cx={C} cy={py} r={u * 5.5} fill={accent} stroke={primary} strokeWidth={u * 0.3} />,
          <T key={k()} s={(design.salon.trim()[0] ?? "N").toLocaleUpperCase("vi")} x={C} y={py + u * 2.1} family="Cormorant Garamond" weight={600} f={{ size: u * 6, width: 0 }} fill={primary} anchor="middle" />,
        );
        top = py + u * 2;
      }
      const inner = dark ? W - m * 2 : pw - u * 12;
      const hf = fitHead(design.heading.trim() || " ", u * 11, inner, false).f;
      layers.push(<T key={k()} s={design.heading.trim()} x={C} y={top + u * 17} family={head.family} weight={head.weight} f={hf} fill={primary} anchor="middle" />);
      layers.push(...caps(design.salon, C, top + u * 24, u * 2.6, inner, text, "middle", { ratio: 0.3 }).els);
      const ct = contact(dark ? H - u * 6 : py + ph - u * 5, C, inner, text);
      layers.push(...ct.els);
      const bx = dark ? m : px + u * 6;
      layers.push(...services({ x: bx, y: top + u * 30, w: inner, h: ct.top - u * 4 - top - u * 30 }, { cols: "prefer1", title: "lines", titleFont: "caps", row: "split" }));
      break;
    }
    case "split": {
      layers.push(
        <rect key={k()} x={u * 3.5} y={u * 3.5} width={W - u * 7} height={H - u * 7} fill="none" stroke={primary} strokeWidth={u * 0.3} />,
        <rect key={k()} x={u * 4.7} y={u * 4.7} width={W - u * 9.4} height={H - u * 9.4} fill="none" stroke={accent} strokeWidth={u * 0.12} />,
      );
      layers.push(decor(C, u * 11, u * 6));
      const hf = fitHead(design.heading.trim() || " ", u * 10, W - m * 2, false).f;
      layers.push(<T key={k()} s={design.heading.trim()} x={C} y={u * 25} family={head.family} weight={head.weight} f={hf} fill={primary} anchor="middle" />);
      layers.push(...caps(design.salon, C, u * 31.5, u * 2.5, W - m * 2, text, "middle", { ratio: 0.3 }).els);
      const ct = contact(H - u * 8, C, W - m * 2, text);
      layers.push(...ct.els);
      layers.push(...services({ x: m, y: u * 37, w: W - m * 2, h: ct.top - u * 4 - u * 37 }, { cols: "prefer1", title: "lines", titleFont: "caps", row: "split" }));
      break;
    }
    case "editorial": {
      // Kiểu tạp chí "Nail & Co": tên tiệm chữ có chân in hoa lớn, tiêu đề nhóm giữa hai đường kẻ.
      const sName = design.salon.trim().toLocaleUpperCase("vi") || " ";
      const { f } = fitHead(sName, u * 9.5, W - m * 2, true);
      layers.push(decor(C, u * 7, u * 4));
      layers.push(<T key={k()} s={sName} x={C} y={u * 19} family={head.family} weight={head.weight} f={f} fill={primary} anchor="middle" spacing={f.size * 0.08} />);
      layers.push(...caps(design.heading, C, u * 27, u * 3, W - m * 2, text, "middle", { ratio: 0.45 }).els);
      const ct = contact(H - u * 6, C, W - m * 2, text);
      layers.push(...ct.els);
      layers.push(...services({ x: m, y: u * 33, w: W - m * 2, h: ct.top - u * 4 - u * 33 }, { cols: W / H < 0.5 ? "auto" : 2, title: "ruled", titleFont: "caps", row: "caps" }));
      break;
    }
    case "botanical": {
      const big = W * 0.3;
      layers.push(
        <g key={k()} opacity={0.22} transform={`rotate(-18 ${u * 9} ${u * 9})`}>
          {decor(u * 9, u * 9, big)}
        </g>,
        <g key={k()} opacity={0.22} transform={`rotate(162 ${W - u * 9} ${H - u * 9})`}>
          {decor(W - u * 9, H - u * 9, big)}
        </g>,
        <g key={k()} opacity={0.3} transform={`rotate(20 ${W - u * 13} ${u * 12})`}>
          {decor(W - u * 13, u * 12, W * 0.11)}
        </g>,
      );
      layers.push(salonName(C, u * 22, u * 10, W - m * 2.2, primary));
      layers.push(...caps(design.heading, C, u * 28.5, u * 2.3, W - m * 2 - u * 16, text, "middle", { lines: accent }).els);
      const ct = contact(H - u * 6, C, W - m * 2, text);
      layers.push(...ct.els);
      layers.push(...services({ x: m, y: u * 35, w: W - m * 2, h: ct.top - u * 5 - u * 35 }, { cols: "auto", title: "lines", titleFont: "head", row: "leader" }));
      break;
    }
  }

  return (
    <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg" className={className} role="img" aria-label={`${design.heading} – ${design.salon}`}>
      <rect width={W} height={H} fill={bg} />
      {layers}
    </svg>
  );
}
