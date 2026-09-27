import { useId, type Ref } from "react";
import { fit, useMeasure, type Fit } from "../design/measure";
import { LAYOUT_USES_ICON, LOGO_FONTS, TAGLINE_FONT, fontOf, type LogoDesign, type LogoIconId } from "@/lib/logo-templates";
import { SignatureLogo } from "./SignatureLogo";

// Mọi logo vẽ trên khung 400×400; khi tải về được phóng to thành 2000×2000.
export const LOGO_SIZE = 400;
const C = LOGO_SIZE / 2;

/* ---------- Biểu tượng (vẽ trong ô 100×100) ---------- */

const NAIL = "M50 8 C59 18 66 32 66 47 L66 80 Q66 93 50 93 Q34 93 34 80 L34 47 C34 32 41 18 50 8 Z";

function star(cx: number, cy: number, r: number) {
  const a = r * 0.1;
  const b = r * 0.25;
  return (
    `M${cx} ${cy - r} C${cx + a} ${cy - b} ${cx + b} ${cy - a} ${cx + r} ${cy} ` +
    `C${cx + b} ${cy + a} ${cx + a} ${cy + b} ${cx} ${cy + r} ` +
    `C${cx - a} ${cy + b} ${cx - b} ${cy + a} ${cx - r} ${cy} ` +
    `C${cx - b} ${cy - a} ${cx - a} ${cy - b} ${cx} ${cy - r} Z`
  );
}

