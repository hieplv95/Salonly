import { useId, type ReactNode, type Ref } from "react";
import { VOUCHER_SIZE, type VoucherDesign } from "@/lib/voucher-templates";
import { F, HEART, mix, star, useSvgText, type Font } from "../design/svg-kit";

const { w: W, h: H } = VOUCHER_SIZE;
const C = W / 2;
const polar = (x: number, y: number, r: number, a: number) => [+(x + r * Math.cos(a)).toFixed(2), +(y + r * Math.sin(a)).toFixed(2)];
// Số ngẫu nhiên cố định theo seed: hoạ tiết giống nhau mỗi lần vẽ (xem trước = file tải về).
const rng = (seed: number) => () => (seed = (seed * 9301 + 49297) % 233280) / 233280;

// Font thêm cho bộ mẫu xu hướng; đều có bộ chữ tiếng Việt và được nhúng khi tải file.
const X = {
  fraunces: { family: "Fraunces", weight: 900, width: 0.62 },
  oswald: { family: "Oswald", weight: 500, width: 0.42 },
  lobster: { family: "Lobster", weight: 400, width: 0.48 },
  dancing: { family: "Dancing Script", weight: 700, width: 0.48 },
  vn: { family: "Be Vietnam Pro", weight: 700, width: 0.64 },
} satisfies Record<string, Font>;

/* ---------- Hoạ tiết ---------- */

function Bow({ x, y, s, color, knot }: { x: number; y: number; s: number; color: string; knot: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 0 C-22 -34 -70 -46 -76 -14 C-80 8 -46 20 0 0Z" fill={color} />
      <path d="M0 0 C22 -34 70 -46 76 -14 C80 8 46 20 0 0Z" fill={color} />
      <path d="M-8 -4 C-26 -22 -54 -30 -62 -14 M8 -4 C26 -22 54 -30 62 -14" fill="none" stroke={knot} strokeOpacity={0.45} strokeWidth={2} />
      <path d="M-4 4 C-14 30 -30 52 -44 70 L-30 70 L-24 82 C-10 58 -2 30 0 8Z" fill={color} />
      <path d="M4 4 C14 30 30 52 44 70 L30 70 L24 82 C10 58 2 30 0 8Z" fill={color} />
      <ellipse cx={0} cy={0} rx={11} ry={13} fill={knot} />
    </g>
  );
}

function Cherry({ x, y, s, color, stem, leaf }: { x: number; y: number; s: number; color: string; stem: string; leaf: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-38 0 Q-30 -70 8 -108 M30 14 Q22 -60 8 -108" fill="none" stroke={stem} strokeWidth={4} strokeLinecap="round" />
      <path d="M8 -108 C30 -130 64 -126 76 -104 C52 -96 26 -96 8 -108Z" fill={leaf} />
      <circle cx={-38} cy={0} r={36} fill={color} />
      <circle cx={30} cy={14} r={36} fill={color} />
      <ellipse cx={-50} cy={-12} rx={9} ry={6} fill="#FFFFFF" fillOpacity={0.55} transform="rotate(-35 -50 -12)" />
      <ellipse cx={18} cy={2} rx={9} ry={6} fill="#FFFFFF" fillOpacity={0.55} transform="rotate(-35 18 2)" />
    </g>
  );
}

function Laurel({ x, y, r, color }: { x: number; y: number; r: number; color: string }) {
  const arc = (from: number, to: number, sweep: 0 | 1) => {
    const [x1, y1] = polar(x, y, r, from);
    const [x2, y2] = polar(x, y, r, to);
    return `M${x1} ${y1} A${r} ${r} 0 0 ${sweep} ${x2} ${y2}`;
  };
  return (
    <g>
      <path d={`${arc(Math.PI / 2 + 0.2, Math.PI / 2 + 2.55, 1)} ${arc(Math.PI / 2 - 0.2, Math.PI / 2 - 2.55, 0)}`} fill="none" stroke={color} strokeWidth={2} />
      {[-1, 1].flatMap((side) =>
        Array.from({ length: 9 }, (_, i) => {
          const a = Math.PI / 2 + side * (0.38 + i * 0.26);
          const [lx, ly] = polar(x, y, r + (i % 2 ? r * 0.08 : -r * 0.08), a);
          const rot = (a * 180) / Math.PI + (i % 2 ? -side * 30 : side * 30);
          return <ellipse key={`${side}${i}`} cx={lx} cy={ly} rx={r * 0.055} ry={r * 0.13} fill={color} transform={`rotate(${rot.toFixed(1)} ${lx} ${ly})`} />;
        }),
      )}
    </g>
  );
}

function Seal({ x, y, r, color }: { x: number; y: number; r: number; color: string }) {
  const pts = Array.from({ length: 48 }, (_, i) => {
    const a = (i / 48) * Math.PI * 2;
    return polar(x, y, r * (1 + 0.05 * Math.sin(i * 5) + 0.035 * Math.sin(i * 3 + 1)), a).join(" ");
  });
  const dark = mix(color, "#000000", 0.28);
  return (
    <g>
      <path d={`M${pts.join(" L")}Z`} fill={color} />
      <circle cx={x} cy={y} r={r * 0.74} fill="none" stroke={dark} strokeWidth={3} />
      <circle cx={x} cy={y} r={r * 0.66} fill="none" stroke={mix(color, "#FFFFFF", 0.25)} strokeOpacity={0.5} strokeWidth={1.5} />
      <ellipse cx={x - r * 0.35} cy={y - r * 0.42} rx={r * 0.22} ry={r * 0.09} fill="#FFFFFF" fillOpacity={0.22} transform={`rotate(-35 ${x - r * 0.35} ${y - r * 0.42})`} />
    </g>
  );
}

// Móng hình hạnh nhân (almond), tâm (x, y).
const almond = (x: number, y: number, w: number, h: number) =>
  `M${x} ${y - h / 2} C${x + w * 0.55} ${y - h * 0.3} ${x + w / 2} ${y + h * 0.22} ${x + w / 2} ${y + h * 0.32} Q${x + w / 2} ${y + h / 2} ${x} ${y + h / 2} Q${x - w / 2} ${y + h / 2} ${x - w / 2} ${y + h * 0.32} C${x - w / 2} ${y + h * 0.22} ${x - w * 0.55} ${y - h * 0.3} ${x} ${y - h / 2}Z`;

function Rosettes({ seed, x0, y0, x1, y1, ink, spot }: { seed: number; x0: number; y0: number; x1: number; y1: number; ink: string; spot: string }) {
  const r = rng(seed);
  const out: ReactNode[] = [];
  let n = 0;
  for (let y = y0; y < y1 + 60; y += 86)
    for (let x = x0 + ((y / 86) % 2) * 45; x < x1 + 60; x += 96) {
      const cx = x + (r() - 0.5) * 46, cy = y + (r() - 0.5) * 40, rad = 20 + r() * 13, rot = r() * 360;
      const c = 2 * Math.PI * rad;
      out.push(
        <g key={n++} transform={`rotate(${rot.toFixed(0)} ${cx.toFixed(1)} ${cy.toFixed(1)})`}>
          <ellipse cx={cx} cy={cy} rx={rad * 0.66} ry={rad * 0.5} fill={spot} fillOpacity={0.55} />
          <circle cx={cx} cy={cy} r={rad} fill="none" stroke={ink} strokeWidth={rad * 0.36} strokeLinecap="round" strokeDasharray={`${(c * 0.2).toFixed(1)} ${(c * 0.08).toFixed(1)} ${(c * 0.27).toFixed(1)} ${(c * 0.1).toFixed(1)} ${(c * 0.17).toFixed(1)} ${(c * 0.18).toFixed(1)}`} />
        </g>,
        <circle key={n++} cx={cx + 48} cy={cy + 38} r={3 + r() * 4} fill={ink} />,
      );
    }
  return <g>{out}</g>;
}

