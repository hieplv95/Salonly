import { useId, type ReactNode, type Ref } from "react";
import { fit, useMeasure } from "../design/measure";
import type { StampDesign } from "@/lib/stamp-templates";

// Con dấu tích điểm 1 cm: khung 100×100 (1 đơn vị = 0,1 mm), 1 màu mực.
// Nét tối thiểu ~2,5 (0,25 mm) và chữ cao ≥ 12 (1,2 mm) để khắc dấu còn rõ.

const C = 50;
const rn = (n: number) => Math.round(n * 100) / 100;
type Font = readonly [string, number];
const F = {
  script: ["Dancing Script", 700],
  vibes: ["Great Vibes", 400],
  pacifico: ["Pacifico", 400],
  play: ["Playfair Display", 600],
  mont: ["Montserrat", 700],
  fraun: ["Fraunces", 900],
  oswald: ["Oswald", 700],
  quick: ["Quicksand", 700],
  josefin: ["Josefin Sans", 600],
  cormorant: ["Cormorant Garamond", 600],
  lobster: ["Lobster", 400],
  charm: ["Charm", 700],
} as const satisfies Record<string, Font>;

const STOP = ["nail", "nails", "spa", "studio", "salon", "house", "bar", "&", "và", "tiệm", "the", "beauty"];
function initialsOf(name: string, max = 2) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const main = words.filter((w, i) => i === 0 || !STOP.includes(w.toLowerCase()));
  const letters = (main.length ? main : words).map((w) => w[0]).slice(0, max).join("");
  return (letters || "N").toLocaleUpperCase("vi");
}

function twoLines(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length < 2) return [text.trim() || " "];
  let best = 1;
  const diff = (i: number) => Math.abs(words.slice(0, i).join(" ").length - words.slice(i).join(" ").length);
  for (let i = 1; i < words.length; i++) if (diff(i) < diff(best)) best = i;
  return [words.slice(0, best).join(" "), words.slice(best).join(" ")];
}

const pt = (r: number, deg: number) => [rn(C + r * Math.cos((deg * Math.PI) / 180)), rn(C + r * Math.sin((deg * Math.PI) / 180))];

function star(cx: number, cy: number, r: number) {
  const a = r * 0.1;
  const b = r * 0.25;
  return `M${cx} ${cy - r} C${cx + a} ${cy - b} ${cx + b} ${cy - a} ${cx + r} ${cy} C${cx + b} ${cy + a} ${cx + a} ${cy + b} ${cx} ${cy + r} C${cx - a} ${cy + b} ${cx - b} ${cy + a} ${cx - r} ${cy} C${cx - b} ${cy - a} ${cx - a} ${cy - b} ${cx} ${cy - r} Z`;
}
function star5(cx: number, cy: number, ro: number, ri = ro * 0.45) {
  return (
    Array.from({ length: 10 }, (_, i) => {
      const r = i % 2 ? ri : ro;
      const a = (Math.PI * i) / 5 - Math.PI / 2;
      return `${i ? "L" : "M"}${rn(cx + r * Math.cos(a))} ${rn(cy + r * Math.sin(a))}`;
    }).join(" ") + " Z"
  );
}
function burst(ro: number, ri: number, n: number) {
  return (
    Array.from({ length: n * 2 }, (_, i) => {
      const r = i % 2 ? ri : ro;
      const a = (Math.PI * i) / n - Math.PI / 2;
      return `${i ? "L" : "M"}${rn(C + r * Math.cos(a))} ${rn(C + r * Math.sin(a))}`;
    }).join(" ") + " Z"
  );
}

function Txt({ x = C, y, t, f, size, fill, max = 84, sp = 0, anchor = "middle", rotate, italic = false, stroke, strokeWidth }: {
  x?: number; y: number; t: string; f: Font; size: number; fill: string; max?: number; sp?: number; anchor?: "start" | "middle" | "end"; rotate?: number; italic?: boolean; stroke?: string; strokeWidth?: number;
}) {
  const measure = useMeasure();
  if (!t) return null;
  const ft = fit(t, 0.58, size, 5, max, sp, measure(t, f[0], f[1], size, sp));
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      fontFamily={`'${f[0]}'`}
      fontWeight={f[1]}
      fontStyle={italic ? "italic" : undefined}
      fontSize={rn(ft.size)}
      letterSpacing={sp ? rn((sp * ft.size) / size) : undefined}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      paintOrder={stroke ? "stroke" : undefined}
      textLength={ft.length ? rn(ft.length) : undefined}
      lengthAdjust={ft.length ? "spacingAndGlyphs" : undefined}
      transform={rotate ? `rotate(${rotate} ${x} ${y})` : undefined}
    >
      {t}
    </text>
  );
}

