import { useId, type ReactNode, type Ref } from "react";
import { FLYER_TEMPLATES, type FlyerDesign } from "@/lib/flyer-templates";

const SERIF = "Playfair Display";
const SANS = "Be Vietnam Pro";
const DISPLAY = "Oswald";
const SCRIPT = "Dancing Script";

type TxtProps = {
  children: ReactNode;
  x: number;
  y: number;
  size: number;
  color?: string;
  font?: string;
  weight?: number;
  anchor?: "start" | "middle" | "end";
  spacing?: number;
  max?: number;
  rotate?: number;
};

function Txt({ children, x, y, size, color = "currentColor", font = SANS, weight = 500, anchor = "start", spacing, max, rotate }: TxtProps) {
  const value = typeof children === "string" || typeof children === "number" ? String(children) : "";
  const fitted = max && value.length * size * (font === DISPLAY ? 0.5 : 0.56) > max ? max : undefined;
  return <text x={x} y={y} fill={color} fontFamily={font} fontWeight={weight} fontSize={size} textAnchor={anchor} letterSpacing={spacing} textLength={fitted} lengthAdjust="spacingAndGlyphs" transform={rotate ? `rotate(${rotate} ${x} ${y})` : undefined}>{children}</text>;
}

function Brand({ d, x = 300, y = 75, color, anchor = "middle", size = 23, font = SERIF }: { d: FlyerDesign; x?: number; y?: number; color: string; anchor?: "start" | "middle" | "end"; size?: number; font?: string }) {
  return <Txt x={x} y={y} size={size} color={color} font={font} anchor={anchor} max={450}>{d.salon}</Txt>;
}

function Headline({ d, x = 300, y, color, anchor = "middle", size = 29, font = SANS, max = 500 }: { d: FlyerDesign; x?: number; y: number; color: string; anchor?: "start" | "middle" | "end"; size?: number; font?: string; max?: number }) {
  return <Txt x={x} y={y} size={size} color={color} font={font} weight={700} anchor={anchor} spacing={1.5} max={max}>{d.headline}</Txt>;
}

function Percent({ d, x, y, size, color, font = DISPLAY, anchor = "middle", suffixSize }: { d: FlyerDesign; x: number; y: number; size: number; color: string; font?: string; anchor?: "start" | "middle" | "end"; suffixSize?: number }) {
  const number = d.discount.replace(/[^0-9]/g, "").slice(0, 3) || "30";
  return <>
    <Txt x={x} y={y} size={size} color={color} font={font} weight={700} anchor={anchor} max={size * 2.4}>{number}</Txt>
    <Txt x={x + (anchor === "middle" ? size * 0.7 : anchor === "end" ? 18 : size * 1.25)} y={y - size * 0.36} size={suffixSize ?? size * 0.34} color={color} font={SANS} weight={700}>%</Txt>
  </>;
}

function Details({ d, x = 300, y = 668, color, anchor = "middle", width = 500, compact = false }: { d: FlyerDesign; x?: number; y?: number; color: string; anchor?: "start" | "middle" | "end"; width?: number; compact?: boolean }) {
  const lead = compact ? 27 : 34;
  return <g>
    <Txt x={x} y={y} size={compact ? 16 : 19} color={color} anchor={anchor} weight={700} max={width}>{d.service}</Txt>
    <Txt x={x} y={y + lead} size={compact ? 14 : 16} color={color} anchor={anchor} max={width}>Từ {d.dates}</Txt>
    <Txt x={x} y={y + lead * 2} size={compact ? 13 : 15} color={color} anchor={anchor} max={width}>{d.address}</Txt>
    <Txt x={x} y={y + lead * 3} size={compact ? 14 : 16} color={color} anchor={anchor} weight={700} max={width}>{d.phone}</Txt>
  </g>;
}

