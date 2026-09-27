import { LOGO_FONT_FILES } from "@/lib/logo-font-files";
import { shareOrDownload } from "@/lib/share";

// Dùng chung cho logo và bảng giá: xuất SVG (nhúng font) và PNG.

/* ---------- Xuất file ---------- */

export const slug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "salonly";

const toDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(blob);
  });

// File SVG độc lập: nhúng font (dạng base64) để mở ở đâu chữ cũng đúng, kể cả khi chuyển sang PNG.
export async function standaloneSvg(el: SVGSVGElement, width: number, height: number) {
  const clone = el.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("width", String(width));
  clone.setAttribute("height", String(height));
  clone.removeAttribute("class");
  clone.querySelectorAll('[data-editor-only="true"]').forEach((node) => node.remove());
  clone.querySelectorAll("[data-card-layer-id]").forEach((node) => {
    node.removeAttribute("class");
    node.removeAttribute("style");
    node.removeAttribute("data-card-layer-id");
    node.removeAttribute("data-card-layer-label");
  });

  // SVG mở như một ảnh không được phép tự tải tệp ảnh bên ngoài. Nhúng ảnh trước khi
  // chuyển sang PNG/PDF để ảnh móng thật luôn có mặt trong file in tải xuống.
  await Promise.all([...clone.querySelectorAll("image")].map(async (image) => {
    const src = image.getAttribute("href") ?? image.getAttribute("xlink:href");
    if (!src || src.startsWith("data:")) return;
    const blob = await fetch(src).then((response) => {
      if (!response.ok) throw new Error("Không tải được ảnh trong thiết kế");
      return response.blob();
    });
    image.setAttribute("href", await toDataUrl(blob));
    image.removeAttribute("xlink:href");
  }));

  const used = new Set(
    [...clone.querySelectorAll("text")].map((t) => (t.getAttribute("font-family") ?? "").replace(/['"]/g, "")),
  );
  const faces = await Promise.all(
    LOGO_FONT_FILES.filter((f) => used.has(f.family)).map(async (f) => {
      const data = await toDataUrl(await fetch(f.url).then((r) => r.blob()));
      return `@font-face{font-family:"${f.family}";font-weight:${f.weight};src:url(${data}) format("woff2");unicode-range:${f.range};}`;
    }),
  );
  const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
  style.textContent = faces.join("");
  clone.insertBefore(style, clone.firstChild);
  return new XMLSerializer().serializeToString(clone);
}

export type ExportKind = "jpg" | "png" | "pdf" | "svg";

// Vẽ SVG ra ảnh. JPG không có nền trong suốt nên tô nền trắng phía sau.
export async function svgToRaster(svg: string, width: number, height: number, type: "image/png" | "image/jpeg"): Promise<Blob> {
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    // Chờ thêm một nhịp để font nhúng trong SVG kịp áp dụng trước khi vẽ.
    await new Promise((r) => setTimeout(r, 250));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;
    if (type === "image/jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
    }
    ctx.drawImage(img, 0, 0, width, height);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Không tạo được ảnh"))), type, 0.93),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

// PDF nhiều trang, mỗi trang là 1 ảnh JPEG phủ kín trang. Khổ trang = số điểm ảnh × 72/dpi
// (VD bảng giá A4 2480×3508 ở 300dpi → đúng 595×842pt; thẻ 2100×1200 ở 600dpi → 3,5×2 inch).
export async function jpegsToPdf(pages: { jpeg: Blob; width: number; height: number }[], dpi = 300): Promise<Blob> {
  const enc = new TextEncoder();
  const parts: Uint8Array[] = [];
  const offsets: number[] = [];
  let len = 0;
  const push = (x: string | Uint8Array) => {
    const b = typeof x === "string" ? enc.encode(x) : x;
    parts.push(b);
    len += b.length;
  };
  const obj = (n: number, ...body: (string | Uint8Array)[]) => {
    offsets[n] = len;
    push(`${n} 0 obj\n`);
    body.forEach(push);
    push("\nendobj\n");
  };
  // Mỗi trang dùng 3 đối tượng: trang (3+3i), ảnh (4+3i), nội dung (5+3i).
  const kids = pages.map((_, i) => `${3 + 3 * i} 0 R`).join(" ");
  push("%PDF-1.4\n");
  obj(1, "<< /Type /Catalog /Pages 2 0 R >>");
  obj(2, `<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`);
  for (const [i, p] of pages.entries()) {
    const img = new Uint8Array(await p.jpeg.arrayBuffer());
    const pw = +((p.width * 72) / dpi).toFixed(2);
    const ph = +((p.height * 72) / dpi).toFixed(2);
    const n = 3 + 3 * i;
    const content = `q ${pw} 0 0 ${ph} 0 0 cm /Im0 Do Q`;
    obj(n, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw} ${ph}] /Resources << /XObject << /Im0 ${n + 1} 0 R >> >> /Contents ${n + 2} 0 R >>`);
    obj(
      n + 1,
      `<< /Type /XObject /Subtype /Image /Width ${p.width} /Height ${p.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${img.length} >>\nstream\n`,
      img,
      "\nendstream",
    );
    obj(n + 2, `<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
  }
  const size = 3 + 3 * pages.length;
  const xref = len;
  const rows = Array.from({ length: size - 1 }, (_, i) => `${String(offsets[i + 1]).padStart(10, "0")} 00000 n \n`).join("");
  push(`xref\n0 ${size}\n0000000000 65535 f \n${rows}`);
  push(`trailer\n<< /Size ${size} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  return new Blob(parts as BlobPart[], { type: "application/pdf" });
}

const save = async (blob: Blob, file: string) => {
  const url = URL.createObjectURL(blob);
  await shareOrDownload(url, file);
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
};

// Tải (hoặc chia sẻ trên điện thoại) thiết kế SVG đang hiển thị, theo loại tệp đã chọn.
// Nhiều mặt (VD thẻ 2 mặt): PDF gộp thành nhiều trang, loại khác tải từng tệp kèm hậu tố.
export async function downloadDesign(
  el: SVGSVGElement | { el: SVGSVGElement; suffix: string }[],
  kind: ExportKind,
  name: string,
  width: number,
  height: number,
  dpi = 300,
) {
  const sides = Array.isArray(el) ? el : [{ el, suffix: "" }];
  const svgs = await Promise.all(sides.map((s) => standaloneSvg(s.el, width, height)));
  if (kind === "pdf") {
    const pages = await Promise.all(svgs.map(async (svg) => ({ jpeg: await svgToRaster(svg, width, height, "image/jpeg"), width, height })));
    return save(await jpegsToPdf(pages, dpi), `${slug(name)}.pdf`);
  }
  for (const [i, svg] of svgs.entries()) {
    const blob =
      kind === "svg"
        ? new Blob([svg], { type: "image/svg+xml" })
        : await svgToRaster(svg, width, height, kind === "png" ? "image/png" : "image/jpeg");
    await save(blob, `${slug(name + (sides[i].suffix ? `-${sides[i].suffix}` : ""))}.${kind}`);
  }
}
