import { isValidElement, useId, type PointerEventHandler, type ReactNode, type Ref } from "react";
import qrcode from "qrcode-generator";
import { CARD_SIZES, type CardDesign } from "@/lib/card-templates";
import { F, HEART, mix, star, useSvgText } from "../design/svg-kit";
import { LogoIcon } from "../logo/LogoSvg";
import { Veins, hash, isDark } from "../price/PriceSvg";
import { CardElementLayer } from "./CardElementLayer";
import { isTrendCardStyle } from "@/lib/card-templates";
import { trendCardLayers } from "./CardTrendSvg";

// Mã QR hỗ trợ cả chữ có dấu.
qrcode.stringToBytes = (s: string) => [...new TextEncoder().encode(s)];

export type Box = { x: number; y: number; w: number; h: number };

export type StampOpts = {
  shape: "circle" | "heart" | "dotted" | "square" | "nail";
  fill: string;
  stroke: string;
  strokeW: number;
  specialFill: string;
  specialText: string;
  finalShape?: "heart";
  showSpecialText?: boolean;
};

export const autoOffer = (count: number) => `Làm ${count - 1} lần, tặng lần thứ ${count}`;

// Cành cỏ lau dạng nét mảnh cho mẫu boho; giữ thiết kế là SVG có thể in sắc nét.
function Pampas({ x, y, scale, color, flip = false }: { x: number; y: number; scale: number; color: string; flip?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})`} fill="none" stroke={color} strokeLinecap="round">
      <path d="M0 0 C18 -125 36 -235 81 -395 M0 0 C-5 -145 -20 -250 -7 -420 M0 0 C50 -100 102 -210 151 -344" strokeWidth={2.5} />
      {Array.from({ length: 9 }, (_, i) => {
        const t = i / 8;
        const yy = -150 - t * 242;
        return <g key={i} strokeWidth={1.7} opacity={0.72 - t * 0.12}>
          <path d={`M${24 + t * 57} ${yy + 15} q-35 -31 -60 -34 M${24 + t * 57} ${yy + 15} q40 -31 68 -28`} />
          <path d={`M${-4 + t * 3} ${yy - 12} q-35 -27 -51 -28 M${-4 + t * 3} ${yy - 12} q29 -31 50 -33`} />
        </g>;
      })}
    </g>
  );
}

function Bow({ x, y, scale, color, opacity = 1 }: { x: number; y: number; scale: number; color: string; opacity?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" opacity={opacity}>
    <path d="M0 0 C-40 -55 -122 -63 -135 -12 C-148 34 -80 57 0 0 C80 57 148 34 135 -12 C122 -63 40 -55 0 0 Z" />
    <path d="M-4 6 C-48 49 -76 92 -115 111 M4 6 C48 49 76 92 115 111 M-15 -3 Q0 13 15 -3" />
  </g>;
}

function Sprig({ x, y, scale, color, flip = false }: { x: number; y: number; scale: number; color: string; flip?: boolean }) {
  return <g transform={`translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})`} fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
    <path d="M-125 37 C-54 2 40 -4 126 -45" />
    {[-80, -40, 0, 40, 80].map((p) => <g key={p}><path d={`M${p} ${12 - p * 0.23} q-23 -34 -49 -30 q7 27 49 30 M${p + 13} ${8 - p * 0.23} q19 31 48 24 q-12 -27 -48 -24`} /></g>)}
  </g>;
}

export function CardSvg({
  design,
  side = "front",
  svgRef,
  className,
  editing,
  selectedElementId,
  selectedLayerId,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: {
  design: CardDesign;
  side?: "front" | "back";
  svgRef?: Ref<SVGSVGElement>;
  className?: string;
  editing?: boolean;
  selectedElementId?: string | null;
  selectedLayerId?: string | null;
  onPointerDown?: PointerEventHandler<SVGSVGElement>;
  onPointerMove?: PointerEventHandler<SVGSVGElement>;
  onPointerUp?: PointerEventHandler<SVGSVGElement>;
}) {
  const uid = useId().replace(/:/g, "");
  const { w: W, h: H } = CARD_SIZES[design.orientation];
  const C = W / 2;
  const { bg, ink, accent } = design.colors;
  const dark = isDark(bg);
  const count = Math.max(3, Math.min(15, Math.round(design.stamps) || 10));
  // Để trống ưu đãi = tự ghi theo số ô.
  const offer = design.offer.trim() || autoOffer(count);
  const { T, key, widthOf } = useSvgText(ink);

  /* ----- Lưới ô tích điểm: tự chia hàng, hàng cuối căn giữa ----- */
  const stamps = (box: Box, maxCols: number, o: StampOpts): ReactNode[] => {
    const rows = Math.ceil(count / maxCols);
    const cols = Math.ceil(count / rows);
    const cw = box.w / cols;
    const chh = box.h / rows;
    const r = Math.min(cw, chh) * 0.4;
    const els: ReactNode[] = [];
    // Giữ 15 vị trí cố định để lớp đã kéo không đổi ID khi khách đổi số ô.
    for (let i = 0; i < 15; i++) {
      if (i >= count) { els.push(null); continue; }
      const parts: ReactNode[] = [];
      const row = Math.floor(i / cols);
      const inRow = row < rows - 1 ? cols : count - cols * (rows - 1);
      const col = i - row * cols;
      const cx = box.x + (box.w - inRow * cw) / 2 + cw * (col + 0.5);
      const cy = box.y + chh * (row + 0.5);
      const isFinal = i === count - 1;
      const isMid = design.midAt > 0 && i === design.midAt - 1 && !isFinal;
      const special = isFinal || isMid;
      const shape = isFinal && o.finalShape ? o.finalShape : o.shape;
      const fill = special ? o.specialFill : o.fill;
      const stroke = special ? o.specialFill : o.stroke;
      if (shape === "heart") {
        const s = (r * 2.3) / 80;
        parts.push(
          <path
            key={key()}
            d={HEART}
            transform={`translate(${cx - 50 * s} ${cy - 55 * s}) scale(${s})`}
            fill={fill}
            stroke={stroke}
            strokeWidth={o.strokeW / s}
            strokeLinejoin="round"
          />,
        );
      } else if (shape === "square") {
        parts.push(<rect key={key()} x={cx - r} y={cy - r} width={r * 2} height={r * 2} rx={r * 0.32} fill={fill} stroke={stroke} strokeWidth={o.strokeW} />);
      } else {
        parts.push(
          <circle
            key={key()}
            cx={cx}
            cy={cy}
            r={r}
            fill={fill}
            stroke={stroke}
            strokeWidth={o.strokeW}
            strokeDasharray={shape === "dotted" && !special ? `0.1 ${o.strokeW * 2.4}` : undefined}
            strokeLinecap="round"
          />,
        );
        if (shape === "nail" && !special)
          parts.push(
            <g key={key()} opacity={0.3}>
              <LogoIcon id="nails" x={cx} y={cy} size={r * 1.35} primary={accent} accent={accent} />
            </g>,
          );
      }
      if (special && o.showSpecialText !== false) {
        const label = isFinal ? design.reward : design.midReward;
        parts.push(T(label, cx, cy + r * 0.15 + (shape === "heart" ? r * 0.08 : 0), F.bold, r * 0.4, r * 1.45, { fill: o.specialText, upper: true, spacing: 0.06 }));
      }
      els.push(<g key={`stamp-${i}`} data-card-group-label={`Ô tích điểm ${i + 1}`}>{parts}</g>);
    }
    return els;
  };

  // Mẫu cổ điển đánh số từng lượt đóng dấu.
  const stampNumbers = (box: Box, maxCols: number, fill: string): ReactNode[] => {
    const rows = Math.ceil(count / maxCols);
    const cols = Math.ceil(count / rows);
    const cw = box.w / cols;
    const chh = box.h / rows;
    return Array.from({ length: 14 }, (_, i) => {
      if (i >= count - 1 || (design.midAt > 0 && i === design.midAt - 1)) return null;
      const row = Math.floor(i / cols);
      const inRow = row < rows - 1 ? cols : count - cols * (rows - 1);
      const col = i - row * cols;
      const cx = box.x + (box.w - inRow * cw) / 2 + cw * (col + 0.5);
      const cy = box.y + chh * (row + 0.5);
      return T(String(i + 1), cx, cy + 10, F.serif2, 35, cw * 0.5, { fill });
    });
  };

  const qr = (x: number, y: number, size: number, fill: string) => {
    if (!design.qr.trim()) return null;
    const q = qrcode(0, "M");
    q.addData(design.qr.trim());
    q.make();
    const m = q.getModuleCount();
    let d = "";
    for (let r = 0; r < m; r++) for (let c = 0; c < m; c++) if (q.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
    return (
      <g key={key()} data-card-semantic="qr" transform={`translate(${x} ${y}) scale(${size / m})`}>
        <path d={d} fill={fill} shapeRendering="crispEdges" />
      </g>
    );
  };

  const sparkle = (cx: number, cy: number, r: number, fill = ink) => <path key={key()} d={star(cx, cy, r)} fill={fill} />;
  const initials = (design.salon.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("") || "N").toLocaleUpperCase("vi");

  /* ----- Các mẫu ----- */
  const L: ReactNode[] = [];
  const back = side === "back";

  // Bộ 20 mẫu xu hướng vẽ riêng (CardTrendSvg), dùng chung lưới ô, mã QR và lớp kéo thả.
  if (isTrendCardStyle(design.style)) L.push(...trendCardLayers({ design, back, W, H, C, uid, count, offer, initials, T, key, stamps }));

  switch (design.style) {
    case "qrsplit": {
      if (!back) {
        L.push(<rect key={key()} x={56} y={56} width={W - 112} height={H - 112} fill="none" stroke={ink} strokeOpacity={0.38} strokeWidth={1.3} />);
        L.push(<path key={key()} d="M650 87 V513" stroke={ink} strokeWidth={2} />);
        L.push(T(initials, 352, 349, F.serif2, 235, 515, { upper: true, spacing: 0.04 }));
        L.push(T(design.salon, 352, 429, F.sans, 27, 500, { upper: true, spacing: 0.25 }));
        L.push(T(design.title, 835, 283, F.serif2, 71, 316, { upper: true }));
        L.push(T(design.tagline, 835, 343, F.script, 65, 290, { fill: accent }));
      } else {
        L.push(<path key={key()} d="M432 66 V534" stroke={ink} strokeWidth={2.2} />);
        L.push(T(design.title, 224, 115, F.serif2, 57, 374, { upper: true, spacing: 0.1 }));
        L.push(design.qr.trim() ? <rect key={key()} x={131} y={169} width={186} height={186} fill="#FFFFFF" /> : null);
        L.push(qr(141, 179, 166, ink));
        L.push(T(design.backTitle, 224, 394, F.sans, 17, 360, { upper: true, spacing: 0.17 }));
        L.push(T(design.social, 224, 453, F.sans, 18, 350));
        L.push(T(design.website, 224, 486, F.sans, 17, 350));
        L.push(T(offer, 728, 102, F.sans, 19, 545, { upper: true, spacing: 0.12 }));
        L.push(...stamps({ x: 471, y: 133, w: 514, h: 366 }, 3, { shape: "circle", fill: "#FFFFFF", stroke: "#FFFFFF", strokeW: 1, specialFill: accent, specialText: "#FFFFFF", finalShape: "heart" }));
      }
      break;
    }
    case "inkline": {
      if (!back) {
        L.push(<path key={key()} d="M82 79 H968 M82 520 H968" stroke={ink} strokeWidth={1.7} />);
        L.push(T(design.salon, C, 276, F.serif2, 126, 865, { upper: true, spacing: 0.12 }));
        L.push(T(design.tagline, C, 354, F.script, 72, 750));
        L.push(T(design.title, C, 477, F.sans, 20, 790, { upper: true, spacing: 0.33 }));
      } else {
        L.push(T(design.title, C, 134, F.script, 130, 825));
        L.push(T(offer, C, 182, F.sans, 20, 855, { upper: true, spacing: 0.25 }));
        L.push(...stamps({ x: 108, y: 202, w: 834, h: 252 }, 5, { shape: "circle", fill: "none", stroke: ink, strokeW: 3.1, specialFill: ink, specialText: bg }));
        L.push(<rect key={key()} x={0} y={500} width={W} height={70} fill={ink} />);
        L.push(T(design.website || design.social, C, 545, F.serif2, 29, 885, { fill: bg, upper: true, spacing: 0.22 }));
      }
      break;
    }
    case "champagne": {
      L.push(<defs key={key()}><linearGradient id={`${uid}-champagne`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={mix(bg, "#B8AA91", 0.24)} /><stop offset="0.32" stopColor={mix(bg, "#FFFFFF", 0.82)} /><stop offset="0.65" stopColor={mix(bg, "#FFFFFF", 0.58)} /><stop offset="1" stopColor={mix(bg, accent, 0.16)} /></linearGradient></defs>);
      L.push(<rect key={key()} width={W} height={H} fill={`url(#${uid}-champagne)`} />);
      if (!back) {
        L.push(T(design.salon, C, 104, F.sans, 21, 780, { upper: true, spacing: 0.18 }));
        L.push(T(design.title, C, 342, F.serif2, 166, 915, { upper: true, spacing: 0.03 }));
        L.push(design.qr.trim() ? <rect key={key()} x={101} y={419} width={119} height={119} fill="#FFFFFF" /> : null);
        L.push(qr(109, 427, 103, ink));
        L.push(T(design.social, 260, 474, F.sans, 20, 500, { anchor: "start", upper: true, spacing: 0.13 }));
        L.push(T(design.website, 260, 511, F.sans, 19, 500, { anchor: "start", upper: true, spacing: 0.12 }));
      } else {
        L.push(T(design.title, C, 126, F.serif2, 93, 850, { upper: true, spacing: 0.06 }));
        L.push(T(offer, C, 178, F.sans, 20, 830, { upper: true, spacing: 0.19 }));
        L.push(...stamps({ x: 88, y: 220, w: 875, h: 260 }, 5, { shape: "circle", fill: mix(bg, "#FFFFFF", 0.36), stroke: accent, strokeW: 7, specialFill: mix(bg, "#FFFFFF", 0.86), specialText: ink }));
        L.push(T([design.phone, design.social, design.website].filter((s) => s.trim()).join("   ·   "), C, 551, F.sans, 18, 890, { upper: true, spacing: 0.09 }));
      }
      break;
    }
    case "ribbon": {
      const bars = <g key={key()} opacity={0.68}>{Array.from({ length: 16 }, (_, i) => <rect key={i} x={i * 70 + 10} y={0} width={24} height={H} fill={accent} fillOpacity={i % 2 ? 0.21 : 0.34} />)}</g>;
      if (!back) {
        L.push(bars);
        L.push(<Bow key={key()} x={C} y={141} scale={1.18} color={ink} />);
        L.push(T(design.title, C, 347, F.script, 172, 900));
        L.push(T(design.salon, C, 458, F.serif2, 53, 800, { upper: true, spacing: 0.12 }));
        L.push(T(design.tagline, C, 506, F.sans, 18, 710, { upper: true, spacing: 0.28 }));
      } else {
        L.push(<rect key={key()} x={0} y={0} width={W} height={64} fill={accent} fillOpacity={0.35} />, <rect key={key()} x={0} y={536} width={W} height={64} fill={accent} fillOpacity={0.35} />);
        L.push(<Bow key={key()} x={802} y={143} scale={0.64} color={ink} />);
        L.push(T(design.backTitle, 234, 154, F.serif2, 53, 400, { upper: true }));
        L.push(T(design.backLine1, 234, 198, F.sans, 18, 400));
        L.push(T(offer, 234, 289, F.sans, 22, 396, { upper: true, spacing: 0.07 }));
        L.push(T(design.social, 234, 370, F.sans, 20, 392));
        L.push(T(design.phone, 234, 411, F.sans, 20, 392));
        L.push(...stamps({ x: 448, y: 245, w: 529, h: 241 }, 3, { shape: "circle", fill: mix(bg, accent, 0.35), stroke: "none", strokeW: 0, specialFill: ink, specialText: bg }));
        L.push(T(design.website, C, 574, F.serif2, 26, 810, { upper: true, spacing: 0.15 }));
      }
      break;
    }
    case "obsidian": {
      L.push(<rect key={key()} width={W} height={H} fill={bg} />);
      if (!back) {
        L.push(T(design.title, C, 326, F.script, 186, 866, { fill: ink }));
        L.push(T(design.salon, C, 481, F.serif2, 31, 680, { fill: ink, upper: true, spacing: 0.29 }));
      } else {
        L.push(T(design.salon, C, 107, F.serif2, 67, 850, { fill: ink, upper: true, spacing: 0.08 }));
        L.push(T(design.backTitle, C, 154, F.serif2, 30, 850, { fill: ink }));
        L.push(...stamps({ x: 83, y: 188, w: 760, h: 272 }, 5, { shape: "circle", fill: ink, stroke: ink, strokeW: 1, specialFill: ink, specialText: bg, showSpecialText: false }));
        L.push(T(design.midAt > 0 ? design.midReward : offer, 921, 293, F.serif2, 37, 199, { fill: ink, upper: true }));
        L.push(T(design.reward, 921, 428, F.serif2, 37, 199, { fill: ink, upper: true }));
        L.push(<path key={key()} d="M97 498 H953" stroke={ink} strokeOpacity={0.48} strokeWidth={1.2} />);
        L.push(T(design.phone, C, 551, F.serif2, 28, 520, { fill: ink }));
      }
      break;
    }
    case "botanical": {
      L.push(<rect key={key()} x={38} y={38} width={W - 76} height={H - 76} fill="none" stroke={ink} strokeWidth={2.2} />);
      if (!back) {
        L.push(<Sprig key={key()} x={C} y={151} scale={0.75} color={ink} />);
        L.push(T(design.title, C, 312, F.script, 128, 810));
        L.push(T(design.salon, C, 366, F.serif2, 34, 760, { upper: true, spacing: 0.12 }));
        L.push(<Sprig key={key()} x={C} y={473} scale={0.75} color={ink} flip />);
      } else {
        L.push(<circle key={key()} cx={108} cy={109} r={51} fill={ink} />);
        L.push(T(initials, 108, 125, F.serif2, 43, 79, { fill: bg }));
        L.push(T(design.salon, 606, 99, F.serif2, 43, 770, { upper: true }));
        L.push(T(offer, 606, 153, F.sans, 20, 800, { upper: true, spacing: 0.15 }));
        L.push(...stamps({ x: 92, y: 188, w: 866, h: 275 }, 5, { shape: "circle", fill: "none", stroke: ink, strokeW: 2.9, specialFill: accent, specialText: bg, finalShape: "heart" }));
        L.push(<Sprig key={key()} x={156} y={498} scale={0.29} color={accent} />);
        L.push(T([design.phone, design.website].filter((s) => s.trim()).join("   ·   "), C, 535, F.serif2, 25, 850));
      }
      break;
    }
    case "rosechip": {
      L.push(<rect key={key()} width={W} height={H} rx={29} fill={bg} />);
      if (!back) {
        L.push(<circle key={key()} cx={987} cy={36} r={192} fill={mix(bg, "#FFFFFF", 0.35)} />);
        L.push(T(design.salon, C, 100, F.serif2, 34, 710, { upper: true }));
        L.push(T(design.title, C, 277, F.serif2, 145, 929, { upper: true, spacing: 0.01 }));
        L.push(T(design.memberNo, 83, 363, F.serif2, 50, 815, { anchor: "start", spacing: 0.26 }));
        L.push(T("HẠN DÙNG", 86, 474, F.sans, 17, 260, { anchor: "start", upper: true, spacing: 0.16 }));
        L.push(T(design.valid, 86, 517, F.bold, 29, 180, { anchor: "start" }));
        L.push(<circle key={key()} cx={730} cy={480} r={57} fill={mix(accent, "#FFFFFF", 0.17)} />, <circle key={key()} cx={805} cy={480} r={57} fill={accent} fillOpacity={0.85} />);
        L.push(<path key={key()} d="M918 453 q17 27 0 54 M940 441 q26 39 0 78 M962 431 q36 49 0 98" fill="none" stroke={ink} strokeWidth={6} strokeLinecap="round" />);
      } else {
        L.push(<rect key={key()} x={0} y={58} width={W} height={100} fill={accent} fillOpacity={0.73} />);
        L.push(T(design.salon, C, 126, F.serif2, 54, 870, { upper: true, spacing: 0.11 }));
        L.push(...stamps({ x: 77, y: 209, w: 536, h: 274 }, 5, { shape: "dotted", fill: "none", stroke: ink, strokeW: 3.2, specialFill: accent, specialText: bg }));
        L.push(T(offer, 655, 270, F.serif2, 34, 344, { anchor: "start" }));
        L.push(design.qr.trim() ? <rect key={key()} x={663} y={329} width={163} height={163} rx={5} fill="#FFFFFF" /> : null);
        L.push(qr(671, 337, 147, "#28221F"));
        L.push(T(design.social, 85, 550, F.sans, 19, 440, { anchor: "start" }));
        L.push(T(design.website, 964, 550, F.sans, 19, 440, { anchor: "end" }));
      }
      break;
    }
    case "bowlocked": {
      if (!back) {
        L.push(<Bow key={key()} x={C} y={250} scale={1.5} color={accent} opacity={0.38} />);
        L.push(T(design.tagline, C, 166, F.script, 69, 765, { fill: ink }));
        L.push(T(design.title, C, 360, F.serif2, 99, 885, { upper: true, spacing: 0.02 }));
        L.push(T(design.social, C, 520, F.sans, 18, 770, { upper: true, spacing: 0.25 }));
      } else {
        L.push(<Bow key={key()} x={882} y={92} scale={0.3} color={accent} opacity={0.85} />);
        L.push(T(design.backTitle, C, 133, F.script, 55, 790));
        L.push(T(design.title, C, 253, F.serif2, 87, 872, { upper: true }));
        L.push(T(design.backLine1, C, 296, F.sans, 17, 836, { upper: true, spacing: 0.2 }));
        L.push(...stamps({ x: 77, y: 322, w: 897, h: 150 }, 6, { shape: "circle", fill: "none", stroke: ink, strokeW: 2.7, specialFill: accent, specialText: ink }));
        L.push(T(offer, C, 515, F.sans, 19, 835, { upper: true, spacing: 0.15 }));
        L.push(T(design.website, C, 553, F.sans, 20, 835, { upper: true, spacing: 0.2 }));
      }
      break;
    }
    case "heritage": {
      const rule = <g key={key()} fill="none" stroke={ink} strokeWidth={1.8}>
        <rect x={26} y={26} width={W - 52} height={H - 52} />
        <rect x={37} y={37} width={W - 74} height={H - 74} strokeWidth={0.7} />
        {[67, 130, 193, 256, 319, 382, 445, 508, 571, 634, 697, 760, 823, 886, 949].map((x) => (
          <g key={x}><path d={`M${x - 21} 27 q10 11 21 0 q10 -11 21 0 M${x - 21} 573 q10 -11 21 0 q10 11 21 0`} /><path d={`M${x} 20 v14 M${x} 566 v14`} /></g>
        ))}
        {[83, 149, 215, 281, 347, 413, 479, 545].map((y) => (
          <g key={y}><path d={`M27 ${y - 20} q11 10 0 20 q-11 10 0 20 M1023 ${y - 20} q-11 10 0 20 q11 10 0 20`} /><path d={`M20 ${y} h14 M1016 ${y} h14`} /></g>
        ))}
      </g>;
      L.push(rule);
      if (!back) {
        L.push(T(design.salon, C, 116, F.serif2, 54, 770, { upper: true, spacing: 0.06 }));
        L.push(T(design.title, C, 158, F.script, 52, 690));
        L.push(T(offer, C, 202, F.bold, 20, 760, { spacing: 0.08 }));
        const box = { x: 110, y: 225, w: 830, h: 253 };
        L.push(...stamps(box, 5, { shape: "circle", fill: "none", stroke: accent, strokeW: 2.7, specialFill: accent, specialText: bg }));
        L.push(...stampNumbers(box, 5, ink));
        L.push(T([design.phone, design.website].filter((s) => s.trim()).join("  ·  "), C, 529, F.sans, 17, 780, { spacing: 0.06 }));
      } else {
        L.push(<circle key={key()} cx={C} cy={181} r={91} fill="none" stroke={accent} strokeWidth={3} />);
        L.push(<circle key={key()} cx={C} cy={181} r={79} fill="none" stroke={ink} strokeWidth={1.4} />);
        L.push(T(initials, C, 204, F.serif2, 76, 135));
        L.push(T(design.backTitle, C, 339, F.serif2, 53, 820, { upper: true, spacing: 0.1 }));
        L.push(<path key={key()} d="M370 370 H680 M505 370 l20 -12 l20 12 l-20 12 z" fill={bg} stroke={accent} strokeWidth={2} />);
        L.push(T(design.backLine1, C, 419, F.sans, 20, 790));
        L.push(T(design.backLine2, C, 451, F.sans, 19, 790));
        L.push(T([design.social, design.phone, design.website].filter((s) => s.trim()).join("   ·   "), C, 523, F.sans, 16, 860));
      }
      break;
    }
    case "skinstudio": {
      L.push(<defs key={key()}><linearGradient id={`${uid}-skin`} x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor={mix(bg, "#FFFFFF", 0.3)} /><stop offset="1" stopColor={bg} /></linearGradient></defs>);
      if (!back) {
        L.push(<rect key={key()} width={W} height={H} fill={`url(#${uid}-skin)`} />);
        L.push(<path key={key()} d="M91 91 H959 M91 509 H959" stroke={ink} strokeOpacity={0.27} strokeWidth={1.5} />);
        L.push(T(design.salon, C, 300, F.serif2, 126, 820, { upper: true, spacing: 0.075 }));
        L.push(T(design.tagline, C, 368, F.script, 71, 650, { fill: mix(bg, "#FFFFFF", 0.85) }));
        L.push(T(design.title, C, 482, F.sans, 19, 670, { upper: true, spacing: 0.34 }));
      } else {
        L.push(<rect key={key()} width={W} height={H} fill={mix(bg, "#FFFFFF", 0.86)} />);
        L.push(<rect key={key()} x={46} y={46} width={W - 92} height={H - 92} fill="none" stroke={mix(bg, ink, 0.16)} strokeWidth={1.5} />);
        L.push(T(design.title, C, 126, F.serif2, 92, 840, { upper: true, spacing: 0.06 }));
        L.push(T(offer, C, 172, F.sans, 20, 840, { spacing: 0.13 }));
        L.push(...stamps({ x: 90, y: 201, w: 870, h: 274 }, 5, { shape: "circle", fill: mix(bg, "#FFFFFF", 0.96), stroke: mix(bg, ink, 0.23), strokeW: 2, specialFill: accent, specialText: "#FFFFFF", finalShape: "heart" }));
        L.push(T([design.social, design.phone, design.website].filter((s) => s.trim()).join("   ·   "), C, 534, F.sans, 17, 870, { fill: ink }));
      }
      break;
    }
    case "burgundy": {
      const stripe = <g key={key()} fill={ink}>
        {Array.from({ length: 24 }, (_, i) => <rect key={i} x={26 + i * 43} y={31} width={22} height={48} />)}
        {Array.from({ length: 24 }, (_, i) => <rect key={i} x={26 + i * 43} y={521} width={22} height={48} />)}
      </g>;
      L.push(<rect key={key()} x={15} y={15} width={W - 30} height={H - 30} fill="none" stroke={ink} strokeWidth={11} />, stripe);
      if (!back) {
        L.push(T("THE LOYALTY CLUB", C, 184, F.sans, 22, 700, { upper: true, spacing: 0.32 }));
        L.push(T(design.title, C, 334, F.script, 138, 815));
        L.push(<path key={key()} d="M270 377 H780 M505 377 l20 -10 l20 10 l-20 10 z" fill={bg} stroke={ink} strokeWidth={1.7} />);
        L.push(T(design.salon, C, 461, F.serif2, 48, 770, { upper: true, spacing: 0.12 }));
      } else {
        L.push(T(design.salon, C, 145, F.script, 90, 740));
        L.push(T(offer, C, 189, F.sans, 21, 800, { upper: true, spacing: 0.1 }));
        L.push(...stamps({ x: 98, y: 212, w: 854, h: 267 }, 5, { shape: "circle", fill: "none", stroke: ink, strokeW: 2.7, specialFill: ink, specialText: bg }));
        L.push(T([design.social, design.phone].filter((s) => s.trim()).join("   ·   "), C, 508, F.sans, 19, 780));
      }
      break;
    }
    case "midnight": {
      L.push(<defs key={key()}><linearGradient id={`${uid}-night`} x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor={mix(bg, "#FFFFFF", 0.13)} /><stop offset="0.48" stopColor={bg} /><stop offset="1" stopColor={mix(bg, "#FFFFFF", 0.07)} /></linearGradient></defs>);
      L.push(<rect key={key()} width={W} height={H} fill={`url(#${uid}-night)`} />);
      if (!back) {
        L.push(<circle key={key()} cx={167} cy={174} r={121} fill="none" stroke={accent} strokeWidth={3} />);
        L.push(<circle key={key()} cx={167} cy={174} r={110} fill="none" stroke={ink} strokeOpacity={0.5} strokeWidth={1.4} />);
        L.push(T(initials, 167, 190, F.serif2, 70, 165, { fill: ink }));
        L.push(T(design.title, 684, 180, F.script, 132, 665, { fill: ink }));
        L.push(T(offer, 680, 229, F.sans, 21, 680, { fill: ink, upper: true, spacing: 0.16 }));
        L.push(...stamps({ x: 380, y: 248, w: 600, h: 285 }, 3, { shape: "heart", fill: mix(ink, bg, 0.06), stroke: accent, strokeW: 2.5, specialFill: accent, specialText: bg }));
        L.push(T(design.phone, 63, 385, F.sans, 21, 265, { anchor: "start", fill: ink }));
        L.push(T(design.social, 63, 429, F.sans, 21, 265, { anchor: "start", fill: ink }));
        L.push(T(design.website, 63, 473, F.sans, 21, 265, { anchor: "start", fill: ink }));
        L.push(sparkle(363, 99, 12, accent), sparkle(971, 100, 16, ink), sparkle(974, 550, 9, accent));
      } else {
        L.push(<path key={key()} d="M0 425 C230 315 320 540 542 428 C758 319 877 407 1050 333 V600 H0 Z" fill={accent} fillOpacity={0.11} />);
        L.push(<circle key={key()} cx={253} cy={227} r={145} fill="none" stroke={accent} strokeWidth={2} />);
        L.push(<circle key={key()} cx={253} cy={227} r={125} fill="none" stroke={ink} strokeOpacity={0.35} strokeWidth={1} />);
        L.push(T(initials, 253, 250, F.serif2, 88, 170, { fill: ink }));
        L.push(T(design.backTitle, 722, 190, F.serif2, 64, 525, { fill: ink, upper: true, spacing: 0.09 }));
        L.push(T(design.backLine1, 722, 282, F.script, 83, 510, { fill: accent }));
        L.push(T(design.salon, C, 448, F.serif2, 63, 860, { fill: ink, upper: true, spacing: 0.16 }));
        L.push(<path key={key()} d="M343 478 H707" stroke={accent} strokeWidth={1.5} />);
        L.push(T([design.phone, design.social, design.website].filter((s) => s.trim()).join("   ·   "), C, 528, F.sans, 18, 860, { fill: ink }));
        L.push(sparkle(154, 115, 17, ink), sparkle(883, 160, 13, accent), sparkle(909, 467, 9, ink));
      }
      break;
    }
    case "clay": {
      if (!back) {
        L.push(T(design.title, C, 148, F.serif2, 133, 906, { fill: ink }));
        L.push(T(offer, C, 199, F.sans, 20, 830, { fill: ink, upper: true, spacing: 0.1 }));
        L.push(...stamps({ x: 96, y: 218, w: 858, h: 287 }, 5, { shape: "circle", fill: "none", stroke: ink, strokeW: 6, specialFill: ink, specialText: accent }));
        L.push(T([design.phone, design.social, design.website].filter((s) => s.trim()).join("   ·   "), C, 554, F.serif2, 25, 915, { fill: ink, spacing: 0.06 }));
      } else {
        L.push(<rect key={key()} width={W} height={H} fill={mix(bg, "#FFFFFF", 0.86)} />);
        L.push(<path key={key()} d="M0 600 V303 A300 300 0 0 1 600 303 V600 Z" fill={mix(bg, "#FFFFFF", 0.36)} />);
        L.push(<path key={key()} d="M-38 600 V304 A338 338 0 0 1 638 304" fill="none" stroke={accent} strokeOpacity={0.46} strokeWidth={3} />);
        L.push(<circle key={key()} cx={297} cy={304} r={112} fill={bg} />);
        L.push(T(initials, 297, 333, F.serif2, 99, 184, { fill: ink }));
        L.push(<path key={key()} d="M649 97 V503" stroke={accent} strokeWidth={1.5} strokeOpacity={0.55} />);
        L.push(T(design.salon, 833, 215, F.serif2, 57, 346, { fill: accent, upper: true }));
        L.push(T(design.backTitle, 833, 289, F.script, 72, 348, { fill: accent }));
        L.push(T(design.backLine1, 833, 334, F.sans, 18, 348, { fill: accent }));
        L.push(T(design.phone, 833, 414, F.sans, 20, 348, { fill: accent }));
        L.push(T(design.social || design.website, 833, 448, F.sans, 20, 348, { fill: accent }));
      }
      break;
    }
    case "boho": {
      L.push(
        <defs key={key()}>
          <linearGradient id={`${uid}-boho`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={mix(bg, "#FFFFFF", 0.22)} />
            <stop offset="55%" stopColor={bg} />
            <stop offset="100%" stopColor={mix(bg, "#8B7466", 0.14)} />
          </linearGradient>
        </defs>,
        <rect key={key()} width={W} height={H} fill={`url(#${uid}-boho)`} />,
        <rect key={key()} x={27} y={27} width={W - 54} height={H - 54} fill="none" stroke={accent} strokeWidth={4} />,
        <rect key={key()} x={39} y={39} width={W - 78} height={H - 78} fill="none" stroke={mix(accent, ink, 0.18)} strokeWidth={1.2} />,
      );
      if (!back) {
        L.push(
          <Pampas key={key()} x={58} y={545} scale={1.02} color={mix(ink, bg, 0.52)} />,
          <Pampas key={key()} x={992} y={555} scale={0.9} color={mix(ink, bg, 0.48)} flip />,
          <path key={key()} d="M34 575 H200 V427 Q153 404 106 427 V575" fill={mix(bg, "#FFFFFF", 0.68)} stroke={mix(bg, ink, 0.22)} strokeWidth={2} />,
          <ellipse key={key()} cx={864} cy={510} rx={72} ry={26} fill={mix(bg, ink, 0.16)} />,
          <rect key={key()} x={802} y={388} width={124} height={119} rx={11} fill={mix(bg, "#FFFFFF", 0.7)} />,
          <path key={key()} d="M864 400 Q844 360 862 336 Q880 362 864 400" fill={accent} fillOpacity={0.75} />,
        );
        L.push(T(design.salon, C, 111, F.serif2, 39, 650, { upper: true, spacing: 0.16 }));
        L.push(T(design.tagline, C, 156, F.script, 52, 600, { fill: mix(ink, accent, 0.35) }));
        L.push(T(design.title, C, 298, F.serif, 105, 835, { upper: true, spacing: 0.05, fill: mix(accent, ink, 0.28) }));
        L.push(T("Loyalty", C, 397, F.script, 126, 665, { fill: mix(ink, accent, 0.4) }));
        L.push(T(design.website || design.social, C, 526, F.sans, 18, 610, { upper: true, spacing: 0.24 }));
      } else {
        L.push(<Pampas key={key()} x={978} y={548} scale={0.55} color={mix(ink, bg, 0.5)} flip />);
        L.push(T(design.title, C, 105, F.serif, 58, 790, { upper: true, spacing: 0.1 }));
        L.push(T(offer, C, 145, F.script, 41, 820, { fill: mix(ink, accent, 0.28) }));
        L.push(...stamps({ x: 100, y: 172, w: 850, h: 300 }, 5, { shape: "heart", fill: mix(bg, "#FFFFFF", 0.2), stroke: accent, strokeW: 3.5, specialFill: accent, specialText: ink }));
        L.push(T(design.website || design.social, C, 531, F.serif2, 23, 800, { upper: true, spacing: 0.22 }));
      }
      break;
    }
    case "lineart": {
      L.push(<rect key={key()} x={30} y={30} width={W - 60} height={H - 60} fill="none" stroke={ink} strokeWidth={2.2} />);
      if (!back) {
        L.push(
          <path key={key()} d="M135 374 C82 357 82 322 119 293 C145 272 164 269 171 244 C173 215 188 190 208 181 C223 177 238 184 245 195 C252 206 253 227 242 237 C230 245 222 234 211 235 C201 236 191 251 190 268 C200 293 225 318 237 360 C246 390 249 441 267 493" fill="none" stroke={ink} strokeWidth={3.1} strokeLinecap="round" strokeLinejoin="round" />,
          <path key={key()} d="M207 185 C184 192 165 205 150 222 C140 234 138 252 146 261 C155 267 165 260 169 247 M225 182 C206 195 191 209 181 227 C173 244 178 256 188 257" fill="none" stroke={ink} strokeWidth={2.6} strokeLinecap="round" />,
          <path key={key()} d="M247 233 C279 230 304 241 320 270 C335 300 356 314 385 317 M243 253 C275 269 292 288 300 326 C305 350 323 365 344 373" fill="none" stroke={ink} strokeWidth={3} strokeLinecap="round" />,
          <path key={key()} d="M92 424 C121 393 146 394 171 407 C196 422 213 453 234 484 M119 294 C101 302 76 323 78 351 C81 370 115 388 154 393" fill="none" stroke={ink} strokeWidth={2.6} strokeLinecap="round" />,
          <path key={key()} d="M219 249 C227 245 234 246 242 251 M215 270 Q231 278 246 270" fill="none" stroke={ink} strokeWidth={2.1} strokeLinecap="round" />,
        );
        L.push(T(design.salon, 730, 243, F.serif2, 77, 485, { upper: true }));
        L.push(T(design.tagline, 730, 326, F.script, 73, 475, { fill: accent }));
        L.push(T(design.title, 730, 403, F.sans, 22, 460, { upper: true, spacing: 0.25 }));
      } else {
        L.push(<path key={key()} d="M70 65 H980 M70 533 H980" stroke={ink} strokeWidth={2} />);
        L.push(T(design.title, C, 145, F.serif2, 82, 865, { upper: true }));
        L.push(T(offer, C, 192, F.script, 47, 880, { fill: accent }));
        L.push(...stamps({ x: 92, y: 220, w: 865, h: 235 }, 5, { shape: "circle", fill: "none", stroke: ink, strokeW: 2.5, specialFill: accent, specialText: bg }));
        L.push(T(design.social, 306, 511, F.sans, 21, 380));
        L.push(T(design.phone, 744, 511, F.sans, 21, 380));
      }
      break;
    }
    case "platinum": {
      L.push(
        <defs key={key()}>
          <linearGradient id={`${uid}-pearl`} x1="0" y1="0" x2="0.9" y2="1">
            <stop offset="0%" stopColor={mix(bg, "#A79885", 0.22)} />
            <stop offset="35%" stopColor={mix(bg, "#FFFFFF", 0.72)} />
            <stop offset="63%" stopColor={bg} />
            <stop offset="100%" stopColor={mix(bg, accent, 0.24)} />
          </linearGradient>
        </defs>,
        <rect key={key()} width={W} height={H} rx={31} fill={`url(#${uid}-pearl)`} />,
      );
      if (!back) {
        L.push(T(design.salon, C, 105, F.sans, 19, 660, { upper: true, spacing: 0.34 }));
        L.push(<circle key={key()} cx={938} cy={99} r={59} fill={mix(ink, bg, 0.36)} />);
        L.push(T(initials, 938, 115, F.serif2, 42, 88, { fill: bg }));
        L.push(T(design.title, C, 278, F.serif2, 114, 940, { upper: true, spacing: 0.025 }));
        L.push(T(design.memberNo, 95, 383, F.serif2, 46, 780, { anchor: "start", spacing: 0.25 }));
        L.push(T("HẠN DÙNG", 95, 486, F.sans, 18, 240, { anchor: "start", upper: true, spacing: 0.18 }));
        L.push(T(design.valid, 95, 526, F.bold, 29, 200, { anchor: "start" }));
        L.push(<circle key={key()} cx={734} cy={481} r={53} fill="#FFFFFF" />, <circle key={key()} cx={808} cy={481} r={53} fill={accent} fillOpacity={0.72} />);
        L.push(<path key={key()} d="M898 460 q16 21 0 42 M918 448 q24 33 0 66 M938 437 q34 45 0 89" fill="none" stroke={ink} strokeWidth={7} strokeLinecap="round" />);
      } else {
        L.push(<rect key={key()} x={0} y={57} width={W} height={106} fill={accent} fillOpacity={0.55} />);
        L.push(T(design.salon, C, 126, F.serif2, 46, 870, { upper: true, spacing: 0.13 }));
        L.push(...stamps({ x: 70, y: 205, w: 530, h: 255 }, 5, { shape: "dotted", fill: "none", stroke: ink, strokeW: 3.1, specialFill: accent, specialText: bg }));
        L.push(T(offer, 644, 246, F.sans, 24, 345, { anchor: "start", upper: true, spacing: 0.08 }));
        L.push(design.qr.trim() ? <rect key={key()} x={644} y={300} width={176} height={176} rx={4} fill="#FFFFFF" /> : null);
        L.push(qr(657, 313, 150, "#28241F"));
        L.push(T(design.social, 70, 535, F.sans, 20, 425, { anchor: "start" }));
        L.push(T(design.website, 980, 535, F.sans, 20, 425, { anchor: "end" }));
      }
      break;
    }
    case "noirscript": {
      if (!back) {
        L.push(<rect key={key()} width={W} height={H} fill={ink} />);
        L.push(<path key={key()} d="M72 105 H978 M72 495 H978" stroke={bg} strokeOpacity={0.32} strokeWidth={1.2} />);
        L.push(T(design.title, C, 325, F.script, 171, 905, { fill: bg }));
        L.push(T(design.salon, C, 412, F.sans, 22, 790, { upper: true, spacing: 0.43, fill: bg }));
      } else {
        L.push(<path key={key()} d="M520 65 V530" stroke={ink} strokeWidth={2.2} />);
        L.push(...stamps({ x: 75, y: 100, w: 395, h: 325 }, 3, { shape: "circle", fill: "none", stroke: ink, strokeW: 2.5, specialFill: ink, specialText: bg }));
        L.push(T(offer, 272, 490, F.sans, 19, 390, { upper: true, spacing: 0.13 }));
        L.push(<circle key={key()} cx={785} cy={150} r={77} fill={ink} />);
        L.push(T(initials, 785, 172, F.script, 82, 115, { fill: bg }));
        L.push(T(design.salon, 785, 338, F.script, 85, 420));
        L.push(T(design.website, 785, 396, F.sans, 20, 430));
        L.push(T(design.social, 785, 432, F.sans, 20, 430));
        L.push(T(design.phone, 785, 468, F.sans, 20, 430));
        L.push(<path key={key()} d="M640 505 H930" stroke={ink} strokeOpacity={0.45} />);
      }
      break;
    }
    case "editorial": {
      if (!back) {
        L.push(<path key={key()} d="M54 72 H996 M54 527 H996" stroke={ink} strokeWidth={1.6} />);
        L.push(T("NAIL STUDIO · MEMBERS CLUB", C, 119, F.sans, 17, 760, { upper: true, spacing: 0.29 }));
        L.push(T(design.salon, C, 272, F.serif2, 122, 930, { upper: true, spacing: 0.01 }));
        L.push(T(design.title, C, 363, F.script, 103, 780, { fill: mix(ink, bg, 0.4) }));
        L.push(T("KẾT NỐI VỚI CHÚNG TÔI", C, 435, F.sans, 17, 650, { upper: true, spacing: 0.2 }));
        L.push(T([design.website, design.social, design.phone].filter((s) => s.trim()).join("    ·    "), C, 488, F.sans, 19, 870));
      } else {
        L.push(T(design.salon, C, 102, F.serif2, 86, 920, { upper: true, spacing: 0.04 }));
        L.push(T(offer, C, 152, F.sans, 19, 860, { upper: true, spacing: 0.16 }));
        L.push(...stamps({ x: 110, y: 179, w: 830, h: 278 }, 5, { shape: "heart", fill: "#FFFFFF", stroke: mix(ink, bg, 0.75), strokeW: 2.2, specialFill: accent, specialText: ink }));
        L.push(<path key={key()} d="M120 485 H930" stroke={ink} strokeOpacity={0.32} strokeWidth={1.4} />);
        L.push(T(design.social, 270, 535, F.sans, 19, 400));
        L.push(T(design.phone, 780, 535, F.sans, 19, 400));
      }
      break;
    }
    case "minimal": {
      if (!back) {
        L.push(T(design.salon, C, 80, F.serif2, 26, 700, { upper: true, spacing: 0.3, opacity: 0.75 }));
        L.push(T(design.title, C, 160, F.serif2, 64, 920, { upper: true, spacing: 0.26 }));
        L.push(T(offer, C, 204, F.sans, 19, 820, { upper: true, spacing: 0.18 }));
        L.push(...stamps({ x: 110, y: 232, w: 830, h: 250 }, 6, { shape: "circle", fill: "none", stroke: ink, strokeW: 2.2, specialFill: accent, specialText: bg }));
        L.push(T(design.website, 70, 552, F.sans, 19, 380, { anchor: "start" }));
        L.push(T(design.phone, C, 552, F.sans, 19, 220));
        L.push(T(design.social, W - 70, 552, F.sans, 19, 380, { anchor: "end" }));
      } else {
        L.push(<rect key={key()} x={35} y={35} width={W - 70} height={H - 70} fill="none" stroke={ink} strokeWidth={1.4} />);
        L.push(<path key={key()} d="M390 285 H660 M390 301 H660" stroke={ink} strokeWidth={1.2} />);
        L.push(T(initials, C, 264, F.serif2, 146, 380, { spacing: 0.1 }));
        L.push(T(design.salon, C, 374, F.serif2, 64, 850, { upper: true, spacing: 0.18 }));
        L.push(T(design.backTitle, C, 419, F.sans, 17, 700, { spacing: 0.42, opacity: 0.72 }));
        L.push(T([design.website, design.phone, design.social].filter((s) => s.trim()).join("   ·   "), C, 513, F.sans, 18, 850));
      }
      break;
    }
    case "signature": {
      if (!back) {
        L.push(T(design.title, C, 150, F.script, 124, 900));
        L.push(T(offer, C, 212, F.sans, 22, 900, { upper: true, spacing: 0.22 }));
        L.push(...stamps({ x: 170, y: 236, w: 710, h: 214 }, 5, { shape: "circle", fill: "none", stroke: ink, strokeW: 4, specialFill: accent, specialText: bg }));
        L.push(<rect key={key()} y={H - 124} width={W} height={72} fill={ink} />);
        L.push(T(design.website || design.salon, C, H - 76, F.serif, 27, 860, { upper: true, spacing: 0.2, fill: bg }));
        L.push(T([design.salon, design.phone].filter((s) => s.trim()).join("  ·  "), C, H - 18, F.sans, 16, 900, { opacity: 0.7 }));
      } else {
        L.push(<rect key={key()} width={W} height={H} fill={ink} />);
        L.push(<rect key={key()} x={30} y={30} width={W - 60} height={H - 60} fill="none" stroke={bg} strokeOpacity={0.7} strokeWidth={1.5} />);
        L.push(T(design.backTitle, C, 122, F.sans, 18, 790, { fill: bg, upper: true, spacing: 0.38 }));
        L.push(T(design.salon, C, 315, F.script, 142, 830, { fill: bg }));
        L.push(<path key={key()} d="M270 354 C390 382 660 382 780 354" fill="none" stroke={bg} strokeWidth={2} strokeLinecap="round" />);
        L.push(T(design.social, C, 437, F.serif2, 29, 760, { fill: bg }));
        L.push(T([design.phone, design.website].filter((s) => s.trim()).join("   ·   "), C, 488, F.sans, 18, 800, { fill: bg }));
      }
      break;
    }
    case "insta": {
      if (!back) {
        const handle = design.social.replace(/^@/, "") || design.salon;
        L.push(T("‹", 34, 76, F.sans, 44, 40, { anchor: "start" }));
        L.push(T(handle, C, 72, F.bold, 25, 360));
        L.push(<circle key={key()} cx={W - 44} cy={64} r={3.5} fill={ink} />, <circle key={key()} cx={W - 58} cy={64} r={3.5} fill={ink} />, <circle key={key()} cx={W - 30} cy={64} r={3.5} fill={ink} />);
        L.push(<path key={key()} d={star(W - 100, 64, 12)} fill="none" stroke={ink} strokeWidth={2.4} />);
        L.push(
          <defs key={key()}>
            <linearGradient id={`${uid}-ig`} x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="#F58529" />
              <stop offset="50%" stopColor="#DD2A7B" />
              <stop offset="100%" stopColor="#8134AF" />
            </linearGradient>
          </defs>,
          <circle key={key()} cx={108} cy={178} r={64} fill="none" stroke={`url(#${uid}-ig)`} strokeWidth={6} />,
          <circle key={key()} cx={108} cy={178} r={55} fill={accent} />,
        );
        L.push(T(initials, 108, 196, F.serif, 50, 80, { fill: bg }));
        ["bài viết", "theo dõi", "yêu thích"].forEach((label, i) => {
          const x = 280 + i * 108;
          const s = 0.5;
          L.push(<path key={key()} d={HEART} transform={`translate(${x - 50 * s} ${150 - 55 * s}) scale(${s})`} fill={ink} />);
          L.push(T(label, x, 208, F.sans, 17, 104));
        });
        L.push(T(design.salon, 44, 282, F.bold, 24, 512, { anchor: "start" }));
        L.push(T(design.tagline, 44, 316, F.sans, 19, 512, { anchor: "start" }));
        L.push(T(offer, 44, 346, F.sans, 19, 512, { anchor: "start" }));
        L.push(<path key={key()} d="M46 372 l6 -6 a5 5 0 0 1 7 7 l-6 6 M58 364 l-6 6 a5 5 0 0 1 -7 -7 l6 -6" fill="none" stroke={accent} strokeWidth={2.4} strokeLinecap="round" />);
        L.push(T(design.website, 72, 378, F.sans, 19, 480, { anchor: "start", fill: accent }));
        ["Theo dõi", "Nhắn tin", "Gọi ngay"].forEach((label, i) => {
          L.push(<rect key={key()} x={44 + i * 174} y={400} width={164} height={42} rx={10} fill={ink} />);
          L.push(T(label, 44 + i * 174 + 82, 428, F.bold, 18, 150, { fill: bg }));
        });
        [128, C, W - 128].forEach((x) => L.push(<rect key={key()} x={x - 13} y={464} width={26} height={26} rx={4} fill="none" stroke={ink} strokeWidth={2.2} />));
        L.push(<path key={key()} d={`M115 473 H141 M115 481 H141 M124 464 V490 M132 464 V490`} stroke={ink} strokeWidth={1.4} />);
        L.push(<path key={key()} d={`M44 505 H${W - 44}`} stroke={ink} strokeOpacity={0.3} strokeWidth={1.5} />);
        L.push(...stamps({ x: 44, y: 515, w: W - 88, h: 440 }, 3, { shape: "circle", fill: "#FFFFFF", stroke: "none", strokeW: 0, specialFill: accent, specialText: bg, finalShape: "heart" }));
        const navY = 1005;
        [70, 185, C, 415, 530].forEach((x, i) => {
          if (i === 0) L.push(<path key={key()} d={`M${x - 14} ${navY + 12} V${navY - 2} L${x} ${navY - 14} L${x + 14} ${navY - 2} V${navY + 12} Z`} fill={ink} />);
          if (i === 1) L.push(<circle key={key()} cx={x - 3} cy={navY - 3} r={10} fill="none" stroke={ink} strokeWidth={2.4} />, <path key={key()} d={`M${x + 4} ${navY + 4} L${x + 12} ${navY + 12}`} stroke={ink} strokeWidth={2.4} strokeLinecap="round" />);
          if (i === 2) L.push(<rect key={key()} x={x - 13} y={navY - 13} width={26} height={26} rx={6} fill="none" stroke={ink} strokeWidth={2.4} />, <path key={key()} d={`M${x} ${navY - 7} V${navY + 7} M${x - 7} ${navY} H${x + 7}`} stroke={ink} strokeWidth={2.4} />);
          if (i === 3) L.push(<rect key={key()} x={x - 13} y={navY - 13} width={26} height={26} rx={6} fill="none" stroke={ink} strokeWidth={2.4} />, <path key={key()} d={`M${x - 3} ${navY - 6} L${x + 6} ${navY} L${x - 3} ${navY + 6} Z`} fill={ink} />);
          if (i === 4) L.push(<circle key={key()} cx={x} cy={navY} r={13} fill={accent} stroke={ink} strokeWidth={2} />);
        });
      } else {
        L.push(<circle key={key()} cx={C} cy={205} r={112} fill={accent} />, <circle key={key()} cx={C} cy={205} r={100} fill="none" stroke={bg} strokeOpacity={0.6} strokeWidth={2} />);
        L.push(<LogoIcon key={key()} id="nails" x={C} y={205} size={130} primary={bg} accent={mix(bg, accent, 0.45)} />);
        L.push(T(design.salon, C, 410, F.serif, 54, 470, { upper: true }));
        L.push(T(design.tagline, C, 482, F.script, 70, 440));
        L.push(T(design.backTitle, C, 570, F.sans, 21, 480, { upper: true, spacing: 0.22 }));
        L.push(qr(C - 118, 598, 236, ink));
        L.push(T(design.social, C, 900, F.sans, 22, 520));
        L.push(T(design.phone, C, 938, F.sans, 20, 520, { opacity: 0.85 }));
        L.push(T(design.website, C, 974, F.sans, 20, 520, { opacity: 0.85 }));
      }
      break;
    }
    case "welcome": {
      if (!back) {
        const arcSize = Math.min(22, (260 / Math.max(6, design.salon.length)) * 1.7);
        L.push(
          <defs key={key()}>
            <path id={`${uid}-arc`} d={`M${C - 92} 160 A92 92 0 0 1 ${C + 92} 160`} />
          </defs>,
          <text key={key()} fontFamily="'Cormorant Garamond'" fontWeight={600} fontSize={arcSize} letterSpacing={arcSize * 0.25} fill={ink} textAnchor="middle">
            <textPath href={`#${uid}-arc`} startOffset="50%">
              {design.salon.toLocaleUpperCase("vi")}
            </textPath>
          </text>,
          sparkle(C, 150, 9),
        );
        L.push(T("Chào mừng", C, 440, F.script, 146, 500));
        L.push(T("đến với", 140, 512, F.serif2, 34, 200, { anchor: "start", upper: true, spacing: 0.12 }));
        L.push(T("gia đình", C + 40, 630, F.script, 146, 470));
        L.push(sparkle(100, 330, 13), sparkle(500, 510, 10), sparkle(466, 690, 15), sparkle(122, 690, 8));
        L.push(<path key={key()} d={`M${C - 60} 800 H${C + 60}`} stroke={ink} strokeOpacity={0.5} strokeWidth={1.5} />);
        L.push(T(design.salon, C, 870, F.serif2, 44, 500, { upper: true, spacing: 0.06 }));
        L.push(T(design.phone, C, 918, F.sans, 20, 500, { opacity: 0.85 }));
        L.push(T(design.website, C, 952, F.sans, 20, 500, { opacity: 0.85 }));
      } else {
        L.push(T(design.backTitle, C, 175, F.script, 130, 520));
        L.push(T(design.backLine1, 118, 238, F.serif2, 30, 160, { anchor: "start", upper: true, spacing: 0.15 }));
        L.push(T(design.backLine2, C + 30, 335, F.script, 130, 470));
        L.push(sparkle(500, 120, 11), sparkle(92, 330, 8));
        L.push(T(offer, C, 408, F.sans, 22, 520));
        L.push(...stamps({ x: 70, y: 430, w: 460, h: 420 }, 3, { shape: "heart", fill: "none", stroke: ink, strokeW: 3, specialFill: accent, specialText: bg }));
        L.push(T(design.social, C, 905, F.sans, 20, 520));
        L.push(T(design.phone, C, 940, F.sans, 20, 520, { opacity: 0.85 }));
        L.push(T(design.website, C, 975, F.sans, 20, 520, { opacity: 0.85 }));
      }
      break;
    }
    case "vip": {
      // Nền kim loại chuyển sắc như thẻ ngân hàng.
      L.push(
        <defs key={key()}>
          <linearGradient id={`${uid}-metal`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={mix(bg, "#FFFFFF", dark ? 0.12 : 0.4)} />
            <stop offset="45%" stopColor={bg} />
            <stop offset="72%" stopColor={mix(bg, "#000000", dark ? 0.35 : 0.14)} />
            <stop offset="100%" stopColor={mix(bg, "#FFFFFF", dark ? 0.08 : 0.3)} />
          </linearGradient>
        </defs>,
        <rect key={key()} width={W} height={H} fill={`url(#${uid}-metal)`} />,
      );
      const light = dark ? mix(bg, "#FFFFFF", 0.1) : "#FFFFFF";
      if (!back) {
        L.push(T(design.salon, C, 90, F.serif, 30, 600, { upper: true, spacing: 0.04 }));
        L.push(<circle key={key()} cx={W - 112} cy={98} r={58} fill={dark ? ink : "#FFFFFF"} />);
        L.push(T(initials, W - 112, 114, F.serif, 42, 80, { fill: dark ? bg : ink }));
        const vip = "VIP";
        const vw = widthOf(vip, F.serif, 196);
        L.push(T(vip, 76, 320, F.serif, 196, 400, { anchor: "start" }));
        L.push(T(design.title, 76 + vw + 26, 300, F.script, 108, W - 70 - (76 + vw + 26), { anchor: "start" }));
        L.push(T(design.memberNo, 80, 410, F.serif, 44, 820, { anchor: "start", spacing: 0.24 }));
        L.push(T("Hạn dùng", 82, 490, F.bold, 16, 200, { anchor: "start", upper: true, spacing: 0.2 }));
        L.push(T(design.valid, 82, 528, F.sans, 30, 200, { anchor: "start", spacing: 0.08 }));
        L.push(<circle key={key()} cx={W - 262} cy={480} r={52} fill={mix(bg, dark ? "#FFFFFF" : "#000000", dark ? 0.3 : 0.25)} />);
        L.push(<circle key={key()} cx={W - 192} cy={480} r={52} fill={light} fillOpacity={0.9} />);
        L.push(<path key={key()} d={`M${W - 110} 458 q12 22 0 44 M${W - 94} 446 q20 34 0 68 M${W - 78} 434 q28 46 0 92`} fill="none" stroke={ink} strokeWidth={6} strokeLinecap="round" />);
      } else {
        L.push(<rect key={key()} y={55} width={W} height={100} fill={dark ? "#050505" : "#121212"} fillOpacity={0.96} />);
        L.push(...stamps({ x: 55, y: 190, w: 505, h: 280 }, 5, { shape: "dotted", fill: light, stroke: ink, strokeW: 3.5, specialFill: dark ? ink : "#111111", specialText: dark ? bg : "#FFFFFF" }));
        // Ưu đãi xuống dòng theo từ, chia đều độ dài các dòng (tối đa 3 dòng).
        const words = offer.split(/\s+/);
        const per = Math.ceil(offer.length / Math.min(3, Math.ceil(offer.length / 20))) + 2;
        const lines: string[] = [];
        for (const w of words) {
          const last = lines[lines.length - 1];
          if (last && (last + " " + w).length <= per) lines[lines.length - 1] = last + " " + w;
          else lines.push(w);
        }
        Array.from({ length: 3 }, (_, i) => L.push(lines[i] ? T(lines[i], 600, 222 + i * 36, F.serif2, 26, W - 660, { anchor: "start", upper: true, spacing: 0.04 }) : null));
        L.push(design.qr.trim() ? <rect key={key()} x={592} y={322} width={166} height={166} rx={8} fill="#FFFFFF" /> : null, qr(600, 330, 150, "#111111"));
        L.push(T(design.social, 58, H - 40, F.serif2, 24, 440, { anchor: "start", upper: true, spacing: 0.05 }));
        L.push(T(design.website, W - 58, H - 40, F.serif2, 24, 440, { anchor: "end", upper: true, spacing: 0.05 }));
      }
      break;
    }
    case "marble": {
      L.push(<Veins key={key()} W={W} H={H} dark={false} gold={accent} seed={hash(design.templateId)} id={uid} />);
      L.push(<rect key={key()} x={22} y={22} width={W - 44} height={H - 44} fill="none" stroke={accent} strokeWidth={2} />);
      if (!back) {
        L.push(T(design.title, C, 140, F.script, 104, 800, { fill: accent }));
        L.push(T(design.salon, C, 196, F.serif2, 26, 700, { upper: true, spacing: 0.3 }));
        L.push(...stamps({ x: 150, y: 222, w: 750, h: 245 }, 5, { shape: "circle", fill: "#FFFFFF", stroke: accent, strokeW: 2.6, specialFill: accent, specialText: "#FFFFFF" }));
        L.push(T(offer, C, H - 88, F.sans, 20, 800, { upper: true, spacing: 0.15 }));
        L.push(T([design.phone, design.website].filter((s) => s.trim()).join("  ·  "), C, H - 50, F.sans, 18, 800, { opacity: 0.8 }));
      } else {
        L.push(<circle key={key()} cx={C} cy={236} r={138} fill={mix(bg, "#FFFFFF", 0.72)} stroke={accent} strokeWidth={2.4} />);
        L.push(<circle key={key()} cx={C} cy={236} r={124} fill="none" stroke={accent} strokeOpacity={0.6} strokeWidth={1.2} />);
        L.push(T(initials, C, 274, F.serif2, 122, 230, { fill: accent }));
        L.push(T(design.salon, C, 435, F.serif2, 66, 870, { upper: true, spacing: 0.08 }));
        L.push(<path key={key()} d="M400 467 H650" stroke={accent} strokeWidth={2} />);
        L.push(T(design.backTitle, C, 499, F.sans, 16, 500, { fill: accent, spacing: 0.33 }));
        L.push(T([design.phone, design.website, design.social].filter((s) => s.trim()).join("   ·   "), C, 546, F.sans, 17, 880));
      }
      break;
    }
    case "hearts": {
      if (!back) {
        L.push(T(design.title, 205, 190, F.script, 92, 340, { fill: accent }));
        L.push(T(design.salon, 205, 252, F.serif, 30, 340, { upper: true, spacing: 0.04 }));
        L.push(T(offer, 205, 300, F.sans, 18, 340));
        L.push(sparkle(70, 90, 12, accent), sparkle(350, 110, 8, accent), sparkle(90, 350, 10, accent));
        L.push(T(design.phone, 205, 420, F.sans, 18, 340));
        L.push(T(design.website, 205, 452, F.sans, 18, 340, { opacity: 0.85 }));
        L.push(T(design.social, 205, 484, F.sans, 18, 340, { opacity: 0.85 }));
        L.push(<path key={key()} d="M410 80 V520" stroke={accent} strokeOpacity={0.4} strokeWidth={2} />);
        L.push(...stamps({ x: 440, y: 110, w: 570, h: 380 }, 4, { shape: "heart", fill: "#FFFFFF", stroke: accent, strokeW: 3, specialFill: accent, specialText: "#FFFFFF" }));
      } else {
        L.push(<circle key={key()} cx={282} cy={290} r={206} fill={mix(bg, "#FFFFFF", 0.52)} />);
        L.push(<path key={key()} d={HEART} transform="translate(112 122) scale(3.4)" fill={accent} fillOpacity={0.88} />);
        L.push(sparkle(92, 114, 15, accent), sparkle(482, 97, 10, accent), sparkle(456, 465, 12, accent));
        L.push(T(design.salon, 758, 235, F.script, 92, 470, { fill: accent }));
        L.push(T(design.backTitle, 758, 302, F.sans, 18, 430, { upper: true, spacing: 0.2 }));
        L.push(<path key={key()} d="M565 335 H950" stroke={accent} strokeOpacity={0.55} strokeWidth={1.5} />);
        L.push(T(design.phone, 758, 390, F.sans, 21, 430));
        L.push(T(design.social, 758, 431, F.sans, 20, 430));
        L.push(T(design.website, 758, 472, F.sans, 20, 430));
      }
      break;
    }
    case "nude": {
      if (!back) {
        L.push(T(design.salon, C, 96, F.serif, 46, 800));
        L.push(T(design.title, C, 142, F.sans, 20, 700, { upper: true, spacing: 0.35 }));
        L.push(...stamps({ x: 90, y: 162, w: 870, h: 300 }, 5, { shape: "nail", fill: mix(bg, "#FFFFFF", 0.55), stroke: accent, strokeW: 2, specialFill: accent, specialText: bg }));
        L.push(T(offer, C, H - 100, F.sans, 20, 820, { upper: true, spacing: 0.12 }));
        L.push(<rect key={key()} y={H - 74} width={W} height={74} fill={accent} />);
        L.push(T([design.phone, design.website, design.social].filter((s) => s.trim()).join("   ·   "), C, H - 29, F.sans, 19, 960, { fill: bg }));
      } else {
        L.push(<rect key={key()} x={0} y={0} width={W} height={H} fill={mix(bg, "#FFFFFF", 0.24)} />);
        L.push(<rect key={key()} x={43} y={43} width={W - 86} height={H - 86} rx={26} fill="none" stroke={accent} strokeOpacity={0.6} strokeWidth={2} />);
        L.push(<rect key={key()} x={86} y={86} width={286} height={428} rx={143} fill={mix(bg, "#FFFFFF", 0.55)} />);
        L.push(<LogoIcon key={key()} id="polish" x={229} y={295} size={230} primary={accent} accent={mix(accent, "#FFFFFF", 0.38)} />);
        L.push(T(design.salon, 681, 231, F.serif, 70, 510));
        L.push(T(design.backTitle, 681, 283, F.sans, 18, 500, { upper: true, spacing: 0.3, fill: accent }));
        L.push(<path key={key()} d="M450 313 H915" stroke={accent} strokeWidth={1.5} />);
        L.push(T(design.phone, 681, 370, F.sans, 22, 500));
        L.push(T(design.social, 681, 411, F.sans, 20, 500));
        L.push(T(design.website, 681, 452, F.sans, 20, 500));
      }
      break;
    }
    case "sage": {
      if (!back) {
        L.push(<path key={key()} d="M70 330 V220 A230 160 0 0 1 530 220 V330 Z" fill={mix(bg, "#FFFFFF", 0.5)} stroke={accent} strokeWidth={2.2} />);
        L.push(<LogoIcon key={key()} id="leaf" x={C} y={140} size={92} primary={accent} accent={mix(accent, "#FFFFFF", 0.55)} />);
        L.push(T(design.salon, C, 268, F.serif, 44, 420));
        L.push(T(design.tagline, C, 306, F.sans, 17, 400, { upper: true, spacing: 0.25, fill: accent }));
        L.push(T(design.title, C, 398, F.bold, 24, 480, { upper: true, spacing: 0.3 }));
        L.push(T(offer, C, 438, F.sans, 19, 500));
        L.push(...stamps({ x: 60, y: 465, w: 480, h: 435 }, 3, { shape: "square", fill: mix(bg, "#FFFFFF", 0.6), stroke: accent, strokeW: 2, specialFill: accent, specialText: bg }));
        L.push(T(design.phone, C, 950, F.sans, 20, 500));
        L.push(T([design.website, design.social].filter((s) => s.trim()).join("  ·  "), C, 985, F.sans, 17, 500, { opacity: 0.8 }));
      } else {
        L.push(<path key={key()} d="M58 978 V360 A242 280 0 0 1 542 360 V978 Z" fill={mix(bg, "#FFFFFF", 0.45)} stroke={accent} strokeWidth={2.5} />);
        L.push(<path key={key()} d="M82 952 V367 A218 256 0 0 1 518 367 V952 Z" fill="none" stroke={accent} strokeOpacity={0.55} strokeWidth={1.5} />);
        L.push(<LogoIcon key={key()} id="leaf" x={C} y={327} size={158} primary={accent} accent={mix(accent, "#FFFFFF", 0.5)} />);
        L.push(T(design.salon, C, 516, F.serif, 62, 420));
        L.push(T(design.tagline, C, 561, F.sans, 19, 390, { upper: true, spacing: 0.28, fill: accent }));
        L.push(<path key={key()} d="M198 614 H402" stroke={accent} strokeWidth={1.6} />);
        L.push(T(design.backTitle, C, 673, F.serif2, 32, 420, { upper: true, spacing: 0.12 }));
        L.push(T(design.phone, C, 767, F.sans, 21, 420));
        L.push(T(design.social, C, 808, F.sans, 20, 420));
        L.push(T(design.website, C, 849, F.sans, 20, 420));
      }
      break;
    }
  }

  // Một số thành phần gồm hai nét kề nhau nhưng được thao tác như một vật thể:
  // nền trắng + mã QR, hoặc vòng tròn + chữ ở giữa (logo/ô quà).
  const layers = [...L];
  for (let i = 0; i < layers.length - 1; i++) {
    const a = layers[i];
    const b = layers[i + 1];
    if (!isValidElement<Record<string, unknown>>(a) || !isValidElement<Record<string, unknown>>(b)) continue;
    const qrPair = a.type === "rect" && b.props["data-card-semantic"] === "qr";
    const circleTextPair = a.type === "circle" && b.type === "text" &&
      Math.abs(Number(a.props.cx) - Number(b.props.x)) < Number(a.props.r) * 0.75 &&
      Math.abs(Number(a.props.cy) - Number(b.props.y)) < Number(a.props.r) * 0.75;
    if (!qrPair && !circleTextPair) continue;
    layers[i] = <g key={`pair-${i}`} data-card-group-label={qrPair ? "Mã QR" : "Logo / ô quà"}>{a}{b}</g>;
    layers[i + 1] = null;
    i++;
  }

  return (
    <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg" className={className} role="img" aria-label={`${design.title} – ${design.salon}`} data-card-side={side} style={editing ? { touchAction: "none" } : undefined} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
      <rect width={W} height={H} fill={bg} />
      {layers.map((node, index) => {
        if (!isValidElement<Record<string, unknown>>(node)) return node;
        const props = node.props;
        // Nền phủ toàn thẻ và định nghĩa màu không phải đối tượng cần kéo.
        if (node.type === "defs" || (node.type === "rect" && Number(props.width) === W && Number(props.height) === H && Number(props.x ?? 0) === 0 && Number(props.y ?? 0) === 0)) return node;
        const layerId = `layer-${index}`;
        const transform = design.layout?.[side]?.[layerId] ?? { x: 0, y: 0, scale: 1 };
        const kind = typeof node.type === "string" ? node.type : "group";
        const label = typeof props["data-card-group-label"] === "string" ? props["data-card-group-label"] :
          kind === "text" && typeof props.children === "string" ? `Chữ: ${props.children.slice(0, 45)}` :
          kind === "circle" ? "Hình tròn / ô tích điểm" :
          kind === "rect" ? "Khung / dải màu" :
          kind === "path" ? "Họa tiết" : "Biểu tượng / nhóm hình";
        return <g key={layerId} transform={`translate(${transform.x} ${transform.y}) scale(${transform.scale})`} data-card-layer-id={editing ? layerId : undefined} data-card-layer-label={editing ? label : undefined} className={editing && selectedLayerId === layerId ? "card-layer-selected" : undefined} style={editing ? { cursor: "move" } : undefined} pointerEvents={editing ? "bounding-box" : undefined}>{node}</g>;
      })}
      <CardElementLayer elements={design.elements ?? []} side={side} width={W} selectedId={selectedElementId} editing={editing} />
    </svg>
  );
}
