"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { SessionUser } from "@/lib/auth/session";
import type { QuotaSummary, TrialInfo } from "@/lib/usage";
import type { SiteFooter } from "@/lib/settings";
import { SiteCredit } from "./SiteCredit";
import { logout } from "./(auth)/actions";
import {
  CUSTOM_MOTION,
  CUSTOM_STYLE,
  DEFAULT_MOTIONS,
  DEFAULT_STYLES,
  DEFAULT_VIDEO_FORMAT,
  IMAGE_FORMATS,
  IMAGE_STYLES,
  MAX_IMAGES,
  MAX_VIDEOS,
  NOTE_MAX,
  NOTE_SUGGESTIONS,
  DEFAULT_IMAGE_MODEL,
  DEFAULT_VIDEO_MODEL,
  IMAGE_MODEL_OPTIONS,
  VIDEO_MODEL_OPTIONS,
  type ModelOption,
  VIDEO_FORMATS,
  VIDEO_MOTIONS,
  VIDEO_NOTE_SUGGESTIONS,
  type Format,
  type Preset,
} from "@/lib/presets";
import { shareOrDownload } from "@/lib/share";
import { ApiError, errMsg, fileToDataUrl, postJson, urlToDataUrl } from "./ai-client";
import { useBackClose } from "./use-back-close";
import { LogoFooter, LogoStudio, useLogoEditor } from "./logo/LogoStudio";
import { LOGO_TEMPLATES } from "@/lib/logo-templates";
import { PriceTabFooter, PriceTabStudio, usePriceTab } from "./menu/PriceTab";
import { MENU_TEMPLATES } from "@/lib/menu-templates";
import { VOUCHER_TEMPLATES } from "@/lib/voucher-templates";
import { PRICE_TEMPLATES } from "@/lib/price-templates";
import { CardFooter, CardStudio, useCardEditor } from "./card/CardStudio";
import { CARD_TEMPLATES } from "@/lib/card-templates";
import { VoucherFooter, VoucherStudio, useVoucherEditor } from "./voucher/VoucherStudio";
import { FlyerTabFooter, FlyerTabStudio, useFlyerTab } from "./flyer/FlyerTab";
import { FLYER_TEMPLATES } from "@/lib/flyer-templates";
import { PROMO_TEMPLATES } from "@/lib/promo-flyer-templates";
import { StampFooter, StampStudio, useStampEditor } from "./stamp/StampStudio";
import { STAMP_TEMPLATES } from "@/lib/stamp-templates";
import { CaptionFooter, CaptionStudio, useCaptionEditor } from "./caption/CaptionStudio";

type Job =
  | { status: "idle" }
  | { status: "loading"; startedAt: number }
  | { status: "done"; url: string }
  | { status: "error"; error: string };

type Tab = "photos" | "videos" | "caption" | "logo" | "price" | "card" | "voucher" | "flyer" | "stamp";
type Viewer = { kind: "image" | "video"; url: string; name: string; styleId?: string; historyId?: string };

const POLL_MS = 8000;

