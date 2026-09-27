"use client";

import { useState } from "react";
import { CanvasEditor, type EditorConfig } from "../card/CanvasEditor";
import { captureCardDocument, type CanvasDocument } from "../card/canvas-model";
import type { CanvasDraft } from "./useCanvasDraft";
import { Panel } from "./ui";

// Ô "Thiết kế tự do": mở trình thiết kế kéo thả cho mẫu đang chọn (logo, voucher…).
// Lần đầu: chụp bản xem trước thành các lớp chỉnh được; các lần sau mở lại bản đã lưu.
export function DesignerPanel({
  draft,
  capture,
  name,
  config,
  what,
}: {
  draft: CanvasDraft;
  capture: () => SVGSVGElement[]; // bản xem trước của mẫu (mặt trước, mặt sau…)
  name: string;
  config: EditorConfig;
  what: string; // "logo", "voucher"… để ghi chú cho khách
}) {
  const [editing, setEditing] = useState<CanvasDocument | null>(null);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);

  const open = async () => {
    setOpening(true);
    setError("");
    try {
      await document.fonts.ready;
      const roots = capture();
      if (!draft.doc && !roots.length) throw new Error();
      const doc = draft.doc ?? captureCardDocument(draft.key, name, roots);
      // Vẫn mở được dù trình duyệt chặn lưu (chỉnh xong thì tải file).
      try {
        await draft.save(doc);
      } catch {}
      setEditing(doc);
    } catch {
      setError("Chưa mở được trình thiết kế. Hãy thử lại sau khi bản xem trước tải xong.");
    } finally {
      setOpening(false);
    }
  };

  return (
    <Panel title="Thiết kế tự do">
      <h2 className="font-serif text-[24px] leading-tight">{draft.doc ? "Bản thiết kế riêng của bạn" : "Chỉnh mọi chi tiết"}</h2>
      <p className="mb-4 mt-1 text-[13px] leading-relaxed text-taupe">
        {draft.doc
          ? `Bạn đang dùng bản thiết kế tự do cho mẫu này. Các ô chỉnh theo mẫu bên dưới không áp dụng cho bản này.`
          : `Mở khung vẽ để kéo thả, đổi cỡ, xoay từng chữ và hình trên ${what}, thêm ảnh, logo, biểu tượng hoặc mã QR.`}
      </p>
      {(error || draft.error) && <p className="mb-3 rounded-xl bg-rosegold/10 px-3 py-2 text-[12px] text-rosegold">{error || draft.error}</p>}
      <button
        type="button"
        onClick={() => void open()}
        disabled={opening || !draft.ready}
        className="w-full rounded-2xl bg-ink px-5 py-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {opening ? "Đang mở thiết kế…" : draft.doc ? "✦ Tiếp tục thiết kế" : "✦ Mở trình thiết kế"}
      </button>
      <p className="mt-2 text-center text-[11px] text-taupe">Tự lưu trên trình duyệt này · tải PNG, JPG, SVG hoặc PDF</p>
      {draft.doc &&
        (confirmReset ? (
          <div className="mt-3 rounded-2xl border border-line bg-white/60 p-3 text-[12px]">
            <p className="text-taupe">Bỏ bản thiết kế tự do của mẫu này và quay lại chỉnh theo mẫu?</p>
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={() => setConfirmReset(false)} className="rounded-full border border-line px-4 py-1.5">
                Giữ lại
              </button>
              <button
                type="button"
                onClick={() => {
                  void draft.discard();
                  setConfirmReset(false);
                }}
                className="rounded-full bg-ink px-4 py-1.5 text-white"
              >
                Quay lại mẫu
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirmReset(true)} className="mt-3 w-full text-center text-[12px] text-taupe underline underline-offset-4">
            Quay lại chỉnh theo mẫu
          </button>
        ))}
      {editing && <CanvasEditor initial={editing} onChange={draft.save} onClose={() => setEditing(null)} config={config} />}
    </Panel>
  );
}
