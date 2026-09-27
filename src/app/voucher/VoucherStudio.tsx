"use client";

import { useEffect, useRef, useState } from "react";
import {
  VOUCHER_EXPORT_DPI,
  VOUCHER_EXPORT_SCALE,
  VOUCHER_SIZE,
  VOUCHER_TEMPLATES,
  voucherDesignFrom,
  type VoucherColors,
  type VoucherDesign,
  type VoucherTemplate,
} from "@/lib/voucher-templates";
import { downloadDesign, type ExportKind } from "../design/export";
import { ExportBar } from "../design/ExportBar";
import { Label, Pager, Panel, chip, inputCls } from "../design/ui";
import { VoucherBackSvg } from "./VoucherBackSvg";
import { VoucherSvg } from "./VoucherSvg";
import type { EditorConfig } from "../card/CanvasEditor";
import { CanvasSvg } from "../card/CanvasSvg";
import { DesignerPanel } from "../design/DesignerPanel";
import { useCanvasDraft } from "../design/useCanvasDraft";

const STORAGE_KEY = "naile-voucher-design";
const PER_PAGE = 10;
// Trang có mẫu mới đầu tiên (nút "Xem mẫu mới").
const NEW_PAGE = Math.max(0, Math.floor(VOUCHER_TEMPLATES.findIndex((t) => t.isNew) / PER_PAGE));

// Trình thiết kế tự do cho voucher: 2 mặt, xuất cùng khổ DL 300dpi như tải theo mẫu.
const VOUCHER_EDITOR: EditorConfig = {
  title: "Trình thiết kế voucher",
  backLabel: "Về mẫu voucher",
  fileBase: "voucher",
  exportScale: VOUCHER_EXPORT_SCALE,
  dpi: VOUCHER_EXPORT_DPI,
  pdfLabel: "PDF · In 2 mặt",
  hint: "Chọn chữ, trị giá, khung hay hoạ tiết để chỉnh. Có thể thêm ảnh, logo, biểu tượng hoặc mã QR. Mỗi mặt có bố cục riêng.",
};
const VALUE_PRESETS = ["200.000đ", "500.000đ", "1.000.000đ", "Giảm 20%", "Giảm 50%"];

// Nội dung khách tự gõ: giữ lại khi đổi sang mẫu khác.
const CONTENT_KEYS = ["salon", "title", "value", "service", "code", "expiry", "phone", "website", "terms"] as const;
const contentOf = (d: VoucherDesign) => Object.fromEntries(CONTENT_KEYS.map((k) => [k, d[k]])) as Partial<VoucherDesign>;
const backOverridesOf = (d: VoucherDesign): Partial<VoucherDesign> => {
  const previous = VOUCHER_TEMPLATES.find((t) => t.id === d.templateId);
  return {
    backHeading: d.backHeading !== previous?.backHeading ? d.backHeading : undefined,
    backLine1: d.backLine1 !== previous?.backLine1 ? d.backLine1 : undefined,
    backLine2: d.backLine2 !== previous?.backLine2 ? d.backLine2 : undefined,
  };
};

/* ---------- Trạng thái trình sửa voucher ---------- */

