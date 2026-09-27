import { useId, type ReactNode, type Ref } from "react";
import { FLYER_TEMPLATES, type FlyerDesign } from "@/lib/flyer-templates";

const SANS = "Be Vietnam Pro";
const SERIF = "Playfair Display";
const DISPLAY = "Oswald";
const SCRIPT = "Dancing Script";

function Text({ children, x, y, size, color, font = SANS, weight = 500, anchor = "start", max, spacing, rotate }: {
  children: ReactNode; x: number; y: number; size: number; color: string; font?: string; weight?: number;
  anchor?: "start" | "middle" | "end"; max?: number; spacing?: number; rotate?: number;
}) {
  const value = typeof children === "string" || typeof children === "number" ? String(children) : "";
  const fitted = max && value.length * size * (font === DISPLAY ? .5 : .56) > max ? max : undefined;
  return <text x={x} y={y} fill={color} fontFamily={font} fontWeight={weight} fontSize={size} textAnchor={anchor} letterSpacing={spacing} textLength={fitted} lengthAdjust="spacingAndGlyphs" transform={rotate ? `rotate(${rotate} ${x} ${y})` : undefined}>{children}</text>;
}

function PhotoRect({ src, x, y, width, height, radius = 0, stroke, strokeWidth = 0, rotate = 0 }: {
  src: string; x: number; y: number; width: number; height: number; radius?: number; stroke?: string; strokeWidth?: number; rotate?: number;
}) {
  const id = useId().replace(/:/g, "");
  const cx = x + width / 2;
  const cy = y + height / 2;
  return <g transform={rotate ? `rotate(${rotate} ${cx} ${cy})` : undefined}>
    <defs><clipPath id={id}><rect x={x} y={y} width={width} height={height} rx={radius} /></clipPath></defs>
    <image href={src} x={x} y={y} width={width} height={height} preserveAspectRatio="xMidYMid slice" clipPath={`url(#${id})`} />
    {stroke && <rect x={x} y={y} width={width} height={height} rx={radius} fill="none" stroke={stroke} strokeWidth={strokeWidth || 3} />}
  </g>;
}

function PhotoCircle({ src, x, y, radius, stroke, strokeWidth = 5 }: { src: string; x: number; y: number; radius: number; stroke?: string; strokeWidth?: number }) {
  const id = useId().replace(/:/g, "");
  return <g>
    <defs><clipPath id={id}><circle cx={x} cy={y} r={radius} /></clipPath></defs>
    <image href={src} x={x - radius} y={y - radius} width={radius * 2} height={radius * 2} preserveAspectRatio="xMidYMid slice" clipPath={`url(#${id})`} />
    {stroke && <circle cx={x} cy={y} r={radius} fill="none" stroke={stroke} strokeWidth={strokeWidth} />}
  </g>;
}

function PhotoArch({ src, x, y, width, height, stroke }: { src: string; x: number; y: number; width: number; height: number; stroke: string }) {
  const id = useId().replace(/:/g, "");
  const d = `M${x} ${y + height}V${y + width / 2}a${width / 2} ${width / 2} 0 0 1 ${width} 0V${y + height}Z`;
  return <g>
    <defs><clipPath id={id}><path d={d} /></clipPath></defs>
    <image href={src} x={x} y={y} width={width} height={height} preserveAspectRatio="xMidYMid slice" clipPath={`url(#${id})`} />
    <path d={d} fill="none" stroke={stroke} strokeWidth="6" />
  </g>;
}

function PhotoOval({ src, x, y, rx, ry, stroke }: { src: string; x: number; y: number; rx: number; ry: number; stroke: string }) {
  const id = useId().replace(/:/g, "");
  return <g>
    <defs><clipPath id={id}><ellipse cx={x} cy={y} rx={rx} ry={ry} /></clipPath></defs>
    <image href={src} x={x - rx} y={y - ry} width={rx * 2} height={ry * 2} preserveAspectRatio="xMidYMid slice" clipPath={`url(#${id})`} />
    <ellipse cx={x} cy={y} rx={rx} ry={ry} fill="none" stroke={stroke} strokeWidth="6" />
  </g>;
}

