"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { FLYER_BACK_COPY, FLYER_SIZE, FLYER_TEMPLATES, flyerDesignFrom, type FlyerDesign, type FlyerTemplate } from "@/lib/flyer-templates";
import { downloadDesign, type ExportKind } from "../design/export";
import { ExportBar } from "../design/ExportBar";
import { DesignerPanel } from "../design/DesignerPanel";
import { Label, Pager, Panel, chip, inputCls } from "../design/ui";
import { CanvasSvg } from "../card/CanvasSvg";
import type { EditorConfig } from "../card/CanvasEditor";
import { useCanvasDraft } from "../design/useCanvasDraft";
import { FlyerSvg } from "./FlyerSvg";
import { FlyerFrontSvg } from "./FlyerFrontSvg";
import { scrollToEl } from "../scroll";

const STORAGE_KEY = "naile-flyer-design";
const PAGE_SIZE = 10;
const FLYER_EDITOR: EditorConfig = {
  title: "Trình thiết kế tờ rơi",
  backLabel: "Về mẫu tờ rơi",
  fileBase: "to-roi-khai-truong",
  exportScale: FLYER_SIZE.width / 600,
  dpi: FLYER_SIZE.dpi,
  pdfLabel: "PDF · A4 hai mặt",
  hint: "Chọn chữ hoặc hoạ tiết để kéo thả, đổi cỡ và chỉnh màu. Bạn cũng có thể thêm logo, hình ảnh hoặc mã QR.",
  subject: "tờ rơi",
  pageNames: ["Mặt trước", "Mặt sau"],
};

const CONTENT_KEYS = ["salon", "headline", "discount", "service", "dates", "address", "phone", "note"] as const;
const contentOf = (d: FlyerDesign) => Object.fromEntries(CONTENT_KEYS.map((key) => [key, d[key]])) as Partial<FlyerDesign>;
const backOverridesOf = (d: FlyerDesign): Partial<FlyerDesign> => {
  const original = FLYER_BACK_COPY[d.templateId];
  return {
    backHeading: d.backHeading !== original?.[0] ? d.backHeading : undefined,
    backMessage: d.backMessage !== original?.[1] ? d.backMessage : undefined,
  };
};
const backDesign = (d: FlyerDesign): FlyerDesign => ({ ...d, headline: d.backHeading, note: d.backMessage });

export function useFlyerEditor() {
  const [design, setDesign] = useState<FlyerDesign>(() => flyerDesignFrom(FLYER_TEMPLATES[0]));
  const [busy, setBusy] = useState<"" | ExportKind>("");
  const frontRef = useRef<SVGSVGElement>(null);
  const backRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as Partial<FlyerDesign>;
      const template = FLYER_TEMPLATES.find((item) => item.id === parsed.templateId) ?? FLYER_TEMPLATES[0];
      // eslint-disable-next-line react-hooks/set-state-in-effect -- đọc bản lưu sau khi hydrate
      setDesign(flyerDesignFrom(template, parsed));
    } catch {}
  }, []);

  const change = (fn: (d: FlyerDesign) => FlyerDesign) => setDesign((previous) => {
    const next = fn(previous);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
    return next;
  });
  const update = (patch: Partial<FlyerDesign>) => change((d) => ({ ...d, ...patch }));
  const applyTemplate = (template: FlyerTemplate) => change((d) => flyerDesignFrom(template, { ...contentOf(d), ...backOverridesOf(d) }));
  const reset = () => change((d) => flyerDesignFrom(FLYER_TEMPLATES.find((item) => item.id === d.templateId) ?? FLYER_TEMPLATES[0]));

  async function download(kind: ExportKind) {
    if (!frontRef.current || !backRef.current || busy) return;
    setBusy(kind);
    try {
      await downloadDesign(
        [{ el: frontRef.current, suffix: "mat-truoc" }, { el: backRef.current, suffix: "mat-sau" }],
        kind,
        `to-roi-khai-truong-${design.salon}`,
        FLYER_SIZE.width, FLYER_SIZE.height, FLYER_SIZE.dpi,
      );
    } finally {
      setBusy("");
    }
  }

  return { design, update, applyTemplate, reset, download, busy, frontRef, backRef };
}

