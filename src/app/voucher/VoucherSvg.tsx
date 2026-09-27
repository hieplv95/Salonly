import { useId, type ReactNode, type Ref } from "react";
import { VOUCHER_SIZE, isNewVoucherStyle, isTrendVoucherStyle, type VoucherDesign } from "@/lib/voucher-templates";
import { F, mix, star, useSvgText } from "../design/svg-kit";
import { LogoIcon } from "../logo/LogoSvg";
import { Veins, hash } from "../price/PriceSvg";
import { VoucherFreshSvg } from "./VoucherFreshSvg";
import { VoucherTrendSvg } from "./VoucherTrendSvg";

const { w: W, h: H } = VOUCHER_SIZE;
const C = W / 2;

// Nơ quà tặng: 2 quai, 2 đuôi, nút thắt. Vẽ trong ô 100×100 (tâm nút ~ 50,45).
export function Bow({ cx, cy, size, fill }: { cx: number; cy: number; size: number; fill: string }) {
  const s = size / 100;
  const shade = mix(fill, "#000000", 0.22);
  const light = mix(fill, "#FFFFFF", 0.35);
  return (
    <g transform={`translate(${cx - 50 * s} ${cy - 45 * s}) scale(${s})`}>
      <path d="M46 47 L28 94 L37 88 L42 97 L53 50 Z" fill={shade} />
      <path d="M54 47 L72 94 L63 88 L58 97 L47 50 Z" fill={shade} />
      <path d="M50 45 C38 18 6 10 5 32 C4 52 32 56 50 45 Z" fill={fill} />
      <path d="M50 45 C62 18 94 10 95 32 C96 52 68 56 50 45 Z" fill={fill} />
      <path d="M50 45 C41 30 20 25 17 35 C15 44 34 48 50 45 Z" fill={shade} opacity={0.55} />
      <path d="M50 45 C59 30 80 25 83 35 C85 44 66 48 50 45 Z" fill={shade} opacity={0.55} />
      <path d="M12 26 C18 17 30 17 38 24" fill="none" stroke={light} strokeWidth={1.6} strokeLinecap="round" opacity={0.8} />
      <path d="M88 26 C82 17 70 17 62 24" fill="none" stroke={light} strokeWidth={1.6} strokeLinecap="round" opacity={0.8} />
      <rect x={42.5} y={37} width={15} height={17} rx={5} fill={fill} stroke={shade} strokeWidth={1.2} />
    </g>
  );
}

// Chiếc lá hướng theo trục x, gốc tại (0,0), dài len.
const leafPath = (len: number) => `M0 0 C${len * 0.3} ${-len * 0.26} ${len * 0.75} ${-len * 0.22} ${len} 0 C${len * 0.75} ${len * 0.22} ${len * 0.3} ${len * 0.26} 0 0 Z`;
// Làm tròn toạ độ tính từ sin/cos để server và trình duyệt vẽ giống hệt nhau.
const q = (n: number) => Math.round(n * 100) / 100;
const deg = (a: number) => q((a * 180) / Math.PI);
const cos = (a: number) => q(Math.cos(a) * 1e4) / 1e4;
const sin = (a: number) => q(Math.sin(a) * 1e4) / 1e4;