function Tortoise({ seed, x0, y0, x1, y1, base, dark, mid }: { seed: number; x0: number; y0: number; x1: number; y1: number; base: string; dark: string; mid: string }) {
  const r = rng(seed);
  const blobs: ReactNode[] = [];
  const area = (x1 - x0) * (y1 - y0);
  for (let i = 0; i < area / 2600; i++) {
    const cx = x0 + r() * (x1 - x0), cy = y0 + r() * (y1 - y0), rx = 18 + r() * 46, ry = 12 + r() * 30, rot = r() * 180;
    const tone = r();
    blobs.push(<ellipse key={i} cx={cx} cy={cy} rx={rx} ry={ry} fill={tone < 0.45 ? dark : mid} fillOpacity={tone < 0.45 ? 0.85 : 0.5} transform={`rotate(${rot.toFixed(0)} ${cx.toFixed(1)} ${cy.toFixed(1)})`} />);
  }
  return <g><rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill={base} />{blobs}</g>;
}

function Barcode({ x, y, w, h, color, seed }: { x: number; y: number; w: number; h: number; color: string; seed: number }) {
  const r = rng(seed);
  const bars: ReactNode[] = [];
  for (let cx = x, i = 0; cx < x + w - 6; i++) {
    const bw = 2 + Math.floor(r() * 4);
    bars.push(<rect key={i} x={cx} y={y} width={bw} height={h} fill={color} />);
    cx += bw + 2 + Math.floor(r() * 4);
  }
  return <g>{bars}</g>;
}

const PLANE = "M-20 -3 L-6 -3 L-14 -18 L-8 -18 L6 -3 L18 -3 C22 -3 22 3 18 3 L6 3 L-8 18 L-14 18 L-6 3 L-20 3 L-24 9 L-28 9 L-25 0 L-28 -9 L-24 -9 Z";

// Giấy in hoá đơn: mép trái/phải răng cưa.
function zigPaper(x1: number, y1: number, x2: number, y2: number, n = 30) {
  const t = (y2 - y1) / n;
  let d = `M${x1} ${y1} H${x2}`;
  for (let k = 1; k <= n; k++) d += ` L${x2 + (k % 2) * 14} ${(y1 + k * t).toFixed(1)}`;
  d += ` H${x1}`;
  for (let k = n - 1; k >= 0; k--) d += ` L${x1 - (k % 2) * 14} ${(y1 + k * t).toFixed(1)}`;
  return d + "Z";
}

