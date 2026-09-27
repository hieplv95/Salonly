import type { ReactNode } from "react";
import type { CardDesign } from "@/lib/card-templates";
import { F, HEART, mix, star, type Font, type useSvgText } from "../design/svg-kit";
import type { Box, StampOpts } from "./CardSvg";

// Font thêm cho bộ thẻ xu hướng; đều có bộ chữ tiếng Việt và được nhúng khi tải file.
const X = {
  fraunces: { family: "Fraunces", weight: 900, width: 0.62 },
  lobster: { family: "Lobster", weight: 400, width: 0.48 },
  pacifico: { family: "Pacifico", weight: 400, width: 0.6 },
  dancing: { family: "Dancing Script", weight: 700, width: 0.48 },
  quick: { family: "Quicksand", weight: 700, width: 0.6 },
  lora: { family: "Lora", weight: 700, width: 0.58 },
  josefin: { family: "Josefin Sans", weight: 600, width: 0.6 },
  vn: { family: "Be Vietnam Pro", weight: 700, width: 0.64 },
} satisfies Record<string, Font>;

const rng = (seed: number) => () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
const polar = (x: number, y: number, r: number, a: number) => [+(x + r * Math.cos(a)).toFixed(2), +(y + r * Math.sin(a)).toFixed(2)] as const;

// Màu sơn móng cho mẫu bảng màu.
const POLISH = ["#F2C6C2", "#E8A0A8", "#C94F6D", "#8E2C48", "#F4D3B4", "#D9B8E8", "#9CC6E0", "#A8D5BA", "#F6E27F", "#E86F4E", "#3A3A3A", "#B8B8C8", "#F7A8C4", "#7E5A9B"];

export type CardKit = {
  design: CardDesign;
  back: boolean;
  W: number;
  H: number;
  C: number;
  uid: string;
  count: number;
  offer: string;
  initials: string;
  T: ReturnType<typeof useSvgText>["T"];
  key: () => string;
  stamps: (box: Box, maxCols: number, o: StampOpts) => ReactNode[];
};

type Cell = { i: number; cx: number; cy: number; r: number; isFinal: boolean; isMid: boolean; special: boolean };

/* ---------- Hình vẽ nhỏ ---------- */

// Móng vuông tròn đầu (squoval) kiểu French: thân móng + đầu trắng hình trăng khuyết.
function FrenchNail({ x, y, w, h, body, tip, line }: { x: number; y: number; w: number; h: number; body: string; tip: string; line: string }) {
  const top = y - h / 2, bot = y + h / 2, r = w / 2, yt = top + h * 0.34, d = h * 0.06;
  return (
    <g>
      <path d={`M${x - r} ${bot - w * 0.2} V${top + r} A${r} ${r} 0 0 1 ${x + r} ${top + r} V${bot - w * 0.2} Q${x + r} ${bot} ${x} ${bot} Q${x - r} ${bot} ${x - r} ${bot - w * 0.2}Z`} fill={body} stroke={line} strokeWidth={1.5} />
      <path d={`M${x - r} ${yt + d} Q${x} ${yt - d} ${x + r} ${yt + d} V${top + r} A${r} ${r} 0 0 0 ${x - r} ${top + r}Z`} fill={tip} />
      <path d={`M${x - r * 0.45} ${top + r * 0.9} Q${x - r * 0.55} ${y} ${x - r * 0.4} ${bot - w * 0.35}`} fill="none" stroke="#FFFFFF" strokeOpacity={0.55} strokeWidth={w * 0.07} strokeLinecap="round" />
    </g>
  );
}

function Blossom({ x, y, r, color, center }: { x: number; y: number; r: number; color: string; center: string }) {
  return (
    <g>
      {Array.from({ length: 5 }, (_, i) => <ellipse key={i} cx={x} cy={y - r * 0.55} rx={r * 0.4} ry={r * 0.55} fill={color} transform={`rotate(${i * 72} ${x} ${y})`} />)}
      <circle cx={x} cy={y} r={r * 0.2} fill={center} />
    </g>
  );
}

function Strawberry({ x, y, s, fill, seed, leaf }: { x: number; y: number; s: number; fill: string; seed: string; leaf: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 60 C-38 42 -52 4 -44 -18 C-36 -40 -12 -38 0 -32 C12 -38 36 -40 44 -18 C52 4 38 42 0 60Z" fill={fill} />
      {[[-22, -14], [0, -18], [22, -14], [-28, 6], [-8, 2], [12, 4], [30, 6], [-16, 24], [6, 24], [22, 24], [-4, 42]].map(([sx, sy], i) => <ellipse key={i} cx={sx} cy={sy} rx={2.4} ry={3.6} fill={seed} />)}
      <path d="M0 -32 L-22 -46 L-8 -40 L-10 -56 L0 -42 L10 -56 L8 -40 L22 -46Z" fill={leaf} />
    </g>
  );
}

function Butterfly({ x, y, s, wing, body, rot = 0 }: { x: number; y: number; s: number; wing: string; body: string; rot?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <ellipse cx={-22} cy={-16} rx={24} ry={30} fill={wing} transform="rotate(-30 -22 -16)" />
      <ellipse cx={22} cy={-16} rx={24} ry={30} fill={wing} transform="rotate(30 22 -16)" />
      <ellipse cx={-16} cy={18} rx={14} ry={18} fill={wing} fillOpacity={0.8} transform="rotate(25 -16 18)" />
      <ellipse cx={16} cy={18} rx={14} ry={18} fill={wing} fillOpacity={0.8} transform="rotate(-25 16 18)" />
      <rect x={-3} y={-28} width={6} height={54} rx={3} fill={body} />
      <path d="M-2 -28 Q-10 -44 -16 -46 M2 -28 Q10 -44 16 -46" fill="none" stroke={body} strokeWidth={2} strokeLinecap="round" />
    </g>
  );
}

function Doily({ x, y, r, fill, line }: { x: number; y: number; r: number; fill: string; line: string }) {
  const n = Math.max(16, Math.round(r / 7));
  return (
    <g>
      {Array.from({ length: n }, (_, i) => { const [px, py] = polar(x, y, r, (i / n) * Math.PI * 2); return <circle key={i} cx={px} cy={py} r={(Math.PI * r) / n + 1} fill={fill} />; })}
      <circle cx={x} cy={y} r={r} fill={fill} />
      <circle cx={x} cy={y} r={r * 0.9} fill="none" stroke={line} strokeOpacity={0.5} strokeWidth={1.2} strokeDasharray="2 5" />
      {Array.from({ length: n }, (_, i) => { const [px, py] = polar(x, y, r * 0.96, ((i + 0.5) / n) * Math.PI * 2); return <circle key={`h${i}`} cx={px} cy={py} r={Math.max(1.4, r * 0.03)} fill={line} fillOpacity={0.35} />; })}
      <circle cx={x} cy={y} r={r * 0.78} fill="none" stroke={line} strokeOpacity={0.35} strokeWidth={1} />
    </g>
  );
}

// Nét cọ vòng tròn thiền (ensō): một nét liền hở một góc, đậm ở giữa và thon dần hai đầu.
function Enso({ x, y, r, color, w }: { x: number; y: number; r: number; color: string; w: number }) {
  const n = 64, a0 = -1.1, sweep = Math.PI * 1.84;
  const outer: string[] = [], inner: string[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, a = a0 + sweep * t;
    const half = (w / 2) * (0.25 + 0.75 * Math.sin(Math.PI * Math.min(1, t * 1.08)) ** 0.6);
    outer.push(polar(x, y, r + half, a).join(" "));
    inner.push(polar(x, y, r - half, a).join(" "));
  }
  return <path d={`M${outer.join(" L")} L${inner.reverse().join(" L")}Z`} fill={color} fillOpacity={0.92} />;
}

/* ---------- Bộ 20 mẫu ---------- */

