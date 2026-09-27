"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import css from "./CanvasEditor.module.css";

type Crop = { x: number; y: number; w: number; h: number }; // theo điểm ảnh của ảnh gốc
const ASPECTS: [string, number | null][] = [
  ["Tự do", null],
  ["1:1", 1],
  ["4:3", 4 / 3],
  ["3:4", 3 / 4],
  ["16:9", 16 / 9],
];
const MAX_SIDE = 2400;

// Cắt ảnh + bo góc / cắt tròn. Kết quả là ảnh PNG mới (nền trong suốt ở phần góc bo).
export function ImageCropper({ src, onApply, onClose }: { src: string; onApply: (dataUrl: string, width: number, height: number) => void; onClose: () => void }) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [crop, setCrop] = useState<Crop>({ x: 0, y: 0, w: 1, h: 1 });
  const [aspect, setAspect] = useState<number | null>(null);
  const [radius, setRadius] = useState(0); // % cạnh ngắn (50 = tròn / bo tối đa)
  const [boxWidth, setBoxWidth] = useState(520);
  const drag = useRef<{ mode: string; start: { x: number; y: number }; crop: Crop } | null>(null);

  useEffect(() => {
    const image = new Image();
    image.onload = () => {
      setImg(image);
      setCrop({ x: 0, y: 0, w: image.naturalWidth, h: image.naturalHeight });
    };
    image.src = src;
    const fit = () => setBoxWidth(Math.min(560, window.innerWidth - 48));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [src]);

  if (!img) return null;
  const W = img.naturalWidth;
  const H = img.naturalHeight;
  const scale = Math.min(boxWidth / W, (typeof window === "undefined" ? 520 : window.innerHeight * 0.55) / H);
  const clamp = (c: Crop): Crop => {
    const w = Math.max(20, Math.min(W, c.w));
    const h = Math.max(20, Math.min(H, c.h));
    return { w, h, x: Math.max(0, Math.min(W - w, c.x)), y: Math.max(0, Math.min(H - h, c.y)) };
  };
  // Đổi tỉ lệ: lấy khung lớn nhất đúng tỉ lệ, đặt giữa ảnh.
  const pickAspect = (a: number | null) => {
    setAspect(a);
    if (!a) return;
    const w = Math.min(W, H * a);
    const h = w / a;
    setCrop({ x: (W - w) / 2, y: (H - h) / 2, w, h });
  };

  const down = (e: ReactPointerEvent, mode: string) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    drag.current = { mode, start: { x: e.clientX, y: e.clientY }, crop };
  };
  const move = (e: ReactPointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = (e.clientX - d.start.x) / scale;
    const dy = (e.clientY - d.start.y) / scale;
    const c = d.crop;
    if (d.mode === "move") return setCrop(clamp({ ...c, x: c.x + dx, y: c.y + dy }));
    // Kéo góc: góc đối diện đứng yên.
    const left = d.mode.includes("w") ? c.x + dx : c.x;
    const top = d.mode.includes("n") ? c.y + dy : c.y;
    const right = d.mode.includes("e") ? c.x + c.w + dx : c.x + c.w;
    let bottom = d.mode.includes("s") ? c.y + c.h + dy : c.y + c.h;
    let w = right - left;
    let h = bottom - top;
    if (aspect) {
      h = w / aspect;
      if (d.mode.includes("n")) return setCrop(clamp({ x: left, y: c.y + c.h - h, w, h }));
      bottom = top + h;
    }
    w = Math.max(20, w);
    h = Math.max(20, h);
    setCrop(clamp({ x: Math.min(left, right - 20), y: Math.min(top, bottom - 20), w, h }));
  };

  const apply = () => {
    const k = Math.min(1, MAX_SIDE / Math.max(crop.w, crop.h));
    const cw = Math.round(crop.w * k);
    const ch = Math.round(crop.h * k);
    const canvas = document.createElement("canvas");
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext("2d")!;
    const r = (Math.min(cw, ch) * radius) / 100;
    if (r > 0) {
      ctx.beginPath();
      ctx.roundRect(0, 0, cw, ch, r);
      ctx.clip();
    }
    ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, cw, ch);
    onApply(canvas.toDataURL("image/png"), cw, ch);
  };

  const box = { left: crop.x * scale, top: crop.y * scale, width: crop.w * scale, height: crop.h * scale };
  return createPortal(
    <div className={css.cropBackdrop} role="dialog" aria-modal="true" aria-label="Cắt ảnh">
      <div className={css.cropDialog}>
        <h2>Cắt & bo góc ảnh</h2>
        <div className={css.cropStage} style={{ width: W * scale, height: H * scale }} onPointerMove={move} onPointerUp={() => (drag.current = null)} onPointerCancel={() => (drag.current = null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" draggable={false} style={{ width: W * scale, height: H * scale }} />
          <div
            className={css.cropBox}
            style={{ ...box, borderRadius: `${(Math.min(box.width, box.height) * radius) / 100}px` }}
            onPointerDown={(e) => down(e, "move")}
          >
            {(["nw", "ne", "sw", "se"] as const).map((h) => (
              <span key={h} className={css.cropHandle} data-corner={h} onPointerDown={(e) => down(e, h)} />
            ))}
          </div>
        </div>
        <div className={css.cropTools}>
          {ASPECTS.map(([label, a]) => (
            <button key={label} type="button" aria-pressed={aspect === a && !(a === 1 && radius === 50)} onClick={() => { pickAspect(a); if (radius === 50) setRadius(0); }}>
              {label}
            </button>
          ))}
          <button type="button" aria-pressed={aspect === 1 && radius === 50} onClick={() => { pickAspect(1); setRadius(50); }}>
            ◯ Hình tròn
          </button>
        </div>
        <label className={css.cropRadius}>
          Bo góc {radius}%
          <input type="range" min={0} max={50} value={radius} onChange={(e) => setRadius(Number(e.target.value))} />
        </label>
        <div className={css.cropActions}>
          <button type="button" onClick={onClose}>Huỷ</button>
          <button type="button" className={css.primary} onClick={apply}>Áp dụng</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