function IconArt({ id, primary, accent }: { id: LogoIconId; primary: string; accent: string }) {
  const line = { stroke: primary, strokeWidth: 3.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (id) {
    case "nails":
      return (
        <g transform="translate(7.5 6) scale(0.85)">
          <path d={NAIL} fill={accent} transform="rotate(-28 50 96)" />
          <path d={NAIL} fill={accent} transform="rotate(28 50 96)" />
          <path d={NAIL} fill={primary} />
          <path d="M44 30 C42 40 42 52 43 64" fill="none" stroke="#fff" strokeOpacity={0.7} strokeWidth={3.5} strokeLinecap="round" />
        </g>
      );
    case "polish":
      return (
        <g>
          <rect x="40" y="6" width="20" height="30" rx="4" fill={primary} />
          <path d="M45 12 V30 M50 12 V30 M55 12 V30" stroke="#fff" strokeOpacity={0.3} strokeWidth={1.5} />
          <rect x="35" y="36" width="30" height="9" rx="2" fill={primary} />
          <path d="M30 45 H70 Q80 45 80 57 V82 Q80 94 68 94 H32 Q20 94 20 82 V57 Q20 45 30 45 Z" fill={accent} />
          <path d="M20 68 Q50 60 80 68 V82 Q80 94 68 94 H32 Q20 94 20 82 Z" fill={primary} fillOpacity={0.35} />
          <path d="M28 56 Q26 70 30 84" fill="none" stroke="#fff" strokeOpacity={0.75} strokeWidth={4} strokeLinecap="round" />
        </g>
      );
    case "lotus":
      return (
        <g fill="none" {...line}>
          <path d="M50 18 C61 32 61 54 50 70 C39 54 39 32 50 18 Z" fill={accent} />
          <path d="M50 70 C38 64 28 50 27 34 C40 38 49 52 50 70 Z" />
          <path d="M50 70 C62 64 72 50 73 34 C60 38 51 52 50 70 Z" />
          <path d="M49 72 C34 73 18 66 9 52 C25 49 40 57 49 72 Z" />
          <path d="M51 72 C66 73 82 66 91 52 C75 49 60 57 51 72 Z" />
          <path d="M20 84 Q35 78 50 84 T80 84" stroke={accent} />
        </g>
      );
    case "sparkle":
      return (
        <g>
          <path d={star(46, 54, 38)} fill={primary} />
          <path d={star(80, 20, 12)} fill={accent} />
          <path d={star(84, 78, 7)} fill={accent} />
        </g>
      );
    case "crown":
      return (
        <g>
          <path d="M16 72 L12 34 L32 52 L50 24 L68 52 L88 34 L84 72 Z" fill={accent} {...line} strokeWidth={3.5} />
          <path d="M18 83 H82" {...line} strokeWidth={5} />
          <circle cx="12" cy="34" r="5" fill={primary} />
          <circle cx="50" cy="24" r="5" fill={primary} />
          <circle cx="88" cy="34" r="5" fill={primary} />
          <path d={star(50, 58, 8)} fill={primary} />
        </g>
      );
    case "butterfly":
      return (
        <g>
          <g fill={accent} {...line} strokeWidth={3}>
            <path d="M48 48 C38 24 16 14 9 26 C3 38 20 50 48 50 Z" />
            <path d="M48 53 C30 55 17 67 23 78 C29 88 43 76 48 53 Z" />
            <path d="M52 48 C62 24 84 14 91 26 C97 38 80 50 52 50 Z" />
            <path d="M52 53 C70 55 83 67 77 78 C71 88 57 76 52 53 Z" />
          </g>
          <path d="M50 34 V76" {...line} strokeWidth={4} />
          <path d="M50 36 Q46 22 39 16 M50 36 Q54 22 61 16" fill="none" {...line} strokeWidth={2.5} />
        </g>
      );
    case "flower":
      return (
        <g>
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx="50" cy="29" rx="13" ry="21" transform={`rotate(${a} 50 50)`} fill={accent} {...line} strokeWidth={2.6} />
          ))}
          <circle cx="50" cy="50" r="10" fill={primary} />
        </g>
      );
    case "laurel": {
      // Vòng lá: 7 lá mỗi bên dọc theo cung tròn, lá xoay theo hướng cung.
      const r = 38;
      const round = (n: number) => Math.round(n * 10000) / 10000;
      const leaves = (from: number, to: number) =>
        Array.from({ length: 7 }, (_, i) => {
          const a = from + ((to - from) * i) / 6;
          const rad = (a * Math.PI) / 180;
          const off = i % 2 ? 5 : -5;
          const x = round(50 + (r + off) * Math.cos(rad));
          const y = round(52 + (r + off) * Math.sin(rad));
          return <ellipse key={a} cx={x} cy={y} rx="4.2" ry="9.5" transform={`rotate(${a} ${x} ${y})`} fill={primary} />;
        });
      const pt = (a: number) => [round(50 + r * Math.cos((a * Math.PI) / 180)), round(52 + r * Math.sin((a * Math.PI) / 180))];
      const [l0, l1] = [pt(112), pt(238)];
      const [r0, r1] = [pt(68), pt(-58)];
      return (
        <g>
          <path d={`M${l0[0]} ${l0[1]} A${r} ${r} 0 0 1 ${l1[0]} ${l1[1]}`} fill="none" stroke={primary} strokeWidth={2} />
          <path d={`M${r0[0]} ${r0[1]} A${r} ${r} 0 0 0 ${r1[0]} ${r1[1]}`} fill="none" stroke={primary} strokeWidth={2} />
          {leaves(112, 238)}
          {leaves(68, -58)}
          <path d={star(50, 50, 15)} fill={accent} />
        </g>
      );
    }
    case "hand":
      // Bàn tay giơ lên khoe móng dài.
      return (
        <g>
          <path
            d="M36 94 C34 80 30 70 29 60 L27 36 Q27 30 32 29.5 Q37 29 38 35 L40 52 L40 20 Q40 13 46 13 Q52 13 52 20 L52 50 L54 18 Q54 11 60 11.5 Q66 12 65.5 19 L63.5 52 L68 36 Q70 30 75 31.5 Q80 33 78.5 39 L71 68 C69 78 66 87 64 94"
            fill={accent}
            fillOpacity={0.45}
            {...line}
            strokeWidth={2.8}
          />
          <ellipse cx="32.3" cy="31.5" rx="3.2" ry="5" fill={primary} />
          <ellipse cx="46" cy="15.5" rx="3.4" ry="5.5" fill={primary} />
          <ellipse cx="60" cy="14" rx="3.4" ry="5.5" fill={primary} />
          <ellipse cx="76" cy="34.5" rx="3" ry="5" transform="rotate(18 76 34.5)" fill={primary} />
        </g>
      );
    case "foot":
      return (
        <g>
          <path d="M40 38 C28 44 26 62 30 76 C33 88 42 94 50 92 C60 90 64 80 62 68 C60 58 66 50 66 42 C66 34 52 32 40 38 Z" fill={accent} {...line} strokeWidth={2.8} />
          <circle cx="40" cy="23" r="7" fill={primary} />
          <circle cx="52" cy="19" r="5" fill={primary} />
          <circle cx="61" cy="21" r="4.4" fill={primary} />
          <circle cx="68" cy="26.5" r="3.8" fill={primary} />
          <circle cx="73" cy="33.5" r="3.2" fill={primary} />
        </g>
      );
    case "lineHand":
      return (
        <g fill="none" stroke={primary} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}>
          <path d="M35 96 C29 83 30 71 37 62 L52 42 Q56 37 60 40 Q63 43 59 48 L48 62 L67 42 Q72 37 76 40 Q80 44 75 49 L56 68 L77 54 Q83 50 86 55 Q89 60 82 64 L60 78 C69 74 76 77 75 82 Q74 86 67 87 L56 90 C48 93 43 96 41 100" />
          <path d="M31 87 C26 76 28 66 33 57 L48 31 Q52 24 57 27 Q61 30 57 37" />
          <path d="M56 28 Q61 22 65 26 Q68 30 64 35 M76 40 Q80 35 84 39 Q87 43 83 48 M86 55 Q91 52 94 57 Q95 61 90 65" />
          <path d="M56 28 Q58 24 61 27 M76 40 Q79 38 82 41 M86 56 Q89 55 91 58" stroke={accent} strokeWidth={4.5} />
        </g>
      );
    case "polishCutout":
      return (
        <g>
          <path d="M39 4 H61 Q65 4 65 9 V36 H35 V9 Q35 4 39 4 Z M33 35 H67 V43 H33 Z" fill={primary} />
          <path d="M28 44 H72 Q80 44 82 54 L85 84 Q86 96 75 96 H25 Q14 96 15 84 L18 54 Q20 44 28 44 Z M50 57 C60 66 63 76 61 84 Q59 91 50 91 Q41 91 39 84 Q37 76 50 57 Z" fill={primary} fillRule="evenodd" />
          <path d="M87 46 C94 56 95 62 90 66 C84 69 79 64 82 58 Z" fill={accent} />
          <path d="M23 55 Q21 66 23 80" fill="none" stroke={accent} strokeWidth={3} strokeLinecap="round" />
        </g>
      );
    case "leafFeet":
      return (
        <g fill="none" stroke={primary} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2}>
          <path d="M24 29 C15 47 15 72 25 85 Q32 94 40 90 Q45 86 44 77 L39 55 Q38 45 46 37 Z" fill={accent} fillOpacity={0.3} stroke="none" />
          <path d="M76 29 C85 47 85 72 75 85 Q68 94 60 90 Q55 86 56 77 L61 55 Q62 45 54 37 Z" fill={accent} fillOpacity={0.3} stroke="none" />
          <path d="M24 29 C15 47 15 72 25 85 Q32 94 40 90 Q45 86 44 77 L39 55 Q38 45 46 37" />
          <path d="M76 29 C85 47 85 72 75 85 Q68 94 60 90 Q55 86 56 77 L61 55 Q62 45 54 37" />
          <path d="M50 17 Q43 26 48 40 Q52 28 50 17 Z" fill={accent} stroke="none" />
          <path d="M50 16 Q60 5 73 7 Q72 24 53 31 Q48 33 45 36" fill={accent} stroke="none" />
          <path d="M49 35 Q60 18 68 12" stroke={primary} strokeWidth={1.5} />
          {[23, 30, 37, 44].map((x, i) => <ellipse key={`l${x}`} cx={x} cy={88 - i * 3} rx="2.3" ry="3.5" fill={accent} stroke="none" />)}
          {[77, 70, 63, 56].map((x, i) => <ellipse key={`r${x}`} cx={x} cy={88 - i * 3} rx="2.3" ry="3.5" fill={accent} stroke="none" />)}
        </g>
      );
    case "nailFan":
      return (
        <g transform="translate(50 91) scale(.73)">
          {[-48, -24, 0, 24, 48].map((a) => (
            <g key={a} transform={`rotate(${a})`}>
              <path d="M0 -88 C15 -74 21 -49 19 -25 Q18 -4 0 0 Q-18 -4 -19 -25 C-21 -49 -15 -74 0 -88 Z" fill={a === 0 ? accent : primary} fillOpacity={a === 0 ? 1 : 0.8} />
              <path d="M-7 -69 Q-12 -54 -11 -38" fill="none" stroke="#fff" strokeOpacity={0.75} strokeWidth={3.5} strokeLinecap="round" />
            </g>
          ))}
        </g>
      );
    case "bottleFlower":
      return (
        <g>
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx="50" cy="26" rx="14" ry="25" transform={`rotate(${a} 50 51)`} fill={a === 144 || a === 216 ? primary : accent} fillOpacity={0.9} />
          ))}
          <rect x="43" y="35" width="14" height="16" rx="2" fill={primary} />
          <rect x="34" y="49" width="32" height="31" rx="7" fill={accent} stroke={primary} strokeWidth={3} />
          <path d="M41 56 Q38 64 40 72" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" />
        </g>
      );
    case "polishStroke":
      return (
        <g>
          <rect x="12" y="36" width="27" height="46" rx="5" fill={primary} />
          <path d="M14 50 Q11 61 15 73" fill="none" stroke="#fff" strokeOpacity={0.8} strokeWidth={3} strokeLinecap="round" />
          <rect x="16" y="29" width="19" height="8" rx="2" fill={accent} />
          <path d="M14 89 C32 77 52 80 68 77 Q80 75 86 65" fill="none" stroke={accent} strokeWidth={7} strokeLinecap="round" />
          <path d="M62 10 L78 37" stroke={primary} strokeWidth={5} strokeLinecap="round" />
          <path d="M56 7 L66 2 L84 31 L74 37 Z" fill={accent} stroke={primary} strokeWidth={2} />
          <path d="M78 37 L85 50" stroke={primary} strokeWidth={2.5} />
          <path d="M85 50 Q92 57 86 64 Q82 59 85 50 Z" fill={accent} />
          <path d={star(92, 80, 7)} fill={primary} />
        </g>
      );
    case "handFootCircle":
      return (
        <g>
          <path d="M50 5 A45 45 0 1 0 95 50" fill="none" stroke={accent} strokeWidth={5} strokeLinecap="round" />
          <path d="M50 95 A45 45 0 0 0 95 50" fill="none" stroke={primary} strokeWidth={5} strokeLinecap="round" />
          <path d="M22 60 Q24 45 34 38 L47 26 Q51 22 55 26 Q58 29 54 33 L43 45 L58 31 Q63 27 66 30 Q69 33 64 38 L47 54 L61 44 Q66 41 69 44 Q72 48 66 52 L47 69" fill="none" stroke={primary} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M56 56 C66 53 74 60 75 68 Q77 79 67 86 Q55 93 48 84 C43 77 48 65 56 56 Z" fill={accent} fillOpacity={0.35} stroke={primary} strokeWidth={2.2} />
          {[55, 62, 69, 76].map((x, i) => <ellipse key={x} cx={x} cy={69 - i * 1.8} rx={3 - i * 0.25} ry="2.4" fill={primary} />)}
        </g>
      );
    case "chromeNail":
      return (
        <g>
          <path d="M50 5 C69 20 76 43 73 70 Q71 91 50 96 Q29 91 27 70 C24 43 31 20 50 5 Z" fill={primary} stroke={accent} strokeWidth={3} />
          <path d="M40 18 C30 35 32 59 35 76 Q39 88 49 90 C42 72 47 44 63 20 Q53 10 50 8 Z" fill={accent} fillOpacity={0.95} />
          <path d="M39 27 Q35 43 37 58" fill="none" stroke="#fff" strokeWidth={4.5} strokeLinecap="round" />
          <path d={star(61, 45, 12)} fill="#fff" />
          <path d={star(72, 24, 4)} fill={accent} />
        </g>
      );
    case "spaFoot":
      return (
        <g>
          <path d="M45 8 Q31 26 36 43 C39 53 48 56 52 68 Q56 77 67 77" fill="none" stroke={primary} strokeWidth={2.6} strokeLinecap="round" />
          <path d="M61 9 Q62 32 65 44 Q68 58 77 66 Q82 71 78 77" fill="none" stroke={primary} strokeWidth={2.6} strokeLinecap="round" />
          {[48, 55, 62, 69, 76].map((x, i) => <ellipse key={x} cx={x} cy={73 + i * 0.5} rx={3.1 - i * 0.3} ry={2.2} fill={accent} />)}
          <path d="M13 79 Q36 69 55 80 Q74 89 91 78 M19 89 Q51 97 83 88" fill="none" stroke={accent} strokeWidth={3.5} strokeLinecap="round" />
        </g>
      );
    case "brush":
      return (
        <g>
          <path d="M20 90 L50 53" {...line} strokeWidth={8} />
          <path d="M48 55 L59 41 L67 48 L56 61 Z" fill={primary} />
          <path d="M59 41 C65 27 77 16 90 10 C88 24 80 39 67 48 Z" fill={accent} {...line} strokeWidth={2.6} />
        </g>
      );
    case "lipstick":
      return (
        <g>
          <path d="M41 46 V28 L59 13 V46 Z" fill={accent} {...line} strokeWidth={2.8} />
          <rect x="37" y="45" width="26" height="13" rx="1.5" fill={accent} {...line} strokeWidth={2.8} />
          <rect x="33" y="58" width="34" height="34" rx="3" fill={primary} />
          <path d="M40 64 V86" stroke="#fff" strokeOpacity={0.35} strokeWidth={3} strokeLinecap="round" />
        </g>
      );
    case "mirror":
      return (
        <g>
          <rect x="45" y="62" width="10" height="32" rx="5" fill={primary} />
          <circle cx="50" cy="38" r="27" fill={accent} fillOpacity={0.35} {...line} strokeWidth={4} />
          <circle cx="50" cy="38" r="20" fill="none" stroke={primary} strokeOpacity={0.5} strokeWidth={1.6} />
          <path d="M38 30 Q40 22 48 20" fill="none" stroke="#fff" strokeOpacity={0.8} strokeWidth={3.5} strokeLinecap="round" />
        </g>
      );
    case "perfume":
      return (
        <g>
          <rect x="42" y="8" width="16" height="11" rx="2" fill={primary} />
          <rect x="45" y="19" width="10" height="9" fill={primary} />
          <rect x="22" y="28" width="56" height="64" rx="15" fill={accent} {...line} strokeWidth={2.8} />
          <rect x="34" y="50" width="32" height="20" rx="3" fill="none" stroke={primary} strokeWidth={1.8} />
          <path d={star(50, 60, 6)} fill={primary} />
          <path d="M30 40 Q28 56 32 72" fill="none" stroke="#fff" strokeOpacity={0.7} strokeWidth={3.5} strokeLinecap="round" />
        </g>
      );
    case "cream":
      return (
        <g>
          <path d="M24 46 H76 V78 Q76 90 64 90 H36 Q24 90 24 78 Z" fill={accent} {...line} strokeWidth={2.8} />
          <rect x="18" y="30" width="64" height="17" rx="4" fill={primary} />
          <path d="M26 38.5 H74" stroke="#fff" strokeOpacity={0.3} strokeWidth={2} />
          <path d="M50 58 C60 60 62 70 50 80 C38 70 40 60 50 58 Z" fill={primary} fillOpacity={0.8} />
          <path d="M50 62 V78" stroke={accent} strokeWidth={1.4} />
        </g>
      );
    case "dropper":
      return (
        <g>
          <path d="M44 20 V9 Q50 3 56 9 V20 Z" fill={primary} />
          <rect x="40" y="19" width="20" height="9" rx="2" fill={primary} />
          <path d="M36 28 H64 V38 Q76 44 76 58 V82 Q76 92 66 92 H34 Q24 92 24 82 V58 Q24 44 36 38 Z" fill={accent} {...line} strokeWidth={2.8} />
          <path d="M50 50 C57 59 59 65 59 69 A9 9 0 0 1 41 69 C41 65 43 59 50 50 Z" fill={primary} />
        </g>
      );
    case "leaf":
      return (
        <g>
          <path d="M40 84 C22 72 16 50 26 30 C44 38 52 58 40 84 Z" fill={accent} {...line} strokeWidth={2.6} />
          <path d="M52 90 C30 70 30 40 56 10 C80 40 76 70 52 90 Z" fill={accent} {...line} strokeWidth={2.8} />
          <path d="M53 88 C52 66 54 40 56 18 M54 60 L66 48 M54 72 L44 62 M55 46 L46 38" fill="none" {...line} strokeWidth={2} />
        </g>
      );
    case "stones":
      return (
        <g>
          <ellipse cx="50" cy="82" rx="32" ry="10" fill={primary} />
          <ellipse cx="50" cy="64" rx="24" ry="8.5" fill={accent} {...line} strokeWidth={2.4} />
          <ellipse cx="50" cy="48" rx="16" ry="7" fill={primary} />
          <path d="M52 40 C54 28 62 22 72 20 C70 30 62 38 52 40 Z" fill={accent} {...line} strokeWidth={2} />
          <path d="M50 41 C44 32 36 30 30 31 C33 38 41 42 50 41 Z" fill={accent} {...line} strokeWidth={2} />
        </g>
      );
    case "candle":
      return (
        <g>
          <path d="M50 10 C59 21 61 30 50 37 C39 30 41 21 50 10 Z" fill={primary} />
          <path d="M50 21 C54 26 54 31 50 34 C46 31 46 26 50 21 Z" fill={accent} />
          <path d="M50 37 V45" {...line} strokeWidth={2.2} />
          <rect x="28" y="45" width="44" height="46" rx="7" fill={accent} {...line} strokeWidth={2.8} />
          <path d="M28 56 H72" stroke={primary} strokeWidth={2} />
          <path d={star(50, 74, 7)} fill={primary} />
        </g>
      );
    case "towel":
      return (
        <g>
          <rect x="12" y="60" width="76" height="26" rx="13" fill={accent} {...line} strokeWidth={2.8} />
          <circle cx="25" cy="73" r="10" fill={accent} {...line} strokeWidth={2.4} />
          <circle cx="25" cy="73" r="4" fill="none" stroke={primary} strokeWidth={2} />
          <rect x="22" y="34" width="60" height="24" rx="12" fill={accent} {...line} strokeWidth={2.8} />
          <circle cx="34" cy="46" r="9" fill={accent} {...line} strokeWidth={2.4} />
          <circle cx="34" cy="46" r="3.5" fill="none" stroke={primary} strokeWidth={2} />
          <circle cx="66" cy="24" r="5" fill={primary} />
          <path d="M66 19 C62 12 70 8 72 14 M66 19 C70 12 60 8 60 14" fill="none" stroke={primary} strokeWidth={1.6} />
        </g>
      );
    case "rose":
      return (
        <g>
          <path d="M22 80 C30 70 40 72 44 78 C36 84 28 84 22 80 Z M78 80 C70 70 60 72 56 78 C64 84 72 84 78 80 Z" fill={primary} fillOpacity={0.85} />
          <circle cx="50" cy="44" r="32" fill={accent} {...line} strokeWidth={2.8} />
          <path
            d="M50 44 m-4 0 a4 4 0 1 1 8 0 a8 8 0 1 1 -16 0 a12 12 0 1 1 24 0 a16 16 0 1 1 -32 0 a20 20 0 1 1 40 0"
            fill="none"
            {...line}
            strokeWidth={2.4}
          />
        </g>
      );
    case "heart":
      return (
        <g>
          <path d="M48 88 C20 68 8 50 16 34 C23 20 42 20 48 34 C54 20 73 20 80 34 C88 50 76 68 48 88 Z" fill={accent} {...line} strokeWidth={3} />
          <path d="M28 40 Q30 32 38 31" fill="none" stroke="#fff" strokeOpacity={0.8} strokeWidth={3.5} strokeLinecap="round" />
          <path d={star(82, 16, 11)} fill={primary} />
        </g>
      );
    case "comb":
      return (
        <g>
          <rect x="12" y="28" width="76" height="18" rx="6" fill={primary} />
          <path d={Array.from({ length: 11 }, (_, i) => `M${18 + i * 6.4} 46 V${i % 2 ? 70 : 78}`).join(" ")} {...line} strokeWidth={3.2} />
          <path d={star(80, 16, 7)} fill={accent} />
        </g>
      );
    case "scissors":
      return (
        <g>
          <path d="M40 66 L68 12 M60 66 L32 12" {...line} strokeWidth={5.5} />
          <circle cx="33" cy="77" r="11" fill={accent} {...line} strokeWidth={4} />
          <circle cx="67" cy="77" r="11" fill={accent} {...line} strokeWidth={4} />
          <circle cx="50" cy="40" r="3.5" fill={accent} stroke={primary} strokeWidth={2} />
        </g>
      );
    case "file":
      return (
        <g>
          <rect x="43" y="4" width="14" height="92" rx="7" transform="rotate(38 50 50)" fill={accent} {...line} strokeWidth={2.8} />
          <path
            d={Array.from({ length: 9 }, (_, i) => {
              const t = -34 + i * 8.5;
              const r = (38 * Math.PI) / 180;
              const cx = 50 + t * Math.sin(r);
              const cy = 50 - t * Math.cos(r);
              return `M${cx - 4 * Math.cos(r)} ${cy - 4 * Math.sin(r)} L${cx + 4 * Math.cos(r)} ${cy + 4 * Math.sin(r)}`;
            }).join(" ")}
            stroke={primary}
            strokeOpacity={0.55}
            strokeWidth={1.6}
          />
          <path d={star(22, 24, 10)} fill={primary} />
          <path d={star(80, 80, 7)} fill={primary} />
        </g>
      );
    case "drip":
      return (
        <g>
          <path
            d="M12 16 H88 V38 Q88 45 82 45 Q76 45 76 38 V35 Q76 30 72 30 Q68 30 68 36 V60 Q68 68 61 68 Q54 68 54 60 V41 Q54 35 50 35 Q46 35 46 41 V50 Q46 56 40 56 Q34 56 34 50 V37 Q34 32 30 32 Q26 32 26 38 V42 Q26 48 19 48 Q12 48 12 42 Z"
            fill={primary}
          />
          <path d="M61 76 C66 83 67 86 67 88 A6 6 0 0 1 55 88 C55 86 56 83 61 76 Z" fill={accent} />
          <path d="M22 22 H40" stroke="#fff" strokeOpacity={0.4} strokeWidth={3} strokeLinecap="round" />
        </g>
      );
    case "eyelash":
      return (
        <g>
          <path d="M14 44 Q50 78 86 44" fill="none" {...line} strokeWidth={4} />
          <path d="M23 52 L15 63 M33 58 L28 71 M44 62 L42 76 M56 62 L58 76 M67 58 L72 71 M77 52 L85 63" {...line} strokeWidth={3} />
          <path d={star(50, 26, 10)} fill={accent} />
          <path d={star(72, 18, 5)} fill={accent} />
        </g>
      );
    case "shell":
      return (
        <g>
          <path d="M50 86 L12 46 Q12 16 50 12 Q88 16 88 46 Z" fill={accent} {...line} strokeWidth={2.8} strokeLinejoin="round" />
          <path d="M50 84 L20 30 M50 84 L34 17 M50 84 V13 M50 84 L66 17 M50 84 L80 30" fill="none" {...line} strokeWidth={2} />
          <rect x="42" y="84" width="16" height="8" rx="3" fill={primary} />
        </g>
      );
    case "diamond":
      return (
        <g {...line}>
          <path d="M28 18 H72 L90 40 L50 90 L10 40 Z" fill={accent} fillOpacity={0.4} strokeWidth={3.5} />
          <path d="M10 40 H90 M28 18 L38 40 L50 90 M72 18 L62 40 L50 90 M38 40 L50 18 L62 40" fill="none" strokeWidth={2.4} />
        </g>
      );
  }
}

