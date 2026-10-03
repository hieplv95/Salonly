"use client";

import { useEffect, useRef } from "react";

// Nút Back của trình duyệt / điện thoại đóng lớp phủ đang mở trên cùng (xem ảnh, lịch sử, menu,
// trình thiết kế, cắt ảnh…) thay vì rời khỏi app. Mỗi lớp phủ mở = 1 bước trong lịch sử trình duyệt;
// đóng bằng nút trên màn hình thì lùi lại đúng số bước đó (bỏ qua sự kiện do chính app gây ra).

type Entry = { close: () => void; url: string };
const stack: Entry[] = [];
let skip = 0;
let pendingBack = 0;
let listening = false;

function onPop() {
  if (skip > 0) {
    skip--;
    return;
  }
  stack.pop()?.close();
}

// Nhiều lớp phủ đóng cùng lúc (VD: đóng ảnh và lịch sử) → gộp thành 1 lần lùi.
function scheduleBack() {
  if (pendingBack++ > 0) return;
  queueMicrotask(() => {
    const n = pendingBack;
    pendingBack = 0;
    skip++;
    history.go(-n);
  });
}

export function useBackClose(open: boolean, onClose: () => void) {
  const latest = useRef(onClose);
  useEffect(() => {
    latest.current = onClose;
  });
  useEffect(() => {
    if (!open) return;
    if (!listening) {
      window.addEventListener("popstate", onPop);
      // Các bước lịch sử này chỉ là lớp phủ, không phải trang mới: không để trình duyệt tự
      // khôi phục vị trí cuộn khi lùi (Safari có thể đẩy cả trang lệch xuống và kẹt lại).
      history.scrollRestoration = "manual";
      listening = true;
    }
    const entry: Entry = { close: () => latest.current(), url: location.pathname + location.search };
    stack.push(entry);
    history.pushState({ overlay: stack.length }, "");
    return () => {
      const i = stack.indexOf(entry);
      if (i === -1) return; // đã đóng bằng nút Back: bước lịch sử đã được dùng
      stack.splice(i, 1);
      // Lớp phủ đóng vì đã chuyển sang trang khác (VD: bấm "Tạo tài khoản" → /register):
      // không lùi lịch sử, nếu không sẽ bị kéo ngược về trang cũ.
      if (location.pathname + location.search !== entry.url) return;
      scheduleBack();
    };
  }, [open]);
}
