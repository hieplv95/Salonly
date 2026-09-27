"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  CARD_EXPORT_DPI,
  CARD_EXPORT_SCALE,
  CARD_SIZES,
  CARD_TEMPLATES,
  CARD_BACK_COPY,
  cardDesignFrom,
  cardElementsFrom,
  cardLayoutFrom,
  type CardBackCopy,
  type CardColors,
  type CardDesign,
  type CardElement,
  type CardLayerTransform,
  type CardLayout,
  type CardTemplate,
} from "@/lib/card-templates";
import { downloadDesign, type ExportKind } from "../design/export";
import { ExportBar } from "../design/ExportBar";
import { Label, Pager, Panel, chip, inputCls } from "../design/ui";
import { CardSvg, autoOffer } from "./CardSvg";
import { CanvasEditor } from "./CanvasEditor";
import { CanvasSvg } from "./CanvasSvg";
import { canvasDraft, captureCardDocument, type CanvasDocument } from "./canvas-model";

const STORAGE_KEY = "naile-card-design";
const BACK_DRAFTS_KEY = "naile-card-back-drafts";
const ELEMENT_DRAFTS_KEY = "naile-card-element-drafts";
const LAYOUT_DRAFTS_KEY = "naile-card-layout-drafts";
const PER_PAGE = 12;
// Trang có mẫu mới đầu tiên (nút "Xem mẫu mới").
const NEW_PAGE = Math.max(0, Math.floor(CARD_TEMPLATES.findIndex((t) => t.isNew) / PER_PAGE));

// Nội dung khách tự gõ: giữ lại khi đổi sang mẫu khác.
const CONTENT_KEYS = ["salon", "tagline", "title", "offer", "reward", "midReward", "memberNo", "valid", "phone", "website", "social", "qr"] as const;
const BACK_KEYS = ["backTitle", "backLine1", "backLine2"] as const;
const contentOf = (d: CardDesign) => Object.fromEntries(CONTENT_KEYS.map((k) => [k, d[k]])) as Partial<CardDesign>;
const backCopyOf = (d: CardDesign): CardBackCopy => ({ backTitle: d.backTitle, backLine1: d.backLine1, backLine2: d.backLine2 });
const stampOverrideOf = (d: CardDesign) => {
  const previous = CARD_TEMPLATES.find((t) => t.id === d.templateId);
  return d.stamps !== previous?.stamps ? d.stamps : undefined;
};
const keepElementOnCard = (element: CardElement, orientation: CardDesign["orientation"]): CardElement => {
  const { w, h } = CARD_SIZES[orientation];
  const width = Math.min(w - 16, (element.kind === "instagram" ? element.size * 1.35 + 12 : 0) + element.text.length * element.size * 0.62);
  const height = element.kind === "instagram" ? element.size * 1.35 : element.size * 1.3;
  return {
    ...element,
    x: Math.round(Math.max(8, Math.min(w - Math.max(32, width) - 8, element.x))),
    y: Math.round(Math.max(8, Math.min(h - height - 8, element.y))),
  };
};

/* ---------- Trạng thái trình sửa thẻ ---------- */

