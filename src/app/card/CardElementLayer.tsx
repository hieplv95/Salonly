import type { CardElement } from "@/lib/card-templates";

// Các phần tử khách thêm nằm trên cùng lớp SVG với mẫu để bản xem trước và file in giống nhau.
export function CardElementLayer({ elements, side, width, selectedId, editing }: {
  elements: CardElement[];
  side: "front" | "back";
  width: number;
  selectedId?: string | null;
  editing?: boolean;
}) {
  return <>
    {elements.filter((element) => element.side === side).map((element) => {
      const iconSize = element.size * 1.35;
      const labelWidth = element.text.length * element.size * 0.62;
      const contentWidth = element.kind === "instagram" ? iconSize + 12 + labelWidth : labelWidth;
      const available = Math.max(30, width - element.x - 12);
      const boxWidth = Math.max(element.kind === "instagram" ? iconSize : 32, Math.min(contentWidth, available));
      const boxHeight = element.kind === "instagram" ? iconSize : element.size * 1.3;
      const textX = element.kind === "instagram" ? iconSize + 12 : 0;
      return <g
        key={element.id}
        transform={`translate(${element.x} ${element.y})`}
        data-card-element-id={editing ? element.id : undefined}
        style={editing ? { cursor: "grab", touchAction: "none" } : undefined}
      >
        {editing && <rect data-editor-only="true" width={boxWidth} height={boxHeight} fill="transparent" />}
        {element.kind === "instagram" && <g transform={`scale(${iconSize / 64})`} fill="none" stroke={element.color} strokeWidth="4.5">
          <rect x="6" y="6" width="52" height="52" rx="14" />
          <circle cx="32" cy="32" r="12" />
          <circle cx="47" cy="17" r="3" fill={element.color} stroke="none" />
        </g>}
        <text
          x={textX}
          y={boxHeight / 2}
          dominantBaseline="middle"
          fill={element.color}
          fontFamily="'Montserrat'"
          fontWeight="500"
          fontSize={element.size}
          textLength={contentWidth > available && element.text ? Math.max(1, available - textX) : undefined}
          lengthAdjust={contentWidth > available ? "spacingAndGlyphs" : undefined}
        >{element.text}</text>
        {editing && selectedId === element.id && <rect data-editor-only="true" x="-7" y="-7" width={boxWidth + 14} height={boxHeight + 14} rx="6" fill="none" stroke="#B27B4A" strokeWidth="3" strokeDasharray="9 6" pointerEvents="none" />}
      </g>;
    })}
  </>;
}