// Chữ chạy theo cung tròn (trên: đọc từ trái qua; dưới: đọc từ trái qua ở phía dưới).
function Arc({ id, r, t, f, size, fill, bottom = false, sp = 1.5, span = 150 }: { id: string; r: number; t: string; f: Font; size: number; fill: string; bottom?: boolean; sp?: number; span?: number }) {
  const measure = useMeasure();
  if (!t) return null;
  const len = (Math.PI * r * span) / 180;
  const ft = fit(t, 0.66, size, 5, len, sp, measure(t, f[0], f[1], size, sp));
  const [a0, a1] = bottom ? [90 + span / 2, 90 - span / 2] : [270 - span / 2, 270 + span / 2];
  const [s, e] = [pt(r, a0), pt(r, a1)];
  return (
    <>
      <defs>
        <path id={id} d={`M${s[0]} ${s[1]} A${r} ${r} 0 0 ${bottom ? 0 : 1} ${e[0]} ${e[1]}`} />
      </defs>
      <text fontFamily={`'${f[0]}'`} fontWeight={f[1]} fontSize={rn(ft.size)} fill={fill} letterSpacing={rn((sp * ft.size) / size)} textAnchor="middle">
        <textPath href={`#${id}`} startOffset="50%" textLength={ft.length ? rn(ft.length) : undefined} lengthAdjust={ft.length ? "spacingAndGlyphs" : undefined}>
          {t}
        </textPath>
      </text>
    </>
  );
}

const NAIL = "M-12 0 C-12 -16 -8.5 -27 0 -32 C8.5 -27 12 -16 12 0 C12 9 -12 9 -12 0 Z";