// Hai mươi mẫu theo xu hướng thiết kế 2025–2026 (chrome Y2K, Mocha Mousse, vàng bơ, aura,
// neo-brutalism, coquette, glassmorphism, groovy 70s, cherry, old money, da báo, đồi mồi,
// chấm bi, vé máy bay, hoá đơn, sáp niêm phong, gingham, tạp chí Swiss, móng mắt mèo, glazed).
// Chữ dùng chung các trường của voucher nên sửa nội dung và xuất file như các mẫu khác.
export function VoucherTrendSvg({ design, side, svgRef, className }: { design: VoucherDesign; side: "front" | "back"; svgRef?: Ref<SVGSVGElement>; className?: string }) {
  const uid = useId().replace(/:/g, "");
  const { bg, ink, accent } = design.colors;
  const pale = mix(bg, "#FFFFFF", 0.7);
  const faint = mix(bg, accent, 0.18);
  const deep = mix(ink, accent, 0.35);
  const { T, key } = useSvgText(ink);
  const L: ReactNode[] = [];
  const id = (s: string) => `${uid}-${s}`;
  const url = (s: string) => `url(#${id(s)})`;
  const initial = (design.salon.trim()[0] ?? "L").toLocaleUpperCase("vi");
  const contact = [design.phone, design.website].filter(Boolean).join("  ·  ");
  const meta = [design.code && `Mã ${design.code}`, design.expiry && `Hạn ${design.expiry}`].filter(Boolean).join("  ·  ");
  const label = (text: string, x: number, y: number, max = 850, color = accent) => T(text, x, y, F.sans, 15, max, { upper: true, spacing: 0.28, fill: color });
  const title = (x: number, y: number, size: number, max: number, font: Font = F.serif2, color = ink) => T(design.title, x, y, font, size, max, { fill: color });
  const value = (x: number, y: number, size: number, max: number, color = accent, font: Font = F.serif) => T(design.value, x, y, font, size, max, { fill: color });
  const salon = (x: number, y: number, max: number, color = ink) => T(design.salon, x, y, F.sans, 19, max, { upper: true, spacing: 0.31, fill: color });
  const service = (x: number, y: number, max: number, color = ink) => T(design.service, x, y, F.sans, 18, max, { fill: color });
  const line = (x1: number, y1: number, x2: number, y2: number, color = accent, opacity = 0.55, width = 1.5) => <path key={key()} d={`M${x1} ${y1} L${x2} ${y2}`} fill="none" stroke={color} strokeOpacity={opacity} strokeWidth={width} />;
  const fields = (x: number, y: number, w: number, gap = 58, color = ink) => ["Người nhận", "Người tặng"].flatMap((s, i) => [
    T(s, x, y + i * gap, F.sans, 14, 160, { anchor: "start", upper: true, spacing: 0.1, fill: color }),
    line(x + 142, y + i * gap + 2, x + w, y + i * gap + 2, color, 0.45),
  ]);
  const fieldsRow = (x: number, y: number, w: number, color = ink) => [
    ...fields(x, y, w * 0.46, 0, color).slice(0, 2),
    T("Người tặng", x + w * 0.54, y, F.sans, 14, 170, { anchor: "start", upper: true, spacing: 0.1, fill: color }),
    line(x + w * 0.54 + 142, y + 2, x + w, y + 2, color, 0.45),
  ];
  const footer = (x = C, y = 545, max = 1000, color = ink) => T([contact, meta].filter(Boolean).join("   •   "), x, y, F.sans, 13, max, { fill: color, opacity: 0.8 });
  const backCopy = (x: number, y: number, w: number, anchor: "start" | "middle" = "middle", color = ink, size = 22) => [
    T(design.backLine1, x, y, F.sans, size, w, { anchor, fill: color }),
    T(design.backLine2, x, y + 40, F.sans, size, w, { anchor, fill: color }),
  ];
  const heading = (x: number, y: number, size: number, max: number, font: Font = F.serif2, color = ink) => T(design.backHeading, x, y, font, size, max, { fill: color });

  if (side === "front") switch (design.style) {
    case "chrome-y2k": {
      L.push(<defs key={key()}>
          <linearGradient id={id("ch")} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFFFF" /><stop offset=".38" stopColor="#A9AFBA" /><stop offset=".52" stopColor="#F7F8FA" /><stop offset=".66" stopColor="#686E7A" /><stop offset="1" stopColor="#E4E7ED" /></linearGradient>
          <linearGradient id={id("chh")} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFFFFF" /><stop offset=".3" stopColor="#8B919C" /><stop offset=".55" stopColor="#F4F6F9" /><stop offset=".8" stopColor="#5F6571" /><stop offset="1" stopColor="#DADDE3" /></linearGradient>
        </defs>,
        <ellipse key={key()} cx={935} cy={292} rx={252} ry={206} fill="none" stroke={url("chh")} strokeWidth={14} />,
        <ellipse key={key()} cx={935} cy={292} rx={222} ry={178} fill="none" stroke={accent} strokeOpacity={0.35} strokeWidth={1.5} />,
        ...[[1152, 92, 46], [742, 470, 30], [1128, 486, 22], [86, 66, 18], [640, 60, 14]].map(([x, y, r]) => <path key={key()} d={star(x, y, r)} fill={url("ch")} />));
      L.push(label("Gift card", 935, 205, 300), value(935, 322, 86, 380, url("ch"), X.fraunces),
        T(design.terms, 935, 390, F.sans, 12, 330, { fill: accent, opacity: 0.85 }),
        salon(330, 92, 520, accent), title(330, 205, 84, 560, X.fraunces, url("ch")), service(330, 255, 540),
        ...fields(70, 360, 520, 62), footer(330, 530, 560, accent));
      break;
    }
    case "mocha-mousse": {
      const dark = mix(bg, "#000000", 0.42);
      L.push(<path key={key()} d="M790 70 C900 20 1080 40 1160 140 C1230 230 1200 380 1120 460 C1030 545 860 560 770 480 C690 410 700 300 720 220 C735 160 740 95 790 70Z" fill={accent} />,
        <path key={key()} d="M1160 40 C1200 20 1230 60 1210 90 C1190 118 1140 100 1150 70Z" fill={accent} fillOpacity={0.3} />);
      L.push(label("Trị giá", 955, 215, 300, dark), value(955, 318, 76, 360, dark), service(955, 368, 330, dark),
        T(design.terms, 955, 415, F.sans, 12, 330, { fill: dark, opacity: 0.8 }),
        salon(360, 100, 560, accent), title(360, 215, 100, 600, F.script), line(140, 262, 580, 262, accent, 0.5),
        ...fields(110, 350, 520, 64), footer(360, 530, 600, accent));
      break;
    }
    case "butter-scallop": {
      L.push(<rect key={key()} width={W} height={H} fill={accent} />,
        <rect key={key()} x={40} y={40} width={1160} height={505} fill={bg} />,
        ...Array.from({ length: 30 }, (_, i) => <circle key={key()} cx={40 + (i * 1160) / 29} cy={40} r={14} fill={bg} />),
        ...Array.from({ length: 30 }, (_, i) => <circle key={key()} cx={40 + (i * 1160) / 29} cy={545} r={14} fill={bg} />),
        ...Array.from({ length: 12 }, (_, i) => <circle key={key()} cx={40} cy={40 + ((i + 1) * 505) / 13} r={14} fill={bg} />),
        ...Array.from({ length: 12 }, (_, i) => <circle key={key()} cx={1200} cy={40 + ((i + 1) * 505) / 13} r={14} fill={bg} />),
        <rect key={key()} x={74} y={74} width={1092} height={437} rx={18} fill="none" stroke={accent} strokeWidth={3} strokeDasharray="1 9" strokeLinecap="round" />,
        ...Array.from({ length: 22 }, (_, i) => { const [x, y] = polar(960, 292, 138, (i / 22) * Math.PI * 2); return <circle key={key()} cx={x} cy={y} r={20} fill={accent} />; }),
        <circle key={key()} cx={960} cy={292} r={140} fill={accent} />,
        <circle key={key()} cx={960} cy={292} r={116} fill={pale} stroke={ink} strokeOpacity={0.3} strokeDasharray="2 6" />,
        <path key={key()} d={HEART} transform="translate(945 190) scale(.3)" fill={ink} fillOpacity={0.5} />);
      L.push(label("Trị giá", 960, 262, 180, ink), value(960, 322, 56, 200, ink), T(design.terms, 960, 470, F.sans, 12, 330, { fill: ink, opacity: 0.75 }),
        salon(460, 132, 520), title(460, 240, 98, 640, X.dancing), service(460, 292, 600),
        ...fields(170, 370, 580, 56), footer(460, 488, 640));
      break;
    }
    case "aura-glow": {
      const orbs: [string, string][] = [["a1", "#FF9EC4"], ["a2", "#FFC89A"], ["a3", "#9EC9FF"], ["a4", accent]];
      L.push(<defs key={key()}>{orbs.map(([n, c]) => <radialGradient key={n} id={id(n)}><stop offset="0" stopColor={c} stopOpacity=".85" /><stop offset=".55" stopColor={c} stopOpacity=".35" /><stop offset="1" stopColor={c} stopOpacity="0" /></radialGradient>)}</defs>,
        ...[[1010, 120, 330, "a1"], [1150, 470, 300, "a2"], [800, 480, 280, "a3"], [950, 300, 220, "a4"]].map(([x, y, r, n]) => <circle key={key()} cx={x} cy={y} r={r} fill={url(n as string)} />),
        <circle key={key()} cx={955} cy={292} r={150} fill="none" stroke="#FFFFFF" strokeOpacity={0.9} strokeWidth={1.5} />,
        <rect key={key()} x={80} y={305} width={330} height={86} rx={43} fill="#FFFFFF" fillOpacity={0.7} stroke={ink} strokeOpacity={0.12} />);
      L.push(T(design.salon, 80, 100, F.sans, 17, 520, { anchor: "start", upper: true, spacing: 0.3 }),
        T(design.title, 80, 215, F.serif, 78, 640, { anchor: "start" }), T(design.service, 80, 265, F.sans, 18, 620, { anchor: "start" }),
        value(245, 366, 52, 290, ink), ...fields(80, 450, 560, 50),
        T([contact, meta].filter(Boolean).join("   •   "), 80, 545, F.sans, 13, 700, { anchor: "start", opacity: 0.8 }),
        label("Năng lượng dịu dàng", 955, 298, 250, ink));
      break;
    }
    case "neo-brutal": {
      const box = (x: number, y: number, w: number, h: number, fill: string) => [
        <rect key={key()} x={x + 10} y={y + 10} width={w} height={h} rx={14} fill={ink} />,
        <rect key={key()} x={x} y={y} width={w} height={h} rx={14} fill={fill} stroke={ink} strokeWidth={4} />,
      ];
      L.push(...box(60, 56, 700, 252, "#FFFFFF"), ...box(800, 56, 380, 252, accent), ...box(60, 346, 700, 170, "#B8A4FF"),
        <circle key={key()} cx={1080} cy={447} r={88} fill={ink} />,
        <circle key={key()} cx={1070} cy={437} r={88} fill="#FFD43B" stroke={ink} strokeWidth={4} />,
        <path key={key()} d={star(870, 440, 34)} fill={ink} />);
      L.push(T(design.salon, 95, 112, X.vn, 18, 620, { anchor: "start", upper: true, spacing: 0.14 }),
        T(design.title, 95, 222, X.vn, 70, 630, { anchor: "start" }), T(design.service, 95, 272, F.sans, 18, 630, { anchor: "start" }),
        T("TRỊ GIÁ", 990, 128, X.vn, 20, 300, { spacing: 0.2 }), value(990, 236, 70, 330, ink, X.vn),
        ...fields(95, 418, 630, 58),
        <g key={key()} transform="rotate(-12 1070 437)">{T("GIFT!", 1070, 452, X.vn, 42, 140)}</g>,
        T([contact, meta].filter(Boolean).join("   •   "), 60, 562, F.sans, 13, 1120, { anchor: "start" }));
      break;
    }
    case "coquette-bow": {
      L.push(...Array.from({ length: 32 }, (_, i) => <circle key={key()} cx={i * 40 + 20} cy={0} r={24} fill={pale} />),
        ...Array.from({ length: 32 }, (_, i) => <circle key={key()} cx={i * 40 + 20} cy={10} r={3} fill={accent} fillOpacity={0.6} />),
        ...Array.from({ length: 32 }, (_, i) => <circle key={key()} cx={i * 40 + 20} cy={H} r={24} fill={pale} />),
        ...Array.from({ length: 32 }, (_, i) => <circle key={key()} cx={i * 40 + 20} cy={H - 10} r={3} fill={accent} fillOpacity={0.6} />),
        <circle key={key()} cx={230} cy={290} r={160} fill={faint} />,
        <Bow key={key()} x={230} y={250} s={1.9} color={accent} knot={deep} />,
        ...Array.from({ length: 15 }, (_, i) => <circle key={key()} cx={90 + i * 20} cy={462 + Math.sin((i / 14) * Math.PI) * 24} r={7} fill="#FFFFFF" stroke={accent} strokeOpacity={0.6} />),
        <Bow key={key()} x={1150} y={95} s={0.55} color={accent} knot={deep} />);
      L.push(salon(800, 110, 560, deep), title(800, 218, 100, 640, F.script), value(800, 302, 64, 480, deep), service(800, 347, 620),
        ...fieldsRow(480, 424, 640), footer(800, 515, 700));
      break;
    }
    case "glass-frost": {
      const blobs: [string, string][] = [["g1", "#FF9FCB"], ["g2", "#7FE3D4"], ["g3", accent]];
      L.push(<defs key={key()}>
          {blobs.map(([n, c]) => <radialGradient key={n} id={id(n)}><stop offset="0" stopColor={c} /><stop offset=".6" stopColor={c} stopOpacity=".8" /><stop offset="1" stopColor={c} stopOpacity="0" /></radialGradient>)}
          <linearGradient id={id("gl")} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFFFFF" stopOpacity=".75" /><stop offset=".5" stopColor="#FFFFFF" stopOpacity=".3" /><stop offset="1" stopColor="#FFFFFF" stopOpacity=".45" /></linearGradient>
        </defs>,
        ...[[230, 150, 240, "g1"], [1090, 480, 270, "g2"], [770, 80, 180, "g3"], [170, 510, 150, "g3"]].map(([x, y, r, n]) => <circle key={key()} cx={x} cy={y} r={r} fill={url(n as string)} />),
        <rect key={key()} x={90} y={60} width={1060} height={465} rx={36} fill={url("gl")} stroke="#FFFFFF" strokeOpacity={0.9} strokeWidth={2} />,
        <rect key={key()} x={820} y={140} width={280} height={250} rx={28} fill="#FFFFFF" fillOpacity={0.5} stroke="#FFFFFF" strokeWidth={2} />);
      L.push(T(design.salon, 140, 130, F.sans, 17, 600, { anchor: "start", upper: true, spacing: 0.3 }),
        T(design.title, 140, 238, X.vn, 70, 620, { anchor: "start" }), T(design.service, 140, 288, F.sans, 18, 620, { anchor: "start" }),
        ...fields(140, 380, 580, 60), label("Trị giá", 960, 225, 220, ink), value(960, 305, 56, 240, ink, X.vn),
        T([contact, meta].filter(Boolean).join("   •   "), 140, 488, F.sans, 13, 960, { anchor: "start", opacity: 0.8 }));
      break;
    }
    case "groovy-wave": {
      const band = [mix(ink, accent, 0.35), accent, "#F2A541", "#EE8C7A", bg];
      L.push(...[330, 280, 230, 180, 130].map((r, i) => <circle key={key()} cx={1060} cy={H} r={r} fill={band[i]} />),
        ...[0, 1, 2].map((i) => <path key={key()} d={`M-30 ${60 + i * 34} C120 ${10 + i * 34} 220 ${120 + i * 34} 380 ${60 + i * 34} S620 ${10 + i * 34} 760 ${56 + i * 34}`} fill="none" stroke={band[i + 1]} strokeWidth={22} strokeLinecap="round" opacity={0.9} />));
      L.push(salon(430, 205, 620, accent), title(430, 300, 90, 700, X.fraunces), service(430, 350, 680),
        ...fieldsRow(90, 430, 690), footer(430, 530, 720),
        label("Trị giá", 1060, 500, 200, ink), value(1060, 555, 46, 220, ink, X.fraunces));
      break;
    }
    case "cherry-bomb": {
      L.push(<rect key={key()} width={420} height={H} fill={accent} />,
        <Cherry key={key()} x={215} y={330} s={2.0} color={bg} stem={bg} leaf={mix(bg, "#4E8A3E", 0.6)} />,
        <Cherry key={key()} x={1150} y={120} s={0.55} color={accent} stem={ink} leaf="#4E8A3E" />,
        <path key={key()} d="M500 72 H1180 M500 492 H1180" stroke={accent} strokeOpacity={0.4} strokeWidth={2} />);
      L.push(T("Ngọt ngào", 210, 520, X.lobster, 38, 320, { fill: bg }),
        salon(830, 118, 620, accent), title(830, 222, 92, 660, X.lobster), value(830, 305, 68, 560),
        service(830, 350, 660), ...fieldsRow(500, 432, 660), footer(830, 528, 700));
      break;
    }
    case "old-money": {
      L.push(<rect key={key()} x={30} y={30} width={1180} height={525} fill="none" stroke={accent} strokeWidth={1.8} />,
        <rect key={key()} x={42} y={42} width={1156} height={501} fill="none" stroke={accent} strokeOpacity={0.6} />,
        ...[[30, 30], [1210, 30], [30, 555], [1210, 555]].map(([x, y]) => <path key={key()} d={`M${x} ${y - 9} L${x + 9} ${y} L${x} ${y + 9} L${x - 9} ${y}Z`} fill={accent} />),
        <rect key={key()} x={80} y={80} width={340} height={425} fill={faint} fillOpacity={0.55} />,
        <Laurel key={key()} x={250} y={280} r={122} color={accent} />,
        <circle key={key()} cx={250} cy={280} r={72} fill={bg} stroke={accent} strokeWidth={2} />,
        <circle key={key()} cx={250} cy={280} r={63} fill="none" stroke={accent} strokeOpacity={0.5} />,
        line(560, 250, 1040, 250));
      L.push(T(initial, 250, 308, F.serif, 80, 110), label("Est. · Quà tặng", 250, 460, 300, ink),
        salon(800, 110, 620, accent), title(800, 212, 72, 660, F.serif), service(800, 292, 640),
        value(800, 372, 56, 480, ink, F.serif2), ...fieldsRow(520, 448, 580), footer(800, 510, 660));
      break;
    }
    case "leopard-luxe": {
      const lab = mix(bg, accent, 0.35);
      L.push(<defs key={key()}><clipPath id={id("lc")}><rect width={520} height={H} /></clipPath></defs>,
        <g key={key()} clipPath={url("lc")}><Rosettes seed={11} x0={-30} y0={-20} x1={540} y1={H} ink={ink} spot={accent} /></g>,
        <rect key={key()} x={520} width={720} height={H} fill={ink} />,
        <rect key={key()} x={516} width={8} height={H} fill={accent} />,
        <rect key={key()} x={560} y={40} width={640} height={505} fill="none" stroke={bg} strokeOpacity={0.25} />);
      L.push(salon(880, 108, 580, lab), title(880, 212, 84, 620, F.serif2, bg), value(880, 300, 64, 520, bg), service(880, 345, 600, bg),
        ...fieldsRow(580, 428, 600, bg), footer(880, 515, 620, lab));
      break;
    }
    case "tortoise-shell": {
      L.push(<defs key={key()}><clipPath id={id("tc")}><rect x={880} width={360} height={H} /></clipPath></defs>,
        <g key={key()} clipPath={url("tc")}><Tortoise seed={7} x0={880} y0={0} x1={W} y1={H} base={mix(accent, "#E8B060", 0.4)} dark={mix(ink, "#000000", 0.2)} mid={mix(accent, ink, 0.5)} /></g>,
        <circle key={key()} cx={1060} cy={292} r={122} fill={bg} stroke={ink} strokeWidth={2} />,
        <circle key={key()} cx={1060} cy={292} r={110} fill="none" stroke={accent} strokeOpacity={0.5} />,
        line(100, 300, 790, 300));
      L.push(label("Trị giá", 1060, 250, 200), value(1060, 318, 50, 200, ink), T(design.code && `Mã ${design.code}`, 1060, 360, F.sans, 13, 180, { opacity: 0.7 }),
        salon(440, 100, 700, accent), title(440, 212, 86, 720, F.serif), service(440, 262, 720),
        ...fields(100, 370, 680, 62), footer(440, 520, 760));
      break;
    }
    case "polka-dot": {
      L.push(...Array.from({ length: 10 }, (_, row) => Array.from({ length: 21 }, (_, col) => <circle key={key()} cx={col * 64 + (row % 2) * 32 - 10} cy={row * 64 + 10} r={15} fill={accent} />)).flat(),
        <rect key={key()} x={190} y={70} width={860} height={445} rx={26} fill={bg} stroke={accent} strokeWidth={3} />,
        <rect key={key()} x={206} y={86} width={828} height={413} rx={18} fill="none" stroke={accent} strokeOpacity={0.45} strokeDasharray="6 7" />);
      L.push(salon(C, 142, 700, accent), title(C, 246, 90, 760, F.serif), value(C, 328, 64, 520), service(C, 370, 760),
        ...fieldsRow(270, 432, 700), footer(C, 482, 780));
      break;
    }
    case "boarding-pass": {
      L.push(<rect key={key()} width={W} height={96} fill={accent} />,
        <path key={key()} d={PLANE} transform="translate(840 48) scale(1.3)" fill={bg} />,
        <path key={key()} d="M900 110 V585" stroke={ink} strokeOpacity={0.35} strokeWidth={2} strokeDasharray="8 8" />,
        <path key={key()} d={PLANE} transform="translate(440 262) scale(.9)" fill={accent} />,
        line(60, 300, 400, 300, ink, 0.45), line(480, 300, 860, 300, ink, 0.45),
        line(60, 352, 860, 352, ink, 0.15),
        <Barcode key={key()} x={945} y={392} w={250} h={96} color={ink} seed={23} />);
      L.push(T("BOARDING PASS  ·  VÉ QUÀ TẶNG", 60, 60, X.vn, 24, 700, { anchor: "start", fill: bg, spacing: 0.12 }),
        T(design.title, 60, 178, X.vn, 54, 800, { anchor: "start" }),
        T("NGƯỜI TẶNG", 60, 238, F.sans, 13, 300, { anchor: "start", fill: accent, spacing: 0.2 }),
        T("NGƯỜI NHẬN", 480, 238, F.sans, 13, 300, { anchor: "start", fill: accent, spacing: 0.2 }),
        ...[["DỊCH VỤ", design.service, 60, 460], ["MÃ VÉ", design.code, 560, 150], ["HẠN DÙNG", design.expiry, 720, 150]].flatMap(([k, v, x, w]) => [
          T(k as string, x as number, 392, F.sans, 13, 200, { anchor: "start", fill: accent, spacing: 0.2 }),
          T(v as string, x as number, 426, F.sans, 18, w as number, { anchor: "start" }),
        ]),
        T(design.salon, 60, 500, F.sans, 17, 800, { anchor: "start", upper: true, spacing: 0.25 }),
        T(contact, 60, 540, F.sans, 14, 800, { anchor: "start", opacity: 0.75 }),
        label("Trị giá", 1070, 168, 280), value(1070, 250, 56, 280, ink, X.vn), T(design.code, 1070, 530, F.sans, 14, 250, { spacing: 0.3 }));
      break;
    }
    case "receipt": {
      const paper = mix(bg, "#FFFFFF", 0.88);
      const dash = (y: number) => <path key={key()} d={`M120 ${y} H1120`} stroke={ink} strokeOpacity={0.55} strokeWidth={2} strokeDasharray="6 6" />;
      L.push(<path key={key()} d={zigPaper(90, 36, 1150, 549)} fill={paper} />, dash(165), dash(292), dash(372),
        <Barcode key={key()} x={440} y={446} w={360} h={52} color={ink} seed={5} />);
      L.push(T(design.salon, C, 102, X.oswald, 34, 900, { upper: true, spacing: 0.18 }), T(contact, C, 140, F.sans, 14, 900, { opacity: 0.8 }),
        T(design.title, 130, 214, X.oswald, 28, 700, { anchor: "start", upper: true, spacing: 0.06 }), T("x1", 1110, 214, X.oswald, 28, 80, { anchor: "end" }),
        T(design.service, 130, 260, F.sans, 17, 760, { anchor: "start" }), T(design.value, 1110, 260, X.oswald, 24, 260, { anchor: "end" }),
        T("TỔNG CỘNG", 130, 344, X.oswald, 36, 400, { anchor: "start", spacing: 0.06 }), T(design.value, 1110, 346, X.oswald, 48, 480, { anchor: "end" }),
        ...fieldsRow(130, 418, 980), T(meta, C, 526, F.sans, 13, 900, { spacing: 0.1 }));
      break;
    }
    case "wax-seal": {
      L.push(<path key={key()} d="M0 0 L360 292 L0 585Z" fill={mix(bg, ink, 0.07)} />,
        <path key={key()} d="M0 0 L360 292 L0 585" fill="none" stroke={ink} strokeOpacity={0.2} strokeWidth={2} />,
        <rect key={key()} x={18} y={18} width={1204} height={549} fill="none" stroke={ink} strokeOpacity={0.15} />,
        <Seal key={key()} x={360} y={292} r={80} color={accent} />,
        <path key={key()} d="M500 70 H1180 M500 492 H1180" stroke={accent} strokeOpacity={0.35} />);
      L.push(T(initial, 360, 322, F.script, 86, 110, { fill: mix(accent, "#FFFFFF", 0.45) }),
        salon(840, 118, 620, accent), title(840, 222, 92, 660, F.script), value(840, 305, 62, 520),
        service(840, 350, 640), ...fieldsRow(500, 430, 680), footer(840, 530, 690));
      break;
    }
    case "gingham-picnic": {
      L.push(...Array.from({ length: 16 }, (_, i) => <rect key={key()} x={i * 80} width={40} height={H} fill={accent} fillOpacity={0.35} />),
        ...Array.from({ length: 8 }, (_, i) => <rect key={key()} y={i * 80} width={W} height={40} fill={accent} fillOpacity={0.35} />),
        <rect key={key()} x={200} y={72} width={840} height={440} rx={40} fill={bg} stroke={accent} strokeWidth={5} />,
        <rect key={key()} x={218} y={90} width={804} height={404} rx={28} fill="none" stroke={accent} strokeWidth={2} strokeDasharray="3 8" strokeLinecap="round" />,
        <path key={key()} d={HEART} transform="translate(600 105) scale(.4)" fill={accent} />);
      L.push(salon(C, 170, 640), title(C, 262, 88, 720, X.dancing), value(C, 340, 60, 480, ink), service(C, 380, 700),
        ...fieldsRow(280, 440, 680), footer(C, 482, 740));
      break;
    }
    case "editorial-swiss": {
      L.push(line(60, 72, 1180, 72, ink, 1, 2), line(60, 362, 1180, 362, ink, 1, 2), line(60, 492, 1180, 492, ink, 1, 2),
        <rect key={key()} x={800} y={96} width={380} height={236} fill={accent} />,
        line(440, 362, 440, 492, ink, 0.4, 1.5), line(800, 362, 800, 492, ink, 0.4, 1.5));
      L.push(T(design.salon, 60, 52, X.vn, 15, 600, { anchor: "start", upper: true, spacing: 0.2 }),
        T("Số 01 / Quà tặng", 1180, 52, F.sans, 14, 400, { anchor: "end", upper: true, spacing: 0.2 }),
        T(design.value, 56, 300, X.oswald, 200, 710, { anchor: "start" }),
        T(design.title, 990, 230, X.vn, 46, 330, { fill: bg }),
        T("DỊCH VỤ", 60, 396, X.vn, 12, 200, { anchor: "start", fill: accent, spacing: 0.2 }),
        T(design.service, 60, 430, F.sans, 16, 360, { anchor: "start" }),
        ...[["NGƯỜI NHẬN", 470], ["NGƯỜI TẶNG", 830]].flatMap(([s, x]) => [
          T(s as string, x as number, 396, X.vn, 12, 200, { anchor: "start", fill: accent, spacing: 0.2 }),
          line(x as number, 460, (x as number) + 320, 460, ink, 0.45),
        ]),
        T(contact, 60, 528, F.sans, 14, 600, { anchor: "start" }), T(meta, 1180, 528, F.sans, 14, 500, { anchor: "end" }),
        T(design.terms, 60, 560, F.sans, 12, 1100, { anchor: "start", opacity: 0.65 }));
      break;
    }
    case "cat-eye-velvet": {
      L.push(<defs key={key()}>
          <radialGradient id={id("vg")} cx=".3" cy=".4" r=".9"><stop offset="0" stopColor={mix(bg, accent, 0.18)} /><stop offset="1" stopColor={bg} /></radialGradient>
          <linearGradient id={id("ce")} x1="0" y1="0" x2="1" y2=".25"><stop offset="0" stopColor={mix(bg, "#000000", 0.25)} /><stop offset=".42" stopColor={mix(bg, accent, 0.35)} /><stop offset=".5" stopColor="#FFFFFF" /><stop offset=".58" stopColor={mix(bg, accent, 0.45)} /><stop offset="1" stopColor={mix(bg, "#000000", 0.25)} /></linearGradient>
        </defs>,
        <rect key={key()} width={W} height={H} fill={url("vg")} />,
        ...[[895, 318, -14], [1030, 292, 0], [1165, 318, 14]].map(([x, y, r]) => <g key={key()} transform={`rotate(${r} ${x} ${y})`}><path d={almond(x, y, 128, 330)} fill={url("ce")} stroke={accent} strokeOpacity={0.55} strokeWidth={1.5} /><path d={`M${x - 36} ${y - 60} Q${x - 42} ${y + 30} ${x - 30} ${y + 110}`} fill="none" stroke="#FFFFFF" strokeOpacity={0.35} strokeWidth={5} strokeLinecap="round" /></g>),
        ...(() => { const r = rng(3); return Array.from({ length: 46 }, () => <circle key={key()} cx={(r() * W).toFixed(0)} cy={(r() * H).toFixed(0)} r={r() < 0.2 ? 2.2 : 1} fill="#FFFFFF" fillOpacity={0.25 + r() * 0.5} />); })(),
        <path key={key()} d={star(700, 96, 18)} fill={accent} />);
      L.push(salon(360, 100, 560, accent), title(360, 212, 96, 600, F.script), value(360, 300, 64, 520), service(360, 345, 600),
        ...fields(80, 412, 560, 56), footer(360, 540, 620, accent));
      break;
    }
    case "glazed-pearl": {
      L.push(<defs key={key()}>
          <linearGradient id={id("ir")} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFE1EC" /><stop offset=".3" stopColor="#E7DEFF" /><stop offset=".55" stopColor="#DAF5EC" /><stop offset=".8" stopColor="#FFF0D6" /><stop offset="1" stopColor="#FFE1EC" /></linearGradient>
          <radialGradient id={id("pe")} cx=".35" cy=".3" r=".75"><stop offset="0" stopColor="#FFFFFF" /><stop offset=".6" stopColor={pale} /><stop offset="1" stopColor={accent} /></radialGradient>
        </defs>,
        <ellipse key={key()} cx={985} cy={300} rx={310} ry={270} fill={url("ir")} fillOpacity={0.75} />,
        ...[0, 1, 2, 3, 4].map((i) => { const x = 790 + i * 98, y = 222 - Math.sin((i / 4) * Math.PI) * 26; return <g key={key()}><path d={almond(x, y, 84, 200)} fill={url("ir")} stroke={accent} strokeWidth={1.5} /><path d={`M${x - 18} ${y - 40} Q${x - 22} ${y + 10} ${x - 14} ${y + 60}`} fill="none" stroke="#FFFFFF" strokeWidth={6} strokeLinecap="round" strokeOpacity={0.9} /></g>; }),
        ...Array.from({ length: 26 }, (_, i) => <circle key={key()} cx={700 + i * 20} cy={530 - Math.sin((i / 25) * Math.PI) * 18} r={8.5} fill={url("pe")} />));
      L.push(label("Láng như ngọc trai", 985, 400, 400, deep), value(985, 470, 60, 400, ink),
        salon(330, 100, 520, deep), title(330, 208, 96, 580, F.script), service(330, 262, 560),
        ...fields(70, 352, 520, 62), footer(330, 520, 580));
      break;
    }
  }

  if (side === "back") switch (design.style) {
    case "chrome-y2k": {
      L.push(<defs key={key()}>
          <linearGradient id={id("ch")} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFFFF" /><stop offset=".38" stopColor="#A9AFBA" /><stop offset=".52" stopColor="#F7F8FA" /><stop offset=".66" stopColor="#686E7A" /><stop offset="1" stopColor="#E4E7ED" /></linearGradient>
          <linearGradient id={id("chh")} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFFFFF" /><stop offset=".3" stopColor="#8B919C" /><stop offset=".55" stopColor="#F4F6F9" /><stop offset=".8" stopColor="#5F6571" /><stop offset="1" stopColor="#DADDE3" /></linearGradient>
        </defs>,
        <ellipse key={key()} cx={300} cy={292} rx={255} ry={110} fill="none" stroke={url("chh")} strokeWidth={7} transform="rotate(-20 300 292)" />,
        <path key={key()} d={star(300, 292, 190)} fill={url("ch")} />,
        ...[[520, 110, 34], [110, 480, 26], [560, 470, 18], [1160, 80, 22]].map(([x, y, r]) => <path key={key()} d={star(x, y, r)} fill={url("ch")} />));
      L.push(label("Dành riêng bạn", 880, 150, 520), heading(880, 255, 92, 560, X.fraunces, url("ch")),
        ...backCopy(880, 335, 560, "middle", ink, 21), salon(880, 480, 520, accent));
      break;
    }
    case "mocha-mousse": {
      const dark = mix(bg, "#000000", 0.42);
      L.push(<path key={key()} d="M90 110 C170 30 380 40 470 130 C560 220 540 400 450 470 C350 550 160 540 90 450 C30 370 20 180 90 110Z" fill={accent} />,
        <path key={key()} d="M1100 470 C1140 430 1210 450 1215 505 C1220 560 1150 575 1115 545 C1090 522 1085 490 1100 470Z" fill={accent} fillOpacity={0.25} />,
        line(700, 350, 1040, 350, accent, 0.5));
      L.push(heading(290, 310, 88, 380, F.script, dark), ...backCopy(870, 250, 560, "middle", ink, 22),
        salon(870, 420, 520, accent), T(design.website, 870, 468, F.sans, 16, 500, { fill: accent }));
      break;
    }
    case "butter-scallop": {
      L.push(<rect key={key()} width={W} height={H} fill={accent} />,
        <rect key={key()} x={40} y={40} width={1160} height={505} fill={bg} />,
        ...Array.from({ length: 30 }, (_, i) => <circle key={key()} cx={40 + (i * 1160) / 29} cy={40} r={14} fill={bg} />),
        ...Array.from({ length: 30 }, (_, i) => <circle key={key()} cx={40 + (i * 1160) / 29} cy={545} r={14} fill={bg} />),
        ...Array.from({ length: 12 }, (_, i) => <circle key={key()} cx={40} cy={40 + ((i + 1) * 505) / 13} r={14} fill={bg} />),
        ...Array.from({ length: 12 }, (_, i) => <circle key={key()} cx={1200} cy={40 + ((i + 1) * 505) / 13} r={14} fill={bg} />),
        <rect key={key()} x={74} y={74} width={1092} height={437} rx={18} fill="none" stroke={accent} strokeWidth={3} strokeDasharray="1 9" strokeLinecap="round" />,
        <path key={key()} d={HEART} transform="translate(595 115) scale(.5)" fill={accent} />);
      L.push(heading(C, 270, 100, 800, X.dancing), ...backCopy(C, 345, 820), salon(C, 452, 600));
      break;
    }
    case "aura-glow": {
      const orbs: [string, string][] = [["a1", "#FF9EC4"], ["a2", "#FFC89A"], ["a3", "#9EC9FF"]];
      L.push(<defs key={key()}>{orbs.map(([n, c]) => <radialGradient key={n} id={id(n)}><stop offset="0" stopColor={c} stopOpacity=".85" /><stop offset=".55" stopColor={c} stopOpacity=".35" /><stop offset="1" stopColor={c} stopOpacity="0" /></radialGradient>)}</defs>,
        ...[[430, 230, 340, "a1"], [820, 340, 340, "a3"], [620, 460, 280, "a2"]].map(([x, y, r, n]) => <circle key={key()} cx={x} cy={y} r={r} fill={url(n as string)} />));
      L.push(heading(C, 270, 96, 760, F.script), ...backCopy(C, 345, 780), salon(C, 470, 600));
      break;
    }
    case "neo-brutal": {
      const box = (x: number, y: number, w: number, h: number, fill: string) => [
        <rect key={key()} x={x + 10} y={y + 10} width={w} height={h} rx={14} fill={ink} />,
        <rect key={key()} x={x} y={y} width={w} height={h} rx={14} fill={fill} stroke={ink} strokeWidth={4} />,
      ];
      L.push(...box(60, 50, 1110, 130, "#FFD43B"), ...box(60, 222, 560, 300, "#FFFFFF"), ...box(660, 222, 510, 300, "#6EE7B7"),
        <path key={key()} d={star(760, 300, 30)} fill={ink} />, <path key={key()} d={star(1080, 450, 22)} fill={ink} />);
      L.push(T(design.backHeading, C, 140, X.vn, 60, 1000), ...backCopy(95, 320, 490, "start", ink, 21),
        T(design.salon, 95, 440, X.vn, 18, 490, { anchor: "start", upper: true, spacing: 0.14 }), T(design.website, 95, 478, F.sans, 16, 490, { anchor: "start" }),
        T("CẢM ƠN!", 915, 400, X.vn, 72, 430));
      break;
    }
    case "coquette-bow": {
      L.push(...Array.from({ length: 32 }, (_, i) => <circle key={key()} cx={i * 40 + 20} cy={0} r={24} fill={pale} />),
        ...Array.from({ length: 32 }, (_, i) => <circle key={key()} cx={i * 40 + 20} cy={H} r={24} fill={pale} />),
        ...[[130, 150], [1110, 150], [130, 450], [1110, 450]].map(([x, y]) => <Bow key={key()} x={x} y={y} s={0.8} color={accent} knot={deep} />),
        <rect key={key()} x={260} y={118} width={720} height={350} rx={30} fill={pale} stroke={accent} strokeWidth={2} />,
        <rect key={key()} x={274} y={132} width={692} height={322} rx={22} fill="none" stroke={accent} strokeOpacity={0.5} strokeDasharray="2 6" />);
      L.push(heading(C, 262, 92, 640, F.script), ...backCopy(C, 334, 640, "middle", ink, 20), salon(C, 428, 560, deep));
      break;
    }
    case "glass-frost": {
      const blobs: [string, string][] = [["g1", "#FF9FCB"], ["g2", "#7FE3D4"], ["g3", accent]];
      L.push(<defs key={key()}>
          {blobs.map(([n, c]) => <radialGradient key={n} id={id(n)}><stop offset="0" stopColor={c} /><stop offset=".6" stopColor={c} stopOpacity=".8" /><stop offset="1" stopColor={c} stopOpacity="0" /></radialGradient>)}
          <linearGradient id={id("gl")} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFFFFF" stopOpacity=".75" /><stop offset=".5" stopColor="#FFFFFF" stopOpacity=".3" /><stop offset="1" stopColor="#FFFFFF" stopOpacity=".45" /></linearGradient>
        </defs>,
        ...[[300, 140, 230, "g3"], [960, 460, 250, "g1"], [1010, 110, 170, "g2"], [240, 470, 170, "g2"]].map(([x, y, r, n]) => <circle key={key()} cx={x} cy={y} r={r} fill={url(n as string)} />),
        <rect key={key()} x={240} y={110} width={760} height={365} rx={36} fill={url("gl")} stroke="#FFFFFF" strokeOpacity={0.9} strokeWidth={2} />);
      L.push(heading(C, 250, 88, 640, F.script), ...backCopy(C, 322, 660, "middle", ink, 20), salon(C, 425, 560));
      break;
    }
    case "groovy-wave": {
      const band = [mix(ink, accent, 0.35), accent, "#F2A541", "#EE8C7A"];
      L.push(...band.map((c, i) => <path key={key()} d={`M-40 ${390 + i * 48} C160 ${330 + i * 48} 300 ${450 + i * 48} 520 ${390 + i * 48} S900 ${330 + i * 48} 1080 ${390 + i * 48} S1240 ${420 + i * 48} 1300 ${380 + i * 48}`} fill="none" stroke={c} strokeWidth={36} />));
      L.push(heading(C, 170, 90, 900, X.fraunces), ...backCopy(C, 240, 900), salon(C, 322, 700, accent));
      break;
    }
    case "cherry-bomb": {
      L.push(...[[110, 140, 0.7], [330, 500, 0.6], [560, 110, 0.5], [900, 520, 0.65], [1130, 160, 0.7], [1160, 480, 0.5], [70, 430, 0.5], [770, 90, 0.45]].map(([x, y, s]) => <Cherry key={key()} x={x} y={y} s={s} color={accent} stem={ink} leaf="#4E8A3E" />),
        <ellipse key={key()} cx={C} cy={292} rx={390} ry={172} fill={bg} stroke={accent} strokeWidth={3} />,
        <ellipse key={key()} cx={C} cy={292} rx={372} ry={156} fill="none" stroke={accent} strokeOpacity={0.4} strokeDasharray="4 7" />);
      L.push(heading(C, 272, 86, 600, X.lobster, accent), ...backCopy(C, 330, 620, "middle", ink, 20), salon(C, 420, 480));
      break;
    }
    case "old-money": {
      L.push(<rect key={key()} x={30} y={30} width={1180} height={525} fill="none" stroke={accent} strokeWidth={1.8} />,
        <rect key={key()} x={42} y={42} width={1156} height={501} fill="none" stroke={accent} strokeOpacity={0.6} />,
        ...[[30, 30], [1210, 30], [30, 555], [1210, 555]].map(([x, y]) => <path key={key()} d={`M${x} ${y - 9} L${x + 9} ${y} L${x} ${y + 9} L${x - 9} ${y}Z`} fill={accent} />),
        <Laurel key={key()} x={C} y={180} r={96} color={accent} />,
        <circle key={key()} cx={C} cy={180} r={56} fill={bg} stroke={accent} strokeWidth={2} />,
        line(420, 400, 820, 400, accent, 0.5));
      L.push(T(initial, C, 202, F.serif, 62, 90), heading(C, 360, 58, 760, F.serif2), ...backCopy(C, 448, 820, "middle", ink, 19), salon(C, 522, 600, accent));
      break;
    }
    case "leopard-luxe": {
      const lab = mix(bg, accent, 0.35);
      L.push(<Rosettes key={key()} seed={29} x0={-30} y0={-20} x1={W} y1={H} ink={ink} spot={accent} />,
        <rect key={key()} x={300} y={130} width={640} height={325} rx={10} fill={ink} />,
        <rect key={key()} x={314} y={144} width={612} height={297} rx={6} fill="none" stroke={bg} strokeOpacity={0.4} />);
      L.push(heading(C, 262, 84, 560, F.script, bg), ...backCopy(C, 326, 580, "middle", bg, 19), salon(C, 408, 520, lab));
      break;
    }
    case "tortoise-shell": {
      L.push(<Tortoise key={key()} seed={19} x0={0} y0={0} x1={W} y1={H} base={mix(accent, "#E8B060", 0.4)} dark={mix(ink, "#000000", 0.2)} mid={mix(accent, ink, 0.5)} />,
        <rect key={key()} x={180} y={108} width={880} height={370} rx={20} fill={bg} />,
        <rect key={key()} x={196} y={124} width={848} height={338} rx={12} fill="none" stroke={accent} strokeOpacity={0.5} />);
      L.push(heading(C, 248, 86, 740, F.script), ...backCopy(C, 322, 760), salon(C, 420, 600, accent));
      break;
    }
    case "polka-dot": {
      L.push(...Array.from({ length: 10 }, (_, row) => Array.from({ length: 7 }, (_, col) => <circle key={key()} cx={col * 64 + (row % 2) * 32 - 10} cy={row * 64 + 10} r={15} fill={accent} />)).flat(),
        <rect key={key()} x={420} width={W - 420} height={H} fill={bg} />,
        <rect key={key()} x={420} width={6} height={H} fill={accent} />);
      L.push(heading(840, 240, 92, 640, F.script), ...backCopy(840, 320, 660), salon(840, 440, 600, accent));
      break;
    }
    case "boarding-pass": {
      L.push(<rect key={key()} width={W} height={22} fill={accent} />, <rect key={key()} y={H - 22} width={W} height={22} fill={accent} />,
        <path key={key()} d="M180 470 Q620 300 1060 470" fill="none" stroke={accent} strokeWidth={3} strokeDasharray="4 10" strokeLinecap="round" />,
        <circle key={key()} cx={180} cy={470} r={10} fill={accent} />, <circle key={key()} cx={1060} cy={470} r={10} fill={accent} />,
        <path key={key()} d={PLANE} transform="translate(620 385) rotate(0) scale(1.5)" fill={ink} />);
      L.push(heading(C, 170, 84, 800, F.script), ...backCopy(C, 240, 820),
        T("KHỞI HÀNH", 180, 515, X.vn, 16, 200, { spacing: 0.2 }), T("THƯ GIÃN", 1060, 515, X.vn, 16, 200, { spacing: 0.2 }),
        salon(C, 450, 420, accent));
      break;
    }
    case "receipt": {
      const paper = mix(bg, "#FFFFFF", 0.88);
      const dash = (y: number) => <path key={key()} d={`M120 ${y} H1120`} stroke={ink} strokeOpacity={0.55} strokeWidth={2} strokeDasharray="6 6" />;
      L.push(<path key={key()} d={zigPaper(90, 36, 1150, 549)} fill={paper} />, dash(190), dash(330), dash(420));
      L.push(T("* * *", C, 90, X.oswald, 24, 200, { spacing: 0.3 }), T(design.backHeading, C, 158, X.oswald, 54, 900, { upper: true, spacing: 0.06 }),
        ...backCopy(C, 250, 900, "middle", ink, 21), T(design.terms, C, 380, F.sans, 15, 900, { opacity: 0.8 }),
        T(`♥  ${design.salon}  ♥`, C, 476, X.oswald, 26, 900, { upper: true, spacing: 0.16 }), T(design.website, C, 516, F.sans, 15, 600, { opacity: 0.8 }));
      break;
    }
    case "wax-seal": {
      L.push(<path key={key()} d="M1240 0 L900 292 L1240 585Z" fill={mix(bg, ink, 0.07)} />,
        <path key={key()} d="M1240 0 L900 292 L1240 585" fill="none" stroke={ink} strokeOpacity={0.2} strokeWidth={2} />,
        <rect key={key()} x={18} y={18} width={1204} height={549} fill="none" stroke={ink} strokeOpacity={0.15} />,
        <Seal key={key()} x={900} y={292} r={64} color={accent} />,
        ...[0, 1, 2].map((i) => line(140, 400 + i * 38, 720, 400 + i * 38, ink, 0.18, 1.2)));
      L.push(T(initial, 900, 316, F.script, 70, 90, { fill: mix(accent, "#FFFFFF", 0.45) }),
        label("Thư gửi bạn", 430, 110, 500), heading(430, 212, 88, 640, F.script), ...backCopy(430, 290, 660, "middle", ink, 20),
        salon(430, 540, 600, accent));
      break;
    }
    case "gingham-picnic": {
      L.push(...Array.from({ length: 7 }, (_, i) => <rect key={key()} x={i * 80} width={40} height={H} fill={accent} fillOpacity={0.35} />),
        ...Array.from({ length: 8 }, (_, i) => <rect key={key()} y={i * 80} width={560} height={40} fill={accent} fillOpacity={0.35} />),
        <rect key={key()} x={560} width={W - 560} height={H} fill={bg} />,
        <rect key={key()} x={556} width={6} height={H} fill={accent} />,
        <path key={key()} d={HEART} transform="translate(250 230) scale(.6)" fill={bg} stroke={accent} strokeWidth={4} />);
      L.push(heading(900, 240, 88, 560, X.dancing), ...backCopy(900, 315, 580), salon(900, 430, 560));
      break;
    }
    case "editorial-swiss": {
      L.push(line(60, 72, 1180, 72, ink, 1, 2), line(60, 520, 1180, 520, ink, 1, 2),
        <rect key={key()} x={1000} y={96} width={180} height={180} fill={accent} />);
      L.push(T(design.salon, 60, 52, X.vn, 15, 600, { anchor: "start", upper: true, spacing: 0.2 }),
        T("CẢM ƠN", 56, 300, X.oswald, 220, 900, { anchor: "start" }), T("01", 1090, 222, X.oswald, 110, 160, { fill: bg }),
        T(design.backHeading, 60, 388, F.serif2, 56, 760, { anchor: "start" }), ...backCopy(60, 440, 760, "start", ink, 19),
        T(design.website, 1180, 440, F.sans, 16, 340, { anchor: "end" }), T(design.phone, 1180, 480, F.sans, 16, 340, { anchor: "end" }),
        T("Số 01 / Quà tặng", 1180, 52, F.sans, 14, 400, { anchor: "end", upper: true, spacing: 0.2 }));
      break;
    }
    case "cat-eye-velvet": {
      L.push(<defs key={key()}>
          <radialGradient id={id("vg")} cx=".5" cy=".5" r=".8"><stop offset="0" stopColor={mix(bg, accent, 0.16)} /><stop offset="1" stopColor={bg} /></radialGradient>
          <linearGradient id={id("sh")} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={accent} stopOpacity="0" /><stop offset=".45" stopColor={accent} stopOpacity=".35" /><stop offset=".5" stopColor="#FFFFFF" stopOpacity=".85" /><stop offset=".55" stopColor={accent} stopOpacity=".35" /><stop offset="1" stopColor={accent} stopOpacity="0" /></linearGradient>
        </defs>,
        <rect key={key()} width={W} height={H} fill={url("vg")} />,
        <rect key={key()} x={0} y={-300} width={360} height={1185} fill={url("sh")} transform="rotate(-28 180 292)" />,
        ...(() => { const r = rng(9); return Array.from({ length: 60 }, () => <circle key={key()} cx={(r() * W).toFixed(0)} cy={(r() * H).toFixed(0)} r={r() < 0.2 ? 2.2 : 1} fill="#FFFFFF" fillOpacity={0.25 + r() * 0.5} />); })(),
        ...[[180, 120, 20], [1080, 470, 26], [1130, 110, 14]].map(([x, y, r]) => <path key={key()} d={star(x, y, r)} fill={accent} />));
      L.push(heading(740, 262, 96, 640, F.script), ...backCopy(740, 336, 640, "middle", ink, 20), salon(740, 452, 560, accent));
      break;
    }
    case "glazed-pearl": {
      L.push(<defs key={key()}>
          <linearGradient id={id("ir")} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFE1EC" /><stop offset=".3" stopColor="#E7DEFF" /><stop offset=".55" stopColor="#DAF5EC" /><stop offset=".8" stopColor="#FFF0D6" /><stop offset="1" stopColor="#FFE1EC" /></linearGradient>
          <radialGradient id={id("pe")} cx=".35" cy=".3" r=".75"><stop offset="0" stopColor="#FFFFFF" /><stop offset=".6" stopColor={pale} /><stop offset="1" stopColor={accent} /></radialGradient>
        </defs>,
        <rect key={key()} width={W} height={H} fill={url("ir")} fillOpacity={0.55} />,
        <circle key={key()} cx={300} cy={292} r={170} fill={bg} fillOpacity={0.7} />,
        ...Array.from({ length: 28 }, (_, i) => { const [x, y] = polar(300, 292, 170, (i / 28) * Math.PI * 2); return <circle key={key()} cx={x} cy={y} r={13} fill={url("pe")} />; }));
      L.push(label("Tiệm của bạn", 300, 262, 220, deep), salon(300, 310, 250), heading(850, 240, 92, 600, F.script),
        ...backCopy(850, 320, 620), T(design.website, 850, 440, F.sans, 16, 500, { fill: deep }));
      break;
    }
  }

  return (
    <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg" className={className} role="img" aria-label={`${side === "back" ? "Mặt sau " : ""}${design.title} – ${design.salon}`}>
      <rect width={W} height={H} fill={bg} />
      {L}
    </svg>
  );
}