export function LogoIcon({ id, x, y, size, primary, accent }: { id: LogoIconId; x: number; y: number; size: number; primary: string; accent: string }) {
  return (
    <g transform={`translate(${x - size / 2} ${y - size / 2}) scale(${size / 100})`}>
      <IconArt id={id} primary={primary} accent={accent} />
    </g>
  );
}

function Text({
  x,
  y,
  text,
  family,
  weight,
  f,
  fill,
  opacity,
  anchor = "middle",
  spacing = 0,
}: {
  x: number;
  y: number;
  text: string;
  family: string;
  weight: number;
  f: Fit;
  fill: string;
  opacity?: number;
  anchor?: "start" | "middle";
  spacing?: number;
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      fontFamily={`'${family}'`}
      fontWeight={weight}
      fontSize={f.size}
      letterSpacing={spacing}
      fill={fill}
      fillOpacity={opacity}
      textLength={f.length}
      lengthAdjust={f.length ? "spacingAndGlyphs" : undefined}
    >
      {text}
    </text>
  );
}

// Slogan chữ in hoa giãn cách, có 2 gạch trang trí hai bên nếu còn chỗ.
function Tagline({ text, y, color, accent, size = 13, maxWidth = 320, lines = true }: { text: string; y: number; color: string; accent: string; size?: number; maxWidth?: number; lines?: boolean }) {
  const measure = useMeasure();
  if (!text) return null;
  const spacing = size * 0.28;
  const f = fit(text, TAGLINE_FONT.width * 1.08, size, 9, maxWidth, spacing, measure(text, TAGLINE_FONT.family, TAGLINE_FONT.weight, size, spacing));
  const half = f.width / 2;
  const showLines = lines && half + 50 < C - 20;
  return (
    <g>
      <Text x={C} y={y} text={text} family={TAGLINE_FONT.family} weight={TAGLINE_FONT.weight} f={f} fill={color} opacity={0.8} spacing={f.size * 0.28} />
      {showLines && (
        <path
          d={`M${C - half - 44} ${y - f.size * 0.35} H${C - half - 14} M${C + half + 14} ${y - f.size * 0.35} H${C + half + 44}`}
          stroke={accent}
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      )}
    </g>
  );
}