function Discount({ d, x, y, size, color, font = DISPLAY, anchor = "middle" }: { d: FlyerDesign; x: number; y: number; size: number; color: string; font?: string; anchor?: "start" | "middle" | "end" }) {
  const number = d.discount.replace(/\D/g, "").slice(0, 3) || "30";
  return <>
    <Text x={x} y={y} size={size} color={color} font={font} weight={700} anchor={anchor} max={size * 2.35}>{number}</Text>
    <Text x={x + (anchor === "middle" ? size * .69 : size * 1.15)} y={y - size * .43} size={size * .29} color={color} weight={700}>%</Text>
  </>;
}

function Contact({ d, x = 300, y = 757, color, anchor = "middle", max = 510 }: { d: FlyerDesign; x?: number; y?: number; color: string; anchor?: "start" | "middle" | "end"; max?: number }) {
  return <g>
    <Text x={x} y={y} size={15} color={color} anchor={anchor} max={max}>{d.dates}</Text>
    <Text x={x} y={y + 26} size={14} color={color} anchor={anchor} max={max}>{d.address}</Text>
    <Text x={x} y={y + 51} size={16} color={color} anchor={anchor} weight={700} max={max}>{d.phone}</Text>
  </g>;
}

function Heading({ d, x, y, color, size = 29, anchor = "middle", font = SANS, max = 500 }: { d: FlyerDesign; x: number; y: number; color: string; size?: number; anchor?: "start" | "middle" | "end"; font?: string; max?: number }) {
  return <Text x={x} y={y} size={size} color={color} anchor={anchor} font={font} weight={700} max={max} spacing={1}>{d.headline}</Text>;
}

function Brand({ d, x, y, color, size = 27, anchor = "middle", font = SERIF }: { d: FlyerDesign; x: number; y: number; color: string; size?: number; anchor?: "start" | "middle" | "end"; font?: string }) {
  return <Text x={x} y={y} size={size} color={color} anchor={anchor} font={font} max={500}>{d.salon}</Text>;
}

