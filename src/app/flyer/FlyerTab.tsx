"use client";

import { useEffect, useRef, useState } from "react";
import { FLYER_SIZE, FLYER_TEMPLATES, flyerDesignFrom, type FlyerTemplate } from "@/lib/flyer-templates";
import type { PriceItem, PriceSection } from "@/lib/price-templates";
import { DEFAULT_PROMO, PROMO_SIZE, PROMO_TEMPLATES, promoDesignFrom, type PromoFlyerDesign, type PromoFlyerTemplate, type PromoOffer } from "@/lib/promo-flyer-templates";
import type { EditorConfig } from "../card/CanvasEditor";
import { CanvasSvg } from "../card/CanvasSvg";
import { DesignerPanel } from "../design/DesignerPanel";
import { downloadDesign, type ExportKind } from "../design/export";
import { ExportBar } from "../design/ExportBar";
import { Label, Pager, Panel, chip, inputCls } from "../design/ui";
import { useCanvasDraft } from "../design/useCanvasDraft";
import { FlyerFooter, FlyerStudio, useFlyerEditor } from "./FlyerStudio";
import { FlyerFrontSvg } from "./FlyerFrontSvg";
import { PromoFlyerSvg } from "./PromoFlyerSvg";

// Tab Tờ rơi: 20 mẫu quảng cáo (mặt trước khuyến mãi, mặt sau bảng giá) ở trang đầu, sau đó 20 mẫu khai trương 2 mặt.

const MODE_KEY = "naile-flyer-mode";
const PROMO_KEY = "naile-promo-flyer";
const PAGE_SIZE = 10;
const PROMO_EDITOR: EditorConfig = {
  title: "Trình thiết kế tờ rơi",
  backLabel: "Về mẫu tờ rơi",
  fileBase: "to-roi",
  exportScale: PROMO_SIZE.width / 600,
  dpi: PROMO_SIZE.dpi,
  pdfLabel: "PDF · A4 hai mặt",
  hint: "Chọn chữ, bảng giá hoặc hoạ tiết để kéo thả, đổi cỡ và chỉnh màu. Bạn cũng có thể thêm logo, hình ảnh hoặc mã QR.",
  subject: "tờ rơi",
  pageNames: ["Mặt trước", "Mặt sau · bảng giá"],
};

// Nội dung riêng của tiệm: giữ lại khi đổi mẫu. Tiêu đề, mức giảm… lấy theo chủ đề của mẫu mới.
const KEEP = ["salon", "offers", "hours", "address", "phone", "social", "note", "menu", "backTitle", "backNote"] as const;

/* ---------- Trạng thái tờ rơi quảng cáo ---------- */

