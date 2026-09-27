"use client";

import { useEffect, useRef, useState } from "react";
import {
  STAMP_INKS,
  STAMP_SIZE_MM,
  STAMP_TEMPLATES,
  BRANDED_STAMP_TEMPLATES,
  TYPOGRAPHY_STAMP_TEMPLATES,
  stampDesignFrom,
  type StampDesign,
  type StampTemplate,
} from "@/lib/stamp-templates";
import type { EditorConfig } from "../card/CanvasEditor";
import { CanvasSvg } from "../card/CanvasSvg";
import { DesignerPanel } from "../design/DesignerPanel";
import { downloadDesign, type ExportKind } from "../design/export";
import { useCanvasDraft } from "../design/useCanvasDraft";
import { ExportBar } from "../design/ExportBar";
import { Label, Panel, chip, inputCls } from "../design/ui";
import { StampSvg } from "./StampSvg";

const STORAGE_KEY = "naile-stamp-design";
// File tải về: 1200 px cho 10 mm (≈ 3048 dpi) — đủ nét để xưởng khắc dấu.
const EXPORT_PX = 1200;
const EXPORT_DPI = Math.round((EXPORT_PX / STAMP_SIZE_MM) * 25.4);
// Trình thiết kế tự do: khung 100×100, xuất cùng cỡ như tải theo mẫu.
const STAMP_EDITOR: EditorConfig = {
  title: "Trình thiết kế con dấu",
  backLabel: "Về mẫu con dấu",
  fileBase: "con-dau",
  exportScale: EXPORT_PX / 100,
  dpi: EXPORT_DPI,
  pdfLabel: "PDF · đúng cỡ 1 cm",
  hint: "Chọn chữ hoặc hình để kéo thả, đổi cỡ, xoay và đổi màu mực. Dấu chỉ rộng 1 cm: giữ nét đậm, chữ ít để khắc rõ.",
  subject: "con dấu",
  pageNames: ["Con dấu"],
};

/* ---------- Trạng thái ---------- */

