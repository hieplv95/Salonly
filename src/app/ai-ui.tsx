"use client";

import { useRef, useState } from "react";
import { fileToDataUrl } from "./ai-client";

// Ô chọn / kéo thả ảnh, hiện ảnh đã chọn; bấm lại để đổi ảnh.
export function ImageDrop({
  label,
  hint,
  value,
  onChange,
  aspect = "aspect-[4/5]",
}: {
  label: string;
  hint: string;
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  aspect?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const pick = async (file?: File) => {
    if (file?.type.startsWith("image/")) onChange(await fileToDataUrl(file));
  };
  return (
    <div>
      <p className="mb-1.5 px-1 text-xs font-semibold">{label}</p>
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          pick(e.dataTransfer.files[0]);
        }}
        className={`relative block w-full overflow-hidden rounded-3xl border-2 border-dashed transition ${aspect} ${
          over ? "border-gold bg-gold/10" : value ? "border-transparent" : "border-line bg-white/60 hover:border-gold/60"
        }`}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <span className="absolute inset-0 grid place-items-center p-4 text-center">
            <span>
              <span className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-gold/15 text-[22px] text-gold">+</span>
              <span className="mt-2 block text-[12.5px] font-medium">Chạm để chọn ảnh</span>
              <span className="mt-0.5 block text-[11px] text-taupe">{hint}</span>
            </span>
          </span>
        )}
        {value && <span className="absolute bottom-2 right-2 rounded-full bg-black/55 px-2.5 py-1 text-[11px] text-white">Đổi ảnh</span>}
      </button>
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0] ?? undefined)} />
    </div>
  );
}

// Thanh nút chính ở chân trang (điện thoại: thông tin trên, nút dưới; máy tính: thông tin trái, nút phải).
export function ActionBar({ info, label, busy, disabled, onClick }: { info: React.ReactNode; label: string; busy: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <div className="lg:flex lg:items-center lg:gap-6">
      <p className="truncate px-1 text-[11px] text-taupe lg:min-w-0 lg:flex-1 lg:text-[12px]">{info}</p>
      <button
        type="button"
        onClick={onClick}
        disabled={busy || disabled}
        className="gold-btn mt-2 flex h-[52px] w-full items-center justify-center gap-2 rounded-full text-[15px] font-medium text-cream active:scale-[0.98] disabled:opacity-50 lg:mt-0 lg:w-[440px] lg:shrink-0"
      >
        {busy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-cream/40 border-t-cream" />}
        {label}
      </button>
    </div>
  );
}
