"use client";

import { useDeferredValue, useEffect, useRef, useState } from "react";
import { LOGO_FONTS, LOGO_ICONS } from "@/lib/logo-templates";
import {
  BODY_FONTS,
  DEFAULT_CONTENT,
  PRICE_FORMATS,
  PRICE_PALETTES,
  PRICE_TEMPLATES,
  SAMPLE_SECTIONS,
  priceDesignFrom,
  priceFormatOf,
  type PriceColors,
  type PriceDesign,
  type PriceItem,
  type PriceTemplate,
} from "@/lib/price-templates";
import { downloadDesign, type ExportKind } from "../design/export";
import { ExportBar } from "../design/ExportBar";
import { Label, Pager, Panel, chip, inputCls } from "../design/ui";
import { LogoIcon } from "../logo/LogoSvg";
import type { EditorConfig } from "../card/CanvasEditor";
import { CanvasSvg } from "../card/CanvasSvg";
import { DesignerPanel } from "../design/DesignerPanel";
import { useCanvasDraft } from "../design/useCanvasDraft";
import { PriceCoverSvg } from "./PriceCoverSvg";
import { PriceSvg } from "./PriceSvg";
import { scrollToEl } from "../scroll";

const STORAGE_KEY = "naile-price-design";
const PER_PAGE = 10;
const DECOR_PREVIEW_COUNT = 10;

// Trình thiết kế tự do cho bảng giá: 2 mặt, xuất cùng khổ như tải theo mẫu (tuỳ khổ đang chọn).
const priceEditorConfig = (scale: number): EditorConfig => ({
  title: "Trình thiết kế bảng giá",
  backLabel: "Về mẫu bảng giá",
  fileBase: "bang-gia",
  exportScale: scale,
  dpi: 300,
  pdfLabel: "PDF · 2 trang",
  hint: "Chọn tên tiệm, từng dòng dịch vụ, giá hay hoạ tiết để chỉnh. Có thể thêm ảnh, logo, biểu tượng hoặc mã QR. Mỗi mặt có bố cục riêng.",
  pageNames: ["Mặt trước", "Bảng giá"],
});

/* ---------- Trạng thái trình sửa bảng giá ---------- */