function BrandedStampBody({ id, name, ink, initials }: { id: string; name: string; ink: string; initials: string }) {
  const lines = twoLines(name);
  const first = lines[0];
  const second = lines[1] ?? "";
  const upper = name.toLocaleUpperCase("vi");
  const line = { fill: "none", stroke: ink, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  switch (id) {
    case "brand-rose":
      return <>
        <g transform="rotate(-5 50 50)">
          <Txt y={44} t={first} f={F.vibes} size={32} fill={ink} max={82} />
          {second && <Txt y={70} t={second} f={F.vibes} size={30} fill={ink} max={82} />}
          <path d="M18 77 Q50 83 82 75" {...line} strokeWidth={2.5} />
        </g>
        <path d="M74 19 C66 23 65 31 73 32 C81 32 84 25 74 19 Z M77 20 C82 13 89 16 87 23 C85 28 79 27 77 20 Z" transform="translate(5 -6)" {...line} strokeWidth={2.5} />
      </>;
    case "brand-good-mood":
      return <g transform="rotate(-7 50 50)">
        <Txt y={38} t={first} f={F.oswald} size={24} fill={ink} max={82} />
        <Txt y={64} t={second || "Nails"} f={F.charm} size={24} fill={ink} max={80} />
        <path d="M16 82 Q49 88 85 76" {...line} strokeWidth={4.5} />
      </g>;
    case "brand-luxe":
      return <>
        <rect x={13} y={21} width={15} height={14} rx={2} fill={ink} />
        <rect x={10} y={35} width={21} height={35} rx={5} {...line} strokeWidth={3.5} />
        <path d="M16 42v18" {...line} strokeWidth={2.5} />
        <Txt x={65} y={48} t={first.toLocaleUpperCase("vi")} f={F.mont} size={18} fill={ink} max={60} />
        <Txt x={65} y={65} t={(second || "NAILS").toLocaleUpperCase("vi")} f={F.mont} size={10} fill={ink} max={60} sp={1} />
      </>;
    case "brand-queen":
      return <>
        <path d="M29 32 23 15 38 24 50 10 62 24 77 15 71 32Z" fill={ink} />
        <path d="M31 38h38" {...line} strokeWidth={4} />
        <Txt y={68} t={initials.slice(0, 1)} f={F.play} size={38} fill={ink} max={46} />
        <Txt y={87} t={upper} f={F.cormorant} size={10} fill={ink} max={87} sp={1.2} />
      </>;
    case "brand-bloom":
      return <>
        {[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx={24} cy={35} rx={7} ry={11} transform={`rotate(${a} 24 46)`} {...line} strokeWidth={2.7} />)}
        <circle cx={24} cy={46} r={5} fill={ink} />
        <Txt x={68} y={47} t={first.toLocaleUpperCase("vi")} f={F.mont} size={18} fill={ink} max={59} />
        <Txt x={68} y={65} t={(second || "NAILS").toLocaleUpperCase("vi")} f={F.quick} size={11} fill={ink} max={59} sp={1} />
      </>;
    case "brand-moon":
      return <>
        <path d="M48 17 C20 21 9 43 17 64 C25 85 48 90 68 78 C45 80 31 62 32 44 C32 30 38 22 48 17 Z" fill={ink} />
        <path d={star(75, 25, 7)} fill={ink} /><path d={star(84, 43, 4)} fill={ink} />
        <Txt x={67} y={56} t={first.toLocaleUpperCase("vi")} f={F.cormorant} size={15} fill={ink} max={48} />
        <Txt x={67} y={73} t={second || "Nails"} f={F.script} size={17} fill={ink} max={48} />
      </>;
    case "brand-gloss":
      return <>
        <path d="M50 10 C41 24 40 34 45 40 C50 46 60 43 61 34 C62 27 56 17 50 10 Z" {...line} strokeWidth={3} />
        <Txt y={64} t={first.toLocaleUpperCase("vi")} f={F.oswald} size={24} fill={ink} max={84} />
        <Txt y={80} t={(second || "NAILS").toLocaleUpperCase("vi")} f={F.josefin} size={10} fill={ink} max={78} sp={2} />
      </>;
    case "brand-ivory":
      return <>
        <path d="M50 7 94 50 50 93 6 50Z M50 15 86 50 50 85 14 50Z" {...line} strokeWidth={2.5} />
        <Txt y={57} t={initials} f={F.play} size={27} fill={ink} max={42} />
        <Txt y={75} t={upper} f={F.mont} size={7.5} fill={ink} max={61} sp={0.5} />
      </>;
    case "brand-cherry":
      return <>
        <path d="M45 20 Q53 11 61 14 M45 20 Q39 35 36 42 M47 20 Q59 32 63 42" {...line} strokeWidth={2.5} />
        <circle cx={34} cy={51} r={12} fill={ink} /><circle cx={66} cy={51} r={12} fill={ink} />
        <path d="M47 18 Q53 8 65 9 Q61 21 47 18Z" fill={ink} />
        <Txt y={84} t={upper} f={F.lobster} size={16} fill={ink} max={86} />
      </>;
    case "brand-noir":
      return <>
        <path d="M13 21h74v11M13 21v58h74M87 63v16" {...line} strokeWidth={3.5} />
        <Txt y={56} t={first.toLocaleUpperCase("vi")} f={F.oswald} size={27} fill={ink} max={68} sp={1} />
        <Txt y={71} t={(second || "NAIL BAR").toLocaleUpperCase("vi")} f={F.mont} size={8} fill={ink} max={64} sp={1.5} />
      </>;
    case "brand-pearl":
      return <>
        <circle cx={50} cy={27} r={13} fill={ink} />
        <path d="M15 34 Q50 74 85 34 M22 45 Q50 75 78 45" {...line} strokeWidth={2.7} />
        <Txt y={78} t={upper} f={F.play} size={14} fill={ink} max={84} sp={0.5} />
      </>;
    case "brand-jade":
      return <>
        <path d="M21 83 Q40 53 39 17 M34 55 Q18 48 22 34 Q36 37 34 55Z M39 43 Q55 37 54 23 Q41 25 39 43Z M29 68 Q16 66 15 54 Q27 56 29 68Z" {...line} strokeWidth={2.7} />
        <Txt x={68} y={49} t={first.toLocaleUpperCase("vi")} f={F.cormorant} size={23} fill={ink} max={52} />
        <Txt x={68} y={68} t={(second || "STUDIO").toLocaleUpperCase("vi")} f={F.josefin} size={10} fill={ink} max={54} sp={1.4} />
      </>;
    case "brand-velvet":
      return <>
        <path d="M49 34 C32 15 21 24 30 35 C35 42 42 40 49 34Z M51 34 C68 15 79 24 70 35 C65 42 58 40 51 34Z" {...line} strokeWidth={2.8} />
        <circle cx={50} cy={35} r={4} fill={ink} />
        <path d="M48 40 39 51l10-4 4 10M52 40l9 11-10-4-4 10" {...line} strokeWidth={2.4} />
        <Txt y={79} t={name} f={F.vibes} size={27} fill={ink} max={90} />
      </>;
    case "brand-golden":
      return <>
        <path d="M18 49h64M30 48a20 20 0 0 1 40 0M50 12v12M31 18l7 10M69 18l-7 10M19 32l11 6M81 32l-11 6" {...line} strokeWidth={2.7} />
        <Txt y={73} t={first.toLocaleUpperCase("vi")} f={F.play} size={17} fill={ink} max={84} />
        <Txt y={89} t={(second || "NAILS").toLocaleUpperCase("vi")} f={F.mont} size={10} fill={ink} max={77} sp={1.5} />
      </>;
    case "brand-cocoa":
      return <>
        <circle cx={50} cy={50} r={44} {...line} strokeWidth={3} />
        <circle cx={50} cy={50} r={37} {...line} strokeWidth={1.7} strokeDasharray="1 5" />
        <Txt y={53} t={initials} f={F.fraun} size={28} fill={ink} max={52} />
        <Txt y={71} t={upper} f={F.mont} size={8} fill={ink} max={65} sp={0.6} />
      </>;
    case "brand-fleur":
      return <>
        <path d="M49 75 Q54 55 51 32 M49 56 Q36 52 37 43 Q48 42 49 56Z M52 47 Q65 44 64 35 Q53 36 52 47Z" {...line} strokeWidth={2.5} />
        <circle cx={51} cy={23} r={5} fill={ink} />
        <path d="M51 17 Q39 9 38 19 Q39 25 46 25 M56 22 Q65 12 70 20 Q70 27 57 27" {...line} strokeWidth={2.5} />
        <Txt x={27} y={77} t={first} f={F.vibes} size={21} fill={ink} max={41} />
        <Txt x={74} y={77} t={second || "Nails"} f={F.vibes} size={21} fill={ink} max={41} />
      </>;
    case "brand-fresh":
      return <>
        <rect x={15} y={17} width={70} height={68} rx={6} {...line} strokeWidth={3} />
        <path d="M15 40h70M31 10v15M69 10v15" {...line} strokeWidth={3.5} />
        <Txt y={35} t={first.toLocaleUpperCase("vi")} f={F.oswald} size={14} fill={ink} max={62} />
        <Txt y={71} t={(second || "Nails").toLocaleUpperCase("vi")} f={F.charm} size={28} fill={ink} max={62} />
      </>;
    case "brand-crystal":
      return <>
        <path d="M30 15h40l14 18-34 32-34-32Z M16 33h68M30 15l8 18 12 32 12-32 8-18M38 33h24" {...line} strokeWidth={2.3} />
        <Txt y={83} t={upper} f={F.cormorant} size={16} fill={ink} max={90} sp={0.5} />
      </>;
    case "brand-muse":
      return <>
        <path d="M75 82 C71 72 67 64 69 55 L65 37 Q65 32 69 32 L73 46 73 19 Q73 14 78 16 L80 46 82 16 Q82 12 87 16 L86 48 90 23 Q92 19 96 22 L90 60 97 48 Q101 44 104 49 L95 71 92 85" transform="translate(8 0) scale(0.88)" {...line} strokeWidth={2.7} />
        <Txt x={38} y={47} t={first.toLocaleUpperCase("vi")} f={F.play} size={19} fill={ink} max={61} />
        <Txt x={38} y={68} t={(second || "MUSE").toLocaleUpperCase("vi")} f={F.mont} size={16} fill={ink} max={60} />
      </>;
    case "brand-bonbon":
      return <>
        <circle cx={23} cy={25} r={4} fill={ink} /><circle cx={79} cy={31} r={3} fill={ink} /><circle cx={77} cy={77} r={4} fill={ink} />
        <path d={star(20, 75, 6)} fill={ink} /><path d={star(80, 16, 5)} fill={ink} />
        <Txt y={55} t={first} f={F.pacifico} size={24} fill={ink} max={80} />
        <Txt y={74} t={(second || "NAILS").toLocaleUpperCase("vi")} f={F.quick} size={11} fill={ink} max={72} sp={1.5} />
      </>;
    default:
      return null;
  }
}

// 20 mẫu chữ: mỗi bố cục dùng phần tên khách sửa, vẫn giữ nhịp chữ của bản demo.
function TypographyStampBody({ id, name, ink, initials, maskId }: { id: string; name: string; ink: string; initials: string; maskId: string }) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = words[0] || "Nail";
  const second = words.slice(1).join(" ") || "Studio";
  const a = first.toLocaleUpperCase("vi");
  const b = second.toLocaleUpperCase("vi");
  const letters = [...a.replace(/[^\p{L}\p{N}]/gu, "")];
  const strokes = { fill: "none", stroke: ink, strokeLinecap: "round" as const };
  switch (id) {
    case "type-atelier-ix": {
      const mark = words.at(-1)?.length === 2 ? words.at(-1)!.toLocaleUpperCase("vi") : initials;
      return <><Txt y={67} t={mark} f={F.cormorant} size={66} fill={ink} max={72} /><Txt y={86} t={first.toLocaleUpperCase("vi")} f={F.josefin} size={12} fill={ink} max={80} sp={2} /></>;
    }
    case "type-soho": {
      const cut = Math.ceil(letters.length / 2);
      return <><Txt x={34} y={48} t={letters.slice(0, cut).join("")} f={F.mont} size={38} fill={ink} max={55} /><Txt x={66} y={79} t={letters.slice(cut).join("") || b.slice(0, 2)} f={F.mont} size={38} fill={ink} max={55} /></>;
    }
    case "type-mira":
      return <><path d="M14 24h72M14 77h72" {...strokes} strokeWidth={2.5} /><Txt y={64} t={first} f={F.play} size={43} fill={ink} max={78} italic /></>;
    case "type-dot":
      return <><Txt x={45} y={64} t={a} f={F.mont} size={38} fill={ink} max={69} /><circle cx={84} cy={58} r={6} fill={ink} /></>;
    case "type-vera":
      return <>{letters.slice(0, 4).map((letter, i) => <Txt key={i} y={31 + i * 18} t={letter} f={F.oswald} size={25} fill={ink} max={28} />)}</>;
    case "type-no1":
      return <><Txt x={26} y={39} t={a[0] + "°"} f={F.play} size={27} fill={ink} max={36} /><Txt x={55} y={79} t={a.match(/\d+/)?.[0] || "1"} f={F.play} size={67} fill={ink} max={55} /><Txt x={78} y={79} t={b} f={F.josefin} size={12} fill={ink} max={33} sp={1} /></>;
    case "type-pink-unit":
      return <><Txt y={48} t={a} f={F.mont} size={31} fill="none" stroke={ink} strokeWidth={1.5} max={80} /><Txt y={74} t={b} f={F.mont} size={28} fill={ink} max={82} /></>;
    case "type-salon-5": {
      const last = words.at(-1) || "5";
      return <><Txt x={40} y={37} t={a} f={F.oswald} size={17} fill={ink} max={60} sp={1.3} /><Txt x={63} y={80} t={/\d/.test(last) ? last : initials.slice(-1)} f={F.fraun} size={65} fill={ink} max={55} /></>;
    }
    case "type-set-theory":
      return <><Txt y={30} t={a} f={F.josefin} size={23} fill={ink} max={70} /><Txt y={53} t={a} f={F.josefin} size={23} fill={ink} max={70} /><Txt y={80} t={a} f={F.mont} size={28} fill={ink} max={78} /></>;
    case "type-oui":
      return <><Txt x={31} y={72} t={first[0].toLocaleUpperCase("vi")} f={F.cormorant} size={72} fill={ink} max={49} /><Txt x={69} y={69} t={first.slice(1).toLocaleLowerCase("vi") || second.toLocaleLowerCase("vi")} f={F.charm} size={39} fill={ink} max={53} /></>;
    case "type-blanc":
      return <><defs><mask id={maskId}><rect width={100} height={100} fill="#fff" /><rect x={8} y={52} width={84} height={2.5} fill="#000" /></mask></defs><g mask={`url(#${maskId})`}><Txt y={65} t={a} f={F.mont} size={29} fill={ink} max={86} /></g></>;
    case "type-ama": {
      const three = [letters[0] || "A", letters[1] || letters[0] || "M", letters[2] || letters[0] || "A"];
      return <><Txt x={23} y={70} t={three[0]} f={F.play} size={52} fill={ink} max={32} /><Txt x={50} y={62} t={three[1]} f={F.mont} size={39} fill={ink} max={36} /><Txt x={77} y={70} t={three[2]} f={F.play} size={52} fill={ink} max={32} /></>;
    }
    case "type-tips-co":
      return <><Txt y={35} t={a} f={F.josefin} size={25} fill={ink} max={77} sp={2} /><Txt y={66} t="&" f={F.play} size={37} fill={ink} max={36} italic /><Txt y={84} t={(words.at(-1) || second).toLocaleUpperCase("vi")} f={F.josefin} size={18} fill={ink} max={62} sp={3} /></>;
    case "type-polish-dept":
      return <><Txt y={45} t={a} f={F.josefin} size={25} fill={ink} max={82} sp={-1} /><Txt y={74} t={b} f={F.josefin} size={25} fill={ink} max={82} sp={-1} /></>;
    case "type-lumi":
      return <><Txt x={31} y={75} t={first[0].toLocaleUpperCase("vi")} f={F.cormorant} size={73} fill={ink} max={44} /><Txt x={67} y={52} t={first.slice(1).toLocaleUpperCase("vi")} f={F.play} size={20} fill={ink} max={43} sp={1} /><Txt x={67} y={71} t={b} f={F.josefin} size={13} fill={ink} max={45} sp={1.5} /></>;
    case "type-nail-note":
      return <>{letters.slice(0, 4).map((letter, i) => <Txt key={i} x={20 + i * 20} y={i % 2 ? 58 : 69} t={letter} f={F.mont} size={31} fill={ink} max={26} />)}</>;
    case "type-soft-set":
      return <><Txt y={53} t={first} f={F.play} size={36} fill={ink} max={80} italic /><Txt y={79} t={b} f={F.oswald} size={27} fill={ink} max={73} sp={3} /></>;
    case "type-line-lab":
      return <><Txt x={39} y={45} t={a} f={F.mont} size={28} fill={ink} max={67} sp={1} /><Txt x={62} y={75} t={b} f={F.mont} size={30} fill={ink} max={64} sp={1} /></>;
    case "type-day-01":
      return <><Txt y={28} t={a} f={F.josefin} size={21} fill={ink} max={78} sp={2} /><Txt y={80} t={b} f={F.oswald} size={52} fill={ink} max={73} sp={2} /></>;
    case "type-mint-club":
      return <><Txt y={54} t={first.toLocaleLowerCase("vi")} f={F.charm} size={39} fill={ink} max={85} /><Txt y={79} t={b} f={F.mont} size={21} fill={ink} max={79} sp={1.5} /></>;
    default:
      return null;
  }
}