// Bông hồng nhiều lớp cánh, có lá phía sau.
export function Rose({ cx, cy, r, color, leaf }: { cx: number; cy: number; r: number; color: string; leaf: string }) {
  const dark = mix(color, "#000000", 0.25);
  const petals = (n: number, dist: number, rx: number, ry: number, fill: string, turn: number) =>
    Array.from({ length: n }, (_, i) => {
      const a = turn + (Math.PI * 2 * i) / n;
      return (
        <ellipse
          key={`${n}-${i}`}
          cx={cx + cos(a) * dist * r}
          cy={cy + sin(a) * dist * r}
          rx={rx * r}
          ry={ry * r}
          fill={fill}
          stroke={dark}
          strokeOpacity={0.35}
          strokeWidth={r * 0.02}
          transform={`rotate(${deg(a)} ${cx + cos(a) * dist * r} ${cy + sin(a) * dist * r})`}
        />
      );
    });
  return (
    <g>
      {[3.5, 5.8, 1.2].map((a, i) => (
        <g key={i} transform={`translate(${cx + cos(a) * r * 0.55} ${cy + sin(a) * r * 0.55}) rotate(${deg(a)})`}>
          <path d={leafPath(r * 1.05)} fill={leaf} />
          <path d={`M0 0 L${r * 0.9} 0`} stroke={mix(leaf, "#000000", 0.2)} strokeWidth={r * 0.025} />
        </g>
      ))}
      {petals(6, 0.44, 0.5, 0.36, mix(color, "#FFFFFF", 0.38), 0)}
      {petals(5, 0.26, 0.38, 0.28, mix(color, "#FFFFFF", 0.18), 0.6)}
      <circle cx={cx} cy={cy} r={r * 0.3} fill={color} />
      <path
        d={`M${cx - r * 0.2} ${cy + r * 0.05} C${cx - r * 0.2} ${cy - r * 0.2} ${cx + r * 0.2} ${cy - r * 0.22} ${cx + r * 0.18} ${cy + r * 0.02} M${cx - r * 0.08} ${cy + r * 0.03} C${cx - r * 0.06} ${cy - r * 0.1} ${cx + r * 0.1} ${cy - r * 0.08} ${cx + r * 0.06} ${cy + r * 0.05}`}
        fill="none"
        stroke={dark}
        strokeWidth={r * 0.035}
        strokeLinecap="round"
      />
    </g>
  );
}

// Cành lá mảnh mọc từ (x,y) theo góc a (radian), lá so le hai bên.
export function Sprig({ x, y, len, a, color }: { x: number; y: number; len: number; a: number; color: string }) {
  const ex = q(x + cos(a) * len);
  const ey = q(y + sin(a) * len);
  const bend = { x: q(-sin(a) * len * 0.12), y: q(cos(a) * len * 0.12) };
  const leaves = [0.22, 0.4, 0.58, 0.76].map((t, i) => ({
    x: q(x + (ex - x) * t + bend.x * 4 * t * (1 - t)),
    y: q(y + (ey - y) * t + bend.y * 4 * t * (1 - t)),
    a: a + (i % 2 ? 0.75 : -0.75),
    l: q(len * 0.3 * (1 - t * 0.35)),
  }));
  return (
    <g fill={color}>
      <path d={`M${x} ${y} Q${(x + ex) / 2 + bend.x * 2} ${(y + ey) / 2 + bend.y * 2} ${ex} ${ey}`} fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
      {leaves.map((l, i) => (
        <path key={i} d={leafPath(l.l)} transform={`translate(${l.x} ${l.y}) rotate(${deg(l.a)})`} />
      ))}
      <path d={leafPath(len * 0.22)} transform={`translate(${ex} ${ey}) rotate(${deg(a)})`} />
    </g>
  );
}

