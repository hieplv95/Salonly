"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { LOGO_ICONS } from "@/lib/logo-templates";
import { downloadDesign, type ExportKind } from "../design/export";
import { EXPORT_OPTIONS } from "../design/ExportBar";
import { useBackClose } from "../use-back-close";
import { LogoIcon } from "../logo/LogoSvg";
import { CanvasSvg } from "./CanvasSvg";
import { ImageCropper } from "./ImageCropper";
import { removeImageBackground } from "./remove-bg";
import {
  alignObjects,
  backgroundColor,
  distributeObjects,
  editObjectText,
  freeSpot,
  groupObjects,
  groupSize,
  imageOf,
  makeObject,
  recolorObject,
  replaceImage,
  replaceImageSource,
  restoreDocument,
  setBackgroundColor,
  snapBox,
  textProperties,
  ungroupObject,
  type AlignMode,
  type CanvasDocument,
  type CanvasObject,
  type Guides,
  type TextProperties,
} from "./canvas-model";
import { CANVAS_ASSETS, CANVAS_FONTS, CANVAS_FRAMES, TEXT_PRESETS, brandPalette, imageMarkup, qrMarkup } from "./canvas-assets";
import css from "./CanvasEditor.module.css";

// Cấu hình theo loại thiết kế (thẻ tích điểm, logo, voucher): nhãn, tên file, khổ xuất.
export type EditorConfig = {
  title: string; // tên hộp thoại (cho trình đọc màn hình)
  backLabel: string; // nút quay lại
  fileBase: string; // tên file mặc định khi tải
  exportScale: number; // khổ xuất = khổ trang × exportScale
  dpi: number; // để PDF đúng khổ in
  pdfLabel: string;
  hint: string; // gợi ý khi chưa chọn thành phần
  subject?: string; // tên vật phẩm trong hướng dẫn, mặc định là thẻ
  pageNames?: string[]; // tên từng trang; mặc định "Mặt trước" / "Mặt sau"
};

export const CARD_EDITOR: EditorConfig = {
  title: "Trình thiết kế thẻ",
  backLabel: "Về mẫu thẻ",
  fileBase: "the-tich-diem",
  exportScale: 2,
  dpi: 600,
  pdfLabel: "PDF · In 2 mặt",
  hint: "Chọn chữ, logo, ô tích điểm hoặc mã QR để chỉnh. Mỗi mặt có bố cục riêng.",
};

type Point = { x: number; y: number };
type Gesture =
  | { kind: "move"; start: Point; originals: CanvasObject[]; before: CanvasDocument; pointerId: number }
  | { kind: "transform"; mode: string; start: Point; object: CanvasObject; before: CanvasDocument; pointerId: number }
  | { kind: "marquee"; start: Point; base: string[]; pointerId: number };

const rotate = (p: Point, angle: number): Point => {
  const r = (angle * Math.PI) / 180;
  return { x: p.x * Math.cos(r) - p.y * Math.sin(r), y: p.x * Math.sin(r) + p.y * Math.cos(r) };
};
const round = (value: number) => Math.round(value * 10) / 10;
// Chỉ gọi trong xử lý sự kiện (gộp bước hoàn tác), không gọi lúc vẽ.
const clock = () => Date.now();
const overlaps = (a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; w: number; h: number }) =>
  a.x < b.x + b.w && a.x + a.width > b.x && a.y < b.y + b.h && a.y + a.height > b.y;

/* ---------- Bộ nhớ tạm sao chép / dán (dùng chung giữa thẻ, logo, voucher) ---------- */

const CLIP_KEY = "naile-canvas-clipboard";
const clip: { items: CanvasObject[] } = { items: [] };
function writeClipboard(items: CanvasObject[], persist = true) {
  clip.items = items;
  if (!persist) return;
  try {
    localStorage.setItem(CLIP_KEY, JSON.stringify(items));
  } catch {}
}
function readClipboard(): CanvasObject[] {
  if (clip.items.length) return clip.items;
  try {
    // Làm sạch lại như khi mở bản lưu (không tin nội dung trong bộ nhớ trình duyệt).
    const objects = JSON.parse(localStorage.getItem(CLIP_KEY) ?? "[]");
    return restoreDocument({ version: 1, templateId: "clipboard", name: "", pages: [{ width: 1000, height: 1000, defs: "", background: "", objects }] })?.pages[0].objects ?? [];
  } catch {
    return [];
  }
}

const ALIGN_BUTTONS: [AlignMode, string, string][] = [
  ["left", "⇤", "Căn trái"],
  ["center", "↔", "Căn giữa ngang"],
  ["right", "⇥", "Căn phải"],
  ["top", "⤒", "Căn trên"],
  ["middle", "↕", "Căn giữa dọc"],
  ["bottom", "⤓", "Căn dưới"],
];

