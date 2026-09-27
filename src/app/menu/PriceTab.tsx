"use client";

import { useEffect, useRef, useState } from "react";
import { PRICE_TEMPLATES, priceDesignFrom, type PriceTemplate } from "@/lib/price-templates";
import { DEFAULT_MENU, MENU_SIZE, MENU_TEMPLATES, menuDesignFrom, type MenuDesign, type MenuItem, type MenuSection, type MenuTemplate } from "@/lib/menu-templates";
import type { EditorConfig } from "../card/CanvasEditor";
import { CanvasSvg } from "../card/CanvasSvg";
import { DesignerPanel } from "../design/DesignerPanel";
import { downloadDesign, type ExportKind } from "../design/export";
import { ExportBar } from "../design/ExportBar";
import { Label, Pager, Panel, chip, inputCls } from "../design/ui";
import { useCanvasDraft } from "../design/useCanvasDraft";
import { PriceCoverSvg } from "../price/PriceCoverSvg";
import { PriceFooter, PriceStudio, usePriceEditor } from "../price/PriceStudio";
import { PriceSvg } from "../price/PriceSvg";
import { MenuSvg } from "./MenuSvg";

// Tab Bảng giá: 20 menu 2 mặt (mặt trước nhận diện tiệm, mặt sau bảng giá) ở trang đầu, sau đó 30 mẫu bảng giá cũ.

const MODE_KEY = "naile-price-mode";
const MENU_KEY = "naile-menu-design";
const PAGE_SIZE = 10;
const MENU_EDITOR: EditorConfig = {
  title: "Trình thiết kế menu",
  backLabel: "Về mẫu menu",
  fileBase: "menu-bang-gia",
  exportScale: MENU_SIZE.width / 600,
  dpi: MENU_SIZE.dpi,
  pdfLabel: "PDF · A4 hai mặt",
  hint: "Chọn logo, ảnh, chữ hoặc từng dòng giá để kéo thả, đổi cỡ và chỉnh màu. Có thể thêm ảnh, biểu tượng hoặc mã QR.",
  subject: "menu",
  pageNames: ["Mặt trước", "Mặt sau · bảng giá"],
};
// Nội dung của tiệm: giữ lại khi đổi mẫu menu.
const KEEP = ["salon", "tagline", "logo", "photos", "promoTitle", "promoDiscount", "promoNote", "highlights", "phone", "address", "hours", "qrs", "title", "sections", "policy"] as const;
const keep = (d: MenuDesign) => Object.fromEntries(KEEP.map((k) => [k, d[k]])) as Partial<MenuDesign>;

/* ---------- Ảnh tải lên: thu nhỏ trước khi lưu ---------- */

async function readImage(file: File, max: number, type: "image/jpeg" | "image/png") {
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) throw new Error("Chọn ảnh PNG, JPG hoặc WebP.");
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    // Chờ onload (decode() có thể treo khi tab chạy nền).
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Không đọc được ảnh."));
      img.src = url;
    });
    const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * k);
    canvas.height = Math.round(img.naturalHeight * k);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL(type, 0.86);
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Ảnh mẫu dạng data URL: trình thiết kế tự do chỉ nhận ảnh nhúng sẵn.
function useDataUrls(urls: string[]) {
  const [map, setMap] = useState<Record<string, string>>({});
  const key = urls.join("|");
  useEffect(() => {
    let alive = true;
    key
      .split("|")
      .filter((u) => u && !u.startsWith("data:"))
      .forEach((u) =>
        fetch(u)
          .then((r) => r.blob())
          .then((blob) => {
            const reader = new FileReader();
            reader.onload = () => alive && setMap((m) => ({ ...m, [u]: String(reader.result) }));
            reader.readAsDataURL(blob);
          })
          .catch(() => {}),
      );
    return () => {
      alive = false;
    };
  }, [key]);
  return urls.map((u) => map[u] ?? u);
}

/* ---------- Trạng thái menu ---------- */

