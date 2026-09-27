import type { ReactNode } from "react";
import { TAGLINE_FONT, type LogoIconId } from "@/lib/logo-templates";
import type { Fit } from "../design/measure";

// Logo vẽ riêng (layout "signature"): mỗi mẫu có hình minh hoạ và bố cục riêng trên khung 400×400.
// Tên, slogan, phông tên và 3 màu (chính, nhấn, nền) vẫn lấy từ thiết kế của khách.

const C = 200;
const rn = (n: number) => Math.round(n * 100) / 100; // làm tròn để server và trình duyệt vẽ giống hệt nhau

export type SignatureCtx = {
  templateId: string;
  name: string; // đã in hoa nếu mẫu chọn in hoa
  rawName: string;
  tagline: string; // in hoa
  rawTagline: string;
  font: { family: string; weight: number; script?: boolean };
  primary: string;
  accent: string;
  bg: string;
  uid: string;
  fit: (text: string, family: string, weight: number, base: number, min: number, maxWidth: number, spacing?: number) => Fit;
  icon: (id: LogoIconId, x: number, y: number, size: number, primary: string, accent: string) => ReactNode;
};

/* ---------- Tiện ích ---------- */

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

// Móng hình hạnh nhân, đầu nhọn hướng lên, đáy ở (0,0).
const almond = (w: number, h: number) =>
  `M${-w / 2} 0 C${-w / 2} ${-h * 0.45} ${-w * 0.28} ${-h * 0.85} 0 ${-h} C${w * 0.28} ${-h * 0.85} ${w / 2} ${-h * 0.45} ${w / 2} 0 Q0 ${h * 0.12} ${-w / 2} 0 Z`;

const pt = (cx: number, cy: number, r: number, deg: number) => [rn(cx + r * Math.cos((deg * Math.PI) / 180)), rn(cy + r * Math.sin((deg * Math.PI) / 180))];

function mix(a: string, b: string, t: number) {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  if (x.some(Number.isNaN) || y.some(Number.isNaN)) return a;
  return `#${x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join("")}`;
}

// Chia tên thành 2 dòng cân nhau (tên 1 từ thì giữ 1 dòng).
function twoLines(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length < 2) return [text.trim() || " "];
  let best = 1;
  for (let i = 1; i < words.length; i++) {
    const d = Math.abs(words.slice(0, i).join(" ").length - words.slice(i).join(" ").length);
    if (d < Math.abs(words.slice(0, best).join(" ").length - words.slice(best).join(" ").length)) best = i;
  }
  return [words.slice(0, best).join(" "), words.slice(best).join(" ")];
}

function T({ x, y, text, family, weight, f, fill, anchor = "middle", spacing = 0, opacity, stroke, strokeWidth }: {
  x: number; y: number; text: string; family: string; weight: number; f: Fit; fill: string;
  anchor?: "start" | "middle" | "end"; spacing?: number; opacity?: number; stroke?: string; strokeWidth?: number;
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      fontFamily={`'${family}'`}
      fontWeight={weight}
      fontSize={rn(f.size)}
      letterSpacing={spacing ? rn(spacing) : undefined}
      fill={fill}
      fillOpacity={opacity}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinejoin={stroke ? "round" : undefined}
      textLength={f.length ? rn(f.length) : undefined}
      lengthAdjust={f.length ? "spacingAndGlyphs" : undefined}
    >
      {text}
    </text>
  );
}


type NameProps = { c: SignatureCtx; x?: number; y: number; text?: string; base: number; maxWidth: number; fill?: string; anchor?: "start" | "middle" | "end"; spacing?: number; min?: number };
// Tên tiệm theo phông khách chọn, tự co cho vừa khung.
function Name({ c, x = C, y, text = c.name, base, maxWidth, fill = c.primary, anchor = "middle", spacing = 0, min = 16 }: NameProps) {
  const f = c.fit(text, c.font.family, c.font.weight, base, min, maxWidth, spacing);
  return <T x={x} y={y} text={text} family={c.font.family} weight={c.font.weight} f={f} fill={fill} anchor={anchor} spacing={spacing * (f.size / base)} />;
}

