"use client";

import { useEffect, useRef } from "react";

// Nút Back của trình duyệt / điện thoại đóng lớp phủ đang mở trên cùng (xem ảnh, lịch sử, menu,
// trình thiết kế, cắt ảnh…) thay vì rời khỏi app. Mỗi lớp phủ mở = 1 bước trong lịch sử trình duyệt;
// đóng bằng nút trên màn hình thì lùi lại đúng số bước đó (bỏ qua sự kiện do chính app gây ra).

type Entry = { close: () => void };
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
      listening = true;
    }
    const entry: Entry = { close: () => latest.current() };
    stack.push(entry);
    history.pushState({ overlay: stack.length }, "");
    return () => {
      const i = stack.indexOf(entry);
      if (i === -1) return; // đã đóng bằng nút Back: bước lịch sử đã được dùng
      stack.splice(i, 1);
      scheduleBack();
    };
  }, [open]);
}
