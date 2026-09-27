import { useId, type ReactNode, type Ref } from "react";
import { VOUCHER_SIZE, type VoucherDesign } from "@/lib/voucher-templates";
import { F, HEART, mix, star, useSvgText } from "../design/svg-kit";

const { w: W, h: H } = VOUCHER_SIZE;
const C = W / 2;
const polar = (x: number, y: number, r: number, a: number) => [+(x + r * Math.cos(a)).toFixed(2), +(y + r * Math.sin(a)).toFixed(2)];

function Daisy({ x, y, r, petal, center }: { x: number; y: number; r: number; petal: string; center: string }) {
  return <g>{Array.from({ length: 10 }, (_, i) => <ellipse key={i} cx={x} cy={y - r * 0.75} rx={r * 0.23} ry={r * 0.52} fill={petal} stroke={center} strokeOpacity={0.26} transform={`rotate(${i * 36} ${x} ${y})`} />)}<circle cx={x} cy={y} r={r * 0.29} fill={center} /></g>;
}
function Blossom({ x, y, r, color, dot }: { x: number; y: number; r: number; color: string; dot: string }) {
  return <g>{Array.from({ length: 5 }, (_, i) => <ellipse key={i} cx={x} cy={y - r * 0.57} rx={r * 0.38} ry={r * 0.5} fill={color} transform={`rotate(${i * 72} ${x} ${y})`} />)}<circle cx={x} cy={y} r={r * 0.18} fill={dot} /></g>;
}
function Fan({ x, y, r, color, pale }: { x: number; y: number; r: number; color: string; pale: string }) {
  return <g><path d={`M${x} ${y} L${x - r} ${y - r * 0.5} A${r} ${r} 0 0 1 ${x + r} ${y - r * 0.5} Z`} fill={pale} stroke={color} strokeWidth={2} />{Array.from({ length: 11 }, (_, i) => { const [ex, ey] = polar(x, y, r, Math.PI * (1.17 + i * 0.066)); return <path key={i} d={`M${x} ${y} L${ex} ${ey}`} stroke={color} strokeOpacity={i % 2 ? 0.48 : 0.8} strokeWidth={1.8} />; })}<circle cx={x} cy={y} r={8} fill={color} /></g>;
}
function Shell({ x, y, r, color }: { x: number; y: number; r: number; color: string }) {
  return <g fill="none" stroke={color} strokeWidth={2.5}><path d={`M${x - r} ${y} A${r} ${r} 0 0 1 ${x + r} ${y} Q${x} ${y + r * 1.3} ${x - r} ${y}`} />{Array.from({ length: 11 }, (_, i) => { const [ex, ey] = polar(x, y, r, Math.PI + i * Math.PI / 10); return <path key={i} d={`M${x} ${y + r * 0.26} Q${x + (ex - x) * .42} ${y - r * .3} ${ex} ${ey}`} strokeOpacity={0.55} />; })}</g>;
}
function Tiles({ color, x = 0, y = 0, cols = 4, rows = 4, size = 54 }: { color: string; x?: number; y?: number; cols?: number; rows?: number; size?: number }) {
  return <g>{Array.from({ length: rows * cols }, (_, i) => {
    const cx = x + (i % cols) * size, cy = y + Math.floor(i / cols) * size;
    return <g key={i}><rect x={cx} y={cy} width={size} height={size} fill={i % 3 === 0 ? color : "none"} fillOpacity={0.33} stroke={color} strokeOpacity={0.5} strokeWidth={1.2} /><path d={`M${cx} ${cy + size} Q${cx + size / 2} ${cy} ${cx + size} ${cy + size}`} fill="none" stroke={color} strokeOpacity={0.5} /></g>;
  })}</g>;
}

