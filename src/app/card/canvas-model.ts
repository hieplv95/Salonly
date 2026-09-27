export type CanvasObject = {
  id: string;
  name: string;
  markup: string;
  x: number;
  y: number;
  width: number;
  height: number;
  baseWidth: number;
  baseHeight: number;
  rotation: number;
  locked: boolean;
  hidden: boolean;
  qr?: string;
  opacity?: number; // 0.05–1, mặc định 1
  shadow?: boolean; // đổ bóng mềm
  source?: string; // ảnh gốc (data URL) để cắt / bo góc lại mà không giảm chất lượng
};
export type CanvasPage = {
  side: "front" | "back";
  width: number;
  height: number;
  defs: string;
  background: string;
  objects: CanvasObject[];
};
export type CanvasDocument = { version: 1; templateId: string; name: string; pages: CanvasPage[] };
export type TextAnchor = "start" | "middle" | "end";
// text: nhiều dòng thì cách nhau bằng "\n". spacing: giãn chữ (đơn vị như cỡ chữ). lineHeight: khoảng cách dòng (× cỡ chữ).
export type TextProperties = {
  text: string;
  font: string;
  size: number;
  color: string;
  weight: string;
  italic: boolean;
  anchor: TextAnchor;
  spacing: number;
  lineHeight: number;
};

// Bộ lọc đổ bóng dùng chung, luôn có trong mọi trang (xem CanvasSvg).
export const SHADOW_FILTER_ID = "naile-soft-shadow";
export const SHADOW_DEFS = `<defs><filter id="${SHADOW_FILTER_ID}" x="-25%" y="-25%" width="150%" height="150%"><feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#2b211b" flood-opacity="0.35"/></filter></defs>`;

const NS = "http://www.w3.org/2000/svg";
const tags = new Set("g text tspan textPath path rect circle ellipse line polyline polygon defs linearGradient radialGradient stop clipPath mask pattern filter feGaussianBlur feDropShadow image".split(" "));
const attributes = new Set("id x y x1 y1 x2 y2 dx dy cx cy r rx ry d points width height transform fill fill-opacity fill-rule stroke stroke-width stroke-opacity stroke-dasharray stroke-linecap stroke-linejoin opacity font-family font-size font-weight font-style letter-spacing text-anchor dominant-baseline textLength lengthAdjust gradientUnits gradientTransform offset startOffset stop-color stop-opacity flood-color flood-opacity clip-path mask filter stdDeviation preserveAspectRatio href".split(" "));
const parse = (markup: string) => new DOMParser().parseFromString(`<svg xmlns="${NS}">${markup}</svg>`, "image/svg+xml").documentElement;
const serialize = (element: Element) => new XMLSerializer().serializeToString(element);

function normalizedMarkup(markup: string, x: number, y: number) {
  const root = parse(markup);
  let dx = -x, dy = -y;
  // Merge our translation-only wrappers rather than nesting one per keystroke.
  while (root.children.length === 1) {
    const first = root.firstElementChild!;
    const attrs = [...first.attributes].filter((attr) => attr.name !== "xmlns");
    const match = first.getAttribute("transform")?.match(/^translate\(([-\d.e+]+)[ ,]+([-\d.e+]+)\)$/);
    if (first.localName !== "g" || attrs.length !== 1 || !match) break;
    dx += Number(match[1]); dy += Number(match[2]);
    first.replaceWith(...first.childNodes);
  }
  return `<g transform="translate(${dx} ${dy})">${[...root.children].map(serialize).join("")}</g>`;
}

