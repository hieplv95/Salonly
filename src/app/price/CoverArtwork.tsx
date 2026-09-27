import { useId } from "react";
import type { LogoIconId } from "@/lib/logo-templates";
import type { PriceDesign } from "@/lib/price-templates";
import { LogoIcon } from "../logo/LogoSvg";
import { Veins, hash, isDark } from "./PriceSvg";

// Ba mươi bố cục hình học riêng. Tất cả hoạ tiết là SVG để in sắc nét.
export function CoverArtwork({ design, W, H }: { design: PriceDesign; W: number; H: number }) {
  const { bg, surface, primary: p, accent: a, text } = design.colors;
  const u = W / 100;
  const X = (n: number) => W * n / 100;
  const Y = (n: number) => H * n / 100;
  const S = (n: number) => u * n;
  const id = useId().replace(/:/g, "");
  const mark = (x: number, y: number, size: number, icon: LogoIconId = design.decor, color = p) =>
    <LogoIcon id={icon} x={X(x)} y={Y(y)} size={S(size)} primary={color} accent={a} />;
  const initial = (design.salon.trim()[0] ?? "N").toLocaleUpperCase("vi");
  const monogram = (x: number, y: number, size: number, color = p) =>
    <text x={X(x)} y={Y(y) + S(size * 0.28)} textAnchor="middle" fontFamily="'Cormorant Garamond'" fontWeight="600" fontSize={S(size)} fill={color}>{initial}</text>;
  const rule = (x1: number, x2: number, y: number, color = a, width = 0.16) =>
    <path d={`M${X(x1)} ${Y(y)} H${X(x2)}`} stroke={color} strokeWidth={S(width)} />;

  switch (design.templateId) {
    case "classic-rose":
      return <>
        <rect x={X(6)} y={Y(5)} width={X(88)} height={Y(65)} fill="none" stroke={a} strokeWidth={S(0.16)} />
        {rule(14, 86, 8, p)}
        {mark(50, 38, 27, "polish")}
        {rule(42, 58, 52)}
      </>;
    case "classic-noir":
      return <>
        <rect x={X(6)} y={Y(5)} width={X(88)} height={Y(65)} fill="none" stroke={p} strokeWidth={S(0.28)} />
        <rect x={X(7.4)} y={Y(6.2)} width={X(85.2)} height={Y(62.6)} fill="none" stroke={a} strokeWidth={S(0.12)} />
        <circle cx={X(50)} cy={Y(37)} r={S(13)} fill="none" stroke={a} strokeWidth={S(0.2)} />
        <circle cx={X(50)} cy={Y(37)} r={S(11.4)} fill="none" stroke={p} strokeWidth={S(0.11)} />
        {monogram(50, 37, 16)}
        {rule(43, 57, 24)}
      </>;
    case "banner-blush":
      return <>
        <rect width={W} height={Y(17)} fill={p} />
        <path d={`M${X(12)} ${Y(22)} H${X(88)} M${X(12)} ${Y(68)} H${X(88)}`} stroke={a} strokeWidth={S(0.2)} />
        <circle cx={X(50)} cy={Y(36)} r={S(16)} fill={a} fillOpacity="0.16" />
        {mark(50, 36, 28)}
        <circle cx={X(26)} cy={Y(34)} r={S(0.7)} fill={p} /><circle cx={X(74)} cy={Y(34)} r={S(0.7)} fill={p} />
      </>;
    case "banner-teal":
      return <>
        <rect width={X(15)} height={Y(72)} fill={p} />
        <path d={`M${X(20)} ${Y(7)} V${Y(68)} M${X(24)} ${Y(24)} H${X(74)}`} stroke={a} strokeWidth={S(0.2)} />
        <circle cx={X(64)} cy={Y(39)} r={S(16)} fill={a} fillOpacity="0.12" stroke={p} strokeWidth={S(0.16)} />
        {mark(64, 39, 26)}
      </>;
    case "cards-nude":
      return <>
        <rect x={X(17)} y={Y(23)} width={X(56)} height={Y(27)} rx={S(3)} fill={a} fillOpacity="0.35" transform={`rotate(-8 ${X(45)} ${Y(36)})`} />
        <rect x={X(28)} y={Y(23)} width={X(56)} height={Y(27)} rx={S(3)} fill={surface} stroke={p} strokeWidth={S(0.18)} transform={`rotate(5 ${X(56)} ${Y(36)})`} />
        {mark(51, 36, 24, "polish")}
        {rule(37, 63, 55, p)}
      </>;
    case "cards-lavender":
      return <>
        <circle cx={X(50)} cy={Y(39)} r={S(21)} fill={a} fillOpacity="0.16" />
        <circle cx={X(50)} cy={Y(39)} r={S(19)} fill="none" stroke={p} strokeWidth={S(0.16)} />
        <circle cx={X(50)} cy={Y(39)} r={S(16)} fill="none" stroke={a} strokeWidth={S(0.12)} />
        {mark(50, 39, 27)}
        <path d={`M${X(14)} ${Y(60)} Q${X(50)} ${Y(55)} ${X(86)} ${Y(60)}`} fill="none" stroke={a} strokeWidth={S(0.15)} />
      </>;
    case "sidebar-plum":
      return <>
        <rect x={X(88)} width={X(12)} height={Y(72)} fill={p} />
        <path d={`M${X(13)} ${Y(8)} H${X(74)} M${X(13)} ${Y(68)} H${X(74)}`} stroke={a} strokeWidth={S(0.16)} />
        <rect x={X(25)} y={Y(30)} width={X(36)} height={Y(19)} fill="none" stroke={p} strokeWidth={S(0.17)} />
        {monogram(43, 39, 16)}
        {mark(78, 35, 8, "diamond", a)}
      </>;
    case "sidebar-peach":
      return <>
        <rect width={X(12)} height={Y(72)} fill={p} />
        <path d={`M${X(17)} ${Y(8)} V${Y(68)} M${X(26)} ${Y(65)} H${X(87)}`} stroke={a} strokeWidth={S(0.2)} />
        <ellipse cx={X(54)} cy={Y(39)} rx={S(18)} ry={S(15)} fill={a} fillOpacity="0.18" />
        {mark(54, 39, 28, "flower")}
      </>;
    case "minimal-mono":
      return <>
        {rule(10, 90, 8, p, 0.2)}
        <rect x={X(10)} y={Y(18)} width={X(3)} height={Y(12)} fill={p} />
        {mark(74, 56, 22, "sparkle")}
        {rule(10, 90, 69, p, 0.2)}
      </>;
    case "minimal-sage":
      return <>
        <path d={`M${X(10)} ${Y(8)} H${X(38)} M${X(10)} ${Y(8)} V${Y(19)} M${X(10)} ${Y(68)} H${X(90)}`} fill="none" stroke={p} strokeWidth={S(0.18)} />
        <circle cx={X(70)} cy={Y(39)} r={S(19)} fill={a} fillOpacity="0.14" />
        {mark(70, 39, 31, "laurel")}
      </>;
    case "arch-rose":
      return <>
        <path d={`M${X(8)} ${Y(69)} V${Y(31)} A${X(42)} ${Y(20)} 0 0 1 ${X(92)} ${Y(31)} V${Y(69)}`} fill={a} fillOpacity="0.12" stroke={p} strokeWidth={S(0.24)} />
        <path d={`M${X(10)} ${Y(68)} V${Y(32)} A${X(40)} ${Y(19)} 0 0 1 ${X(90)} ${Y(32)} V${Y(68)}`} fill="none" stroke={a} strokeWidth={S(0.13)} />
        {mark(50, 39, 28, "flower")}
      </>;
    case "arch-sky":
      return <>
        <path d={`M${X(15)} ${Y(62)} V${Y(27)} A${X(35)} ${Y(20)} 0 0 1 ${X(85)} ${Y(27)} V${Y(62)}`} fill={a} fillOpacity="0.18" stroke={p} strokeWidth={S(0.22)} />
        {mark(50, 39, 27, "diamond")}
        <rect y={Y(62)} width={W} height={Y(10)} fill={p} />
      </>;
    case "frame-nude":
      return <>
        <rect x={X(6)} y={Y(5)} width={X(88)} height={Y(65)} fill="none" stroke={p} strokeWidth={S(0.3)} />
        <rect x={X(8)} y={Y(6.5)} width={X(84)} height={Y(62)} fill="none" stroke={a} strokeWidth={S(0.12)} />
        {[[8, 6.5], [92, 6.5], [8, 68.5], [92, 68.5]].map(([x, y], i) => <circle key={i} cx={X(x)} cy={Y(y)} r={S(2.2)} fill={bg} stroke={p} strokeWidth={S(0.13)} />)}
        {mark(50, 41, 27, "laurel")}
        {rule(36, 64, 55)}
      </>;
    case "frame-cherry":
      return <>
        <rect x={X(5)} y={Y(5)} width={X(90)} height={Y(66)} fill={p} />
        <rect x={X(7)} y={Y(6.5)} width={X(86)} height={Y(63)} fill="none" stroke={bg} strokeWidth={S(0.15)} />
        <path d={`M${X(50)} ${Y(27)} L${X(65)} ${Y(38)} L${X(50)} ${Y(49)} L${X(35)} ${Y(38)} Z`} fill="none" stroke={bg} strokeWidth={S(0.19)} />
        {mark(50, 38, 26, "sparkle", bg)}
      </>;
    case "botanical-sage":
      return <>
        <g opacity="0.22" transform={`rotate(-21 ${X(12)} ${Y(14)})`}>{mark(12, 14, 31, "laurel")}</g>
        <g opacity="0.22" transform={`rotate(159 ${X(88)} ${Y(64)})`}>{mark(88, 64, 31, "laurel")}</g>
        {mark(50, 41, 25, "lotus")}
        {rule(27, 73, 29, p)}
      </>;
    case "botanical-blush":
      return <>
        <ellipse cx={X(50)} cy={Y(38)} rx={S(22)} ry={S(18)} fill="none" stroke={a} strokeWidth={S(0.16)} />
        {mark(24, 38, 10, "flower")}
        {mark(76, 38, 10, "flower")}
        {mark(50, 55, 9, "flower")}
        {mark(50, 38, 27, "flower")}
      </>;
    case "cards-noir":
      return <>
        <rect x={X(18)} y={Y(22)} width={X(65)} height={Y(28)} rx={S(1)} fill={a} fillOpacity="0.35" transform={`rotate(8 ${X(50)} ${Y(36)})`} />
        <rect x={X(12)} y={Y(21)} width={X(67)} height={Y(30)} rx={S(1)} fill={surface} stroke={p} strokeWidth={S(0.18)} transform={`rotate(-4 ${X(45)} ${Y(36)})`} />
        {mark(56, 36, 25, "crown")}
        {rule(14, 86, 69, p)}
      </>;
    case "banner-lavender":
      return <>
        <rect x={X(6)} y={Y(46)} width={X(88)} height={Y(11)} fill={p} />
        <path d={`M${X(6)} ${Y(8)} H${X(94)} M${X(6)} ${Y(67)} H${X(94)}`} stroke={a} strokeWidth={S(0.18)} />
        {mark(50, 34, 25, "butterfly")}
        <circle cx={X(16)} cy={Y(34)} r={S(1.1)} fill={a} /><circle cx={X(84)} cy={Y(34)} r={S(1.1)} fill={a} />
      </>;
    case "classic-peach":
      return <>
        <circle cx={X(50)} cy={Y(40)} r={S(20)} fill={a} fillOpacity="0.18" />
        {Array.from({ length: 12 }, (_, i) => {
          const angle = i * Math.PI / 6;
          const rounded = (n: number) => Math.round(n * 10000) / 10000;
          const x1 = rounded(X(50) + Math.cos(angle) * S(22));
          const y1 = rounded(Y(40) + Math.sin(angle) * S(22));
          const x2 = rounded(X(50) + Math.cos(angle) * S(27));
          const y2 = rounded(Y(40) + Math.sin(angle) * S(27));
          return <path key={i} d={`M${x1} ${y1} L${x2} ${y2}`} stroke={a} strokeWidth={S(0.18)} />;
        })}
        {mark(50, 40, 28, "butterfly")}
      </>;
    case "minimal-teal":
      return <>
        {rule(10, 90, 8, p)}
        <path d={`M${X(21)} ${Y(43)} V${Y(27)} Q${X(21)} ${Y(21)} ${X(30)} ${Y(21)} H${X(36)} Q${X(45)} ${Y(21)} ${X(45)} ${Y(27)} V${Y(43)} Q${X(45)} ${Y(50)} ${X(33)} ${Y(50)} Q${X(21)} ${Y(50)} ${X(21)} ${Y(43)} Z`} fill="none" stroke={p} strokeWidth={S(0.35)} />
        <path d={`M${X(29)} ${Y(21)} V${Y(16)} H${X(37)} V${Y(21)}`} fill="none" stroke={p} strokeWidth={S(0.35)} />
        {rule(53, 88, 25, a)}
      </>;
    case "marble-gold":
      return <>
        <Veins W={W} H={Y(72)} dark={isDark(bg)} gold={p} seed={hash(design.templateId)} id={id} />
        <rect x={X(7)} y={Y(6)} width={X(86)} height={Y(64)} fill={surface} fillOpacity="0.83" stroke={p} strokeWidth={S(0.24)} />
        <circle cx={X(50)} cy={Y(40)} r={S(18)} fill={a} fillOpacity="0.23" stroke={p} strokeWidth={S(0.18)} />
        {mark(50, 40, 26, "sparkle")}
      </>;
    case "marble-noir":
      return <>
        <Veins W={W} H={Y(72)} dark={isDark(bg)} gold={p} seed={hash(design.templateId)} id={id} />
        <path d={`M${X(9)} ${Y(69)} V${Y(8)} H${X(91)} M${X(13)} ${Y(65)} H${X(87)}`} fill="none" stroke={p} strokeWidth={S(0.2)} />
        <circle cx={X(50)} cy={Y(42)} r={S(14)} fill={surface} fillOpacity="0.85" stroke={a} strokeWidth={S(0.17)} />
        {monogram(50, 42, 18)}
      </>;
    case "marble-blush":
      return <>
        <Veins W={W} H={Y(72)} dark={isDark(bg)} gold={p} seed={hash(design.templateId)} id={id} />
        <path d={`M${X(43)} ${Y(67)} V${Y(29)} A${X(22)} ${Y(20)} 0 0 1 ${X(87)} ${Y(29)} V${Y(67)} Z`} fill={surface} fillOpacity="0.83" stroke={p} strokeWidth={S(0.17)} />
        {mark(64, 42, 27, "flower")}
        {rule(15, 37, 67, p)}
      </>;
    case "marble-grey":
      return <>
        <Veins W={W} H={Y(72)} dark={isDark(bg)} gold={p} seed={hash(design.templateId)} id={id} />
        <path d={`M${X(6)} ${Y(69)} L${X(52)} ${Y(8)} H${X(94)} L${X(48)} ${Y(69)} Z`} fill={surface} fillOpacity="0.8" stroke={a} strokeWidth={S(0.16)} />
        {mark(36, 42, 28, "diamond")}
      </>;
    case "split-gold":
      return <>
        <path d={`M0 0 H${W} V${Y(7)} L0 ${Y(68)} Z`} fill={a} fillOpacity="0.38" />
        <path d={`M${X(5)} ${Y(68)} L${X(95)} ${Y(8)}`} stroke={p} strokeWidth={S(0.27)} />
        {mark(64, 40, 28, "sparkle")}
        <circle cx={X(64)} cy={Y(40)} r={S(18)} fill="none" stroke={a} strokeWidth={S(0.16)} />
      </>;
    case "split-noir":
      return <>
        <rect x={X(12)} y={Y(8)} width={X(88)} height={Y(63)} fill={p} />
        <rect x={X(12)} y={Y(8)} width={X(34)} height={Y(63)} fill={surface} />
        <path d={`M${X(46)} ${Y(8)} V${Y(71)} M${X(17)} ${Y(67)} H${X(92)}`} stroke={a} strokeWidth={S(0.19)} />
        {mark(36, 41, 27, "crown")}
      </>;
    case "editorial-ivory":
      return <>
        {rule(10, 90, 8, p, 0.22)}
        <text x={X(10)} y={Y(64)} fontFamily="'Cormorant Garamond'" fontSize={S(38)} fill={a} fillOpacity="0.24">N</text>
        {mark(77, 58, 18, "sparkle")}
        {rule(10, 90, 69, p, 0.18)}
      </>;
    case "editorial-blush":
      return <>
        <rect x={X(8)} y={Y(8)} width={X(12)} height={Y(61)} fill={a} fillOpacity="0.35" />
        <text transform={`rotate(-90 ${X(16)} ${Y(61)})`} x={X(16)} y={Y(61)} fontFamily="'Montserrat'" fontWeight="700" fontSize={S(10)} letterSpacing={S(1.2)} fill={p} fillOpacity="0.6">NAIL</text>
        {mark(68, 40, 29, "flower")}
        {rule(27, 87, 69, p)}
      </>;
    case "editorial-sage":
      return <>
        <rect x={X(58)} y={Y(8)} width={X(34)} height={Y(61)} fill={a} fillOpacity="0.28" />
        <path d={`M${X(12)} ${Y(8)} V${Y(68)} M${X(12)} ${Y(68)} H${X(92)}`} stroke={p} strokeWidth={S(0.18)} />
        {mark(70, 43, 26, "laurel")}
      </>;
    case "editorial-noir":
      return <>
        <rect x={X(6)} y={Y(6)} width={X(88)} height={Y(65)} fill="none" stroke={p} strokeWidth={S(0.24)} />
        <text x={X(50)} y={Y(53)} textAnchor="middle" fontFamily="'Cormorant Garamond'" fontSize={S(50)} fill="none" stroke={a} strokeOpacity="0.25" strokeWidth={S(0.13)}>N</text>
        {mark(50, 40, 28, "diamond")}
        {rule(24, 76, 57, p)}
      </>;
    default:
      return <>{mark(50, 38, 27)}{rule(20, 80, 68, text)}</>;
  }
}