// user = null: khách chưa đăng nhập (admin đã tắt "Bắt buộc đăng nhập").
export function Studio({ user, quota: initialQuota, trial: initialTrial, footer }: { user: SessionUser | null; quota: QuotaSummary | null; trial: TrialInfo | null; footer: SiteFooter }) {
  // Lượt đã dùng / hạn mức tháng này; API trả số mới sau mỗi lần tạo.
  const [quota, setQuota] = useState(initialQuota);
  // Khách chưa đăng nhập: lượt dùng thử; hết thì hiện hộp mời tạo tài khoản.
  const [trial, setTrial] = useState(initialTrial);
  const [needAccount, setNeedAccount] = useState<string | null>(null);
  const trialOut = !user && !!trial && trial.used >= trial.limit;
  const askAccount = () => setNeedAccount(trialOutMessage(trial?.limit ?? 0));
  const onApiError = (e: unknown) => {
    if (!(e instanceof ApiError)) return;
    if (e.data.trial) setTrial(e.data.trial as TrialInfo);
    if (e.needAccount) setNeedAccount(e.message);
  };
  const [original, setOriginal] = useState<string | null>(null);
  const [images, setImages] = useState<Record<string, Job>>({});
  const [videos, setVideos] = useState<Record<string, Job>>({});
  // Thứ tự các ảnh / video đã bấm tạo (chỉ hiện những cái này).
  const [imageOrder, setImageOrder] = useState<string[]>([]);
  const [videoOrder, setVideoOrder] = useState<string[]>([]);
  const [pickedStyles, setPickedStyles] = useState<string[]>(DEFAULT_STYLES);
  const [imageCount, setImageCount] = useState(1);
  const [pickedMotions, setPickedMotions] = useState<string[]>(DEFAULT_MOTIONS);
  // Mô tả riêng cho video (khác mô tả chỉnh ảnh).
  const [videoNote, setVideoNote] = useState("");
  const [videoCount, setVideoCount] = useState(1);
  // Kích thước đăng (tỉ lệ khung) cho ảnh và video.
  const [imageFormat, setImageFormat] = useState(IMAGE_FORMATS[0].id);
  const [videoFormat, setVideoFormat] = useState(DEFAULT_VIDEO_FORMAT);
  const [appliedFormat, setAppliedFormat] = useState(IMAGE_FORMATS[0].id);
  const [videoFormats, setVideoFormats] = useState<Record<string, string>>({});
  // Model AI người dùng chọn (ảnh / video) và model đã dùng cho từng kết quả (để "Thử lại" đúng model).
  const [imageModel, setImageModel] = useState(DEFAULT_IMAGE_MODEL);
  const [videoModel, setVideoModel] = useState(DEFAULT_VIDEO_MODEL);
  const [appliedImageModel, setAppliedImageModel] = useState(DEFAULT_IMAGE_MODEL);
  // Model thực tế đã tạo từng ảnh (khác model đã chọn khi model đó đang bận).
  const [usedModels, setUsedModels] = useState<Record<string, string>>({});
  const [videoModels, setVideoModels] = useState<Record<string, string>>({});
  const [source, setSource] = useState<string>("original");
  const [tab, setTab] = useState<Tab>("photos");
  const [menuOpen, setMenuOpen] = useState(false);
  const [viewer, setViewer] = useState<Viewer | null>(null);
  // Lịch sử ảnh đã tạo (lưu trên máy chủ); historyRev tăng khi có ảnh mới để bảng lịch sử tải lại.
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyRev, setHistoryRev] = useState(0);

  // Studio chỉ cuộn phần nội dung giữa; cả trang (window) phải luôn ở vị trí trên cùng.
  // iPhone đẩy cả trang lên khi mở bàn phím và không kéo về khi tắt → thanh trên cùng (menu)
  // bị kẹt khuất. Không có ô nào đang gõ thì đưa trang về lại vị trí 0.
  useEffect(() => {
    const typing = () => {
      const el = document.activeElement as HTMLElement | null;
      return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
    };
    const pin = () => {
      if ((window.scrollY || document.documentElement.scrollTop) !== 0 && !typing()) window.scrollTo(0, 0);
    };
    const later = () => setTimeout(pin, 80);
    window.addEventListener("scroll", pin, { passive: true });
    document.addEventListener("focusout", later);
    window.visualViewport?.addEventListener("resize", later);
    return () => {
      window.removeEventListener("scroll", pin);
      document.removeEventListener("focusout", later);
      window.visualViewport?.removeEventListener("resize", later);
    };
  }, []);

  const [demo, setDemo] = useState(false);
  const [now, setNow] = useState(0);
  // note: đang gõ; appliedNote: mô tả đã dùng cho bộ ảnh hiện tại.
  const [note, setNote] = useState("");
  const [appliedNote, setAppliedNote] = useState("");
  const pickRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  // session: đổi khi tải ảnh mới (huỷ mọi việc cũ); imageRun: đổi khi bấm tạo ảnh lần nữa.
  const session = useRef(0);
  const imageRun = useRef(0);
  const mainRef = useRef<HTMLElement>(null);
  const logo = useLogoEditor();
  const price = usePriceTab();
  const card = useCardEditor();
  const voucher = useVoucherEditor();
  const flyer = useFlyerTab();
  const stamp = useStampEditor();
  const caption = useCaptionEditor();

  // Cập nhật đồng hồ đếm thời gian cho các video đang tạo.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const styleOptions: Preset[] = note.trim() ? [CUSTOM_STYLE, ...IMAGE_STYLES] : IMAGE_STYLES;
  const styleSel = pickedStyles.filter((id) => styleOptions.some((s) => s.id === id)).slice(0, imageCount);
  const plannedJobs = planJobs(styleSel, imageCount, note.trim());
  const motionOptions: Preset[] = videoNote.trim() ? [CUSTOM_MOTION, ...VIDEO_MOTIONS] : VIDEO_MOTIONS;
  const motionSel = pickedMotions.filter((id) => motionOptions.some((m) => m.id === id)).slice(0, videoCount);
  const plannedVideos = planJobs(motionSel, videoCount, videoNote.trim(), VIDEO_MOTIONS);
  const doneImages = imageOrder.flatMap((id) => {
    const job = images[id];
    return job?.status === "done" ? [{ ...jobPreset(id), url: job.url }] : [];
  });
  const sourceUrl = doneImages.find((s) => s.id === source)?.url ?? original!;
  const imagesBusy = imageOrder.some((id) => images[id]?.status === "loading");
  const videosDone = Object.values(videos).filter((j) => j.status === "done").length;
  const videoBusy = Object.values(videos).some((j) => j.status === "loading");

  async function runEnhance(
    image: string,
    styleId: string,
    run: number,
    withNote: string,
    formatId: string,
    model: string,
  ) {
    setImages((s) => ({ ...s, [styleId]: { status: "loading", startedAt: Date.now() } }));
    try {
      const data = await postJson("/api/enhance", {
        image,
        styleId: styleOf(styleId),
        note: withNote,
        ratio: formatOf(formatId, IMAGE_FORMATS).ratio,
        model,
      });
      if (data.quota && user) setQuota(data.quota);
      if (data.trial) setTrial(data.trial);
      if (data.historyId) setHistoryRev((r) => r + 1);
      if (run !== imageRun.current) return;
      setDemo(data.demo);
      setImages((s) => ({ ...s, [styleId]: { status: "done", url: data.image } }));
      setUsedModels((u) => ({ ...u, [styleId]: data.model }));
    } catch (e) {
      onApiError(e);
      if (run !== imageRun.current) return;
      setImages((s) => ({ ...s, [styleId]: { status: "error", error: errMsg(e) } }));
    }
  }

  async function runVideo(jobId: string, formatId: string, model: string) {
    const sid = session.current;
    setVideoFormats((f) => ({ ...f, [jobId]: formatId }));
    setVideoModels((m) => ({ ...m, [jobId]: model }));
    const set = (job: Job) => sid === session.current && setVideos((s) => ({ ...s, [jobId]: job }));
    set({ status: "loading", startedAt: Date.now() });
    try {
      const { op, quota: q, trial: t } = await postJson("/api/video", {
        image: sourceUrl,
        motionId: styleOf(jobId),
        note: videoNote.trim(),
        ratio: formatOf(formatId, VIDEO_FORMATS).ratio,
        crop: formatOf(formatId, VIDEO_FORMATS).crop,
        model,
      });
      if (q && user) setQuota(q);
      if (t) setTrial(t);
      while (sid === session.current) {
        await new Promise((r) => setTimeout(r, POLL_MS));
        const res = await fetch(`/api/video?op=${encodeURIComponent(op)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        if (data.done) {
          const crop = formatOf(formatId, VIDEO_FORMATS).crop;
          return set({ status: "done", url: crop ? `${data.url}&crop=${encodeURIComponent(crop)}` : data.url });
        }
      }
    } catch (e) {
      onApiError(e);
      set({ status: "error", error: errMsg(e) });
    }
  }

  async function handleFile(file?: File) {
    if (!file || !file.type.startsWith("image/")) return;
    session.current++;
    imageRun.current++;
    const url = await fileToDataUrl(file);
    setOriginal(url);
    setImages({});
    setVideos({});
    setImageOrder([]);
    setVideoOrder([]);
    setSource("original");
    // Đang ở tab Video thì ở lại để tạo video luôn; các tab khác về tab Ảnh.
    setTab((t) => (t === "videos" ? "videos" : "photos"));
    mainRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Gõ mô tả lần đầu → tự chọn "Theo yêu cầu" để mô tả được dùng ngay.
  function changeNote(v: string) {
    if (!note.trim() && v.trim()) {
      setPickedStyles((p) => [CUSTOM_STYLE.id, ...p.filter((x) => x !== CUSTOM_STYLE.id)]);
    }
    setNote(v);
  }

  function changeCount(c: number) {
    setImageCount(c);
    setPickedStyles((p) => p.slice(0, c));
  }

  // Bấm "Tạo ảnh": tạo đúng imageCount ảnh theo kế hoạch plannedJobs.
  function generateImages() {
    if (!original || !plannedJobs.length) return;
    if (trialOut) return askAccount();
    const run = ++imageRun.current;
    const n = note.trim();
    const f = imageFormat;
    setAppliedNote(n);
    setAppliedFormat(f);
    const m = imageModel;
    setAppliedImageModel(m);
    setImageOrder(plannedJobs);
    setImages({});
    setSource("original");
    // Gửi lần lượt từng ảnh một cách nhau một chút để không vượt hạn mức theo phút.
    plannedJobs.forEach((id, i) =>
      setTimeout(() => run === imageRun.current && runEnhance(original, id, run, n, f, m), i * 1500),
    );
  }

  // Gõ mô tả video lần đầu → tự chọn "Theo mô tả".
  function changeVideoNote(v: string) {
    if (!videoNote.trim() && v.trim()) {
      setPickedMotions([CUSTOM_MOTION.id]);
    }
    setVideoNote(v);
  }

  // Bấm "Tạo video": các video bắt đầu cách nhau vài giây vì mỗi video cần 1 lần xử lý ảnh trước.
  function changeVideoCount(c: number) {
    setVideoCount(c);
    setPickedMotions((p) => p.slice(0, c));
  }

  function generateVideos() {
    const list = plannedVideos.filter((id) => videos[id]?.status !== "loading");
    if (!list.length) return;
    if (trialOut) return askAccount();
    setVideoOrder((o) => [...list, ...o.filter((id) => !list.includes(id))]);
    list.forEach((id, i) => setTimeout(() => runVideo(id, videoFormat, videoModel), i * 4000));
  }

  const pickers = (
    <>
      <input ref={pickRef} type="file" accept="image/*" hidden onChange={(e) => handleFile(e.target.files?.[0])} />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </>
  );

  const onPick = () => pickRef.current?.click();
  const selectTab = (t: Tab) => {
    setTab(t);
    setMenuOpen(false);
    mainRef.current?.scrollTo({ top: 0 });
  };
  const onCamera = () => cameraRef.current?.click();
  const isPhotos = tab === "photos";
  const isLogo = tab === "logo";
  const isPrice = tab === "price";
  const isCard = tab === "card";
  const isVoucher = tab === "voucher";
  const isFlyer = tab === "flyer";
  const isStamp = tab === "stamp";
  const isCaption = tab === "caption";
  // Các công cụ riêng (thiết kế, caption) không dùng ảnh móng chung hay thanh tab Ảnh | Video.
  const isDesign = isLogo || isPrice || isCard || isVoucher || isFlyer || isStamp || isCaption;
  // Mở tab Viết caption với 1 ảnh có sẵn (ảnh AI vừa tạo).
  const captionFor = (image: string) => {
    caption.setImage(image);
    selectTab("caption");
  };
  const plan = isPhotos
    ? plannedJobs.map((id) => jobPreset(id).label)
    : plannedVideos.map((id) => motionPreset(id).label);
  const planFormat = isPhotos ? formatOf(imageFormat, IMAGE_FORMATS) : formatOf(videoFormat, VIDEO_FORMATS);
  const planModel = isPhotos ? modelOf(imageModel, IMAGE_MODEL_OPTIONS) : modelOf(videoModel, VIDEO_MODEL_OPTIONS);
  const preview = isPhotos ? original : sourceUrl;
  return (
    <div className="app-bg">
      {pickers}

      {/* Khung app: header – body – footer dùng chung một nền, một bề rộng */}
      {/* Điện thoại: khung một cột. Máy tính: menu cố định bên trái + nội dung toàn màn hình. */}
      <div className="app-shell relative flex h-dvh w-full overflow-clip">
        <DesktopNav tab={tab} user={user} quota={quota} trial={trial} footer={footer} busy={{ photos: imagesBusy, videos: videoBusy }} onSelect={selectTab} />
        <div className="relative flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="z-20 flex shrink-0 items-center justify-between border-b border-line/70 bg-ivory/80 px-5 pb-3 pt-[max(0.85rem,env(safe-area-inset-top))] backdrop-blur-xl lg:px-10 lg:py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Mở menu"
              aria-expanded={menuOpen}
              className="grid h-9 w-9 place-items-center rounded-full border border-line bg-cream active:scale-95 lg:hidden"
            >
              <IconMenu />
            </button>
            <div className="flex items-baseline gap-2 lg:hidden">
              <span className="font-serif text-[26px] italic leading-none tracking-tight">Salonly</span>
              <span className="rounded-full border border-gold/40 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.22em] text-gold">
                AI Studio
              </span>
            </div>
            <h1 className="hidden font-serif text-[26px] leading-none lg:block">{MENU_TOOLS.find((m) => m.tab === tab)?.title}</h1>
          </div>
          {!isDesign ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setHistoryOpen(true)}
                className="flex items-center gap-1.5 rounded-full border border-line bg-cream px-3 py-1.5 text-xs font-medium active:scale-95"
              >
                <IconHistory /> Lịch sử
              </button>
              {original && (
                <button
                  onClick={onPick}
                  className="flex items-center gap-1.5 rounded-full border border-line bg-cream px-3 py-1.5 text-xs font-medium active:scale-95"
                >
                  <IconSwap /> Đổi ảnh
                </button>
              )}
            </div>
          ) : (
            <span className="text-[11px] text-taupe lg:hidden">{isLogo ? "Thiết kế logo" : isPrice ? "Bảng giá dịch vụ" : isCard ? "Thẻ tích điểm" : isVoucher ? "Voucher quà tặng" : isFlyer ? "Tờ rơi quảng cáo" : isStamp ? "Con dấu tích điểm" : isCaption ? "Viết caption" : "Ảnh & video"}</span>
          )}
        </header>

        {/* Body */}
        <main ref={mainRef} className="no-scrollbar flex-1 overflow-y-auto overscroll-contain px-5 pb-6 pt-5 lg:px-10 lg:py-8">
          <div className="mx-auto w-full max-w-2xl lg:max-w-6xl">
          {isLogo ? (
            <LogoStudio editor={logo} />
          ) : isPrice ? (
            <PriceTabStudio tab={price} />
          ) : isCard ? (
            <CardStudio editor={card} />
          ) : isVoucher ? (
            <VoucherStudio editor={voucher} />
          ) : isFlyer ? (
            <FlyerTabStudio tab={flyer} />
          ) : isStamp ? (
            <StampStudio editor={stamp} />
          ) : isCaption ? (
            <CaptionStudio editor={caption} />
          ) : !original ? (
            <div className="mx-auto max-w-xl">
              <Landing isPhotos={isPhotos} note={isPhotos ? note : videoNote} onNote={isPhotos ? changeNote : changeVideoNote} onPick={onPick} onDrop={handleFile} />
            </div>
          ) : (
            <div className="space-y-4 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start lg:gap-8 lg:space-y-0">
              <div className="space-y-4 lg:sticky lg:top-0">
              {demo && (
                <p className="rounded-2xl bg-gold/10 px-4 py-2.5 text-xs leading-relaxed text-ink/80">
                  <b>Chế độ demo</b> · cấu hình Google AI để tạo ảnh & video thật.
                </p>
              )}

              {/* Ảnh xem trước: tab Ảnh = ảnh gốc, tab Video = ảnh nguồn video */}
              <div className="fade-up relative overflow-hidden rounded-3xl shadow-[0_18px_36px_-24px_rgb(23_22_26/0.55)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview!} alt="Ảnh xem trước" className="aspect-[16/11] w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/60 to-transparent p-4 pt-14 text-white">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/70">
                      {isPhotos ? "Ảnh gốc" : "Ảnh nguồn video"}
                    </p>
                    <p className="font-serif text-xl leading-tight">
                      {isPhotos ? "Bộ sưu tập của bạn" : doneImages.find((s) => s.id === source)?.label ?? "Ảnh gốc"}
                    </p>
                  </div>
                  {isPhotos && imageOrder.length > 0 && <Progress done={doneImages.length} total={imageOrder.length} />}
                </div>
              </div>
              </div>

              {isPhotos ? (
                <section className="fade-up space-y-4" key="photos">
                  <Panel>
                    <NoteInput value={note} onChange={changeNote} />
                    <CountPicker value={imageCount} max={MAX_IMAGES} unit="ảnh" onChange={changeCount} />
                    <ModelPicker options={IMAGE_MODEL_OPTIONS} value={imageModel} onChange={setImageModel} />
                    <ChoicePicker
                      title="Chọn phong cách"
                      optional
                      max={imageCount}
                      options={styleOptions}
                      value={styleSel}
                      onChange={setPickedStyles}
                    />
                    <FormatPicker options={IMAGE_FORMATS} value={imageFormat} onChange={setImageFormat} />
                  </Panel>

                  {imageOrder.length > 0 && (
                    <div>
                      <SectionHead
                        eyebrow="Kết quả"
                        title="Ảnh đã chỉnh"
                        note={appliedNote ? `Theo mô tả: “${appliedNote}”` : "Giữ nguyên mẫu móng · đổi ánh sáng, bối cảnh"}
                      />
                      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                        {imageOrder.map((id, i) => {
                          const s = jobPreset(id);
                          return (
                            <Tile
                              key={id}
                              index={i}
                              aspect={formatOf(appliedFormat, IMAGE_FORMATS).css}
                              label={s.label}
                              hint={
                                usedModels[id] && usedModels[id] !== appliedImageModel && IMAGE_MODEL_OPTIONS.some((o) => o.id === usedModels[id])
                                  ? `Đã dùng ${modelOf(usedModels[id], IMAGE_MODEL_OPTIONS).label} vì model đã chọn đang bận`
                                  : s.hint
                              }
                              badge={source === id ? "Nguồn video" : undefined}
                              job={images[id] ?? { status: "loading", startedAt: now }}
                              onOpen={(url) => setViewer({ kind: "image", url, name: `naile-${id}.png`, styleId: id })}
                              onRetry={() => runEnhance(original, id, imageRun.current, appliedNote, appliedFormat, appliedImageModel)}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}
                </section>
              ) : (
                <section className="fade-up space-y-4" key="videos">
                  <Panel>
                    <p className="px-1 text-xs font-semibold">Ảnh nguồn</p>
                    <div className="no-scrollbar -mx-4 mt-2 flex gap-3 overflow-x-auto px-4 pb-1">
                      {[{ id: "original", label: "Ảnh gốc", url: original }, ...doneImages].map((s) => (
                        <button key={s.id} onClick={() => setSource(s.id)} className="shrink-0 text-center active:scale-95">
                          <span
                            className={`block overflow-hidden rounded-2xl p-0.5 transition ${
                              source === s.id ? "bg-gradient-to-br from-gold to-rosegold" : "bg-transparent"
                            }`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={s.url} alt="" className="h-14 w-14 rounded-[14px] border-2 border-cream object-cover" />
                          </span>
                          <span className={`mt-1 block w-[60px] truncate text-[11px] ${source === s.id ? "font-semibold" : "text-taupe"}`}>
                            {s.label}
                          </span>
                        </button>
                      ))}
                    </div>
                    <div className="mt-4">
                      <NoteInput
                        id="video-note"
                        label="Mô tả video bạn muốn"
                        placeholder="VD: tay cầm ly trà sữa, cánh hoa rơi nhẹ…"
                        suggestions={VIDEO_NOTE_SUGGESTIONS}
                        value={videoNote}
                        onChange={changeVideoNote}
                      />
                    </div>
                    <CountPicker value={videoCount} max={MAX_VIDEOS} unit="video" onChange={changeVideoCount} />
                    <ModelPicker options={VIDEO_MODEL_OPTIONS} value={videoModel} onChange={setVideoModel} />
                    <ChoicePicker
                      title="Chọn kiểu chuyển động"
                      optional
                      max={videoCount}
                      options={motionOptions}
                      value={motionSel}
                      onChange={setPickedMotions}
                    />
                    <FormatPicker options={VIDEO_FORMATS} value={videoFormat} onChange={setVideoFormat} />
                  </Panel>

                  {videoOrder.length > 0 && (
                    <div>
                      <SectionHead eyebrow="Kết quả" title="Video đã tạo" note="Chạm để xem toàn màn hình, lưu hoặc chia sẻ" />
                      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                        {videoOrder.map((id, i) => {
                          const m = motionPreset(id);
                          return (
                            <Tile
                              key={id}
                              index={i}
                              kind="video"
                              aspect={formatOf(videoFormats[id] ?? DEFAULT_VIDEO_FORMAT, VIDEO_FORMATS).css}
                              label={m.label}
                              hint={m.hint}
                              job={videos[id] ?? { status: "loading", startedAt: now }}
                              now={now}
                              onOpen={(url) => setViewer({ kind: "video", url, name: `naile-${id}.mp4` })}
                              onRetry={() => runVideo(id, videoFormats[id] ?? DEFAULT_VIDEO_FORMAT, videoModels[id] ?? DEFAULT_VIDEO_MODEL)}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}
                </section>
              )}
            </div>
          )}
          </div>
        </main>

        {/* Footer: nút hành động chính + thanh tab */}
        <footer className="z-20 shrink-0 border-t border-line/70 bg-ivory/85 px-4 pb-safe pt-3 backdrop-blur-xl lg:px-10">
          <div className="mx-auto w-full max-w-2xl lg:max-w-6xl">
          {isLogo ? (
            <LogoFooter editor={logo} />
          ) : isPrice ? (
            <PriceTabFooter tab={price} />
          ) : isCard ? (
            <CardFooter editor={card} />
          ) : isVoucher ? (
            <VoucherFooter editor={voucher} />
          ) : isFlyer ? (
            <FlyerTabFooter tab={flyer} />
          ) : isStamp ? (
            <StampFooter editor={stamp} />
          ) : isCaption ? (
            <CaptionFooter editor={caption} />
          ) : !original ? (
            <div className="grid grid-cols-[auto_1fr] gap-2.5">
              <button
                onClick={onCamera}
                aria-label="Chụp ảnh mới"
                className="grid h-[52px] w-[52px] place-items-center rounded-full border border-line bg-cream active:scale-95"
              >
                <IconCamera />
              </button>
              <button
                onClick={onPick}
                className="gold-btn flex h-[52px] items-center justify-center gap-2 rounded-full text-sm font-medium text-cream active:scale-[0.98]"
              >
                <IconPhoto /> Chọn ảnh móng để bắt đầu
              </button>
            </div>
          ) : (
            <div className="lg:flex lg:items-center lg:gap-6">
              <p className="truncate px-1 text-[11px] text-taupe lg:min-w-0 lg:flex-1 lg:text-[12px]">
                Sẽ tạo · {planModel.label}{isPhotos ? "" : " · 8 giây"} · {planFormat.ratio ? `${planFormat.label} ${planFormat.crop ?? planFormat.ratio}` : "khung gốc"}:{" "}
                <b className="font-semibold text-ink">{plan.join(" · ")}</b>
              </p>
              <div className="lg:w-[440px] lg:shrink-0 lg:[&>button]:mt-0">
              <ActionButton
                onClick={isPhotos ? generateImages : generateVideos}
                disabled={isPhotos ? !plannedJobs.length || imagesBusy : !plannedVideos.length}
                busy={isPhotos ? imagesBusy : videoBusy}
                label={
                  isPhotos
                    ? `${imageOrder.length ? "Tạo lại" : "Tạo"} ${plannedJobs.length} ảnh`
                    : `Tạo ${plannedVideos.length} video`
                }
              />
              </div>
            </div>
          )}
          {!isDesign && (
          <nav className="mt-2.5 flex gap-1 rounded-full bg-line/50 p-1 lg:hidden">
            <TabButton
              active={isPhotos}
              onClick={() => setTab("photos")}
              icon={<IconPhoto />}
              label="Ảnh"
              count={doneImages.length}
              pulse={imagesBusy}
            />
            <TabButton
              active={tab === "videos"}
              onClick={() => setTab("videos")}
              icon={<IconFilm />}
              label="Video"
              count={videosDone}
              pulse={videoBusy}
            />
          </nav>
          )}
          </div>
        </footer>
        </div>

        <SideMenu
          open={menuOpen}
          tab={tab}
          user={user}
          quota={quota}
          trial={trial}
          footer={footer}
          busy={{ photos: imagesBusy, videos: videoBusy }}
          onClose={() => setMenuOpen(false)}
          onSelect={selectTab}
        />
      </div>

      {needAccount && <AccountPrompt message={needAccount} onClose={() => setNeedAccount(null)} />}

      {historyOpen && (
        <HistorySheet
          rev={historyRev}
          guest={!user}
          onClose={() => setHistoryOpen(false)}
          onOpen={(id) => setViewer({ kind: "image", url: `/api/history/${id}`, name: `salonly-${id}.png`, historyId: id })}
        />
      )}

      {viewer && (
        <Lightbox
          viewer={viewer}
          isSource={viewer.styleId === source}
          onClose={() => setViewer(null)}
          onUseForVideo={async () => {
            if (viewer.historyId) {
              // Ảnh trong lịch sử: dùng làm ảnh gốc rồi sang tab Video.
              const blob = await fetch(viewer.url).then((r) => r.blob());
              setViewer(null);
              setHistoryOpen(false);
              await handleFile(new File([blob], viewer.name, { type: blob.type }));
              setTab("videos");
              return;
            }
            setSource(viewer.styleId!);
            setViewer(null);
            setTab("videos");
          }}
          onCaption={async () => {
            const image = viewer.historyId ? await urlToDataUrl(viewer.url) : viewer.url;
            setViewer(null);
            setHistoryOpen(false);
            captionFor(image);
          }}
          onDelete={
            viewer.historyId
              ? async () => {
                  if (!confirm("Xoá ảnh này khỏi lịch sử?")) return;
                  await fetch(`/api/history/${viewer.historyId}`, { method: "DELETE" });
                  setViewer(null);
                  setHistoryRev((r) => r + 1);
                }
              : undefined
          }
        />
      )}
    </div>
  );
}

// Thẻ nội dung dùng chung trong phần thân.
function Panel({ children }: { children: React.ReactNode }) {
  return <div className="rounded-3xl border border-line bg-cream p-4 shadow-[0_1px_0_rgb(255_255_255/0.8)_inset]">{children}</div>;
}

/* ---------- Màn hình chào ---------- */

function Landing({
  isPhotos,
  note,
  onNote,
  onPick,
  onDrop,
}: {
  isPhotos: boolean;
  note: string;
  onNote: (v: string) => void;
  onPick: () => void;
  onDrop: (f?: File) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const kind = isPhotos ? "ảnh" : "video";
  return (
    <div className="fade-up space-y-5">
      <div className="pt-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold">Nail photo & video · AI</p>
        <h1 className="mt-3 font-serif text-[38px] leading-[1.08] tracking-tight">
          Hãy tạo <span className="gold-text italic">{kind}</span> ngay
          <span className="mt-2 block text-[22px] leading-snug">
            để có những {kind} đẹp đăng lên Instagram, TikTok, kéo theo nhiều khách hàng về tiệm của mình
          </span>
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-taupe">
          {isPhotos
            ? "Tạo ảnh chuẩn như studio, hãy mô tả những thay đổi mà bạn cần có ở ảnh."
            : "Tạo ảnh thành video chuẩn như studio, hãy mô tả các chuyển động mà bạn cần có ở video."}
        </p>
      </div>

      {/* Vùng thả ảnh (bấm cũng mở thư viện) */}
      <button
        type="button"
        onClick={onPick}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          onDrop(e.dataTransfer.files[0]);
        }}
        className={`drop-zone flex w-full items-center gap-4 rounded-3xl border-2 border-dashed p-4 text-left transition active:scale-[0.99] ${
          dragging ? "border-gold bg-gold/10" : "border-line bg-cream"
        }`}
      >
        <span className="relative grid h-16 w-16 shrink-0 place-items-center">
          <span className="absolute inset-0 rotate-6 rounded-[20px] bg-gradient-to-br from-[#f1ece4] to-[#e4d9c9]" />
          <span className="absolute inset-0 -rotate-6 rounded-[20px] border border-gold/30 bg-cream/80" />
          <IconSparkle className="relative h-7 w-7 text-gold" />
        </span>
        <span>
          <span className="block font-serif text-lg leading-tight">Bắt đầu với một ảnh</span>
          <span className="mt-1 block text-xs text-taupe">Chạm hoặc kéo thả · ảnh rõ nét, thấy đủ các móng</span>
        </span>
      </button>

      <Panel>
        {isPhotos ? (
          <NoteInput value={note} onChange={onNote} />
        ) : (
          <NoteInput
            id="video-note"
            label="Mô tả video bạn muốn"
            placeholder="VD: tay cầm ly trà sữa, cánh hoa rơi nhẹ…"
            suggestions={VIDEO_NOTE_SUGGESTIONS}
            value={note}
            onChange={onNote}
          />
        )}
      </Panel>

      <ul className="grid grid-cols-3 gap-2 text-center">
        {[
          ["4", "phong cách ảnh"],
          ["4", "kiểu video"],
          ["100%", "giữ mẫu móng"],
        ].map(([n, t]) => (
          <li key={t} className="rounded-2xl border border-line bg-cream px-2 py-3">
            <p className="font-serif text-2xl">{n}</p>
            <p className="text-[11px] text-taupe">{t}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

const formatOf = (id: string, list: Format[]) => list.find((f) => f.id === id) ?? list[0];
const modelOf = (id: string, list: ModelOption[]) => list.find((m) => m.id === id) ?? list[0];

// Chọn model AI (không hiện giá cho khách).
function ModelPicker({
  options,
  value,
  onChange,
}: {
  options: ModelOption[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="mt-4">
      <div className="flex items-baseline justify-between px-1">
        <span className="text-xs font-semibold">Model AI</span>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {options.map((o) => {
          const on = o.id === value;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onChange(o.id)}
              aria-pressed={on}
              className={`flex flex-col rounded-2xl border px-2.5 py-2.5 text-left transition active:scale-[0.98] ${
                on ? "border-gold bg-gold/10 shadow-[inset_0_0_0_1px_var(--color-gold)]" : "border-line bg-white/70"
              }`}
            >
              <span className="text-[13px] font-semibold leading-tight">{o.label}</span>
              <span className="mt-0.5 text-[10.5px] leading-snug text-taupe">{o.hint}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Chọn kích thước đăng; mỗi lựa chọn có hình chữ nhật minh hoạ đúng tỉ lệ.
function FormatPicker({ options, value, onChange }: { options: Format[]; value: string; onChange: (id: string) => void }) {
  return (
    <div className="mt-4">
      <div className="flex items-baseline justify-between px-1">
        <span className="text-xs font-semibold">Kích thước đăng</span>
        <span className="text-[10px] text-taupe">Theo tỉ lệ chuẩn từng nền tảng</span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {options.map((f) => {
          const on = f.id === value;
          const [w, h] = (f.crop ?? f.ratio ?? "4:5").split(":").map(Number);
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => onChange(f.id)}
              aria-pressed={on}
              className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition active:scale-[0.98] ${
                on ? "border-gold bg-gold/10 shadow-[inset_0_0_0_1px_var(--color-gold)]" : "border-line bg-white/70"
              }`}
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center">
                <span
                  className={`block rounded-[3px] border-[1.5px] ${on ? "border-gold bg-gold/20" : "border-taupe/60"} ${
                    f.ratio ? "" : "border-dashed"
                  }`}
                  style={w >= h ? { width: 28, height: (28 * h) / w } : { height: 28, width: (28 * w) / h }}
                />
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold leading-tight">{f.label}</span>
                <span className="mt-0.5 block text-[11px] text-taupe">{f.hint}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Mỗi ảnh / video là một "job"; cùng kiểu tạo 2 lần thì job thứ hai có đuôi "~2".
const ALL_STYLES = [CUSTOM_STYLE, ...IMAGE_STYLES];
const ALL_MOTIONS = [CUSTOM_MOTION, ...VIDEO_MOTIONS];
const styleOf = (jobId: string) => jobId.split("~")[0];
function presetOf(jobId: string, all: Preset[]): Preset {
  const s = all.find((x) => x.id === styleOf(jobId))!;
  const k = jobId.split("~")[1];
  return k ? { ...s, label: `${s.label} (${k})` } : s;
}
const jobPreset = (jobId: string) => presetOf(jobId, ALL_STYLES);
const motionPreset = (jobId: string) => presetOf(jobId, ALL_MOTIONS);

// Lấp đủ `count` job: ưu tiên kiểu đã chọn; còn thiếu thì có mô tả → thêm phiên bản
// "theo mô tả", không có mô tả → thêm kiểu có sẵn chưa chọn.
function planJobs(picked: string[], count: number, note: string, presets: Preset[] = IMAGE_STYLES): string[] {
  const ids = picked.slice(0, count);
  const fallback = presets.map((s) => s.id).filter((id) => !ids.includes(id));
  while (ids.length < count) ids.push(note ? CUSTOM_STYLE.id : fallback.shift()!);
  const seen: Record<string, number> = {};
  return ids.map((id) => {
    seen[id] = (seen[id] ?? 0) + 1;
    return seen[id] > 1 ? `${id}~${seen[id]}` : id;
  });
}

function CountPicker({
  value,
  max,
  unit,
  onChange,
}: {
  value: number;
  max: number;
  unit: string;
  onChange: (n: number) => void;
}) {
  return (
    <div className="mt-4 flex items-center justify-between gap-3 px-1">
      <span className="text-xs font-semibold">Số {unit} tạo</span>
      <div className="flex rounded-full border border-line bg-white/70 p-1">
        {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-pressed={value === n}
            className={`min-w-16 rounded-full px-4 py-1.5 text-sm font-medium transition active:scale-95 ${
              value === n ? "gold-btn text-cream" : "text-taupe"
            }`}
          >
            {n} {unit}
          </button>
        ))}
      </div>
    </div>
  );
}

// Chọn tối đa `max` mục; chọn thêm khi đã đủ thì bỏ mục chọn sớm nhất.
function ChoicePicker({
  title,
  optional,
  max,
  options,
  value,
  onChange,
}: {
  title: string;
  optional?: boolean;
  max: number;
  options: Preset[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id].slice(-max));
  return (
    <div className="mt-4">
      <div className="flex items-baseline justify-between px-1">
        <span className="text-xs font-semibold">{title}</span>
        <span className="text-[10px] text-taupe">
          {optional && "Không bắt buộc · "}Đã chọn {value.length}/{max}
        </span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {options.map((o) => {
          const on = value.includes(o.id);
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => toggle(o.id)}
              aria-pressed={on}
              className={`relative rounded-2xl border px-3 py-2.5 text-left transition active:scale-[0.98] ${
                on ? "border-gold bg-gold/10 shadow-[inset_0_0_0_1px_var(--color-gold)]" : "border-line bg-white/70"
              }`}
            >
              <span className="block pr-5 text-[13px] font-semibold leading-tight">{o.label}</span>
              <span className="mt-0.5 block text-[11px] leading-snug text-taupe">{o.hint}</span>
              <span
                className={`absolute right-2.5 top-2.5 grid h-4 w-4 place-items-center rounded-full border text-[10px] ${
                  on ? "border-gold bg-gold text-cream" : "border-line"
                }`}
              >
                {on && "✓"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ActionButton({
  onClick,
  disabled,
  busy,
  label,
}: {
  onClick: () => void;
  disabled: boolean;
  busy: boolean;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="gold-btn mt-2 flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-medium text-cream transition active:scale-[0.98] disabled:opacity-40"
    >
      {busy ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-cream/40 border-t-cream" />
      ) : (
        <IconSparkle className="h-4 w-4" />
      )}
      {label}
    </button>
  );
}

/* ---------- Thành phần ---------- */

function NoteInput({
  value,
  onChange,
  id = "note",
  label = "Mô tả thay đổi bạn muốn",
  placeholder = "VD: đổi nền xanh mint, thêm hoa cúc trắng, móng màu đỏ rượu…",
  suggestions = NOTE_SUGGESTIONS,
}: {
  value: string;
  onChange: (v: string) => void;
  id?: string;
  label?: string;
  placeholder?: string;
  suggestions?: string[];
}) {
  const add = (s: string) => {
    const cur = value.trim();
    if (cur.toLowerCase().includes(s.toLowerCase())) return;
    onChange((cur ? `${cur}, ${s.charAt(0).toLowerCase()}${s.slice(1)}` : s).slice(0, NOTE_MAX));
  };
  return (
    <div>
      <label htmlFor={id} className="flex items-baseline justify-between px-1">
        <span className="text-xs font-semibold">{label}</span>
        <span className="text-[10px] text-taupe">Không bắt buộc</span>
      </label>
      <div className="relative mt-2">
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, NOTE_MAX))}
          rows={2}
          placeholder={placeholder}
          className="block w-full resize-none rounded-2xl border border-line bg-white/80 px-4 py-3 pr-9 text-[15px] leading-snug outline-none placeholder:text-taupe/70 focus:border-gold focus:ring-2 focus:ring-gold/20"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Xoá mô tả"
            className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full text-taupe active:scale-90"
          >
            <IconClose />
          </button>
        )}
      </div>
      {/* Gợi ý tự xuống dòng để luôn thấy đủ, không bị cắt ở mép. */}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => add(s)}
            className="rounded-full border border-line bg-white/70 px-2.5 py-1.5 text-[12px] text-ink/80 active:scale-95"
          >
            + {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function SectionHead({ eyebrow, title, note }: { eyebrow: string; title: string; note: string }) {
  return (
    <div className="mb-4 mt-8">
      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold">{eyebrow}</p>
      <h2 className="mt-1 font-serif text-[26px] leading-tight">{title}</h2>
      <p className="mt-1 text-xs text-taupe">{note}</p>
    </div>
  );
}

function Progress({ done, total }: { done: number; total: number }) {
  const r = 16;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid h-11 w-11 place-items-center">
      <svg viewBox="0 0 40 40" className="absolute inset-0 -rotate-90">
        <circle cx="20" cy="20" r={r} fill="none" stroke="rgb(255 255 255 / 0.25)" strokeWidth="3" />
        <circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          stroke="#e9cfb4"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - done / total)}
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <span className="text-[11px] font-semibold">
        {done}/{total}
      </span>
    </div>
  );
}