export type FlyerEditor = ReturnType<typeof useFlyerEditor>;

// gallery: thư viện dùng chung của tab (có cả mẫu quảng cáo 1 mặt); không truyền thì dùng thư viện riêng.
export function FlyerStudio({ editor, gallery }: { editor: FlyerEditor; gallery?: ReactNode }) {
  const { design, update, applyTemplate, reset, frontRef, backRef } = editor;
  const [page, setPage] = useState(0);
  const [previewSide, setPreviewSide] = useState<"front" | "back">("front");
  const [gallerySide, setGallerySide] = useState<"front" | "back">("front");
  const galleryRef = useRef<HTMLDivElement>(null);
  const draft = useCanvasDraft(`flyer:${design.templateId}`);
  const free = draft.doc;
  const galleryContent = { ...contentOf(design), ...backOverridesOf(design) };
  const pages = Math.ceil(FLYER_TEMPLATES.length / PAGE_SIZE);
  const changePage = (next: number) => {
    setPage(next);
    scrollToEl(galleryRef.current);
  };

  const field = (key: Exclude<(typeof CONTENT_KEYS)[number], "discount">, label: string, maxLength: number, hint?: string) => <>
    <Label hint={hint}>{label}</Label>
    <input value={design[key]} maxLength={maxLength} onChange={(event) => update({ [key]: event.target.value })} className={inputCls} />
  </>;

  return <div className="space-y-5 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start lg:gap-8 lg:space-y-0">
    <div className="space-y-3 lg:sticky lg:top-0">
      <div className="mx-auto flex w-fit rounded-full border border-line bg-cream/80 p-1 text-xs font-medium">
        <button type="button" onClick={() => setPreviewSide("front")} aria-pressed={previewSide === "front"} className={`rounded-full px-4 py-1.5 ${previewSide === "front" ? "bg-ink text-white" : "text-taupe"}`}>Mặt trước · ảnh móng</button>
        <button type="button" onClick={() => setPreviewSide("back")} aria-pressed={previewSide === "back"} className={`rounded-full px-4 py-1.5 ${previewSide === "back" ? "bg-ink text-white" : "text-taupe"}`}>Mặt sau · lời mời</button>
      </div>
      <div className="fade-up rounded-3xl border border-line bg-stage p-4 sm:p-6">
        <div className="mx-auto overflow-hidden rounded-sm shadow-[0_16px_35px_-16px_rgb(23_22_26/0.55)]" style={{ maxWidth: "min(100%, calc((100dvh - 13rem) * 0.707))" }}>
          {free ? <>
            <div className={previewSide === "front" ? "" : "hidden"}><CanvasSvg page={free.pages[0]} svgRef={frontRef} className="block h-auto w-full" /></div>
            {free.pages[1] && <div className={previewSide === "back" ? "" : "hidden"}><CanvasSvg page={free.pages[1]} svgRef={backRef} className="block h-auto w-full" /></div>}
          </> : <>
            <div className={previewSide === "front" ? "" : "hidden"}><FlyerFrontSvg design={design} svgRef={frontRef} className="block h-auto w-full" /></div>
            <div className={previewSide === "back" ? "" : "hidden"}><FlyerSvg design={backDesign(design)} svgRef={backRef} className="block h-auto w-full" /></div>
          </>}
        </div>
      </div>
      <p className="text-center text-[11px] text-taupe">Khổ A4 · 210 × 297 mm · hai mặt · 300 dpi</p>
    </div>

    <div className="space-y-4">

      {gallery ?? <div ref={galleryRef} className="scroll-mt-4">
        <div className="mb-3 px-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-gold">Tờ rơi A4 · trang {page + 1}/{pages}</p>
          <h2 className="mt-1 font-serif text-[27px] leading-tight">{FLYER_TEMPLATES.length} mẫu khai trương tiệm nail</h2>
          <p className="mt-1 text-xs text-taupe">Ảnh móng chụp thật ở mặt trước · 20 mặt sau riêng · đổi mẫu vẫn giữ nội dung</p>
          <div className="mt-3 flex gap-1.5 text-[11px] font-medium">
            <button type="button" onClick={() => setGallerySide("front")} aria-pressed={gallerySide === "front"} className={`${chip(gallerySide === "front")} px-3 py-1.5`}>Xem mặt trước</button>
            <button type="button" onClick={() => setGallerySide("back")} aria-pressed={gallerySide === "back"} className={`${chip(gallerySide === "back")} px-3 py-1.5`}>Xem mặt sau</button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {FLYER_TEMPLATES.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((template) => {
            const selected = design.templateId === template.id;
            const candidate = flyerDesignFrom(template, galleryContent);
            return <button key={template.id} type="button" onClick={() => { applyTemplate(template); setPreviewSide(gallerySide); }} className="text-left active:scale-[0.98]" aria-pressed={selected}>
              <span className={`block overflow-hidden rounded-lg bg-white shadow-sm transition ${selected ? "ring-2 ring-gold ring-offset-2 ring-offset-ivory" : "ring-1 ring-line"}`}>
                {gallerySide === "front" ? <FlyerFrontSvg design={candidate} className="block h-auto w-full" /> : <FlyerSvg design={backDesign(candidate)} className="block h-auto w-full" />}
              </span>
              <span className={`mt-1.5 block px-0.5 text-xs ${selected ? "font-semibold" : "text-taupe"}`}>{selected ? "✓ " : ""}{template.title}</span>
              <span className="block px-0.5 text-[10px] text-gold">{template.mood}</span>
            </button>;
          })}
        </div>
        <Pager page={page} pages={pages} onChange={changePage} />
      </div>}
      <DesignerPanel draft={draft} capture={() => [frontRef.current, backRef.current].filter((el): el is SVGSVGElement => !!el)} name={`Tờ rơi · ${design.salon}`} config={FLYER_EDITOR} what="tờ rơi (cả hai mặt)" />

      {!free && <Panel title="Nội dung tờ rơi">
        {field("salon", "Tên tiệm", 42)}
        {field("headline", "Tiêu đề khai trương", 38)}
        <Label>Mức giảm (%)</Label>
        <input inputMode="numeric" value={design.discount} maxLength={3} onChange={(event) => update({ discount: event.target.value.replace(/\D/g, "").slice(0, 3) })} className={inputCls} />
        <div className="mt-2 flex flex-wrap gap-2">
          {[20, 30, 40, 50].map((value) => <button key={value} type="button" onClick={() => update({ discount: String(value) })} aria-pressed={design.discount === String(value)} className={`${chip(design.discount === String(value))} px-3 py-1.5 text-xs`}>{value}%</button>)}
        </div>
        {field("service", "Áp dụng cho", 58)}
        {field("dates", "Thời gian ưu đãi", 32)}
        {field("address", "Địa chỉ tiệm", 66)}
        {field("phone", "Số điện thoại", 28)}
        {field("note", "Lời mời / lưu ý", 68, "Không bắt buộc")}
        <button type="button" onClick={reset} className="mt-5 w-full rounded-full border border-line bg-white/70 py-2.5 text-sm text-taupe active:scale-[0.98]">Đặt lại nội dung mẫu này</button>
      </Panel>}

      {!free && <Panel title="Lời mời mặt sau">
        <Label>Tiêu đề</Label>
        <input value={design.backHeading} maxLength={38} onChange={(event) => update({ backHeading: event.target.value })} className={inputCls} />
        <Label>Lời nhắn</Label>
        <input value={design.backMessage} maxLength={72} onChange={(event) => update({ backMessage: event.target.value })} className={inputCls} />
        <p className="mt-2 text-[11px] text-taupe">Mỗi mẫu có lời nhắn và thiết kế mặt sau riêng.</p>
      </Panel>}

    </div>
  </div>;
}

export function FlyerFooter({ editor }: { editor: FlyerEditor }) {
  const template = FLYER_TEMPLATES.find((item) => item.id === editor.design.templateId);
  return <ExportBar busy={!!editor.busy} onDownload={editor.download} recommended="pdf" info={<>Tờ rơi A4 · 2 mặt · <b>{template?.title}</b> · 2480 × 3508 px mỗi mặt · 300 dpi</>} />;
}
