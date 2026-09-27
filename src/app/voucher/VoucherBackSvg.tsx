import { useId, type ReactNode, type Ref } from "react";
import { VOUCHER_SIZE, isNewVoucherStyle, type VoucherDesign } from "@/lib/voucher-templates";
import { F, HEART, mix, star, useSvgText } from "../design/svg-kit";
import { LogoIcon } from "../logo/LogoSvg";
import { Veins, hash } from "../price/PriceSvg";
import { Bow, Rose, Sprig } from "./VoucherSvg";
import { VoucherFreshSvg } from "./VoucherFreshSvg";

const { w: W, h: H } = VOUCHER_SIZE;
const C = W / 2;

// Mỗi phong cách có một bố cục mặt sau riêng; chỉ dùng chung nội dung khách sửa.
export function VoucherBackSvg({ design, svgRef, className }: { design: VoucherDesign; svgRef?: Ref<SVGSVGElement>; className?: string }) {
  const uid = useId().replace(/:/g, "");
  const { bg, ink, accent } = design.colors;
  const pale = mix(bg, "#FFFFFF", 0.65);
  const dark = mix(accent, "#000000", 0.3);
  const { T, key } = useSvgText(ink);
  const L: ReactNode[] = [];
  if (isNewVoucherStyle(design.style)) return <VoucherFreshSvg design={design} side="back" svgRef={svgRef} className={className} />;
  const copy = (x: number, y: number, width: number, size = 23, anchor: "start" | "middle" = "middle", fill = ink, gap = 39) => {
    L.push(T(design.backLine1, x, y, F.sans, size, width, { anchor, fill }));
    L.push(T(design.backLine2, x, y + gap, F.sans, size, width, { anchor, fill }));
  };

  switch (design.style) {
    case "noir": {
      L.push(
        <rect key={key()} x={25} y={25} width={W - 50} height={H - 50} fill="none" stroke={accent} strokeWidth={2} />,
        <rect key={key()} x={36} y={36} width={W - 72} height={H - 72} fill="none" stroke={accent} strokeOpacity={0.45} />,
        <circle key={key()} cx={300} cy={292} r={193} fill="none" stroke={accent} strokeWidth={1.4} />,
        <circle key={key()} cx={300} cy={292} r={178} fill="none" stroke={accent} strokeOpacity={0.5} />,
        <path key={key()} d="M604 84 V501" stroke={accent} strokeOpacity={0.55} />,
        <path key={key()} d={star(300, 154, 17)} fill={accent} />,
        <path key={key()} d={star(300, 430, 17)} fill={accent} />,
      );
      L.push(T("THANK YOU", 300, 277, F.serif, 60, 330, { fill: accent, spacing: 0.12 }));
      L.push(T(design.salon, 300, 324, F.sans, 16, 340, { upper: true, spacing: 0.24 }));
      L.push(T("Một lời từ trái tim", 690, 165, F.sans, 17, 400, { anchor: "start", upper: true, spacing: 0.25, fill: accent }));
      L.push(T(design.backHeading, 685, 260, F.script, 88, 470, { anchor: "start", fill: accent }));
      copy(690, 332, 460, 21, "start", ink, 42);
      L.push(T(`${design.salon} · GỬI BẠN VỚI TẤT CẢ SỰ TRÂN QUÝ`, 690, 470, F.sans, 13, 465, { anchor: "start", spacing: 0.13, fill: accent }));
      break;
    }
    case "ribbon": {
      L.push(
        <rect key={key()} x={0} y={0} width={270} height={H} fill={mix(bg, accent, 0.16)} />,
        <rect key={key()} x={270} y={0} width={34} height={H} fill={accent} />,
        <rect key={key()} x={346} y={68} width={824} height={450} rx={18} fill={pale} stroke={accent} strokeOpacity={0.32} />,
        <path key={key()} d="M370 102 H1145 M370 485 H1145" stroke={accent} strokeOpacity={0.28} />,
        <Bow key={key()} cx={148} cy={244} size={235} fill={accent} />,
        <path key={key()} d={HEART} transform="translate(104 380) scale(.88)" fill={accent} fillOpacity={0.65} />,
      );
      L.push(T("MÓN QUÀ DÀNH RIÊNG CHO BẠN", 758, 145, F.sans, 17, 720, { upper: true, spacing: 0.25, fill: accent }));
      L.push(T(design.backHeading, 758, 270, F.script, 96, 740, { fill: accent }));
      copy(758, 335, 710, 24);
      L.push(T(design.salon, 758, 465, F.serif2, 27, 660, { upper: true, spacing: 0.2 }));
      break;
    }
    case "ticket": {
      L.push(
        <rect key={key()} x={25} y={25} width={W - 50} height={H - 50} rx={14} fill="none" stroke={accent} strokeWidth={2} />,
        <path key={key()} d="M300 25 V560" stroke={accent} strokeWidth={2.5} strokeDasharray="2 11" strokeLinecap="round" />,
        <circle key={key()} cx={300} cy={25} r={18} fill={bg} stroke={accent} strokeWidth={2} />,
        <circle key={key()} cx={300} cy={560} r={18} fill={bg} stroke={accent} strokeWidth={2} />,
        <circle key={key()} cx={166} cy={292} r={92} fill="none" stroke={accent} strokeWidth={1.7} strokeDasharray="5 7" />,
        <path key={key()} d="M374 420 H1140" stroke={accent} strokeOpacity={0.4} />,
      );
      L.push(T("VÉ HẸN", 166, 118, F.sans, 18, 230, { upper: true, spacing: 0.28, fill: accent }));
      L.push(T("01", 166, 316, F.serif, 99, 220, { fill: accent }));
      L.push(T("DÀNH CHO BẠN", 166, 470, F.sans, 15, 230, { upper: true, spacing: 0.18 }));
      L.push(T(design.salon, 380, 125, F.sans, 17, 730, { anchor: "start", upper: true, spacing: 0.26, fill: accent }));
      L.push(T(design.backHeading, 380, 250, F.serif2, 88, 760, { anchor: "start" }));
      copy(380, 325, 760, 23, "start");
      L.push(T("HÃY DÀNH MỘT CHÚT THỜI GIAN CHO CHÍNH MÌNH", 380, 478, F.sans, 15, 755, { anchor: "start", spacing: 0.11, fill: accent }));
      break;
    }
    case "marble": {
      L.push(<Veins key={key()} W={W} H={H} dark={false} gold={accent} seed={hash(design.templateId)} id={uid} />);
      L.push(
        <rect key={key()} x={28} y={28} width={W - 56} height={H - 56} fill="none" stroke={accent} strokeWidth={1.6} />,
        <rect key={key()} x={42} y={42} width={W - 84} height={H - 84} fill="none" stroke={accent} strokeOpacity={0.5} />,
        <ellipse key={key()} cx={C} cy={290} rx={470} ry={213} fill={pale} fillOpacity={0.83} stroke={accent} strokeWidth={1.2} />,
        <ellipse key={key()} cx={C} cy={290} rx={450} ry={196} fill="none" stroke={accent} strokeOpacity={0.45} />,
        <path key={key()} d={star(C, 125, 12)} fill={accent} />,
      );
      L.push(T(design.salon, C, 174, F.serif2, 24, 700, { upper: true, spacing: 0.28 }));
      L.push(T(design.backHeading, C, 280, F.script, 110, 790, { fill: accent }));
      copy(C, 355, 750, 23);
      L.push(T("VỚI TẤT CẢ SỰ TRÂN TRỌNG", C, 465, F.sans, 14, 650, { upper: true, spacing: 0.23, fill: accent }));
      break;
    }
    case "minimal": {
      L.push(
        <path key={key()} d="M92 78 H1148 M92 507 H1148" stroke={ink} strokeOpacity={0.75} strokeWidth={1.5} />,
        <path key={key()} d="M824 125 V459" stroke={ink} strokeOpacity={0.23} />,
        <circle key={key()} cx={1000} cy={288} r={118} fill="none" stroke={ink} strokeOpacity={0.12} strokeWidth={25} />,
        <path key={key()} d="M975 288 H1025 M1000 263 V313" stroke={ink} strokeWidth={1.5} />,
      );
      L.push(T("01 / MỘT LỜI NHẮN", 92, 141, F.sans, 15, 620, { anchor: "start", upper: true, spacing: 0.26 }));
      L.push(T(design.backHeading, 86, 288, F.serif2, 133, 700, { anchor: "start" }));
      copy(92, 370, 690, 22, "start", ink, 41);
      L.push(T(design.salon, 92, 485, F.sans, 17, 700, { anchor: "start", upper: true, spacing: 0.28 }));
      L.push(T(design.salon, 1000, 460, F.sans, 16, 230, { upper: true, spacing: 0.12 }));
      break;
    }
    case "botanical": {
      L.push(
        <path key={key()} d="M50 540 V246 A226 210 0 0 1 502 246 V540 Z" fill={pale} stroke={accent} strokeWidth={2} />,
        <path key={key()} d="M67 532 V248 A209 193 0 0 1 485 248 V532" fill="none" stroke={accent} strokeOpacity={0.45} />,
        <Sprig key={key()} x={70} y={535} len={250} a={-1.12} color={accent} />,
        <Sprig key={key()} x={495} y={535} len={230} a={-2.02} color={accent} />,
        <LogoIcon key={key()} id="leaf" x={276} y={262} size={168} primary={accent} accent={mix(accent, "#FFFFFF", 0.4)} />,
        <path key={key()} d="M565 132 H1140 M565 455 H1140" stroke={accent} strokeOpacity={0.55} />,
      );
      L.push(T("MỘT MẦM XANH", 276, 420, F.sans, 16, 350, { upper: true, spacing: 0.26, fill: accent }));
      L.push(T(design.salon, 565, 107, F.sans, 17, 570, { anchor: "start", upper: true, spacing: 0.25, fill: accent }));
      L.push(T(design.backHeading, 565, 275, F.script, 110, 590, { anchor: "start", fill: accent }));
      copy(565, 355, 580, 21, "start");
      L.push(T("HẸN BẠN TRONG MỘT NGÀY NẮNG ĐẸP", 565, 493, F.sans, 14, 580, { anchor: "start", upper: true, spacing: 0.12, fill: accent }));
      break;
    }
    case "split": {
      L.push(
        <path key={key()} d="M0 0 H635 L470 585 H0 Z" fill={accent} />,
        <path key={key()} d="M635 0 L470 585" stroke={dark} strokeOpacity={0.45} strokeWidth={2} />,
        <circle key={key()} cx={235} cy={295} r={173} fill="none" stroke={bg} strokeOpacity={0.35} />,
        <path key={key()} d={HEART} transform="translate(189 138) scale(.9)" fill={bg} fillOpacity={0.8} />,
      );
      L.push(T("MỘT MÓN QUÀ", 235, 300, F.sans, 18, 370, { upper: true, spacing: 0.26, fill: bg }));
      L.push(T("TỪ TRÁI TIM", 235, 349, F.serif2, 46, 390, { upper: true, fill: bg }));
      L.push(T(design.salon, 235, 500, F.sans, 17, 360, { upper: true, spacing: 0.23, fill: bg }));
      L.push(T("“", 730, 170, F.serif, 156, 130, { fill: accent }));
      L.push(T(design.backHeading, 715, 267, F.serif2, 73, 445, { anchor: "start", fill: accent }));
      copy(715, 345, 435, 20, "start", ink, 42);
      L.push(<path key={key()} d="M715 460 H1110" stroke={accent} strokeWidth={1.4} />);
      break;
    }
    case "deco": {
      L.push(
        <rect key={key()} x={25} y={25} width={W - 50} height={H - 50} fill="none" stroke={accent} strokeWidth={2} />,
        <rect key={key()} x={40} y={40} width={W - 80} height={H - 80} fill="none" stroke={accent} strokeOpacity={0.5} />,
        <path key={key()} d="M208 486 V196 Q208 85 315 85 H925 Q1032 85 1032 196 V486" fill="none" stroke={accent} strokeWidth={2} />,
        <path key={key()} d="M231 486 V199 Q231 110 319 110 H921 Q1009 110 1009 199 V486" fill="none" stroke={accent} strokeOpacity={0.5} />,
        <path key={key()} d="M310 165 H930 M310 445 H930" stroke={accent} strokeOpacity={0.7} />,
        <path key={key()} d={star(C, 143, 20)} fill={accent} />,
      );
      for (let i = 0; i < 7; i++) {
        const x = 365 + i * 85;
        L.push(<path key={key()} d={`M${x} 138 L${C} 64`} stroke={accent} strokeOpacity={0.32} strokeWidth={1.1} />);
      }
      L.push(T(design.salon, C, 217, F.sans, 17, 650, { upper: true, spacing: 0.38, fill: accent }));
      L.push(T(design.backHeading, C, 306, F.serif, 67, 760, { upper: true, spacing: 0.1, fill: accent }));
      copy(C, 365, 740, 20, "middle", ink, 37);
      L.push(T(design.salon, C, 493, F.sans, 15, 520, { upper: true, spacing: 0.24, fill: accent }));
      break;
    }
    case "floral": {
      const leaf = "#83916F";
      L.push(
        <rect key={key()} x={54} y={42} width={W - 108} height={H - 84} rx={140} fill={pale} fillOpacity={0.77} />,
        <Rose key={key()} cx={115} cy={105} r={82} color={accent} leaf={leaf} />,
        <Rose key={key()} cx={205} cy={64} r={46} color={accent} leaf={leaf} />,
        <Rose key={key()} cx={1110} cy={488} r={90} color={accent} leaf={leaf} />,
        <Rose key={key()} cx={1190} cy={400} r={43} color={accent} leaf={leaf} />,
        <path key={key()} d="M230 310 Q620 242 1010 310" fill="none" stroke={accent} strokeOpacity={0.4} strokeWidth={1.2} />,
      );
      L.push(T(design.salon, C, 130, F.serif2, 27, 650, { upper: true, spacing: 0.25 }));
      L.push(T(design.backHeading, C, 267, F.script, 105, 800, { fill: accent }));
      copy(C, 362, 775, 22);
      L.push(T("GỬI BẠN BẰNG TẤT CẢ SỰ DỊU DÀNG", C, 486, F.sans, 14, 720, { upper: true, spacing: 0.19, fill: accent }));
      break;
    }
    case "polish": {
      const swatches = [accent, mix(accent, "#F7B8AB", 0.58), mix(accent, "#F7DFB3", 0.65), dark];
      L.push(
        <path key={key()} d="M0 485 C190 450 332 530 510 490 S835 455 1240 505 V585 H0 Z" fill={mix(bg, accent, 0.2)} />,
        <path key={key()} d="M0 530 C230 492 370 555 570 520 S918 500 1240 545 V585 H0 Z" fill={accent} fillOpacity={0.18} />,
      );
      swatches.forEach((color, i) => {
        const x = 78 + i * 126;
        const y = 218 + (i % 2) * 25;
        L.push(
          <rect key={key()} x={x + 27} y={y - 76} width={46} height={83} rx={6} fill={dark} />,
          <rect key={key()} x={x} y={y} width={100} height={172} rx={22} fill={color} stroke={dark} strokeOpacity={0.4} strokeWidth={2} />,
          <rect key={key()} x={x + 12} y={y + 17} width={76} height={126} rx={14} fill="none" stroke={bg} strokeOpacity={0.5} />,
          <path key={key()} d={star(x + 50, y + 83, 18)} fill={bg} fillOpacity={0.7} />,
        );
      });
      L.push(T(design.salon, 666, 104, F.sans, 18, 480, { anchor: "start", upper: true, spacing: 0.3, fill: accent }));
      L.push(T(design.backHeading, 660, 253, F.bold, 79, 510, { anchor: "start", upper: true, fill: dark }));
      copy(666, 340, 490, 21, "start", ink, 42);
      L.push(T("THÊM MỘT CHÚT MÀU CHO NGÀY MỚI", 666, 462, F.sans, 14, 490, { anchor: "start", upper: true, spacing: 0.12, fill: accent }));
      break;
    }
  }

  return (
    <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg" className={className} role="img" aria-label={`Mặt sau voucher ${design.title} – ${design.salon}`}>
      <rect width={W} height={H} fill={bg} />
      {L}
    </svg>
  );
}