function Tile({
  job,
  kind = "image",
  aspect,
  label,
  hint,
  badge,
  index,
  className = "",
  now = 0,
  poster,
  onOpen,
  onRetry,
  onStart,
}: {
  job: Job;
  kind?: "image" | "video";
  aspect: string;
  label: string;
  hint: string;
  badge?: string;
  index: number;
  className?: string;
  now?: number;
  poster?: string;
  onOpen: (url: string) => void;
  onRetry: () => void;
  onStart?: () => void;
}) {
  return (
    <div className={`fade-up ${className}`} style={{ animationDelay: `${index * 60}ms` }}>
      <div className={`relative ${aspect} overflow-hidden rounded-3xl bg-line/60 shadow-[0_14px_28px_-20px_rgb(23_22_26/0.6)]`}>
        {job.status === "done" &&
          (kind === "image" ? (
            <button onClick={() => onOpen(job.url)} className="block h-full w-full active:scale-[0.98]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={job.url} alt={label} className="h-full w-full object-cover" />
            </button>
          ) : (
            <button onClick={() => onOpen(job.url)} className="block h-full w-full">
              <video src={job.url} className="h-full w-full object-cover" autoPlay loop muted playsInline />
            </button>
          ))}

        {job.status === "loading" && (
          <div className="shimmer absolute inset-0 flex flex-col items-center justify-center gap-2 text-[11px] font-medium text-taupe">
            <IconSparkle className="h-6 w-6 animate-pulse text-gold" />
            {kind === "video" ? (
              <>
                <span>Đang dựng video</span>
                <span className="font-serif text-lg text-ink">{Math.max(0, Math.floor((now - job.startedAt) / 1000))}s</span>
              </>
            ) : (
              <span>Đang chỉnh ảnh…</span>
            )}
          </div>
        )}

        {job.status === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-cream p-4 text-center">
            <p className="line-clamp-4 text-[11px] leading-relaxed text-rosegold">{job.error}</p>
            <button onClick={onRetry} className="rounded-full border border-line bg-white px-4 py-1.5 text-xs font-medium active:scale-95">
              Thử lại
            </button>
          </div>
        )}

        {job.status === "idle" && onStart && (
          <button onClick={onStart} className="group absolute inset-0 active:scale-[0.98]">
            {poster && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={poster} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-70 blur-[2px]" />
            )}
            <span className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
            <span className="glass absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full shadow-lg">
              <IconPlay />
            </span>
            <span className="absolute inset-x-0 bottom-3 text-center text-xs font-medium text-cream">Chạm để tạo</span>
          </button>
        )}

        {badge && (
          <span className="glass absolute left-2.5 top-2.5 rounded-full px-2.5 py-1 text-[10px] font-semibold text-ink">
            ✦ {badge}
          </span>
        )}
      </div>
      <p className="mt-2 px-1 text-[13px] font-semibold leading-tight">{label}</p>
      <p className="px-1 text-[11px] leading-snug text-taupe">{hint}</p>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  count,
  pulse,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count: number;
  pulse?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`relative flex flex-1 items-center justify-center gap-2 rounded-full py-2 text-[13px] font-medium transition active:scale-95 ${
        active ? "bg-cream text-ink shadow-[0_1px_3px_rgb(23_22_26/0.15)]" : "text-taupe"
      }`}
    >
      {icon}
      {label}
      {count > 0 && <span className="rounded-full bg-gold/15 px-1.5 text-[10px] font-semibold text-gold">{count}</span>}
      {pulse && <span className="absolute right-5 top-2 h-2 w-2 animate-ping rounded-full bg-rosegold" />}
    </button>
  );
}

