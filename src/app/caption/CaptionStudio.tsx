"use client";

import { useEffect, useState } from "react";
import { CAPTION_LANGS, langOf } from "@/lib/caption-langs";
import { errMsg, postJson } from "../ai-client";
import { ActionBar, ImageDrop } from "../ai-ui";
import { Label, Panel, chip, inputCls } from "../design/ui";

type Caption = { caption: string; hashtags: string[] };
type Platform = "facebook" | "instagram" | "tiktok";
type Tone = "sang-trong" | "de-thuong" | "khuyen-mai" | "toi-gian";

const PLATFORMS: [Platform, string][] = [
  ["facebook", "Facebook"],
  ["instagram", "Instagram"],
  ["tiktok", "TikTok"],
];
const TONES: [Tone, string, string][] = [
  ["sang-trong", "Sang trọng", "Tinh tế, ít emoji"],
  ["de-thuong", "Dễ thương", "Vui tươi, nhiều emoji"],
  ["khuyen-mai", "Khuyến mãi", "Nhấn ưu đãi, kêu gọi đặt lịch"],
  ["toi-gian", "Tối giản", "Ngắn gọn, nhẹ nhàng"],
];
const NOTE_IDEAS = ["Giảm 20% tuần này", "Mẫu mới mùa thu", "Nhận đặt lịch online", "Tặng dưỡng tay cho khách mới"];
const PREFS_KEY = "naile-caption-prefs";

/* ---------- Trạng thái ---------- */

export function useCaptionEditor() {
  const [image, setImage] = useState<string | null>(null);
  const [platform, setPlatform] = useState<Platform>("facebook");
  const [tone, setTone] = useState<Tone>("sang-trong");
  const [lang, setLang] = useState("vi");
  const [withVi, setWithVi] = useState(false);
  const [salon, setSalon] = useState("");
  const [contact, setContact] = useState("");
  const [note, setNote] = useState("");
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Nhớ tên tiệm, liên hệ và lựa chọn quen dùng trên máy này.
  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem(PREFS_KEY) ?? "{}");
      /* eslint-disable react-hooks/set-state-in-effect -- chỉ đọc 1 lần sau khi mở trang */
      if (p.salon) setSalon(p.salon);
      if (p.contact) setContact(p.contact);
      if (p.platform) setPlatform(p.platform);
      if (p.tone) setTone(p.tone);
      // Bản cũ: "en" / "both" (Việt + Anh) → tiếng Anh (Mỹ), có kèm bản tiếng Việt.
      if (p.lang) setLang(p.lang === "en" || p.lang === "both" ? "en-us" : langOf(p.lang).id);
      if (p.withVi || p.lang === "both") setWithVi(true);
      /* eslint-enable react-hooks/set-state-in-effect */
    } catch {}
  }, []);

  async function generate() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ salon, contact, platform, tone, lang, withVi }));
    } catch {}
    try {
      const data = await postJson("/api/caption", { image, platform, tone, lang, withVi: withVi && lang !== "vi", salon, contact, note });
      setCaptions(data.captions);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  }

  return {
    image, setImage, platform, setPlatform, tone, setTone, lang, setLang, withVi, setWithVi,
    salon, setSalon, contact, setContact, note, setNote, captions, busy, error, generate,
  };
}

export type CaptionEditor = ReturnType<typeof useCaptionEditor>;

/* ---------- Giao diện ---------- */

function CaptionCard({ c, index }: { c: Caption; index: number }) {
  const [copied, setCopied] = useState(false);
  const text = `${c.caption}\n\n${c.hashtags.join(" ")}`;
  return (
    <div className="fade-up rounded-3xl border border-line bg-white/80 p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">Lựa chọn {index + 1}</span>
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
          }}
          className={`rounded-full px-3.5 py-1.5 text-[12px] font-medium active:scale-95 ${copied ? "bg-emerald-100 text-emerald-700" : "gold-btn text-cream"}`}
        >
          {copied ? "✓ Đã chép" : "Chép"}
        </button>
      </div>
      <p className="whitespace-pre-line text-[14px] leading-relaxed">{c.caption}</p>
      <p className="mt-3 text-[13px] leading-relaxed text-gold">{c.hashtags.join(" ")}</p>
    </div>
  );
}