type TagProps = { c: SignatureCtx; y: number; x?: number; size?: number; weight?: number; fill?: string; spacing?: number; maxWidth?: number; anchor?: "start" | "middle" | "end" };
// Slogan chữ in hoa giãn rộng (Montserrat).
function Tag({ c, y, x = C, size = 13, weight = 600, fill = c.primary, spacing = 0.3, maxWidth = 320, anchor = "middle" }: TagProps) {
  if (!c.tagline) return null;
  const f = c.fit(c.tagline, TAGLINE_FONT.family, weight, size, 8, maxWidth, size * spacing);
  return <T x={x} y={y} text={c.tagline} family={TAGLINE_FONT.family} weight={weight} f={f} fill={fill} anchor={anchor} spacing={f.size * spacing} />;
}


/* ---------- Chi tiết dùng chung ---------- */

// Dáng móng thật: đáy bo tròn (phía da), đầu thon kiểu hạnh nhân; (0,0) là giữa đáy.
const nailShape = (w: number, h: number) =>
  `M${-w / 2} 0 C${-w / 2} ${-h * 0.52} ${-w * 0.36} ${-h * 0.86} 0 ${-h} C${w * 0.36} ${-h * 0.86} ${w / 2} ${-h * 0.52} ${w / 2} 0 C${w / 2} ${w * 0.42} ${-w / 2} ${w * 0.42} ${-w / 2} 0 Z`;

const STOP = ["nail", "nails", "spa", "studio", "salon", "house", "bar", "&", "và", "tiệm", "lounge", "beauty"];
function initialsOf(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = words[0]?.[0] ?? "N";
  const second = words.slice(1).find((w) => !STOP.includes(w.toLowerCase()))?.[0] ?? "";
  return (first + second).toLocaleUpperCase("vi");
}

// Vệt bóng trên móng / chai (màu trắng mờ).
const Gloss = ({ d, w = 4 }: { d: string; w?: number }) => <path d={d} fill="none" stroke="#fff" strokeOpacity={0.6} strokeWidth={w} strokeLinecap="round" />;

/* ---------- 20 mẫu ---------- */