function useMenuEditor() {
  const [design, setDesign] = useState<MenuDesign>(() => menuDesignFrom(MENU_TEMPLATES[0]));
  const [busy, setBusy] = useState<"" | ExportKind>("");
  const [error, setError] = useState("");
  const frontRef = useRef<SVGSVGElement>(null);
  const backRef = useRef<SVGSVGElement>(null);
  const template = MENU_TEMPLATES.find((t) => t.id === design.templateId) ?? MENU_TEMPLATES[0];

  useEffect(() => {
    try {
      const saved = localStorage.getItem(MENU_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as Partial<MenuDesign>;
      const t = MENU_TEMPLATES.find((x) => x.id === parsed.templateId) ?? MENU_TEMPLATES[0];
      // eslint-disable-next-line react-hooks/set-state-in-effect -- đọc bản lưu sau khi hydrate
      setDesign(menuDesignFrom(t, parsed));
    } catch {}
  }, []);

  const change = (fn: (d: MenuDesign) => MenuDesign) =>
    setDesign((prev) => {
      const next = fn(prev);
      try {
        localStorage.setItem(MENU_KEY, JSON.stringify(next));
        setError("");
      } catch {
        setError("Trình duyệt hết chỗ lưu ảnh — menu vẫn hiện đúng nhưng mở lại trang có thể mất ảnh đã tải lên. Hãy tải file về.");
      }
      return next;
    });
  const update = (patch: Partial<MenuDesign>) => change((d) => ({ ...d, ...patch }));
  const applyTemplate = (t: MenuTemplate) => change((d) => menuDesignFrom(t, keep(d)));
  const reset = () => change((d) => menuDesignFrom(template, { logo: d.logo, photos: d.photos }));

  async function download(kind: ExportKind) {
    if (!frontRef.current || !backRef.current || busy) return;
    setBusy(kind);
    try {
      await downloadDesign(
        [{ el: frontRef.current, suffix: "mat-truoc" }, { el: backRef.current, suffix: "mat-sau" }],
        kind,
        `menu-${design.salon}`,
        MENU_SIZE.width,
        MENU_SIZE.height,
        MENU_SIZE.dpi,
      );
    } finally {
      setBusy("");
    }
  }

  return { design, template, update, applyTemplate, reset, download, busy, error, frontRef, backRef };
}

/* ---------- Trạng thái chung của tab ---------- */

export function usePriceTab() {
  const classic = usePriceEditor();
  const menu = useMenuEditor();
  const [mode, setModeState] = useState<"menu" | "classic">("menu");
  const [page, setPage] = useState(0);
  const [gallerySide, setGallerySide] = useState<"front" | "back">("front");
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- đọc bản lưu sau khi hydrate
      if (localStorage.getItem(MODE_KEY) === "classic") setModeState("classic");
    } catch {}
  }, []);
  const setMode = (m: "menu" | "classic") => {
    setModeState(m);
    try {
      localStorage.setItem(MODE_KEY, m);
    } catch {}
  };
  return { classic, menu, mode, setMode, page, setPage, gallerySide, setGallerySide };
}
export type PriceTab = ReturnType<typeof usePriceTab>;

/* ---------- Thư viện chung ---------- */

type Item = { kind: "menu"; t: MenuTemplate } | { kind: "classic"; t: PriceTemplate };
const ITEMS: Item[] = [...MENU_TEMPLATES.map((t) => ({ kind: "menu" as const, t })), ...PRICE_TEMPLATES.map((t) => ({ kind: "classic" as const, t }))];