export function useStampEditor() {
  const [design, setDesign] = useState<StampDesign>(() =>
    stampDesignFrom(STAMP_TEMPLATES[0]),
  );
  const [busy, setBusy] = useState<"" | ExportKind>("");
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as Partial<StampDesign>;
      const t =
        STAMP_TEMPLATES.find((x) => x.id === parsed.templateId) ??
        STAMP_TEMPLATES[0];
      // eslint-disable-next-line react-hooks/set-state-in-effect -- đọc bản lưu sau khi hydrate
      setDesign(stampDesignFrom(t, parsed));
    } catch {}
  }, []);

  const change = (fn: (d: StampDesign) => StampDesign) =>
    setDesign((prev) => {
      const next = fn(prev);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  const update = (patch: Partial<StampDesign>) =>
    change((d) => ({ ...d, ...patch }));
  // Đổi mẫu: giữ chữ và màu mực khách đã chọn; mẫu "cảm ơn" dùng chữ riêng của nó.
  const applyTemplate = (t: StampTemplate) =>
    change((d) => {
      const prev = STAMP_TEMPLATES.find((x) => x.id === d.templateId);
      const keepName =
        prev?.id !== "scallop-thanks" &&
        t.id !== "scallop-thanks" &&
        d.name !== prev?.name;
      return stampDesignFrom(t, {
        ...(keepName ? { name: d.name } : {}),
        tagline: d.tagline !== prev?.tagline ? d.tagline : t.tagline,
        color: d.color,
      });
    });

  async function download(kind: ExportKind) {
    if (!ref.current || busy) return;
    setBusy(kind);
    try {
      await downloadDesign(
        ref.current,
        kind,
        `con-dau-${design.name}`,
        EXPORT_PX,
        EXPORT_PX,
        EXPORT_DPI,
      );
    } finally {
      setBusy("");
    }
  }

  return { design, update, applyTemplate, download, busy, ref };
}
export type StampEditor = ReturnType<typeof useStampEditor>;

/* ---------- Giao diện ---------- */

export function StampStudio({ editor }: { editor: StampEditor }) {
  const { design, update, applyTemplate, ref } = editor;
  const [galleryPage, setGalleryPage] = useState<number | null>(null);
  const template =
    STAMP_TEMPLATES.find((t) => t.id === design.templateId) ??
    STAMP_TEMPLATES[0];
  const pageSize = 10;
  const pageCount = Math.ceil(STAMP_TEMPLATES.length / pageSize);
  const activeIndex = STAMP_TEMPLATES.findIndex((t) => t.id === design.templateId);
  const page = galleryPage ?? Math.floor(Math.max(0, activeIndex) / pageSize) + 1;
  const pageTemplates = STAMP_TEMPLATES.slice((page - 1) * pageSize, page * pageSize);
  const brandedPages = Math.ceil(BRANDED_STAMP_TEMPLATES.length / pageSize);
  const typographyPages = Math.ceil(TYPOGRAPHY_STAMP_TEMPLATES.length / pageSize);
  const galleryTitle =
    page <= brandedPages
      ? "20 mẫu tên tiệm"
      : page <= brandedPages + typographyPages
        ? "20 mẫu chữ mới"
        : "20 mẫu dấu cơ bản";
  const usesTagline = design.templateId === "ring-text";
  // Bản thiết kế tự do của mẫu đang chọn (nếu khách đã mở trình thiết kế).
  const draft = useCanvasDraft(`stamp:${design.templateId}`);
  const free = draft.doc;
  const art = (className: string, withRef = false) =>
    free ? (
      <CanvasSvg
        page={free.pages[0]}
        svgRef={withRef ? ref : undefined}
        className={className}
      />
    ) : (
      <StampSvg
        design={design}
        svgRef={withRef ? ref : undefined}
        className={className}
      />
    );

  const gallery = (
    <div>
      <div className="mb-3 px-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-gold">
          Mẫu con dấu · Trang {page}/{pageCount}
        </p>
        <h2 className="mt-1 font-serif text-[26px] leading-tight">
          {galleryTitle}
        </h2>
        <p className="mt-1 text-xs text-taupe">
          Chạm để dùng mẫu · tên tiệm và màu mực đều sửa được
        </p>
      </div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
        {pageTemplates.map((t) => {
          const on = design.templateId === t.id;
          const preview = stampDesignFrom(t, {
            color: design.color,
            ...(t.id !== "scallop-thanks" &&
            template.id !== "scallop-thanks" &&
            design.name !== template.name
              ? { name: design.name }
              : {}),
          });
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => applyTemplate(t)}
              aria-pressed={on}
              className="text-left active:scale-[0.97]"
            >
              <span
                className={`block rounded-2xl bg-white p-3 transition ${on ? "ring-2 ring-gold ring-offset-2 ring-offset-ivory" : "ring-1 ring-line"}`}
              >
                <StampSvg design={preview} className="block aspect-square w-full" />
              </span>
              <span
                className={`mt-1.5 block px-0.5 text-[11px] leading-snug ${on ? "font-semibold" : "text-taupe"}`}
              >
                {on ? "✓ " : ""}{t.title}
              </span>
            </button>
          );
        })}
      </div>
      <nav aria-label="Trang mẫu con dấu" className="mt-5 flex flex-wrap items-center justify-center gap-2">
        {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setGalleryPage(n)}
            aria-current={page === n ? "page" : undefined}
            className={`${chip(page === n)} min-w-10 px-3 py-2 text-sm`}
          >
            {n}
          </button>
        ))}
      </nav>
    </div>
  );

  return (
    <div className="space-y-5 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start lg:gap-8 lg:space-y-0">
      <div className="space-y-3 lg:sticky lg:top-0">
        <div className="fade-up rounded-3xl border border-line bg-white p-6 sm:p-8">
          {/* Vòng nét đứt chỉ để canh cỡ 1 cm, nằm ngoài file tải về. */}
          <div className="relative mx-auto aspect-square w-full max-w-[300px]">
            <span className="pointer-events-none absolute inset-[0.5%] rounded-full border border-dashed border-black/15" />
            {art("relative block h-full w-full", true)}
          </div>
        </div>
        {/* Mô phỏng thẻ tích điểm với dấu cỡ thật */}
        <div className="rounded-2xl border border-line bg-[#fbf8f3] p-4">
          <div className="mx-auto grid w-fit grid-cols-5 gap-2">
            {Array.from({ length: 10 }, (_, i) => (
              <span
                key={i}
                className="grid h-11 w-11 place-items-center rounded-full border border-dashed border-[#cbbfae] bg-white"
              >
                {i < 6 && (
                  <span
                    style={{
                      transform: `rotate(${[-8, 5, -3, 9, -12, 4][i]}deg)`,
                      opacity: 0.88,
                    }}
                    className="block h-10 w-10"
                  >
                    {art("block h-full w-full")}
                  </span>
                )}
              </span>
            ))}
          </div>
          <p className="mt-2 text-center text-[11px] text-taupe">
            Mô phỏng đóng dấu trên thẻ tích điểm
          </p>
        </div>
        <p className="text-center text-[11px] text-taupe">
          Dấu tròn {STAMP_SIZE_MM} mm · 1 màu mực · file {EXPORT_PX}×{EXPORT_PX}{" "}
          px
        </p>
      </div>

      <div className="space-y-4">
        {gallery}
        <DesignerPanel
          draft={draft}
          capture={() => (ref.current ? [ref.current] : [])}
          name={`Con dấu · ${design.name}`}
          config={STAMP_EDITOR}
          what="con dấu"
        />
        {!free && (
          <Panel title="Nội dung con dấu">
            <Label
              hint={
                design.templateId === "scallop-thanks"
                  ? "VD: Thank you, Cảm ơn"
                  : "Ngắn gọn để khắc rõ"
              }
            >
              {design.templateId === "scallop-thanks"
                ? "Chữ trên dấu"
                : "Tên tiệm"}
            </Label>
            <input
              value={design.name}
              maxLength={24}
              onChange={(e) => update({ name: e.target.value })}
              placeholder="VD: Good Nails"
              className={inputCls}
            />
            {usesTagline && (
              <>
                <Label hint="Không bắt buộc">Dòng chữ vòng dưới</Label>
                <input
                  value={design.tagline}
                  maxLength={18}
                  onChange={(e) => update({ tagline: e.target.value })}
                  placeholder="VD: Since 2024"
                  className={inputCls}
                />
              </>
            )}
            <p className="mt-2 px-1 text-[11px] text-taupe">
              Dấu chỉ rộng 1 cm: tên càng ngắn chữ càng to, dễ đọc. Mẫu chữ lồng
              tự lấy chữ cái đầu của tên tiệm.
            </p>

            <Label>Màu mực</Label>
            <div className="flex flex-wrap items-center gap-2">
              {STAMP_INKS.map((ink) => (
                <button
                  key={ink.id}
                  type="button"
                  onClick={() => update({ color: ink.color })}
                  aria-pressed={design.color === ink.color}
                  title={ink.label}
                  className={`${chip(design.color === ink.color)} flex items-center gap-1.5 px-2.5 py-1.5 text-[12px]`}
                >
                  <span
                    className="h-4 w-4 rounded-full"
                    style={{ background: ink.color }}
                  />
                  {ink.label}
                </button>
              ))}
              <label className="flex items-center gap-1.5 rounded-full border border-line bg-white/70 px-2.5 py-1.5 text-[12px]">
                <input
                  type="color"
                  value={design.color}
                  onChange={(e) => update({ color: e.target.value })}
                  className="h-5 w-5 cursor-pointer rounded-full border-0 bg-transparent p-0"
                />
                Màu khác
              </label>
            </div>
          </Panel>
        )}

      </div>
    </div>
  );
}

export function StampFooter({ editor }: { editor: StampEditor }) {
  const t = STAMP_TEMPLATES.find((x) => x.id === editor.design.templateId);
  return (
    <ExportBar
      busy={!!editor.busy}
      onDownload={editor.download}
      recommended="png"
      info={
        <>
          Con dấu {STAMP_SIZE_MM} mm · <b>{t?.title}</b> · PNG nền trong / SVG
          gửi xưởng khắc · PDF đúng cỡ 1 cm
        </>
      }
    />
  );
}