// Each of the twenty additions has its own composition on both faces. Text uses
// the same editable voucher fields and vector export pipeline as the original ten.
export function VoucherFreshSvg({ design, side, svgRef, className }: { design: VoucherDesign; side: "front" | "back"; svgRef?: Ref<SVGSVGElement>; className?: string }) {
  const uid = useId().replace(/:/g, "");
  const { bg, ink, accent } = design.colors;
  const pale = mix(bg, "#FFFFFF", 0.7);
  const faint = mix(bg, accent, 0.18);
  const deep = mix(ink, accent, 0.35);
  const { T, key } = useSvgText(ink);
  const L: ReactNode[] = [];
  const contact = [design.phone, design.website].filter(Boolean).join("  ·  ");
  const meta = [design.code && `Mã ${design.code}`, design.expiry && `Hạn ${design.expiry}`].filter(Boolean).join("  ·  ");
  const label = (text: string, x: number, y: number, max = 850, color = accent) => T(text, x, y, F.sans, 15, max, { upper: true, spacing: 0.28, fill: color });
  const title = (x: number, y: number, size: number, max: number, font = F.serif2, color = ink) => T(design.title, x, y, font, size, max, { fill: color });
  const value = (x: number, y: number, size: number, max: number, color = accent) => T(design.value, x, y, F.serif, size, max, { fill: color });
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
  const heading = (x: number, y: number, size: number, max: number, font = F.serif2, color = ink) => T(design.backHeading, x, y, font, size, max, { fill: color });

  if (side === "front") switch (design.style) {
    case "lavender-arch": {
      L.push(<path key={key()} d="M68 548 V241 A222 202 0 0 1 512 241 V548 Z" fill={faint} stroke={accent} strokeWidth={3} />,
        <path key={key()} d="M89 546 V245 A201 181 0 0 1 491 245 V546" fill="none" stroke={accent} strokeOpacity={0.55} strokeWidth={1.5} />,
        <path key={key()} d="M290 38 V540" stroke={accent} strokeOpacity={0.35} />,
        <circle key={key()} cx={290} cy={263} r={111} fill={pale} stroke={accent} strokeWidth={2} />);
      L.push(label("Một khoảng riêng", 290, 108, 400), value(290, 283, 51, 285), salon(290, 349, 380),
        title(824, 132, 81, 620, F.script, accent), service(825, 188, 570), ...fields(590, 285, 555, 74), footer(825, 493, 600),
        T(design.terms, 825, 532, F.sans, 12, 600));
      break;
    }
    case "citrus-rays": {
      L.push(<circle key={key()} cx={1070} cy={55} r={354} fill={faint} />,
        ...Array.from({ length: 13 }, (_, i) => { const [x, y] = polar(1070, 55, 345, (i + 3) * Math.PI / 12); return line(1070, 55, x, y, accent, 0.45, 2.5); }),
        <path key={key()} d="M0 505 L1240 144 V585 H0 Z" fill={mix(bg, accent, 0.08)} />);
      L.push(salon(180, 86, 330), title(397, 195, 91, 690, F.bold), service(395, 240, 660), value(912, 319, 74, 395, ink),
        ...fields(110, 353, 600, 66), label("Một chút nắng", 920, 362, 400), footer(436, 522, 770), T(design.terms, 936, 523, F.sans, 12, 420));
      break;
    }
    case "midnight-sky": {
      L.push(...Array.from({ length: 38 }, (_, i) => { const x = 55 + (i * 317) % 1130, y = 46 + (i * 113) % 485; return <circle key={key()} cx={x} cy={y} r={i % 5 === 0 ? 3 : 1.2} fill={accent} fillOpacity={i % 4 === 0 ? 0.85 : 0.4} />; }),
        <path key={key()} d="M820 71 Q1070 130 1066 283 Q1130 420 875 528" fill="none" stroke={accent} strokeWidth={1.8} strokeDasharray="3 12" />,
        <circle key={key()} cx={954} cy={258} r={124} fill="none" stroke={accent} strokeOpacity={0.55} />,
        <path key={key()} d={star(954, 258, 52)} fill={accent} />);
      L.push(salon(343, 93, 550, accent), title(346, 186, 73, 640, F.serif, ink), value(338, 288, 85, 560), service(341, 337, 630), ...fields(104, 428, 572, 58), footer(921, 536, 520, accent));
      break;
    }
    case "pearl-shell": {
      L.push(<ellipse key={key()} cx={256} cy={292} rx={240} ry={258} fill={faint} />,
        <Shell key={key()} x={257} y={342} r={172} color={accent} />,
        <circle key={key()} cx={257} cy={355} r={38} fill={pale} stroke={accent} strokeWidth={2} />,
        <path key={key()} d="M550 91 H1165 M550 497 H1165" stroke={accent} strokeOpacity={0.55} />);
      L.push(salon(822, 104, 620), title(826, 204, 82, 640, F.serif2), value(824, 295, 70, 540, accent), service(824, 342, 580), ...fields(575, 405, 565, 62), footer(845, 530, 590));
      break;
    }
    case "terracotta-tiles": {
      L.push(<Tiles key={key()} color={accent} cols={3} rows={10} size={65} />,
        <rect key={key()} x={225} y={53} width={962} height={478} rx={18} fill={pale} stroke={accent} strokeWidth={1.5} />,
        <rect key={key()} x={254} y={79} width={320} height={410} fill={faint} />);
      L.push(label("Tấm quà mộc", 414, 138, 285), value(411, 285, 63, 290), salon(411, 357, 300),
        title(856, 157, 70, 550, F.serif), service(855, 212, 545), ...fields(641, 308, 435, 75), footer(856, 468, 530), T(design.terms, 856, 506, F.sans, 12, 540));
      break;
    }
    case "blueprint": {
      L.push(...Array.from({ length: 18 }, (_, i) => line(40 + i * 70, 0, 40 + i * 70, H, accent, 0.1, 1)),
        ...Array.from({ length: 9 }, (_, i) => line(0, 35 + i * 70, W, 35 + i * 70, accent, 0.1, 1)),
        <rect key={key()} x={48} y={38} width={1144} height={510} fill="none" stroke={accent} strokeWidth={2} />,
        <circle key={key()} cx={1024} cy={190} r={123} fill="none" stroke={accent} strokeWidth={2} strokeDasharray="7 8" />,
        <path key={key()} d="M1024 38 V343 M864 190 H1180" stroke={accent} strokeOpacity={0.35} />);
      L.push(label("Bản thiết kế / 01", 266, 91, 450), title(390, 199, 74, 690, F.bold), service(405, 249, 690), value(1024, 208, 49, 218),
        ...fields(95, 351, 710, 70), salon(1018, 439, 330), footer(609, 500, 950), T(design.terms, 609, 535, F.sans, 12, 1000));
      break;
    }
    case "matcha-orbit": {
      L.push(<circle key={key()} cx={935} cy={287} r={281} fill={faint} />,
        ...[244, 181, 119].map((r) => <circle key={key()} cx={935} cy={287} r={r} fill="none" stroke={accent} strokeOpacity={r === 119 ? 0.8 : 0.42} strokeWidth={r === 119 ? 2.5 : 1.5} />),
        <circle key={key()} cx={935} cy={287} r={67} fill={accent} />,
        <path key={key()} d={star(935, 287, 29)} fill={bg} />,
        <circle key={key()} cx={162} cy={90} r={18} fill={accent} />);
      L.push(salon(355, 101, 575), title(359, 203, 81, 650, F.serif2), service(365, 260, 640), value(359, 340, 69, 560, ink),
        ...fields(86, 406, 560, 64), footer(378, 522, 660), label("Dành cho bạn", 935, 408, 390, ink));
      break;
    }
    case "sakura": {
      L.push(<path key={key()} d="M75 13 C210 86 143 114 355 144 C502 170 512 227 684 207 M1218 27 C1060 122 1110 177 958 219" fill="none" stroke={deep} strokeWidth={8} strokeLinecap="round" />,
        ...[[162, 73, 35], [260, 121, 44], [365, 131, 31], [508, 175, 40], [622, 205, 31], [1096, 148, 46], [1000, 194, 33]].map(([x, y, r]) => <Blossom key={key()} x={x} y={y} r={r} color={accent} dot={pale} />));
      L.push(salon(611, 97, 500), title(535, 303, 108, 770, F.script, ink), value(547, 383, 74, 510), service(540, 421, 720),
        ...fieldsRow(240, 483, 755), footer(C, 544, 970));
      break;
    }
    case "ocean-wave": {
      L.push(<path key={key()} d="M0 340 C310 210 423 471 739 348 C939 271 1099 310 1240 213 V585 H0Z" fill={faint} />,
        <path key={key()} d="M0 406 C240 301 432 528 747 393 C963 306 1099 381 1240 302 V585 H0Z" fill={accent} fillOpacity={0.2} />,
        <path key={key()} d="M0 475 C254 387 442 563 759 461 C975 384 1130 459 1240 393" fill="none" stroke={accent} strokeWidth={4} />,
        <circle key={key()} cx={1033} cy={113} r={68} fill={faint} />);
      L.push(salon(180, 93, 460), title(478, 178, 80, 750, F.serif2), value(960, 263, 65, 430), service(465, 279, 575),
        ...fieldsRow(230, 382, 820), footer(C, 517, 1010, ink));
      break;
    }
    case "postcard": {
      L.push(<rect key={key()} x={27} y={28} width={1186} height={529} fill="none" stroke={accent} strokeWidth={2} strokeDasharray="4 5" />,
        <rect key={key()} x={982} y={67} width={169} height={143} fill="none" stroke={accent} strokeWidth={2} />,
        <path key={key()} d="M82 317 H921 M962 233 V514" stroke={accent} strokeOpacity={0.45} />,
        ...[0, 1, 2].map((i) => <circle key={key()} cx={1063} cy={140} r={30 + i * 15} fill="none" stroke={accent} strokeOpacity={0.65} />));
      L.push(label("Bưu thiếp quà tặng", 278, 94, 500), title(416, 206, 81, 790, F.script), value(405, 292, 71, 680), service(413, 375, 690),
        ...fields(580, 446, 327, 54), salon(1058, 251, 217), footer(373, 519, 675));
      break;
    }
    case "coral-mirror": {
      L.push(<path key={key()} d="M672 530 V210 C672 85 787 27 917 53 C1090 23 1173 145 1173 275 V530Z" fill={faint} stroke={accent} strokeWidth={4} />,
        <path key={key()} d="M696 515 V211 C696 115 782 64 915 76 C1045 58 1148 164 1148 272 V515" fill="none" stroke={accent} strokeOpacity={0.55} strokeWidth={1.8} />,
        <path key={key()} d="M716 469 C786 405 883 505 955 445 S1079 398 1136 441" fill="none" stroke={accent} strokeOpacity={0.3} strokeWidth={18} />);
      L.push(salon(291, 107, 500), title(284, 209, 83, 550, F.serif2), value(293, 322, 79, 520), service(295, 367, 520), ...fields(87, 451, 478, 58),
        label("Gương của bạn", 919, 183, 410), T(design.title, 919, 302, F.script, 88, 410, { fill: accent }), footer(926, 522, 475));
      break;
    }
    case "emerald-fan": {
      L.push(<Fan key={key()} x={201} y={558} r={309} color={accent} pale={faint} />,
        <path key={key()} d="M560 76 H1170 M560 472 H1170" stroke={accent} strokeOpacity={0.45} />,
        <circle key={key()} cx={188} cy={176} r={69} fill={accent} fillOpacity={0.12} />);
      L.push(salon(863, 105, 610), title(866, 212, 91, 630, F.serif), service(865, 259, 620), value(864, 352, 75, 570), ...fieldsRow(551, 430, 620),
        label("Dành để tận hưởng", 202, 194, 300), footer(863, 517, 620));
      break;
    }
    case "violet-flow": {
      L.push(<defs key={key()}><linearGradient id={`${uid}-flow`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={accent} stopOpacity=".65" /><stop offset="1" stopColor={bg} /></linearGradient></defs>,
        <path key={key()} d="M0 81 C314 -88 443 164 718 34 S1022 9 1240 132 V267 C1004 59 796 377 535 185 S207 281 0 346Z" fill={`url(#${uid}-flow)`} />,
        <path key={key()} d="M0 95 C315 -8 492 218 746 69 S1015 60 1240 143" fill="none" stroke={accent} strokeWidth={3} />,
        <path key={key()} d="M0 407 C319 252 552 455 774 337 S1050 351 1240 280" fill="none" stroke={accent} strokeOpacity={0.25} strokeWidth={39} />);
      L.push(salon(C, 125, 690), title(C, 282, 103, 770, F.script, ink), value(C, 365, 76, 510), service(C, 408, 810), ...fieldsRow(215, 475, 810), footer(C, 548, 900));
      break;
    }
    case "daisy-garden": {
      L.push(<path key={key()} d="M0 0 H1240 V130 Q837 163 620 112 Q298 66 0 155Z" fill={faint} />,
        ...[[117, 100, 52], [250, 61, 37], [391, 101, 44], [1087, 479, 49], [1168, 386, 31]].map(([x, y, r]) => <Daisy key={key()} x={x} y={y} r={r} petal={pale} center={accent} />),
        <path key={key()} d="M1070 585 C1090 516 1084 471 1087 441 M1159 585 C1171 480 1160 416 1168 386" fill="none" stroke={ink} strokeOpacity={0.5} strokeWidth={3} />);
      L.push(salon(694, 94, 560), title(552, 212, 93, 830, F.serif2), value(552, 327, 78, 470), service(545, 377, 800), ...fieldsRow(216, 464, 740), footer(602, 533, 940));
      break;
    }
    case "burgundy-stripe": {
      L.push(...Array.from({ length: 8 }, (_, i) => <rect key={key()} x={929 + i * 39} width={i % 2 ? 20 : 28} height={585} fill={accent} fillOpacity={i % 2 ? 0.35 : 0.7} />),
        <circle key={key()} cx={1059} cy={291} r={144} fill={bg} stroke={accent} strokeWidth={7} />,
        <circle key={key()} cx={1059} cy={291} r={128} fill="none" stroke={accent} strokeOpacity={0.5} />,
        <path key={key()} d="M84 88 H790 M84 502 H790" stroke={accent} strokeWidth={3} />);
      L.push(salon(425, 121, 660), title(426, 215, 76, 675, F.serif), service(426, 263, 685), ...fields(112, 370, 640, 60),
        label("Giá trị", 1059, 252, 295), value(1059, 331, 48, 270, ink), footer(422, 539, 700));
      break;
    }
    case "checker-pop": {
      L.push(...Array.from({ length: 36 }, (_, i) => (i + Math.floor(i / 6)) % 2 === 0 ? <rect key={key()} x={(i % 6) * 69} y={Math.floor(i / 6) * 98} width={69} height={98} fill={accent} fillOpacity={0.65} /> : null),
        <rect key={key()} x={55} y={248} width={309} height={62} rx={31} fill={ink} />,
        <rect key={key()} x={466} y={51} width={710} height={482} rx={53} fill={pale} stroke={accent} strokeWidth={2.5} />,
        <rect key={key()} x={493} y={73} width={650} height={436} rx={41} fill="none" stroke={accent} strokeOpacity={0.5} />);
      L.push(label("Tặng một niềm vui", 809, 117, 550), title(809, 220, 84, 610, F.bold), value(809, 316, 72, 450), service(808, 355, 560), ...fieldsRow(548, 431, 535),
        salon(209, 287, 359, bg), footer(806, 493, 620));
      break;
    }
    case "linen-stitch": {
      L.push(...Array.from({ length: 31 }, (_, i) => line(i * 45, 0, i * 45 - 215, H, accent, 0.075, 2)),
        <rect key={key()} x={34} y={33} width={1172} height={519} rx={19} fill="none" stroke={accent} strokeWidth={3} strokeDasharray="11 8" />,
        <path key={key()} d="M704 85 V496" stroke={accent} strokeWidth={2} strokeDasharray="7 9" />,
        <path key={key()} d="M730 285 Q857 162 1114 283 Q882 440 730 285Z" fill={faint} />);
      L.push(salon(367, 109, 600), title(367, 235, 98, 610, F.script), service(367, 296, 600), ...fields(89, 401, 545, 61),
        value(918, 306, 70, 445, ink), label("Một món quà được khâu tay", 916, 375, 470), footer(916, 512, 485));
      break;
    }
    case "type-grid": {
      L.push(<path key={key()} d="M58 61 H1182 M58 196 H1182 M58 455 H1182 M58 540 H1182 M774 61 V540 M993 196 V455" fill="none" stroke={ink} strokeWidth={2} />,
        <rect key={key()} x={775} y={197} width={217} height={257} fill={ink} />);
      L.push(T("GIFT", 394, 164, F.bold, 118, 680, { spacing: 0.02 }), salon(1085, 140, 196), title(380, 313, 77, 650, F.serif2),
        service(382, 374, 635), value(882, 345, 40, 198, bg), ...fields(1011, 273, 150, 73),
        T(design.code, 112, 508, F.sans, 18, 180, { anchor: "start" }), T(design.expiry, 397, 508, F.sans, 18, 280), footer(963, 511, 420));
      break;
    }
    case "opal-prism": {
      L.push(<path key={key()} d="M0 0 H560 L473 292 L0 585Z" fill={mix(bg, accent, 0.23)} />,
        <path key={key()} d="M0 0 L473 292 L302 585 H0Z" fill={mix(bg, "#D5B6CF", 0.45)} fillOpacity={0.72} />,
        <path key={key()} d="M560 0 L473 292 L302 585 L727 405Z" fill={mix(bg, "#B3D7D1", 0.48)} fillOpacity={0.72} />,
        <path key={key()} d="M473 292 L868 55 L727 405Z" fill={mix(bg, "#E6D69E", 0.42)} fillOpacity={0.55} />,
        <path key={key()} d="M82 480 L470 292 L801 476" fill="none" stroke={accent} strokeWidth={1.5} />);
      L.push(salon(921, 106, 575), title(905, 207, 78, 575, F.serif2), service(902, 265, 560), value(889, 350, 70, 530, ink), ...fieldsRow(565, 449, 575), footer(898, 523, 620));
      break;
    }
    case "espresso-swirls": {
      L.push(...[244, 196, 147, 99].map((r) => <circle key={key()} cx={1020} cy={300} r={r} fill="none" stroke={accent} strokeOpacity={0.24 + (244 - r) / 900} strokeWidth={r === 196 ? 31 : 18} />),
        <path key={key()} d="M948 278 C985 207 1118 214 1128 303 C1134 397 1001 413 966 345" fill="none" stroke={accent} strokeWidth={7} strokeLinecap="round" />,
        <path key={key()} d="M77 330 H764 V421 H77Z" fill={accent} fillOpacity={0.16} />);
      L.push(salon(360, 96, 610), title(354, 190, 88, 690, F.serif), service(354, 248, 640), value(351, 402, 67, 580, ink), ...fieldsRow(94, 482, 650), footer(1006, 540, 470));
      break;
    }
  }

  if (side === "back") switch (design.style) {
    case "lavender-arch": {
      L.push(<path key={key()} d="M77 550 V214 A273 182 0 0 1 623 214 V550 Z" fill={faint} stroke={accent} strokeWidth={2.5} />,
        <path key={key()} d="M106 550 V220 A244 158 0 0 1 594 220 V550 M139 550 V228 A211 131 0 0 1 561 228 V550" fill="none" stroke={accent} strokeOpacity={0.48} strokeWidth={1.5} />,
        <rect key={key()} x={656} width={584} height={H} fill={mix(bg, accent, 0.12)} />,
        <circle key={key()} cx={350} cy={310} r={95} fill={pale} stroke={accent} strokeWidth={2} />);
      L.push(label("Một lời nhắn nhỏ", 349, 105, 510), T("♡", 349, 346, F.serif, 100, 170, { fill: accent }),
        heading(940, 196, 85, 490, F.script, accent), ...backCopy(947, 300, 500), salon(944, 493, 490));
      break;
    }
    case "citrus-rays": {
      L.push(<circle key={key()} cx={150} cy={-12} r={295} fill={faint} />,
        ...Array.from({ length: 13 }, (_, i) => { const [x, y] = polar(150, -12, 292, i * Math.PI / 12); return line(150, -12, x, y, accent, 0.6, 3); }),
        <path key={key()} d="M0 500 C255 375 445 530 731 465 S1064 413 1240 480 V585 H0Z" fill={mix(bg, accent, 0.15)} />,
        <path key={key()} d="M675 87 H1154 M675 477 H1154" stroke={accent} strokeWidth={2} />);
      L.push(T("SUNSHINE", 167, 326, F.bold, 32, 310, { fill: ink }), heading(887, 232, 83, 540, F.serif, ink),
        ...backCopy(892, 331, 520), salon(885, 512, 545));
      break;
    }
    case "midnight-sky": {
      L.push(...Array.from({ length: 53 }, (_, i) => <circle key={key()} cx={50 + (i * 419) % 1140} cy={40 + (i * 127) % 502} r={i % 7 === 0 ? 3.2 : 1.1} fill={accent} fillOpacity={i % 3 === 0 ? 0.95 : 0.43} />),
        <path key={key()} d="M98 472 L231 311 L355 359 L496 152 L615 210" fill="none" stroke={accent} strokeWidth={1.7} strokeOpacity={0.7} />,
        ...[[98, 472], [231, 311], [355, 359], [496, 152], [615, 210]].map(([x, y]) => <circle key={key()} cx={x} cy={y} r={6} fill={accent} />),
        <circle key={key()} cx={984} cy={292} r={212} fill="none" stroke={accent} strokeOpacity={0.45} strokeWidth={1.3} />,
        <path key={key()} d={star(984, 107, 28)} fill={accent} />);
      L.push(label("Dành cho một vì sao", 342, 119, 620), heading(975, 245, 77, 505, F.serif2, accent),
        ...backCopy(984, 335, 506, "middle", ink, 20), salon(980, 481, 485, accent));
      break;
    }
    case "pearl-shell": {
      L.push(<Shell key={key()} x={916} y={312} r={218} color={accent} />,
        <ellipse key={key()} cx={310} cy={291} rx={265} ry={216} fill={pale} stroke={accent} strokeWidth={2} />,
        <ellipse key={key()} cx={310} cy={291} rx={242} ry={195} fill="none" stroke={accent} strokeOpacity={0.5} />,
        <circle key={key()} cx={916} cy={379} r={52} fill={pale} stroke={accent} />);
      L.push(label("Một viên ngọc", 310, 154, 460), heading(310, 280, 85, 460, F.script, deep),
        ...backCopy(310, 354, 420, "middle", ink, 18), salon(918, 528, 530));
      break;
    }
    case "terracotta-tiles": {
      L.push(<Tiles key={key()} color={accent} x={0} y={0} cols={20} rows={2} size={63} />,
        <Tiles key={key()} color={accent} x={0} y={459} cols={20} rows={2} size={63} />,
        <path key={key()} d="M100 151 H1140 V439 H100 Z" fill={pale} stroke={accent} strokeWidth={2} />,
        <path key={key()} d="M124 170 H1116 M124 420 H1116" stroke={accent} strokeOpacity={0.35} />);
      L.push(salon(C, 210, 770), heading(C, 285, 76, 880, F.serif2), ...backCopy(C, 348, 870));
      break;
    }
    case "blueprint": {
      L.push(...Array.from({ length: 14 }, (_, i) => line(i * 96, 0, i * 96, H, accent, 0.11)),
        ...Array.from({ length: 8 }, (_, i) => line(0, i * 84, W, i * 84, accent, 0.11)),
        <rect key={key()} x={43} y={38} width={1154} height={508} fill="none" stroke={accent} strokeWidth={1.5} />,
        <circle key={key()} cx={943} cy={294} r={189} fill="none" stroke={accent} strokeWidth={2.5} />,
        <circle key={key()} cx={943} cy={294} r={167} fill="none" stroke={accent} strokeDasharray="5 7" />,
        <path key={key()} d="M942 72 V514 M721 293 H1166" stroke={accent} strokeOpacity={0.35} />);
      L.push(label("Mã bản vẽ 02 / CẢM ƠN", 319, 104, 600), heading(351, 236, 81, 580, F.bold),
        ...backCopy(113, 320, 535, "start", ink, 20), salon(943, 308, 340, accent), T(design.website, 336, 509, F.sans, 16, 550));
      break;
    }
    case "matcha-orbit": {
      L.push(...[[246, 360, 240], [565, 219, 168], [990, 313, 263]].map(([x, y, r], i) => <circle key={key()} cx={x} cy={y} r={r} fill={i === 1 ? faint : "none"} stroke={accent} strokeOpacity={0.33 + i * 0.16} strokeWidth={i === 2 ? 3 : 1.8} />),
        <circle key={key()} cx={973} cy={308} r={173} fill={pale} />,
        <circle key={key()} cx={972} cy={307} r={153} fill="none" stroke={accent} strokeWidth={2} />);
      L.push(salon(260, 114, 490), label("Chậm một nhịp", 387, 250, 550), heading(973, 257, 81, 410, F.serif2),
        ...backCopy(973, 329, 420, "middle", ink, 17), salon(970, 432, 430));
      break;
    }
    case "sakura": {
      L.push(<path key={key()} d="M0 98 C217 157 234 258 492 212 C689 177 746 191 920 265 M1240 52 C1100 112 1187 192 986 220" fill="none" stroke={deep} strokeWidth={8} />,
        ...[[95, 117, 36], [238, 179, 45], [404, 232, 33], [581, 192, 42], [811, 207, 37], [1097, 153, 43], [1019, 214, 33]].map(([x, y, r]) => <Blossom key={key()} x={x} y={y} r={r} color={accent} dot={pale} />),
        <path key={key()} d="M207 380 H1030 M207 499 H1030" stroke={accent} strokeOpacity={0.5} strokeWidth={1.5} />);
      L.push(heading(C, 325, 92, 720, F.script, ink), ...backCopy(C, 417, 880), salon(C, 526, 720));
      break;
    }
    case "ocean-wave": {
      L.push(<path key={key()} d="M0 120 C290 231 419 6 747 124 S1073 215 1240 107 V0 H0Z" fill={faint} />,
        <path key={key()} d="M0 178 C329 295 471 61 798 200 S1095 231 1240 201" fill="none" stroke={accent} strokeWidth={4} />,
        <path key={key()} d="M0 518 C275 396 474 592 753 454 S1060 488 1240 397 V585 H0Z" fill={accent} fillOpacity={0.22} />,
        <circle key={key()} cx={205} cy={317} r={108} fill="none" stroke={accent} strokeOpacity={0.5} />);
      L.push(label("Từ phía biển xanh", 205, 321, 320), heading(822, 325, 88, 670, F.serif2),
        ...backCopy(822, 408, 660), salon(823, 523, 700));
      break;
    }
    case "postcard": {
      L.push(<rect key={key()} x={25} y={26} width={1190} height={532} fill="none" stroke={accent} strokeWidth={2} strokeDasharray="4 6" />,
        <path key={key()} d="M620 92 V500" stroke={accent} strokeOpacity={0.48} strokeWidth={2} />,
        ...[0, 1, 2, 3].map((i) => line(715, 305 + i * 46, 1120, 305 + i * 46, accent, 0.5)),
        <rect key={key()} x={1010} y={69} width={156} height={133} fill="none" stroke={accent} strokeWidth={2} />,
        ...[0, 1].map((i) => <circle key={key()} cx={1087} cy={136} r={25 + i * 17} fill="none" stroke={accent} />));
      L.push(label("Postcard / từ tiệm", 315, 100, 525), heading(326, 218, 85, 520, F.script), ...backCopy(93, 334, 487, "start", ink, 20),
        salon(917, 266, 525), T("Gửi đến:", 711, 293, F.sans, 15, 200, { anchor: "start", fill: accent }), T(design.website, 918, 519, F.sans, 17, 540));
      break;
    }
    case "coral-mirror": {
      L.push(<path key={key()} d="M67 514 V241 Q67 63 265 63 Q477 63 477 241 V514Z" fill={pale} stroke={accent} strokeWidth={4} />,
        <path key={key()} d="M89 497 V235 Q89 88 265 88 Q455 88 455 235 V497" fill="none" stroke={accent} strokeWidth={1.6} />,
        <path key={key()} d={HEART} transform="translate(211 262) scale(1.12)" fill={accent} fillOpacity={0.6} />,
        <path key={key()} d="M565 91 H1153 M565 480 H1153" stroke={accent} strokeOpacity={0.48} />);
      L.push(label("Bạn xứng đáng", 264, 178, 330), heading(864, 245, 96, 610, F.serif2), ...backCopy(865, 340, 610), salon(862, 518, 585));
      break;
    }
    case "emerald-fan": {
      L.push(<Fan key={key()} x={1034} y={521} r={430} color={accent} pale={faint} />,
        <path key={key()} d="M69 66 H689 M69 514 H689" stroke={accent} strokeOpacity={0.56} strokeWidth={2} />,
        <circle key={key()} cx={149} cy={134} r={28} fill={accent} fillOpacity={0.2} />);
      L.push(salon(374, 111, 600), heading(376, 248, 89, 675, F.script, accent), ...backCopy(115, 338, 557, "start", ink, 21),
        label("Mở ra một ngày mới", 364, 465, 655));
      break;
    }
    case "violet-flow": {
      L.push(<defs key={key()}><linearGradient id={`${uid}-back`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={accent} stopOpacity=".65" /><stop offset="1" stopColor={bg} /></linearGradient></defs>,
        <path key={key()} d="M0 0 C236 130 234 303 474 217 S614 216 551 585 H0Z" fill={`url(#${uid}-back)`} />,
        <path key={key()} d="M68 0 C319 132 287 329 529 266 S709 312 581 585" fill="none" stroke={accent} strokeWidth={2.5} />,
        <path key={key()} d="M0 503 C352 283 343 555 589 380" fill="none" stroke={accent} strokeOpacity={0.35} strokeWidth={45} />);
      L.push(label("Một khoảng dịu dàng", 285, 273, 500), heading(882, 229, 98, 560, F.script), ...backCopy(887, 339, 560), salon(888, 486, 600));
      break;
    }
    case "daisy-garden": {
      L.push(<Daisy key={key()} x={197} y={276} r={200} petal={pale} center={accent} />,
        <path key={key()} d="M199 585 C163 513 190 450 197 332" fill="none" stroke={ink} strokeOpacity={0.45} strokeWidth={4} />,
        ...[[378, 470, 48], [486, 113, 35], [1101, 504, 54]].map(([x, y, r]) => <Daisy key={key()} x={x} y={y} r={r} petal={pale} center={accent} />),
        <path key={key()} d="M548 90 H1157 M548 492 H1157" stroke={ink} strokeOpacity={0.45} />);
      L.push(salon(853, 128, 612), heading(854, 262, 92, 635, F.serif2), ...backCopy(855, 356, 610), label("Nở một ngày vui", 855, 469, 610));
      break;
    }
    case "burgundy-stripe": {
      L.push(...Array.from({ length: 7 }, (_, i) => <path key={key()} d={`M${-153 + i * 85} 585 L${84 + i * 85} 0 H${151 + i * 85} L${-86 + i * 85} 585Z`} fill={accent} fillOpacity={i % 2 ? 0.32 : 0.62} />),
        <path key={key()} d="M687 115 H1166 M687 473 H1166" fill="none" stroke={accent} strokeWidth={2} />,
        <path key={key()} d="M810 145 H1043 M810 445 H1043" fill="none" stroke={accent} strokeOpacity={0.43} />);
      L.push(label("Một lời thương", 241, 315, 400, bg), heading(927, 251, 77, 480, F.serif),
        ...backCopy(927, 344, 455, "middle", ink, 19), salon(927, 433, 480));
      break;
    }
    case "checker-pop": {
      L.push(...Array.from({ length: 24 }, (_, i) => (i + Math.floor(i / 12)) % 2 === 0 ? <rect key={key()} x={(i % 12) * 104} y={i < 12 ? 0 : 481} width={104} height={104} fill={accent} fillOpacity={0.68} /> : null),
        <rect key={key()} x={158} y={121} width={924} height={344} rx={91} fill={pale} stroke={accent} strokeWidth={3} />,
        <path key={key()} d="M191 156 Q619 210 1048 156 M191 435 Q619 381 1048 435" fill="none" stroke={accent} strokeOpacity={0.5} />);
      L.push(label("Gửi đến bạn", C, 181, 640), heading(C, 291, 95, 760, F.bold), ...backCopy(C, 365, 810, "middle", ink, 20), salon(C, 438, 800));
      break;
    }
    case "linen-stitch": {
      L.push(...Array.from({ length: 24 }, (_, i) => line(i * 57, 0, i * 57 - 214, H, accent, 0.08)),
        <rect key={key()} x={39} y={38} width={1162} height={509} fill="none" stroke={accent} strokeWidth={2.5} strokeDasharray="10 9" />,
        <rect key={key()} x={66} y={63} width={1108} height={459} fill={pale} fillOpacity={0.62} stroke={accent} strokeOpacity={0.25} />,
        <path key={key()} d="M578 136 Q620 69 662 136 M583 142 Q620 80 657 142" fill="none" stroke={accent} strokeWidth={2} />);
      L.push(salon(C, 115, 710), heading(C, 265, 104, 850, F.script, accent), ...backCopy(C, 365, 850),
        T("MỘT LỜI ĐƯỢC KHÂU BẰNG CẢ TRÁI TIM", C, 467, F.sans, 15, 850, { spacing: 0.12 }));
      break;
    }
    case "type-grid": {
      L.push(<path key={key()} d="M52 52 H1188 M52 199 H1188 M52 461 H1188 M52 531 H1188 M322 52 V531 M1005 52 V531" fill="none" stroke={ink} strokeWidth={2} />,
        <rect key={key()} x={52} y={200} width={269} height={260} fill={ink} />);
      L.push(T("THX", 185, 330, F.bold, 103, 255, { fill: bg }), T("TẶNG BẠN", 185, 496, F.sans, 22, 245),
        heading(660, 303, 98, 620, F.serif2), ...backCopy(362, 378, 610, "start", ink, 18),
        salon(1097, 121, 168), T(design.website, 1096, 493, F.sans, 16, 166));
      break;
    }
    case "opal-prism": {
      L.push(<path key={key()} d="M620 27 L1084 230 L811 568 L304 465 L155 213Z" fill={mix(bg, "#B3D7D1", 0.42)} />,
        <path key={key()} d="M620 27 L621 284 L155 213Z" fill={mix(bg, "#D5B6CF", 0.54)} />,
        <path key={key()} d="M1084 230 L621 284 L811 568Z" fill={mix(bg, "#E6D69E", 0.5)} />,
        <path key={key()} d="M155 213 L621 284 L304 465" fill={pale} fillOpacity={0.55} />,
        <path key={key()} d="M620 27 L621 284 L811 568 M155 213 L621 284 L1084 230" fill="none" stroke={accent} strokeOpacity={0.68} strokeWidth={2} />,
        <ellipse key={key()} cx={625} cy={299} rx={337} ry={191} fill={bg} fillOpacity={0.83} />);
      L.push(salon(C, 177, 650), heading(C, 296, 91, 670, F.serif2), ...backCopy(C, 366, 720, "middle", ink, 19), label("Dành riêng một sắc màu", C, 466, 800));
      break;
    }
    case "espresso-swirls": {
      L.push(...[232, 185, 132, 78].map((r) => <circle key={key()} cx={290} cy={298} r={r} fill="none" stroke={accent} strokeOpacity={r === 185 ? 0.45 : 0.28} strokeWidth={r === 185 ? 26 : 15} />),
        <path key={key()} d="M251 176 C206 98 341 126 300 51 M322 180 C284 105 407 120 369 49" fill="none" stroke={accent} strokeOpacity={0.57} strokeWidth={4} strokeLinecap="round" />,
        <path key={key()} d="M618 87 H1140 M618 486 H1140" stroke={accent} strokeOpacity={0.55} />);
      L.push(label("Một tách dịu dàng", 290, 317, 395), heading(879, 238, 92, 550, F.script, accent),
        ...backCopy(881, 332, 545, "middle", ink, 21), salon(880, 456, 560));
      break;
    }
  }

  return <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg" className={className} role="img" aria-label={`${side === "back" ? "Mặt sau " : ""}${design.title} – ${design.salon}`}>
    <rect width={W} height={H} fill={bg} />
    {L}
  </svg>;
}