function PriceGallery({ tab }: { tab: PriceTab }) {
  const { classic, menu, mode, setMode, page, setPage, gallerySide, setGallerySide } = tab;
  const ref = useRef<HTMLElement>(null);
  const pages = Math.ceil(ITEMS.length / PAGE_SIZE);
  const menuPage = page * PAGE_SIZE < MENU_TEMPLATES.length;
  const goPage = (p: number) => {
    setPage(p);
    ref.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  };
  return (
    <section ref={ref} className="scroll-mt-4">
      <div className="mb-4 px-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold">Mẫu bảng giá · trang {page + 1}/{pages}</p>
        <h2 className="mt-1 font-serif text-[26px] leading-tight">{menuPage ? `${MENU_TEMPLATES.length} menu 2 mặt cho tiệm nail` : `${PRICE_TEMPLATES.length} mẫu bảng giá có bìa`}</h2>
        <p className="mt-1 text-xs text-taupe">
          {menuPage ? "Mặt trước: logo, ảnh móng, liên hệ, mã QR · mặt sau: bảng giá đầy đủ" : "Mỗi mẫu có bìa riêng và mặt sau bảng giá · giữ nguyên nội dung bạn đã nhập"}
        </p>
        <div className="mt-3 flex gap-1.5 text-[11px] font-medium">
          <button type="button" onClick={() => setGallerySide("front")} aria-pressed={gallerySide === "front"} className={chip(gallerySide === "front")}>
            Xem mặt trước
          </button>
          <button type="button" onClick={() => setGallerySide("back")} aria-pressed={gallerySide === "back"} className={chip(gallerySide === "back")}>
            Xem bảng giá
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {ITEMS.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((item) => {
          const on = item.kind === mode && (item.kind === "menu" ? menu.design.templateId : classic.design.templateId) === item.t.id;
          const classicDesign = item.kind === "classic" ? { ...priceDesignFrom(item.t, classic.design), format: classic.design.format } : null;
          return (
            <button
              key={item.t.id}
              type="button"
              aria-pressed={on}
              className="text-left active:scale-[0.98]"
              onClick={() => {
                if (item.kind === "menu") menu.applyTemplate(item.t);
                else classic.applyTemplate(item.t);
                setMode(item.kind);
              }}
            >
              <span className={`block overflow-hidden rounded-2xl transition ${on ? "ring-2 ring-gold ring-offset-2 ring-offset-ivory" : "ring-1 ring-line"}`}>
                {item.kind === "menu" ? (
                  <MenuSvg design={menuDesignFrom(item.t, keep(menu.design))} template={item.t} side={gallerySide} className="block h-auto w-full" />
                ) : gallerySide === "front" ? (
                  <PriceCoverSvg design={classicDesign!} className="block h-auto w-full" />
                ) : (
                  <PriceSvg design={classicDesign!} className="block h-auto w-full" />
                )}
              </span>
              <span className={`mt-1.5 block px-1 text-[12px] ${on ? "font-semibold" : "text-taupe"}`}>
                {on ? "✓ " : ""}
                {item.t.title}
                {item.kind === "menu" && <span className="ml-1 rounded-full bg-gold/15 px-1.5 py-0.5 text-[9px] font-semibold text-gold">Mới</span>}
                <span className="ml-1 text-[10px] text-gold">· 2 mặt</span>
              </span>
            </button>
          );
        })}
      </div>
      <Pager page={page} pages={pages} onChange={goPage} />
    </section>
  );
}

/* ---------- Giao diện menu ---------- */

const small = "rounded-full border border-line bg-white/70 px-3 py-1.5 text-[12px] font-medium active:scale-95";
const cellCls = "min-w-0 rounded-xl border border-line bg-white/80 px-3 py-2 text-[14px] outline-none focus:border-gold";

