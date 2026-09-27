"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { canvasDraft, type CanvasDocument } from "../card/canvas-model";

// Bản thiết kế tự do (trình thiết kế kéo thả) của 1 mẫu, lưu trên trình duyệt (IndexedDB).
// key: "logo:<mã mẫu>", "voucher:<mã mẫu>"… để mỗi loại, mỗi mẫu có bản riêng.
export function useCanvasDraft(key: string) {
  const [record, setRecord] = useState<{ key: string; doc: CanvasDocument | null } | null>(null);
  const [error, setError] = useState("");
  const writes = useRef<Promise<unknown>>(Promise.resolve());

  useEffect(() => {
    let active = true;
    void writes.current
      .catch(() => {})
      .then(() => canvasDraft("read", key))
      .then((doc) => {
        if (active) {
          setRecord({ key, doc });
          setError("");
        }
      })
      .catch(() => {
        if (active) {
          setRecord({ key, doc: null });
          setError("Trình duyệt chưa cho phép lưu thiết kế. Bạn vẫn có thể chỉnh và tải file.");
        }
      });
    return () => {
      active = false;
    };
  }, [key]);

  const save = useCallback(async (doc: CanvasDocument) => {
    setRecord({ key: doc.templateId, doc });
    const write = writes.current.catch(() => {}).then(() => canvasDraft("write", doc.templateId, doc));
    writes.current = write;
    try {
      await write;
      setError("");
    } catch (e) {
      setError("Chưa lưu được thiết kế. Hãy tải file trước khi rời trang.");
      throw e;
    }
  }, []);

  const discard = async () => {
    try {
      await writes.current.catch(() => {});
      await canvasDraft("delete", key);
      setRecord({ key, doc: null });
      setError("");
    } catch {
      setError("Chưa đặt lại được thiết kế. Vui lòng thử lại.");
    }
  };

  return { key, doc: record?.key === key ? record.doc : null, ready: record?.key === key, error, save, discard };
}

export type CanvasDraft = ReturnType<typeof useCanvasDraft>;
