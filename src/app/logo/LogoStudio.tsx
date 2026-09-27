"use client";

import { useEffect, useRef, useState } from "react";
import {
  LAYOUT_USES_ICON,
  LOGO_FONTS,
  LOGO_ICONS,
  LOGO_PALETTES,
  LOGO_TEMPLATES,
  designFrom,
  fontOf,
  type LogoColors,
  type LogoDesign,
  type LogoTemplate,
} from "@/lib/logo-templates";
import { downloadDesign, type ExportKind } from "../design/export";
import { ExportBar } from "../design/ExportBar";
import { CHECKER, Label, Pager, Panel, chip, inputCls } from "../design/ui";
import { LOGO_SIZE, LogoIcon, LogoSvg } from "./LogoSvg";
import type { EditorConfig } from "../card/CanvasEditor";
import { CanvasSvg } from "../card/CanvasSvg";
import { DesignerPanel } from "../design/DesignerPanel";
import { useCanvasDraft } from "../design/useCanvasDraft";

const STORAGE_KEY = "naile-logo-design";
const PER_PAGE = 10;
const EXPORT_SIZE = 2000;

// Trình thiết kế tự do cho logo: xuất cùng khổ 2000×2000 px như tải logo theo mẫu.
const LOGO_EDITOR: EditorConfig = {
  title: "Trình thiết kế logo",
  backLabel: "Về mẫu logo",
  fileBase: "logo",
  exportScale: EXPORT_SIZE / LOGO_SIZE,
  dpi: 300,
  pdfLabel: "PDF",
  pageNames: ["Logo"],
  hint: "Chọn biểu tượng, tên tiệm hoặc slogan để chỉnh. Có thể thêm chữ, hình, ảnh hoặc logo khác.",
};

/* ---------- Trạng thái trình sửa logo ---------- */