function MenuStudio({ tab }: { tab: PriceTab }) {
  const { design: d, template: t, update, reset, error, frontRef, backRef } = tab.menu;
  const [side, setSide] = useState<"front" | "back">("front");
  const [uploadError, setUploadError] = useState("");
  const photoUrls = useDataUrls([0, 1, 2].map((i) => d.photos[i] || t.photos[i]));
  const view = { ...d, photos: photoUrls };
  const draft = useCanvasDraft(`menu:${d.templateId}`);
  const free = draft.doc;
  const text = (key: "salon" | "tagline" | "promoTitle" | "promoNote" | "highlights" | "phone" | "address" | "title", label: string, max: number, hint?: string) => (
    <>
      <Label hint={hint}>{label}</Label>
      <input value={d[key]} maxLength={max} onChange={(e) => update({ [key]: e.target.value })} className={inputCls} />
    </>
  );
  const hours = d.hours.split("|");
  const setHours = (i: number, v: string) => update({ hours: [0, 1].map((j) => (j === i ? v : (hours[j] ?? "")).trim()).filter((s, j) => s || j === 0).join(" | ") });
  const setSection = (si: number, patch: Partial<MenuSection>) => update({ sections: d.sections.map((s, j) => (j === si ? { ...s, ...patch } : s)) });
  const setItem = (si: number, ii: number, patch: Partial<MenuItem>) => setSection(si, { items: d.sections[si].items.map((it, j) => (j === ii ? { ...it, ...patch } : it)) });
  const upload = async (file: File | undefined, apply: (data: string) => void, max: number, type: "image/jpeg" | "image/png") => {
    if (!file) return;
    try {
      apply(await readImage(file, max, type));
      setUploadError("");
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Không đọc được ảnh.");
    }
  };

  return (
    <div className="space-y-4 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start lg:gap-8 lg:space-y-0">
      <div className="space-y-2 lg:sticky lg:top-0">
        <div className="mx-auto flex w-fit rounded-full border border-line bg-white/75 p-1 text-xs font-medium">
          <button type="button" onClick={() => setSide("front")} aria-pressed={side === "front"} className={`rounded-full px-4 py-1.5 ${side === "front" ? "bg-ink text-white" : "text-taupe"}`}>
            Mặt trước
          </button>
          <button type="button" onClick={() => setSide("back")} aria-pressed={side === "back"} className={`rounded-full px-4 py-1.5 ${side === "back" ? "bg-ink text-white" : "text-taupe"}`}>
            Mặt sau · bảng giá
          </button>
        </div>
        <div className="fade-up mx-auto overflow-hidden rounded-3xl border border-line shadow-[0_18px_36px_-24px_rgb(23_22_26/0.55)]" style={{ maxWidth: "calc((100dvh - 15rem) * 0.707)" }}>
          {free ? (
            <>
              <div className={side === "front" ? "" : "hidden"}><CanvasSvg page={free.pages[0]} svgRef={frontRef} className="block h-auto w-full" /></div>
              {free.pages[1] && <div className={side === "back" ? "" : "hidden"}><CanvasSvg page={free.pages[1]} svgRef={backRef} className="block h-auto w-full" /></div>}
            </>
          ) : (
            <>
              <div className={side === "front" ? "" : "hidden"}><MenuSvg design={view} template={t} svgRef={frontRef} className="block h-auto w-full" /></div>
              <div className={side === "back" ? "" : "hidden"}><MenuSvg design={view} template={t} side="back" svgRef={backRef} className="block h-auto w-full" /></div>
            </>
          )}
        </div>
        <p className="-mt-1 px-1 text-center text-[11px] text-taupe">2 mặt · A4 in treo tiệm · tải về 2480×3508px mỗi mặt</p>
      </div>

      <div className="space-y-4">
        <PriceGallery tab={tab} />
        <DesignerPanel draft={draft} capture={() => [frontRef.current, backRef.current].filter((el): el is SVGSVGElement => !!el)} name={`Menu · ${d.salon}`} config={MENU_EDITOR} what="menu (cả 2 mặt)" />
        {(error || uploadError) && <p className="rounded-xl bg-rosegold/10 px-3 py-2 text-[12px] text-rosegold">{uploadError || error}</p>}

        {!free && (
          <>
            <Panel title="Logo & ảnh móng">
              <Label hint="PNG nền trong là đẹp nhất">Logo tiệm</Label>
              <div className="flex flex-wrap items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element -- ảnh khách tải lên (data URL) */}
                {d.logo && <img src={d.logo} alt="Logo tiệm" className="h-12 max-w-[140px] rounded-lg border border-line bg-white object-contain p-1" />}
                <label className={`${small} cursor-pointer`}>
                  {d.logo ? "Đổi logo" : "↑ Tải logo lên"}
                  <input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => { void upload(e.target.files?.[0], (logo) => update({ logo }), 900, "image/png"); e.target.value = ""; }} />
                </label>
                {d.logo && (
                  <button type="button" onClick={() => update({ logo: "" })} className={`${small} text-taupe`}>
                    Dùng logo chữ của mẫu
                  </button>
                )}
              </div>
              <Label hint="Ảnh ngang hoặc vuông, rõ móng">Ảnh móng ({t.front === "archHero" || t.front === "photoTop" || t.front === "frame" ? "mẫu này dùng ảnh 1" : "3 ảnh"})</Label>
              <div className="grid grid-cols-3 gap-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="space-y-1">
                    {/* eslint-disable-next-line @next/next/no-img-element -- ảnh mẫu / ảnh khách tải lên */}
                    <img src={photoUrls[i]} alt={`Ảnh ${i + 1}`} className="aspect-square w-full rounded-xl border border-line object-cover" />
                    <label className={`${small} block cursor-pointer text-center`}>
                      Ảnh {i + 1}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        hidden
                        onChange={(e) => {
                          void upload(e.target.files?.[0], (url) => update({ photos: [0, 1, 2].map((j) => (j === i ? url : d.photos[j] ?? "")) }), 1400, "image/jpeg");
                          e.target.value = "";
                        }}
                      />
                    </label>
                    {d.photos[i] && (
                      <button type="button" onClick={() => update({ photos: [0, 1, 2].map((j) => (j === i ? "" : d.photos[j] ?? "")) })} className="block w-full text-center text-[11px] text-taupe underline">
                        Dùng ảnh mẫu
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Thông tin tiệm">
              {text("salon", "Tên tiệm", 40)}
              {text("tagline", "Dòng giới thiệu", 40)}
              <div className="grid grid-cols-2 gap-x-3">
                <div>{text("phone", "Điện thoại", 24)}</div>
                <div>
                  <Label hint="2 dòng">Giờ mở cửa</Label>
                  <input value={hours[0] ?? ""} maxLength={32} onChange={(e) => setHours(0, e.target.value)} placeholder="T2 – T6: 9:00 – 21:00" className={inputCls} />
                  <input value={hours[1] ?? ""} maxLength={32} onChange={(e) => setHours(1, e.target.value)} placeholder="T7 – CN: 8:30 – 21:30" className={`${inputCls} mt-2`} />
                </div>
              </div>
              {text("address", "Địa chỉ", 60)}
            </Panel>

            <Panel title="Khuyến mãi (không bắt buộc)">
              <div className="grid grid-cols-2 gap-x-3">
                <div>{text("promoTitle", "Tiêu đề", 24)}</div>
                <div>
                  <Label hint="Để trống = ẩn">Mức giảm</Label>
                  <input value={d.promoDiscount} maxLength={6} onChange={(e) => update({ promoDiscount: e.target.value })} className={inputCls} />
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {["20%", "30%", "50%"].map((v) => (
                  <button key={v} type="button" onClick={() => update({ promoDiscount: v })} aria-pressed={d.promoDiscount === v} className={`${chip(d.promoDiscount === v)} px-3 py-1.5 text-xs`}>
                    {v}
                  </button>
                ))}
                <button type="button" onClick={() => update({ promoDiscount: "" })} aria-pressed={!d.promoDiscount} className={`${chip(!d.promoDiscount)} px-3 py-1.5 text-xs`}>
                  Không khuyến mãi
                </button>
              </div>
              {text("promoNote", "Áp dụng / thời gian", 48)}
              {text("highlights", "Dịch vụ nổi bật (hiện khi không khuyến mãi)", 60)}
            </Panel>

            <Panel title={`Mã QR · ${d.qrs.length}/4`}>
              <div className="space-y-1.5">
                {d.qrs.map((q, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <input value={q.label} maxLength={16} onChange={(e) => update({ qrs: d.qrs.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} placeholder="Facebook" aria-label="Tên mã QR" className={`${cellCls} w-[110px] shrink-0`} />
                    <input value={q.url} maxLength={300} onChange={(e) => update({ qrs: d.qrs.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)) })} placeholder="https://…" aria-label="Đường link" className={`${cellCls} flex-1`} />
                    <button type="button" onClick={() => update({ qrs: d.qrs.filter((_, j) => j !== i) })} aria-label={`Xoá mã ${q.label}`} className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-taupe active:scale-90">
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              {d.qrs.length < 4 && (
                <button type="button" onClick={() => update({ qrs: [...d.qrs, { label: "", url: "" }] })} className={`${small} mt-2`}>
                  + Thêm mã QR
                </button>
              )}
              <p className="mt-2 px-1 text-[11px] text-taupe">Dán link Facebook, WhatsApp (wa.me/số điện thoại quốc tế), Instagram, trang đặt lịch… mã QR tự tạo.</p>
            </Panel>

            <Panel title="Mặt sau · bảng giá">
              {text("title", "Tiêu đề", 30)}
              <div className="mt-4 space-y-4">
                {d.sections.map((s, si) => (
                  <div key={si} className="rounded-2xl border border-line bg-white/50 p-3">
                    <div className="flex items-center gap-1">
                      <input value={s.title} maxLength={30} onChange={(e) => setSection(si, { title: e.target.value })} aria-label="Tên nhóm dịch vụ" className="min-w-0 flex-1 rounded-xl border border-transparent bg-transparent px-2 py-1.5 text-[15px] font-semibold outline-none focus:border-gold" />
                      <button type="button" onClick={() => update({ sections: d.sections.filter((_, j) => j !== si) })} aria-label={`Xoá nhóm ${s.title}`} className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-taupe active:scale-90">
                        ✕
                      </button>
                    </div>
                    <div className="mt-1 space-y-2">
                      {s.items.map((it, ii) => (
                        <div key={ii} className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <input value={it.name} maxLength={34} onChange={(e) => setItem(si, ii, { name: e.target.value })} placeholder="Tên dịch vụ" aria-label="Tên dịch vụ" className={`${cellCls} flex-1`} />
                            <input value={it.price} maxLength={12} onChange={(e) => setItem(si, ii, { price: e.target.value })} placeholder="Giá" aria-label="Giá" className={`${cellCls} w-[80px] shrink-0 text-right font-semibold`} />
                            <button type="button" onClick={() => setSection(si, { items: s.items.filter((_, j) => j !== ii) })} aria-label={`Xoá ${it.name || "dịch vụ"}`} className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-taupe active:scale-90">
                              ✕
                            </button>
                          </div>
                          <input value={it.desc} maxLength={48} onChange={(e) => setItem(si, ii, { desc: e.target.value })} placeholder="Mô tả ngắn (không bắt buộc)" aria-label="Mô tả" className="w-full rounded-lg border border-transparent bg-transparent px-3 py-1 text-[12px] text-taupe outline-none focus:border-line" />
                        </div>
                      ))}
                    </div>
                    {s.items.length < 8 && (
                      <button type="button" onClick={() => setSection(si, { items: [...s.items, { name: "", price: "", desc: "" }] })} className={`${small} mt-2`}>
                        + Thêm dịch vụ
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {d.sections.length < 8 && (
                  <button type="button" onClick={() => update({ sections: [...d.sections, { title: "Nhóm dịch vụ mới", icon: "plus", items: [{ name: "", price: "", desc: "" }] }] })} className={small}>
                    + Thêm nhóm
                  </button>
                )}
                <button type="button" onClick={() => update({ sections: DEFAULT_MENU.sections.map((s) => ({ ...s, items: s.items.map((i) => ({ ...i })) })) })} className={`${small} text-taupe`}>
                  Dùng lại bảng giá mẫu
                </button>
              </div>
              <Label hint="Không bắt buộc">Lưu ý cuối trang</Label>
              {[0, 1].map((i) => (
                <input key={i} value={d.policy[i] ?? ""} maxLength={70} onChange={(e) => update({ policy: [0, 1].map((j) => (j === i ? e.target.value : d.policy[j] ?? "")) })} className={`${inputCls} ${i ? "mt-2" : ""}`} />
              ))}
              <button type="button" onClick={reset} className="mt-5 w-full rounded-full border border-line bg-white/70 py-2.5 text-sm text-taupe active:scale-[0.98]">
                Đặt lại nội dung mẫu (giữ logo & ảnh)
              </button>
            </Panel>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- Ghép vào tab ---------- */

export function PriceTabStudio({ tab }: { tab: PriceTab }) {
  return tab.mode === "menu" ? <MenuStudio tab={tab} /> : <PriceStudio editor={tab.classic} gallery={<PriceGallery tab={tab} />} />;
}

export function PriceTabFooter({ tab }: { tab: PriceTab }) {
  if (tab.mode === "classic") return <PriceFooter editor={tab.classic} />;
  const { menu } = tab;
  return (
    <ExportBar
      busy={!!menu.busy}
      onDownload={menu.download}
      recommended="pdf"
      info={
        <>
          Menu 2 mặt · <b>{menu.template.title}</b> · A4 2480 × 3508 px mỗi mặt · 300 dpi
        </>
      }
    />
  );
}