export function usePriceEditor() {
  const [design, setDesign] = useState<PriceDesign>(() => priceDesignFrom(PRICE_TEMPLATES[0]));
  const [busy, setBusy] = useState<"" | ExportKind>("");
  const frontRef = useRef<SVGSVGElement>(null);
  const backRef = useRef<SVGSVGElement>(null);

  // Nhớ bảng giá đang sửa trên máy này. Đọc sau khi mở trang để khớp với bản render trên server.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- chỉ đọc 1 lần sau khi mở trang
      if (saved) setDesign((d) => ({ ...d, ...JSON.parse(saved) }));
    } catch {}
  }, []);

  // Chỉ lưu khi người dùng thay đổi (không ghi đè bản đã lưu lúc khởi tạo).
  const change = (fn: (d: PriceDesign) => PriceDesign) =>
    setDesign((d) => {
      const next = fn(d);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

  const update = (patch: Partial<PriceDesign>) => change((d) => ({ ...d, ...patch }));
  const setColors = (patch: Partial<PriceColors>) => change((d) => ({ ...d, colors: { ...d.colors, ...patch } }));

  // Đổi mẫu: đổi kiểu dáng, giữ nguyên nội dung và khổ giấy khách đã chọn.
  const applyTemplate = (t: PriceTemplate) => change((d) => ({ ...priceDesignFrom(t, d), format: d.format }));

  const sections = {
    setTitle: (si: number, title: string) =>
      change((d) => ({ ...d, sections: d.sections.map((s, i) => (i === si ? { ...s, title } : s)) })),
    setItem: (si: number, ii: number, patch: Partial<PriceItem>) =>
      change((d) => ({
        ...d,
        sections: d.sections.map((s, i) =>
          i === si ? { ...s, items: s.items.map((it, j) => (j === ii ? { ...it, ...patch } : it)) } : s,
        ),
      })),
    addItem: (si: number) =>
      change((d) => ({
        ...d,
        sections: d.sections.map((s, i) => (i === si ? { ...s, items: [...s.items, { name: "", price: "" }] } : s)),
      })),
    removeItem: (si: number, ii: number) =>
      change((d) => ({
        ...d,
        sections: d.sections.map((s, i) => (i === si ? { ...s, items: s.items.filter((_, j) => j !== ii) } : s)),
      })),
    add: () => change((d) => ({ ...d, sections: [...d.sections, { title: "Nhóm dịch vụ mới", items: [{ name: "", price: "" }] }] })),
    remove: (si: number) => change((d) => ({ ...d, sections: d.sections.filter((_, i) => i !== si) })),
  };

  const resetContent = () => update({ ...DEFAULT_CONTENT, sections: structuredClone(SAMPLE_SECTIONS) });

  async function download(kind: ExportKind) {
    if (!frontRef.current || !backRef.current || busy) return;
    const fmt = priceFormatOf(design.format);
    setBusy(kind);
    try {
      await downloadDesign(
        [
          { el: frontRef.current, suffix: "mat-truoc" },
          { el: backRef.current, suffix: "mat-sau" },
        ],
        kind,
        `bang-gia-${design.salon}`,
        fmt.w * fmt.scale,
        fmt.h * fmt.scale,
      );
    } finally {
      setBusy("");
    }
  }

  return { design, update, setColors, applyTemplate, sections, resetContent, download, busy, frontRef, backRef };
}

export type PriceEditor = ReturnType<typeof usePriceEditor>;

/* ---------- Giao diện ---------- */

const smallBtn = "rounded-full border border-line bg-white/70 px-3 py-1.5 text-[12px] font-medium active:scale-95";

function RemoveBtn({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-taupe active:scale-90">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M6 6l12 12M18 6 6 18" />
      </svg>
    </button>
  );
}

// gallery: thư viện dùng chung của tab (có cả 20 menu 2 mặt); không truyền thì dùng thư viện riêng.
export function PriceStudio({ editor, gallery }: { editor: PriceEditor; gallery?: React.ReactNode }) {
  const { design, update, setColors, applyTemplate, sections, resetContent, frontRef, backRef } = editor;
  const fmt = priceFormatOf(design.format);
  // Bản thiết kế tự do (kéo thả) của mẫu + khổ đang chọn, nếu khách đã mở trình thiết kế.
  const draft = useCanvasDraft(`price:${design.templateId}:${design.format}`);
  const free = draft.doc;
  // Thư viện 30 mẫu vẽ lại chậm hơn ô nhập → dùng giá trị trễ để gõ chữ không bị giật.
  const deferred = useDeferredValue(design);
  const itemCount = design.sections.reduce((a, s) => a + s.items.length, 0);
  // Thư viện mẫu chia trang, mỗi trang 10 mẫu.
  const [page, setPage] = useState(0);
  const [previewSide, setPreviewSide] = useState<"front" | "back">("front");
  const [gallerySide, setGallerySide] = useState<"front" | "back">("front");
  const [showAllDecor, setShowAllDecor] = useState(false);
  const pages = Math.ceil(PRICE_TEMPLATES.length / PER_PAGE);
  const galleryRef = useRef<HTMLElement>(null);
  const goPage = (p: number) => {
    setPage(p);
    scrollToEl(galleryRef.current);
  };

  return (
    <div className="space-y-4 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start lg:gap-8 lg:space-y-0">
      {/* Xem trước: máy tính thì cố định bên trái */}
      <div className="space-y-2 lg:sticky lg:top-0">
      <div className="mx-auto flex w-fit rounded-full border border-line bg-white/75 p-1 text-xs font-medium">
        <button type="button" onClick={() => setPreviewSide("front")} aria-pressed={previewSide === "front"} className={`rounded-full px-4 py-1.5 ${previewSide === "front" ? "bg-ink text-white" : "text-taupe"}`}>Mặt trước</button>
        <button type="button" onClick={() => setPreviewSide("back")} aria-pressed={previewSide === "back"} className={`rounded-full px-4 py-1.5 ${previewSide === "back" ? "bg-ink text-white" : "text-taupe"}`}>Mặt sau · bảng giá</button>
      </div>
      <div
        className="fade-up mx-auto overflow-hidden rounded-3xl border border-line shadow-[0_18px_36px_-24px_rgb(23_22_26/0.55)]"
        style={{ maxWidth: `calc((100dvh - 15rem) * ${fmt.w / fmt.h})` }}
      >
        {free ? (
          <>
            <div className={previewSide === "front" ? "" : "hidden"}><CanvasSvg page={free.pages[0]} svgRef={frontRef} className="block h-auto w-full" /></div>
            {free.pages[1] && <div className={previewSide === "back" ? "" : "hidden"}><CanvasSvg page={free.pages[1]} svgRef={backRef} className="block h-auto w-full" /></div>}
          </>
        ) : (
          <>
            <div className={previewSide === "front" ? "" : "hidden"}><PriceCoverSvg design={design} svgRef={frontRef} className="block h-auto w-full" /></div>
            <div className={previewSide === "back" ? "" : "hidden"}><PriceSvg design={design} svgRef={backRef} className="block h-auto w-full" /></div>
          </>
        )}
      </div>
      <p className="-mt-2 px-1 text-center text-[11px] text-taupe">
        2 mặt · {fmt.label} · tải về {fmt.w * fmt.scale}×{fmt.h * fmt.scale}px mỗi mặt
      </p>
      </div>

      <div className="space-y-4">

      {/* Chọn mẫu với nội dung hiện tại của khách. */}
      {gallery ?? <section ref={galleryRef} className="scroll-mt-4">
        <div className="mb-4 px-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold">Mẫu bảng giá · trang {page + 1}/{pages}</p>
          <h2 className="mt-1 font-serif text-[26px] leading-tight">{PRICE_TEMPLATES.length} mẫu cho tiệm nail</h2>
          <p className="mt-1 text-xs text-taupe">Mỗi mẫu có bìa riêng và mặt sau bảng giá · giữ nguyên nội dung bạn đã nhập</p>
          <div className="mt-3 flex gap-1.5 text-[11px] font-medium">
            <button type="button" onClick={() => setGallerySide("front")} aria-pressed={gallerySide === "front"} className={chip(gallerySide === "front")}>Xem mặt trước</button>
            <button type="button" onClick={() => setGallerySide("back")} aria-pressed={gallerySide === "back"} className={chip(gallerySide === "back")}>Xem bảng giá</button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {PRICE_TEMPLATES.slice(page * PER_PAGE, (page + 1) * PER_PAGE).map((t) => {
            const on = design.templateId === t.id;
            return (
              <button key={t.id} type="button" onClick={() => { applyTemplate(t); setPreviewSide(gallerySide); }} className="text-left active:scale-[0.98]">
                <span className={`block overflow-hidden rounded-2xl transition ${on ? "ring-2 ring-gold ring-offset-2 ring-offset-ivory" : "ring-1 ring-line"}`}>
                  {gallerySide === "front" ? (
                    <PriceCoverSvg design={{ ...priceDesignFrom(t, deferred), format: deferred.format }} className="block h-auto w-full" />
                  ) : (
                    <PriceSvg design={{ ...priceDesignFrom(t, deferred), format: deferred.format }} className="block h-auto w-full" />
                  )}
                </span>
                <span className={`mt-1.5 block px-1 text-[12px] ${on ? "font-semibold" : "text-taupe"}`}>
                  {on ? "✓ " : ""}
                  {t.title}
                  <span className="ml-1 text-[10px] text-gold">· 2 mặt</span>
                </span>
              </button>
            );
          })}
        </div>
        <Pager page={page} pages={pages} onChange={goPage} />
      </section>}
      <DesignerPanel
        draft={draft}
        capture={() => [frontRef.current, backRef.current].filter((el): el is SVGSVGElement => !!el)}
        name={`Bảng giá · ${design.salon}`}
        config={priceEditorConfig(fmt.scale)}
        what="bảng giá (cả 2 mặt)"
      />
      {!free && (<>
      <Panel title="Thông tin tiệm">
        <Label>Tên tiệm</Label>
        <input value={design.salon} maxLength={40} onChange={(e) => update({ salon: e.target.value })} placeholder="VD: Tiệm Nail Hồng Nhung" className={inputCls} />
        <Label>Tiêu đề</Label>
        <input value={design.heading} maxLength={40} onChange={(e) => update({ heading: e.target.value })} placeholder="Bảng giá dịch vụ" className={inputCls} />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label hint="Không bắt buộc">Hotline</Label>
            <input value={design.phone} maxLength={20} inputMode="tel" onChange={(e) => update({ phone: e.target.value })} placeholder="0909 123 456" className={inputCls} />
          </div>
          <div>
            <Label hint="Không bắt buộc">Giờ mở cửa</Label>
            <input value={design.hours} maxLength={30} onChange={(e) => update({ hours: e.target.value })} placeholder="9:00 – 21:00" className={inputCls} />
          </div>
        </div>
        <Label hint="Không bắt buộc">Địa chỉ</Label>
        <input value={design.address} maxLength={60} onChange={(e) => update({ address: e.target.value })} placeholder="12 Nguyễn Trãi, Quận 1" className={inputCls} />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label hint="Không bắt buộc">Instagram</Label>
            <input value={design.instagram ?? ""} maxLength={40} onChange={(e) => update({ instagram: e.target.value })} placeholder="@ten_tiem" className={inputCls} />
          </div>
          <div>
            <Label hint="Không bắt buộc">WhatsApp</Label>
            <input value={design.whatsapp ?? ""} maxLength={30} inputMode="tel" onChange={(e) => update({ whatsapp: e.target.value })} placeholder="+84 909 123 456" className={inputCls} />
          </div>
        </div>
      </Panel>

      <Panel title={`Dịch vụ & giá · ${itemCount} dịch vụ`}>
        <div className="space-y-4">
          {design.sections.map((s, si) => (
            <div key={si} className="rounded-2xl border border-line bg-white/50 p-3">
              <div className="flex items-center gap-1">
                <input
                  value={s.title}
                  maxLength={40}
                  onChange={(e) => sections.setTitle(si, e.target.value)}
                  placeholder="Tên nhóm, VD: Chăm sóc móng"
                  aria-label="Tên nhóm dịch vụ"
                  className="min-w-0 flex-1 rounded-xl border border-transparent bg-transparent px-2 py-1.5 text-[15px] font-semibold outline-none focus:border-gold"
                />
                <RemoveBtn onClick={() => sections.remove(si)} label={`Xoá nhóm ${s.title}`} />
              </div>
              <div className="mt-1 space-y-1.5">
                {s.items.map((it, ii) => (
                  <div key={ii} className="flex items-center gap-1.5">
                    <input
                      value={it.name}
                      maxLength={50}
                      onChange={(e) => sections.setItem(si, ii, { name: e.target.value })}
                      placeholder="Tên dịch vụ"
                      aria-label="Tên dịch vụ"
                      className="min-w-0 flex-1 rounded-xl border border-line bg-white/80 px-3 py-2 text-[14px] outline-none focus:border-gold"
                    />
                    <input
                      value={it.price}
                      maxLength={14}
                      onChange={(e) => sections.setItem(si, ii, { price: e.target.value })}
                      placeholder="Giá"
                      aria-label="Giá"
                      className="w-[84px] shrink-0 rounded-xl border border-line bg-white/80 px-3 py-2 text-right text-[14px] font-semibold outline-none focus:border-gold"
                    />
                    <RemoveBtn onClick={() => sections.removeItem(si, ii)} label={`Xoá ${it.name || "dịch vụ"}`} />
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => sections.addItem(si)} className={`${smallBtn} mt-2`}>
                + Thêm dịch vụ
              </button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={sections.add} className={smallBtn}>
            + Thêm nhóm dịch vụ
          </button>
          <button type="button" onClick={resetContent} className={`${smallBtn} text-taupe`}>
            Dùng lại nội dung mẫu
          </button>
        </div>
        <p className="mt-2 px-1 text-[11px] text-taupe">Giá ghi tự do, VD: 120K, 120.000đ, từ 10K. Nhiều dịch vụ quá thì chữ tự nhỏ lại và chia 2 cột.</p>
      </Panel>
      </>)}

      <Panel title={free ? "Khổ" : "Tuỳ chỉnh"}>
        {!free && <Label>Khổ</Label>}
        <div className="grid grid-cols-2 gap-2">
          {PRICE_FORMATS.map((f) => {
            const on = design.format === f.id;
            const ratio = f.w / f.h;
            return (
              <button key={f.id} type="button" onClick={() => update({ format: f.id })} aria-pressed={on} className={`${chip(on)} flex items-center gap-3 px-3 py-2.5 text-left`}>
                <span className="grid h-8 w-8 shrink-0 place-items-center">
                  <span
                    className={`block rounded-[3px] border-[1.5px] ${on ? "border-gold bg-gold/20" : "border-taupe/60"}`}
                    style={ratio >= 1 ? { width: 26, height: 26 / ratio } : { height: 28, width: 28 * ratio }}
                  />
                </span>
                <span>
                  <span className="block text-[13px] font-semibold leading-tight">{f.label}</span>
                  <span className="block text-[11px] text-taupe">{f.hint}</span>
                </span>
              </button>
            );
          })}
        </div>
        {free && <p className="mt-2 px-1 text-[11px] text-taupe">Mỗi khổ có bản thiết kế riêng. Đổi khổ sẽ mở mẫu gốc của khổ đó.</p>}

        {!free && (<>
        <Label>Font tiêu đề</Label>
        <div className="grid grid-cols-3 gap-2">
          {LOGO_FONTS.map((f) => (
            <button key={f.id} type="button" onClick={() => update({ headFont: f.id })} aria-pressed={design.headFont === f.id} className={`${chip(design.headFont === f.id)} px-2 py-2.5 text-center`}>
              <span className="block truncate text-[19px] leading-tight" style={{ fontFamily: `'${f.family}'`, fontWeight: f.weight }}>
                Bảng giá
              </span>
              <span className="mt-0.5 block text-[10px] text-taupe">{f.label}</span>
            </button>
          ))}
        </div>

        <Label>Font chữ dịch vụ</Label>
        <div className="grid grid-cols-3 gap-2">
          {BODY_FONTS.map((f) => (
            <button key={f.id} type="button" onClick={() => update({ bodyFont: f.id })} aria-pressed={design.bodyFont === f.id} className={`${chip(design.bodyFont === f.id)} px-2 py-2.5 text-center`}>
              <span className="block truncate text-[15px] leading-tight" style={{ fontFamily: `'${f.family}'`, fontWeight: f.weight }}>
                Sơn gel 120K
              </span>
              <span className="mt-0.5 block text-[10px] text-taupe">{f.label}</span>
            </button>
          ))}
        </div>

        <Label>Bảng màu</Label>
        <div className="grid grid-cols-4 gap-2">
          {PRICE_PALETTES.map((p) => {
            const on = p.colors.primary === design.colors.primary && p.colors.bg === design.colors.bg;
            return (
              <button key={p.id} type="button" onClick={() => setColors(p.colors)} aria-pressed={on} className={`${chip(on)} p-1.5`}>
                <span className="flex h-9 overflow-hidden rounded-xl" style={{ background: p.colors.bg }}>
                  <span className="m-1.5 flex-1 rounded-lg" style={{ background: p.colors.primary }} />
                  <span className="my-1.5 mr-1.5 w-3 rounded-lg" style={{ background: p.colors.accent }} />
                </span>
                <span className="mt-1 block truncate text-[10px] text-taupe">{p.label}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {(
            [
              ["primary", "Màu tiêu đề"],
              ["text", "Màu chữ"],
              ["accent", "Màu đường kẻ"],
              ["bg", "Màu nền"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 rounded-2xl border border-line bg-white/70 px-2.5 py-2 text-[12px]">
              <input
                type="color"
                value={design.colors[key]}
                onChange={(e) => setColors({ [key]: e.target.value })}
                className="h-7 w-7 shrink-0 cursor-pointer rounded-full border-0 bg-transparent p-0"
              />
              {label}
            </label>
          ))}
        </div>

        <Label hint={`Đang chọn: ${LOGO_ICONS.find((i) => i.id === design.decor)?.label ?? "Hoạ tiết"}`}>Hoạ tiết</Label>
        <div id="price-decor-list" className="grid grid-cols-5 gap-2">
          {LOGO_ICONS.slice(0, showAllDecor ? undefined : DECOR_PREVIEW_COUNT).map((i) => (
            <button key={i.id} type="button" onClick={() => update({ decor: i.id })} aria-label={i.label} aria-pressed={design.decor === i.id} title={i.label} className={`${chip(design.decor === i.id)} p-1.5`}>
              <svg viewBox="0 0 100 100" className="block aspect-square w-full">
                <LogoIcon id={i.id} x={50} y={50} size={84} primary={design.colors.primary} accent={design.colors.accent} />
              </svg>
            </button>
          ))}
        </div>
        {LOGO_ICONS.length > DECOR_PREVIEW_COUNT && (
          <button type="button" onClick={() => setShowAllDecor((v) => !v)} aria-expanded={showAllDecor} aria-controls="price-decor-list" className={`${smallBtn} mt-3 w-full py-2.5 text-center`}>
            {showAllDecor ? "Thu gọn" : `Xem thêm ${LOGO_ICONS.length - DECOR_PREVIEW_COUNT} họa tiết`}
          </button>
        )}
        </>)}
      </Panel>

      </div>
    </div>
  );
}

/* ---------- Footer của tab Bảng giá ---------- */

export function PriceFooter({ editor }: { editor: PriceEditor }) {
  const { design, download, busy } = editor;
  const t = PRICE_TEMPLATES.find((x) => x.id === design.templateId);
  const fmt = priceFormatOf(design.format);
  return (
    <ExportBar
      busy={!!busy}
      onDownload={download}
      info={
        <>
          Miễn phí · 2 mặt · {t?.title} · {fmt.label} · {fmt.w * fmt.scale}×{fmt.h * fmt.scale}px mỗi mặt
        </>
      }
      recommended="pdf"
    />
  );
}