export function CanvasEditor({ initial, onChange, onClose, config = CARD_EDITOR }: {
  initial: CanvasDocument;
  onChange: (doc: CanvasDocument) => Promise<void>;
  onClose: () => void;
  config?: EditorConfig;
}) {
  const [doc, setDoc] = useState(initial);
  const current = useRef(initial);
  const history = useRef<{ past: CanvasDocument[]; future: CanvasDocument[] }>({ past: [], future: [] });
  const [historyState, setHistoryState] = useState({ past: 0, future: 0 });
  const [pageIndex, setPageIndex] = useState(0);
  const [selection, setSelection] = useState<string[]>([]);
  const [panel, setPanel] = useState<"add" | "layers">("add");
  const [sheet, setSheet] = useState<"add" | "layers" | "edit" | null>(null); // bảng trượt trên điện thoại
  const [zoom, setZoom] = useState(100);
  const [fitWidth, setFitWidth] = useState(680);
  const [saveState, setSaveState] = useState("Đã lưu trên trình duyệt này");
  const [busy, setBusy] = useState<ExportKind | "">("");
  const [aiBusy, setAiBusy] = useState(false);
  const [error, setError] = useState("");
  const [inline, setInline] = useState<{ id: string; index: number; value: string } | null>(null);
  const [guides, setGuides] = useState<Guides>({ x: [], y: [] });
  const [marquee, setMarquee] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [exportKind, setExportKind] = useState<ExportKind>("pdf");
  const [exportOpen, setExportOpen] = useState(false);
  const exportOption = EXPORT_OPTIONS.find((o) => o.id === exportKind)!;
  const pdfDetail = config.pdfLabel.replace(/^PDF( · )?/, "");
  const [qrValue, setQrValue] = useState("https://");
  const [cropping, setCropping] = useState<{ id: string; src: string } | null>(null);
  const [palette] = useState(brandPalette);
  const surface = useRef<SVGSVGElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const workspace = useRef<HTMLDivElement>(null);
  const upload = useRef<HTMLInputElement>(null);
  const replaceUpload = useRef<HTMLInputElement>(null);
  const exportRefs = useRef<(SVGSVGElement | null)[]>([]);
  const gesture = useRef<Gesture | null>(null);
  const saveRevision = useRef(0);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastMerge = useRef({ key: "", at: 0 });
  const touches = useRef(new Map<number, Point>());
  const pinch = useRef<{ dist: number; zoom: number } | null>(null);

  const page = doc.pages[pageIndex];
  const chosen = page.objects.filter((o) => selection.includes(o.id));
  const selected = chosen.length === 1 ? chosen[0] : null;
  const texts = selected ? textProperties(selected) : [];
  const image = selected ? imageOf(selected) : null;
  const canUngroup = !!selected && !selected.locked && groupSize(selected) > 1;
  // Cỡ chữ hiển thị = cỡ gốc × tỉ lệ phóng theo chiều cao (kéo giãn ngang không làm chữ cao hơn).
  const textScale = selected ? selected.height / selected.baseHeight : 1;
  const pageName = (side: "front" | "back", index: number) => config.pageNames?.[index] ?? (side === "front" ? "Mặt trước" : "Mặt sau");
  const canvasWidth = (fitWidth * zoom) / 100;
  const displayScale = canvasWidth / page.width;
  const handleSize = 9 / displayScale;

  /* ---------- Lịch sử & lưu ---------- */

  const display = (next: CanvasDocument) => {
    current.current = next;
    setDoc(next);
  };
  // Lưu trễ một nhịp: gõ chữ / kéo bảng màu liên tục chỉ ghi vào trình duyệt 1 lần.
  const save = (next: CanvasDocument) => {
    const revision = ++saveRevision.current;
    setSaveState("Đang lưu…");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void onChange(next)
        .then(() => {
          if (revision === saveRevision.current) setSaveState("Đã lưu trên trình duyệt này");
        })
        .catch(() => {
          if (revision === saveRevision.current) setSaveState("Chưa lưu được — hãy tải file trước khi đóng");
        });
    }, 350);
  };
  // merge: các thay đổi liên tiếp cùng 1 ô (gõ chữ, kéo bảng màu, bấm mũi tên) gộp thành 1 bước hoàn tác.
  const commit = (next: CanvasDocument, before = current.current, merge = "") => {
    if (next === before) return;
    const now = clock();
    const same = merge && lastMerge.current.key === merge && now - lastMerge.current.at < 1500;
    lastMerge.current = { key: merge, at: now };
    if (!same) {
      history.current.past = [...history.current.past.slice(-59), before];
      history.current.future = [];
      setHistoryState({ past: history.current.past.length, future: 0 });
    }
    display(next);
    save(next);
  };
  const undo = (forward = false) => {
    const stack = history.current;
    const next = (forward ? stack.future : stack.past).pop();
    if (!next) return;
    (forward ? stack.past : stack.future).push(current.current);
    setHistoryState({ past: stack.past.length, future: stack.future.length });
    setInline(null);
    lastMerge.current = { key: "", at: 0 };
    display(next);
    save(next);
  };

  /* ---------- Sửa lớp ---------- */

  const mapPage = (fn: (objects: CanvasObject[]) => CanvasObject[], source = current.current) => ({
    ...source,
    pages: source.pages.map((p, i) => (i !== pageIndex ? p : { ...p, objects: fn(p.objects) })),
  });
  const replaceObjects = (list: CanvasObject[], source = current.current) => {
    const byId = new Map(list.map((o) => [o.id, o]));
    return mapPage((objects) => objects.map((o) => byId.get(o.id) ?? o), source);
  };
  const replaceObject = (object: CanvasObject, source = current.current) => replaceObjects([object], source);
  const latest = (id: string | undefined) => current.current.pages[pageIndex].objects.find((o) => o.id === id);
  const patchObject = (patch: Partial<CanvasObject>, merge = "") => {
    if (selected && !selected.locked) commit(replaceObject({ ...selected, ...patch }), undefined, merge);
  };
  const editText = (index: number, patch: Partial<TextProperties>) => {
    const object = latest(selected?.id);
    if (object && !object.locked) commit(replaceObject(editObjectText(object, index, patch, page.defs)), undefined, `text:${object.id}:${index}:${Object.keys(patch).join(",")}`);
  };
  // Đổi màu theo bảng màu: chữ → màu chữ; hình → màu toàn bộ; không chọn gì → màu nền trang.
  const applyColor = (color: string) => {
    if (!selected) return commit({ ...doc, pages: doc.pages.map((p, i) => (i === pageIndex ? setBackgroundColor(p, color) : p)) }, undefined, `bg:${pageIndex}`);
    if (selected.locked || image || selected.qr !== undefined) return;
    if (texts.length) {
      let next = selected;
      texts.forEach((_, i) => (next = editObjectText(next, i, { color }, page.defs)));
      return commit(replaceObject(next), undefined, `recolor:${selected.id}`);
    }
    commit(replaceObject(recolorObject(selected, color)), undefined, `recolor:${selected.id}`);
  };

  const deleteSelected = () => {
    const ids = new Set(chosen.filter((o) => !o.locked).map((o) => o.id));
    if (!ids.size) return;
    commit(mapPage((objects) => objects.filter((o) => !ids.has(o.id))));
    setSelection([]);
  };
  const duplicate = () => {
    if (!chosen.length) return;
    const copies = chosen.map((o) => ({ ...o, id: crypto.randomUUID(), name: `${o.name} (bản sao)`, x: o.x + 20, y: o.y + 20, locked: false }));
    commit(mapPage((objects) => [...objects, ...copies]));
    setSelection(copies.map((c) => c.id));
  };
  const copy = () => {
    if (!chosen.length) return;
    writeClipboard(chosen.map((o) => ({ ...o })));
  };
  const paste = () => {
    const items = readClipboard();
    if (!items.length) return;
    if (page.objects.length + items.length > 250) return setError("Mỗi mặt tối đa 250 thành phần.");
    const copies = items.map((o) => ({ ...o, id: crypto.randomUUID(), locked: false, x: Math.min(page.width - 20, o.x + 20), y: Math.min(page.height - 20, o.y + 20) }));
    writeClipboard(copies, false); // dán lần nữa thì lệch tiếp, không chồng lên nhau
    commit(mapPage((objects) => [...objects, ...copies]));
    setSelection(copies.map((c) => c.id));
  };
  const group = () => {
    const items = chosen.filter((o) => !o.locked);
    if (items.length < 2) return;
    const grouped = groupObjects(items, page);
    const ids = new Set(items.map((o) => o.id));
    commit(
      mapPage((objects) => {
        const last = Math.max(...objects.map((o, i) => (ids.has(o.id) ? i : -1)));
        return objects.flatMap((o, i) => (i === last ? [grouped] : ids.has(o.id) ? [] : [o]));
      }),
    );
    setSelection([grouped.id]);
  };
  const ungroup = () => {
    if (!selected || !canUngroup) return;
    const parts = ungroupObject(selected, page).map((p) => ({ ...p, opacity: selected.opacity, shadow: selected.shadow }));
    if (parts.length < 2) return;
    commit(mapPage((objects) => objects.flatMap((o) => (o.id === selected.id ? parts : [o]))));
    setSelection(parts.map((p) => p.id));
  };
  const align = (mode: AlignMode) => chosen.length && commit(replaceObjects(alignObjects(chosen, mode, page)));
  const distribute = (axis: "x" | "y") => chosen.length > 2 && commit(replaceObjects(distributeObjects(chosen, axis)));
  const reorder = (delta: number) => {
    if (!selected || selected.locked) return;
    const objects = [...page.objects];
    const index = objects.findIndex((o) => o.id === selected.id);
    const target = Math.max(0, Math.min(objects.length - 1, index + delta));
    if (target === index) return;
    objects.splice(index, 1);
    objects.splice(target, 0, selected);
    commit({ ...doc, pages: doc.pages.map((p, i) => (i === pageIndex ? { ...p, objects } : p)) });
  };

  /* ---------- Thêm thành phần ---------- */

  const add = (markup: string, name: string, extra: Partial<CanvasObject> = {}) => {
    if (page.objects.length >= 250) return setError("Mỗi mặt tối đa 250 thành phần.");
    const object = { ...makeObject(markup, name, page), ...extra };
    const scale = Math.min(1, (page.width * 0.6) / object.width, (page.height * 0.6) / object.height);
    object.width *= scale;
    object.height *= scale;
    Object.assign(object, freeSpot(page, object.width, object.height));
    commit(mapPage((objects) => [...objects, object]));
    setSelection([object.id]);
    setSheet((s) => (s === "add" ? null : s));
  };
  const addQr = () => {
    if (!qrValue.trim() || qrValue.trim() === "https://") return setError("Điền đường dẫn cho mã QR.");
    try {
      add(qrMarkup(qrValue), "Mã QR", { qr: qrValue });
      setError("");
    } catch {
      setError("Nội dung QR quá dài, hãy dùng đường dẫn ngắn hơn.");
    }
  };
  const changeQr = (value: string) => {
    if (!selected || selected.locked || !value.trim()) return;
    try {
      const fresh = makeObject(qrMarkup(value), "Mã QR", page);
      commit(replaceObject({ ...selected, markup: fresh.markup, baseWidth: fresh.baseWidth, baseHeight: fresh.baseHeight, qr: value }));
      setError("");
    } catch {
      setError("Không tạo được mã QR cho nội dung này.");
    }
  };

  /* ---------- Ảnh: cắt / bo góc / xoá nền ---------- */

  const applyCrop = (url: string, width: number, height: number) => {
    const object = latest(cropping?.id);
    setCropping(null);
    if (object) commit(replaceObject(replaceImage(object, url, width, height, object.source ?? imageOf(object)?.href)));
  };
  const removeBg = async () => {
    if (!selected || !image || aiBusy) return;
    const id = selected.id;
    setAiBusy(true);
    setError("");
    try {
      // Xoá nền trên ảnh đang hiển thị (giữ phần đã cắt); kết quả thành ảnh gốc mới để cắt tiếp.
      const out = await removeImageBackground(image.href);
      const object = latest(id);
      if (object) commit(replaceObject(replaceImage(object, out.url, out.width, out.height, out.url)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chưa xoá được nền ảnh.");
    } finally {
      setAiBusy(false);
    }
  };

  /* ---------- Chuột / cảm ứng trên khung vẽ ---------- */

  const point = (event: ReactPointerEvent<SVGSVGElement>) => {
    const matrix = event.currentTarget.getScreenCTM();
    if (!matrix) return null;
    return new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
  };
  const pointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (event.button !== 0 || inline || pinch.current) return;
    event.currentTarget.focus();
    const start = point(event);
    if (!start) return;
    const target = event.target as Element;
    const before = current.current;
    const handle = target.closest("[data-handle]")?.getAttribute("data-handle");
    const capture = () => {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
    };
    // Kéo nút góc / nút xoay của lớp đang chọn.
    if (handle && selected) {
      if (selected.locked) return;
      capture();
      gesture.current = { kind: "transform", mode: handle, start, object: selected, before, pointerId: event.pointerId };
      return;
    }
    const id = target.closest("[data-scene-id]")?.getAttribute("data-scene-id") ?? null;
    // Bấm vào chỗ trống: kéo khung để chọn nhiều lớp (giữ Shift để chọn thêm).
    if (!id) {
      const base = event.shiftKey ? selection : [];
      setSelection(base);
      capture();
      gesture.current = { kind: "marquee", start, base, pointerId: event.pointerId };
      return;
    }
    const next = event.shiftKey ? (selection.includes(id) ? selection.filter((s) => s !== id) : [...selection, id]) : selection.includes(id) ? selection : [id];
    setSelection(next);
    if (event.shiftKey && !next.includes(id)) return;
    const movable = before.pages[pageIndex].objects.filter((o) => next.includes(o.id) && !o.locked);
    if (!movable.length) return;
    capture();
    gesture.current = { kind: "move", start, originals: movable, before, pointerId: event.pointerId };
  };
  const pointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    const g = gesture.current;
    if (!g || event.pointerId !== g.pointerId) return;
    const p = point(event);
    if (!p) return;
    const dx = p.x - g.start.x;
    const dy = p.y - g.start.y;
    if (g.kind === "marquee") {
      const rect = { x: Math.min(g.start.x, p.x), y: Math.min(g.start.y, p.y), w: Math.abs(dx), h: Math.abs(dy) };
      setMarquee(rect);
      const hits = page.objects.filter((o) => !o.hidden && !o.locked && overlaps(o, rect)).map((o) => o.id);
      setSelection([...new Set([...g.base, ...hits])]);
      return;
    }
    if (Math.abs(dx) + Math.abs(dy) < 1) return;
    if (g.kind === "move") {
      // Hít vào mép / tâm trang và các lớp khác (giữ Alt để tắt).
      const box = {
        x: Math.min(...g.originals.map((o) => o.x)),
        y: Math.min(...g.originals.map((o) => o.y)),
        width: Math.max(...g.originals.map((o) => o.x + o.width)) - Math.min(...g.originals.map((o) => o.x)),
        height: Math.max(...g.originals.map((o) => o.y + o.height)) - Math.min(...g.originals.map((o) => o.y)),
      };
      const ids = new Set(g.originals.map((o) => o.id));
      const others = page.objects.filter((o) => !ids.has(o.id) && !o.hidden);
      const snapped = event.altKey ? { x: box.x + dx, y: box.y + dy, guides: { x: [], y: [] } } : snapBox(box, box.x + dx, box.y + dy, others, page, 6 / displayScale);
      setGuides(snapped.guides);
      const mx = snapped.x - box.x;
      const my = snapped.y - box.y;
      display(replaceObjects(g.originals.map((o) => ({ ...o, x: round(o.x + mx), y: round(o.y + my) })), g.before));
      return;
    }
    const o = g.object;
    let next = { ...o };
    if (g.mode === "rotate") {
      const cx = o.x + o.width / 2;
      const cy = o.y + o.height / 2;
      let angle = o.rotation + ((Math.atan2(p.y - cy, p.x - cx) - Math.atan2(g.start.y - cy, g.start.x - cx)) * 180) / Math.PI;
      if (event.shiftKey) angle = Math.round(angle / 15) * 15;
      next.rotation = round(angle);
    } else {
      const sx = g.mode.includes("e") ? 1 : -1;
      const sy = g.mode.includes("s") ? 1 : -1;
      const delta = rotate({ x: dx, y: dy }, -o.rotation);
      const factor = Math.max(12 / Math.min(o.width, o.height), 1 + (delta.x * sx * o.width + delta.y * sy * o.height) / (o.width ** 2 + o.height ** 2));
      const width = o.width * factor;
      const height = o.height * factor;
      const shift = rotate({ x: (sx * (width - o.width)) / 2, y: (sy * (height - o.height)) / 2 }, o.rotation);
      next = { ...o, width, height, x: o.x + o.width / 2 + shift.x - width / 2, y: o.y + o.height / 2 + shift.y - height / 2 };
    }
    display(replaceObject(next, g.before));
  };
  const finishGesture = (cancel = false) => {
    const g = gesture.current;
    if (!g) return;
    gesture.current = null;
    setGuides({ x: [], y: [] });
    if (g.kind === "marquee") return setMarquee(null);
    if (cancel) display(g.before);
    else if (current.current !== g.before) commit(current.current, g.before);
  };
  // Nút Back của điện thoại: đóng bảng trượt đang mở, rồi mới thoát trình thiết kế.
  useBackClose(true, () => {
    finishGesture();
    onClose();
  });
  useBackClose(sheet !== null, () => setSheet(null));
  // Hai ngón tay trên khung vẽ: chụm / mở để thu phóng.
  const touchStart = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "touch") return;
    touches.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (touches.current.size === 2) {
      finishGesture(true);
      const [a, b] = [...touches.current.values()];
      pinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom };
    }
  };
  const touchMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!touches.current.has(event.pointerId)) return;
    touches.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (!pinch.current || touches.current.size < 2) return;
    event.stopPropagation();
    const [a, b] = [...touches.current.values()];
    const ratio = Math.hypot(a.x - b.x, a.y - b.y) / Math.max(1, pinch.current.dist);
    setZoom(Math.round(Math.max(25, Math.min(300, pinch.current.zoom * ratio))));
  };
  const touchEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    touches.current.delete(event.pointerId);
    if (touches.current.size < 2) pinch.current = null;
  };

  const switchPage = (index: number) => {
    finishGesture();
    setPageIndex(index);
    setSelection([]);
    setInline(null);
  };
  const finishInline = () => {
    if (!inline) return;
    const object = page.objects.find((o) => o.id === inline.id);
    if (object && textProperties(object)[inline.index]?.text !== inline.value) commit(replaceObject(editObjectText(object, inline.index, { text: inline.value }, page.defs)));
    setInline(null);
  };
  const exportFile = async () => {
    setBusy(exportKind);
    setError("");
    try {
      const sides = exportRefs.current.filter((el): el is SVGSVGElement => !!el).map((el, i) => ({ el, suffix: i === 0 ? "mat-truoc" : "mat-sau" }));
      // 1 trang (logo) thì không thêm hậu tố mặt trước / mặt sau vào tên file.
      const target = sides.length === 1 ? sides[0].el : sides;
      await downloadDesign(target, exportKind, doc.name || config.fileBase, page.width * config.exportScale, page.height * config.exportScale, config.dpi);
    } catch {
      setError("Chưa xuất được file. Vui lòng thử lại.");
    } finally {
      setBusy("");
    }
  };

  useEffect(() => {
    const prior = document.body.style.overflow;
    const focus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    dialog.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const observer = new ResizeObserver(([entry]) =>
      setFitWidth(Math.max(180, Math.min(entry.contentRect.width - 40, ((entry.contentRect.height - 60) * page.width) / page.height, 1050))),
    );
    if (workspace.current) observer.observe(workspace.current);
    return () => {
      observer.disconnect();
      document.body.style.overflow = prior;
      focus?.focus();
    };
  }, [page.width, page.height]);

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      const target = event.target instanceof Element ? event.target : document.body;
      if (event.key === "Tab") {
        const items = [...(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled):not([hidden]), select:not(:disabled), textarea, [tabindex="0"]') ?? [])].filter((el) => el.getClientRects().length);
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && target === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && target === last) {
          event.preventDefault();
          first?.focus();
        }
      }
      if (cropping || target.closest("input, textarea, select, [contenteditable=true]")) return;
      const mod = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();
      if (mod && key === "z") {
        event.preventDefault();
        undo(event.shiftKey);
      } else if (mod && key === "y") {
        event.preventDefault();
        undo(true);
      } else if (mod && key === "d") {
        event.preventDefault();
        duplicate();
      } else if (mod && key === "c") copy();
      else if (mod && key === "x") {
        copy();
        deleteSelected();
      } else if (mod && key === "v") {
        event.preventDefault();
        paste();
      } else if (mod && key === "a") {
        event.preventDefault();
        setSelection(page.objects.filter((o) => !o.hidden && !o.locked).map((o) => o.id));
      } else if (mod && key === "g") {
        event.preventDefault();
        if (event.shiftKey) ungroup();
        else group();
      } else if (mod && key === "s") {
        event.preventDefault();
        save(current.current);
      } else if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        deleteSelected();
      } else if (event.key === "Escape") {
        setExportOpen(false);
        finishGesture(true);
        setSelection([]);
        setInline(null);
      } else if (chosen.length && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
        const items = chosen.filter((o) => !o.locked);
        if (!items.length) return;
        event.preventDefault();
        const step = event.shiftKey ? 10 : 1;
        const mx = event.key === "ArrowRight" ? step : event.key === "ArrowLeft" ? -step : 0;
        const my = event.key === "ArrowDown" ? step : event.key === "ArrowUp" ? -step : 0;
        commit(replaceObjects(items.map((o) => ({ ...o, x: o.x + mx, y: o.y + my }))), undefined, `nudge:${items.map((o) => o.id).join(",")}`);
      }
    };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  });

  /* ---------- Giao diện ---------- */

  const bg = backgroundColor(page);
  const swatches = (label: string) => (
    <div className={css.swatches} aria-label={label}>
      {palette.map((c) => (
        <button key={c} type="button" title={c} style={{ background: c }} onClick={() => applyColor(c)} />
      ))}
    </div>
  );
  const alignRow = (
    <div className={css.alignRow}>
      {ALIGN_BUTTONS.map(([mode, icon, label]) => (
        <button key={mode} type="button" title={label} aria-label={label} onClick={() => align(mode)}>
          {icon}
        </button>
      ))}
    </div>
  );

  const library = (
    <div className={css.libraryContent}>
      <p className={css.eyebrow}>THIẾT KẾ CỦA BẠN</p>
      <h2>Thêm một chút riêng</h2>
      <h3>Chữ</h3>
      <div className={css.textPresets}>
        {TEXT_PRESETS.map((t) => (
          <button key={t.name} type="button" onClick={() => add(t.markup, t.name)}>
            {t.name}
          </button>
        ))}
      </div>
      <button type="button" className={css.upload} onClick={() => upload.current?.click()}>
        ↑ Tải ảnh / logo lên<small>PNG, JPG, WebP · tối đa 15 MB</small>
      </button>
      <input
        ref={upload}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        hidden
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          try {
            add(await imageMarkup(file), file.name);
            setError("");
          } catch (err) {
            setError(err instanceof Error ? err.message : "Không đọc được ảnh.");
          }
        }}
      />
      <h3>Biểu tượng nail & spa</h3>
      <div className={css.iconGrid}>
        {LOGO_ICONS.map((i) => (
          <button key={i.id} type="button" title={i.label} aria-label={i.label} onClick={(e) => add(e.currentTarget.querySelector("svg")!.innerHTML, i.label)}>
            <svg viewBox="0 0 100 100" aria-hidden="true">
              <LogoIcon id={i.id} x={50} y={50} size={92} primary="#68584a" accent="#c8a96e" />
            </svg>
          </button>
        ))}
      </div>
      <h3>Khung & trang trí</h3>
      <div className={css.assets}>
        {CANVAS_FRAMES.map((f) => (
          <button type="button" key={f.name} onClick={() => add(f.markup, f.name)}>
            <span>{f.icon}</span>
            {f.name}
          </button>
        ))}
      </div>
      <h3>Hình & liên hệ</h3>
      <div className={css.assets}>
        {CANVAS_ASSETS.map((asset) => (
          <button type="button" key={asset.name} onClick={() => add(asset.markup, asset.name)}>
            {asset.glyph ? (
              // Biểu tượng là hằng số trong code (không phải nội dung khách nhập).
              <svg viewBox="-2 -2 50 50" width="30" height="30" aria-hidden="true" dangerouslySetInnerHTML={{ __html: asset.glyph }} />
            ) : (
              <span>{asset.icon}</span>
            )}
            {asset.name}
          </button>
        ))}
      </div>
      <h3>Mã QR</h3>
      <input aria-label="Link cho mã QR mới" value={qrValue} maxLength={1000} onChange={(e) => setQrValue(e.target.value)} placeholder="https://tiem-cua-ban.vn" />
      <button type="button" className={css.wideButton} onClick={addQr}>
        ＋ Chèn mã QR
      </button>
      <p className={css.tip}>{`Bấm đúp vào chữ để sửa ngay trên ${config.subject ?? "thẻ"}. Kéo chỗ trống để chọn nhiều thành phần, giữ Shift để chọn thêm.`}</p>
    </div>
  );

  const layers = (
    <div className={css.layerList}>
      <p className={css.tip}>Lớp ở trên cùng sẽ nằm phía trước. Giữ Shift khi bấm để chọn nhiều lớp.</p>
      {[...page.objects].reverse().map((object) => (
        <div key={object.id} className={`${css.layer} ${selection.includes(object.id) ? css.activeLayer : ""}`}>
          <button
            type="button"
            className={css.layerName}
            onClick={(e) => {
              setSelection(e.shiftKey ? (selection.includes(object.id) ? selection.filter((s) => s !== object.id) : [...selection, object.id]) : [object.id]);
              setInline(null);
            }}
          >
            {object.markup.includes("<text") ? "T" : object.markup.includes("<image") ? "▣" : "◇"}
            <span>{object.name || "Thành phần"}</span>
          </button>
          <button type="button" aria-label={`${object.hidden ? "Hiện" : "Ẩn"} ${object.name}`} title={object.hidden ? "Hiện lớp" : "Ẩn lớp"} onClick={() => commit(replaceObject({ ...object, hidden: !object.hidden }))}>
            {object.hidden ? "◌" : "◉"}
          </button>
          <button type="button" aria-label={`${object.locked ? "Mở khóa" : "Khóa"} ${object.name}`} title={object.locked ? "Mở khóa" : "Khóa lớp"} onClick={() => commit(replaceObject({ ...object, locked: !object.locked }))}>
            {object.locked ? "🔒" : "🔓"}
          </button>
        </div>
      ))}
    </div>
  );

  const pageSettings = (
    <>
      <p className={css.tip}>{config.hint}</p>
      <label className={css.colorLabel}>
        Màu nền
        <input aria-label="Màu nền trang" type="color" value={bg ?? "#ffffff"} onChange={(e) => commit({ ...doc, pages: doc.pages.map((p, i) => (i === pageIndex ? setBackgroundColor(p, e.target.value) : p)) }, undefined, `bg:${pageIndex}`)} />
      </label>
      {swatches("Bảng màu cho nền")}
      <div className={css.shortcut}>
        <b>Phím tắt</b>
        <p>Ctrl + Z / Y · Hoàn tác / làm lại</p>
        <p>Ctrl + C / V / X · Sao chép / dán / cắt</p>
        <p>Ctrl + D · Nhân bản · Ctrl + A · Chọn tất cả</p>
        <p>Ctrl + G · Nhóm · Ctrl + Shift + G · Tách nhóm</p>
        <p>Delete · Xóa · Mũi tên · Dịch (Shift: 10 bước)</p>
        <p>Alt khi kéo · Tắt đường gióng</p>
      </div>
    </>
  );

  const multiSettings = (
    <>
      <p className={css.tip}>Đã chọn {chosen.length} thành phần. Kéo để di chuyển cùng lúc.</p>
      <h3>Căn các thành phần</h3>
      {alignRow}
      <div className={css.twoButtons}>
        <button type="button" disabled={chosen.length < 3} onClick={() => distribute("x")}>
          ⇹ Chia đều ngang
        </button>
        <button type="button" disabled={chosen.length < 3} onClick={() => distribute("y")}>
          ⇳ Chia đều dọc
        </button>
      </div>
      <div className={css.twoButtons}>
        <button type="button" onClick={group}>
          ⧉ Nhóm lại
        </button>
        <button type="button" onClick={duplicate}>
          Nhân bản
        </button>
        <button type="button" onClick={copy}>
          Sao chép
        </button>
        <button type="button" onClick={deleteSelected}>
          Xóa
        </button>
      </div>
    </>
  );

  const singleSettings = selected && (
    <>
      <input aria-label="Tên lớp" value={selected.name} onChange={(e) => commit(replaceObject({ ...selected, name: e.target.value }), undefined, `layer-name:${selected.id}`)} />
      <div className={css.twoButtons}>
        <button type="button" onClick={() => commit(replaceObject({ ...selected, locked: !selected.locked }))}>
          {selected.locked ? "Mở khóa" : "Khóa lớp"}
        </button>
        <button type="button" onClick={() => commit(replaceObject({ ...selected, hidden: !selected.hidden }))}>
          {selected.hidden ? "Hiện lớp" : "Ẩn lớp"}
        </button>
      </div>
      {selected.locked && <p className={css.tip}>Lớp đang khóa. Mở khóa để chỉnh sửa.</p>}
      <fieldset disabled={selected.locked} className={css.properties}>
        {texts.map((text, index) => (
          <div key={`${selected.id}-${index}`} className={css.textFields}>
            <label>
              Nội dung {texts.length > 1 ? index + 1 : ""}
              <textarea aria-label={`Nội dung chữ ${index + 1}`} value={text.text} maxLength={500} rows={Math.min(5, text.text.split("\n").length + 1)} onChange={(e) => editText(index, { text: e.target.value })} />
            </label>
            <label>
              Phông chữ
              <select
                aria-label={`Phông chữ ${index + 1}`}
                value={text.font}
                style={{ fontFamily: `'${text.font}'` }}
                onChange={async (e) => {
                  const font = e.target.value;
                  await document.fonts.load(`${text.weight} ${text.size}px "${font}"`);
                  editText(index, { font });
                }}
              >
                {[...new Set([...CANVAS_FONTS, text.font])].map((font) => (
                  <option key={font} value={font} style={{ fontFamily: `'${font}'` }}>
                    {font}
                  </option>
                ))}
              </select>
            </label>
            <div className={css.grid2}>
              <label>
                Cỡ chữ
                <NumberField label={`Cỡ chữ ${index + 1}`} value={text.size * textScale} min={4} max={500} onChange={(size) => editText(index, { size: size / textScale })} />
              </label>
              <label className={css.colorLabel}>
                Màu chữ
                <input aria-label={`Màu chữ ${index + 1}`} type="color" value={text.color} onChange={(e) => editText(index, { color: e.target.value })} />
              </label>
            </div>
            <div className={css.toggleRow}>
              <button type="button" title="In đậm" aria-pressed={Number(text.weight) >= 600} onClick={() => editText(index, { weight: Number(text.weight) >= 600 ? "500" : "700" })}>
                <b>B</b>
              </button>
              <button type="button" title="In nghiêng" aria-pressed={text.italic} onClick={() => editText(index, { italic: !text.italic })}>
                <i>I</i>
              </button>
              {(["start", "middle", "end"] as const).map((a) => (
                <button key={a} type="button" title={a === "start" ? "Canh chữ trái" : a === "middle" ? "Canh chữ giữa" : "Canh chữ phải"} aria-pressed={text.anchor === a} onClick={() => editText(index, { anchor: a })}>
                  {a === "start" ? "⇤" : a === "middle" ? "≡" : "⇥"}
                </button>
              ))}
            </div>
            <div className={css.grid2}>
              <label>
                Giãn chữ
                <NumberField label={`Giãn chữ ${index + 1}`} value={text.spacing} min={-10} max={60} onChange={(spacing) => editText(index, { spacing })} />
              </label>
              <label>
                Khoảng cách dòng
                <NumberField label={`Khoảng cách dòng ${index + 1}`} value={text.lineHeight} min={0.7} max={3} onChange={(lineHeight) => editText(index, { lineHeight })} />
              </label>
            </div>
            <button type="button" className={css.wideButton} onClick={() => setInline({ id: selected.id, index, value: text.text })}>
              Sửa ngay trên {config.subject ?? "thẻ"}
            </button>
          </div>
        ))}
        {image && (
          <>
            <h3>Ảnh</h3>
            <button type="button" className={css.wideButton} onClick={() => replaceUpload.current?.click()}>
              ↑ Thay ảnh trong khung
            </button>
            <input
              ref={replaceUpload}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              hidden
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file || !selected) return;
                try {
                  const markup = await imageMarkup(file);
                  const href = new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${markup}</svg>`, "image/svg+xml").querySelector("image")?.getAttribute("href");
                  const object = latest(selected.id);
                  if (!href || !object) throw new Error("Không đọc được ảnh.");
                  commit(replaceObject(replaceImageSource(object, href)));
                  setError("");
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Không đọc được ảnh.");
                }
              }}
            />
            <div className={css.twoButtons}>
              <button type="button" onClick={() => setCropping({ id: selected.id, src: selected.source ?? image.href })}>
                ✂ Cắt & bo góc
              </button>
              <button type="button" disabled={aiBusy} onClick={() => void removeBg()}>
                {aiBusy ? "Đang xoá nền…" : "✦ Xoá nền (AI)"}
              </button>
            </div>
            <small>Xoá nền dùng AI, tính 1 lượt tạo ảnh.</small>
          </>
        )}
        {selected.qr !== undefined && (
          <label key={selected.id + selected.qr}>
            Link mã QR
            <input aria-label="Link mã QR đang chọn" defaultValue={selected.qr} maxLength={1000} onBlur={(e) => { if (e.target.value !== selected.qr) changeQr(e.target.value); }} onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }} />
            <small>Nhấn Enter để cập nhật mã.</small>
          </label>
        )}
        {!image && selected.qr === undefined && (
          <>
            <label className={css.colorLabel}>
              {texts.length ? "Màu toàn bộ chữ" : "Màu toàn bộ thành phần"}
              <input aria-label="Màu thành phần" type="color" defaultValue="#b49b77" onChange={(e) => applyColor(e.target.value)} />
            </label>
            {swatches("Bảng màu")}
          </>
        )}
        <h3>Hiệu ứng</h3>
        <label className={css.rangeLabel}>
          Độ mờ {Math.round((selected.opacity ?? 1) * 100)}%
          <input type="range" min={5} max={100} value={Math.round((selected.opacity ?? 1) * 100)} onChange={(e) => { const v = Number(e.target.value) / 100; patchObject({ opacity: v >= 1 ? undefined : v }, `opacity:${selected.id}`); }} />
        </label>
        <label className={css.checkLabel}>
          <input type="checkbox" checked={!!selected.shadow} onChange={(e) => patchObject({ shadow: e.target.checked || undefined })} /> Đổ bóng mềm
        </label>
        <h3>Vị trí & kích thước</h3>
        <div className={css.grid2}>
          {([["x", "X"], ["y", "Y"], ["width", "Rộng"], ["height", "Cao"], ["rotation", "Góc xoay"]] as const).map(([key, label]) => (
            <label key={key}>
              {label}
              <NumberField label={label} value={selected[key]} min={key === "width" || key === "height" ? 1 : -10000} max={10000} onChange={(value) => patchObject({ [key]: value })} />
            </label>
          ))}
        </div>
        <h3>Căn theo trang</h3>
        {alignRow}
        <h3>Sắp xếp lớp</h3>
        <div className={css.twoButtons}>
          <button type="button" onClick={() => reorder(1)}>↑ Lên một lớp</button>
          <button type="button" onClick={() => reorder(-1)}>↓ Xuống một lớp</button>
          <button type="button" onClick={() => reorder(page.objects.length)}>Lên trên cùng</button>
          <button type="button" onClick={() => reorder(-page.objects.length)}>Xuống dưới cùng</button>
        </div>
      </fieldset>
      <div className={css.twoButtons}>
        <button type="button" onClick={duplicate}>Nhân bản</button>
        <button type="button" onClick={copy}>Sao chép</button>
        {canUngroup && <button type="button" onClick={ungroup}>⧉ Tách nhóm</button>}
        <button type="button" disabled={selected.locked} onClick={deleteSelected}>Xóa</button>
      </div>
    </>
  );

  return createPortal(
    <div ref={dialog} className={css.editor} role="dialog" aria-modal="true" aria-label={config.title}>
      <header className={css.header}>
        <button type="button" className={css.back} onClick={() => { finishGesture(); onClose(); }}>
          ← <span>{config.backLabel}</span>
        </button>
        <div className={css.documentName}>
          <input aria-label="Tên thiết kế" value={doc.name} onChange={(e) => commit({ ...doc, name: e.target.value }, undefined, "doc-name")} />
          <small role="status">{saveState}</small>
        </div>
        <div className={css.history}>
          <button type="button" aria-label="Hoàn tác" title="Hoàn tác (Ctrl+Z)" disabled={!historyState.past} onClick={() => undo()}>↶</button>
          <button type="button" aria-label="Làm lại" title="Làm lại (Ctrl+Shift+Z)" disabled={!historyState.future} onClick={() => undo(true)}>↷</button>
        </div>
        <div className={css.exportGroup}>
          <button
            type="button"
            className={css.exportTrigger}
            aria-label="Định dạng tải xuống"
            aria-haspopup="listbox"
            aria-expanded={exportOpen}
            disabled={!!busy}
            onClick={() => setExportOpen((v) => !v)}
          >
            {exportOption.icon()}
            <span>{exportOption.label}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={exportOpen ? { transform: "rotate(180deg)" } : undefined}>
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
          {exportOpen && (
            <>
              <div className={css.exportBackdrop} onClick={() => setExportOpen(false)} />
              <div role="listbox" aria-label="Loại tệp" className={css.exportMenu}>
                <p>Loại tệp</p>
                {EXPORT_OPTIONS.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    role="option"
                    aria-selected={o.id === exportKind}
                    onClick={() => {
                      setExportKind(o.id);
                      setExportOpen(false);
                    }}
                  >
                    <span className={css.exportIcon}>{o.icon()}</span>
                    <span className={css.exportText}>
                      <b>
                        {o.label}
                        {o.id === "pdf" && <em>Đề xuất</em>}
                      </b>
                      {/* PDF: thêm chi tiết riêng từng sản phẩm, vd "In 2 mặt" từ pdfLabel "PDF · In 2 mặt" */}
                      <small>{o.id === "pdf" && pdfDetail ? `${o.desc} · ${pdfDetail}` : o.desc}</small>
                    </span>
                    {o.id === exportKind && (
                      <svg className={css.exportCheck} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m5 12 5 5 9-10" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
          <button type="button" className={css.primary} disabled={!!busy} onClick={() => void exportFile()}>
            {busy ? "Đang xuất…" : "↓ Tải xuống"}
          </button>
        </div>
      </header>
      {error && (
        <div className={css.error} role="alert">
          {error}
          <button type="button" aria-label="Đóng thông báo" onClick={() => setError("")}>×</button>
        </div>
      )}
      <div className={css.body}>
        <aside className={css.library} data-sheet={sheet === "add" || sheet === "layers" ? "open" : undefined}>
          <div className={css.tabs}>
            <button type="button" aria-pressed={panel === "add"} onClick={() => { setPanel("add"); setSheet((s) => (s ? "add" : s)); }}>＋ Thêm</button>
            <button type="button" aria-pressed={panel === "layers"} onClick={() => { setPanel("layers"); setSheet((s) => (s ? "layers" : s)); }}>▱ Các lớp</button>
            <button type="button" className={css.sheetClose} aria-label="Đóng" onClick={() => setSheet(null)}>✕</button>
          </div>
          {panel === "add" ? library : layers}
        </aside>
        <main className={css.center}>
          <div className={css.contextBar}>
            <span>{pageName(page.side, pageIndex)}</span>
            <span>{chosen.length > 1 ? `${chosen.length} thành phần` : selected ? selected.name : `Chọn bất kỳ thành phần nào trên ${config.subject ?? "thẻ"}`}</span>
            {chosen.length > 0 && (
              <>
                <button type="button" onClick={duplicate} title="Nhân bản (Ctrl+D)">Nhân bản</button>
                {chosen.length > 1 && <button type="button" onClick={group} title="Nhóm (Ctrl+G)">Nhóm</button>}
                <button type="button" onClick={deleteSelected}>Xóa</button>
              </>
            )}
          </div>
          <div
            ref={workspace}
            className={css.workspace}
            onPointerDownCapture={touchStart}
            onPointerMoveCapture={touchMove}
            onPointerUpCapture={touchEnd}
            onPointerCancelCapture={touchEnd}
            onPointerDown={(e) => { if (e.target === e.currentTarget) setSelection([]); }}
          >
            <div className={css.artboard} style={{ width: canvasWidth, aspectRatio: `${page.width}/${page.height}` }}>
              <CanvasSvg
                page={page}
                svgRef={surface}
                interactive
                tabIndex={0}
                className={css.scene}
                onPointerDown={pointerDown}
                onPointerMove={pointerMove}
                onPointerUp={() => finishGesture()}
                onPointerCancel={() => finishGesture(true)}
                onDoubleClick={(e) => {
                  const target = e.target as Element;
                  const group = target.closest("[data-scene-id]");
                  const object = page.objects.find((o) => o.id === (group?.getAttribute("data-scene-id") ?? selected?.id));
                  if (!object || object.locked) return;
                  const hit = target.closest("text");
                  const index = hit && group ? [...group.querySelectorAll("text")].indexOf(hit as SVGTextElement) : 0;
                  const properties = textProperties(object)[Math.max(0, index)];
                  if (properties) {
                    setSelection([object.id]);
                    setInline({ id: object.id, index: Math.max(0, index), value: properties.text });
                  }
                }}
              >
                <g data-editor-only="true" pointerEvents="none">
                  {guides.x.map((x) => <path key={`gx${x}`} d={`M${x} -25 V${page.height + 25}`} stroke="#a969c2" strokeWidth={1 / displayScale} />)}
                  {guides.y.map((y) => <path key={`gy${y}`} d={`M-25 ${y} H${page.width + 25}`} stroke="#a969c2" strokeWidth={1 / displayScale} />)}
                  {marquee && <rect x={marquee.x} y={marquee.y} width={marquee.w} height={marquee.h} fill="#a17d5214" stroke="#a17d52" strokeWidth={1 / displayScale} strokeDasharray={`${4 / displayScale} ${3 / displayScale}`} />}
                  {chosen.length > 1 && chosen.map((o) => (
                    <rect key={o.id} x={o.x} y={o.y} width={o.width} height={o.height} fill="none" stroke={o.locked ? "#8b8580" : "#a17d52"} strokeWidth={1.2 / displayScale} strokeDasharray={`${5 / displayScale} ${3 / displayScale}`} />
                  ))}
                </g>
                {selected && !selected.hidden && (
                  <g data-editor-only="true" transform={`translate(${selected.x + selected.width / 2} ${selected.y + selected.height / 2}) rotate(${selected.rotation})`}>
                    <rect x={-selected.width / 2} y={-selected.height / 2} width={selected.width} height={selected.height} fill="none" stroke={selected.locked ? "#8b8580" : "#a17d52"} strokeWidth={1.5 / displayScale} pointerEvents="none" />
                    {!selected.locked && !inline && (
                      <>
                        <path d={`M0 ${-selected.height / 2} v${-28 / displayScale}`} stroke="#a17d52" strokeWidth={1 / displayScale} pointerEvents="none" />
                        <circle data-handle="rotate" aria-label="Xoay thành phần" cx={0} cy={-selected.height / 2 - 28 / displayScale} r={handleSize * 0.65} fill="white" stroke="#a17d52" strokeWidth={1.5 / displayScale} style={{ cursor: "grab" }} />
                        {([[-1, -1, "nw"], [1, -1, "ne"], [1, 1, "se"], [-1, 1, "sw"]] as const).map(([sx, sy, handle]) => (
                          <rect key={handle} data-handle={handle} x={(sx * selected.width) / 2 - handleSize / 2} y={(sy * selected.height) / 2 - handleSize / 2} width={handleSize} height={handleSize} fill="white" stroke="#a17d52" strokeWidth={1.5 / displayScale} style={{ cursor: `${handle === "nw" || handle === "se" ? "nwse" : "nesw"}-resize` }} />
                        ))}
                      </>
                    )}
                  </g>
                )}
              </CanvasSvg>
              {inline && selected && (
                <textarea
                  key={inline.id}
                  className={css.inlineText}
                  aria-label={`Sửa chữ trực tiếp trên ${config.subject ?? "thẻ"}`}
                  autoFocus
                  value={inline.value}
                  maxLength={500}
                  rows={Math.min(6, inline.value.split("\n").length)}
                  style={{
                    left: Math.max(0, Math.min(70, (selected.x / page.width) * 100)) + "%",
                    top: Math.max(0, (selected.y / page.height) * 100) + "%",
                    width: Math.max(190, Math.min(canvasWidth, selected.width * displayScale + 30)),
                    fontFamily: `'${texts[inline.index]?.font}'`,
                    fontSize: Math.min(48, Math.max(16, (texts[inline.index]?.size ?? 28) * textScale * displayScale)),
                  }}
                  onChange={(e) => setInline({ ...inline, value: e.target.value })}
                  onBlur={finishInline}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    // Enter: xong; Shift + Enter: xuống dòng.
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      finishInline();
                    }
                    if (e.key === "Escape") setInline(null);
                  }}
                />
              )}
            </div>
          </div>
          <footer className={css.pageBar}>
            <div className={css.pages}>
              {doc.pages.map((p, i) => (
                <button key={p.side} type="button" aria-pressed={pageIndex === i} onClick={() => switchPage(i)}>
                  <CanvasSvg page={p} />
                  <span>{i + 1}. {pageName(p.side, i)}</span>
                </button>
              ))}
            </div>
            <div className={css.zoom}>
              <button type="button" aria-label="Thu nhỏ" onClick={() => setZoom(Math.max(25, zoom - 25))}>−</button>
              <button type="button" title="Vừa khung" onClick={() => setZoom(100)}>{zoom}%</button>
              <button type="button" aria-label="Phóng to" onClick={() => setZoom(Math.min(300, zoom + 25))}>＋</button>
            </div>
          </footer>
        </main>
        <aside className={css.inspector} data-sheet={sheet === "edit" ? "open" : undefined}>
          <button type="button" className={css.sheetClose} aria-label="Đóng" onClick={() => setSheet(null)}>✕</button>
          <p className={css.eyebrow}>TÙY CHỈNH</p>
          <h2>{chosen.length > 1 ? "Nhiều thành phần" : selected ? "Thành phần" : "Trang thiết kế"}</h2>
          {chosen.length > 1 ? multiSettings : selected ? singleSettings : pageSettings}
        </aside>
      </div>
      {/* Điện thoại: thanh công cụ dưới đáy, mở các bảng trượt. */}
      <nav className={css.mobileBar} aria-label="Công cụ thiết kế">
        <button type="button" aria-pressed={sheet === "add"} onClick={() => { setPanel("add"); setSheet(sheet === "add" ? null : "add"); }}>
          ＋<span>Thêm</span>
        </button>
        <button type="button" aria-pressed={sheet === "layers"} onClick={() => { setPanel("layers"); setSheet(sheet === "layers" ? null : "layers"); }}>
          ▱<span>Lớp</span>
        </button>
        <button type="button" aria-pressed={sheet === "edit"} onClick={() => setSheet(sheet === "edit" ? null : "edit")}>
          ✎<span>{chosen.length ? "Chỉnh" : "Trang"}</span>
        </button>
        {chosen.length > 0 && (
          <>
            <button type="button" onClick={duplicate}>⧉<span>Nhân bản</span></button>
            <button type="button" onClick={deleteSelected}>✕<span>Xóa</span></button>
          </>
        )}
      </nav>
      <div className={css.exportOnly} aria-hidden="true">
        {doc.pages.map((p, i) => (
          <CanvasSvg key={p.side} page={p} svgRef={(node) => { exportRefs.current[i] = node; }} />
        ))}
      </div>
      {cropping && <ImageCropper src={cropping.src} onApply={applyCrop} onClose={() => setCropping(null)} />}
    </div>,
    document.body,
  );
}

function NumberField({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void }) {
  return (
    <input
      key={round(value)}
      aria-label={label}
      type="number"
      defaultValue={round(value)}
      min={min}
      max={max}
      step="0.1"
      onBlur={(e) => {
        const n = Number(e.target.value);
        if (e.target.value && Number.isFinite(n)) {
          const next = Math.min(max, Math.max(min, n));
          if (next !== round(value)) onChange(next);
        } else e.target.value = String(round(value));
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
    />
  );
}
