import { memo, useId, useMemo, type Ref, type ReactNode, type SVGProps } from "react";
import { SHADOW_DEFS, SHADOW_FILTER_ID, objectTransform, type CanvasPage, type CanvasObject } from "./canvas-model";

// Keep SVG descendants stable while selection/handles change, so a double-click
// reaches the same text node on both clicks and pointer capture remains reliable.
const ObjectNode = memo(function ObjectNode({ object, interactive }: { object: CanvasObject; interactive: boolean }) {
  const content = useMemo(() => ({ __html: object.markup }), [object.markup]);
  return (
    <g
      data-scene-id={object.id}
      transform={objectTransform(object)}
      opacity={object.opacity !== undefined && object.opacity < 1 ? object.opacity : undefined}
      filter={object.shadow ? `url(#${SHADOW_FILTER_ID})` : undefined}
      pointerEvents={interactive ? "bounding-box" : undefined}
      style={interactive ? { cursor: object.locked ? "not-allowed" : "move" } : undefined}
      dangerouslySetInnerHTML={content}
    />
  );
});

export function CanvasSvg({ page, svgRef, children, interactive = false, ...props }: {
  page: CanvasPage; svgRef?: Ref<SVGSVGElement>; children?: ReactNode; interactive?: boolean;
} & SVGProps<SVGSVGElement>) {
  const clip = `page-${useId().replace(/[^\w-]/g, "")}`;
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${page.width} ${page.height}`} ref={svgRef} aria-label={page.side === "front" ? "Thiết kế mặt trước" : "Thiết kế mặt sau"} {...props}>
    {/* Nền cắt theo khổ trang: khung vẽ để tràn (thấy tay nắm ở mép) nhưng hoa văn nền (vân đá…) không lòi ra ngoài. */}
    <clipPath id={clip}><rect width={page.width} height={page.height} /></clipPath>
    {/* Bộ lọc đổ bóng dùng chung + định nghĩa màu của mẫu, rồi tới nền trang. */}
    <g dangerouslySetInnerHTML={{ __html: SHADOW_DEFS + page.defs + page.background }} pointerEvents="none" clipPath={`url(#${clip})`} />
    {page.objects.filter((object) => !object.hidden).map((object) => <ObjectNode key={object.id} object={object} interactive={interactive} />)}
    {children}
  </svg>;
}