function usePromoEditor() {
  const [design, setDesign] = useState<PromoFlyerDesign>(() => promoDesignFrom(PROMO_TEMPLATES[0]));
  const [busy, setBusy] = useState<"" | ExportKind>("");
  const ref = useRef<SVGSVGElement>(null);
  const backRef = useRef<SVGSVGElement>(null);
  const template = PROMO_TEMPLATES.find((t) => t.id === design.templateId) ?? PROMO_TEMPLATES[0];

  useEffect(() => {
    try {
      const saved = localStorage.getItem(PROMO_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as Partial<PromoFlyerDesign>;
      const t = PROMO_TEMPLATES.find((x) => x.id === parsed.templateId) ?? PROMO_TEMPLATES[0];
      // eslint-disable-next-line react-hooks/set-state-in-effect -- đọc bản lưu sau khi hydrate
      setDesign(promoDesignFrom(t, parsed));
    } catch {}
  }, []);

  const change = (fn: (d: PromoFlyerDesign) => PromoFlyerDesign) =>
    setDesign((prev) => {
      const next = fn(prev);
      try {
        localStorage.setItem(PROMO_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  const update = (patch: Partial<PromoFlyerDesign>) => change((d) => ({ ...d, ...patch }));
  const applyTemplate = (t: PromoFlyerTemplate) => change((d) => promoDesignFrom(t, Object.fromEntries(KEEP.map((k) => [k, d[k]]))));
  const reset = () => change(() => promoDesignFrom(template));

  async function download(kind: ExportKind) {
    if (!ref.current || !backRef.current || busy) return;
    setBusy(kind);
    try {
      await downloadDesign(
        [{ el: ref.current, suffix: "mat-truoc" }, { el: backRef.current, suffix: "mat-sau" }],
        kind,
        `to-roi-${design.salon}`,
        PROMO_SIZE.width,
        PROMO_SIZE.height,
        PROMO_SIZE.dpi,
      );
    } finally {
      setBusy("");
    }
  }

  return { design, template, update, applyTemplate, reset, download, busy, ref, backRef };
}

// Ảnh của mẫu dưới dạng data URL: trình thiết kế tự do chỉ nhận ảnh nhúng sẵn.
function usePhotoData(url?: string) {
  const [data, setData] = useState<{ url: string; data: string } | null>(null);
  useEffect(() => {
    if (!url) return;
    let alive = true;
    fetch(url)
      .then((r) => r.blob())
      .then((blob) => {
        const reader = new FileReader();
        reader.onload = () => alive && setData({ url, data: String(reader.result) });
        reader.readAsDataURL(blob);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [url]);
  return data && data.url === url ? data.data : url;
}

/* ---------- Trạng thái chung của tab ---------- */

export function useFlyerTab() {
  const classic = useFlyerEditor();
  const promo = usePromoEditor();
  const [mode, setModeState] = useState<"promo" | "classic">("promo");
  const [page, setPage] = useState(0);
  const [gallerySide, setGallerySide] = useState<"front" | "back">("front");
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- đọc bản lưu sau khi hydrate
      if (localStorage.getItem(MODE_KEY) === "classic") setModeState("classic");
    } catch {}
  }, []);
  const setMode = (m: "promo" | "classic") => {
    setModeState(m);
    try {
      localStorage.setItem(MODE_KEY, m);
    } catch {}
  };
  return { classic, promo, mode, setMode, page, setPage, gallerySide, setGallerySide };
}
export type FlyerTab = ReturnType<typeof useFlyerTab>;

/* ---------- Thư viện chung ---------- */

type Item = { kind: "promo"; t: PromoFlyerTemplate } | { kind: "classic"; t: FlyerTemplate };
const ITEMS: Item[] = [...PROMO_TEMPLATES.map((t) => ({ kind: "promo" as const, t })), ...FLYER_TEMPLATES.map((t) => ({ kind: "classic" as const, t }))];

function FlyerGallery({ tab }: { tab: FlyerTab }) {
  const { classic, promo, mode, setMode, page, setPage, gallerySide, setGallerySide } = tab;
  const ref = useRef<HTMLDivElement>(null);
  const pages = Math.ceil(ITEMS.length / PAGE_SIZE);
  const goPage = (p: number) => {
    setPage(p);
    ref.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  };
  const promoPage = page * PAGE_SIZE < PROMO_TEMPLATES.length;
  return (
    <div ref={ref} className="scroll-mt-4">
      <div className="mb-3 px-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-gold">Tờ rơi A4 · trang {page + 1}/{pages}</p>
        <h2 className="mt-1 font-serif text-[27px] leading-tight">{promoPage ? `${PROMO_TEMPLATES.length} mẫu quảng cáo khai trương & giảm giá` : `${FLYER_TEMPLATES.length} mẫu khai trương 2 mặt`}</h2>
        <p className="mt-1 text-xs text-taupe">
          {promoPage ? "2 mặt · mặt trước ưu đãi, mặt sau bảng giá đầy đủ · đổi mẫu vẫn giữ tên tiệm và bảng giá" : "Ảnh móng chụp thật ở mặt trước · mặt sau là lời mời"}
        </p>
        {promoPage && (
          <div className="mt-3 flex gap-1.5 text-[11px] font-medium">
            <button type="button" onClick={() => setGallerySide("front")} aria-pressed={gallerySide === "front"} className={`${chip(gallerySide === "front")} px-3 py-1.5`}>
              Xem mặt trước
            </button>
            <button type="button" onClick={() => setGallerySide("back")} aria-pressed={gallerySide === "back"} className={`${chip(gallerySide === "back")} px-3 py-1.5`}>
              Xem mặt sau · bảng giá
            </button>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {ITEMS.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((item) => {
          const selected = item.kind === mode && (item.kind === "promo" ? promo.design.templateId : classic.design.templateId) === item.t.id;
          return (
            <button
              key={item.t.id}
              type="button"
              aria-pressed={selected}
              className="text-left active:scale-[0.98]"
              onClick={() => {
                if (item.kind === "promo") promo.applyTemplate(item.t);
                else classic.applyTemplate(item.t);
                setMode(item.kind);
              }}
            >
              <span className={`block overflow-hidden rounded-lg bg-white shadow-sm transition ${selected ? "ring-2 ring-gold ring-offset-2 ring-offset-ivory" : "ring-1 ring-line"}`}>
                {item.kind === "promo" ? (
                  <PromoFlyerSvg design={promoDesignFrom(item.t, Object.fromEntries(KEEP.map((k) => [k, promo.design[k]])))} template={item.t} side={gallerySide} className="block h-auto w-full" />
                ) : (
                  <FlyerFrontSvg design={flyerDesignFrom(item.t, { salon: classic.design.salon, address: classic.design.address, phone: classic.design.phone, dates: classic.design.dates })} className="block h-auto w-full" />
                )}
              </span>
              <span className={`mt-1.5 block px-0.5 text-xs ${selected ? "font-semibold" : "text-taupe"}`}>
                {selected ? "✓ " : ""}
                {item.t.title}
                {item.kind === "promo" && <span className="ml-1 rounded-full bg-gold/15 px-1.5 py-0.5 text-[9px] font-semibold text-gold">Mới</span>}
              </span>
              <span className="block px-0.5 text-[10px] text-gold">{item.kind === "promo" ? (item.t.kind === "open" ? "Khai trương · 2 mặt" : "Giảm giá · 2 mặt") : `${item.t.mood} · 2 mặt`}</span>
            </button>
          );
        })}
      </div>
      <Pager page={page} pages={pages} onChange={goPage} />
    </div>
  );
}

/* ---------- Giao diện tờ rơi quảng cáo ---------- */

function PromoStudio({ tab }: { tab: FlyerTab }) {
  const { design, template, update, reset, ref, backRef } = tab.promo;
  const photo = usePhotoData(template.photo);
  const [side, setSide] = useState<"front" | "back">("front");
  // Bản thiết kế tự do gồm cả 2 mặt (khoá "promo2:" để không lẫn bản 1 mặt cũ).
  const draft = useCanvasDraft(`promo2:${design.templateId}`);
  const free = draft.doc;
  const text = (key: "salon" | "eyebrow" | "headline" | "subhead" | "discountLabel" | "dates" | "hours" | "address" | "phone" | "social" | "note" | "backTitle" | "backNote", label: string, max: number, hint?: string) => (
    <>
      <Label hint={hint}>{label}</Label>
      <input value={design[key]} maxLength={max} onChange={(e) => update({ [key]: e.target.value })} className={inputCls} />
    </>
  );
  const setOffer = (i: number, patch: Partial<PromoOffer>) => update({ offers: design.offers.map((o, j) => (j === i ? { ...o, ...patch } : o)) });
  const setSection = (si: number, patch: Partial<PriceSection>) => update({ menu: design.menu.map((s, j) => (j === si ? { ...s, ...patch } : s)) });
  const setItem = (si: number, ii: number, patch: Partial<PriceItem>) =>
    setSection(si, { items: design.menu[si].items.map((it, j) => (j === ii ? { ...it, ...patch } : it)) });
  const small = "rounded-full border border-line bg-white/70 px-3 py-1.5 text-[12px] font-medium active:scale-95";

  return (
    <div className="space-y-5 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start lg:gap-8 lg:space-y-0">
      <div className="space-y-3 lg:sticky lg:top-0">
        <div className="mx-auto flex w-fit rounded-full border border-line bg-cream/80 p-1 text-xs font-medium">
          <button type="button" onClick={() => setSide("front")} aria-pressed={side === "front"} className={`rounded-full px-4 py-1.5 ${side === "front" ? "bg-ink text-white" : "text-taupe"}`}>
            Mặt trước · ưu đãi
          </button>
          <button type="button" onClick={() => setSide("back")} aria-pressed={side === "back"} className={`rounded-full px-4 py-1.5 ${side === "back" ? "bg-ink text-white" : "text-taupe"}`}>
            Mặt sau · bảng giá
          </button>
        </div>
        <div className="fade-up rounded-3xl border border-line bg-stage p-4 sm:p-6">
          <div className="mx-auto overflow-hidden rounded-sm shadow-[0_16px_35px_-16px_rgb(23_22_26/0.55)]" style={{ maxWidth: "min(100%, calc((100dvh - 13rem) * 0.707))" }}>
            {free ? (
              <>
                <div className={side === "front" ? "" : "hidden"}><CanvasSvg page={free.pages[0]} svgRef={ref} className="block h-auto w-full" /></div>
                {free.pages[1] && <div className={side === "back" ? "" : "hidden"}><CanvasSvg page={free.pages[1]} svgRef={backRef} className="block h-auto w-full" /></div>}
              </>
            ) : (
              <>
                <div className={side === "front" ? "" : "hidden"}><PromoFlyerSvg design={design} template={template} photo={photo} svgRef={ref} className="block h-auto w-full" /></div>
                <div className={side === "back" ? "" : "hidden"}><PromoFlyerSvg design={design} template={template} photo={photo} side="back" svgRef={backRef} className="block h-auto w-full" /></div>
              </>
            )}
          </div>
        </div>
        <p className="text-center text-[11px] text-taupe">Khổ A4 · 210 × 297 mm · 2 mặt · 300 dpi</p>
      </div>

      <div className="space-y-4">
        <FlyerGallery tab={tab} />
        <DesignerPanel draft={draft} capture={() => [ref.current, backRef.current].filter((el): el is SVGSVGElement => !!el)} name={`Tờ rơi · ${design.salon}`} config={PROMO_EDITOR} what="tờ rơi (cả hai mặt)" />

        {!free && (
          <>
            <Panel title="Tiêu đề & ưu đãi">
              {text("salon", "Tên tiệm", 40)}
              {text("eyebrow", "Dòng nhỏ trên tiêu đề", 36, "Không bắt buộc")}
              {text("headline", "Tiêu đề lớn", 28)}
              {text("subhead", "Dòng giới thiệu", 60)}
              <div className="grid grid-cols-2 gap-x-3">
                <div>{text("discountLabel", "Chữ kèm mức giảm", 34)}</div>
                <div>
                  <Label>Mức giảm</Label>
                  <input value={design.discount} maxLength={6} onChange={(e) => update({ discount: e.target.value })} className={inputCls} />
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {["20%", "30%", "40%", "50%"].map((v) => (
                  <button key={v} type="button" onClick={() => update({ discount: v })} aria-pressed={design.discount === v} className={`${chip(design.discount === v)} px-3 py-1.5 text-xs`}>
                    {v}
                  </button>
                ))}
              </div>
              {text("dates", "Thời gian ưu đãi", 32)}
            </Panel>

            <Panel title={`Bảng giá dịch vụ · ${design.offers.length}/6`}>
              <div className="space-y-1.5">
                <div className="flex gap-1.5 px-1 text-[10px] font-semibold uppercase tracking-wide text-taupe">
                  <span className="flex-1">Dịch vụ</span>
                  <span className="w-[62px] text-right">Giá cũ</span>
                  <span className="w-[62px] text-right">Giá mới</span>
                  <span className="w-8" />
                </div>
                {design.offers.map((o, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <input value={o.name} maxLength={34} onChange={(e) => setOffer(i, { name: e.target.value })} placeholder="Tên dịch vụ" aria-label="Tên dịch vụ" className="min-w-0 flex-1 rounded-xl border border-line bg-white/80 px-3 py-2 text-[14px] outline-none focus:border-gold" />
                    <input value={o.old} maxLength={10} onChange={(e) => setOffer(i, { old: e.target.value })} placeholder="150K" aria-label="Giá cũ" className="w-[62px] shrink-0 rounded-xl border border-line bg-white/80 px-2 py-2 text-right text-[13px] text-taupe outline-none focus:border-gold" />
                    <input value={o.now} maxLength={10} onChange={(e) => setOffer(i, { now: e.target.value })} placeholder="99K" aria-label="Giá mới" className="w-[62px] shrink-0 rounded-xl border border-line bg-white/80 px-2 py-2 text-right text-[13px] font-semibold outline-none focus:border-gold" />
                    <button type="button" onClick={() => update({ offers: design.offers.filter((_, j) => j !== i) })} aria-label={`Xoá ${o.name || "dịch vụ"}`} className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-taupe active:scale-90">
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {design.offers.length < 6 && (
                  <button type="button" onClick={() => update({ offers: [...design.offers, { name: "", old: "", now: "" }] })} className={small}>
                    + Thêm dịch vụ
                  </button>
                )}
                <button type="button" onClick={() => update({ offers: DEFAULT_PROMO.offers.map((o) => ({ ...o })) })} className={`${small} text-taupe`}>
                  Dùng lại bảng giá mẫu
                </button>
              </div>
              <p className="mt-2 px-1 text-[11px] text-taupe">Để trống giá cũ nếu không muốn hiện giá gạch ngang. Tên dài tự thu nhỏ cho vừa.</p>
            </Panel>

            <Panel title="Quà tặng kèm">
              {[0, 1, 2].map((i) => (
                <input
                  key={i}
                  value={design.perks[i] ?? ""}
                  maxLength={36}
                  placeholder={`Quà tặng ${i + 1} (không bắt buộc)`}
                  onChange={(e) => update({ perks: [0, 1, 2].map((j) => (j === i ? e.target.value : (design.perks[j] ?? ""))) })}
                  className={`${inputCls} ${i ? "mt-2" : ""}`}
                />
              ))}
            </Panel>

            <Panel title="Mặt sau · bảng giá đầy đủ">
              {text("backTitle", "Tiêu đề mặt sau", 30)}
              {text("backNote", "Dòng ghi chú dưới tiêu đề", 60, "Không bắt buộc")}
              <div className="mt-4 space-y-4">
                {design.menu.map((sec, si) => (
                  <div key={si} className="rounded-2xl border border-line bg-white/50 p-3">
                    <div className="flex items-center gap-1">
                      <input value={sec.title} maxLength={30} onChange={(e) => setSection(si, { title: e.target.value })} placeholder="Tên nhóm, VD: Chăm sóc móng" aria-label="Tên nhóm dịch vụ" className="min-w-0 flex-1 rounded-xl border border-transparent bg-transparent px-2 py-1.5 text-[15px] font-semibold outline-none focus:border-gold" />
                      <button type="button" onClick={() => update({ menu: design.menu.filter((_, j) => j !== si) })} aria-label={`Xoá nhóm ${sec.title}`} className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-taupe active:scale-90">
                        ✕
                      </button>
                    </div>
                    <div className="mt-1 space-y-1.5">
                      {sec.items.map((it, ii) => (
                        <div key={ii} className="flex items-center gap-1.5">
                          <input value={it.name} maxLength={34} onChange={(e) => setItem(si, ii, { name: e.target.value })} placeholder="Tên dịch vụ" aria-label="Tên dịch vụ" className="min-w-0 flex-1 rounded-xl border border-line bg-white/80 px-3 py-2 text-[14px] outline-none focus:border-gold" />
                          <input value={it.price} maxLength={12} onChange={(e) => setItem(si, ii, { price: e.target.value })} placeholder="Giá" aria-label="Giá" className="w-[76px] shrink-0 rounded-xl border border-line bg-white/80 px-2 py-2 text-right text-[13px] font-semibold outline-none focus:border-gold" />
                          <button type="button" onClick={() => setSection(si, { items: sec.items.filter((_, j) => j !== ii) })} aria-label={`Xoá ${it.name || "dịch vụ"}`} className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-taupe active:scale-90">
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                    {sec.items.length < 8 && (
                      <button type="button" onClick={() => setSection(si, { items: [...sec.items, { name: "", price: "" }] })} className={`${small} mt-2`}>
                        + Thêm dịch vụ
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {design.menu.length < 4 && (
                  <button type="button" onClick={() => update({ menu: [...design.menu, { title: "Nhóm dịch vụ mới", items: [{ name: "", price: "" }] }] })} className={small}>
                    + Thêm nhóm
                  </button>
                )}
                <button type="button" onClick={() => update({ menu: DEFAULT_PROMO.menu.map((s) => ({ ...s, items: s.items.map((i) => ({ ...i })) })) })} className={`${small} text-taupe`}>
                  Dùng lại bảng giá mẫu
                </button>
              </div>
              <p className="mt-2 px-1 text-[11px] text-taupe">Tối đa 4 nhóm, mỗi nhóm 8 dịch vụ. Nhiều dòng thì chữ tự nhỏ lại cho vừa trang.</p>
            </Panel>

            <Panel title="Liên hệ">
              {text("address", "Địa chỉ", 60)}
              <div className="grid grid-cols-2 gap-x-3">
                <div>{text("phone", "Điện thoại", 24)}</div>
                <div>{text("hours", "Giờ mở cửa", 30)}</div>
              </div>
              {text("social", "Facebook / WhatsApp", 50, "Không bắt buộc")}
              {text("note", "Điều kiện áp dụng", 80, "Không bắt buộc")}
              <button type="button" onClick={reset} className="mt-5 w-full rounded-full border border-line bg-white/70 py-2.5 text-sm text-taupe active:scale-[0.98]">
                Đặt lại nội dung mẫu này
              </button>
            </Panel>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- Ghép vào tab ---------- */

export function FlyerTabStudio({ tab }: { tab: FlyerTab }) {
  return tab.mode === "promo" ? <PromoStudio tab={tab} /> : <FlyerStudio editor={tab.classic} gallery={<FlyerGallery tab={tab} />} />;
}

export function FlyerTabFooter({ tab }: { tab: FlyerTab }) {
  if (tab.mode === "classic") return <FlyerFooter editor={tab.classic} />;
  const { promo } = tab;
  return (
    <ExportBar
      busy={!!promo.busy}
      onDownload={promo.download}
      recommended="pdf"
      info={
        <>
          Tờ rơi A4 · 2 mặt · <b>{promo.template.title}</b> · {FLYER_SIZE.width} × {FLYER_SIZE.height} px mỗi mặt · 300 dpi
        </>
      }
    />
  );
}