export function SignatureLogo(ctx: SignatureCtx): ReactNode {
  const { name, tagline, font, primary: p, accent: a, bg, uid, fit } = ctx;
  const nameFit = (text: string, base: number, maxWidth: number, min = 14, spacing = 0) => fit(text, font.family, font.weight, base, min, maxWidth, spacing);

  switch (ctx.templateId) {
    // 1. Móng tối giản: viền mảnh + mảng màu lệch nhẹ.
    case "v2-offset-nail": {
      const nail = nailShape(56, 104);
      return (
        <>
          <path d={nail} transform="translate(207 177)" fill={a} />
          <path d={nail} transform="translate(200 170)" fill="none" stroke={p} strokeWidth={1.8} />
          <path d={star(248, 82, 9)} fill={p} />
          <path d={star(262, 104, 4.5)} fill={p} />
          <Name c={ctx} y={256} base={36} maxWidth={320} spacing={9} />
          <path d="M184 278 H216" stroke={a} strokeWidth={1.6} />
          <Tag c={ctx} y={304} size={10.5} weight={500} spacing={0.42} />
        </>
      );
    }
    // 2. Chữ ký trên mảng màu mềm.
    case "v2-script-blob":
      return (
        <>
          <path d="M122 150 C150 108 252 104 292 140 C326 170 312 226 266 242 C216 260 140 252 112 216 C95 193 100 170 122 150 Z" fill={a} fillOpacity={0.85} />
          <Name c={ctx} y={214} base={94} maxWidth={320} />
          <path d={star(304, 128, 9)} fill={p} />
          <Tag c={ctx} y={272} size={12} weight={600} spacing={0.6} fill={mix(a, p, 0.45)} />
        </>
      );
    // 3. Chữ lồng trong vòng tròn mảnh.
    case "v2-monogram": {
      const ini = initialsOf(ctx.rawName);
      return (
        <>
          <circle cx={C} cy={158} r={92} fill="none" stroke={a} strokeWidth={1.3} />
          <circle cx={C} cy={158} r={84} fill="none" stroke={a} strokeWidth={0.7} />
          <rect x={188} y={58} width={24} height={16} fill={bg} />
          <path d={star(C, 66, 8)} fill={a} />
          <text x={C} y={158 + (ini.length > 1 ? 30 : 36)} textAnchor="middle" fontFamily="'Playfair Display'" fontWeight={400} fontSize={ini.length > 1 ? 82 : 100} fill={p} letterSpacing={ini.length > 1 ? -2 : 0}>
            {ini}
          </text>
          <Name c={ctx} y={298} base={20} maxWidth={320} spacing={7} />
          <Tag c={ctx} y={326} size={10} weight={500} spacing={0.4} fill={a} />
        </>
      );
    }
    // 4. Chai sơn phẳng, bóng.
    case "v2-flat-bottle":
      return (
        <>
          <rect x={176} y={36} width={48} height={80} rx={12} fill={p} />
          <rect x={185} y={46} width={6} height={58} rx={3} fill={bg} fillOpacity={0.35} />
          <rect x={167} y={112} width={66} height={15} rx={4} fill={p} />
          <rect x={136} y={123} width={128} height={116} rx={28} fill={a} />
          <path d="M136 192 Q200 176 264 192 V211 Q264 239 236 239 H164 Q136 239 136 211 Z" fill={p} fillOpacity={0.16} />
          <rect x={151} y={140} width={10} height={62} rx={5} fill="#fff" fillOpacity={0.6} />
          <circle cx={156} cy={214} r={5} fill="#fff" fillOpacity={0.6} />
          <Name c={ctx} y={294} base={46} maxWidth={330} />
          <Tag c={ctx} y={328} size={11} spacing={0.45} />
        </>
      );
    // 5. Cầu vồng retro, tên uốn theo vòm.
    case "v2-retro-arch": {
      const [l, r] = [pt(C, 234, 112, 180), pt(C, 234, 112, 360)];
      const nf = nameFit(name, 40, 300, 16, 1);
      const tf = fit(tagline, TAGLINE_FONT.family, 700, 12, 8, 200, 3.6);
      const pill = Math.max(90, tf.width + 40);
      return (
        <>
          <defs>
            <path id={`${uid}-arch`} d={`M${l[0]} ${l[1]} A112 112 0 0 1 ${r[0]} ${r[1]}`} />
          </defs>
          <text textAnchor="middle" fontFamily={`'${font.family}'`} fontWeight={font.weight} fontSize={rn(nf.size)} fill={p} letterSpacing={1}>
            <textPath href={`#${uid}-arch`} startOffset="50%" textLength={nf.length ? rn(nf.length) : undefined} lengthAdjust={nf.length ? "spacingAndGlyphs" : undefined}>
              {name}
            </textPath>
          </text>
          {[[70, p], [56, mix(p, a, 0.5)], [42, a]].map(([r0, color]) => (
            <path key={r0} d={`M${C - Number(r0)} 234 A${r0} ${r0} 0 0 1 ${C + Number(r0)} 234`} fill="none" stroke={String(color)} strokeWidth={14} />
          ))}
          <path d={star(C, 214, 11)} fill={p} />
          <path d="M104 234 H296" stroke={p} strokeWidth={2.2} strokeLinecap="round" />
          {tagline && (
            <>
              <rect x={rn(C - pill / 2)} y={258} width={rn(pill)} height={32} rx={16} fill="none" stroke={p} strokeWidth={1.8} />
              <Tag c={ctx} y={279} size={12} weight={700} spacing={0.3} maxWidth={200} />
            </>
          )}
        </>
      );
    }
    // 6. Khung vàng trên nền tối.
    case "v2-gold-frame":
      return (
        <>
          <rect x={72} y={92} width={256} height={216} fill="none" stroke={p} strokeWidth={1.4} />
          <rect x={80} y={100} width={240} height={200} fill="none" stroke={a} strokeWidth={0.8} />
          {[[72, 92], [328, 92], [72, 308], [328, 308]].map(([x, y]) => (
            <path key={`${x}${y}`} d={`M${x} ${y - 6} L${x + 6} ${y} L${x} ${y + 6} L${x - 6} ${y} Z`} fill={p} />
          ))}
          <path d={nailShape(20, 40)} transform="translate(200 172)" fill={p} />
          <Name c={ctx} y={220} base={36} maxWidth={222} spacing={5} />
          <path d="M176 240 H224" stroke={p} strokeWidth={1} />
          <Tag c={ctx} y={266} size={9.5} weight={500} spacing={0.5} maxWidth={210} />
        </>
      );
    // 7. Năm móng chuyển màu.
    case "v2-ombre-row":
      return (
        <>
          {[0, 1, 2, 3, 4].map((i) => {
            const h = [74, 88, 96, 88, 74][i];
            const x = C + (i - 2) * 36;
            return (
              <g key={i} transform={`translate(${x} 184)`}>
                <path d={nailShape(28, h)} fill={mix(a, p, i / 4)} />
                <Gloss d={`M-6 ${-h * 0.3} Q-8 ${-h * 0.55} -3 ${-h * 0.75}`} w={3} />
              </g>
            );
          })}
          <Name c={ctx} y={262} base={34} maxWidth={320} spacing={5} />
          <Tag c={ctx} y={294} size={10.5} weight={500} spacing={0.4} />
        </>
      );
    // 8. Nét cọ quét dưới chữ viết tay.
    case "v2-brush-stroke":
      return (
        <>
          <path d="M66 214 C120 198 220 190 334 182 C338 188 338 200 336 206 C230 214 132 226 70 244 C62 236 60 222 66 214 Z" fill={a} fillOpacity={0.9} />
          <path d="M90 236 C150 222 230 214 320 208 M100 220 C170 208 250 200 326 194" fill="none" stroke={bg} strokeOpacity={0.35} strokeWidth={1.2} />
          <Name c={ctx} y={226} base={72} maxWidth={300} />
          <path d={star(322, 150, 9)} fill={p} />
          <Tag c={ctx} y={290} size={11} spacing={0.45} />
        </>
      );
    // 9. Chữ I thay bằng chai sơn.
    case "v2-bottle-i": {
      const chars = [...name];
      const mid = (chars.length - 1) / 2;
      let cut = -1;
      chars.forEach((ch, i) => {
        if (/[iIíÍìÌ]/.test(ch) && (cut < 0 || Math.abs(i - mid) < Math.abs(cut - mid))) cut = i;
      });
      const split = cut >= 0 ? cut : Math.ceil(chars.length / 2);
      const left = chars.slice(0, split).join("");
      const right = chars.slice(cut >= 0 ? cut + 1 : split).join("");
      const fl = nameFit(left || " ", 130, 1e6, 1, 4);
      const fr = nameFit(right || " ", 130, 1e6, 1, 4);
      const bw0 = 46;
      const k = Math.min(1, (330 - bw0 - 24) / Math.max(1, fl.width + fr.width));
      const size = 130 * k;
      const bw = bw0 * Math.max(0.6, k);
      const gap = bw + 22 * k;
      const total = fl.width * k + gap + fr.width * k;
      const gx = rn(C - total / 2 + fl.width * k + gap / 2);
      const base = 250;
      const capH = size * 0.81;
      const top = base - capH;
      return (
        <>
          {left && <T x={rn(gx - gap / 2)} y={base} text={left} family={font.family} weight={font.weight} f={{ size, width: fl.width * k }} fill={p} anchor="end" spacing={4 * k} />}
          {right && <T x={rn(gx + gap / 2)} y={base} text={right} family={font.family} weight={font.weight} f={{ size, width: fr.width * k }} fill={p} anchor="start" spacing={4 * k} />}
          <rect x={rn(gx - bw * 0.22)} y={rn(top)} width={rn(bw * 0.44)} height={rn(capH * 0.38)} rx={rn(bw * 0.08)} fill={p} />
          <rect x={rn(gx - bw * 0.3)} y={rn(top + capH * 0.36)} width={rn(bw * 0.6)} height={rn(capH * 0.08)} rx={1.5} fill={p} />
          <rect x={rn(gx - bw / 2)} y={rn(top + capH * 0.42)} width={rn(bw)} height={rn(capH * 0.58)} rx={rn(bw * 0.2)} fill={a} />
          <rect x={rn(gx - bw * 0.34)} y={rn(top + capH * 0.5)} width={rn(bw * 0.12)} height={rn(capH * 0.3)} rx={rn(bw * 0.06)} fill="#fff" fillOpacity={0.55} />
          <path d={`M60 ${base + 30} H340 M60 ${base + 72} H340`} stroke={p} strokeWidth={1.6} />
          <Tag c={ctx} y={base + 57} size={14} weight={700} spacing={0.45} maxWidth={270} />
        </>
      );
    }
    // 10. Con dấu tròn đặc, chữ chạy vòng.
    case "v2-round-seal": {
      const [tl, tr] = [pt(C, 196, 112, 180), pt(C, 196, 112, 360)];
      const [bl, br] = [pt(C, 196, 124, 152), pt(C, 196, 124, 28)];
      const nf = nameFit(name, 22, 320, 12, 4);
      const tf = fit(tagline, TAGLINE_FONT.family, 600, 12, 8, 200, 3);
      return (
        <>
          <defs>
            <path id={`${uid}-t`} d={`M${tl[0]} ${tl[1]} A112 112 0 0 1 ${tr[0]} ${tr[1]}`} />
            <path id={`${uid}-b`} d={`M${bl[0]} ${bl[1]} A124 124 0 0 0 ${br[0]} ${br[1]}`} />
          </defs>
          <circle cx={C} cy={196} r={86} fill={p} />
          <circle cx={C} cy={196} r={78} fill="none" stroke={bg} strokeOpacity={0.4} strokeWidth={1} />
          <path d={nailShape(40, 80)} transform="translate(200 236)" fill={bg} />
          <path d="M184 238 Q200 222 216 238" fill="none" stroke={p} strokeOpacity={0.35} strokeWidth={1.6} />
          <path d="M191 214 Q188 196 193 180" fill="none" stroke={p} strokeOpacity={0.2} strokeWidth={3.5} strokeLinecap="round" />
          <path d={star(228, 150, 9)} fill={bg} />
          <path d={star(80, 196, 6)} fill={p} />
          <path d={star(320, 196, 6)} fill={p} />
          <text textAnchor="middle" fontFamily={`'${font.family}'`} fontWeight={font.weight} fontSize={rn(nf.size)} fill={p} letterSpacing={rn(4 * (nf.size / 22))}>
            <textPath href={`#${uid}-t`} startOffset="50%" textLength={nf.length ? rn(nf.length) : undefined} lengthAdjust={nf.length ? "spacingAndGlyphs" : undefined}>
              {name}
            </textPath>
          </text>
          {tagline && (
            <text textAnchor="middle" fontFamily={`'${TAGLINE_FONT.family}'`} fontWeight={600} fontSize={rn(tf.size)} fill={p} letterSpacing={3}>
              <textPath href={`#${uid}-b`} startOffset="50%">
                {tagline}
              </textPath>
            </text>
          )}
        </>
      );
    }
    // 11. Móng và hai nhánh lá mảnh.
    case "v2-botanical": {
      const sprig = (
        <>
          <path d="M184 214 C152 202 136 172 144 122" fill="none" stroke={p} strokeWidth={1.5} strokeLinecap="round" />
          {[
            [170, 206, -60], [156, 192, 30], [148, 172, -70], [143, 152, 20], [143, 134, -60],
          ].map(([x, y, r]) => (
            <path key={`${x}${y}`} d={almond(9, 22)} transform={`translate(${x} ${y}) rotate(${r})`} fill={p} />
          ))}
        </>
      );
      return (
        <>
          {sprig}
          <g transform="translate(400 0) scale(-1 1)">{sprig}</g>
          <path d={nailShape(46, 88)} transform="translate(200 206)" fill={a} fillOpacity={0.45} stroke={p} strokeWidth={1.6} />
          <Name c={ctx} y={270} base={36} maxWidth={320} spacing={6} />
          <Tag c={ctx} y={300} size={10.5} weight={500} spacing={0.4} />
        </>
      );
    }
    // 12. Dải sơn chảy giọt phía trên tên.
    case "v2-drip": {
      const lines = name.length > 12 ? twoLines(name) : [name];
      // Mép dưới dải sơn: xen kẽ giọt dài / ngắn, đầu giọt tròn.
      const drops = [[112, 18], [140, 40], [168, 12], [196, 56], [226, 22], [254, 34], [282, 14]];
      let d = "M96 96 Q96 84 108 84 H292 Q304 84 304 96 V122";
      for (let i = drops.length - 1; i >= 0; i--) {
        const [x, len] = drops[i];
        d += ` L${x + 9} 122 V${122 + len} A9 9 0 0 1 ${x - 9} ${122 + len} V122`;
      }
      d += " L96 122 Z";
      return (
        <>
          <path d={d} fill={p} />
          <path d="M112 94 H200" stroke="#fff" strokeOpacity={0.45} strokeWidth={4} strokeLinecap="round" />
          <circle cx={196} cy={200} r={6} fill={p} />
          {lines.length > 1 ? (
            <>
              <Name c={ctx} y={254} text={lines[0]} base={56} maxWidth={320} min={18} />
              <Name c={ctx} y={306} text={lines[1]} base={56} maxWidth={320} min={18} />
            </>
          ) : (
            <Name c={ctx} y={272} base={62} maxWidth={320} min={18} />
          )}
          <Tag c={ctx} y={lines.length > 1 ? 340 : 312} size={12} spacing={0.45} fill={mix(p, "#000000", 0.15)} />
        </>
      );
    }
    // 13. Kiểu danh thiếp ngang.
    case "v2-card-row":
      return (
        <>
          <circle cx={112} cy={200} r={46} fill="none" stroke={a} strokeWidth={1.4} />
          <path d={nailShape(26, 54)} transform="translate(112 226)" fill={p} />
          <Gloss d="M106 206 Q104 194 108 184" w={2.5} />
          <path d="M180 162 V238" stroke={a} strokeWidth={1.2} />
          <Name c={ctx} x={200} y={204} base={34} maxWidth={170} anchor="start" />
          <Tag c={ctx} x={201} y={232} anchor="start" size={10} weight={500} spacing={0.32} maxWidth={165} />
        </>
      );
    // 14. Nơ ruy băng (coquette).
    case "v2-bow": {
      const half = (
        <>
          <path d="M194 128 C170 96 126 94 122 118 C118 142 158 150 194 136 Z" fill={a} stroke={p} strokeWidth={2} strokeLinejoin="round" />
          <path d="M186 124 C168 114 146 112 136 118" fill="none" stroke={p} strokeOpacity={0.5} strokeWidth={1.2} strokeLinecap="round" />
          <path d="M194 140 C186 168 172 194 158 216 L172 212 L178 226 C188 200 198 172 204 144 Z" fill={a} stroke={p} strokeWidth={2} strokeLinejoin="round" />
        </>
      );
      return (
        <>
          {half}
          <g transform="translate(400 0) scale(-1 1)">{half}</g>
          <rect x={186} y={118} width={28} height={26} rx={9} fill={a} stroke={p} strokeWidth={2} />
          <Name c={ctx} y={284} base={48} maxWidth={320} />
          <Tag c={ctx} y={316} size={11} weight={500} spacing={0.42} />
        </>
      );
    }
    // 15. Quả cherry.
    case "v2-cherry":
      return (
        <>
          <path d="M172 196 C178 150 204 120 234 100 M234 196 C232 150 236 124 234 100" fill="none" stroke={a} strokeWidth={3.5} strokeLinecap="round" />
          <path d="M234 100 C250 78 282 78 296 92 C280 110 254 112 234 100 Z" fill={a} />
          <path d="M240 98 C256 92 272 90 286 92" fill="none" stroke={bg} strokeOpacity={0.5} strokeWidth={1.2} />
          <circle cx={166} cy={214} r={32} fill={p} />
          <circle cx={240} cy={214} r={32} fill={p} />
          <ellipse cx={154} cy={200} rx={7} ry={11} transform="rotate(-30 154 200)" fill="#fff" fillOpacity={0.6} />
          <ellipse cx={228} cy={200} rx={7} ry={11} transform="rotate(-30 228 200)" fill="#fff" fillOpacity={0.6} />
          <Name c={ctx} y={300} base={44} maxWidth={330} />
          <Tag c={ctx} y={332} size={11} spacing={0.45} fill={a} />
        </>
      );
    // 16. Móng French đầu trắng.
    case "v2-french": {
      const nail = nailShape(70, 132);
      return (
        <>
          <defs>
            <clipPath id={`${uid}-fr`}>
              <path d={nail} transform="translate(200 206)" />
            </clipPath>
          </defs>
          <path d={nail} transform="translate(200 206)" fill={a} />
          <g clipPath={`url(#${uid}-fr)`}>
            <path d="M150 122 Q200 158 250 122 V60 H150 Z" fill="#fff" />
            <path d="M150 122 Q200 158 250 122" fill="none" stroke={p} strokeOpacity={0.3} strokeWidth={1.2} />
          </g>
          <path d={nail} transform="translate(200 206)" fill="none" stroke={p} strokeWidth={1.4} />
          <Gloss d="M184 188 Q180 160 186 140" w={3} />
          <Name c={ctx} y={268} base={34} maxWidth={320} spacing={8} />
          <Tag c={ctx} y={298} size={10} weight={500} spacing={0.42} />
        </>
      );
    }
    // 17. Trái tim bóng.
    case "v2-heart":
      return (
        <>
          <path d="M200 214 C150 180 128 152 132 126 C136 102 160 92 178 100 C190 106 196 116 200 124 C204 116 210 106 222 100 C240 92 264 102 268 126 C272 152 250 180 200 214 Z" fill={p} />
          <Gloss d="M150 128 Q152 112 166 108" w={5} />
          <path d={star(272, 96, 11)} fill={a} />
          <path d={star(124, 190, 6)} fill={a} />
          <Name c={ctx} y={292} base={50} maxWidth={320} />
          <Tag c={ctx} y={326} size={11} spacing={0.42} />
        </>
      );
    // 18. Viên đá đính móng.
    case "v2-gem":
      return (
        <>
          <polygon points="150,100 250,100 278,128 122,128" fill={mix(a, "#ffffff", 0.35)} stroke={p} strokeWidth={1.6} strokeLinejoin="round" />
          <polygon points="122,128 278,128 200,212" fill={a} stroke={p} strokeWidth={1.6} strokeLinejoin="round" />
          <polygon points="170,128 200,212 122,128" fill={mix(a, p, 0.25)} />
          <polygon points="230,128 278,128 200,212" fill={mix(a, "#ffffff", 0.2)} />
          <path d="M150 100 L170 128 L200 100 L230 128 L250 100 M170 128 L200 212 L230 128 M122 128 H278" fill="none" stroke={p} strokeWidth={1.3} strokeLinejoin="round" />
          <polygon points="122,128 278,128 200,212" fill="none" stroke={p} strokeWidth={1.6} strokeLinejoin="round" />
          <path d={star(292, 96, 10)} fill={p} />
          <path d={star(108, 176, 7)} fill={p} />
          <Name c={ctx} y={270} base={30} maxWidth={320} spacing={7} />
          <Tag c={ctx} y={300} size={10.5} weight={500} spacing={0.4} />
        </>
      );
    // 19. Gương oval cổ điển.
    case "v2-oval-mirror": {
      const mirrorLines = name.length > 10 ? twoLines(name) : [name];
      return (
        <>
          <ellipse cx={C} cy={196} rx={104} ry={136} fill="none" stroke={p} strokeWidth={2} />
          <ellipse cx={C} cy={196} rx={95} ry={127} fill="none" stroke={a} strokeWidth={1} />
          {Array.from({ length: 24 }, (_, i) => {
            const t = (i / 24) * Math.PI * 2;
            return <circle key={i} cx={rn(C + 113 * Math.cos(t))} cy={rn(196 + 145 * Math.sin(t))} r={2.2} fill={a} />;
          })}
          <path d={star(C, 118, 10)} fill={a} />
          {mirrorLines.length > 1 ? (
            <>
              <Name c={ctx} y={190} text={mirrorLines[0]} base={56} maxWidth={170} />
              <Name c={ctx} y={236} text={mirrorLines[1]} base={56} maxWidth={170} />
            </>
          ) : (
            <Name c={ctx} y={214} base={60} maxWidth={170} />
          )}
          <path d={`M176 ${mirrorLines.length > 1 ? 256 : 238} H224`} stroke={a} strokeWidth={1.2} />
          <Tag c={ctx} y={mirrorLines.length > 1 ? 280 : 262} size={9.5} weight={500} spacing={0.36} maxWidth={140} />
        </>
      );
    }
    // 20. Sticker Y2K.
    case "v2-y2k": {
      const lines = twoLines(name);
      const two = lines.length > 1;
      const bumps = 16;
      const start = pt(C, 198, 146, -90);
      const scallop = Array.from({ length: bumps }, (_, i) => {
        const [x, y] = pt(C, 198, 146, (360 / bumps) * (i + 1) - 90);
        return `A22 22 0 0 1 ${x} ${y}`;
      }).join(" ");
      const word = (text: string, y: number) => {
        const f = nameFit(text, 64, 260, 20);
        return (
          <>
            <T x={C} y={y} text={text} family={font.family} weight={font.weight} f={f} fill={a} stroke={a} strokeWidth={11} />
            <T x={C} y={y} text={text} family={font.family} weight={font.weight} f={f} fill={p} />
          </>
        );
      };
      return (
        <>
          <path d={`M${start[0]} ${start[1]} ${scallop} Z`} fill={bg} stroke={p} strokeWidth={3} strokeLinejoin="round" />
          <path d={nailShape(34, 62)} transform="rotate(18 296 120) translate(296 120)" fill={p} />
          <Gloss d="M290 104 Q288 92 292 84" w={3} />
          <path d={star(104, 116, 18)} fill={a} stroke={p} strokeWidth={2.2} strokeLinejoin="round" />
          <path d={star(134, 84, 8)} fill={p} />
          <path d={star(306, 286, 11)} fill={a} stroke={p} strokeWidth={2} strokeLinejoin="round" />
          {word(lines[0], two ? 208 : 228)}
          {two && word(lines[1], 270)}
          <Tag c={ctx} y={two ? 314 : 292} size={12} weight={700} spacing={0.34} />
        </>
      );
    }
  }
  return null;
}