export function trendCardLayers(k: CardKit): ReactNode[] {
  const { design, back, W, H, C, uid, count, offer, initials, T, key, stamps } = k;
  const { bg, ink, accent } = design.colors;
  const L: ReactNode[] = [];
  const id = (s: string) => `${uid}-${s}`;
  const url = (s: string) => `url(#${id(s)})`;
  const contact = (items = [design.phone, design.website, design.social]) => items.filter((s) => s.trim()).join("   ·   ");
  const deco = (label: string, nodes: ReactNode) => <g key={key()} data-card-group-label={label}>{nodes}</g>;

  // Ô tích điểm tự vẽ: cùng cách chia hàng như lưới chuẩn, giữ 15 vị trí để lớp đã kéo không đổi ID.
  const grid = (box: Box, maxCols: number, draw: (c: Cell) => ReactNode[]): ReactNode[] => {
    const rows = Math.ceil(count / maxCols);
    const cols = Math.ceil(count / rows);
    const cw = box.w / cols, chh = box.h / rows, r = Math.min(cw, chh) * 0.4;
    return Array.from({ length: 15 }, (_, i) => {
      if (i >= count) return null;
      const row = Math.floor(i / cols);
      const inRow = row < rows - 1 ? cols : count - cols * (rows - 1);
      const col = i - row * cols;
      const isFinal = i === count - 1;
      const isMid = design.midAt > 0 && i === design.midAt - 1 && !isFinal;
      const c: Cell = { i, cx: box.x + (box.w - inRow * cw) / 2 + cw * (col + 0.5), cy: box.y + chh * (row + 0.5), r, isFinal, isMid, special: isFinal || isMid };
      return <g key={key()} data-card-group-label={`Ô tích điểm ${i + 1}`}>{draw(c)}</g>;
    });
  };
  const reward = (c: Cell, fill: string, dy = 0, font: Font = F.bold, size = 0.4) =>
    T(c.isFinal ? design.reward : design.midReward, c.cx, c.cy + c.r * 0.15 + dy, font, c.r * size, c.r * 1.45, { fill, upper: true, spacing: 0.06 });

  switch (design.style) {
    case "jelly-nails": {
      L.push(<defs key={key()}><radialGradient id={id("jel")} cx=".35" cy=".3" r=".75"><stop offset="0" stopColor="#FFFFFF" stopOpacity=".95" /><stop offset=".45" stopColor={accent} stopOpacity=".28" /><stop offset="1" stopColor={accent} stopOpacity=".7" /></radialGradient></defs>);
      const bubble = (x: number, y: number, r: number) => [
        <circle key="b" cx={x} cy={y} r={r} fill={url("jel")} stroke={accent} strokeOpacity={0.45} strokeWidth={2} />,
        <ellipse key="h" cx={x - r * 0.35} cy={y - r * 0.42} rx={r * 0.26} ry={r * 0.14} fill="#FFFFFF" fillOpacity={0.85} transform={`rotate(-30 ${x - r * 0.35} ${y - r * 0.42})`} />,
      ];
      if (!back) {
        L.push(deco("Bong bóng thạch", [bubble(830, 320, 175), bubble(975, 150, 88), bubble(690, 505, 72), bubble(1000, 505, 45)].flat().map((n, i) => <g key={i}>{n}</g>)));
        L.push(T(design.salon, 320, 170, F.bold, 24, 540, { upper: true, spacing: 0.25, fill: accent }));
        L.push(T(design.title, 320, 305, X.pacifico, 86, 560));
        L.push(T(design.tagline, 320, 385, F.sans, 22, 520));
        L.push(T(design.social, 320, 520, F.sans, 18, 520, { upper: true, spacing: 0.2, opacity: 0.8 }));
      } else {
        L.push(T(design.title, C, 98, X.pacifico, 54, 800));
        L.push(T(offer, C, 148, F.sans, 19, 820, { upper: true, spacing: 0.18, fill: accent }));
        L.push(...grid({ x: 70, y: 172, w: 910, h: 318 }, 5, (c) => c.special
          ? [<circle key="s" cx={c.cx} cy={c.cy} r={c.r} fill={accent} />, reward(c, "#FFFFFF")]
          : bubble(c.cx, c.cy, c.r)));
        L.push(T(contact(), C, 552, F.sans, 18, 900));
      }
      break;
    }
    case "french-tip": {
      const body = mix(bg, accent, 0.28);
      if (!back) {
        L.push(deco("Bộ móng French", [0, 1, 2, 3, 4].map((i) => <FrenchNail key={i} x={650 + i * 84} y={318 - Math.sin((i / 4) * Math.PI) * 34} w={70} h={200} body={body} tip="#FFFFFF" line={mix(accent, ink, 0.3)} />)));
        L.push(<path key={key()} d="M600 470 H1000" stroke={accent} strokeWidth={1.5} />);
        L.push(T(design.salon, 300, 150, F.serif2, 40, 500, { upper: true, spacing: 0.12 }));
        L.push(T(design.title, 300, 300, F.script, 108, 500));
        L.push(T(design.tagline, 300, 370, F.sans, 19, 480, { upper: true, spacing: 0.25, fill: accent }));
        L.push(<path key={key()} d="M180 420 H420" stroke={accent} strokeOpacity={0.6} />);
        L.push(T(design.social, 300, 500, F.sans, 18, 480));
        L.push(T("French manicure", 800, 520, F.sans, 16, 380, { upper: true, spacing: 0.3, fill: accent }));
      } else {
        L.push(T(design.title, C, 92, F.script, 70, 700));
        L.push(T(offer, C, 136, F.sans, 19, 820, { upper: true, spacing: 0.2, fill: accent }));
        L.push(...grid({ x: 80, y: 152, w: 890, h: 350 }, 5, (c) => [
          <FrenchNail key="n" x={c.cx} y={c.cy} w={c.r * 1.2} h={c.r * 2.15} body={c.special ? accent : body} tip="#FFFFFF" line={mix(accent, ink, 0.3)} />,
          c.special ? T(c.isFinal ? design.reward : design.midReward, c.cx, c.cy + c.r * 0.55, F.bold, c.r * 0.32, c.r * 1.05, { fill: "#FFFFFF", upper: true }) : null,
        ]));
        L.push(T(contact(), C, 556, F.sans, 18, 900));
      }
      break;
    }
    case "milk-bath": {
      const petals = ["#F7C6D3", "#FAD7C0", "#E3D2F3", accent];
      const flowers = (seed: number, n: number, area: Box) => {
        const r = rng(seed);
        return Array.from({ length: n }, (_, i) => <g key={`${seed}-${i}`} opacity={0.85}><Blossom x={area.x + r() * area.w} y={area.y + r() * area.h} r={26 + r() * 30} color={petals[i % petals.length]} center="#F6E7A8" /></g>);
      };
      const bubbles = (seed: number) => { const r = rng(seed); return Array.from({ length: 14 }, (_, i) => <circle key={i} cx={r() * W} cy={r() * H} r={10 + r() * 40} fill="#FFFFFF" fillOpacity={0.55} />); };
      if (!back) {
        L.push(deco("Bong bóng sữa", bubbles(4)));
        L.push(deco("Hoa nổi", [...flowers(12, 9, { x: 30, y: 40, w: 540, h: 330 }), ...flowers(31, 6, { x: 30, y: 880, w: 540, h: 140 })]));
        L.push(T(design.title, C, 540, F.script, 96, 510));
        L.push(T(design.salon, C, 620, F.serif2, 36, 480, { upper: true, spacing: 0.12 }));
        L.push(T(design.tagline, C, 668, F.sans, 17, 460, { upper: true, spacing: 0.3, fill: mix(accent, ink, 0.45) }));
        L.push(T(design.social, C, 790, F.sans, 18, 460, { opacity: 0.8 }));
      } else {
        L.push(deco("Hoa nổi", [...flowers(7, 3, { x: 20, y: 20, w: 560, h: 60 }), ...flowers(9, 3, { x: 20, y: 975, w: 560, h: 55 })]));
        L.push(T(design.salon, C, 150, F.serif2, 36, 480, { upper: true, spacing: 0.1 }));
        L.push(T(offer, C, 198, F.sans, 17, 480, { upper: true, spacing: 0.18, fill: mix(accent, ink, 0.45) }));
        L.push(...grid({ x: 60, y: 230, w: 480, h: 590 }, 3, (c) => c.special
          ? [<Blossom key="f" x={c.cx} y={c.cy} r={c.r * 1.05} color={accent} center={mix(accent, "#FFFFFF", 0.6)} />, reward(c, ink, 0, F.bold, 0.34)]
          : [<circle key="c" cx={c.cx} cy={c.cy} r={c.r} fill="#FFFFFF" stroke={accent} strokeWidth={2.5} />]));
        L.push(T(design.phone, C, 880, F.sans, 20, 460));
        L.push(T(contact([design.website, design.social]), C, 920, F.sans, 17, 480, { opacity: 0.8 }));
      }
      break;
    }
    case "bento-grid": {
      const tile = (x: number, y: number, w: number, h: number, fill: string) => <rect key={key()} x={x} y={y} width={w} height={h} rx={28} fill={fill} />;
      const lilac = "#CFC6FF";
      if (!back) {
        L.push(tile(40, 40, 560, 330, "#FFFFFF"), tile(620, 40, 390, 210, accent), tile(620, 270, 390, 100, ink), tile(40, 390, 300, 170, lilac), tile(360, 390, 650, 170, "#FFFFFF"));
        L.push(T(design.salon, 80, 100, X.vn, 20, 480, { anchor: "start", upper: true, spacing: 0.16 }));
        L.push(T(design.title, 80, 250, X.vn, 70, 490, { anchor: "start" }));
        L.push(T(design.tagline, 80, 310, F.sans, 20, 480, { anchor: "start", opacity: 0.7 }));
        L.push(T(initials, 815, 190, X.vn, 120, 330, { fill: "#FFFFFF" }));
        L.push(T("Thành viên thân thiết", 815, 330, F.sans, 19, 340, { fill: bg, upper: true, spacing: 0.12 }));
        L.push(T("★ Mã thẻ", 70, 450, F.bold, 16, 240, { anchor: "start", upper: true, spacing: 0.15 }));
        L.push(T(design.memberNo, 70, 510, X.vn, 26, 250, { anchor: "start" }));
        L.push(T(design.social, 400, 460, X.vn, 26, 560, { anchor: "start" }));
        L.push(T(design.website, 400, 510, F.sans, 20, 560, { anchor: "start", opacity: 0.7 }));
      } else {
        L.push(tile(40, 40, 970, 110, "#FFFFFF"), tile(40, 170, 700, 390, "#FFFFFF"), tile(760, 170, 250, 190, accent), tile(760, 380, 250, 180, ink));
        L.push(T(design.title, 80, 110, X.vn, 38, 420, { anchor: "start" }));
        L.push(T(offer, 970, 108, F.sans, 18, 480, { anchor: "end", upper: true, spacing: 0.1, opacity: 0.75 }));
        L.push(...stamps({ x: 70, y: 200, w: 640, h: 330 }, 5, { shape: "square", fill: bg, stroke: bg, strokeW: 1, specialFill: accent, specialText: "#FFFFFF" }));
        L.push(T("Quà", 885, 225, F.sans, 17, 200, { fill: "#FFFFFF", upper: true, spacing: 0.2 }));
        L.push(T(design.reward, 885, 300, X.vn, 44, 210, { fill: "#FFFFFF", upper: true }));
        L.push(T(design.phone, 885, 450, X.vn, 24, 210, { fill: bg }));
        L.push(T(design.website, 885, 495, F.sans, 17, 210, { fill: bg, opacity: 0.8 }));
      }
      break;
    }
    case "mesh-gradient": {
      const blobs: [string, string, number, number, number][] = [["m1", "#FF7EB6", 0.15, 0.2, 0.7], ["m2", "#FFB86B", 0.85, 0.15, 0.6], ["m3", "#6EE7F9", 0.8, 0.95, 0.7], ["m4", "#8B5CF6", 0.1, 0.95, 0.65]];
      L.push(<defs key={key()}>{blobs.map(([n, c]) => <radialGradient key={n} id={id(n)}><stop offset="0" stopColor={c} /><stop offset=".6" stopColor={c} stopOpacity=".5" /><stop offset="1" stopColor={c} stopOpacity="0" /></radialGradient>)}</defs>);
      L.push(<rect key={key()} width={W} height={H} fill={bg} />);
      L.push(deco("Nền loang màu", blobs.map(([n, , x, y, r]) => <circle key={n} cx={x * W} cy={y * H} r={r * W} fill={url(n)} />)));
      const deep = mix(bg, "#000000", 0.45);
      if (!back) {
        L.push(T(design.salon, 70, 100, F.bold, 20, 600, { anchor: "start", upper: true, spacing: 0.25, fill: ink }));
        L.push(<rect key={key()} x={800} y={62} width={180} height={50} rx={25} fill="#FFFFFF" fillOpacity={0.25} stroke="#FFFFFF" strokeOpacity={0.7} />);
        L.push(T("MEMBER", 890, 96, F.bold, 18, 150, { fill: ink, spacing: 0.25 }));
        L.push(T(design.title, 66, 360, X.vn, 118, 900, { anchor: "start", fill: ink }));
        L.push(T(design.tagline, 70, 430, F.sans, 24, 700, { anchor: "start", fill: ink }));
        L.push(T(design.social, 70, 530, F.sans, 19, 600, { anchor: "start", fill: ink, upper: true, spacing: 0.2 }));
      } else {
        L.push(<rect key={key()} x={50} y={50} width={950} height={500} rx={36} fill="#FFFFFF" fillOpacity={0.9} />);
        L.push(T(design.title, 95, 125, X.vn, 42, 480, { anchor: "start", fill: deep }));
        L.push(T(offer, 955, 122, F.sans, 17, 420, { anchor: "end", upper: true, spacing: 0.12, fill: deep }));
        L.push(...stamps({ x: 90, y: 160, w: 870, h: 300 }, 5, { shape: "circle", fill: mix(bg, "#FFFFFF", 0.86), stroke: mix(bg, "#FFFFFF", 0.6), strokeW: 2, specialFill: bg, specialText: "#FFFFFF" }));
        L.push(T(contact(), C, 510, F.sans, 18, 860, { fill: deep }));
      }
      break;
    }
    case "matcha-latte": {
      const latte = mix(accent, "#FFFFFF", 0.3), cream = "#F7F3E3";
      const cup = (x: number, y: number, r: number, surface: string) => [
        <circle key="s" cx={x} cy={y} r={r * 1.22} fill={mix(bg, "#FFFFFF", 0.55)} stroke={mix(bg, ink, 0.2)} strokeWidth={Math.max(1.5, r * 0.02)} />,
        <circle key="c" cx={x} cy={y} r={r} fill={cream} />,
        <circle key="l" cx={x} cy={y} r={r * 0.84} fill={surface} />,
      ];
      if (!back) {
        L.push(deco("Ly matcha latte", [
          ...cup(800, 300, 170, latte),
          <path key="h" d={HEART} transform="translate(735 225) scale(1.3)" fill={cream} />,
          <rect key="k" x={968} y={278} width={70} height={44} rx={22} fill="none" stroke={mix(bg, ink, 0.2)} strokeWidth={10} />,
        ]));
        L.push(T(design.salon, 320, 170, F.sans, 22, 520, { upper: true, spacing: 0.3 }));
        L.push(T(design.title, 320, 290, X.lora, 72, 540));
        L.push(T(design.tagline, 320, 365, F.script, 58, 500, { fill: accent }));
        L.push(T(design.social, 320, 500, F.sans, 18, 500, { opacity: 0.8 }));
      } else {
        L.push(T(design.title, C, 96, X.lora, 48, 800));
        L.push(T(offer, C, 142, F.sans, 19, 820, { upper: true, spacing: 0.18, fill: accent }));
        L.push(...grid({ x: 80, y: 160, w: 890, h: 340 }, 5, (c) => [
          ...cup(c.cx, c.cy, c.r * 0.8, c.special ? accent : latte),
          c.special ? reward(c, cream, 0, F.bold, 0.32) : <path key="h" d={HEART} transform={`translate(${c.cx - c.r * 0.28} ${c.cy - c.r * 0.33}) scale(${c.r * 0.0056})`} fill={cream} />,
        ]));
        L.push(T(contact(), C, 552, F.sans, 18, 900));
      }
      break;
    }
    case "strawberry-milk": {
      const drip = `M0 0 H${W} V70 ${Array.from({ length: 8 }, (_, i) => { const x = W - i * 75; return `Q${x - 18} 70 ${x - 25} ${110 + (i % 3) * 40} Q${x - 37} ${140 + (i % 3) * 40} ${x - 50} ${110 + (i % 3) * 40} Q${x - 56} 70 ${x - 75} 70`; }).join(" ")} H0Z`;
      const leaf = "#4E9A51", seed = "#FFE08A";
      if (!back) {
        L.push(deco("Sữa chảy", <path d={drip} fill="#FFFFFF" />));
        L.push(deco("Quả dâu", [<Strawberry key="a" x={C} y={430} s={2.6} fill={accent} seed={seed} leaf={leaf} />, <Strawberry key="b" x={120} y={260} s={0.7} fill={accent} seed={seed} leaf={leaf} />, <Strawberry key="c" x={500} y={600} s={0.6} fill={accent} seed={seed} leaf={leaf} />]));
        L.push(T(design.title, C, 760, X.pacifico, 70, 520));
        L.push(T(design.salon, C, 840, F.bold, 24, 480, { upper: true, spacing: 0.22, fill: accent }));
        L.push(T(design.tagline, C, 885, F.sans, 19, 460));
        L.push(T(design.social, C, 975, F.sans, 17, 460, { opacity: 0.8 }));
      } else {
        L.push(deco("Sữa chảy", <path d={drip} fill="#FFFFFF" />));
        L.push(T(design.title, C, 240, X.pacifico, 50, 500));
        L.push(T(offer, C, 290, F.sans, 17, 500, { upper: true, spacing: 0.15, fill: accent }));
        L.push(...grid({ x: 60, y: 320, w: 480, h: 540 }, 3, (c) => c.special
          ? [<Strawberry key="s" x={c.cx} y={c.cy - c.r * 0.1} s={c.r / 48} fill={accent} seed={seed} leaf={leaf} />, reward(c, "#FFFFFF", c.r * 0.05, F.bold, 0.3)]
          : [<circle key="c" cx={c.cx} cy={c.cy} r={c.r} fill="#FFFFFF" stroke={accent} strokeWidth={2.5} strokeDasharray="3 7" strokeLinecap="round" />, <g key="s" opacity={0.25}><Strawberry x={c.cx} y={c.cy - c.r * 0.05} s={c.r / 90} fill={accent} seed={seed} leaf={leaf} /></g>]));
        L.push(T(design.phone, C, 925, F.sans, 20, 460));
        L.push(T(contact([design.website, design.social]), C, 965, F.sans, 17, 480, { opacity: 0.8 }));
      }
      break;
    }
    case "tennis-club": {
      const ball = "#D7E86A";
      const tennis = (x: number, y: number, r: number, fill: string) => [
        <circle key="b" cx={x} cy={y} r={r} fill={fill} />,
        <path key="s" d={`M${x - r * 0.72} ${y - r * 0.7} Q${x - r * 0.1} ${y} ${x - r * 0.72} ${y + r * 0.7} M${x + r * 0.72} ${y - r * 0.7} Q${x + r * 0.1} ${y} ${x + r * 0.72} ${y + r * 0.7}`} fill="none" stroke="#FFFFFF" strokeWidth={Math.max(2, r * 0.07)} strokeLinecap="round" />,
      ];
      const racket = (rot: number) => <g key={rot} transform={`rotate(${rot} 330 300)`}><ellipse cx={330} cy={215} rx={62} ry={80} fill="none" stroke={accent} strokeWidth={8} /><path d="M330 295 V420" stroke={accent} strokeWidth={12} strokeLinecap="round" /><path d="M290 175 H370 M280 215 H380 M290 255 H370 M310 140 V290 M350 140 V290" stroke={accent} strokeOpacity={0.45} strokeWidth={2} /></g>;
      if (!back) {
        L.push(deco("Sọc preppy", Array.from({ length: 6 }, (_, i) => <rect key={i} x={i * 24} y={0} width={12} height={H} fill={ink} />)));
        L.push(deco("Huy hiệu vợt", [racket(-28), racket(28), <path key="sh" d="M330 180 L410 210 V290 Q410 360 330 395 Q250 360 250 290 V210Z" fill={ink} stroke={accent} strokeWidth={4} />]));
        L.push(T(initials, 330, 312, F.serif, 70, 130, { fill: bg }));
        L.push(T(design.salon, 750, 200, F.serif, 50, 500, { upper: true }));
        L.push(T(design.title, 750, 256, F.sans, 20, 460, { upper: true, spacing: 0.35 }));
        L.push(<path key={key()} d="M600 290 H900" stroke={accent} strokeWidth={2} />);
        L.push(T(design.tagline, 750, 360, F.script, 58, 460, { fill: accent }));
        L.push(T(design.social, 750, 480, F.sans, 18, 440, { upper: true, spacing: 0.2 }));
      } else {
        L.push(deco("Sọc preppy", Array.from({ length: 3 }, (_, i) => <rect key={i} x={0} y={i * 16} width={W} height={8} fill={ink} />)));
        L.push(T(design.title, C, 120, F.serif, 44, 800, { upper: true }));
        L.push(T(offer, C, 165, F.sans, 18, 800, { upper: true, spacing: 0.2, fill: accent }));
        L.push(...grid({ x: 90, y: 185, w: 870, h: 310 }, 5, (c) => [...tennis(c.cx, c.cy, c.r, c.special ? accent : ball), ...(c.special ? [reward(c, ink)] : [])]));
        L.push(T(contact(), C, 552, F.sans, 18, 900));
      }
      break;
    }
    case "retro-diner": {
      const checker = (y: number, rows: number) => deco("Sọc caro", Array.from({ length: rows * 27 }, (_, i) => ((i % 27) + Math.floor(i / 27)) % 2 ? null : <rect key={i} x={(i % 27) * 40} y={y + Math.floor(i / 27) * 40} width={40} height={40} fill={ink} />));
      const burst = (x: number, y: number, r: number) => `M${Array.from({ length: 32 }, (_, i) => polar(x, y, i % 2 ? r * 0.82 : r, (i / 32) * Math.PI * 2).join(" ")).join(" L")}Z`;
      if (!back) {
        L.push(checker(520, 2));
        L.push(<path key={key()} d={burst(860, 270, 150)} fill={accent} />);
        L.push(T(design.salon, 860, 262, F.bold, 26, 210, { fill: "#FFFFFF", upper: true, spacing: 0.08 }));
        L.push(T(design.tagline, 860, 300, F.sans, 17, 200, { fill: "#FFFFFF", upper: true, spacing: 0.1 }));
        L.push(T(design.title, 375, 265, X.lobster, 104, 620, { fill: accent }));
        L.push(T(design.title, 370, 258, X.lobster, 104, 620));
        L.push(T("Ghé thường xuyên · Quà liền tay", 370, 350, F.bold, 20, 560, { upper: true, spacing: 0.15, fill: accent }));
        L.push(T(design.social, 370, 450, F.sans, 18, 560));
      } else {
        L.push(checker(0, 1));
        L.push(T(design.title, C, 120, X.lobster, 60, 800));
        L.push(T(offer, C, 165, F.bold, 18, 820, { upper: true, spacing: 0.18, fill: accent }));
        L.push(...grid({ x: 80, y: 180, w: 890, h: 320 }, 5, (c) => c.special
          ? [<circle key="c" cx={c.cx} cy={c.cy} r={c.r} fill={accent} />, reward(c, "#FFFFFF")]
          : [<circle key="c" cx={c.cx} cy={c.cy} r={c.r} fill="#FFFFFF" stroke={ink} strokeWidth={3} strokeDasharray="7 6" />, T(String(c.i + 1), c.cx, c.cy + c.r * 0.22, X.lobster, c.r * 0.6, c.r, { fill: ink, opacity: 0.25 })]));
        L.push(T(contact(), C, 555, F.sans, 18, 900));
      }
      break;
    }
    case "bauhaus-blocks": {
      const colors = [accent, "#2E5EAA", "#F4C430", "#E84A8A", ink];
      const shape = (n: number, x: number, y: number, s: number, fill: string) => {
        const h = s / 2;
        switch (n % 5) {
          case 0: return <circle key="s" cx={x} cy={y} r={h} fill={fill} />;
          case 1: return <rect key="s" x={x - h} y={y - h} width={s} height={s} fill={fill} />;
          case 2: return <path key="s" d={`M${x - h} ${y + h * 0.5} A${h} ${h} 0 0 1 ${x + h} ${y + h * 0.5}Z`} fill={fill} />;
          case 3: return <path key="s" d={`M${x - h} ${y + h} V${y - h} A${s} ${s} 0 0 1 ${x + h} ${y + h}Z`} fill={fill} />;
          default: return <path key="s" d={`M${x} ${y - h} L${x + h} ${y + h} H${x - h}Z`} fill={fill} />;
        }
      };
      if (!back) {
        const cells: [number, number, number][] = [[0, 0, 0], [1, 0, 2], [2, 0, 1], [0, 1, 3], [1, 1, 4], [2, 1, 0]];
        L.push(deco("Khối Bauhaus", cells.map(([cx, cy, n], i) => (
          <g key={i}>
            <rect x={600 + cx * 150} y={60 + cy * 240} width={150} height={240} fill={i % 2 ? mix(bg, ink, 0.06) : bg} />
            {shape(n, 675 + cx * 150, 180 + cy * 240, 120, colors[(i + 1) % colors.length])}
          </g>
        ))));
        L.push(T(design.salon, 70, 130, F.bold, 20, 480, { anchor: "start", upper: true, spacing: 0.2 }));
        L.push(T(design.title, 66, 290, X.vn, 64, 500, { anchor: "start" }));
        L.push(<rect key={key()} x={70} y={330} width={120} height={12} fill={accent} />);
        L.push(T(design.tagline, 70, 400, F.sans, 21, 480, { anchor: "start" }));
        L.push(T(design.social, 70, 520, F.sans, 18, 480, { anchor: "start", upper: true, spacing: 0.15 }));
      } else {
        L.push(T(design.title, 70, 100, X.vn, 42, 500, { anchor: "start" }));
        L.push(T(offer, 980, 98, F.sans, 17, 440, { anchor: "end", upper: true, spacing: 0.12 }));
        L.push(<rect key={key()} x={70} y={122} width={910} height={6} fill={ink} />);
        L.push(...grid({ x: 70, y: 150, w: 910, h: 350 }, 5, (c) => c.special
          ? [<circle key="c" cx={c.cx} cy={c.cy} r={c.r} fill={accent} />, reward(c, "#FFFFFF")]
          : [<g key="g" opacity={0.9}>{shape(c.i, c.cx, c.cy, c.r * 1.7, colors[(c.i % 4) + 1])}</g>]));
        L.push(T(contact(), C, 555, F.sans, 18, 900));
      }
      break;
    }
    case "terrazzo": {
      const chipColors = [accent, "#81B29A", "#F2CC8F", "#3D405B", "#E5989B", "#B7B7A4"];
      const chips = (seed: number, area: Box, n: number) => {
        const r = rng(seed);
        return Array.from({ length: n }, (_, i) => {
          const x = area.x + r() * area.w, y = area.y + r() * area.h, s = 6 + r() * 20, sides = 5 + Math.floor(r() * 2), rot = r() * 6;
          const pts = Array.from({ length: sides }, (_, j) => polar(x, y, s * (0.6 + r() * 0.5), rot + (j / sides) * Math.PI * 2).join(" "));
          return <path key={i} d={`M${pts.join(" L")}Z`} fill={chipColors[i % chipColors.length]} fillOpacity={0.85} />;
        });
      };
      if (!back) {
        L.push(deco("Đá terrazzo", chips(3, { x: 0, y: 0, w: W, h: H }, 150)));
        L.push(<rect key={key()} x={225} y={140} width={600} height={320} rx={160} fill="#FFFFFF" />);
        L.push(T(design.salon, C, 245, F.serif2, 50, 480, { upper: true, spacing: 0.08 }));
        L.push(T(design.title, C, 305, F.sans, 20, 440, { upper: true, spacing: 0.35, fill: accent }));
        L.push(T(design.tagline, C, 375, F.script, 52, 440));
      } else {
        L.push(deco("Đá terrazzo", chips(21, { x: 0, y: 0, w: W, h: 70 }, 36)));
        L.push(deco("Đá terrazzo", chips(22, { x: 0, y: 530, w: W, h: 70 }, 36)));
        L.push(T(design.title, C, 138, F.serif2, 46, 800, { upper: true, spacing: 0.08 }));
        L.push(T(offer, C, 180, F.sans, 17, 800, { upper: true, spacing: 0.18, fill: accent }));
        L.push(...stamps({ x: 90, y: 195, w: 870, h: 270 }, 5, { shape: "circle", fill: "#FFFFFF", stroke: ink, strokeW: 2, specialFill: accent, specialText: "#FFFFFF" }));
        L.push(T(contact(), C, 500, F.sans, 17, 880));
      }
      break;
    }
    case "puffy-bubble": {
      const puffy = (text: string, x: number, y: number, size: number, max: number) => [
        <g key={key()} stroke={ink} strokeWidth={size * 0.2} strokeLinejoin="round" paintOrder="stroke" transform="translate(0 8)">{T(text, x, y, X.quick, size, max, { fill: ink })}</g>,
        <g key={key()} stroke="#FFFFFF" strokeWidth={size * 0.16} strokeLinejoin="round" paintOrder="stroke">{T(text, x, y, X.quick, size, max, { fill: accent })}</g>,
      ];
      const cloud = (x: number, y: number, s: number) => <g key={`${x}-${y}`}>{[[0, 0, 40], [38, 8, 32], [-38, 8, 30], [18, -22, 30], [-16, -18, 26]].map(([dx, dy, r], i) => <circle key={i} cx={x + dx * s} cy={y + dy * s} r={r * s} fill="#FFFFFF" />)}</g>;
      if (!back) {
        L.push(deco("Mây", [cloud(130, 110, 1.3), cloud(930, 490, 1.5), cloud(900, 110, 0.8), cloud(140, 500, 0.7)]));
        L.push(deco("Lấp lánh", [star(260, 470, 18), star(820, 200, 22), star(980, 300, 14), star(70, 300, 12)].map((d, i) => <path key={i} d={d} fill={accent} />)));
        L.push(T(design.salon, C, 190, F.bold, 24, 700, { upper: true, spacing: 0.25 }));
        L.push(...puffy(design.title, C, 345, 118, 840));
        L.push(T(design.tagline, C, 440, X.quick, 26, 700));
      } else {
        L.push(deco("Mây", [cloud(90, 70, 0.8), cloud(980, 540, 0.9)]));
        L.push(...puffy(design.title, C, 115, 64, 700));
        L.push(T(offer, C, 170, X.quick, 20, 800, { upper: true, spacing: 0.12 }));
        L.push(...grid({ x: 80, y: 190, w: 890, h: 310 }, 5, (c) => [
          <circle key="d" cx={c.cx} cy={c.cy + 6} r={c.r} fill={ink} fillOpacity={0.25} />,
          <circle key="c" cx={c.cx} cy={c.cy} r={c.r} fill={c.special ? accent : mix(bg, "#FFFFFF", 0.5)} stroke="#FFFFFF" strokeWidth={Math.max(4, c.r * 0.12)} />,
          c.special ? reward(c, "#FFFFFF", 0, X.quick) : <ellipse key="h" cx={c.cx - c.r * 0.35} cy={c.cy - c.r * 0.4} rx={c.r * 0.2} ry={c.r * 0.11} fill="#FFFFFF" fillOpacity={0.9} />,
        ]));
        L.push(T(contact(), C, 555, X.quick, 18, 900));
      }
      break;
    }
    case "zen-enso": {
      const hanko = (x: number, y: number, s: number, label: string) => [<rect key="r" x={x - s / 2} y={y - s / 2} width={s} height={s} rx={s * 0.08} fill={accent} />, T(label, x, y + s * 0.13, F.serif2, s * 0.4, s * 0.8, { fill: bg, upper: true })];
      if (!back) {
        L.push(deco("Nét cọ ensō", <Enso x={C} y={400} r={185} color={ink} w={26} />));
        L.push(deco("Con dấu đỏ", hanko(455, 575, 74, initials)));
        L.push(T(design.salon, C, 740, F.serif2, 40, 500, { upper: true, spacing: 0.2 }));
        L.push(T(design.title, C, 795, F.sans, 17, 460, { upper: true, spacing: 0.4 }));
        L.push(T(design.tagline, C, 870, F.script, 50, 460, { fill: accent }));
        L.push(T(design.social, C, 975, F.sans, 16, 460, { opacity: 0.7 }));
      } else {
        L.push(T(design.title, C, 125, F.serif2, 48, 480, { upper: true, spacing: 0.1 }));
        L.push(T(offer, C, 172, F.sans, 16, 480, { upper: true, spacing: 0.2, fill: accent }));
        L.push(...grid({ x: 70, y: 200, w: 460, h: 640 }, 3, (c) => c.special
          ? [<rect key="r" x={c.cx - c.r * 0.8} y={c.cy - c.r * 0.8} width={c.r * 1.6} height={c.r * 1.6} rx={c.r * 0.13} fill={accent} />, reward(c, bg, 0, F.bold, 0.32)]
          : [<Enso key="e" x={c.cx} y={c.cy} r={c.r * 0.85} color={ink} w={Math.max(4, c.r * 0.14)} />]));
        L.push(<path key={key()} d="M200 885 H400" stroke={ink} strokeOpacity={0.4} />);
        L.push(T(design.phone, C, 935, F.sans, 19, 460));
        L.push(T(contact([design.website, design.social]), C, 975, F.sans, 16, 480, { opacity: 0.75 }));
      }
      break;
    }
    case "disco-ball": {
      L.push(<defs key={key()}><radialGradient id={id("dsc")} cx=".38" cy=".32" r=".75"><stop offset="0" stopColor="#FFFFFF" /><stop offset=".5" stopColor={accent} /><stop offset="1" stopColor={mix(accent, "#000000", 0.45)} /></radialGradient></defs>);
      const ball = (x: number, y: number, r: number, seed: number) => {
        const rr = rng(seed), step = r / 7, tiles: ReactNode[] = [];
        for (let ty = y - r; ty < y + r; ty += step)
          for (let tx = x - r; tx < x + r; tx += step) {
            const v = rr(), shade = v < 0.07 ? "#FF9ED8" : v < 0.13 ? "#9ED8FF" : mix(accent, v < 0.5 ? "#FFFFFF" : "#2A2433", Math.abs(v - 0.5) * 1.2);
            tiles.push(<rect key={tiles.length} x={tx + 1.2} y={ty + 1.2} width={step - 2.4} height={step - 2.4} rx={1.5} fill={shade} />);
          }
        return [
          <defs key="d"><clipPath id={id("dball")}><circle cx={x} cy={y} r={r} /></clipPath><radialGradient id={id("dshine")} cx=".35" cy=".3" r=".8"><stop offset="0" stopColor="#FFFFFF" stopOpacity=".55" /><stop offset=".5" stopColor="#FFFFFF" stopOpacity="0" /><stop offset="1" stopColor="#000000" stopOpacity=".45" /></radialGradient></defs>,
          <circle key="o" cx={x} cy={y} r={r} fill={mix(accent, "#000000", 0.6)} />,
          <g key="t" clipPath={url("dball")}>{tiles}</g>,
          <circle key="s" cx={x} cy={y} r={r} fill={url("dshine")} />,
        ];
      };
      const sparkles = (seed: number, n: number) => { const r = rng(seed); return Array.from({ length: n }, (_, i) => <path key={i} d={star(r() * W, r() * H, 4 + r() * 12)} fill={i % 4 ? "#FFFFFF" : "#FF9ED8"} fillOpacity={0.4 + r() * 0.6} />); };
      if (!back) {
        L.push(deco("Lấp lánh", sparkles(5, 26)));
        L.push(deco("Quả cầu disco", [<path key="l" d="M790 0 V90" stroke={accent} strokeWidth={3} />, ...ball(790, 290, 195, 8)]));
        L.push(T(design.salon, 300, 170, F.sans, 21, 500, { upper: true, spacing: 0.3, fill: accent }));
        L.push(T(design.title, 300, 300, F.script, 104, 520));
        L.push(T(design.tagline, 300, 370, F.sans, 20, 500, { upper: true, spacing: 0.25 }));
        L.push(T(design.social, 300, 500, F.sans, 18, 480, { opacity: 0.8 }));
      } else {
        L.push(deco("Lấp lánh", sparkles(15, 16)));
        L.push(T(design.title, C, 100, F.script, 64, 800));
        L.push(T(offer, C, 148, F.sans, 18, 820, { upper: true, spacing: 0.2, fill: accent }));
        L.push(...grid({ x: 80, y: 170, w: 890, h: 330 }, 5, (c) => c.special
          ? [<circle key="c" cx={c.cx} cy={c.cy} r={c.r} fill="#FF9ED8" />, reward(c, bg)]
          : [<circle key="c" cx={c.cx} cy={c.cy} r={c.r} fill={url("dsc")} />, <path key="g" d={`M${c.cx - c.r} ${c.cy} H${c.cx + c.r} M${c.cx} ${c.cy - c.r} V${c.cy + c.r} M${c.cx - c.r * 0.85} ${c.cy - c.r * 0.5} H${c.cx + c.r * 0.85} M${c.cx - c.r * 0.85} ${c.cy + c.r * 0.5} H${c.cx + c.r * 0.85} M${c.cx - c.r * 0.5} ${c.cy - c.r * 0.85} V${c.cy + c.r * 0.85} M${c.cx + c.r * 0.5} ${c.cy - c.r * 0.85} V${c.cy + c.r * 0.85}`} stroke={bg} strokeOpacity={0.35} strokeWidth={1.5} />]));
        L.push(T(contact(), C, 555, F.sans, 18, 900));
      }
      break;
    }
    case "butterfly-y2k": {
      L.push(<defs key={key()}><linearGradient id={id("bf")} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFB3E0" /><stop offset="1" stopColor={accent} /></linearGradient></defs>);
      const flutter: [number, number, number, number][] = [[140, 150, 1.4, -18], [920, 130, 1.1, 20], [960, 460, 1.6, -12], [110, 470, 0.9, 16], [520, 70, 0.6, 8]];
      if (!back) {
        L.push(deco("Bướm", flutter.map(([x, y, s, r], i) => <Butterfly key={i} x={x} y={y} s={s} rot={r} wing={url("bf")} body={ink} />)));
        L.push(deco("Lấp lánh", [star(300, 470, 16), star(760, 110, 20), star(820, 520, 12), star(250, 90, 12)].map((d, i) => <path key={i} d={d} fill={ink} fillOpacity={0.7} />)));
        L.push(T(design.salon, C, 205, X.josefin, 26, 700, { upper: true, spacing: 0.3 }));
        L.push(T(design.title, C, 335, X.dancing, 112, 760));
        L.push(T(design.tagline, C, 405, X.josefin, 21, 640, { upper: true, spacing: 0.25, fill: mix(accent, ink, 0.4) }));
      } else {
        L.push(deco("Bướm", [<Butterfly key="a" x={970} y={80} s={0.8} rot={15} wing={url("bf")} body={ink} />, <Butterfly key="b" x={80} y={540} s={0.7} rot={-15} wing={url("bf")} body={ink} />]));
        L.push(T(design.title, C, 105, X.dancing, 66, 760));
        L.push(T(offer, C, 150, X.josefin, 18, 800, { upper: true, spacing: 0.2 }));
        L.push(...grid({ x: 80, y: 170, w: 890, h: 330 }, 5, (c) => c.special
          ? [<circle key="c" cx={c.cx} cy={c.cy} r={c.r} fill={url("bf")} />, reward(c, "#FFFFFF")]
          : [<circle key="c" cx={c.cx} cy={c.cy} r={c.r} fill="#FFFFFF" stroke={accent} strokeWidth={2.5} strokeDasharray="2 6" strokeLinecap="round" />, <g key="b" opacity={0.3}><Butterfly x={c.cx} y={c.cy + c.r * 0.05} s={c.r / 85} wing={accent} body={ink} /></g>]));
        L.push(T(contact(), C, 555, X.josefin, 17, 900));
      }
      break;
    }
    case "lace-doily": {
      const edge = (y: number, flip: boolean) => deco("Viền ren", Array.from({ length: 16 }, (_, i) => (
        <g key={i}>
          <circle cx={i * 40 + 20} cy={y} r={22} fill="#FFFFFF" />
          <circle cx={i * 40 + 20} cy={y + (flip ? -8 : 8)} r={4} fill={accent} fillOpacity={0.5} />
        </g>
      )));
      if (!back) {
        L.push(edge(0, false), edge(H, true));
        L.push(deco("Khăn ren", <Doily x={C} y={430} r={225} fill="#FFFFFF" line={accent} />));
        L.push(T(design.title, C, 425, F.script, 86, 360));
        L.push(T(design.salon, C, 490, F.serif2, 28, 340, { upper: true, spacing: 0.15 }));
        L.push(T(design.tagline, C, 790, F.sans, 18, 460, { upper: true, spacing: 0.3, fill: mix(accent, ink, 0.4) }));
        L.push(T(design.social, C, 890, F.sans, 18, 460));
      } else {
        L.push(edge(0, false), edge(H, true));
        L.push(T(design.title, C, 130, F.script, 70, 480));
        L.push(T(offer, C, 180, F.sans, 16, 480, { upper: true, spacing: 0.2, fill: mix(accent, ink, 0.4) }));
        L.push(...grid({ x: 60, y: 210, w: 480, h: 620 }, 3, (c) => [
          <Doily key="d" x={c.cx} y={c.cy} r={c.r * 0.9} fill={c.special ? accent : "#FFFFFF"} line={c.special ? "#FFFFFF" : accent} />,
          ...(c.special ? [reward(c, "#FFFFFF", 0, F.bold, 0.32)] : []),
        ]));
        L.push(T(design.phone, C, 900, F.sans, 19, 460));
        L.push(T(contact([design.website, design.social]), C, 940, F.sans, 16, 480, { opacity: 0.75 }));
      }
      break;
    }
    case "sticker-bomb": {
      const pal = [accent, "#FFC83D", "#4CC9F0", "#7BD389", "#9B5DE5"];
      const sticker = (d: string, fill: string, rot: number, cx: number, cy: number) => (
        <g transform={`rotate(${rot} ${cx} ${cy})`}>
          <path d={d} fill="#000000" fillOpacity={0.12} transform="translate(4 6)" />
          <path d={d} fill={fill} stroke="#FFFFFF" strokeWidth={10} strokeLinejoin="round" paintOrder="stroke" />
        </g>
      );
      const heart = (x: number, y: number, s: number) => `M${x} ${y + 38 * s} C${x - 28 * s} ${y + 18 * s} ${x - 40 * s} ${y} ${x - 32 * s} ${y - 16 * s} C${x - 25 * s} ${y - 30 * s} ${x - 6 * s} ${y - 30 * s} ${x} ${y - 16 * s} C${x + 6 * s} ${y - 30 * s} ${x + 25 * s} ${y - 30 * s} ${x + 32 * s} ${y - 16 * s} C${x + 40 * s} ${y} ${x + 28 * s} ${y + 18 * s} ${x} ${y + 38 * s}Z`;
      const bolt = (x: number, y: number, s: number) => `M${x + 8 * s} ${y - 40 * s} L${x - 20 * s} ${y + 6 * s} H${x} L${x - 8 * s} ${y + 40 * s} L${x + 22 * s} ${y - 8 * s} H${x + 2 * s}Z`;
      if (!back) {
        L.push(deco("Sticker", [
          <g key="a">{sticker(star(130, 130, 70), pal[1], -10, 130, 130)}</g>,
          <g key="b">{sticker(heart(930, 140, 2.1), pal[0], 12, 930, 140)}</g>,
          <g key="c">{sticker(bolt(960, 470, 1.8), pal[2], 8, 960, 470)}</g>,
          <g key="d">{sticker(`M60 470 a70 70 0 1 0 140 0 a70 70 0 1 0 -140 0`, pal[3], 0, 130, 470)}</g>,
          <g key="e">{sticker(star(780, 520, 40), pal[4], 15, 780, 520)}</g>,
        ]));
        L.push(T("NEW!", 130, 482, X.vn, 34, 110, { fill: "#FFFFFF" }));
        L.push(<g key={key()} transform="rotate(-4 525 300)"><rect x={215} y={210} width={620} height={170} rx={30} fill="#FFFFFF" stroke={ink} strokeWidth={5} /></g>);
        L.push(<g key={key()} transform="rotate(-4 525 300)">{T(design.title, 525, 325, X.vn, 76, 560)}</g>);
        L.push(<g key={key()} transform="rotate(3 525 440)"><rect x={345} y={410} width={360} height={58} rx={29} fill={ink} /></g>);
        L.push(<g key={key()} transform="rotate(3 525 440)">{T(design.salon, 525, 448, F.bold, 20, 320, { fill: "#FFFFFF", upper: true, spacing: 0.15 })}</g>);
        L.push(T(design.social, 525, 150, F.bold, 18, 500, { upper: true, spacing: 0.2 }));
      } else {
        L.push(T(design.title, C, 95, X.vn, 46, 800));
        L.push(T(offer, C, 140, F.bold, 17, 820, { upper: true, spacing: 0.15 }));
        L.push(...grid({ x: 80, y: 165, w: 890, h: 340 }, 5, (c) => [
          c.special
            ? <g key="s">{sticker(heart(c.cx, c.cy - c.r * 0.08, c.r / 36), accent, (c.i % 3 - 1) * 6, c.cx, c.cy)}</g>
            : <g key="s">{sticker(`M${c.cx - c.r * 0.82} ${c.cy} a${c.r * 0.82} ${c.r * 0.82} 0 1 0 ${c.r * 1.64} 0 a${c.r * 0.82} ${c.r * 0.82} 0 1 0 ${-c.r * 1.64} 0`, mix(pal[(c.i + 1) % pal.length], "#FFFFFF", 0.55), (c.i % 3 - 1) * 8, c.cx, c.cy)}</g>,
          ...(c.special ? [reward(c, "#FFFFFF", -c.r * 0.08, F.bold, 0.3)] : []),
        ]));
        L.push(T(contact(), C, 555, F.bold, 17, 900));
      }
      break;
    }
    case "sunset-stripes": {
      L.push(<defs key={key()}><linearGradient id={id("sun")} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFD35C" /><stop offset=".55" stopColor={accent} /><stop offset="1" stopColor="#E0457B" /></linearGradient></defs>);
      const sun = (x: number, y: number, r: number) => [
        <circle key="s" cx={x} cy={y} r={r} fill={url("sun")} />,
        ...[0.15, 0.35, 0.52, 0.67, 0.8].map((f, i) => <rect key={i} x={x - r - 2} y={y + r * f} width={r * 2 + 4} height={r * (0.03 + i * 0.022)} fill={bg} />),
      ];
      if (!back) {
        L.push(deco("Mặt trời retro", sun(800, 360, 230)));
        L.push(<rect key={key()} x={0} y={540} width={W} height={60} fill={ink} />);
        L.push(T(design.salon, 300, 150, F.bold, 22, 500, { upper: true, spacing: 0.3, fill: accent }));
        L.push(T(design.title, 300, 290, X.fraunces, 78, 520));
        L.push(T(design.tagline, 300, 360, F.sans, 21, 500));
        L.push(T(design.social, 300, 460, F.sans, 18, 480, { upper: true, spacing: 0.2 }));
        L.push(T(contact([design.phone, design.website]), C, 578, F.sans, 17, 900, { fill: bg, upper: true, spacing: 0.15 }));
      } else {
        L.push(<rect key={key()} x={0} y={0} width={W} height={24} fill={ink} />);
        L.push(T(design.title, C, 110, X.fraunces, 52, 800));
        L.push(T(offer, C, 158, F.sans, 18, 820, { upper: true, spacing: 0.18, fill: accent }));
        L.push(...grid({ x: 80, y: 178, w: 890, h: 320 }, 5, (c) => c.special
          ? [<circle key="c" cx={c.cx} cy={c.cy} r={c.r} fill={ink} />, reward(c, bg)]
          : sun(c.cx, c.cy, c.r)));
        L.push(T(contact(), C, 555, F.sans, 18, 900));
      }
      break;
    }
    case "polish-swatch": {
      const bottle = (x: number, y: number, s: number, color: string) => (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
          <rect x={-10} y={-70} width={20} height={42} rx={4} fill={ink} />
          <rect x={-28} y={-30} width={56} height={70} rx={14} fill={color} />
          <rect x={-18} y={-20} width={8} height={44} rx={4} fill="#FFFFFF" fillOpacity={0.45} />
        </g>
      );
      if (!back) {
        L.push(deco("Chai sơn", POLISH.slice(0, 7).map((c, i) => <g key={i}>{bottle(600 + i * 62, 440 - Math.sin((i / 6) * Math.PI) * 40, 1.25, c)}</g>)));
        L.push(deco("Quạt màu", POLISH.slice(0, 7).map((c, i) => <rect key={i} x={780} y={80} width={46} height={220} rx={22} fill={c} transform={`rotate(${-54 + i * 18} 803 290)`} />)));
        L.push(T(design.salon, 280, 150, F.bold, 22, 460, { upper: true, spacing: 0.25, fill: accent }));
        L.push(T(design.title, 280, 290, F.serif, 70, 480));
        L.push(T(design.tagline, 280, 355, F.sans, 20, 460, { opacity: 0.75 }));
        L.push(T(design.social, 280, 480, F.sans, 18, 440, { upper: true, spacing: 0.18 }));
      } else {
        L.push(T(design.title, C, 100, F.serif, 50, 800));
        L.push(T(offer, C, 146, F.sans, 18, 820, { upper: true, spacing: 0.18, fill: accent }));
        L.push(...grid({ x: 80, y: 165, w: 890, h: 330 }, 5, (c) => [
          <circle key="c" cx={c.cx} cy={c.cy} r={c.r} fill={c.special ? accent : POLISH[c.i % POLISH.length]} />,
          c.special ? reward(c, "#FFFFFF") : <ellipse key="h" cx={c.cx - c.r * 0.35} cy={c.cy - c.r * 0.38} rx={c.r * 0.22} ry={c.r * 0.12} fill="#FFFFFF" fillOpacity={0.6} transform={`rotate(-30 ${c.cx - c.r * 0.35} ${c.cy - c.r * 0.38})`} />,
        ]));
        L.push(T("Mỗi lần ghé, chọn một màu mới", C, 530, F.sans, 16, 800, { upper: true, spacing: 0.15, opacity: 0.6 }));
        L.push(T(contact(), C, 568, F.sans, 17, 900));
      }
      break;
    }
    case "beauty-passport": {
      const page = mix(bg, "#FFFFFF", 0.9), gold = ink, navy = bg;
      if (!back) {
        L.push(<rect key={key()} x={30} y={30} width={W - 60} height={H - 60} rx={18} fill="none" stroke={gold} strokeOpacity={0.35} strokeWidth={2} />);
        L.push(T("BEAUTY PASSPORT", C, 170, F.serif2, 40, 480, { spacing: 0.18 }));
        L.push(T(design.title, C, 225, F.sans, 18, 440, { upper: true, spacing: 0.4 }));
        L.push(deco("Quốc huy", [
          <circle key="o" cx={C} cy={470} r={140} fill="none" stroke={gold} strokeWidth={4} />,
          <ellipse key="m" cx={C} cy={470} rx={62} ry={140} fill="none" stroke={gold} strokeWidth={2} />,
          <path key="l" d={`M${C - 140} 470 H${C + 140} M${C - 122} 400 H${C + 122} M${C - 122} 540 H${C + 122}`} stroke={gold} strokeWidth={2} />,
          <circle key="c" cx={C} cy={470} r={62} fill={navy} stroke={gold} strokeWidth={2} />,
        ]));
        L.push(T(initials, C, 494, F.serif, 60, 110));
        L.push(T(design.salon, C, 700, F.serif2, 40, 480, { upper: true, spacing: 0.1 }));
        L.push(T(design.tagline, C, 750, F.sans, 17, 440, { upper: true, spacing: 0.3 }));
        L.push(<rect key={key()} x={210} y={850} width={180} height={110} rx={10} fill="none" stroke={gold} strokeWidth={3} />);
        L.push(T(design.memberNo, C, 1000, F.sans, 16, 440, { spacing: 0.25, opacity: 0.8 }));
      } else {
        L.push(<rect key={key()} width={W} height={H} fill={page} />);
        L.push(deco("Hoa văn bảo an", Array.from({ length: 14 }, (_, i) => <path key={i} d={`M0 ${80 + i * 70} C150 ${40 + i * 70} 450 ${120 + i * 70} 600 ${80 + i * 70}`} fill="none" stroke={navy} strokeOpacity={0.07} strokeWidth={1.5} />)));
        L.push(T("VISAS · THỊ THỰC", C, 90, F.sans, 17, 480, { spacing: 0.3, fill: navy }));
        L.push(T(design.title, C, 150, F.serif2, 46, 480, { upper: true, fill: navy }));
        L.push(T(offer, C, 195, F.sans, 15, 480, { upper: true, spacing: 0.15, fill: accent }));
        const inks = [accent, navy, "#2F7D5B"];
        L.push(...grid({ x: 60, y: 220, w: 480, h: 640 }, 3, (c) => {
          const col = c.special ? accent : inks[c.i % 3], rot = ((c.i * 37) % 21) - 10;
          const frame = c.i % 3 === 0 ? <g key="f"><circle cx={c.cx} cy={c.cy} r={c.r} fill={c.special ? col : "none"} stroke={col} strokeWidth={3} /><circle cx={c.cx} cy={c.cy} r={c.r * 0.8} fill="none" stroke={c.special ? page : col} strokeWidth={1.5} strokeDasharray="3 4" /></g>
            : c.i % 3 === 1 ? <g key="f"><rect x={c.cx - c.r} y={c.cy - c.r * 0.72} width={c.r * 2} height={c.r * 1.44} rx={c.r * 0.18} fill={c.special ? col : "none"} stroke={col} strokeWidth={3} /><rect x={c.cx - c.r * 0.84} y={c.cy - c.r * 0.56} width={c.r * 1.68} height={c.r * 1.12} rx={c.r * 0.1} fill="none" stroke={c.special ? page : col} strokeWidth={1.5} /></g>
            : <g key="f"><ellipse cx={c.cx} cy={c.cy} rx={c.r} ry={c.r * 0.74} fill={c.special ? col : "none"} stroke={col} strokeWidth={3} /><ellipse cx={c.cx} cy={c.cy} rx={c.r * 0.82} ry={c.r * 0.58} fill="none" stroke={c.special ? page : col} strokeWidth={1.5} strokeDasharray="6 3" /></g>;
          return [<g key="v" transform={`rotate(${rot} ${c.cx} ${c.cy})`} opacity={c.special ? 1 : 0.55}>{frame}</g>, c.special ? reward(c, page, 0, F.bold, 0.3) : T(`N°${c.i + 1}`, c.cx, c.cy + c.r * 0.12, F.serif2, c.r * 0.38, c.r, { fill: col, opacity: 0.55 })];
        }));
        L.push(T(design.phone, C, 925, F.sans, 19, 460, { fill: navy }));
        L.push(T(contact([design.website, design.social]), C, 965, F.sans, 16, 480, { fill: navy, opacity: 0.8 }));
      }
      break;
    }
  }
  return L;
}
