// Cuộn tới 1 phần tử bên trong khung nội dung (theo chiều dọc), không đụng tới khung app hay cả trang.
// Không dùng scrollIntoView: lệnh đó cuộn mọi khung chứa bên ngoài, kể cả khung app đang khoá
// (overflow hidden), làm thanh trên cùng bị đẩy khuất và trang lệch ngang trên điện thoại.
export function scrollToEl(el: HTMLElement | null, offset = 8) {
  if (!el) return;
  let box = el.parentElement;
  while (box && !/(auto|scroll)/.test(getComputedStyle(box).overflowY)) box = box.parentElement;
  if (!box) return;
  const top = el.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop - offset;
  box.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
}
