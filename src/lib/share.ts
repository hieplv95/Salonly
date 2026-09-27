// Điện thoại / máy tính bảng: mở bảng chia sẻ (WhatsApp, Instagram, Lưu ảnh…).
// Máy tính: luôn tải thẳng về thư mục Downloads. Windows cũng hỗ trợ chia sẻ file
// nhưng sẽ mở hộp "Share" thay vì lưu file, nên chỉ chia sẻ khi thiết bị dùng cảm ứng.
const isTouchDevice = () => typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;

export async function shareOrDownload(url: string, name: string) {
  if (isTouchDevice()) {
    try {
      const blob = await fetch(url).then((r) => r.blob());
      const file = new File([blob], name, { type: blob.type });
      if (navigator.canShare?.({ files: [file] })) return await navigator.share({ files: [file] });
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
    }
  }
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
}