const STOP_WORDS = ["nail", "nails", "spa", "studio", "salon", "house", "bar", "&", "và", "tiệm", "lounge"];
function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = words[0]?.[0] ?? "N";
  const second = words[1] && !STOP_WORDS.includes(words[1].toLowerCase()) ? words[1][0] : "";
  return (first + second).toUpperCase();
}

/* ---------- Logo hoàn chỉnh ---------- */

export function LogoSvg({ design, svgRef, className }: { design: LogoDesign; svgRef?: Ref<SVGSVGElement>; className?: string }) {
  const uid = useId().replace(/:/g, "");
  const measure = useMeasure();
  const { primary, accent, bg } = design.colors;
  const font = fontOf(design.font);
  const upper = design.upper && !font.script;
  const name = (upper ? design.name.toLocaleUpperCase("vi") : design.name).trim() || " ";
  const tagline = design.tagline.trim().toLocaleUpperCase("vi");
  const nameSpacing = upper ? 2 : 0;
  const cw = font.width * (upper ? 1.15 : 1);
  const icon = (x: number, y: number, size: number, iconPrimary = primary) =>
    LAYOUT_USES_ICON[design.layout] ? <LogoIcon id={design.icon} x={x} y={y} size={size} primary={iconPrimary} accent={accent} /> : null;
  const nameAt = (y: number, base: number, maxWidth = 330, x = C, anchor: "start" | "middle" = "middle") => {
    const f = fit(name, cw, base, 18, maxWidth, nameSpacing, measure(name, font.family, font.weight, base, nameSpacing));
    return <Text x={x} y={y} text={name} family={font.family} weight={font.weight} f={f} fill={primary} anchor={anchor} spacing={nameSpacing * (f.size / base)} />;
  };

  let body: React.ReactNode;
  switch (design.layout) {
    case "stack":
      body = (
        <>
          {icon(C, 128, design.templateId.startsWith("top-") ? 140 : 120)}
          {nameAt(262, 50)}
          <Tagline text={tagline} y={300} color={primary} accent={accent} />
        </>
      );
      break;
    case "row": {
      const f = fit(tagline, TAGLINE_FONT.width * 1.08, 11, 8, 210, 3, measure(tagline, TAGLINE_FONT.family, TAGLINE_FONT.weight, 11, 11 * 0.26));
      body = (
        <>
          {icon(92, 200, 96)}
          <path d="M152 160 V240" stroke={accent} strokeWidth={1.5} />
          {nameAt(200, 40, 212, 168, "start")}
          {tagline && (
            <Text x={169} y={230} text={tagline} family={TAGLINE_FONT.family} weight={TAGLINE_FONT.weight} f={f} fill={primary} opacity={0.8} anchor="start" spacing={f.size * 0.26} />
          )}
        </>
      );
      break;
    }
    case "badge": {
      const nf = fit(name, cw, 32, 16, 360, nameSpacing, measure(name, font.family, font.weight, 32, nameSpacing));
      const tf = fit(tagline, TAGLINE_FONT.width * 1.08, 15, 9, 330, 4, measure(tagline, TAGLINE_FONT.family, TAGLINE_FONT.weight, 15, 15 * 0.26));
      body = (
        <>
          <defs>
            <path id={`${uid}-top`} d={`M${C - 140} ${C} A140 140 0 0 1 ${C + 140} ${C}`} />
            <path id={`${uid}-bot`} d={`M${C - 158} ${C} A158 158 0 0 0 ${C + 158} ${C}`} />
          </defs>
          <circle cx={C} cy={C} r={178} fill="none" stroke={primary} strokeWidth={3} />
          <circle cx={C} cy={C} r={122} fill="none" stroke={primary} strokeWidth={1.4} />
          <text textAnchor="middle" fontFamily={`'${font.family}'`} fontWeight={font.weight} fontSize={nf.size} fill={primary} letterSpacing={nameSpacing}>
            <textPath href={`#${uid}-top`} startOffset="50%" textLength={nf.length} lengthAdjust={nf.length ? "spacingAndGlyphs" : undefined}>
              {name}
            </textPath>
          </text>
          {tagline && (
            <text textAnchor="middle" fontFamily={`'${TAGLINE_FONT.family}'`} fontWeight={TAGLINE_FONT.weight} fontSize={tf.size} fill={primary} fillOpacity={0.85} letterSpacing={tf.size * 0.26}>
              <textPath href={`#${uid}-bot`} startOffset="50%" textLength={tf.length} lengthAdjust={tf.length ? "spacingAndGlyphs" : undefined}>
                {tagline}
              </textPath>
            </text>
          )}
          <path d={star(C - 150, C, 7)} fill={accent} />
          <path d={star(C + 150, C, 7)} fill={accent} />
          {icon(C, C, 128)}
        </>
      );
      break;
    }
    case "monogram": {
      const ini = initials(design.name);
      const size = ini.length > 1 ? 80 : 104;
      body = (
        <>
          <circle cx={C} cy={160} r={100} fill="none" stroke={accent} strokeWidth={1.2} />
          <circle cx={C} cy={160} r={92} fill="none" stroke={primary} strokeWidth={2} />
          <path d={star(C, 60, 9)} fill={accent} />
          <text x={C} y={160 + size * 0.35} textAnchor="middle" fontFamily={`'${font.family}'`} fontWeight={font.weight} fontSize={size} fill={primary}>
            {ini}
          </text>
          {nameAt(306, 34, 330)}
          <Tagline text={tagline} y={340} color={primary} accent={accent} size={12} />
        </>
      );
      break;
    }
    case "editorial": {
      const words = design.name.trim().split(/\s+/).filter(Boolean);
      const monogramWords = words.length > 2 ? [words[0], words[words.length - 1]] : words;
      const letters = monogramWords.map((word) => word[0].toLocaleUpperCase("vi"));
      const first = letters[0] ?? "N";
      const second = letters[1];
      body = (
        <>
          <text x={second ? 159 : C} y={227} textAnchor="middle" fontFamily={`'${font.family}'`} fontWeight={font.weight} fontSize={170} fill={primary}>
            {first}
          </text>
          {second && (
            <text x={227} y={245} textAnchor="middle" fontFamily={`'${font.family}'`} fontWeight={font.weight} fontSize={157} fill={primary}>
              {second}
            </text>
          )}
          <path d="M188 67 Q221 52 253 62 Q224 59 201 79 Z" fill={accent} />
          {nameAt(318, 48)}
          <Tagline text={tagline} y={348} color={primary} accent={accent} size={12} />
        </>
      );
      break;
    }
    case "arch":
      body = (
        <>
          <path d={`M115 238 V150 A85 85 0 0 1 285 150 V238 Z`} fill={accent} fillOpacity={0.18} stroke={primary} strokeWidth={2.5} strokeLinejoin="round" />
          <path d={`M126 238 V150 A74 74 0 0 1 274 150 V238`} fill="none" stroke={accent} strokeWidth={1.3} />
          {icon(C, 170, 96)}
          {nameAt(292, 46)}
          <Tagline text={tagline} y={328} color={primary} accent={accent} size={12} />
        </>
      );
      break;
    case "script": {
      const f = fit(name, cw, 84, 30, 320, 0, measure(name, font.family, font.weight, 84, 0));
      const right = Math.min(C + f.width / 2, 370);
      body = (
        <>
          <Text x={C} y={215} text={name} family={font.family} weight={font.weight} f={f} fill={primary} />
          <path d="M112 240 Q200 262 288 240" fill="none" stroke={accent} strokeWidth={2} strokeLinecap="round" />
          {icon(right - 14, 215 - f.size * 0.8, 42)}
          <Tagline text={tagline} y={292} color={primary} accent={accent} />
        </>
      );
      break;
    }
    case "line":
      body = (
        <>
          {icon(C, 116, 88)}
          <path d="M110 184 H290 M110 258 H290" stroke={accent} strokeWidth={1.4} />
          {nameAt(234, 40, 320)}
          <Tagline text={tagline} y={294} color={primary} accent={accent} size={12} lines={false} />
        </>
      );
      break;
    case "seal": {
      // Con dấu tròn đặc: biểu tượng màu nền nằm trong vòng tròn màu chính.
      body = (
        <>
          <circle cx={C} cy={140} r={74} fill={primary} />
          <circle cx={C} cy={140} r={65} fill="none" stroke={bg} strokeOpacity={0.55} strokeWidth={1.4} />
          {icon(C, 140, 86, bg)}
          {nameAt(274, 44)}
          <Tagline text={tagline} y={310} color={primary} accent={accent} size={12} />
        </>
      );
      break;
    }
    case "boxframe": {
      // Khung chữ nhật mảnh, biểu tượng nằm ở khe trên của khung.
      const top = 150;
      body = (
        <>
          <path d={`M${C - 50} ${top} H52 V262 H348 V${top} H${C + 50}`} fill="none" stroke={primary} strokeWidth={2} />
          <path d={`M${C - 44} ${top + 7} H59 V255 H341 V${top + 7} H${C + 44}`} fill="none" stroke={accent} strokeWidth={1} />
          {icon(C, top - 4, 76)}
          {nameAt(222, 40, 270)}
          <Tagline text={tagline} y={300} color={primary} accent={accent} size={12} />
        </>
      );
      break;
    }
    case "signature":
      // Mẫu vẽ riêng: bố cục và hình minh hoạ theo từng mẫu (SignatureLogo.tsx).
      body = SignatureLogo({
        templateId: design.templateId,
        name,
        rawName: design.name,
        tagline,
        rawTagline: design.tagline.trim(),
        font,
        primary,
        accent,
        bg,
        uid,
        fit: (text, family, weight, base, min, maxWidth, spacing = 0) =>
          fit(
            text,
            // Ước lượng khi phông chưa tải xong; hệ số in hoa chỉ áp cho tên tiệm.
            (LOGO_FONTS.find((x) => x.family === family && x.weight === weight)?.width ?? TAGLINE_FONT.width) * (upper && family === font.family ? 1.15 : 1),
            base,
            min,
            maxWidth,
            spacing,
            measure(text, family, weight, base, spacing),
          ),
        icon: (id, x, y, size, iconPrimary, iconAccent) => <LogoIcon id={id} x={x} y={y} size={size} primary={iconPrimary} accent={iconAccent} />,
      });
      break;
    case "emblem": {
      const hex = (r: number) =>
        [-90, -30, 30, 90, 150, 210]
          .map((a) => `${C + r * Math.cos((a * Math.PI) / 180)},${160 + r * Math.sin((a * Math.PI) / 180)}`)
          .join(" ");
      body = (
        <>
          <polygon points={hex(96)} fill={accent} fillOpacity={0.15} stroke={primary} strokeWidth={2.5} strokeLinejoin="round" />
          <polygon points={hex(84)} fill="none" stroke={accent} strokeWidth={1.2} strokeLinejoin="round" />
          {icon(C, 160, 100)}
          {nameAt(300, 40)}
          <Tagline text={tagline} y={334} color={primary} accent={accent} size={12} />
        </>
      );
      break;
    }
  }

  return (
    <svg ref={svgRef} viewBox={`0 0 ${LOGO_SIZE} ${LOGO_SIZE}`} xmlns="http://www.w3.org/2000/svg" className={className} role="img" aria-label={design.name}>
      {!design.transparent && <rect width={LOGO_SIZE} height={LOGO_SIZE} fill={bg} />}
      {body}
    </svg>
  );
}