function Stars({ color, points }: { color: string; points: [number, number, number][] }) {
  return <g fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">{points.map(([x, y, r], i) => <path key={i} d={`M${x - r} ${y}H${x + r}M${x} ${y - r}V${y + r}M${x - r * 0.65} ${y - r * 0.65}L${x + r * 0.65} ${y + r * 0.65}M${x + r * 0.65} ${y - r * 0.65}L${x - r * 0.65} ${y + r * 0.65}`} />)}</g>;
}

function Bottle({ x, y, scale = 1, stroke, fill = "none" }: { x: number; y: number; scale?: number; stroke: string; fill?: string }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`} stroke={stroke} strokeWidth="3" fill={fill} strokeLinejoin="round">
    <rect x="29" y="0" width="46" height="47" rx="7" />
    <rect x="20" y="45" width="64" height="89" rx="16" />
    <path d="M35 66h34M35 77h34M42 100c7-11 15-11 22 0-7 12-15 12-22 0Z" fill="none" />
  </g>;
}

function Flower({ x, y, r, fill, center = "#f9df88", rotate = 0 }: { x: number; y: number; r: number; fill: string; center?: string; rotate?: number }) {
  return <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
    {Array.from({ length: 6 }, (_, i) => <ellipse key={i} cx="0" cy={-r * 0.75} rx={r * 0.42} ry={r * 0.75} transform={`rotate(${i * 60})`} fill={fill} />)}
    <circle r={r * 0.38} fill={center} />
  </g>;
}

function Leaves({ x, y, scale = 1, color }: { x: number; y: number; scale?: number; color: string }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round">
    <path d="M0 130C35 76 52 38 68 0" />
    <path d="M17 101C-25 98-36 64-19 47 6 51 19 69 17 101ZM35 68C8 42 14 16 34 7 54 25 54 47 35 68ZM48 40C63 12 87 8 99 20 91 43 72 51 48 40Z" fill={color} fillOpacity=".14" />
  </g>;
}

export function FlyerSvg({ design: d, svgRef, className }: { design: FlyerDesign; svgRef?: Ref<SVGSVGElement>; className?: string }) {
  const t = FLYER_TEMPLATES.find((item) => item.id === d.templateId) ?? FLYER_TEMPLATES[0];
  const g = useId().replace(/:/g, "");
  const { bg, ink, accent } = t;
  let artwork: ReactNode;

  switch (t.id) {
    case "blush-editorial":
      artwork = <>
        <rect x="25" y="25" width="550" height="798" fill="none" stroke={ink} strokeWidth="1.5" />
        <path d="M63 124H537M63 577H537" stroke={ink} strokeWidth="1" />
        <Txt x={65} y={68} size={12} color={ink} spacing={3}>NAIL STUDIO · GRAND OPENING</Txt>
        <Brand d={d} x={65} y={108} color={ink} anchor="start" size={31} />
        <Headline d={d} x={64} y={218} color={ink} anchor="start" size={33} max={475} font={SERIF} />
        <Txt x={66} y={273} size={17} color={accent} spacing={4}>ƯU ĐÃI CHỈ TRONG DỊP NÀY</Txt>
        <Percent d={d} x={65} y={482} size={205} color={ink} anchor="start" font={SERIF} />
        <Bottle x={400} y={335} scale={1.25} stroke={accent} />
        <path d="M390 531c46-37 89-42 145-15" fill="none" stroke={accent} strokeWidth="2" />
        <rect x="25" y="597" width="550" height="226" fill={accent} />
        <Txt x={65} y={637} size={18} color="#fffaf7" font={SCRIPT}>Mời bạn ghé chơi và làm đẹp cùng chúng tôi</Txt>
        <Details d={d} x={65} y={672} color="#fffaf7" anchor="start" width={465} compact />
      </>;
      break;
    case "midnight-gala":
      artwork = <>
        <rect x="23" y="23" width="554" height="802" fill="none" stroke={accent} strokeWidth="2" />
        <rect x="34" y="34" width="532" height="780" fill="none" stroke={accent} strokeOpacity=".5" />
        <Stars color={accent} points={[[104, 145, 16], [507, 122, 13], [470, 388, 9], [122, 470, 11], [520, 548, 9]]} />
        <Brand d={d} y={91} color={accent} size={28} />
        <Txt x={300} y={170} size={19} color={ink} anchor="middle" spacing={5}>BẠN ĐƯỢC MỜI ĐẾN</Txt>
        <Headline d={d} y={223} color={ink} font={SERIF} size={37} />
        <circle cx="300" cy="395" r="145" fill="none" stroke={accent} strokeWidth="2" />
        <circle cx="300" cy="395" r="132" fill="none" stroke={accent} strokeOpacity=".45" />
        <Percent d={d} x={286} y={438} size={141} color={accent} font={SERIF} />
        <Txt x={300} y={508} size={18} color={ink} anchor="middle" spacing={5}>GIẢM GIÁ KHAI TRƯƠNG</Txt>
        <path d="M83 571H517" stroke={accent} />
        <Details d={d} y={617} color={ink} />
        <Txt x={300} y={796} size={14} color={accent} anchor="middle" max={490}>{d.note}</Txt>
      </>;
      break;
    case "coral-pop":
      artwork = <>
        <polygon points="0,0 600,0 600,535 0,355" fill={accent} />
        <circle cx="525" cy="82" r="76" fill="#ffcaad" opacity=".75" />
        <Brand d={d} x={52} y={74} color={ink} anchor="start" font={SANS} size={29} />
        <Headline d={d} x={52} y={164} color={ink} anchor="start" size={37} max={490} />
        <Txt x={50} y={218} size={20} color="#ffe2b7" spacing={3}>HELLO, BEAUTIFUL!</Txt>
        <circle cx="300" cy="402" r="169" fill="#fff7e9" />
        <circle cx="300" cy="402" r="151" fill="none" stroke={accent} strokeWidth="3" strokeDasharray="8 11" />
        <Percent d={d} x={282} y={456} size={174} color={accent} />
        <Txt x={300} y={528} size={22} color={accent} anchor="middle" weight={700}>CHÀO MỪNG KHAI TRƯƠNG</Txt>
        <rect y="606" width="600" height="242" fill="#fff7e9" />
        <Details d={d} y={654} color={accent} />
        <Txt x={300} y={810} size={14} color={accent} anchor="middle" max={510}>{d.note}</Txt>
      </>;
      break;
    case "sage-garden":
      artwork = <>
        <rect x="30" y="30" width="540" height="788" fill="#f8faf2" />
        <rect x="45" y="45" width="510" height="758" fill="none" stroke={ink} strokeWidth="1" />
        <Leaves x={5} y={166} scale={2.4} color={accent} />
        <Leaves x={470} y={30} scale={1.6} color={accent} />
        <Leaves x={473} y={620} scale={1.4} color={accent} />
        <Brand d={d} x={315} y={107} color={ink} size={32} />
        <Txt x={315} y={146} size={13} color={accent} anchor="middle" spacing={5}>A NEW BEGINNING</Txt>
        <Headline d={d} x={315} y={281} color={ink} size={33} font={SERIF} max={470} />
        <circle cx="315" cy="418" r="117" fill={bg} stroke={accent} strokeWidth="2" />
        <Percent d={d} x={300} y={463} size={137} color={ink} font={SERIF} />
        <Txt x={315} y={548} size={20} color={ink} anchor="middle">Một chút yêu thương cho đôi tay</Txt>
        <Details d={d} x={315} y={635} color={ink} compact />
      </>;
      break;
    case "lilac-ribbon":
      artwork = <>
        <path d="M-70 150C130-40 433 308 673 63V180C431 419 142 88-70 290Z" fill={accent} opacity=".8" />
        <path d="M-40 430C168 206 420 633 660 356V502C449 746 133 359-40 592Z" fill="#cbb8e2" />
        <circle cx="300" cy="420" r="194" fill="#fcf8ff" />
        <Brand d={d} y={79} color={ink} size={30} font={SCRIPT} />
        <Headline d={d} y={289} color={ink} size={31} font={SERIF} />
        <Percent d={d} x={283} y={482} size={187} color={accent} font={SERIF} />
        <Txt x={300} y={549} size={20} color={ink} anchor="middle" font={SCRIPT}>a little treat for you</Txt>
        <rect x="44" y="611" width="512" height="192" rx="22" fill="#fcf8ff" />
        <Details d={d} y={646} color={ink} compact />
      </>;
      break;
    case "cobalt-block":
      artwork = <>
        <rect width="600" height="459" fill={ink} />
        <rect x="44" y="44" width="512" height="371" fill="none" stroke="#fff" strokeWidth="2" />
        <Brand d={d} x={65} y={91} color="#fff" anchor="start" font={SANS} size={27} />
        <Headline d={d} x={65} y={191} color="#fff" anchor="start" size={39} max={480} />
        <Txt x={65} y={241} size={20} color={accent} spacing={3}>ƯU ĐÃI ĐẶC BIỆT</Txt>
        <rect x="96" y="310" width="408" height="221" fill={accent} />
        <Percent d={d} x={280} y={469} size={177} color={ink} />
        <path d="M44 565H556" stroke={ink} strokeWidth="4" />
        <Txt x={300} y={603} size={20} color={ink} anchor="middle" weight={700} max={500}>{d.service}</Txt>
        <Details d={d} y={655} color={ink} compact />
        <Txt x={300} y={804} size={14} color={ink} anchor="middle" max={500}>{d.note}</Txt>
      </>;
      break;
    case "terracotta-arch":
      artwork = <>
        <path d="M68 578V294a232 232 0 0 1 464 0v284Z" fill={accent} />
        <path d="M95 560V298a205 205 0 0 1 410 0v262Z" fill="#fbeee3" />
        <path d="M124 540V311a176 176 0 0 1 352 0v229Z" fill="none" stroke={ink} strokeWidth="2" />
        <Brand d={d} y={70} color={ink} size={29} />
        <Headline d={d} y={205} color={ink} size={31} font={SERIF} />
        <Txt x={300} y={245} size={17} color={accent} anchor="middle" spacing={3}>TẶNG BẠN ĐIỀU BẤT NGỜ</Txt>
        <Percent d={d} x={283} y={448} size={167} color={ink} font={SERIF} />
        <path d="M46 614H554" stroke={ink} strokeWidth="2" />
        <Details d={d} y={657} color={ink} compact />
        <Txt x={300} y={807} size={14} color={ink} anchor="middle" max={510}>{d.note}</Txt>
      </>;
      break;
    case "lemon-sunburst":
      artwork = <>
        <g stroke={accent} strokeWidth="12">{Array.from({ length: 24 }, (_, i) => {
          const a = i * Math.PI / 12;
          return <line key={i} x1={300 + Math.cos(a) * 155} y1={356 + Math.sin(a) * 155} x2={300 + Math.cos(a) * 412} y2={356 + Math.sin(a) * 412} />;
        })}</g>
        <circle cx="300" cy="352" r="201" fill={bg} stroke={ink} strokeWidth="4" />
        <circle cx="300" cy="352" r="181" fill="none" stroke={ink} strokeWidth="2" strokeDasharray="3 10" />
        <Brand d={d} y={75} color={ink} size={29} />
        <Headline d={d} y={283} color={ink} size={30} />
        <Percent d={d} x={282} y={447} size={155} color={ink} />
        <Txt x={300} y={522} size={18} color={ink} anchor="middle" spacing={4}>KHUI QUÀ · LÀM ĐẸP</Txt>
        <rect y="598" width="600" height="250" fill={ink} />
        <Details d={d} y={644} color={bg} compact />
        <Txt x={300} y={808} size={13} color={bg} anchor="middle" max={520}>{d.note}</Txt>
      </>;
      break;
    case "cherry-magazine":
      artwork = <>
        <rect x="32" y="32" width="536" height="784" fill="none" stroke={ink} strokeWidth="2" />
        <Brand d={d} y={90} color={ink} size={41} font={SERIF} />
        <path d="M45 118H555" stroke={ink} strokeWidth="2" />
        <Txt x={45} y={158} size={13} color={ink} spacing={3}>THE GRAND OPENING ISSUE</Txt>
        <Txt x={550} y={158} size={13} color={ink} anchor="end">VOL. 01</Txt>
        <Headline d={d} x={50} y={270} color={ink} anchor="start" font={SERIF} size={37} max={480} />
        <Txt x={51} y={474} size={156} color={accent} font={DISPLAY} weight={700}>SALE</Txt>
        <rect x="308" y="316" width="235" height="245" fill={ink} transform="rotate(7 425 440)" />
        <Percent d={d} x={418} y={467} size={116} color={bg} />
        <path d="M45 589H555" stroke={ink} strokeWidth="2" />
        <Details d={d} x={51} y={641} color={ink} anchor="start" width={495} compact />
        <Txt x={52} y={795} size={13} color={accent} max={480}>{d.note}</Txt>
      </>;
      break;
    case "mint-checker":
      artwork = <>
        {Array.from({ length: 8 }, (_, row) => Array.from({ length: 6 }, (_, col) => (row + col) % 2 === 0 ? <rect key={`${row}-${col}`} x={col * 100} y={row * 100} width="100" height="100" fill={accent} opacity=".55" /> : null))}
        <rect x="50" y="75" width="500" height="690" rx="20" fill="#fffdf6" stroke={ink} strokeWidth="3" />
        <Brand d={d} y={124} color={ink} size={28} font={SANS} />
        <path d="M94 158H506" stroke={ink} strokeWidth="2" strokeDasharray="10 9" />
        <Headline d={d} y={265} color={ink} size={35} />
        <rect x="138" y="303" width="324" height="234" rx="30" fill={bg} stroke={ink} strokeWidth="4" transform="rotate(-5 300 420)" />
        <Percent d={d} x={283} y={475} size={149} color={ink} />
        <Txt x={300} y={578} size={18} color={ink} anchor="middle" font={SCRIPT}>New salon, new glow</Txt>
        <Details d={d} y={630} color={ink} compact />
      </>;
      break;
    case "pearl-minimal":
      artwork = <>
        <circle cx="470" cy="365" r="238" fill="#ece6db" />
        <circle cx="470" cy="365" r="189" fill="#fffdfa" />
        <circle cx="470" cy="365" r="147" fill={accent} opacity=".4" />
        <circle cx="470" cy="365" r="111" fill="#fffdfa" />
        <path d="M55 50V798M55 50H545" stroke={ink} strokeWidth="1" />
        <Brand d={d} x={85} y={108} color={ink} anchor="start" size={28} />
        <Txt x={84} y={198} size={17} color={ink} spacing={4}>A BEAUTIFUL BEGINNING</Txt>
        <Headline d={d} x={85} y={274} color={ink} anchor="start" font={SERIF} size={34} max={450} />
        <Percent d={d} x={86} y={485} size={168} color={ink} anchor="start" font={SERIF} />
        <Txt x={85} y={548} size={18} color={ink}>ưu đãi đặc biệt</Txt>
        <path d="M85 597H515" stroke={ink} />
        <Details d={d} x={85} y={642} color={ink} anchor="start" width={430} compact />
      </>;
      break;
    case "pink-candy":
      artwork = <>
        {Array.from({ length: 12 }, (_, i) => <rect key={i} x={i * 50} width="26" height="848" fill={accent} opacity=".5" />)}
        <rect x="42" y="50" width="516" height="750" rx="30" fill={bg} stroke={ink} strokeWidth="3" />
        <Brand d={d} y={116} color={ink} size={29} font={SCRIPT} />
        <Headline d={d} y={238} color={ink} font={DISPLAY} size={42} />
        <circle cx="300" cy="420" r="166" fill={ink} />
        <circle cx="300" cy="420" r="148" fill="none" stroke="#fff7ee" strokeWidth="3" strokeDasharray="3 11" />
        <Percent d={d} x={280} y={472} size={158} color="#fff7ee" />
        <Txt x={300} y={580} size={19} color={ink} anchor="middle" font={SCRIPT}>sweet opening deals</Txt>
        <Details d={d} y={636} color={ink} compact />
      </>;
      break;
    case "aqua-wave":
      artwork = <>
        <path d="M0 144C138 85 242 204 387 139S552 90 600 129V848H0Z" fill={accent} />
        <path d="M0 215C110 154 288 299 423 206S546 187 600 220V848H0Z" fill="#0b7b80" />
        <path d="M0 666C181 561 302 792 600 616V848H0Z" fill={bg} />
        {[64, 110, 157, 480, 525].map((x, i) => <circle key={i} cx={x} cy={278 + i * 38} r={12 + i * 3} fill="none" stroke="#f9ffff" strokeOpacity=".55" strokeWidth="2" />)}
        <Brand d={d} y={88} color={ink} size={32} />
        <Headline d={d} y={303} color="#fff" size={33} />
        <Percent d={d} x={284} y={502} size={178} color="#fff" />
        <Txt x={300} y={568} size={22} color="#fff" anchor="middle" font={SCRIPT}>fresh nails, fresh start</Txt>
        <Details d={d} y={689} color={ink} compact />
      </>;
      break;
    case "violet-neon":
      artwork = <>
        <rect x="30" y="30" width="540" height="788" rx="30" fill="none" stroke={accent} strokeWidth="4" />
        <rect x="43" y="43" width="514" height="762" rx="22" fill="none" stroke="#81e4e5" strokeWidth="2" opacity=".8" />
        <circle cx="300" cy="396" r="193" fill="none" stroke={accent} strokeWidth="17" opacity=".35" />
        <circle cx="300" cy="396" r="165" fill="none" stroke="#81e4e5" strokeWidth="3" />
        <Stars color={accent} points={[[83, 230, 16], [520, 215, 14], [92, 540, 12], [503, 559, 13]]} />
        <Brand d={d} y={104} color="#fff" size={31} font={SCRIPT} />
        <Headline d={d} y={191} color="#fff" size={31} />
        <Percent d={d} x={282} y={472} size={173} color={accent} />
        <Txt x={300} y={553} size={19} color="#81e4e5" anchor="middle" spacing={3}>GLOW WITH US</Txt>
        <path d="M95 603H505" stroke={accent} strokeWidth="2" />
        <Details d={d} y={649} color="#fff" compact />
      </>;
      break;
    case "kraft-collage":
      artwork = <>
        <polygon points="31,53 558,32 570,476 48,498" fill="#f6edda" />
        <polygon points="25,514 575,472 586,790 43,807" fill="#d8ae8e" />
        <path d="M34 504l23 8 17-13 23 8 23-16 21 9 21-13 20 8 22-16 20 9 22-14 19 8 20-15 21 9 22-16 20 8 21-16 18 8 25-17 17 7" fill="none" stroke={bg} strokeWidth="9" />
        <rect x="72" y="81" width="456" height="426" fill="none" stroke={ink} strokeWidth="2" strokeDasharray="9 7" transform="rotate(-2 300 300)" />
        <Brand d={d} x={91} y={127} color={ink} anchor="start" size={28} />
        <Headline d={d} x={87} y={237} color={ink} anchor="start" size={35} max={430} font={SERIF} />
        <circle cx="351" cy="391" r="119" fill={accent} transform="rotate(9 351 391)" />
        <Percent d={d} x={339} y={437} size={120} color="#fffaf1" />
        <Txt x={85} y={570} size={20} color={ink} font={SCRIPT}>Một dịp thật đặc biệt</Txt>
        <Details d={d} x={85} y={616} color={ink} anchor="start" compact width={430} />
        <Txt x={85} y={778} size={13} color={ink} max={440}>{d.note}</Txt>
      </>;
      break;
    case "teal-ticket":
      artwork = <>
        <rect x="25" y="29" width="550" height="790" rx="16" fill="#fff9e9" />
        {Array.from({ length: 12 }, (_, i) => <circle key={i} cx={25 + i * 50} cy="29" r="10" fill={bg} />)}
        {Array.from({ length: 12 }, (_, i) => <circle key={i} cx={25 + i * 50} cy="819" r="10" fill={bg} />)}
        <Txt x={67} y={75} size={13} color={bg} spacing={4}>ADMIT ONE · GRAND OPENING</Txt>
        <Txt x={535} y={75} size={13} color={bg} anchor="end">NO. 001</Txt>
        <path d="M55 103H545" stroke={bg} strokeWidth="2" strokeDasharray="10 7" />
        <Brand d={d} y={154} color={bg} size={32} />
        <Headline d={d} y={270} color={bg} size={34} font={SERIF} />
        <rect x="94" y="320" width="412" height="240" rx="22" fill={bg} />
        <Percent d={d} x={283} y={489} size={166} color={accent} />
        <Txt x={300} y={602} size={18} color={bg} anchor="middle" spacing={3}>VÉ ƯU ĐÃI CỦA BẠN</Txt>
        <path d="M50 628H550" stroke={bg} strokeWidth="2" strokeDasharray="11 9" />
        <Details d={d} y={663} color={bg} compact />
      </>;
      break;
    case "chrome-glow":
      artwork = <>
        <defs><linearGradient id={`${g}-chrome`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ffffff" /><stop offset=".35" stopColor="#bcb8ca" /><stop offset=".65" stopColor="#ffffff" /><stop offset="1" stopColor="#8b80a8" /></linearGradient></defs>
        <circle cx="430" cy="283" r="140" fill={`url(#${g}-chrome)`} />
        <circle cx="125" cy="537" r="85" fill={`url(#${g}-chrome)`} opacity=".8" />
        <rect x="38" y="38" width="524" height="772" fill="none" stroke={ink} strokeWidth="1" />
        <Brand d={d} x={65} y={95} color={ink} anchor="start" size={27} font={SANS} />
        <Txt x={65} y={151} size={13} color={accent} spacing={4}>NAIL STUDIO / NEW ERA</Txt>
        <Headline d={d} x={65} y={264} color={ink} anchor="start" size={37} max={490} />
        <Percent d={d} x={65} y={480} size={189} color={ink} anchor="start" font={DISPLAY} />
        <rect x="63" y="549" width="474" height="219" rx="8" fill={ink} />
        <Details d={d} x={86} y={596} color="#fff" anchor="start" compact width={425} />
        <Txt x={86} y={739} size={13} color="#fff" max={430}>{d.note}</Txt>
      </>;
      break;
    case "rose-garden":
      artwork = <>
        <rect x="27" y="27" width="546" height="794" fill="none" stroke={ink} strokeWidth="2" />
        <rect x="41" y="41" width="518" height="766" fill="none" stroke={accent} strokeWidth="1" />
        <Flower x={92} y={124} r={37} fill="#e7a9ae" center="#efd5a2" rotate={20} />
        <Flower x={498} y={127} r={31} fill="#d992a0" center="#efd5a2" />
        <Flower x={80} y={718} r={37} fill="#d992a0" center="#efd5a2" rotate={35} />
        <Flower x={515} y={725} r={35} fill="#e7a9ae" center="#efd5a2" rotate={11} />
        <Leaves x={43} y={194} scale={.9} color={ink} />
        <Leaves x={510} y={520} scale={.85} color={ink} />
        <Brand d={d} y={109} color={ink} size={34} font={SCRIPT} />
        <Headline d={d} y={237} color={ink} font={SERIF} size={36} />
        <path d="M190 279q110 45 220 0" fill="none" stroke={accent} strokeWidth="2" />
        <Percent d={d} x={283} y={465} size={168} color={ink} font={SERIF} />
        <Txt x={300} y={531} size={19} color={accent} anchor="middle" font={SCRIPT}>a beautiful gift for you</Txt>
        <Details d={d} y={638} color={ink} compact />
      </>;
      break;
    case "mono-type":
      artwork = <>
        <rect x="30" y="30" width="540" height="788" fill="none" stroke={ink} strokeWidth="4" />
        <Brand d={d} x={49} y={76} color={ink} anchor="start" size={24} font={SANS} />
        <path d="M45 96H555M45 610H555" stroke={ink} strokeWidth="4" />
        <Headline d={d} x={45} y={163} color={ink} anchor="start" size={35} max={500} font={DISPLAY} />
        <Txt x={44} y={485} size={330} color={ink} font={DISPLAY} weight={700} max={480}>{d.discount.replace(/[^0-9]/g, "").slice(0, 3) || "30"}</Txt>
        <Txt x={434} y={535} size={74} color={ink} font={DISPLAY} weight={700}>%</Txt>
        <rect x="45" y="550" width="510" height="46" fill={ink} />
        <Txt x={300} y={581} size={19} color="#fff" anchor="middle" spacing={4}>GIẢM GIÁ KHAI TRƯƠNG</Txt>
        <Details d={d} x={49} y={653} color={ink} anchor="start" compact width={490} />
      </>;
      break;
    case "confetti-party":
    default:
      artwork = <>
        {Array.from({ length: 30 }, (_, i) => {
          const x = (i * 149 + 31) % 590;
          const y = (i * 223 + 41) % 588;
          const colors = ["#ed674e", "#35a5a1", "#efb837", "#9a6aba"];
          return <rect key={i} x={x} y={y} width={i % 3 === 0 ? 12 : 8} height={i % 3 === 0 ? 27 : 16} rx="2" fill={colors[i % 4]} transform={`rotate(${i * 47} ${x} ${y})`} />;
        })}
        <rect x="33" y="40" width="534" height="96" rx="48" fill={ink} />
        <Brand d={d} y={101} color="#fff" size={28} font={SANS} />
        <Headline d={d} y={216} color={ink} size={33} />
        <path d="M300 249l29 44 51-29 7 58 57-12-17 55 56 18-47 37 40 42-57 7 21 56-57-14-10 58-49-31-30 47-31-47-50 30-9-58-57 15 20-56-57-8 41-41-47-39 56-17-18-56 58 12 7-58 52 29Z" fill={accent} />
        <Percent d={d} x={282} y={472} size={159} color="#fff" />
        <Txt x={300} y={568} size={19} color={ink} anchor="middle" font={SCRIPT}>Let&apos;s celebrate!</Txt>
        <rect y="609" width="600" height="239" fill={ink} />
        <Details d={d} y={650} color="#fff" compact />
        <Txt x={300} y={809} size={13} color="#fff" anchor="middle" max={510}>{d.note}</Txt>
      </>;
  }

  const noteLayouts: Record<string, { y: number; color: string }> = {
    "blush-editorial": { y: 801, color: "#fffaf7" },
    "sage-garden": { y: 781, color: ink },
    "lilac-ribbon": { y: 790, color: ink },
    "mint-checker": { y: 786, color: ink },
    "pearl-minimal": { y: 791, color: ink },
    "pink-candy": { y: 787, color: ink },
    "aqua-wave": { y: 820, color: ink },
    "violet-neon": { y: 783, color: ink },
    "teal-ticket": { y: 796, color: bg },
    "rose-garden": { y: 785, color: ink },
    "mono-type": { y: 785, color: ink },
  };
  const note = noteLayouts[t.id];

  return <svg ref={svgRef} className={className} viewBox="0 0 600 848.71" xmlns="http://www.w3.org/2000/svg" role="img" aria-label={`Tờ rơi ${t.title} của ${d.salon}`}>
    <rect width="600" height="848.71" fill={bg} />
    {artwork}
    {note && d.note && <Txt x={300} y={note.y} size={12} color={note.color} anchor="middle" max={450}>{d.note}</Txt>}
  </svg>;
}