// Only vector drawing attributes and local raster data are accepted, including when restoring a draft.
export function cleanSvg(markup: string): string {
  const root = parse(markup);
  if (root.querySelector("parsererror")) return "";
  root.querySelectorAll('[data-editor-only="true"], script, style, foreignObject').forEach((node) => node.remove());
  for (const node of [...root.querySelectorAll("*")]) {
    if (!tags.has(node.localName)) { node.remove(); continue; }
    for (const attr of [...node.attributes]) {
      const value = attr.value.trim();
      if (!attributes.has(attr.name) || (/url\(/i.test(value) && !/^url\(#[\w:.-]+\)$/.test(value)) || (attr.name === "href" && !/^(#[\w:.-]+|\/flyer\/photos\/[a-zA-Z0-9-]+\.jpg|data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/=]+)$/.test(value))) node.removeAttribute(attr.name);
    }
  }
  return [...root.children].map(serialize).join("");
}

// Các dòng của 1 thẻ <text>: tspan con có x (do trình thiết kế tạo) là 1 dòng; không có thì cả thẻ là 1 dòng.
const lineSpans = (text: Element) => [...text.children].filter((c) => c.localName === "tspan" && c.hasAttribute("x"));
const DEFAULT_LINE_HEIGHT = 1.25;

export function textProperties(object: CanvasObject): TextProperties[] {
  return [...parse(object.markup).querySelectorAll("text")].map((text) => {
    const size = Number(text.getAttribute("font-size")) || 30;
    const spans = lineSpans(text);
    const dy = Number(spans[1]?.getAttribute("dy"));
    return {
      text: spans.length ? spans.map((s) => s.textContent ?? "").join("\n") : (text.textContent ?? ""),
      font: (text.getAttribute("font-family") ?? "Montserrat").replace(/['"]/g, ""),
      size,
      color: text.getAttribute("fill")?.match(/^#[\da-f]{6}$/i)?.[0] ?? "#2b211b",
      weight: text.getAttribute("font-weight") ?? "500",
      italic: text.getAttribute("font-style") === "italic",
      anchor: (["start", "middle", "end"].includes(text.getAttribute("text-anchor") ?? "") ? text.getAttribute("text-anchor") : "start") as TextAnchor,
      spacing: Number(text.getAttribute("letter-spacing")) || 0,
      lineHeight: dy && size ? Math.round((dy / size) * 100) / 100 : DEFAULT_LINE_HEIGHT,
    };
  });
}

// Viết lại nội dung 1 thẻ <text> thành nhiều dòng (tspan cùng x, cách nhau lineHeight × cỡ chữ).
function writeLines(text: Element, value: string, lineHeight: number) {
  const lines = value.split("\n");
  const target = text.querySelector("textPath");
  if (target || lines.length === 1) {
    (target ?? text).textContent = lines.join(" ") || " ";
    return;
  }
  const size = Number(text.getAttribute("font-size")) || 30;
  const x = text.getAttribute("x") ?? "0";
  text.textContent = "";
  lines.forEach((line, i) => {
    const span = text.ownerDocument.createElementNS(NS, "tspan");
    span.setAttribute("x", x);
    span.setAttribute("dy", i ? String(Math.round(size * lineHeight * 10) / 10) : "0");
    span.textContent = line || " ";
    text.append(span);
  });
}

export function objectTransform(object: CanvasObject) {
  return `translate(${object.x + object.width / 2} ${object.y + object.height / 2}) rotate(${object.rotation}) scale(${object.width / object.baseWidth} ${object.height / object.baseHeight}) translate(${-object.baseWidth / 2} ${-object.baseHeight / 2})`;
}

function measureMarkup(markup: string, defs = "") {
  const svg = document.createElementNS(NS, "svg");
  svg.style.cssText = "position:fixed;left:-10000px;top:0;visibility:hidden;overflow:visible";
  const group = document.createElementNS(NS, "g");
  svg.innerHTML = defs;
  group.innerHTML = markup;
  svg.append(group);
  document.body.append(svg);
  try {
    const box = group.getBBox();
    return { x: box.x, y: box.y, width: Math.max(1, box.width), height: Math.max(1, box.height) };
  } finally { svg.remove(); }
}

export function makeObject(markup: string, name: string, page: Pick<CanvasPage, "width" | "height" | "defs">): CanvasObject {
  const clean = cleanSvg(markup);
  const box = measureMarkup(clean, page.defs);
  return {
    id: crypto.randomUUID(), name, markup: normalizedMarkup(clean, box.x, box.y),
    x: (page.width - box.width) / 2, y: (page.height - box.height) / 2,
    width: box.width, height: box.height, baseWidth: box.width, baseHeight: box.height,
    rotation: 0, locked: false, hidden: false,
  };
}

export function editObjectText(object: CanvasObject, index: number, patch: Partial<TextProperties>, defs: string): CanvasObject {
  const root = parse(object.markup);
  const text = root.querySelectorAll("text")[index];
  if (!text) return object;
  const current = textProperties({ ...object, markup: [...root.children].map(serialize).join("") })[index];
  if (patch.font !== undefined) text.setAttribute("font-family", patch.font);
  if (patch.size !== undefined) text.setAttribute("font-size", String(Math.round(patch.size * 10) / 10));
  if (patch.color !== undefined) text.setAttribute("fill", patch.color);
  if (patch.weight !== undefined) text.setAttribute("font-weight", patch.weight);
  if (patch.italic !== undefined) {
    if (patch.italic) text.setAttribute("font-style", "italic");
    else text.removeAttribute("font-style");
  }
  if (patch.anchor !== undefined) text.setAttribute("text-anchor", patch.anchor);
  if (patch.spacing !== undefined) {
    if (patch.spacing) text.setAttribute("letter-spacing", String(Math.round(patch.spacing * 10) / 10));
    else text.removeAttribute("letter-spacing");
  }
  // Nội dung, cỡ chữ hoặc khoảng cách dòng đổi → xếp lại các dòng.
  if (patch.text !== undefined || patch.size !== undefined || patch.lineHeight !== undefined)
    writeLines(text, patch.text ?? current.text, patch.lineHeight ?? current.lineHeight);
  text.removeAttribute("textLength");
  text.removeAttribute("lengthAdjust");
  const markup = [...root.children].map(serialize).join("");
  const box = measureMarkup(markup, defs);
  const sx = object.width / object.baseWidth;
  const sy = object.height / object.baseHeight;
  return { ...object, name: index === 0 && patch.text ? patch.text.replace(/\s*\n\s*/g, " ").slice(0, 45) : object.name,
    markup: normalizedMarkup(markup, box.x, box.y),
    width: box.width * sx, height: box.height * sy, baseWidth: box.width, baseHeight: box.height };
}

export function recolorObject(object: CanvasObject, color: string): CanvasObject {
  const root = parse(object.markup);
  for (const node of root.querySelectorAll("*")) {
    for (const attr of ["fill", "stroke"]) {
      const value = node.getAttribute(attr);
      if (value && value !== "none" && value !== "transparent" && !value.startsWith("url(")) node.setAttribute(attr, color);
    }
  }
  return { ...object, markup: [...root.children].map(serialize).join("") };
}

// Tên lớp tự đặt cho mẫu chưa đánh dấu lớp (logo, voucher): theo chữ bên trong hoặc loại hình.
function autoLabel(el: Element) {
  const text = el.localName === "text" ? el.textContent : el.querySelector("text")?.textContent;
  if (text?.trim()) return `Chữ: ${text.trim().slice(0, 40)}`;
  if (el.localName === "image" || el.querySelector("image")) return "Ảnh";
  return ({ circle: "Hình tròn", ellipse: "Hình tròn", rect: "Khung / dải màu", path: "Họa tiết", line: "Đường kẻ", polygon: "Hình khối" } as Record<string, string>)[el.localName] ?? "Biểu tượng / nhóm hình";
}

// Nền phủ kín trang (rect 0,0 cùng kích thước) → nằm trong nền, không phải lớp kéo được.
const isFullRect = (el: Element, width: number, height: number) =>
  el.localName === "rect" && Number(el.getAttribute("width")) === width && Number(el.getAttribute("height")) === height &&
  !Number(el.getAttribute("x") ?? 0) && !Number(el.getAttribute("y") ?? 0);

// Chụp bản xem trước (SVG) thành tài liệu chỉnh sửa được. Mẫu thẻ tích điểm đánh dấu sẵn lớp
// (data-card-layer-id); mẫu khác (logo, voucher) thì mỗi thành phần cấp cao nhất là 1 lớp,
// trừ nền phủ kín trang và phần có data-canvas-bg (VD: vân đá cẩm thạch).
export function captureCardDocument(templateId: string, name: string, roots: SVGSVGElement[], qrValue = ""): CanvasDocument {
  const pages = roots.map((root, index): CanvasPage => {
    const width = root.viewBox.baseVal.width;
    const height = root.viewBox.baseVal.height;
    const defs = cleanSvg([...root.querySelectorAll("defs")].map(serialize).join(""));
    const marked = !!root.querySelector(":scope > [data-card-layer-id], :scope > [data-card-element-id]");
    const objects: CanvasObject[] = [];
    const background: string[] = [];
    for (const child of [...root.children]) {
      if (child.localName === "defs" || child.hasAttribute("data-editor-only")) continue;
      const copy = child.cloneNode(true) as Element;
      copy.querySelectorAll("defs").forEach((node) => node.remove());
      const markup = cleanSvg(serialize(copy));
      if (!markup) continue;
      const isBackground = marked
        ? !child.hasAttribute("data-card-layer-id") && !child.hasAttribute("data-card-element-id")
        : child.hasAttribute("data-canvas-bg") || isFullRect(child, width, height);
      if (isBackground) { background.push(markup); continue; }
      const object = makeObject(markup, child.getAttribute("data-card-layer-label") ?? (marked ? child.textContent?.trim().slice(0, 45) : autoLabel(child)) ?? "Thành phần", { width, height, defs });
      const box = measureMarkup(markup, defs);
      objects.push({ ...object, x: box.x, y: box.y, ...(child.querySelector('[data-card-semantic="qr"]') ? { qr: qrValue } : {}) });
    }
    const side = root.dataset.cardSide === "back" || (!root.dataset.cardSide && index > 0) ? "back" : "front";
    return { side, width, height, defs, background: background.join(""), objects };
  });
  return { version: 1, templateId, name, pages };
}

/* ---------- Màu nền trang ---------- */

// Màu của lớp nền phủ kín trang (nếu có).
export function backgroundColor(page: CanvasPage): string | null {
  const rect = [...parse(page.background).children].find((el) => isFullRect(el, page.width, page.height));
  const fill = rect?.getAttribute("fill");
  return fill && /^#[\da-f]{6}$/i.test(fill) ? fill : null;
}

// Chỉ đổi màu lớp nền phủ kín trang, giữ nguyên hoa văn nền của mẫu (vân đá, chuyển sắc…).
export function setBackgroundColor(page: CanvasPage, color: string): CanvasPage {
  const root = parse(page.background);
  const rect = [...root.children].find((el) => isFullRect(el, page.width, page.height));
  if (rect) {
    rect.setAttribute("fill", color);
    rect.removeAttribute("fill-opacity");
    return { ...page, background: [...root.children].map(serialize).join("") };
  }
  return { ...page, background: `<rect width="${page.width}" height="${page.height}" fill="${color}"/>${page.background}` };
}

// Chỗ đặt thành phần mới: giữa trang, lệch dần xuống nếu đã có thành phần đúng chỗ đó (tránh chồng lên nhau).
export function freeSpot(page: CanvasPage, width: number, height: number) {
  let x = (page.width - width) / 2;
  let y = (page.height - height) / 2;
  const step = Math.max(16, Math.min(page.width, page.height) * 0.04);
  for (let i = 0; i < 12 && page.objects.some((o) => Math.abs(o.x - x) < 4 && Math.abs(o.y - y) < 4); i++) {
    x = Math.min(page.width - width, x + step);
    y = Math.min(page.height - height, y + step);
  }
  return { x, y };
}

const finite = (value: unknown, fallback: number) => typeof value === "number" && Number.isFinite(value) ? value : fallback;
export function restoreDocument(value: unknown): CanvasDocument | null {
  if (!value || typeof value !== "object") return null;
  const doc = value as CanvasDocument;
  if (doc.version !== 1 || typeof doc.templateId !== "string" || !Array.isArray(doc.pages) || !doc.pages.length) return null;
  return { version: 1, templateId: doc.templateId, name: typeof doc.name === "string" ? doc.name : "Thiết kế thẻ", pages: doc.pages.slice(0, 2).map((page, i) => ({
    side: i === 0 ? "front" : "back", width: Math.max(100, finite(page.width, 1050)), height: Math.max(100, finite(page.height, 600)),
    defs: cleanSvg(typeof page.defs === "string" ? page.defs : ""), background: cleanSvg(typeof page.background === "string" ? page.background : ""),
    objects: (Array.isArray(page.objects) ? page.objects : []).slice(0, 250).filter((o) => o && typeof o.markup === "string").map((o) => ({
      id: typeof o.id === "string" ? o.id : crypto.randomUUID(), name: typeof o.name === "string" ? o.name : "Thành phần", markup: cleanSvg(o.markup),
      x: finite(o.x, 0), y: finite(o.y, 0), width: Math.max(1, finite(o.width, 100)), height: Math.max(1, finite(o.height, 50)),
      baseWidth: Math.max(1, finite(o.baseWidth, 100)), baseHeight: Math.max(1, finite(o.baseHeight, 50)), rotation: finite(o.rotation, 0), locked: !!o.locked, hidden: !!o.hidden,
      ...(typeof o.qr === "string" ? { qr: o.qr.slice(0, 1000) } : {}),
      ...(typeof o.opacity === "number" && o.opacity < 1 ? { opacity: Math.max(0.05, Math.min(1, finite(o.opacity, 1))) } : {}),
      ...(o.shadow ? { shadow: true } : {}),
      ...(typeof o.source === "string" && /^data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(o.source) ? { source: o.source } : {}),
    })),
  })) };
}

export async function canvasDraft(action: "read" | "write" | "delete", templateId: string, doc?: CanvasDocument): Promise<CanvasDocument | null> {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("naile-canvas", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("designs");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction("designs", action === "read" ? "readonly" : "readwrite");
      const store = transaction.objectStore("designs");
      const request = action === "read" ? store.get(templateId) : action === "write" ? store.put(doc, templateId) : store.delete(templateId);
      let result: CanvasDocument | null = null;
      request.onsuccess = () => {
        if (action === "read") {
          try { result = restoreDocument(request.result); } catch { reject(new Error("Không đọc được bản thiết kế đã lưu.")); }
        }
      };
      transaction.oncomplete = () => resolve(result);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally { db.close(); }
}

/* ---------- Nhóm / tách nhóm ---------- */

// Tạo lớp từ nét vẽ đang ở toạ độ trang: đặt đúng vị trí đang thấy (không dời vào giữa).
export function objectFromPageMarkup(markup: string, name: string, page: Pick<CanvasPage, "width" | "height" | "defs">): CanvasObject {
  const clean = cleanSvg(markup);
  const box = measureMarkup(clean, page.defs);
  return { ...makeObject(clean, name, page), x: box.x, y: box.y };
}

// Gộp nhiều lớp thành 1 nhóm (giữ nguyên vị trí, góc xoay, độ mờ của từng lớp).
export function groupObjects(objects: CanvasObject[], page: CanvasPage): CanvasObject {
  const markup = objects
    .map((o) => `<g transform="${objectTransform(o)}"${o.opacity !== undefined && o.opacity < 1 ? ` opacity="${o.opacity}"` : ""}>${o.markup}</g>`)
    .join("");
  return objectFromPageMarkup(markup, `Nhóm ${objects.length} thành phần`, page);
}

// Tách nhóm thành các lớp như trước khi gộp (góc xoay / phóng to của nhóm được giữ trong từng lớp).
export function ungroupObject(group: CanvasObject, page: CanvasPage): CanvasObject[] {
  let el: Element = parse(group.markup);
  const wrappers: string[] = [];
  // Bỏ qua các lớp bọc chỉ dịch chuyển do trình thiết kế thêm vào.
  while (el.children.length === 1) {
    const first = el.firstElementChild!;
    const t = first.getAttribute("transform") ?? "";
    if (first.localName !== "g" || first.attributes.length !== 1 || !/^translate\(/.test(t)) break;
    wrappers.push(t);
    el = first;
  }
  const kids = [...el.children];
  if (kids.length < 2) return [group];
  const open = wrappers.map((t) => `<g transform="${t}">`).join("");
  const close = "</g>".repeat(wrappers.length);
  return kids.map((kid) => objectFromPageMarkup(`<g transform="${objectTransform(group)}">${open}${serialize(kid)}${close}</g>`, autoLabel(kid), page));
}

/* ---------- Căn chỉnh ---------- */

export type AlignMode = "left" | "center" | "right" | "top" | "middle" | "bottom";

// 1 lớp: căn theo trang. Nhiều lớp: căn theo khung bao quanh cả nhóm đang chọn.
export function alignObjects(objects: CanvasObject[], mode: AlignMode, page: CanvasPage): CanvasObject[] {
  const single = objects.length === 1;
  const left = single ? 0 : Math.min(...objects.map((o) => o.x));
  const top = single ? 0 : Math.min(...objects.map((o) => o.y));
  const right = single ? page.width : Math.max(...objects.map((o) => o.x + o.width));
  const bottom = single ? page.height : Math.max(...objects.map((o) => o.y + o.height));
  return objects.map((o) => {
    if (o.locked) return o;
    switch (mode) {
      case "left": return { ...o, x: left };
      case "center": return { ...o, x: (left + right - o.width) / 2 };
      case "right": return { ...o, x: right - o.width };
      case "top": return { ...o, y: top };
      case "middle": return { ...o, y: (top + bottom - o.height) / 2 };
      case "bottom": return { ...o, y: bottom - o.height };
    }
  });
}

// Chia đều khoảng cách giữa các lớp (từ 3 lớp trở lên) theo chiều ngang hoặc dọc.
export function distributeObjects(objects: CanvasObject[], axis: "x" | "y"): CanvasObject[] {
  if (objects.length < 3) return objects;
  const size = axis === "x" ? "width" : "height";
  const sorted = [...objects].sort((a, b) => a[axis] - b[axis]);
  const start = sorted[0][axis];
  const end = sorted[sorted.length - 1][axis] + sorted[sorted.length - 1][size];
  const gap = (end - start - sorted.reduce((sum, o) => sum + o[size], 0)) / (sorted.length - 1);
  let pos = start;
  const placed = new Map<string, number>();
  for (const o of sorted) {
    placed.set(o.id, pos);
    pos += o[size] + gap;
  }
  return objects.map((o) => (o.locked ? o : { ...o, [axis]: placed.get(o.id)! }));
}

/* ---------- Đường gióng thông minh ---------- */

type Box = { x: number; y: number; width: number; height: number };
export type Guides = { x: number[]; y: number[] };

// Kéo khung "box" tới (x, y): hít vào mép / tâm trang và mép / tâm các lớp khác nếu gần hơn "tolerance".
export function snapBox(box: Box, x: number, y: number, others: Box[], page: Pick<CanvasPage, "width" | "height">, tolerance: number) {
  const targetsX = [0, page.width / 2, page.width, ...others.flatMap((o) => [o.x, o.x + o.width / 2, o.x + o.width])];
  const targetsY = [0, page.height / 2, page.height, ...others.flatMap((o) => [o.y, o.y + o.height / 2, o.y + o.height])];
  const snap = (start: number, length: number, targets: number[]) => {
    let best: { delta: number; line: number } | null = null;
    for (const edge of [start, start + length / 2, start + length]) {
      for (const t of targets) {
        const delta = t - edge;
        if (Math.abs(delta) <= tolerance && (!best || Math.abs(delta) < Math.abs(best.delta))) best = { delta, line: t };
      }
    }
    return best;
  };
  const sx = snap(x, box.width, targetsX);
  const sy = snap(y, box.height, targetsY);
  return {
    x: x + (sx?.delta ?? 0),
    y: y + (sy?.delta ?? 0),
    guides: { x: sx ? [sx.line] : [], y: sy ? [sy.line] : [] } as Guides,
  };
}

// Số thành phần bên trong 1 lớp (≥2 thì tách nhóm được).
export function groupSize(object: CanvasObject) {
  let el: Element = parse(object.markup);
  while (el.children.length === 1 && el.firstElementChild!.localName === "g" && el.firstElementChild!.attributes.length === 1 && /^translate\(/.test(el.firstElementChild!.getAttribute("transform") ?? "")) el = el.firstElementChild!;
  return el.children.length;
}

// Ảnh trong 1 lớp (lớp chỉ gồm 1 ảnh): nguồn và kích thước, để cắt / xoá nền.
export function imageOf(object: CanvasObject): { href: string; width: number; height: number } | null {
  const images = parse(object.markup).querySelectorAll("image");
  if (images.length !== 1) return null;
  const img = images[0];
  return { href: img.getAttribute("href") ?? "", width: Number(img.getAttribute("width")) || 1, height: Number(img.getAttribute("height")) || 1 };
}

// Đổi ảnh chụp trong một khung mẫu mà vẫn giữ vị trí, đường cắt và viền của khung.
export function replaceImageSource(object: CanvasObject, href: string): CanvasObject {
  const root = parse(object.markup);
  const images = root.querySelectorAll("image");
  if (images.length !== 1) return object;
  images[0].setAttribute("href", href);
  return { ...object, markup: [...root.children].map(serialize).join(""), source: href };
}

// Thay ảnh trong lớp (sau khi cắt / xoá nền): giữ vị trí tâm và bề rộng đang hiển thị.
export function replaceImage(object: CanvasObject, href: string, width: number, height: number, source?: string): CanvasObject {
  const displayWidth = object.width;
  const displayHeight = (displayWidth * height) / width;
  return {
    ...object,
    markup: `<g transform="translate(0 0)"><image width="${width}" height="${height}" href="${href}"/></g>`,
    baseWidth: width,
    baseHeight: height,
    width: displayWidth,
    height: displayHeight,
    y: object.y + (object.height - displayHeight) / 2,
    ...(source ? { source } : {}),
  };
}