export function useCardEditor() {
  const [design, setDesign] = useState<CardDesign>(() => cardDesignFrom(CARD_TEMPLATES[0]));
  const [busy, setBusy] = useState<"" | ExportKind>("");
  const frontRef = useRef<SVGSVGElement>(null);
  const backRef = useRef<SVGSVGElement>(null);
  const backDrafts = useRef<Record<string, CardBackCopy>>({});
  const elementDrafts = useRef<Record<string, CardElement[]>>({});
  const layoutDrafts = useRef<Record<string, CardLayout>>({});
  const [canvasRecord, setCanvasRecord] = useState<{ templateId: string; doc: CanvasDocument | null } | null>(null);
  const [canvasError, setCanvasError] = useState("");
  const writes = useRef<Promise<unknown>>(Promise.resolve());
  const canvasDoc = canvasRecord?.templateId === design.templateId ? canvasRecord.doc : null;
  const canvasReady = canvasRecord?.templateId === design.templateId;

  useEffect(() => {
    let active = true;
    void writes.current.catch(() => {}).then(() => canvasDraft("read", design.templateId)).then((doc) => {
      if (active) { setCanvasRecord({ templateId: design.templateId, doc }); setCanvasError(""); }
    }).catch(() => {
      if (active) { setCanvasRecord({ templateId: design.templateId, doc: null }); setCanvasError("Trình duyệt chưa cho phép lưu thiết kế. Bạn vẫn có thể chỉnh và tải file."); }
    });
    return () => { active = false; };
  }, [design.templateId]);

  const saveCanvas = useCallback(async (doc: CanvasDocument) => {
    setCanvasRecord({ templateId: doc.templateId, doc });
    const write = writes.current.catch(() => {}).then(() => canvasDraft("write", doc.templateId, doc));
    writes.current = write;
    try { await write; setCanvasError(""); } catch (error) { setCanvasError("Chưa lưu được thiết kế. Hãy tải file trước khi rời trang."); throw error; }
  }, []);

  const discardCanvas = async () => {
    try {
      await writes.current.catch(() => {});
      await canvasDraft("delete", design.templateId);
      setCanvasRecord({ templateId: design.templateId, doc: null });
      setCanvasError("");
    } catch { setCanvasError("Chưa đặt lại được thiết kế. Vui lòng thử lại."); }
  };

  const saveBackDrafts = () => {
    try { localStorage.setItem(BACK_DRAFTS_KEY, JSON.stringify(backDrafts.current)); } catch {}
  };
  const saveElementDrafts = () => {
    try { localStorage.setItem(ELEMENT_DRAFTS_KEY, JSON.stringify(elementDrafts.current)); } catch {}
  };
  const saveLayoutDrafts = () => {
    try { localStorage.setItem(LAYOUT_DRAFTS_KEY, JSON.stringify(layoutDrafts.current)); } catch {}
  };

  useEffect(() => {
    try {
      const drafts = localStorage.getItem(BACK_DRAFTS_KEY);
      if (drafts) backDrafts.current = JSON.parse(drafts) as Record<string, CardBackCopy>;
    } catch {}
    try {
      const drafts = localStorage.getItem(ELEMENT_DRAFTS_KEY);
      if (drafts) elementDrafts.current = JSON.parse(drafts) as Record<string, CardElement[]>;
    } catch {}
    try {
      const drafts = localStorage.getItem(LAYOUT_DRAFTS_KEY);
      if (drafts) layoutDrafts.current = JSON.parse(drafts) as Record<string, CardLayout>;
    } catch {}
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<CardDesign>;
        const template = CARD_TEMPLATES.find((t) => t.id === parsed.templateId) ?? CARD_TEMPLATES[0];
        const restored = cardDesignFrom(template, { ...backDrafts.current[template.id], ...parsed, elements: parsed.elements ?? elementDrafts.current[template.id], layout: parsed.layout ?? layoutDrafts.current[template.id] });
        backDrafts.current[template.id] = backCopyOf(restored);
        elementDrafts.current[template.id] = restored.elements;
        layoutDrafts.current[template.id] = restored.layout;
        setDesign(restored);
      }
    } catch {}
  }, []);

  const change = (fn: (d: CardDesign) => CardDesign) =>
    setDesign((d) => {
      const next = fn(d);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

  const update = (patch: Partial<CardDesign>) => change((d) => {
    const next = { ...d, ...patch };
    if (BACK_KEYS.some((k) => k in patch)) {
      backDrafts.current[next.templateId] = backCopyOf(next);
      saveBackDrafts();
    }
    if ("elements" in patch) {
      elementDrafts.current[next.templateId] = cardElementsFrom(next.elements);
      saveElementDrafts();
    }
    return next;
  });
  const updateElements = (fn: (items: CardElement[]) => CardElement[]) => change((d) => {
    const elements = cardElementsFrom(fn(d.elements));
    elementDrafts.current[d.templateId] = elements;
    saveElementDrafts();
    return { ...d, elements };
  });
  const updateLayout = (side: "front" | "back", id: string, patch: CardLayerTransform | null) => change((d) => {
    const layout = cardLayoutFrom(d.layout);
    if (patch && (patch.x !== 0 || patch.y !== 0 || patch.scale !== 1)) layout[side][id] = patch;
    else delete layout[side][id];
    layoutDrafts.current[d.templateId] = layout;
    saveLayoutDrafts();
    return { ...d, layout };
  });
  const resetLayout = () => change((d) => {
    const layout = cardLayoutFrom(null);
    layoutDrafts.current[d.templateId] = layout;
    saveLayoutDrafts();
    return { ...d, layout };
  });
  const setColors = (patch: Partial<CardColors>) => change((d) => ({ ...d, colors: { ...d.colors, ...patch } }));
  // Giữ nội dung chung khi đổi mẫu và nhớ lời nhắn riêng của từng mặt sau.
  const applyTemplate = (t: CardTemplate) => change((d) => {
    backDrafts.current[d.templateId] = backCopyOf(d);
    elementDrafts.current[d.templateId] = d.elements;
    layoutDrafts.current[d.templateId] = d.layout;
    saveBackDrafts();
    saveElementDrafts();
    saveLayoutDrafts();
    return cardDesignFrom(t, { ...contentOf(d), ...backDrafts.current[t.id], elements: elementDrafts.current[t.id], layout: layoutDrafts.current[t.id], stamps: stampOverrideOf(d) });
  });
  const reset = () => {
    const t = CARD_TEMPLATES.find((x) => x.id === design.templateId) ?? CARD_TEMPLATES[0];
    delete backDrafts.current[t.id];
    delete elementDrafts.current[t.id];
    delete layoutDrafts.current[t.id];
    saveBackDrafts();
    saveElementDrafts();
    saveLayoutDrafts();
    change(() => cardDesignFrom(t));
  };
  const previewTemplate = (t: CardTemplate) => cardDesignFrom(t, {
    ...contentOf(design),
    ...(t.id === design.templateId ? backCopyOf(design) : backDrafts.current[t.id]),
    elements: t.id === design.templateId ? design.elements : elementDrafts.current[t.id],
    layout: t.id === design.templateId ? design.layout : layoutDrafts.current[t.id],
    stamps: stampOverrideOf(design),
  });

  async function download(kind: ExportKind) {
    if (!frontRef.current || busy) return;
    setBusy(kind);
    const { w, h } = CARD_SIZES[design.orientation];
    const sides =
      design.sides === 2 && backRef.current
        ? [
            { el: frontRef.current, suffix: "mat-truoc" },
            { el: backRef.current, suffix: "mat-sau" },
          ]
        : frontRef.current;
    try {
      await downloadDesign(sides, kind, `the-tich-diem-${design.salon}`, w * CARD_EXPORT_SCALE, h * CARD_EXPORT_SCALE, CARD_EXPORT_DPI);
    } finally {
      setBusy("");
    }
  }

  return { design, update, updateElements, updateLayout, resetLayout, setColors, applyTemplate, previewTemplate, reset, download, busy, frontRef, backRef, canvasDoc, canvasReady, canvasError, saveCanvas, discardCanvas };
}

export type CardEditor = ReturnType<typeof useCardEditor>;

/* ---------- Giao diện ---------- */

const cardShadow = "overflow-hidden rounded-[14px] shadow-[0_18px_36px_-22px_rgb(23_22_26/0.6)] ring-1 ring-black/5";
type CardSide = "front" | "back";
type BuiltinSelection = { id: string; side: CardSide; label: string; box: { x: number; y: number; width: number; height: number } };
type DragState = {
  kind: "custom" | "builtin";
  id: string;
  side: CardSide;
  node: SVGGElement;
  px: number;
  py: number;
  x: number;
  y: number;
  scale: number;
  currentX: number;
  currentY: number;
};

export function CardStudio({ editor }: { editor: CardEditor }) {
  const [editing, setEditing] = useState<CanvasDocument | null>(null);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState("");
  const [restore, setRestore] = useState(false);
  const open = async () => {
    setOpening(true); setError("");
    try {
      await document.fonts.ready;
      const roots = [editor.frontRef.current, editor.backRef.current].filter((root): root is SVGSVGElement => !!root);
      if (!editor.canvasDoc && !roots.length) throw new Error("Bản xem trước chưa sẵn sàng.");
      const doc = editor.canvasDoc ?? captureCardDocument(editor.design.templateId, `Thẻ tích điểm · ${editor.design.salon}`, roots, editor.design.qr);
      // Keep the in-memory design available even if this browser blocks persistent storage.
      try { await editor.saveCanvas(doc); } catch {}
      setEditing(doc);
    } catch { setError("Chưa mở được trình thiết kế. Hãy thử lại sau khi bản xem trước tải xong."); }
    finally { setOpening(false); }
  };
  const launch = <button type="button" onClick={() => void open()} disabled={opening || !editor.canvasReady} className="w-full rounded-2xl bg-ink px-5 py-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50">{opening ? "Đang mở thiết kế…" : "✦ Mở trình thiết kế"}</button>;
  return <>
    {(error || editor.canvasError) && <p role="alert" className="mb-4 rounded-xl border border-gold/30 bg-white p-3 text-xs text-taupe">{error || editor.canvasError}</p>}
    {editor.canvasDoc ? <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <div className="space-y-4 rounded-3xl border border-line bg-stage p-6">{editor.canvasDoc.pages.map((p, i) => <figure key={p.side}><div className={cardShadow}><CanvasSvg page={p} svgRef={i === 0 ? editor.frontRef : editor.backRef} className="block h-auto w-full" /></div><figcaption className="mt-2 text-center text-xs text-taupe">{p.side === "front" ? "Mặt trước" : "Mặt sau"}</figcaption></figure>)}</div>
      <div className="space-y-4"><Panel title="Thiết kế của bạn"><h2 className="mb-3 font-serif text-3xl">Chỉnh mọi chi tiết trên thẻ</h2><p className="mb-5 text-sm leading-6 text-taupe">Bản thiết kế riêng đã sẵn sàng. Mở khung vẽ để sửa chữ, kéo thả hình, thêm logo và sắp xếp cả hai mặt.</p>{launch}<p className="mt-3 text-center text-xs text-taupe">Lưu trên trình duyệt này · tải PNG, JPG, SVG hoặc PDF</p></Panel>
      <Panel title="Chọn mẫu thẻ"><select aria-label="Chuyển mẫu thẻ" value={editor.design.templateId} onChange={(e) => { const t = CARD_TEMPLATES.find((t) => t.id === e.target.value); if (t) { setRestore(false); editor.applyTemplate(t); } }} className={inputCls}>{CARD_TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}</select><p className="mt-3 text-xs leading-5 text-taupe">Mỗi mẫu giữ một bản thiết kế riêng.</p></Panel>
      <Panel title="Bố cục ban đầu">{restore ? <><p className="mb-3 text-xs leading-5 text-taupe">Đặt lại sẽ bỏ bản kéo thả của mẫu này và trở về phần điền thông tin trước đó.</p><div className="flex gap-3"><button type="button" className="rounded-full border border-line px-4 py-2 text-xs" onClick={() => setRestore(false)}>Giữ thiết kế</button><button type="button" className="rounded-full bg-ink px-4 py-2 text-xs text-white" onClick={() => { void editor.discardCanvas(); setRestore(false); }}>Đặt lại mẫu</button></div></> : <button type="button" className="text-xs text-taupe underline underline-offset-4" onClick={() => setRestore(true)}>Trở về phần điền thông tin theo mẫu</button>}</Panel></div>
    </div> : <CardForm editor={editor} launch={launch} />}
    {editing && <CanvasEditor initial={editing} onChange={editor.saveCanvas} onClose={() => setEditing(null)} />}
  </>;
}

function CardForm({ editor, launch }: { editor: CardEditor; launch: React.ReactNode }) {
  const { design, update, updateElements, updateLayout, resetLayout, setColors, applyTemplate, previewTemplate, reset, frontRef, backRef } = editor;
  const [page, setPage] = useState(0);
  const [gallerySide, setGallerySide] = useState<"front" | "back">("front");
  const [editSide, setEditSide] = useState<"front" | "back">("front");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedLayer, setSelectedLayer] = useState<BuiltinSelection | null>(null);
  const drag = useRef<DragState | null>(null);
  const pages = Math.ceil(CARD_TEMPLATES.length / PER_PAGE);
  const previewRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const backCopyRef = useRef<HTMLDivElement>(null);
  const goPage = (p: number) => {
    setPage(p);
    galleryRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  };
  const portrait = design.orientation === "portrait";
  const two = design.sides === 2;
  const count = Math.max(3, Math.min(15, design.stamps));
  const style = design.style;
  const backCopyFields = CARD_BACK_COPY[style];
  const selected = design.elements.find((element) => element.id === selectedId);
  const layerTransform = selectedLayer ? design.layout[selectedLayer.side][selectedLayer.id] ?? { x: 0, y: 0, scale: 1 } : null;

  const pointOnCard = (event: ReactPointerEvent<SVGSVGElement>) => {
    const svg = event.currentTarget;
    const matrix = svg.getScreenCTM();
    if (!matrix) return null;
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    return point.matrixTransform(matrix.inverse());
  };
  const pointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    const side = event.currentTarget.dataset.cardSide as "front" | "back";
    const target = event.target as Element;
    const customNode = target.closest("[data-card-element-id]") as SVGGElement | null;
    const id = customNode?.getAttribute("data-card-element-id");
    const element = design.elements.find((item) => item.id === id && item.side === side);
    const point = pointOnCard(event);
    if (element && customNode && point) {
      setSelectedId(element.id);
      setSelectedLayer(null);
      setEditSide(side);
      drag.current = { kind: "custom", id: element.id, side, node: customNode, px: point.x, py: point.y, x: element.x, y: element.y, scale: 1, currentX: element.x, currentY: element.y };
    } else {
      const layerNode = target.closest("[data-card-layer-id]") as SVGGElement | null;
      const layerId = layerNode?.getAttribute("data-card-layer-id");
      if (!layerNode || !layerId || !point) {
        setSelectedId(null);
        setSelectedLayer(null);
        return;
      }
      const box = layerNode.getBBox();
      const transform = design.layout[side][layerId] ?? { x: 0, y: 0, scale: 1 };
      setSelectedId(null);
      setSelectedLayer({ id: layerId, side, label: layerNode.getAttribute("data-card-layer-label") ?? "Thành phần trên thẻ", box: { x: box.x, y: box.y, width: box.width, height: box.height } });
      setEditSide(side);
      drag.current = { kind: "builtin", id: layerId, side, node: layerNode, px: point.x, py: point.y, x: transform.x, y: transform.y, scale: transform.scale, currentX: transform.x, currentY: transform.y };
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  };
  const pointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    const side = event.currentTarget.dataset.cardSide as "front" | "back";
    const active = drag.current;
    if (!active || active.side !== side) return;
    const point = pointOnCard(event);
    if (!point) return;
    if (active.kind === "custom") {
      const element = design.elements.find((item) => item.id === active.id);
      if (!element) return;
      const moved = keepElementOnCard({ ...element, x: active.x + point.x - active.px, y: active.y + point.y - active.py }, design.orientation);
      active.currentX = moved.x;
      active.currentY = moved.y;
      active.node.setAttribute("transform", `translate(${moved.x} ${moved.y})`);
    } else {
      active.currentX = Math.round(Math.max(-2100, Math.min(2100, active.x + point.x - active.px)));
      active.currentY = Math.round(Math.max(-2100, Math.min(2100, active.y + point.y - active.py)));
      active.node.setAttribute("transform", `translate(${active.currentX} ${active.currentY}) scale(${active.scale})`);
    }
  };
  const pointerUp = (event: ReactPointerEvent<SVGSVGElement>) => {
    const active = drag.current;
    drag.current = null;
    if (active && (active.currentX !== active.x || active.currentY !== active.y)) {
      if (active.kind === "custom") updateElements((items) => items.map((item) => item.id === active.id ? { ...item, x: active.currentX, y: active.currentY } : item));
      else updateLayout(active.side, active.id, { x: active.currentX, y: active.currentY, scale: active.scale });
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const resizeLayer = (scale: number) => {
    if (!selectedLayer || !layerTransform) return;
    const cx = selectedLayer.box.x + selectedLayer.box.width / 2;
    const cy = selectedLayer.box.y + selectedLayer.box.height / 2;
    updateLayout(selectedLayer.side, selectedLayer.id, {
      x: Math.round(layerTransform.x + (layerTransform.scale - scale) * cx),
      y: Math.round(layerTransform.y + (layerTransform.scale - scale) * cy),
      scale,
    });
  };
  const addElement = (kind: CardElement["kind"]) => {
    if (design.elements.length >= 24) return;
    const { w, h } = CARD_SIZES[design.orientation];
    const element: CardElement = {
      id: crypto.randomUUID(), kind, side: design.sides === 2 ? editSide : "front",
      text: kind === "instagram" ? (design.social.trim() || "@instagram") : "Nhập nội dung",
      x: design.orientation === "landscape" ? Math.round(w * 0.54) : 70,
      y: h - 115, size: kind === "instagram" ? 29 : 34,
      color: design.colors.ink,
    };
    updateElements((items) => [...items, keepElementOnCard(element, design.orientation)]);
    setSelectedId(element.id);
    setSelectedLayer(null);
  };
  const editElement = (patch: Partial<CardElement>) => {
    if (!selectedId) return;
    updateElements((items) => items.map((item) => item.id === selectedId ? keepElementOnCard({ ...item, ...patch }, design.orientation) : item));
  };
  // Trường nào mẫu hiện tại có dùng tới.
  const uses = {
    tagline: ["insta", "sage", "boho", "lineart", "skinstudio", "qrsplit", "inkline", "ribbon", "bowlocked"].includes(style),
    title: !["insta", "welcome"].includes(style),
    member: ["vip", "platinum", "rosechip"].includes(style),
    qr: ["insta", "vip", "platinum", "qrsplit", "champagne", "rosechip"].includes(style),
  };

  const field = (key: (typeof CONTENT_KEYS)[number] | keyof CardBackCopy, label: string, placeholder: string, hint?: string, max = 40) => (
    <>
      <Label hint={hint}>{label}</Label>
      <input aria-label={label} value={design[key]} maxLength={max} onChange={(e) => update({ [key]: e.target.value })} placeholder={placeholder} className={inputCls} />
    </>
  );

  return (
    <div className="space-y-4 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start lg:gap-8 lg:space-y-0">
      {/* Xem trước mặt trước (và mặt sau) */}
      <div ref={previewRef} className="scroll-mt-4 lg:sticky lg:top-0">
        <div className={`fade-up rounded-3xl border border-line bg-stage p-4 sm:p-6 ${portrait && two ? "grid grid-cols-2 gap-3 sm:gap-5" : "space-y-4"}`}>
          <figure className={portrait && !two ? "mx-auto w-3/5" : ""}>
            <div className={cardShadow}>
              <CardSvg design={design} side="front" svgRef={frontRef} className="block h-auto w-full" editing selectedElementId={selectedId} selectedLayerId={selectedLayer?.side === "front" ? selectedLayer.id : null} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} />
            </div>
            {two && <figcaption className="mt-1.5 text-center text-[11px] text-taupe">Mặt trước</figcaption>}
          </figure>
          {two && (
            <figure>
              <div className={cardShadow}>
                <CardSvg design={design} side="back" svgRef={backRef} className="block h-auto w-full" editing selectedElementId={selectedId} selectedLayerId={selectedLayer?.side === "back" ? selectedLayer.id : null} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} />
              </div>
              <figcaption className="mt-1.5 text-center text-[11px] text-taupe">Mặt sau</figcaption>
            </figure>
          )}
        </div>
        <p className="mt-2 px-1 text-center text-[11px] text-taupe">
          {CARD_SIZES[design.orientation].label} · {two ? "in 2 mặt" : "in 1 mặt"} · khổ danh thiếp chuẩn
        </p>
        <p className="mt-1 px-1 text-center text-[11px] text-taupe">Chạm vào chữ, hình, mã QR hoặc từng ô tích điểm để kéo thả.</p>
        <div className="mt-2 flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs font-semibold text-gold">
          {backCopyFields && <button type="button" onClick={() => backCopyRef.current?.scrollIntoView({ block: "start", behavior: "smooth" })} className="underline underline-offset-4">Sửa chữ mặt sau ↓</button>}
          <button type="button" onClick={() => goPage(NEW_PAGE)} className="underline underline-offset-4">
            Xem {CARD_TEMPLATES.filter((t) => t.isNew).length} mẫu mới ↓
          </button>
        </div>
      </div>

      <div className="space-y-4">

        {/* Thư viện mẫu */}
        <div ref={galleryRef} className="scroll-mt-4">
          <div className="mb-3 mt-2 px-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold">Mẫu thẻ · trang {page + 1}/{pages}</p>
            <h2 className="mt-1 font-serif text-[26px] leading-tight">{CARD_TEMPLATES.length} mẫu thẻ tích điểm</h2>
            <p className="mt-1 text-xs text-taupe">Chạm để dùng mẫu · chữ bạn đã sửa được giữ nguyên</p>
            <div className="mt-3 flex gap-1.5 text-[11px] font-medium">
              <button type="button" onClick={() => setGallerySide("front")} aria-pressed={gallerySide === "front"} className={`${chip(gallerySide === "front")} px-3 py-1.5`}>Xem mặt trước</button>
              <button type="button" onClick={() => setGallerySide("back")} aria-pressed={gallerySide === "back"} className={`${chip(gallerySide === "back")} px-3 py-1.5`}>Xem mặt sau</button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {CARD_TEMPLATES.slice(page * PER_PAGE, (page + 1) * PER_PAGE).map((t) => {
              const on = design.templateId === t.id;
              const preview = previewTemplate(t);
              return (
                <button key={t.id} type="button" onClick={() => { applyTemplate(t); setSelectedId(null); setSelectedLayer(null); drag.current = null; }} className="text-left active:scale-[0.98]">
                  <span className={`flex aspect-square items-center justify-center rounded-2xl bg-stage p-3 transition ${on ? "ring-2 ring-gold ring-offset-2 ring-offset-ivory" : "ring-1 ring-line"}`}>
                    <span className={`block overflow-hidden rounded-md shadow-[0_8px_18px_-10px_rgb(23_22_26/0.6)] ${t.orientation === "portrait" ? "h-full" : "w-full"}`}>
                      <CardSvg design={preview} side={t.sides === 2 ? gallerySide : "front"} className={t.orientation === "portrait" ? "block h-full w-auto" : "block h-auto w-full"} />
                    </span>
                  </span>
                  <span className={`mt-1.5 block px-1 text-[12px] ${on ? "font-semibold" : "text-taupe"}`}>
                    {on ? "✓ " : ""}
                    {t.title}
                    {t.isNew && <span className="ml-1 rounded-full bg-gold/15 px-1.5 py-0.5 text-[9px] font-semibold text-gold">Mới</span>}
                    {t.sides === 2 && <span className="ml-1 text-[10px] text-gold">· 2 mặt</span>}
                  </span>
                </button>
              );
            })}
          </div>
          {pages > 1 && <Pager page={page} pages={pages} onChange={goPage} />}
        </div>
        <Panel title="Trình thiết kế trực tiếp">
          <p className="mb-4 px-1 text-sm leading-6 text-taupe">Khung vẽ lớn, sửa chữ ngay trên thẻ, kéo thả, xoay, thêm ảnh và quản lý từng lớp ở cả hai mặt.</p>
          {launch}
        </Panel>
        <Panel title="Kéo thả toàn bộ bố cục">
          <p className="px-1 text-xs leading-5 text-taupe">Chọn một thành phần ngay trên bản xem trước rồi kéo đến chỗ bạn muốn. Mặt trước và mặt sau được lưu riêng.</p>
          {selectedLayer && layerTransform && <div className="mt-3 rounded-2xl border border-gold/50 bg-white/70 p-3">
            <p className="text-sm font-semibold">{selectedLayer.label}</p>
            <p className="mt-0.5 text-[11px] text-taupe">Mặt {selectedLayer.side === "front" ? "trước" : "sau"} · kéo ngay trên thẻ để đổi vị trí</p>
            <label className="mt-3 block text-xs font-semibold">Kích thước: {Math.round(layerTransform.scale * 100)}%
              <input type="range" min="30" max="300" step="5" value={Math.round(layerTransform.scale * 100)} onChange={(event) => resizeLayer(Number(event.target.value) / 100)} className="mt-2 block w-full accent-gold" />
            </label>
            <button type="button" onClick={() => updateLayout(selectedLayer.side, selectedLayer.id, null)} className="mt-3 rounded-full border border-line bg-white px-4 py-2 text-xs active:scale-[0.98]">Đưa thành phần về chỗ cũ</button>
          </div>}
          <button type="button" onClick={() => { resetLayout(); setSelectedLayer(null); }} disabled={!Object.keys(design.layout.front).length && !Object.keys(design.layout.back).length} className="mt-3 rounded-full border border-line bg-white/70 px-4 py-2 text-xs text-taupe active:scale-[0.98] disabled:opacity-40">Đặt lại bố cục cả hai mặt</button>
        </Panel>

        <Panel title="Thông tin trên thẻ">
          {field("salon", "Tên tiệm", "VD: Tiệm Nail Hồng Nhung")}
          {uses.tagline && field("tagline", "Slogan", "VD: Nail & Beauty", "Không bắt buộc")}
          {uses.title && field("title", "Tiêu đề thẻ", "VD: Thẻ tích điểm")}
          {field("offer", "Ưu đãi", autoOffer(count), "Để trống = tự ghi theo số ô", 60)}
          <div className="grid grid-cols-2 gap-x-3">
            <div>{field("phone", "Số điện thoại", "0909 123 456")}</div>
            <div>{field("website", "Website", "tiemnail.vn", "Không bắt buộc")}</div>
          </div>
          {field("social", "Facebook / Instagram / TikTok", "@tiemnail", "Không bắt buộc")}
          {uses.qr && field("qr", "Link mã QR", "https://facebook.com/tiemnail", "Để trống = không in QR", 200)}
          {uses.member && (
            <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-x-3">
              <div>{field("memberNo", "Số thẻ thành viên", "0336 5432 1459", undefined, 24)}</div>
              <div>{field("valid", "Hạn dùng", "12/26", undefined, 10)}</div>
            </div>
          )}
        </Panel>

        <Panel title="Chèn vào thẻ">
          <p className="px-1 text-xs leading-5 text-taupe">Thêm biểu tượng và chữ, sau đó kéo trực tiếp trên thẻ để đặt vị trí.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => { setEditSide("front"); setSelectedId(null); setSelectedLayer(null); }} aria-pressed={editSide === "front"} className={`${chip(editSide === "front")} px-3 py-2 text-xs`}>Mặt trước</button>
            {two && <button type="button" onClick={() => { setEditSide("back"); setSelectedId(null); setSelectedLayer(null); }} aria-pressed={editSide === "back"} className={`${chip(editSide === "back")} px-3 py-2 text-xs`}>Mặt sau</button>}
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={() => addElement("instagram")} disabled={design.elements.length >= 24} className="flex items-center justify-center gap-2 rounded-2xl border border-gold bg-gold/10 px-3 py-3 text-sm font-semibold text-ink active:scale-[0.98] disabled:opacity-40">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="2.5" y="2.5" width="19" height="19" rx="5" /><circle cx="12" cy="12" r="4.3" /><circle cx="17.6" cy="6.4" r="1" fill="currentColor" stroke="none" /></svg>
              Instagram + tên tài khoản
            </button>
            <button type="button" onClick={() => addElement("text")} disabled={design.elements.length >= 24} className="rounded-2xl border border-line bg-white/70 px-3 py-3 text-sm font-semibold active:scale-[0.98] disabled:opacity-40">＋ Thêm dòng chữ</button>
          </div>
          <button type="button" onClick={() => previewRef.current?.scrollIntoView({ block: "start", behavior: "smooth" })} className="mt-2 px-1 text-xs font-semibold text-gold underline underline-offset-4">Xem và kéo trên thẻ ↑</button>
          {design.elements.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">
            {design.elements.map((element, index) => <button key={element.id} type="button" onClick={() => { setSelectedId(element.id); setSelectedLayer(null); setEditSide(element.side); }} aria-pressed={selectedId === element.id} className={`${chip(selectedId === element.id)} max-w-full truncate px-3 py-1.5 text-xs`}>
              {element.kind === "instagram" ? "◎" : "T"} {element.text || `Mục ${index + 1}`} · {element.side === "front" ? "trước" : "sau"}
            </button>)}
          </div>}
          {selected && <div className="mt-4 border-t border-line pt-1">
            <Label>{selected.kind === "instagram" ? "Tên tài khoản Instagram" : "Nội dung chữ"}</Label>
            <input aria-label={selected.kind === "instagram" ? "Tên tài khoản Instagram đã chèn" : "Nội dung chữ đã chèn"} value={selected.text} maxLength={80} onChange={(event) => editElement({ text: event.target.value })} className={inputCls} placeholder={selected.kind === "instagram" ? "@ten_tai_khoan" : "Nhập nội dung"} />
            <div className="mt-3 flex items-end gap-3">
              <label className="min-w-0 flex-1 text-xs font-semibold">Cỡ chữ / biểu tượng: {selected.size}
                <input type="range" min="14" max="100" value={selected.size} onChange={(event) => editElement({ size: Number(event.target.value) })} className="mt-2 block w-full accent-gold" />
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold">Màu
                <input type="color" value={selected.color} onChange={(event) => editElement({ color: event.target.value })} className="h-9 w-9 cursor-pointer rounded-full border-0 bg-transparent p-0" />
              </label>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {two && <button type="button" onClick={() => { const side = selected.side === "front" ? "back" : "front"; editElement({ side }); setEditSide(side); }} className="rounded-full border border-line bg-white/70 px-4 py-2 text-xs active:scale-[0.98]">Chuyển sang mặt {selected.side === "front" ? "sau" : "trước"}</button>}
              <button type="button" onClick={() => { updateElements((items) => items.filter((item) => item.id !== selected.id)); setSelectedId(null); }} className="rounded-full border border-line bg-white/70 px-4 py-2 text-xs text-taupe active:scale-[0.98]">Xóa mục đang chọn</button>
            </div>
          </div>}
        </Panel>

        {backCopyFields && (
          <div ref={backCopyRef} className="scroll-mt-4">
            <Panel title="Nội dung mặt sau">
              <p className="px-1 text-xs text-taupe">Mỗi ô tương ứng một dòng chữ trên mặt sau.</p>
              {backCopyFields.backTitle !== undefined && field("backTitle", "Lời chính", backCopyFields.backTitle, undefined, 70)}
              {backCopyFields.backLine1 !== undefined && field("backLine1", "Dòng lời nhắn 1", backCopyFields.backLine1, undefined, 90)}
              {backCopyFields.backLine2 !== undefined && field("backLine2", "Dòng lời nhắn 2", backCopyFields.backLine2, undefined, 90)}
            </Panel>
          </div>
        )}

        <Panel title="Ô tích điểm">
          <Label hint={`${count} ô`}>Số lần làm để nhận quà</Label>
          <div className="flex flex-wrap gap-2">
            {[5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
              <button key={n} type="button" onClick={() => update({ stamps: n, midAt: design.midAt >= n ? 0 : design.midAt })} aria-pressed={count === n} className={`${chip(count === n)} min-w-12 px-3 py-2 text-sm`}>
                {n}
              </button>
            ))}
          </div>
          {field("reward", "Chữ ở ô cuối (quà)", "VD: Miễn phí", undefined, 12)}
          <Label hint="Tặng thêm ở giữa chặng">Quà giữa chừng</Label>
          <div className="flex flex-wrap gap-2">
            {[0, Math.floor(count / 2), Math.floor(count / 2) + 1].filter((v, i, a) => a.indexOf(v) === i).map((v) => (
              <button key={v} type="button" onClick={() => update({ midAt: v })} aria-pressed={design.midAt === v} className={`${chip(design.midAt === v)} px-3 py-2 text-sm`}>
                {v === 0 ? "Không có" : `Ở ô thứ ${v}`}
              </button>
            ))}
          </div>
          {design.midAt > 0 && field("midReward", "Chữ ở ô quà giữa chừng", "VD: -50%", undefined, 10)}
        </Panel>

        <Panel title="Màu sắc">
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ["bg", "Màu nền"],
                ["ink", "Màu chữ"],
                ["accent", "Ô quà tặng"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 rounded-2xl border border-line bg-white/70 px-2.5 py-2 text-[11px]">
                <input type="color" value={design.colors[key]} onChange={(e) => setColors({ [key]: e.target.value })} className="h-7 w-7 shrink-0 cursor-pointer rounded-full border-0 bg-transparent p-0" />
                {label}
              </label>
            ))}
          </div>
          <button type="button" onClick={() => { reset(); setSelectedId(null); setSelectedLayer(null); drag.current = null; }} className="mt-4 w-full rounded-full border border-line bg-white/70 py-2.5 text-sm text-taupe active:scale-[0.98]">
            Đặt lại mẫu này
          </button>
        </Panel>
      </div>
    </div>
  );
}

/* ---------- Footer của tab Thẻ tích điểm ---------- */

export function CardFooter({ editor }: { editor: CardEditor }) {
  const { design, download, busy } = editor;
  const t = CARD_TEMPLATES.find((x) => x.id === design.templateId);
  const { w, h } = CARD_SIZES[design.orientation];
  return (
    <ExportBar
      busy={!!busy}
      onDownload={download}
      recommended="pdf"
      info={
        <>
          Thẻ miễn phí · {t?.title} · {w * CARD_EXPORT_SCALE}×{h * CARD_EXPORT_SCALE}px ({CARD_EXPORT_DPI}dpi)
          {design.sides === 2 ? " · PDF gộp 2 mặt" : ""}
        </>
      }
    />
  );
}