export function useLogoEditor() {
  const [design, setDesign] = useState<LogoDesign>(() => designFrom(LOGO_TEMPLATES[0]));
  const [busy, setBusy] = useState<"" | ExportKind>("");
  const svgRef = useRef<SVGSVGElement>(null);

  // Nhớ logo đang sửa trên máy này (mở lại trang vẫn còn). Đọc sau khi mở trang để khớp với bản render trên server.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<LogoDesign>;
        // Mẫu đã bị gỡ khỏi thư viện: về mẫu đầu, giữ tên và slogan khách đã gõ.
        const known = LOGO_TEMPLATES.some((t) => t.id === parsed.templateId);
        // eslint-disable-next-line react-hooks/set-state-in-effect -- chỉ đọc 1 lần sau khi mở trang
        setDesign((d) =>
          known
            ? { ...d, ...parsed }
            : { ...d, ...(parsed.nameEdited ? { name: parsed.name ?? d.name, nameEdited: true } : {}), ...(parsed.taglineEdited ? { tagline: parsed.tagline ?? d.tagline, taglineEdited: true } : {}) },
        );
      }
    } catch {}
  }, []);

  // Chỉ lưu khi người dùng thay đổi (không lưu lúc khởi tạo, tránh ghi đè bản đã lưu).
  const change = (fn: (d: LogoDesign) => LogoDesign) =>
    setDesign((d) => {
      const next = fn(d);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

  const update = (patch: Partial<LogoDesign>) => change((d) => ({ ...d, ...patch }));
  const setColors = (patch: Partial<LogoColors>) => change((d) => ({ ...d, colors: { ...d.colors, ...patch } }));

  // Đổi mẫu: lấy kiểu dáng của mẫu mới, giữ tên/slogan người dùng đã tự gõ.
  const applyTemplate = (t: LogoTemplate) =>
    change((d) => ({
      ...designFrom(t),
      name: d.nameEdited ? d.name : t.name,
      tagline: d.taglineEdited ? d.tagline : t.tagline,
      nameEdited: d.nameEdited,
      taglineEdited: d.taglineEdited,
      transparent: d.transparent,
    }));

  const reset = () => {
    const t = LOGO_TEMPLATES.find((x) => x.id === design.templateId) ?? LOGO_TEMPLATES[0];
    change(() => designFrom(t));
  };

  async function download(kind: ExportKind) {
    if (!svgRef.current || busy) return;
    setBusy(kind);
    try {
      await downloadDesign(svgRef.current, kind, `logo-${design.name}`, EXPORT_SIZE, EXPORT_SIZE);
    } finally {
      setBusy("");
    }
  }

  return { design, update, setColors, applyTemplate, reset, download, busy, svgRef };
}

export type LogoEditor = ReturnType<typeof useLogoEditor>;

/* ---------- Giao diện ---------- */

export function LogoStudio({ editor }: { editor: LogoEditor }) {
  const { design, update, setColors, applyTemplate, reset, svgRef } = editor;
  // Bản thiết kế tự do (kéo thả) của mẫu đang chọn, nếu khách đã mở trình thiết kế.
  const draft = useCanvasDraft(`logo:${design.templateId}`);
  const free = draft.doc;
  const usesIcon = LAYOUT_USES_ICON[design.layout];
  // Thư viện mẫu chia trang, mỗi trang 10 mẫu.
  const [page, setPage] = useState(0);
  const pages = Math.ceil(LOGO_TEMPLATES.length / PER_PAGE);
  const galleryRef = useRef<HTMLDivElement>(null);
  const goPage = (p: number) => {
    setPage(p);
    galleryRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  };

  return (
    <div className="space-y-4 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start lg:gap-8 lg:space-y-0">
      {/* Xem trước: máy tính thì cố định bên trái */}
      <div className="space-y-2 lg:sticky lg:top-0">
      <div className="fade-up overflow-hidden rounded-3xl border border-line shadow-[0_18px_36px_-24px_rgb(23_22_26/0.55)]" style={design.transparent ? CHECKER : undefined}>
        {free ? (
          <CanvasSvg page={free.pages[0]} svgRef={svgRef} className="block aspect-square w-full" />
        ) : (
          <LogoSvg design={design} svgRef={svgRef} className="block aspect-square w-full" />
        )}
      </div>
      </div>

      <div className="space-y-4">

      {/* Chọn mẫu: tên tiệm của khách tự điền vào mọi mẫu */}
      <div ref={galleryRef} className="scroll-mt-4">
        <div className="mb-3 mt-2 px-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold">Mẫu logo · trang {page + 1}/{pages}</p>
          <h2 className="mt-1 font-serif text-[26px] leading-tight">{LOGO_TEMPLATES.length} mẫu cho tiệm nail</h2>
          <p className="mt-1 text-xs text-taupe">Chạm để dùng mẫu · tên tiệm của bạn tự điền vào</p>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {LOGO_TEMPLATES.slice(page * PER_PAGE, (page + 1) * PER_PAGE).map((t) => {
            const preview: LogoDesign = {
              ...designFrom(t),
              name: design.nameEdited ? design.name : t.name,
              tagline: design.taglineEdited ? design.tagline : t.tagline,
            };
            const on = design.templateId === t.id;
            return (
              <button key={t.id} type="button" onClick={() => applyTemplate(t)} className="text-left active:scale-[0.98]">
                <span
                  className={`block overflow-hidden rounded-2xl transition ${
                    on ? "ring-2 ring-gold ring-offset-2 ring-offset-ivory" : "ring-1 ring-line"
                  }`}
                >
                  <LogoSvg design={preview} className="block aspect-square w-full" />
                </span>
                <span className={`mt-1.5 block px-1 text-[12px] ${on ? "font-semibold" : "text-taupe"}`}>
                  {on ? "✓ " : ""}
                  {t.title}
                  {t.isNew && <span className="ml-1 rounded-full bg-gold/15 px-1.5 py-0.5 text-[9px] font-semibold text-gold">Mới</span>}
                </span>
              </button>
            );
          })}
        </div>
        <Pager page={page} pages={pages} onChange={goPage} />
      </div>
      <DesignerPanel
        draft={draft}
        capture={() => (svgRef.current ? [svgRef.current] : [])}
        name={`Logo · ${design.name}`}
        config={LOGO_EDITOR}
        what="logo"
      />
      {!free && (
      <Panel title="Thông tin tiệm">
        <Label>Tên tiệm</Label>
        <input
          value={design.name}
          maxLength={40}
          onChange={(e) => update({ name: e.target.value, nameEdited: true })}
          placeholder="VD: Tiệm Nail Hồng Nhung"
          className={inputCls}
        />
        <Label hint="Không bắt buộc">Slogan</Label>
        <input
          value={design.tagline}
          maxLength={40}
          onChange={(e) => update({ tagline: e.target.value, taglineEdited: true })}
          placeholder="VD: Nail · Mi · Gội đầu"
          className={inputCls}
        />
      </Panel>
      )}

      {!free && (
      <Panel title="Tuỳ chỉnh">
        <Label>Font chữ</Label>
        <div className="grid grid-cols-3 gap-2">
          {LOGO_FONTS.map((f) => (
            <button key={f.id} type="button" onClick={() => update({ font: f.id })} aria-pressed={design.font === f.id} className={`${chip(design.font === f.id)} px-2 py-2.5 text-center`}>
              <span className="block truncate text-[19px] leading-tight" style={{ fontFamily: `'${f.family}'`, fontWeight: f.weight }}>
                {design.name.trim().split(/\s+/)[0] || "Nail"}
              </span>
              <span className="mt-0.5 block text-[10px] text-taupe">{f.label}</span>
            </button>
          ))}
        </div>
        {!fontOf(design.font).script && (
          <button
            type="button"
            onClick={() => update({ upper: !design.upper })}
            className="mt-2 flex w-full items-center justify-between rounded-2xl border border-line bg-white/70 px-4 py-2.5 text-sm"
          >
            <span>Tên viết IN HOA</span>
            <span className={`relative h-6 w-10 rounded-full transition ${design.upper ? "bg-gold" : "bg-line"}`}>
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${design.upper ? "left-[18px]" : "left-0.5"}`} />
            </span>
          </button>
        )}

        <Label>Bảng màu</Label>
        <div className="grid grid-cols-4 gap-2">
          {LOGO_PALETTES.map((p) => {
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
        <div className="mt-2 grid grid-cols-3 gap-2">
          {(
            [
              ["primary", "Màu chính"],
              ["accent", "Màu phụ"],
              ["bg", "Màu nền"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 rounded-2xl border border-line bg-white/70 px-2.5 py-2 text-[11px]">
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

        {usesIcon ? (
          <>
            <Label>Biểu tượng</Label>
            <div className="grid grid-cols-5 gap-2 lg:grid-cols-6">
              {LOGO_ICONS.map((i) => (
                <button key={i.id} type="button" onClick={() => update({ icon: i.id })} aria-pressed={design.icon === i.id} title={i.label} className={`${chip(design.icon === i.id)} p-1.5`}>
                  <svg viewBox="0 0 100 100" className="block aspect-square w-full">
                    <LogoIcon id={i.id} x={50} y={50} size={84} primary={design.colors.primary} accent={design.colors.accent} />
                  </svg>
                </button>
              ))}
            </div>
          </>
        ) : (
          <p className="mt-4 px-1 text-[11px] text-taupe">Mẫu chữ lồng dùng chữ cái đầu của tên tiệm thay cho biểu tượng.</p>
        )}

        <Label>Nền logo</Label>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              [false, "Có màu nền"],
              [true, "Trong suốt"],
            ] as const
          ).map(([t, label]) => (
            <button key={label} type="button" onClick={() => update({ transparent: t })} aria-pressed={design.transparent === t} className={`${chip(design.transparent === t)} px-3 py-2.5 text-sm`}>
              {label}
            </button>
          ))}
        </div>
        <p className="mt-2 px-1 text-[11px] text-taupe">Nền trong suốt dùng để in lên hộp, túi, danh thiếp hoặc chèn lên ảnh.</p>

        <button type="button" onClick={reset} className="mt-4 w-full rounded-full border border-line bg-white/70 py-2.5 text-sm text-taupe active:scale-[0.98]">
          Đặt lại mẫu này
        </button>
      </Panel>
      )}
      </div>
    </div>
  );
}

/* ---------- Footer của tab Logo ---------- */

export function LogoFooter({ editor }: { editor: LogoEditor }) {
  const { design, download, busy } = editor;
  const t = LOGO_TEMPLATES.find((x) => x.id === design.templateId);
  return (
    <ExportBar
      busy={!!busy}
      onDownload={download}
      info={
        <>
          Logo miễn phí · {t?.title} · {EXPORT_SIZE}×{EXPORT_SIZE}px
          {design.transparent ? " · nền trong suốt (chỉ PNG, SVG giữ được)" : ""}
        </>
      }
    />
  );
}