function Lightbox({
  viewer,
  isSource,
  onClose,
  onUseForVideo,
  onCaption,
  onDelete,
}: {
  viewer: Viewer;
  isSource: boolean;
  onClose: () => void;
  onUseForVideo: () => void;
  onCaption: () => void;
  onDelete?: () => void;
}) {
  useBackClose(true, onClose);
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="fade-up fixed inset-0 z-[60] flex flex-col bg-[#120d0a]">
      <div className="flex items-center justify-between gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <button onClick={onClose} className="flex h-10 items-center gap-1.5 rounded-full bg-white/15 pl-3 pr-4 text-[14px] font-medium text-white active:scale-95">
          <IconBack /> Quay lại
        </button>
        {onDelete && (
          <button onClick={onDelete} aria-label="Xoá khỏi lịch sử" className="grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white active:scale-95">
            <IconTrash />
          </button>
        )}
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center px-4 py-3">
        {viewer.kind === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={viewer.url} alt="" className="max-h-full max-w-full rounded-3xl object-contain" />
        ) : (
          <video src={viewer.url} className="max-h-full max-w-full rounded-3xl" autoPlay loop playsInline controls />
        )}
      </div>
      <div className="flex gap-2.5 px-5 pb-safe pt-2">
        <button
          onClick={() => shareOrDownload(viewer.url, viewer.name)}
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-cream py-3.5 text-sm font-semibold text-ink active:scale-[0.98]"
        >
          <IconShare /> Lưu / Chia sẻ
        </button>
        {viewer.kind === "image" && (viewer.styleId || viewer.historyId) && (
          <button
            onClick={onUseForVideo}
            className="flex flex-1 items-center justify-center gap-2 rounded-full border border-white/20 py-3.5 text-sm font-medium text-cream active:scale-[0.98]"
          >
            <IconFilm /> {isSource ? "Xem video" : "Làm video"}
          </button>
        )}
        {viewer.kind === "image" && (
          <button
            onClick={onCaption}
            className="flex flex-1 items-center justify-center gap-2 rounded-full border border-white/20 py-3.5 text-sm font-medium text-cream active:scale-[0.98]"
          >
            <IconPen /> Viết caption
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------- Icon ---------- */

const iconProps = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const IconPhoto = () => (
  <svg {...iconProps}>
    <rect x="3" y="3" width="18" height="18" rx="4" />
    <circle cx="9" cy="9" r="1.8" />
    <path d="m21 15-4.5-4.5L6 21" />
  </svg>
);
const IconFilm = () => (
  <svg {...iconProps}>
    <rect x="3" y="4" width="18" height="16" rx="3" />
    <path d="m10 9 5 3-5 3z" fill="currentColor" />
  </svg>
);
const IconPen = () => (
  <svg {...iconProps}>
    <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z" />
    <path d="m13.5 6.5 4 4" />
  </svg>
);
const IconCamera = () => (
  <svg {...iconProps}>
    <path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a1 1 0 0 1 1-1z" />
    <circle cx="12" cy="13" r="3.5" />
  </svg>
);
/* ---------- Menu trượt bên trái ---------- */

const MENU_TOOLS: { tab: Tab; title: string; desc: string; icon: () => React.ReactNode; badge?: string }[] = [
  { tab: "photos", title: "Ảnh AI", desc: "Chỉnh ảnh móng đẹp như studio", icon: () => <IconPhoto /> },
  { tab: "videos", title: "Video AI", desc: "Biến ảnh thành video chân thực", icon: () => <IconFilm /> },
  { tab: "caption", title: "Viết caption", desc: "Bài đăng + hashtag từ ảnh móng", icon: () => <IconPen />, badge: "Mới" },
  { tab: "logo", title: "Thiết kế logo", desc: `${LOGO_TEMPLATES.length} mẫu cho tiệm nail, tự sửa`, icon: () => <IconSparkle className="h-[18px] w-[18px]" />, badge: "Miễn phí" },
  { tab: "price", title: "Bảng giá dịch vụ", desc: `${MENU_TEMPLATES.length + PRICE_TEMPLATES.length} mẫu, menu 2 mặt in A4`, icon: () => <IconList />, badge: "Miễn phí" },
  { tab: "card", title: "Thẻ tích điểm", desc: `${CARD_TEMPLATES.length} mẫu, có ${CARD_TEMPLATES.filter((t) => t.isNew).length} mẫu mới · in 2 mặt`, icon: () => <IconCard />, badge: "Miễn phí" },
  { tab: "voucher", title: "Voucher quà tặng", desc: `${VOUCHER_TEMPLATES.length} mẫu phiếu quà tặng, in khổ DL`, icon: () => <IconGift />, badge: "Miễn phí" },
  { tab: "flyer", title: "Tờ rơi quảng cáo", desc: `${FLYER_TEMPLATES.length + PROMO_TEMPLATES.length} mẫu khai trương & giảm giá, in A4`, icon: () => <IconFlyer />, badge: "Miễn phí" },
  { tab: "stamp", title: "Con dấu tích điểm", desc: `${STAMP_TEMPLATES.length} mẫu dấu tròn 1 cm, gửi xưởng khắc`, icon: () => <IconStamp />, badge: "Mới" },
];

function SideMenu({
  open,
  tab,
  user,
  quota,
  trial,
  footer,
  busy,
  onClose,
  onSelect,
}: {
  open: boolean;
  tab: Tab;
  user: SessionUser | null;
  quota: QuotaSummary | null;
  trial: TrialInfo | null;
  footer: SiteFooter;
  busy: { photos: boolean; videos: boolean };
  onClose: () => void;
  onSelect: (t: Tab) => void;
}) {
  useBackClose(open, onClose);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div className={`absolute inset-0 z-40 lg:hidden ${open ? "" : "pointer-events-none"}`} inert={!open}>
      <div onClick={onClose} className={`absolute inset-0 bg-ink/30 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`} />
      <aside
        role="dialog"
        aria-label="Menu"
        className={`absolute inset-y-0 left-0 flex w-[84%] max-w-[330px] flex-col bg-ivory shadow-[20px_0_50px_-20px_rgb(23_22_26/0.45)] transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-line/70 px-5 pb-3 pt-[max(0.85rem,env(safe-area-inset-top))]">
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-[26px] italic leading-none tracking-tight">Salonly</span>
            <span className="rounded-full border border-gold/40 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.22em] text-gold">
              AI Studio
            </span>
          </div>
          <button onClick={onClose} aria-label="Đóng menu" className="grid h-9 w-9 place-items-center rounded-full border border-line bg-cream active:scale-95">
            <IconClose />
          </button>
        </div>

        <MenuList tab={tab} busy={busy} onSelect={onSelect} />

        <div className="border-t border-line/70 px-3 pb-safe pt-3">
          <AccountBox user={user} quota={quota} trial={trial} />
          <SiteCredit footer={footer} className="mt-3 px-1" />
        </div>
      </aside>
    </div>
  );
}

function MenuList({ tab, busy, onSelect }: { tab: Tab; busy: { photos: boolean; videos: boolean }; onSelect: (t: Tab) => void }) {
  return (
    <nav className="no-scrollbar flex-1 overflow-y-auto px-3 py-4">
      <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">Công cụ</p>
      <ul className="space-y-1">
        {MENU_TOOLS.map((m) => {
          const on = m.tab === tab;
          const working = (m.tab === "photos" || m.tab === "videos") && busy[m.tab];
          return (
            <li key={m.tab}>
              <button
                onClick={() => onSelect(m.tab)}
                aria-current={on ? "page" : undefined}
                className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition active:scale-[0.98] ${
                  on ? "border-gold/60 bg-cream shadow-[inset_0_0_0_1px_var(--color-gold)]" : "border-transparent"
                }`}
              >
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${on ? "gold-btn text-cream" : "bg-gold/10 text-gold"}`}>{m.icon()}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-[14px] font-semibold">
                    {m.title}
                    {m.badge && <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[9px] font-semibold text-gold">{m.badge}</span>}
                    {working && <span className="h-2 w-2 animate-ping rounded-full bg-rosegold" />}
                  </span>
                  <span className="block truncate text-[11.5px] text-taupe">{m.desc}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// Máy tính: menu công cụ luôn hiện bên trái.
function DesktopNav({ tab, user, quota, trial, footer, busy, onSelect }: { tab: Tab; user: SessionUser | null; quota: QuotaSummary | null; trial: TrialInfo | null; footer: SiteFooter; busy: { photos: boolean; videos: boolean }; onSelect: (t: Tab) => void }) {
  return (
    <aside className="hidden w-[280px] shrink-0 flex-col border-r border-line/70 bg-cream/60 lg:flex">
      <div className="flex items-baseline gap-2 border-b border-line/70 px-6 py-[1.35rem]">
        <span className="font-serif text-[28px] italic leading-none tracking-tight">Salonly</span>
        <span className="rounded-full border border-gold/40 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.22em] text-gold">AI Studio</span>
      </div>
      <MenuList tab={tab} busy={busy} onSelect={onSelect} />
      <div className="border-t border-line/70 px-3 py-3">
        <AccountBox user={user} quota={quota} trial={trial} />
        <SiteCredit footer={footer} className="mt-3 px-1" />
      </div>
    </aside>
  );
}

// Tài khoản thành viên đang đăng nhập: tên, lượt đã dùng trong tháng và nút đăng xuất.
function AccountBox({ user, quota, trial }: { user: SessionUser | null; quota: QuotaSummary | null; trial: TrialInfo | null }) {
  // Khách chưa đăng nhập: số lượt dùng thử còn lại + mời tạo tài khoản.
  if (!user || !quota)
    return (
      <div className="rounded-2xl bg-white/60 p-3">
        <p className="text-[13px] font-semibold">Bạn đang dùng không cần tài khoản</p>
        {trial && (
          <p className={`mt-1.5 rounded-xl px-2.5 py-1.5 text-[11.5px] ${trial.used >= trial.limit ? "bg-rosegold/10 text-rosegold" : "bg-gold/10 text-taupe"}`}>
            Còn <b className="text-ink">{Math.max(0, trial.limit - trial.used)}/{trial.limit}</b> lượt tạo ảnh, video miễn phí
          </p>
        )}
        <p className="mt-1.5 text-[11.5px] leading-snug text-taupe">Tạo tài khoản miễn phí để có lượt tạo riêng mỗi tháng.</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Link href="/login" className="flex h-9 items-center justify-center rounded-full border border-line bg-cream text-[12.5px] active:scale-95">
            Đăng nhập
          </Link>
          <Link href="/register" className="gold-btn flex h-9 items-center justify-center rounded-full text-[12.5px] font-medium text-cream active:scale-95">
            Tạo tài khoản
          </Link>
        </div>
      </div>
    );
  const q = (k: keyof QuotaSummary) => (quota[k].limit === null ? `${quota[k].used}` : `${quota[k].used}/${quota[k].limit}`);
  const out = (["image", "video"] as const).some((k) => quota[k].limit !== null && quota[k].used >= quota[k].limit!);
  return (
    <div className="rounded-2xl bg-white/60 p-3">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold/15 font-serif text-[17px] text-gold">{user.username[0]?.toUpperCase()}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-semibold">{user.username}</span>
          <span className="block truncate text-[11.5px] text-taupe">{user.email}</span>
        </span>
      </div>
      <p className={`mt-2.5 rounded-xl px-2.5 py-1.5 text-[11.5px] ${out ? "bg-rosegold/10 text-rosegold" : "bg-gold/10 text-taupe"}`}>
        Tháng này: <b className="text-ink">{q("image")}</b> ảnh · <b className="text-ink">{q("video")}</b> video
        {quota.image.limit === null && quota.video.limit === null ? " · không giới hạn" : ""}
      </p>
      <div className="mt-3">
        <form action={logout}>
          <button type="submit" className="h-9 w-full rounded-full border border-line bg-cream text-[12.5px] text-taupe active:scale-95">
            Đăng xuất
          </button>
        </form>
      </div>
    </div>
  );
}

const IconMenu = () => (
  <svg {...iconProps}>
    <path d="M4 7h16M4 12h10M4 17h16" />
  </svg>
);
const IconList = () => (
  <svg {...iconProps}>
    <rect x="4" y="3" width="16" height="18" rx="3" />
    <path d="M8 8h8M8 12h8M8 16h5" />
  </svg>
);
const IconCard = () => (
  <svg {...iconProps}>
    <rect x="3" y="5" width="18" height="14" rx="3" />
    <circle cx="8" cy="12" r="1.2" />
    <circle cx="12" cy="12" r="1.2" />
    <circle cx="16" cy="12" r="1.2" />
  </svg>
);
const IconGift = () => (
  <svg {...iconProps}>
    <rect x="3" y="9" width="18" height="12" rx="2" />
    <path d="M3 13h18M12 9v12M12 9c-2-4-7-4-6-1 .5 1.5 3 1 6 1Zm0 0c2-4 7-4 6-1-.5 1.5-3 1-6 1Z" />
  </svg>
);
const IconFlyer = () => (
  <svg {...iconProps}>
    <rect x="5" y="2" width="14" height="20" rx="2" />
    <path d="M8 7h8M8 11h8M8 15h5M8 18h4" />
  </svg>
);

const IconStamp = () => (
  <svg {...iconProps}>
    <path d="M9 3h6v5a2 2 0 0 1-1 1.7V12h-4V9.7A2 2 0 0 1 9 8Z" />
    <rect x="5" y="12" width="14" height="5" rx="1.5" />
    <path d="M6 20h12" />
  </svg>
);

const IconSwap = () => (
  <svg {...iconProps} width={14} height={14}>
    <path d="M4 7h13l-3-3M20 17H7l3 3" />
  </svg>
);
const IconShare = () => (
  <svg {...iconProps}>
    <path d="M12 3v12M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
  </svg>
);
const IconBack = () => (
  <svg {...iconProps}>
    <path d="M15 5 8 12l7 7" />
  </svg>
);
const IconHistory = () => (
  <svg {...iconProps} width={15} height={15}>
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 3v5h5M12 7v5l3 2" />
  </svg>
);
const IconTrash = () => (
  <svg {...iconProps}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
  </svg>
);
const IconClose = () => (
  <svg {...iconProps}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);
const IconPlay = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" className="ml-0.5 text-ink">
    <path d="M7 4.5v15l12-7.5z" fill="currentColor" />
  </svg>
);
const IconSparkle = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 2c.4 4.6 2.4 6.6 7 7-4.6.4-6.6 2.4-7 7-.4-4.6-2.4-6.6-7-7 4.6-.4 6.6-2.4 7-7z" />
    <path d="M19 14c.2 2.2 1.1 3.1 3.3 3.3-2.2.2-3.1 1.1-3.3 3.3-.2-2.2-1.1-3.1-3.3-3.3 2.2-.2 3.1-1.1 3.3-3.3z" opacity=".6" />
  </svg>
);

const trialOutMessage = (limit: number) =>
  limit > 0
    ? `Bạn đã dùng hết ${limit} lượt tạo miễn phí. Tạo tài khoản miễn phí (chỉ mất 30 giây) để dùng tiếp.`
    : "Vui lòng tạo tài khoản miễn phí hoặc đăng nhập để tạo ảnh và video.";

// Khách chưa đăng nhập hết lượt dùng thử: mời tạo tài khoản hoặc đăng nhập.
function AccountPrompt({ message, onClose }: { message: string; onClose: () => void }) {
  useBackClose(true, onClose);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="account-prompt-title" className="fade-up w-full max-w-sm rounded-3xl bg-cream p-6 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-gold/15 text-gold">
          <IconSparkle className="h-6 w-6" />
        </span>
        <h2 id="account-prompt-title" className="mt-3 font-serif text-[24px] leading-tight">Tạo tài khoản để dùng tiếp</h2>
        <p className="mt-2 text-[13.5px] leading-relaxed text-taupe">{message}</p>
        <div className="mt-5 grid gap-2">
          <Link href="/register" className="gold-btn flex h-11 items-center justify-center rounded-full text-[14px] font-medium text-cream active:scale-[0.98]">
            Tạo tài khoản miễn phí
          </Link>
          <Link href="/login" className="flex h-11 items-center justify-center rounded-full border border-line bg-white/70 text-[14px] active:scale-[0.98]">
            Tôi đã có tài khoản
          </Link>
          <button type="button" onClick={onClose} className="mt-1 text-[12.5px] text-taupe underline-offset-4 hover:underline">
            Để sau
          </button>
        </div>
      </div>
    </div>
  );
}

type HistoryItem = { id: string; style: string; createdAt: number };

const dayLabel = (t: number) => {
  const d = new Date(t);
  const today = new Date();
  const diff = Math.round((new Date(today.toDateString()).getTime() - new Date(d.toDateString()).getTime()) / 86_400_000);
  return diff === 0 ? "Hôm nay" : diff === 1 ? "Hôm qua" : d.toLocaleDateString("vi-VN", { day: "numeric", month: "numeric", year: "numeric" });
};

// Lịch sử ảnh đã tạo: lưới ảnh thu nhỏ theo ngày, chạm để xem lớn / lưu / làm video.
function HistorySheet({ rev, guest, onClose, onOpen }: { rev: number; guest: boolean; onClose: () => void; onOpen: (id: string) => void }) {
  useBackClose(true, onClose);
  const [items, setItems] = useState<HistoryItem[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    fetch("/api/history")
      .then((r) => r.json())
      .then((d) => active && (d.error ? setError(d.error) : setItems(d.items)))
      .catch(() => active && setError("Không tải được lịch sử, vui lòng thử lại."));
    return () => {
      active = false;
    };
  }, [rev]);
  const groups = (items ?? []).reduce<{ day: string; list: HistoryItem[] }[]>((acc, it) => {
    const day = dayLabel(it.createdAt);
    const last = acc[acc.length - 1];
    if (last?.day === day) last.list.push(it);
    else acc.push({ day, list: [it] });
    return acc;
  }, []);

  return (
    <div className="fade-up fixed inset-0 z-50 flex flex-col bg-ivory">
      <div className="flex items-center gap-3 border-b border-line/70 px-4 pb-3 pt-[max(0.85rem,env(safe-area-inset-top))]">
        <button onClick={onClose} className="flex h-9 items-center gap-1 rounded-full border border-line bg-cream pl-2.5 pr-3.5 text-[13px] font-medium active:scale-95">
          <IconBack /> Quay lại
        </button>
        <h2 className="font-serif text-[22px] leading-none">Lịch sử ảnh</h2>
      </div>
      <div className="no-scrollbar flex-1 overflow-y-auto px-4 pb-10 pt-4">
        <div className="mx-auto max-w-5xl">
          {guest && (
            <p className="mb-4 rounded-2xl bg-gold/10 px-4 py-3 text-[12.5px] leading-snug text-taupe">
              Ảnh đang được lưu trên trình duyệt này. <Link href="/register" className="font-semibold text-ink underline underline-offset-2">Tạo tài khoản</Link> để xem lại trên mọi thiết bị.
            </p>
          )}
          {error && <p className="rounded-2xl bg-rosegold/10 px-4 py-3 text-[13px] text-rosegold">{error}</p>}
          {!items && !error && <p className="py-16 text-center text-[13px] text-taupe">Đang tải…</p>}
          {items && !items.length && (
            <div className="py-16 text-center">
              <p className="font-serif text-[20px]">Chưa có ảnh nào</p>
              <p className="mt-1 text-[13px] text-taupe">Ảnh bạn tạo sẽ tự lưu ở đây để xem lại và tải về.</p>
            </div>
          )}
          {groups.map((g) => (
            <section key={g.day} className="mb-5">
              <h3 className="mb-2 px-1 text-[12px] font-semibold uppercase tracking-[0.15em] text-taupe">{g.day}</h3>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                {g.list.map((it) => (
                  <button key={it.id} onClick={() => onOpen(it.id)} className="relative aspect-square overflow-hidden rounded-2xl bg-line/40 active:scale-[0.97]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/api/history/${it.id}?thumb=1`} alt="" loading="lazy" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