export function StampSvg({ design: d, svgRef, className, guide = false }: { design: StampDesign; svgRef?: Ref<SVGSVGElement>; className?: string; guide?: boolean }) {
  const uid = useId().replace(/[^\w-]/g, "");
  const c = d.color;
  const name = d.name.trim() || " ";
  const ini = initialsOf(name);
  const line = { fill: "none", stroke: c, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  let body: ReactNode = null;

  switch (d.templateId) {
    case "script-two": {
      const lines = twoLines(name);
      body =
        lines.length > 1 ? (
          <g transform="rotate(-10 50 50)">
            <Txt y={46} t={lines[0]} f={F.script} size={28} fill={c} max={82} />
            <Txt y={72} t={lines[1]} f={F.script} size={28} fill={c} max={82} />
          </g>
        ) : (
          <Txt y={60} t={lines[0]} f={F.script} size={34} fill={c} max={86} rotate={-10} />
        );
      break;
    }
    case "ring-text":
      body = (
        <>
          <circle cx={C} cy={C} r={46} {...line} strokeWidth={3.5} />
          <circle cx={C} cy={C} r={30} {...line} strokeWidth={2} />
          <Arc id={`${uid}-t`} r={34.5} t={name.toLocaleUpperCase("vi")} f={F.mont} size={10.5} fill={c} span={170} />
          <Arc id={`${uid}-b`} r={41} t={d.tagline.toLocaleUpperCase("vi")} f={F.mont} size={8.5} fill={c} bottom span={110} />
          <path d={NAIL} transform="translate(50 62) scale(0.95)" fill={c} />
          {!d.tagline && <path d={star5(C, 88, 4)} fill={c} />}
          <circle cx={15} cy={C} r={2.2} fill={c} />
          <circle cx={85} cy={C} r={2.2} fill={c} />
        </>
      );
      break;
    case "script-slant": {
      const lines = twoLines(name);
      body = (
        <g transform="rotate(-14 50 50)">
          {lines.length > 1 ? (
            <>
              <Txt y={44} t={lines[0]} f={F.pacifico} size={24} fill={c} max={80} />
              <Txt x={56} y={70} t={lines[1]} f={F.pacifico} size={24} fill={c} max={74} />
            </>
          ) : (
            <Txt y={58} t={lines[0]} f={F.pacifico} size={28} fill={c} max={86} />
          )}
          <path d="M18 82 C38 76 62 78 84 72" {...line} strokeWidth={3} />
        </g>
      );
      break;
    }
    case "heart-mono":
      body = (
        <>
          <path d="M50 88 C22 68 8 52 12 34 C16 16 38 12 50 28 C62 12 84 16 88 34 C92 52 78 68 50 88 Z" {...line} strokeWidth={4} />
          <Txt y={60} t={ini} f={F.play} size={30} fill={c} max={46} />
        </>
      );
      break;
    case "bottle":
      body = (
        <>
          <rect x={42} y={8} width={16} height={22} rx={3} fill={c} />
          <rect x={38} y={28} width={24} height={5} rx={1.5} fill={c} />
          <rect x={27} y={32} width={46} height={36} rx={11} fill={c} />
          <rect x={33} y={39} width={4} height={20} rx={2} fill="#fff" />
          <Txt y={88} t={name.toLocaleUpperCase("vi")} f={F.mont} size={13} fill={c} max={90} sp={0.5} />
        </>
      );
      break;
    case "check-burst":
      body = (
        <>
          <path d={burst(47, 39, 16)} fill={c} />
          <path d="M30 51 L44 65 L71 36" fill="none" stroke="#fff" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
      break;
    case "solid-mono":
      body = (
        <>
          <circle cx={C} cy={C} r={47} fill={c} />
          <circle cx={C} cy={C} r={40} fill="none" stroke="#fff" strokeWidth={2} />
          <Txt y={63} t={ini} f={F.play} size={38} fill="#fff" max={60} />
        </>
      );
      break;
    case "crown":
      body = (
        <>
          <path d="M24 46 L19 20 L35 32 L50 14 L65 32 L81 20 L76 46 Z" fill={c} />
          <rect x={23} y={49} width={54} height={6} rx={2} fill={c} />
          <Txt y={85} t={name} f={F.script} size={24} fill={c} max={92} />
        </>
      );
      break;
    case "flower":
      body = (
        <>
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx={C} cy={22} rx={15} ry={20} transform={`rotate(${a} 50 50)`} {...line} strokeWidth={3} />
          ))}
          <circle cx={C} cy={C} r={17} fill={c} />
          <Txt y={57.5} t={ini.slice(0, 1)} f={F.play} size={21} fill="#fff" max={24} />
        </>
      );
      break;
    case "star-ring":
      body = (
        <>
          <circle cx={C} cy={C} r={46} {...line} strokeWidth={3} />
          <circle cx={C} cy={C} r={29} {...line} strokeWidth={1.8} strokeDasharray="1 4" />
          <Arc id={`${uid}-t`} r={35} t={name.toLocaleUpperCase("vi")} f={F.mont} size={10.5} fill={c} span={180} />
          <path d={star5(C, 52, 20)} fill={c} />
          <path d={star5(16, 63, 4)} fill={c} />
          <path d={star5(84, 63, 4)} fill={c} />
          <path d={star5(C, 88, 4)} fill={c} />
        </>
      );
      break;
    case "hexagon": {
      const hex = (r: number) =>
        Array.from({ length: 6 }, (_, i) => pt(r, i * 60 - 90))
          .map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`)
          .join(" ") + " Z";
      body = (
        <>
          <path d={hex(46)} {...line} strokeWidth={3.5} />
          <path d={hex(38)} {...line} strokeWidth={1.8} />
          <Txt y={61} t={ini} f={F.mont} size={30} fill={c} max={50} sp={1} />
        </>
      );
      break;
    }
    case "scallop-thanks": {
      const n = 18;
      const s0 = pt(44, -90);
      const d0 = Array.from({ length: n }, (_, i) => {
        const [x, y] = pt(44, -90 + (360 / n) * (i + 1));
        return `A8 8 0 0 1 ${x} ${y}`;
      }).join(" ");
      const lines = twoLines(name.toLocaleUpperCase("vi"));
      body = (
        <>
          <path d={`M${s0[0]} ${s0[1]} ${d0} Z`} {...line} strokeWidth={3} />
          {lines.length > 1 ? (
            <>
              <Txt y={45} t={lines[0]} f={F.mont} size={15} fill={c} max={64} sp={0.5} />
              <Txt y={62} t={lines[1]} f={F.mont} size={15} fill={c} max={64} sp={0.5} />
            </>
          ) : (
            <Txt y={56} t={lines[0]} f={F.mont} size={16} fill={c} max={66} />
          )}
          <path d="M50 80 C43 75 40 71 41 68 C42 65 46 64.5 50 68 C54 64.5 58 65 59 68 C60 71 57 75 50 80 Z" fill={c} />
        </>
      );
      break;
    }
    case "nail-letter":
      body = (
        <>
          <path d={NAIL} transform="translate(50 76) scale(2.1)" {...line} strokeWidth={1.8} />
          <Txt y={64} t={ini.slice(0, 1)} f={F.play} size={32} fill={c} max={34} />
          <path d={star(79, 20, 9)} fill={c} />
          <path d={star(22, 30, 5)} fill={c} />
        </>
      );
      break;
    case "butterfly":
      body = (
        <g fill={c}>
          <path d="M48 46 C38 20 14 12 8 26 C3 40 22 50 48 50 Z" />
          <path d="M48 54 C28 56 16 70 23 82 C30 92 44 78 48 54 Z" />
          <path d="M52 46 C62 20 86 12 92 26 C97 40 78 50 52 50 Z" />
          <path d="M52 54 C72 56 84 70 77 82 C70 92 56 78 52 54 Z" />
          <rect x={47.5} y={32} width={5} height={46} rx={2.5} />
          <path d="M50 34 Q45 20 38 14 M50 34 Q55 20 62 14" fill="none" stroke={c} strokeWidth={2.2} strokeLinecap="round" />
        </g>
      );
      break;
    case "sparkle-name":
      body = (
        <>
          <path d={star(44, 38, 30)} fill={c} />
          <path d={star(76, 18, 10)} fill={c} />
          <path d={star(78, 56, 6)} fill={c} />
          <Txt y={90} t={name.toLocaleUpperCase("vi")} f={F.mont} size={12} fill={c} max={92} sp={0.5} />
        </>
      );
      break;
    case "gem":
      body = (
        <g {...line} strokeWidth={3}>
          <path d="M28 20 H72 L90 40 L50 88 L10 40 Z" />
          <path d="M10 40 H90 M28 20 L38 40 L50 88 M72 20 L62 40 L50 88 M38 40 L50 20 L62 40" strokeWidth={2.2} />
        </g>
      );
      break;
    case "laurel": {
      // Cành cong bên trái (từ dưới lên trên), lá nhọn mọc so le; bên phải lật gương.
      const r = 38;
      const branch = (
        <>
          <path d={`M${pt(r, 118).join(" ")} A${r} ${r} 0 0 1 ${pt(r, 238).join(" ")}`} {...line} strokeWidth={2} />
          {Array.from({ length: 6 }, (_, i) => {
            const a = 124 + i * 21;
            const [x, y] = pt(r, a);
            const tilt = i % 2 ? 32 : -32;
            return <path key={i} d="M0 0 C-4.2 -5 -4.2 -12 0 -17 C4.2 -12 4.2 -5 0 0 Z" transform={`translate(${x} ${y}) rotate(${a + 180 + tilt})`} fill={c} />;
          })}
        </>
      );
      body = (
        <>
          {branch}
          <g transform="translate(100 0) scale(-1 1)">{branch}</g>
          <Txt y={60} t={ini} f={F.play} size={28} fill={c} max={44} />
        </>
      );
      break;
    }
    case "smile":
      body = (
        <>
          <circle cx={C} cy={C} r={44} {...line} strokeWidth={4.5} />
          <ellipse cx={36} cy={40} rx={5} ry={7} fill={c} />
          <ellipse cx={64} cy={40} rx={5} ry={7} fill={c} />
          <path d="M28 58 Q50 80 72 58" {...line} strokeWidth={5} />
        </>
      );
      break;
    case "dot-ring":
      body = (
        <>
          {Array.from({ length: 24 }, (_, i) => {
            const [x, y] = pt(44, i * 15);
            return <circle key={i} cx={x} cy={y} r={2.6} fill={c} />;
          })}
          <circle cx={C} cy={C} r={35} {...line} strokeWidth={2.5} />
          <Txt y={61} t={ini} f={F.fraun} size={30} fill={c} max={50} />
        </>
      );
      break;
    case "banner":
      body = (
        <>
          <circle cx={C} cy={C} r={45} {...line} strokeWidth={3} />
          <path d="M4 40 H96 L90 51 L96 62 H4 L10 51 Z" fill={c} />
          <Txt y={56} t={name.toLocaleUpperCase("vi")} f={F.mont} size={12} fill="#fff" max={74} sp={0.5} />
          <path d={star5(C, 24, 9)} fill={c} />
          <path d={star5(C, 80, 7)} fill={c} />
        </>
      );
      break;
    default:
      if (d.templateId.startsWith("brand-")) {
        body = <BrandedStampBody id={d.templateId} name={name} ink={c} initials={ini} />;
      } else if (d.templateId.startsWith("type-")) {
        body = <TypographyStampBody id={d.templateId} name={name} ink={c} initials={ini} maskId={`${uid}-mask`} />;
      }
  }

  return (
    <svg ref={svgRef} className={className} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-label={`Con dấu ${d.name}`}>
      {guide && <circle cx={C} cy={C} r={49.5} fill="none" stroke="#000" strokeOpacity={0.12} strokeWidth={0.5} strokeDasharray="2 2" />}
      {body}
    </svg>
  );
}