export function useVoucherEditor() {
  const [design, setDesign] = useState<VoucherDesign>(() => voucherDesignFrom(VOUCHER_TEMPLATES[0]));
  const [busy, setBusy] = useState<"" | ExportKind>("");
  const frontRef = useRef<SVGSVGElement>(null);
  const backRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<VoucherDesign>;
        const template = VOUCHER_TEMPLATES.find((t) => t.id === parsed.templateId) ?? VOUCHER_TEMPLATES[0];
        // Bản lưu cũ chưa có nội dung mặt sau; lấy lời cảm ơn đúng với mẫu đã chọn.
        // eslint-disable-next-line react-hooks/set-state-in-effect -- chỉ đọc 1 lần sau khi mở trang
        setDesign({ ...voucherDesignFrom(template), ...parsed });
      }
    } catch {}
  }, []);

  // Chỉ lưu khi người dùng thay đổi (không lưu lúc khởi tạo, tránh ghi đè bản đã lưu).
  const change = (fn: (d: VoucherDesign) => VoucherDesign) =>
    setDesign((d) => {
      const next = fn(d);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

  const update = (patch: Partial<VoucherDesign>) => change((d) => ({ ...d, ...patch }));
  const setColors = (patch: Partial<VoucherColors>) => change((d) => ({ ...d, colors: { ...d.colors, ...patch } }));
  const applyTemplate = (t: VoucherTemplate) => change((d) => voucherDesignFrom(t, { ...contentOf(d), ...backOverridesOf(d) }));
  const reset = () => {
    const t = VOUCHER_TEMPLATES.find((x) => x.id === design.templateId) ?? VOUCHER_TEMPLATES[0];
    change(() => voucherDesignFrom(t));
  };

  async function download(kind: ExportKind) {
    if (!frontRef.current || !backRef.current || busy) return;
    setBusy(kind);
    try {
      const { w, h } = VOUCHER_SIZE;
      await downloadDesign(
        [{ el: frontRef.current, suffix: "mat-truoc" }, { el: backRef.current, suffix: "mat-sau" }],
        kind,
        `voucher-${design.salon}`,
        w * VOUCHER_EXPORT_SCALE,
        h * VOUCHER_EXPORT_SCALE,
        VOUCHER_EXPORT_DPI,
      );
    } finally {
      setBusy("");
    }
  }

  return { design, update, setColors, applyTemplate, reset, download, busy, frontRef, backRef };
}

export type VoucherEditor = ReturnType<typeof useVoucherEditor>;

/* ---------- Giao diện ---------- */

export function VoucherStudio({ editor }: { editor: VoucherEditor }) {
  const { design, update, setColors, applyTemplate, reset, frontRef, backRef } = editor;
  // Bản thiết kế tự do (kéo thả) của mẫu đang chọn, nếu khách đã mở trình thiết kế.
  const draft = useCanvasDraft(`voucher:${design.templateId}`);
  const free = draft.doc;
  const [page, setPage] = useState(0);
  const [previewSide, setPreviewSide] = useState<"front" | "back">("front");
  const [gallerySide, setGallerySide] = useState<"front" | "back">("front");
  const galleryContent = { ...contentOf(design), ...backOverridesOf(design) };
  const pages = Math.ceil(VOUCHER_TEMPLATES.length / PER_PAGE);
  const galleryRef = useRef<HTMLDivElement>(null);
  const goPage = (p: number) => {
    setPage(p);
    galleryRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  };

  const field = (key: (typeof CONTENT_KEYS)[number], label: string, placeholder: string, hint?: string, max = 40) => (
    <>
      <Label hint={hint}>{label}</Label>
      <input value={design[key]} maxLength={max} onChange={(e) => update({ [key]: e.target.value })} placeholder={placeholder} className={inputCls} />
    </>
  );

  return (
    <div className="space-y-4 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start lg:gap-8 lg:space-y-0">
      {/* Xem trước: máy tính thì cố định bên trái */}
      <div className="space-y-3 lg:sticky lg:top-0">
        <div className="mx-auto flex w-fit rounded-full border border-line bg-cream/80 p-1 text-xs font-medium">
          <button type="button" onClick={() => setPreviewSide("front")} aria-pressed={previewSide === "front"} className={`rounded-full px-4 py-1.5 ${previewSide === "front" ? "bg-ink text-cream" : "text-taupe"}`}>Mặt trước</button>
          <button type="button" onClick={() => setPreviewSide("back")} aria-pressed={previewSide === "back"} className={`rounded-full px-4 py-1.5 ${previewSide === "back" ? "bg-ink text-cream" : "text-taupe"}`}>Mặt sau · lời cảm ơn</button>
        </div>
        <div className="fade-up rounded-3xl border border-line bg-stage p-4 sm:p-6">
          <div className="overflow-hidden rounded-md shadow-[0_18px_36px_-22px_rgb(23_22_26/0.6)] ring-1 ring-black/5">
            {free ? (
              <>
                <div className={previewSide === "front" ? "" : "hidden"}><CanvasSvg page={free.pages[0]} svgRef={frontRef} className="block h-auto w-full" /></div>
                {free.pages[1] && <div className={previewSide === "back" ? "" : "hidden"}><CanvasSvg page={free.pages[1]} svgRef={backRef} className="block h-auto w-full" /></div>}
              </>
            ) : (
              <>
                <div className={previewSide === "front" ? "" : "hidden"}><VoucherSvg design={design} svgRef={frontRef} className="block h-auto w-full" /></div>
                <div className={previewSide === "back" ? "" : "hidden"}><VoucherBackSvg design={design} svgRef={backRef} className="block h-auto w-full" /></div>
              </>
            )}
          </div>
        </div>
        <p className="px-1 text-center text-[11px] text-taupe">2 mặt · {VOUCHER_SIZE.label} · mặt trước có dòng Người nhận / Người tặng để viết tay</p>
        <button type="button" onClick={() => goPage(NEW_PAGE)} className="mx-auto block text-xs font-semibold text-gold underline underline-offset-4">Xem {VOUCHER_TEMPLATES.filter((t) => t.isNew).length} mẫu mới ↓</button>
      </div>

      <div className="space-y-4">

        <div ref={galleryRef} className="scroll-mt-4">
          <div className="mb-3 mt-2 px-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold">Mẫu voucher · trang {page + 1}/{pages}</p>
            <h2 className="mt-1 font-serif text-[26px] leading-tight">{VOUCHER_TEMPLATES.length} mẫu phiếu quà tặng</h2>
            <p className="mt-1 text-xs text-taupe">Mỗi mẫu có mặt sau riêng · nội dung bạn đã sửa được giữ nguyên</p>
            <div className="mt-3 flex gap-1.5 text-[11px] font-medium">
              <button type="button" onClick={() => setGallerySide("front")} aria-pressed={gallerySide === "front"} className={`${chip(gallerySide === "front")} px-3 py-1.5`}>Xem mặt trước</button>
              <button type="button" onClick={() => setGallerySide("back")} aria-pressed={gallerySide === "back"} className={`${chip(gallerySide === "back")} px-3 py-1.5`}>Xem mặt sau</button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {VOUCHER_TEMPLATES.slice(page * PER_PAGE, (page + 1) * PER_PAGE).map((t) => {
              const on = design.templateId === t.id;
              return (
                <button key={t.id} type="button" onClick={() => { applyTemplate(t); setPreviewSide(gallerySide); }} className="text-left active:scale-[0.98]">
                  <span className={`block overflow-hidden rounded-xl transition ${on ? "ring-2 ring-gold ring-offset-2 ring-offset-ivory" : "ring-1 ring-line"}`}>
                    {gallerySide === "front" ? (
                      <VoucherSvg design={voucherDesignFrom(t, galleryContent)} className="block h-auto w-full" />
                    ) : (
                      <VoucherBackSvg design={voucherDesignFrom(t, galleryContent)} className="block h-auto w-full" />
                    )}
                  </span>
                  <span className={`mt-1.5 block px-1 text-[12px] ${on ? "font-semibold" : "text-taupe"}`}>
                    {on ? "✓ " : ""}
                  {t.title}
                  {t.isNew && <span className="ml-1 rounded-full bg-gold/15 px-1.5 py-0.5 text-[9px] font-semibold text-gold">Mới</span>}
                  <span className="ml-1 text-[10px] text-gold">· 2 mặt</span>
                  </span>
                </button>
              );
            })}
          </div>
          {pages > 1 && <Pager page={page} pages={pages} onChange={goPage} />}
        </div>
        <DesignerPanel
          draft={draft}
          capture={() => [frontRef.current, backRef.current].filter((el): el is SVGSVGElement => !!el)}
          name={`Voucher · ${design.salon}`}
          config={VOUCHER_EDITOR}
          what="voucher (cả 2 mặt)"
        />
        {!free && (<>
        <Panel title="Nội dung phiếu">
          {field("salon", "Tên tiệm", "VD: Tiệm Nail Hồng Nhung")}
          {field("title", "Tiêu đề", "VD: Phiếu quà tặng")}
          <Label>Trị giá</Label>
          <input value={design.value} maxLength={20} onChange={(e) => update({ value: e.target.value })} placeholder="VD: 500.000đ" className={inputCls} />
          <div className="mt-2 flex flex-wrap gap-2">
            {VALUE_PRESETS.map((v) => (
              <button key={v} type="button" onClick={() => update({ value: v })} aria-pressed={design.value === v} className={`${chip(design.value === v)} px-3 py-1.5 text-[12px]`}>
                {v}
              </button>
            ))}
          </div>
          {field("service", "Áp dụng cho", "VD: Tất cả dịch vụ nail & spa", undefined, 60)}
          <div className="grid grid-cols-2 gap-x-3">
            <div>{field("code", "Mã số phiếu", "0001", "Không bắt buộc", 12)}</div>
            <div>{field("expiry", "Hạn dùng", "31/12/2026", undefined, 14)}</div>
          </div>
          <div className="grid grid-cols-2 gap-x-3">
            <div>{field("phone", "Số điện thoại", "0909 123 456")}</div>
            <div>{field("website", "Website / Facebook", "tiemnail.vn", "Không bắt buộc")}</div>
          </div>
          {field("terms", "Điều kiện sử dụng", "VD: Không quy đổi thành tiền mặt", "Không bắt buộc", 80)}
        </Panel>

        <Panel title="Lời cảm ơn mặt sau">
          <Label>Tiêu đề</Label>
          <input value={design.backHeading} maxLength={32} onChange={(e) => update({ backHeading: e.target.value })} className={inputCls} />
          <Label>Dòng thứ nhất</Label>
          <input value={design.backLine1} maxLength={70} onChange={(e) => update({ backLine1: e.target.value })} className={inputCls} />
          <Label>Dòng thứ hai</Label>
          <input value={design.backLine2} maxLength={70} onChange={(e) => update({ backLine2: e.target.value })} className={inputCls} />
          <p className="mt-2 px-1 text-[11px] text-taupe">Mỗi mẫu có lời nhắn và bố cục mặt sau riêng. Bạn có thể sửa lời nhắn theo ý mình.</p>
        </Panel>

        </>)}

        {!free && (
        <Panel title="Màu sắc">
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ["bg", "Màu nền"],
                ["ink", "Màu chữ"],
                ["accent", "Điểm nhấn"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 rounded-2xl border border-line bg-white/70 px-2.5 py-2 text-[11px]">
                <input type="color" value={design.colors[key]} onChange={(e) => setColors({ [key]: e.target.value })} className="h-7 w-7 shrink-0 cursor-pointer rounded-full border-0 bg-transparent p-0" />
                {label}
              </label>
            ))}
          </div>
          <button type="button" onClick={reset} className="mt-4 w-full rounded-full border border-line bg-white/70 py-2.5 text-sm text-taupe active:scale-[0.98]">
            Đặt lại mẫu này
          </button>
        </Panel>
        )}
      </div>
    </div>
  );
}

/* ---------- Footer của tab Voucher ---------- */

export function VoucherFooter({ editor }: { editor: VoucherEditor }) {
  const { design, download, busy } = editor;
  const t = VOUCHER_TEMPLATES.find((x) => x.id === design.templateId);
  const { w, h } = VOUCHER_SIZE;
  return (
    <ExportBar
      busy={!!busy}
      onDownload={download}
      recommended="pdf"
      info={
        <>
          Voucher miễn phí · 2 mặt · {t?.title} · {w * VOUCHER_EXPORT_SCALE}×{h * VOUCHER_EXPORT_SCALE}px mỗi mặt ({VOUCHER_EXPORT_DPI}dpi, 210×99 mm)
        </>
      }
    />
  );
}