export function FlyerFrontSvg({ design: d, svgRef, className }: { design: FlyerDesign; svgRef?: Ref<SVGSVGElement>; className?: string }) {
  const t = FLYER_TEMPLATES.find((item) => item.id === d.templateId) ?? FLYER_TEMPLATES[0];
  const { bg, ink, accent, photo } = t;
  let art: ReactNode;

  switch (t.id) {
    case "blush-editorial":
      art = <>
        <rect x="24" y="25" width="552" height="798" fill="none" stroke={ink} strokeWidth="1.5" />
        <PhotoRect src={photo} x={284} y={95} width={265} height={526} radius={120} stroke={accent} strokeWidth={3} />
        <Brand d={d} x={55} y={86} color={ink} anchor="start" size={25} />
        <Heading d={d} x={54} y={215} color={ink} size={27} anchor="start" max={235} font={SERIF} />
        <Text x={55} y={258} size={15} color={accent} spacing={2}>ƯU ĐÃI ĐẶC BIỆT</Text>
        <Discount d={d} x={52} y={455} size={153} color={ink} anchor="start" font={SERIF} />
        <Text x={55} y={513} size={16} color={ink} max={210}>{d.service}</Text>
        <rect x="24" y="655" width="552" height="168" fill={accent} />
        <Text x={300} y={703} size={19} color="#fff" anchor="middle" font={SCRIPT}>Một ngày làm đẹp dành cho bạn</Text>
        <Contact d={d} y={739} color="#fff" />
      </>;
      break;
    case "midnight-gala":
      art = <>
        <rect x="27" y="27" width="546" height="794" fill="none" stroke={accent} strokeWidth="2" />
        <PhotoOval src={photo} x={300} y={303} rx={205} ry={250} stroke={accent} />
        <rect x="46" y="567" width="508" height="233" fill={bg} />
        <Brand d={d} x={300} y={81} color={accent} size={26} />
        <Heading d={d} x={300} y={615} color={ink} size={30} font={SERIF} />
        <Discount d={d} x={278} y={726} size={93} color={accent} font={SERIF} />
        <Text x={300} y={758} size={12} color={ink} anchor="middle" max={460}>{d.service}</Text>
        <Text x={300} y={787} size={12} color={ink} anchor="middle" max={490}>{d.address} · {d.phone}</Text>
      </>;
      break;
    case "coral-pop":
      art = <>
        <PhotoRect src={photo} x={0} y={0} width={600} height={510} />
        <path d="M0 456C166 400 396 553 600 444V848.71H0Z" fill={accent} />
        <Brand d={d} x={49} y={68} color="#fff" anchor="start" font={SANS} size={27} />
        <circle cx="454" cy="519" r="127" fill="#fff8ed" stroke={bg} strokeWidth="9" />
        <Discount d={d} x={439} y={568} size={117} color={accent} />
        <Heading d={d} x={48} y={601} color="#fff" anchor="start" size={31} max={325} />
        <Text x={49} y={652} size={17} color="#ffe7c5" max={300}>{d.service}</Text>
        <Contact d={d} x={48} y={734} color="#fff" anchor="start" max={480} />
      </>;
      break;
    case "sage-garden":
      art = <>
        <path d="M56 99H544V794H56Z" fill="#f7faf4" stroke={ink} strokeWidth="2" />
        <PhotoCircle src={photo} x={300} y={363} radius={185} stroke={accent} strokeWidth={8} />
        <path d="M63 520c65-80 77-183 14-240M535 100c-72 69-58 142-9 210" fill="none" stroke={accent} strokeWidth="8" opacity=".5" />
        <Brand d={d} x={300} y={83} color={ink} size={30} />
        <Heading d={d} x={300} y={616} color={ink} size={28} font={SERIF} />
        <Discount d={d} x={277} y={716} size={85} color={ink} font={SERIF} />
        <Text x={300} y={745} size={14} color={ink} anchor="middle" max={480}>{d.service}</Text>
        <Text x={300} y={776} size={12} color={ink} anchor="middle" max={480}>{d.dates} · {d.phone}</Text>
      </>;
      break;
    case "lilac-ribbon":
      art = <>
        <path d="M0 100C171-4 427 181 600 61V168C410 285 196 102 0 216Z" fill={accent} />
        <PhotoRect src={photo} x={117} y={170} width={372} height={432} radius={24} stroke="#fff" strokeWidth={13} rotate={-5} />
        <path d="M53 523C180 452 395 624 574 527V642C402 728 162 553 53 636Z" fill="#cbb9e4" opacity=".8" />
        <Brand d={d} x={300} y={83} color={ink} font={SCRIPT} size={31} />
        <Heading d={d} x={300} y={669} color={ink} size={28} font={SERIF} />
        <Discount d={d} x={284} y={763} size={83} color={accent} font={SERIF} />
        <Text x={300} y={807} size={12} color={ink} anchor="middle" max={520}>{d.dates} · {d.phone}</Text>
      </>;
      break;
    case "cobalt-block":
      art = <>
        <rect width="309" height="848.71" fill={ink} />
        <PhotoRect src={photo} x={309} y={0} width={291} height={640} />
        <rect x={309} y={640} width={291} height={208.71} fill="#f5f4ef" />
        <Brand d={d} x={33} y={69} color="#fff" anchor="start" font={SANS} size={25} />
        <Heading d={d} x={31} y={185} color="#fff" anchor="start" size={31} max={250} />
        <rect x={30} y={274} width="252" height="247" fill={accent} />
        <Discount d={d} x={139} y={444} size={153} color={ink} />
        <Text x={31} y={591} size={18} color="#fff" max={255}>{d.service}</Text>
        <Text x={31} y={739} size={13} color="#fff" max={260}>{d.dates}</Text>
        <Text x={31} y={772} size={13} color="#fff" max={260}>{d.address}</Text>
        <Text x={326} y={760} size={19} color={ink} weight={700} max={250}>{d.phone}</Text>
      </>;
      break;
    case "terracotta-arch":
      art = <>
        <PhotoArch src={photo} x={115} y={100} width={370} height={470} stroke={accent} />
        <path d="M87 570V283a213 213 0 0 1 426 0v287" fill="none" stroke={ink} strokeWidth="2" />
        <Brand d={d} x={300} y={77} color={ink} size={29} />
        <Heading d={d} x={300} y={631} color={ink} size={29} font={SERIF} />
        <Discount d={d} x={283} y={742} size={107} color={accent} font={SERIF} />
        <Text x={300} y={775} size={13} color={ink} anchor="middle" max={510}>{d.service} · {d.dates}</Text>
        <Text x={300} y={807} size={14} color={ink} anchor="middle" max={500}>{d.phone}</Text>
      </>;
      break;
    case "lemon-sunburst":
      art = <>
        <g stroke={accent} strokeWidth="11">{Array.from({ length: 22 }, (_, i) => { const a = i * Math.PI / 11; return <line key={i} x1={300 + Math.cos(a) * 188} y1={300 + Math.sin(a) * 188} x2={300 + Math.cos(a) * 410} y2={300 + Math.sin(a) * 410} />; })}</g>
        <PhotoCircle src={photo} x={300} y={306} radius={188} stroke={ink} strokeWidth={5} />
        <Brand d={d} x={300} y={82} color={ink} size={28} />
        <rect x={62} y={518} width={476} height={158} rx={22} fill="#fff9dc" stroke={ink} strokeWidth={2} />
        <Heading d={d} x={300} y={564} color={ink} size={29} />
        <Discount d={d} x={283} y={656} size={96} color={ink} />
        <rect x={0} y={706} width={600} height={142.71} fill={ink} />
        <Text x={300} y={738} size={13} color={bg} anchor="middle" max={510}>{d.service}</Text>
        <Text x={300} y={769} size={13} color={bg} anchor="middle" max={510}>{d.dates} · {d.phone}</Text>
        <Text x={300} y={799} size={12} color={bg} anchor="middle" max={510}>{d.address}</Text>
      </>;
      break;
    case "cherry-magazine":
      art = <>
        <PhotoRect src={photo} x={0} y={96} width={600} height={542} />
        <rect y={0} width={600} height={96} fill={bg} />
        <rect y={638} width={600} height={210.71} fill={bg} />
        <Brand d={d} x={42} y={63} color={ink} anchor="start" size={38} />
        <Text x={548} y={65} size={12} color={ink} anchor="end" spacing={2}>OPENING ISSUE</Text>
        <rect x={45} y={248} width={260} height={115} fill={bg} opacity=".9" />
        <Heading d={d} x={59} y={312} color={ink} anchor="start" size={28} max={232} font={SERIF} />
        <Discount d={d} x={75} y={575} size={147} color="#fff" anchor="start" />
        <Text x={43} y={680} size={17} color={ink} max={500}>{d.service}</Text>
        <Contact d={d} x={43} y={725} color={ink} anchor="start" max={500} />
      </>;
      break;
    case "mint-checker":
      art = <>
        {Array.from({ length: 6 }, (_, row) => Array.from({ length: 5 }, (_, col) => (row + col) % 2 === 0 ? <rect key={`${row}-${col}`} x={col * 120} y={row * 120} width={120} height={120} fill={accent} opacity=".55" /> : null))}
        <rect x={43} y={55} width={514} height={748} rx={21} fill="#fffdf8" />
        <Brand d={d} x={300} y={100} color={ink} size={27} font={SANS} />
        <PhotoRect src={photo} x={70} y={151} width={292} height={372} radius={24} stroke={ink} strokeWidth={3} rotate={-5} />
        <PhotoRect src="/flyer/photos/pexels-12653044.jpg" x={339} y={284} width={191} height={249} radius={18} stroke="#fff" strokeWidth={8} rotate={7} />
        <Heading d={d} x={300} y={609} color={ink} size={29} />
        <Discount d={d} x={281} y={712} size={106} color={ink} />
        <Text x={300} y={751} size={12} color={ink} anchor="middle" max={480}>{d.dates} · {d.phone}</Text>
      </>;
      break;
    case "pearl-minimal":
      // Bố cục ảnh ghép cẩm thạch, khung tròn viền vàng và bảng giá theo ảnh tham chiếu thứ tư.
      art = <>
        <defs><linearGradient id="marble-gold" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#fffdf8" /><stop offset=".52" stopColor="#eee9de" /><stop offset="1" stopColor="#ffffff" /></linearGradient></defs>
        <rect width="600" height="848.71" fill="url(#marble-gold)" />
        <path d="M0 268c95-43 137-3 206-43s128-48 236-34 120-41 158-62M0 582c75-22 137-20 184-46s102-19 168 15 175 8 248-27" fill="none" stroke="#c4b5a2" strokeWidth="2" opacity=".55" />
        <PhotoRect src="/flyer/photos/pexels-5871817.jpg" x={0} y={0} width={376} height={311} radius={110} />
        <PhotoCircle src={photo} x={422} y={105} radius={98} stroke="#cda65c" strokeWidth={8} />
        <PhotoCircle src="/flyer/photos/pexels-12653044.jpg" x={318} y={293} radius={87} stroke="#cda65c" strokeWidth={8} />
        <PhotoCircle src="/flyer/photos/user-gold-glam.jpg" x={112} y={335} radius={76} stroke="#cda65c" strokeWidth={8} />
        <circle cx={526} cy={54} r={54} fill="#8c1829" stroke="#dfbb71" strokeWidth="7" />
        <Text x={523} y={66} size={31} color="#f4d694" font={SERIF} anchor="middle">-{d.discount}%</Text>
        <Brand d={d} x={390} y={433} color="#b58b45" size={33} font={SERIF} />
        <Heading d={d} x={300} y={486} color="#8d6a38" size={23} font={SERIF} />
        <rect x={28} y={517} width={350} height={190} rx={27} fill="#fffdf8" stroke="#cda65c" strokeWidth={4} />
        <rect x={42} y={531} width={322} height={27} rx={13} fill="#cda65c" />
        <Text x={203} y={551} size={15} color="#fff" anchor="middle">DỊCH VỤ TAY</Text>
        <Text x={52} y={588} size={15} color="#5c4930">Sơn gel & chăm móng</Text><Text x={347} y={588} size={15} color="#8c1829" anchor="end">-30%</Text>
        <Text x={52} y={624} size={15} color="#5c4930">Nail art theo yêu cầu</Text><Text x={347} y={624} size={15} color="#8c1829" anchor="end">-30%</Text>
        <Text x={52} y={660} size={15} color="#5c4930">Đắp bột / úp móng</Text><Text x={347} y={660} size={15} color="#8c1829" anchor="end">-30%</Text>
        <rect x={390} y={517} width={180} height={190} rx={24} fill="#fffdf8" stroke="#cda65c" strokeWidth={4} />
        <Text x={480} y={553} size={15} color="#8d6a38" anchor="middle">CHÂN & SPA</Text>
        <Text x={480} y={590} size={14} color="#5c4930" anchor="middle">Pedicure</Text>
        <Text x={480} y={626} size={14} color="#5c4930" anchor="middle">Chăm sóc da</Text>
        <Text x={480} y={665} size={21} color="#8c1829" anchor="middle" font={SERIF}>Ưu đãi {d.discount}%</Text>
        <Text x={300} y={747} size={14} color="#5c4930" anchor="middle" max={515}>{d.dates}</Text>
        <Text x={300} y={779} size={14} color="#5c4930" anchor="middle" max={515}>{d.address}</Text>
        <Text x={300} y={812} size={19} color="#8d6a38" anchor="middle" weight={700}>{d.phone}</Text>
      </>;
      break;
    case "pink-candy":
      art = <>
        {Array.from({ length: 12 }, (_, i) => <rect key={i} x={i * 50} width={26} height={848.71} fill={accent} opacity=".55" />)}
        <rect x={42} y={44} width={516} height={760} rx={25} fill={bg} stroke={ink} strokeWidth={3} />
        <Brand d={d} x={300} y={91} color={ink} size={30} font={SCRIPT} />
        <PhotoRect src={photo} x={100} y={139} width={402} height={438} radius={19} stroke="#fff" strokeWidth={12} rotate={-3} />
        <circle cx={454} cy={557} r={97} fill={ink} />
        <Discount d={d} x={437} y={594} size={90} color="#fff" />
        <Heading d={d} x={300} y={689} color={ink} size={28} font={DISPLAY} />
        <Text x={300} y={729} size={14} color={ink} anchor="middle" max={485}>{d.service}</Text>
        <Text x={300} y={770} size={13} color={ink} anchor="middle" max={495}>{d.dates} · {d.phone}</Text>
      </>;
      break;
    case "aqua-wave":
      art = <>
        <PhotoRect src={photo} x={0} y={0} width={600} height={548} />
        <path d="M0 489C150 421 297 604 600 468V848.71H0Z" fill={accent} />
        <path d="M0 530C178 485 331 648 600 516V848.71H0Z" fill={ink} />
        <Brand d={d} x={300} y={75} color="#fff" size={31} />
        <Heading d={d} x={300} y={618} color="#fff" size={29} />
        <Discount d={d} x={283} y={739} size={109} color="#fff" />
        <Text x={300} y={774} size={13} color="#fff" anchor="middle" max={515}>{d.service} · {d.dates}</Text>
        <Text x={300} y={811} size={14} color="#fff" anchor="middle" max={515}>{d.phone}</Text>
      </>;
      break;
    case "violet-neon":
      art = <>
        <rect x={28} y={28} width={544} height={792} rx={25} fill="none" stroke={accent} strokeWidth={4} />
        <PhotoRect src={photo} x={83} y={133} width={434} height={438} radius={34} stroke="#75e3e6" strokeWidth={6} />
        <Brand d={d} x={300} y={89} color="#fff" size={30} font={SCRIPT} />
        <rect x={117} y={503} width={366} height={126} rx={21} fill={bg} stroke={accent} strokeWidth={3} />
        <Discount d={d} x={281} y={606} size={109} color={accent} />
        <Heading d={d} x={300} y={691} color="#fff" size={28} />
        <Text x={300} y={735} size={14} color="#75e3e6" anchor="middle" max={500}>{d.service}</Text>
        <Text x={300} y={781} size={13} color="#fff" anchor="middle" max={500}>{d.dates} · {d.phone}</Text>
      </>;
      break;
    case "kraft-collage":
      art = <>
        <polygon points="44,49 557,42 570,786 34,802" fill="#f5ead3" />
        <PhotoRect src={photo} x={113} y={140} width={383} height={441} stroke="#fffaf0" strokeWidth={18} rotate={5} />
        <path d="M188 130l190-15 7 44-190 15Z" fill={accent} opacity=".65" />
        <Brand d={d} x={64} y={95} color={ink} anchor="start" size={27} />
        <rect x={40} y={559} width={520} height={228} fill={accent} transform="rotate(-2 300 670)" />
        <Heading d={d} x={66} y={625} color="#fff" anchor="start" size={29} max={465} font={SERIF} />
        <Discount d={d} x={70} y={737} size={107} color="#fff" anchor="start" />
        <Text x={283} y={701} size={14} color="#fff" max={244}>{d.service}</Text>
        <Text x={283} y={738} size={12} color="#fff" max={244}>{d.dates}</Text>
        <Text x={282} y={771} size={13} color="#fff" max={245}>{d.phone}</Text>
      </>;
      break;
    case "teal-ticket":
      art = <>
        <rect x={25} y={28} width={550} height={790} rx={17} fill="#fff9eb" />
        {Array.from({ length: 11 }, (_, i) => <circle key={i} cx={51 + i * 50} cy={28} r={9} fill={bg} />)}
        <Brand d={d} x={300} y={83} color={bg} size={29} />
        <PhotoRect src={photo} x={71} y={125} width={458} height={419} radius={12} stroke={bg} strokeWidth={3} />
        <path d="M48 570H552" stroke={bg} strokeWidth={3} strokeDasharray="8 7" />
        <Heading d={d} x={300} y={620} color={bg} size={28} font={SERIF} />
        <Discount d={d} x={284} y={738} size={109} color={bg} />
        <Text x={300} y={766} size={13} color={bg} anchor="middle" max={500}>{d.service} · {d.dates}</Text>
        <Text x={300} y={795} size={13} color={bg} anchor="middle" max={500}>{d.phone}</Text>
      </>;
      break;
    case "chrome-glow":
      art = <>
        <defs><linearGradient id="chrome-front" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff" /><stop offset=".45" stopColor="#b7b4c2" /><stop offset=".7" stopColor="#fff" /><stop offset="1" stopColor="#89839e" /></linearGradient></defs>
        <rect x={30} y={30} width={540} height={788} fill="none" stroke={ink} />
        <PhotoRect src={photo} x={102} y={141} width={397} height={456} radius={175} stroke={accent} strokeWidth={5} />
        <circle cx={115} cy={602} r={61} fill="url(#chrome-front)" />
        <Brand d={d} x={53} y={88} color={ink} anchor="start" size={27} font={SANS} />
        <Heading d={d} x={300} y={649} color={ink} size={29} />
        <Discount d={d} x={284} y={762} size={100} color={ink} />
        <Text x={300} y={804} size={12} color={ink} anchor="middle" max={500}>{d.dates} · {d.phone}</Text>
      </>;
      break;
    case "rose-garden":
      art = <>
        <rect x={30} y={30} width={540} height={788} fill="none" stroke={ink} strokeWidth={2} />
        <PhotoOval src={photo} x={300} y={333} rx={195} ry={247} stroke={accent} />
        <circle cx={91} cy={106} r={36} fill="#e9a7ad" /><circle cx={510} cy={137} r={29} fill="#d78f9d" />
        <circle cx={72} cy={616} r={31} fill="#d78f9d" /><circle cx={521} cy={578} r={34} fill="#e9a7ad" />
        <Brand d={d} x={300} y={69} color={ink} size={29} font={SCRIPT} />
        <Heading d={d} x={300} y={637} color={ink} size={29} font={SERIF} />
        <Discount d={d} x={283} y={750} size={99} color={ink} font={SERIF} />
        <Text x={300} y={779} size={13} color={ink} anchor="middle" max={510}>{d.dates} · {d.phone}</Text>
      </>;
      break;
    case "mono-type":
      art = <>
        <PhotoRect src={photo} x={231} y={0} width={369} height={612} />
        <rect x={0} y={0} width={231} height={612} fill={ink} />
        <Brand d={d} x={26} y={53} color="#fff" anchor="start" size={21} font={SANS} />
        <Text x={28} y={365} size={280} color="#fff" font={DISPLAY} weight={700} max={200}>{d.discount}</Text>
        <Text x={31} y={450} size={83} color="#fff" font={DISPLAY}>%</Text>
        <Text x={28} y={561} size={17} color="#fff" max={178}>{d.service}</Text>
        <rect y={612} width={600} height={236.71} fill={bg} />
        <Heading d={d} x={38} y={690} color={ink} anchor="start" size={35} font={DISPLAY} />
        <Text x={38} y={739} size={15} color={ink} max={515}>{d.dates}</Text>
        <Text x={38} y={777} size={14} color={ink} max={515}>{d.address}</Text>
        <Text x={38} y={811} size={17} color={ink} weight={700}>{d.phone}</Text>
      </>;
      break;
    case "confetti-party":
    default:
      art = <>
        {Array.from({ length: 26 }, (_, i) => { const x = (i * 149 + 34) % 575; const y = (i * 223 + 48) % 573; const colors = ["#ed674e", "#35a5a1", "#efb837", "#9a6aba"]; return <rect key={i} x={x} y={y} width={8 + i % 4} height={18} rx={2} fill={colors[i % 4]} transform={`rotate(${i * 47} ${x} ${y})`} />; })}
        <rect x={30} y={30} width={540} height={79} rx={39} fill={ink} />
        <Brand d={d} x={300} y={81} color="#fff" size={26} font={SANS} />
        <PhotoCircle src={photo} x={300} y={353} radius={216} stroke={accent} strokeWidth={10} />
        <circle cx={441} cy={552} r={98} fill={accent} stroke="#fff" strokeWidth={8} />
        <Discount d={d} x={425} y={591} size={89} color="#fff" />
        <rect y={635} width={600} height={213.71} fill={ink} />
        <Heading d={d} x={300} y={691} color="#fff" size={30} />
        <Text x={300} y={732} size={15} color="#fff" anchor="middle" max={530}>{d.service}</Text>
        <Text x={300} y={775} size={13} color="#fff" anchor="middle" max={510}>{d.dates} · {d.phone}</Text>
        <Text x={300} y={810} size={12} color="#fff" anchor="middle" max={510}>{d.address}</Text>
      </>;
  }

  return <svg ref={svgRef} className={className} viewBox="0 0 600 848.71" xmlns="http://www.w3.org/2000/svg" role="img" aria-label={`Mặt trước tờ rơi ${t.title}`}>
    <rect width="600" height="848.71" fill={bg} />
    {art}
  </svg>;
}