export function CaptionStudio({ editor }: { editor: CaptionEditor }) {
  const e = editor;
  return (
    <div className="space-y-4 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start lg:gap-8 lg:space-y-0">
      <div className="space-y-4 lg:sticky lg:top-0">
        <ImageDrop label="Ảnh móng" hint="Ảnh vừa tạo hoặc ảnh chụp mẫu nail" value={e.image} onChange={e.setImage} aspect="aspect-square" />
        {e.image && (
          <button type="button" onClick={() => e.setImage(null)} className="w-full text-center text-[12px] text-taupe underline-offset-4 hover:underline">
            Bỏ ảnh, chỉ viết theo mô tả
          </button>
        )}
      </div>

      <div className="space-y-4">
        <Panel title="Đăng ở đâu">
          <div className="grid grid-cols-3 gap-2">
            {PLATFORMS.map(([id, label]) => (
              <button key={id} type="button" onClick={() => e.setPlatform(id)} aria-pressed={e.platform === id} className={`${chip(e.platform === id)} py-2.5 text-[13px] font-medium`}>
                {label}
              </button>
            ))}
          </div>
          <Label>Giọng văn</Label>
          <div className="grid grid-cols-2 gap-2">
            {TONES.map(([id, label, desc]) => (
              <button key={id} type="button" onClick={() => e.setTone(id)} aria-pressed={e.tone === id} className={`${chip(e.tone === id)} px-3 py-2.5 text-left`}>
                <span className="block text-[13px] font-semibold">{label}</span>
                <span className="block text-[11px] text-taupe">{desc}</span>
              </button>
            ))}
          </div>
          <Label hint={`${CAPTION_LANGS.length} ngôn ngữ`}>Ngôn ngữ</Label>
          <select value={e.lang} onChange={(x) => e.setLang(x.target.value)} className={`${inputCls} cursor-pointer`}>
            {[
              ["Hay dùng", CAPTION_LANGS.filter((l) => l.popular)],
              ["Châu Âu khác", CAPTION_LANGS.filter((l) => !l.popular)],
            ].map(([group, list]) => (
              <optgroup key={group as string} label={group as string}>
                {(list as typeof CAPTION_LANGS).map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label === l.vi ? l.label : `${l.label} · ${l.vi}`}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          {e.lang !== "vi" && (
            <label className="mt-2 flex cursor-pointer items-center gap-2 px-1 text-[13px]">
              <input type="checkbox" checked={e.withVi} onChange={(x) => e.setWithVi(x.target.checked)} className="h-4 w-4 accent-[var(--color-gold)]" />
              Kèm bản dịch tiếng Việt bên dưới
              <span className="text-[11px] text-taupe">(để kiểm tra nội dung)</span>
            </label>
          )}
        </Panel>

        <Panel title="Thông tin tiệm">
          <Label hint="Không bắt buộc">Tên tiệm</Label>
          <input value={e.salon} maxLength={60} onChange={(x) => e.setSalon(x.target.value)} placeholder="VD: Luxe Nail Studio" className={inputCls} />
          <Label hint="Không bắt buộc">Liên hệ / đặt lịch</Label>
          <input value={e.contact} maxLength={120} onChange={(x) => e.setContact(x.target.value)} placeholder="VD: 0909 123 456 · 12 Nguyễn Huệ, Q.1" className={inputCls} />
          <Label hint={e.image ? "Không bắt buộc" : "Cần khi không có ảnh"}>Ưu đãi, ghi chú thêm</Label>
          <textarea value={e.note} maxLength={300} rows={2} onChange={(x) => e.setNote(x.target.value)} placeholder="VD: Giảm 20% cho khách đặt lịch trước thứ 6" className={`${inputCls} resize-none`} />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {NOTE_IDEAS.map((n) => (
              <button key={n} type="button" onClick={() => e.setNote(e.note ? `${e.note}. ${n}` : n)} className="rounded-full border border-line bg-white/70 px-3 py-1.5 text-[12px] active:scale-95">
                + {n}
              </button>
            ))}
          </div>
        </Panel>

        {e.error && <p className="rounded-2xl bg-rosegold/10 px-4 py-3 text-[13px] text-rosegold">{e.error}</p>}
        {e.busy && !e.captions.length && <p className="rounded-3xl border border-dashed border-line p-6 text-center text-[13px] text-taupe">AI đang xem ảnh và viết caption…</p>}
        {e.captions.length > 0 && (
          <div className={`space-y-3 ${e.busy ? "opacity-50" : ""}`}>
            {e.captions.map((c, i) => (
              <CaptionCard key={`${i}-${c.caption.slice(0, 20)}`} c={c} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function CaptionFooter({ editor }: { editor: CaptionEditor }) {
  const e = editor;
  return (
    <ActionBar
      info="Viết 3 lựa chọn caption + hashtag · không tính vào lượt tạo ảnh/video"
      label={e.captions.length ? "Viết lại caption khác" : "Viết caption"}
      busy={e.busy}
      disabled={!e.image && !e.note.trim()}
      onClick={e.generate}
    />
  );
}