export function VoucherSvg({ design, svgRef, className }: { design: VoucherDesign; svgRef?: Ref<SVGSVGElement>; className?: string }) {
  const uid = useId().replace(/:/g, "");
  const { bg, ink, accent } = design.colors;
  const { T, key, widthOf } = useSvgText(ink);
  const L: ReactNode[] = [];
  if (isNewVoucherStyle(design.style)) return <VoucherFreshSvg design={design} side="front" svgRef={svgRef} className={className} />;
  if (isTrendVoucherStyle(design.style)) return <VoucherTrendSvg design={design} side="front" svgRef={svgRef} className={className} />;

  const meta = [design.code.trim() && `Mã số: ${design.code.trim()}`, design.expiry.trim() && `Hạn dùng: ${design.expiry.trim()}`].filter(Boolean).join("   ·   ");
  const contact = [design.phone, design.website].map((s) => s.trim()).filter(Boolean).join("   ·   ");
  const sparkle = (cx: number, cy: number, r: number, fill = accent) => <path key={key()} d={star(cx, cy, r)} fill={fill} />;

  // Dòng để trống cho khách tự viết tay: "Người nhận ____".
  const field = (label: string, x: number, y: number, w: number, color = ink) => {
    const up = label.toLocaleUpperCase("vi");
    const lw = label ? widthOf(up, F.sans, 15) * 1.12 + up.length * 15 * 0.15 + 14 : 0;
    return [
      label ? T(label, x, y, F.sans, 15, 220, { anchor: "start", upper: true, spacing: 0.15, fill: color, opacity: 0.85 }) : null,
      <path key={key()} d={`M${x + lw} ${y + 3} H${x + w}`} stroke={color} strokeOpacity={0.45} strokeWidth={1.3} />,
    ];
  };
  const fields = (x: number, y: number, w: number, gap: number, labels = ["Người nhận", "Người tặng"], color = ink) =>
    labels.flatMap((label, i) => field(label, x, y + i * gap, w, color));
  const fieldsRow = (x: number, y: number, w: number, color = ink) => [...field("Người nhận", x, y, (w - 50) / 2, color), ...field("Người tặng", x + (w + 50) / 2, y, (w - 50) / 2, color)];

  switch (design.style) {
    case "noir": {
      L.push(
        <rect key={key()} x={22} y={22} width={W - 44} height={H - 44} fill="none" stroke={accent} strokeWidth={2} />,
        <rect key={key()} x={32} y={32} width={W - 64} height={H - 64} fill="none" stroke={accent} strokeOpacity={0.6} strokeWidth={0.8} />,
      );
      L.push(T(design.salon, 90, 108, F.sans, 18, 640, { anchor: "start", upper: true, spacing: 0.35, fill: accent }));
      L.push(T(design.title, 84, 220, F.script, 112, 680, { anchor: "start", fill: accent }));
      L.push(T(design.service, 90, 274, F.sans, 19, 660, { anchor: "start", opacity: 0.85 }));
      L.push(...fields(90, 355, 640, 64));
      L.push(T(meta, 90, 512, F.sans, 15, 660, { anchor: "start", opacity: 0.7 }));
      L.push(<path key={key()} d="M810 80 V505" stroke={accent} strokeOpacity={0.55} strokeWidth={1.2} />);
      L.push(T("Trị giá", 1015, 200, F.sans, 17, 300, { upper: true, spacing: 0.4, fill: accent }));
      L.push(T(design.value, 1015, 290, F.serif, 76, 330));
      L.push(<path key={key()} d="M955 330 H995 M1035 330 H1075" stroke={accent} strokeWidth={1.2} />, sparkle(1015, 330, 9));
      L.push(T(design.phone, 1015, 415, F.sans, 19, 330));
      L.push(T(design.website, 1015, 448, F.sans, 19, 330, { opacity: 0.8 }));
      L.push(T(design.terms, 1015, 512, F.sans, 12, 350, { opacity: 0.55 }));
      L.push(sparkle(1150, 95, 12), sparkle(1180, 130, 6));
      break;
    }
    case "ribbon": {
      L.push(<rect key={key()} width={330} height={H} fill={mix(bg, accent, 0.1)} />);
      L.push(
        <rect key={key()} x={330} width={56} height={H} fill={accent} />,
        <path key={key()} d={`M338 0 V${H} M378 0 V${H}`} stroke={mix(accent, "#FFFFFF", 0.35)} strokeWidth={1.2} opacity={0.7} />,
      );
      L.push(<Bow key={key()} cx={358} cy={140} size={230} fill={accent} />);
      L.push(T("Trị giá", 165, 330, F.sans, 16, 260, { upper: true, spacing: 0.35, fill: accent }));
      L.push(T(design.value, 165, 400, F.serif, 54, 270));
      L.push(<path key={key()} d="M125 432 H205" stroke={accent} strokeWidth={1.2} />);
      L.push(T(design.phone, 165, 480, F.sans, 16, 270));
      L.push(T(design.website, 165, 510, F.sans, 16, 270, { opacity: 0.8 }));
      L.push(T(design.title, 470, 185, F.script, 116, 700, { anchor: "start", fill: accent }));
      L.push(T(design.salon, 476, 245, F.serif2, 26, 680, { anchor: "start", upper: true, spacing: 0.25 }));
      L.push(T(design.service, 476, 290, F.sans, 19, 680, { anchor: "start", opacity: 0.85 }));
      L.push(...fields(476, 368, 690, 62));
      L.push(T(meta, 476, 498, F.sans, 15, 690, { anchor: "start", opacity: 0.75 }));
      L.push(T(design.terms, 476, 532, F.sans, 13, 690, { anchor: "start", opacity: 0.6 }));
      break;
    }
    case "ticket": {
      const X = 900;
      const mc = (24 + X) / 2;
      const sc = (X + W - 24) / 2;
      L.push(<rect key={key()} x={24} y={24} width={W - 48} height={H - 48} rx={8} fill="none" stroke={accent} strokeWidth={1.6} />);
      L.push(
        <path key={key()} d={`M${X} 44 V${H - 44}`} stroke={accent} strokeWidth={3} strokeDasharray="0.1 11" strokeLinecap="round" />,
        <circle key={key()} cx={X} cy={24} r={16} fill={bg} stroke={accent} strokeWidth={1.6} />,
        <circle key={key()} cx={X} cy={H - 24} r={16} fill={bg} stroke={accent} strokeWidth={1.6} />,
        <rect key={key()} x={X - 18} y={0} width={36} height={23} fill={bg} />,
        <rect key={key()} x={X - 18} y={H - 23} width={36} height={23} fill={bg} />,
      );
      L.push(T(design.salon, mc, 105, F.sans, 18, 700, { upper: true, spacing: 0.4, fill: accent }));
      L.push(T(design.title, mc, 190, F.serif, 62, 760, { upper: true, spacing: 0.08 }));
      L.push(<path key={key()} d={`M${mc - 160} 225 H${mc - 18} M${mc + 18} 225 H${mc + 160}`} stroke={accent} strokeWidth={1.2} />, <path key={key()} d={`M${mc} 217 L${mc + 8} 225 L${mc} 233 L${mc - 8} 225 Z`} fill={accent} />);
      L.push(T(design.service, mc, 270, F.sans, 19, 720, { opacity: 0.85 }));
      L.push(...fields(110, 352, 704, 62));
      L.push(T(contact, mc, 490, F.sans, 17, 720, { opacity: 0.85 }));
      L.push(T(design.terms, mc, 525, F.sans, 13, 720, { opacity: 0.6 }));
      L.push(T("Trị giá", sc, 140, F.sans, 15, 250, { upper: true, spacing: 0.35, fill: accent }));
      L.push(T(design.value, sc, 215, F.serif, 50, 260));
      L.push(<path key={key()} d={`M${sc - 40} 252 H${sc + 40}`} stroke={accent} strokeWidth={1.2} />);
      L.push(T("Mã số", sc, 310, F.sans, 14, 250, { upper: true, spacing: 0.35, fill: accent }));
      L.push(T(design.code, sc, 355, F.serif2, 40, 250));
      L.push(T("Hạn dùng", sc, 420, F.sans, 14, 250, { upper: true, spacing: 0.35, fill: accent }));
      L.push(T(design.expiry, sc, 460, F.serif2, 32, 250));
      break;
    }
    case "marble": {
      L.push(<Veins key={key()} W={W} H={H} dark={false} gold={accent} seed={hash(design.templateId)} id={uid} />);
      L.push(
        <rect key={key()} x={26} y={26} width={W - 52} height={H - 52} fill="none" stroke={accent} strokeWidth={2.5} />,
        <rect key={key()} x={37} y={37} width={W - 74} height={H - 74} fill="none" stroke={accent} strokeWidth={0.8} />,
      );
      L.push(T(design.salon, C, 108, F.serif2, 24, 700, { upper: true, spacing: 0.35 }));
      L.push(T(design.title, C, 212, F.script, 118, 900, { fill: accent }));
      L.push(T(design.value, C, 305, F.serif, 68, 600));
      L.push(T(design.service, C, 350, F.sans, 19, 800, { opacity: 0.85 }));
      L.push(...fieldsRow(180, 430, 880));
      L.push(T([meta, contact].filter(Boolean).join("   ·   "), C, 492, F.sans, 15, 960, { opacity: 0.75 }));
      L.push(T(design.terms, C, 525, F.sans, 13, 900, { opacity: 0.6 }));
      break;
    }
    case "minimal": {
      L.push(T(design.salon, 90, 110, F.sans, 17, 620, { anchor: "start", upper: true, spacing: 0.4 }));
      L.push(T(design.title, 86, 205, F.serif2, 86, 630, { anchor: "start", upper: true, spacing: 0.1 }));
      L.push(T(design.service, 90, 258, F.sans, 19, 620, { anchor: "start", opacity: 0.8 }));
      L.push(...fields(90, 352, 600, 66));
      L.push(T(design.terms, 90, 510, F.sans, 13, 620, { anchor: "start", opacity: 0.6 }));
      L.push(<path key={key()} d="M770 90 V495" stroke={ink} strokeOpacity={0.25} strokeWidth={1.2} />);
      L.push(T("Trị giá", 1000, 190, F.sans, 16, 360, { upper: true, spacing: 0.4 }));
      L.push(T(design.value, 1000, 280, F.serif2, 84, 390));
      L.push(<path key={key()} d="M960 318 H1040" stroke={ink} strokeWidth={1.2} />);
      L.push(T(design.code && `Mã số ${design.code}`, 1000, 378, F.sans, 15, 360, { upper: true, spacing: 0.2 }));
      L.push(T(design.expiry && `Hạn dùng ${design.expiry}`, 1000, 410, F.sans, 15, 360, { upper: true, spacing: 0.2 }));
      L.push(T(design.phone, 1000, 480, F.sans, 17, 360));
      L.push(T(design.website, 1000, 510, F.sans, 17, 360, { opacity: 0.75 }));
      break;
    }
    case "botanical": {
      L.push(
        <g key={key()} opacity={0.35}>
          <Sprig x={W - 30} y={H + 6} len={210} a={-1.95} color={accent} />
        </g>,
        <g key={key()} opacity={0.3}>
          <Sprig x={W + 6} y={-6} len={150} a={2.3} color={accent} />
        </g>,
      );
      L.push(<path key={key()} d="M70 530 V230 A200 172 0 0 1 470 230 V530 Z" fill={mix(bg, "#FFFFFF", 0.5)} stroke={accent} strokeWidth={2} />);
      L.push(<LogoIcon key={key()} id="leaf" x={270} y={165} size={105} primary={accent} accent={mix(accent, "#FFFFFF", 0.55)} />);
      L.push(T("Trị giá", 270, 300, F.sans, 16, 320, { upper: true, spacing: 0.35, fill: accent }));
      L.push(T(design.value, 270, 370, F.serif, 56, 340));
      L.push(<path key={key()} d="M230 402 H310" stroke={accent} strokeWidth={1.2} />);
      L.push(T(design.phone, 270, 450, F.sans, 16, 340));
      L.push(T(design.website, 270, 480, F.sans, 16, 340, { opacity: 0.8 }));
      L.push(T(design.title, 540, 185, F.script, 110, 640, { anchor: "start", fill: accent }));
      L.push(T(design.salon, 546, 245, F.serif, 30, 620, { anchor: "start" }));
      L.push(T(design.service, 546, 290, F.sans, 19, 620, { anchor: "start", opacity: 0.85 }));
      L.push(...fields(546, 368, 600, 62));
      L.push(T(meta, 546, 498, F.sans, 15, 600, { anchor: "start", opacity: 0.75 }));
      L.push(T(design.terms, 546, 530, F.sans, 13, 600, { anchor: "start", opacity: 0.6 }));
      break;
    }
    case "split": {
      const lc = 240;
      L.push(<rect key={key()} width={480} height={H} fill={accent} />);
      L.push(T(design.salon, lc, 100, F.sans, 17, 400, { upper: true, spacing: 0.35, fill: bg }));
      L.push(T(design.title, lc, 222, F.script, 100, 410, { fill: bg }));
      L.push(sparkle(lc, 262, 10, bg));
      L.push(T("Trị giá", lc, 325, F.sans, 15, 400, { upper: true, spacing: 0.35, fill: bg, opacity: 0.85 }));
      L.push(T(design.value, lc, 398, F.serif, 60, 400, { fill: bg }));
      L.push(T(design.service, lc, 452, F.sans, 16, 400, { fill: bg, opacity: 0.9 }));
      L.push(T(design.phone, lc, 520, F.sans, 15, 400, { fill: bg, opacity: 0.8 }));
      L.push(T("Dành tặng", 560, 118, F.sans, 17, 600, { anchor: "start", upper: true, spacing: 0.4, fill: accent }));
      L.push(<path key={key()} d="M560 138 H640" stroke={accent} strokeWidth={1.5} />);
      L.push(...fields(560, 212, 610, 68, ["Người nhận", "Người tặng", "Lời nhắn", ""]));
      L.push(T(meta, 560, 470, F.sans, 15, 610, { anchor: "start", opacity: 0.75 }));
      L.push(T(design.website, 560, 503, F.sans, 15, 610, { anchor: "start", opacity: 0.75 }));
      L.push(T(design.terms, 560, 536, F.sans, 13, 610, { anchor: "start", opacity: 0.6 }));
      break;
    }
    case "deco": {
      L.push(
        <rect key={key()} x={22} y={22} width={W - 44} height={H - 44} fill="none" stroke={accent} strokeWidth={2} />,
        <rect key={key()} x={32} y={32} width={W - 64} height={H - 64} fill="none" stroke={accent} strokeWidth={0.8} />,
      );
      // Hoạ tiết góc bậc thang, lật đối xứng cho 4 góc.
      (["", `translate(${W} 0) scale(-1 1)`, `translate(0 ${H}) scale(1 -1)`, `translate(${W} ${H}) scale(-1 -1)`] as const).forEach((tf) =>
        L.push(
          <g key={key()} transform={tf || undefined} stroke={accent} fill="none" strokeWidth={1.4}>
            <path d="M32 104 H72 V72 H104 V32" />
            <path d="M32 124 H88 V88 H124 V32" strokeOpacity={0.5} />
            <path d="M54 44 L64 54 L54 64 L44 54 Z" fill={accent} stroke="none" />
          </g>,
        ),
      );
      // Quạt Art Deco ở giữa phía trên.
      const fx = C;
      const fy = 125;
      const rays = Array.from({ length: 13 }, (_, i) => {
        const a = Math.PI + (Math.PI * (i + 0.5)) / 13;
        return `M${fx + cos(a) * 44} ${fy + sin(a) * 44} L${fx + cos(a) * 76} ${fy + sin(a) * 76}`;
      }).join(" ");
      L.push(
        <path key={key()} d={`M${fx - 36} ${fy} A36 36 0 0 1 ${fx + 36} ${fy} Z`} fill={accent} />,
        <path key={key()} d={rays} stroke={accent} strokeWidth={1.6} />,
        <path key={key()} d={`M${fx - 84} ${fy} A84 84 0 0 1 ${fx + 84} ${fy}`} fill="none" stroke={accent} strokeWidth={1.4} />,
        <path key={key()} d={`M${fx - 200} ${fy} H${fx + 200}`} stroke={accent} strokeWidth={1.2} />,
      );
      L.push(T(design.title, C, 200, F.serif, 50, 820, { upper: true, spacing: 0.16, fill: accent }));
      L.push(T(design.salon, C, 242, F.sans, 17, 700, { upper: true, spacing: 0.45 }));
      L.push(T(design.value, C, 328, F.serif, 68, 520, { fill: accent }));
      L.push(<path key={key()} d={`M${C - 330} 306 H${C - 290} M${C + 290} 306 H${C + 330}`} stroke={accent} strokeWidth={1.2} />);
      L.push(T(design.service, C, 370, F.sans, 18, 800, { opacity: 0.85 }));
      L.push(...fieldsRow(200, 438, 840));
      L.push(T([meta, contact].filter(Boolean).join("   ·   "), C, 494, F.sans, 14, 900, { opacity: 0.75 }));
      L.push(T(design.terms, C, 526, F.sans, 12, 860, { opacity: 0.6 }));
      break;
    }
    case "floral": {
      const leaf = "#8A9A78";
      L.push(<rect key={key()} x={50} y={45} width={W - 100} height={H - 90} rx={10} fill={mix(bg, "#FFFFFF", 0.82)} />);
      L.push(
        <Rose key={key()} cx={82} cy={78} r={66} color={accent} leaf={leaf} />,
        <Rose key={key()} cx={1178} cy={96} r={36} color={accent} leaf={leaf} />,
        <Rose key={key()} cx={1148} cy={502} r={76} color={accent} leaf={leaf} />,
        <Rose key={key()} cx={60} cy={522} r={32} color={accent} leaf={leaf} />,
      );
      L.push(T(design.salon, C, 118, F.serif2, 24, 700, { upper: true, spacing: 0.35 }));
      L.push(T(design.title, C, 218, F.script, 110, 760, { fill: accent }));
      L.push(T(design.value, C, 302, F.serif, 58, 560));
      L.push(T(design.service, C, 345, F.sans, 18, 740, { opacity: 0.85 }));
      L.push(...fieldsRow(240, 420, 760));
      L.push(T([meta, contact].filter(Boolean).join("   ·   "), C, 478, F.sans, 14, 820, { opacity: 0.75 }));
      L.push(T(design.terms, C, 508, F.sans, 12, 800, { opacity: 0.6 }));
      break;
    }
    case "polish": {
      L.push(<circle key={key()} cx={1010} cy={292} r={215} fill={mix(bg, accent, 0.16)} />);
      L.push(<circle key={key()} cx={1010} cy={292} r={235} fill="none" stroke={accent} strokeOpacity={0.35} strokeWidth={1.2} />);
      L.push(<LogoIcon key={key()} id="polish" x={1010} y={292} size={300} primary={accent} accent={mix(accent, "#FFFFFF", 0.55)} />);
      L.push(sparkle(870, 150, 13), sparkle(1150, 420, 10), sparkle(1140, 150, 7));
      L.push(T(design.salon, 90, 100, F.sans, 17, 640, { anchor: "start", upper: true, spacing: 0.4, fill: accent }));
      L.push(T(design.title, 88, 172, F.bold, 50, 660, { anchor: "start", upper: true, spacing: 0.05 }));
      L.push(T(design.value, 84, 300, F.serif, 112, 680, { anchor: "start", fill: accent }));
      L.push(T(design.service, 90, 352, F.sans, 19, 660, { anchor: "start", opacity: 0.85 }));
      L.push(...fieldsRow(90, 436, 660));
      L.push(T([meta, contact].filter(Boolean).join("   ·   "), 90, 500, F.sans, 14, 680, { anchor: "start", opacity: 0.75 }));
      L.push(T(design.terms, 90, 532, F.sans, 12, 680, { anchor: "start", opacity: 0.6 }));
      break;
    }
  }

  return (
    <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg" className={className} role="img" aria-label={`${design.title} – ${design.salon}`}>
      <rect width={W} height={H} fill={bg} />
      {L}
    </svg>
  );
}
