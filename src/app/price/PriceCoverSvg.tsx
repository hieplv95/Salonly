import { type ReactNode, type Ref } from "react";
import { TAGLINE_FONT, fontOf } from "@/lib/logo-templates";
import { bodyFontOf, priceFormatOf, type PriceDesign } from "@/lib/price-templates";
import { fit, useMeasure } from "../design/measure";
import { CoverArtwork } from "./CoverArtwork";
import { COVER_DESIGNS, type CoverText } from "./cover-designs";

type ContactKind = "instagram" | "whatsapp" | "pin" | "clock";

function ContactIcon({ kind, x, y, size, color }: { kind: ContactKind; x: number; y: number; size: number; color: string }) {
  const common = { fill: "none", stroke: color, strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return <g transform={`translate(${x - size / 2} ${y - size / 2}) scale(${size / 24})`} {...common}>
    {kind === "instagram" && <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.4" cy="6.7" r="0.8" fill={color} stroke="none" /></>}
    {kind === "whatsapp" && <><path d="M20.2 11.7a8.2 8.2 0 0 1-12.1 7.2L4 20l1.2-4A8.2 8.2 0 1 1 20.2 11.7Z" /><path d="M9 8.2c-.5 0-.9.6-.9 1.4 0 2.5 3.2 5.7 5.7 5.7.8 0 1.6-.4 1.8-1.1l-2-1.1-.8.8c-1.2-.5-2.2-1.5-2.7-2.7l.8-.8-1.1-2.1Z" /></>}
    {kind === "pin" && <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2.5" /></>}
    {kind === "clock" && <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.4 2" /></>}
  </g>;
}

export function PriceCoverSvg({ design, svgRef, className }: { design: PriceDesign; svgRef?: Ref<SVGSVGElement>; className?: string }) {
  const measure = useMeasure();
  const { w: W, h: H } = priceFormatOf(design.format);
  const u = W / 100;
  const { bg, surface, primary, text, accent } = design.colors;
  const head = fontOf(design.headFont);
  const body = bodyFontOf(design.bodyFont);
  const layout = COVER_DESIGNS[design.templateId] ?? COVER_DESIGNS["classic-rose"];
  const palette = { bg, surface, primary, text };

  const drawText = (s: string, x: number, y: number, base: number, maxW: number, options: {
    family?: string; weight?: number; fill?: string; spacing?: number; anchor?: "start" | "middle" | "end"; minRatio?: number;
  } = {}) => {
    const family = options.family ?? head.family;
    const weight = options.weight ?? head.weight;
    const spacing = options.spacing ?? 0;
    const estimate = family === head.family ? head.width : family === body.family ? body.width : TAGLINE_FONT.width;
    const f = fit(s, estimate, base, base * (options.minRatio ?? 0.46), maxW, spacing, measure(s, family, weight, base, spacing));
    return <text x={x} y={y} textAnchor={options.anchor ?? "middle"} fontFamily={`'${family}'`} fontWeight={weight} fontSize={f.size} letterSpacing={spacing || undefined} fill={options.fill ?? primary} textLength={f.length} lengthAdjust={f.length ? "spacingAndGlyphs" : undefined}>{s}</text>;
  };

  const placedText = (s: string, pos: CoverText, title = false) => {
    const value = pos.upper || title ? s.toLocaleUpperCase("vi") : s;
    return drawText(value, W * pos.x / 100, H * pos.y / 100, u * pos.size, W * pos.width / 100, {
      family: title && head.script ? TAGLINE_FONT.family : head.family,
      weight: title && head.script ? TAGLINE_FONT.weight : head.weight,
      fill: palette[pos.color ?? "primary"],
      anchor: pos.align ?? "middle",
      spacing: title ? u * 0.1 : 0,
    });
  };

  const entries = ([
    { kind: "instagram", label: "INSTAGRAM", value: design.instagram?.trim() ?? "" },
    { kind: "whatsapp", label: "WHATSAPP", value: design.whatsapp?.trim() ?? "" },
    { kind: "pin", label: "ĐỊA CHỈ", value: design.address.trim() },
    { kind: "clock", label: "GIỜ MỞ CỬA", value: design.hours.trim() },
  ] satisfies { kind: ContactKind; label: string; value: string }[]).filter((e) => e.value);

  const label = (s: string, x: number, y: number, maxW: number, color: string) =>
    drawText(s, x, y, u * 1.55, maxW, { family: TAGLINE_FONT.family, weight: 600, fill: color, spacing: u * 0.08, anchor: "start", minRatio: 0.6 });
  const value = (s: string, x: number, y: number, maxW: number, color: string, size = 2.35) =>
    drawText(s, x, y, u * size, maxW, { family: body.family, weight: body.weight, fill: color, anchor: "start", minRatio: 0.52 });

  const contact: ReactNode[] = [];
  const top = H * 0.755;
  const bottom = H * 0.972;
  const width = W - u * 10;
  const contactStyle = layout.contact;

  if (contactStyle === "card") {
    contact.push(<rect key="panel" x={u * 5} y={top - H * 0.012} width={width} height={bottom - top + H * 0.025} rx={u * 1.2} fill={surface} stroke={accent} strokeWidth={u * 0.12} />);
    const rowH = (bottom - top) / Math.max(4, entries.length);
    entries.forEach((e, i) => {
      const cy = top + rowH * (i + 0.47);
      contact.push(<g key={e.kind}>
        <ContactIcon kind={e.kind} x={u * 11} y={cy} size={u * 3.6} color={primary} />
        {label(e.label, u * 15.1, cy - u * 0.45, W - u * 29, primary)}
        {value(e.value, u * 15.1, cy + u * 1.9, W - u * 28, text)}
      </g>);
    });
  } else if (contactStyle === "grid" || contactStyle === "band") {
    const fill = contactStyle === "band" ? primary : surface;
    const ink = contactStyle === "band" ? bg : text;
    const subtle = contactStyle === "band" ? bg : primary;
    contact.push(<rect key="panel" x={contactStyle === "band" ? 0 : u * 5} y={top - H * 0.012} width={contactStyle === "band" ? W : width} height={bottom - top + H * 0.04} fill={fill} stroke={contactStyle === "band" ? "none" : accent} strokeWidth={u * 0.12} />);
    const cellW = W * 0.42;
    entries.forEach((e, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = u * (col ? 57 : 10);
      const y = top + (bottom - top) * (row ? 0.73 : 0.26);
      contact.push(<g key={e.kind}>
        <ContactIcon kind={e.kind} x={x} y={y} size={u * 3.4} color={subtle} />
        {label(e.label, x + u * 4, y - u * 0.25, cellW - u * 5, subtle)}
        {value(e.value, x + u * 4, y + u * 2.35, cellW - u * 6, ink, 2.25)}
      </g>);
    });
  } else if (contactStyle === "split") {
    contact.push(<rect key="panel" x={u * 5} y={top - H * 0.012} width={width} height={bottom - top + H * 0.025} fill={surface} stroke={accent} strokeWidth={u * 0.13} />);
    contact.push(<path key="divider" d={`M${W / 2} ${top} V${bottom}`} stroke={accent} strokeWidth={u * 0.13} />);
    entries.forEach((e, i) => {
      const col = i < 2 ? 0 : 1;
      const row = i % 2;
      const x = u * (col ? 55 : 10);
      const y = top + (bottom - top) * (row ? 0.73 : 0.27);
      contact.push(<g key={e.kind}>
        <ContactIcon kind={e.kind} x={x} y={y} size={u * 3.4} color={primary} />
        {label(e.label, x + u * 3.8, y - u * 0.25, W * 0.38, primary)}
        {value(e.value, x + u * 3.8, y + u * 2.25, W * 0.36, text, 2.2)}
      </g>);
    });
  } else {
    contact.push(<path key="top-rule" d={`M${u * 6} ${top - H * 0.018} H${W - u * 6}`} stroke={primary} strokeWidth={u * 0.18} />);
    const rowH = (bottom - top) / Math.max(4, entries.length);
    entries.forEach((e, i) => {
      const cy = top + rowH * (i + 0.5);
      contact.push(<g key={e.kind}>
        <ContactIcon kind={e.kind} x={u * 10} y={cy} size={u * 3.3} color={primary} />
        {label(e.label, u * 14, cy + u * 0.6, u * 25, primary)}
        {value(e.value, u * 39, cy + u * 0.65, W - u * 46, text, 2.2)}
        {i < entries.length - 1 && <path d={`M${u * 6} ${cy + rowH * 0.5} H${W - u * 6}`} stroke={accent} strokeWidth={u * 0.1} />}
      </g>);
    });
  }

  return <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg" className={className} role="img" aria-label={`Mặt trước bảng giá ${design.salon}`}>
    <rect width={W} height={H} fill={bg} />
    <CoverArtwork design={design} W={W} H={H} />
    <g>{placedText(design.salon.trim() || " ", layout.salon)}</g>
    <g>{placedText(design.heading.trim() || "Bảng giá dịch vụ", layout.title, true)}</g>
    {layout.taglineY && <g>{drawText("NAIL · BEAUTY · CARE", W / 2, H * layout.taglineY / 100, u * 2, W * 0.75, { family: TAGLINE_FONT.family, weight: TAGLINE_FONT.weight, fill: text, spacing: u * 0.1 })}</g>}
    <g>{contact}</g>
  </svg>;
}
