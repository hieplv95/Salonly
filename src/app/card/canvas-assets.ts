import qrcode from "qrcode-generator";

// Phông có bộ chữ tiếng Việt, đã nhúng sẵn khi tải file (xem scripts/build-logo-fonts.mjs).
export const CANVAS_FONTS = [
  "Montserrat", "Be Vietnam Pro", "Quicksand", "Oswald", "Josefin Sans",
  "Playfair Display", "Cormorant Garamond", "Lora",
  "Great Vibes", "Dancing Script", "Pacifico", "Lobster", "Charm",
];
// Biểu tượng liên hệ vẽ trong ô 46×46, nét màu nâu (đổi được bằng "Màu toàn bộ thành phần").
const GLYPHS = {
  instagram: '<g fill="none" stroke="#68584a" stroke-width="3"><rect x="3" y="3" width="38" height="38" rx="10"/><circle cx="22" cy="22" r="9"/><circle cx="33" cy="11" r="2" fill="#68584a" stroke="none"/></g>',
  phone: '<path d="M4 3 L14 3 L19 14 L12 20 Q19 31 29 34 L35 27 L46 32 L46 43 Q16 51 2 15 Z" fill="none" stroke="#68584a" stroke-width="3"/>',
  website: '<g stroke="#68584a" stroke-width="2.5" fill="none"><circle cx="23" cy="23" r="21"/><ellipse cx="23" cy="23" rx="10" ry="21"/><path d="M2 23 H44 M6 12 H40 M6 34 H40"/></g>',
  facebook: '<g fill="none" stroke="#68584a" stroke-width="3" stroke-linecap="round"><rect x="3" y="3" width="38" height="38" rx="10"/><path d="M26 41 V19 Q26 12 33 12 H34 M19 24 H33"/></g>',
  tiktok: '<g fill="none" stroke="#68584a" stroke-width="3" stroke-linecap="round"><rect x="3" y="3" width="38" height="38" rx="10"/><circle cx="18" cy="28" r="5"/><path d="M23 28 V10 Q25 17 32 18"/></g>',
  whatsapp: '<path d="M11 33 A17 17 0 1 1 15.8 36.4 L5 41 Z" fill="none" stroke="#68584a" stroke-width="3" stroke-linejoin="round"/><path d="M16 14 L20 13 L22.5 18.5 L20 20.5 Q22.5 25.5 27.5 28 L29.5 25.5 L35 28 L34 32 Q24 34 18 26 Q13 19 16 14 Z" fill="#68584a"/>',
};
const contact = (name: string, glyph: keyof typeof GLYPHS, text: string) => ({
  name,
  icon: "",
  glyph: GLYPHS[glyph],
  markup: `${GLYPHS[glyph]}<text x="60" y="32" font-family="Montserrat" font-size="28" fill="#68584a">${text}</text>`,
});

export const CANVAS_ASSETS: { name: string; icon: string; glyph?: string; markup: string }[] = [
  contact("Instagram + chữ", "instagram", "@tiemnail"),
  contact("Facebook + chữ", "facebook", "facebook.com/tiemnail"),
  contact("TikTok + chữ", "tiktok", "@tiemnail"),
  contact("WhatsApp + chữ", "whatsapp", "+84 909 123 456"),
  contact("Điện thoại + chữ", "phone", "0909 123 456"),
  contact("Website + chữ", "website", "tiemnail.vn"),
  { name: "Trái tim", icon: "♡", markup: '<path d="M60 108 C-30 50 5 -20 60 21 C115 -20 150 50 60 108Z" fill="#b49b77"/>' },
  { name: "Hình tròn", icon: "○", markup: '<circle cx="55" cy="55" r="52" fill="none" stroke="#9e876c" stroke-width="3"/>' },
  { name: "Hình chữ nhật", icon: "▭", markup: '<rect width="220" height="110" rx="8" fill="#c9b89f"/>' },
  { name: "Đường kẻ", icon: "―", markup: '<path d="M0 0 H280" fill="none" stroke="#9e876c" stroke-width="3"/>' },
  { name: "Ngôi sao", icon: "☆", markup: '<path d="M60 0 L74 40 L118 41 L83 68 L95 110 L60 85 L25 110 L37 68 L2 41 L46 40Z" fill="#b49b77"/>' },
];

export function qrMarkup(value: string) {
  qrcode.stringToBytes = (s: string) => [...new TextEncoder().encode(s)];
  const code = qrcode(0, "M");
  code.addData(value.trim());
  code.make();
  const n = code.getModuleCount();
  let path = "";
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (code.isDark(y, x)) path += `M${x + 4} ${y + 4}h1v1h-1z`;
  return `<g transform="scale(${180 / (n + 8)})"><rect width="${n + 8}" height="${n + 8}" fill="#ffffff"/><path d="${path}" fill="#222222"/></g>`;
}

// Decode and re-encode uploads so SVG/HTML and oversized image metadata never enter a document.
export async function imageMarkup(file: File) {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) throw new Error("Chọn ảnh PNG, JPG hoặc WebP.");
  if (file.size > 15 * 1024 * 1024) throw new Error("Ảnh tối đa 15 MB.");
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const scale = Math.min(1, 2400 / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return `<image width="${canvas.width}" height="${canvas.height}" href="${canvas.toDataURL("image/png")}"/>`;
  } finally { URL.revokeObjectURL(url); }
}

// Khung & hoạ tiết trang trí (màu vàng be, đổi được bằng "Màu toàn bộ thành phần").
export const CANVAS_FRAMES = [
  { name: "Khung đôi", icon: "▣", markup: '<rect x="2" y="2" width="296" height="176" fill="none" stroke="#b49b77" stroke-width="3"/><rect x="12" y="12" width="276" height="156" fill="none" stroke="#b49b77" stroke-width="1"/>' },
  { name: "Khung bo góc", icon: "▢", markup: '<rect x="2" y="2" width="296" height="176" rx="26" fill="none" stroke="#9e876c" stroke-width="3"/>' },
  { name: "Mái vòm", icon: "∩", markup: '<path d="M2 238 V100 A98 98 0 0 1 198 100 V238 Z" fill="none" stroke="#9e876c" stroke-width="3"/>' },
  { name: "Vòng tròn đôi", icon: "◎", markup: '<circle cx="80" cy="80" r="77" fill="none" stroke="#b49b77" stroke-width="3"/><circle cx="80" cy="80" r="68" fill="none" stroke="#b49b77" stroke-width="1"/>' },
  { name: "Đường kẻ hoa văn", icon: "◆", markup: '<path d="M0 10 H120 M160 10 H280" stroke="#b49b77" stroke-width="2"/><path d="M140 2 L148 10 L140 18 L132 10 Z" fill="#b49b77"/>' },
  { name: "Dải ruy băng", icon: "🎀", markup: '<path d="M0 0 H260 L245 25 L260 50 H0 L15 25 Z" fill="#c9a4a4"/>' },
  { name: "Nhãn tròn", icon: "●", markup: '<circle cx="60" cy="60" r="58" fill="#b49b77"/><circle cx="60" cy="60" r="50" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-dasharray="3 4"/>' },
  { name: "Góc trang trí", icon: "⌜", markup: '<path d="M2 80 V2 H80" fill="none" stroke="#b49b77" stroke-width="3"/><path d="M14 80 V14 H80" fill="none" stroke="#b49b77" stroke-width="1"/><path d="M26 18 L34 26 L26 34 L18 26 Z" fill="#b49b77"/>' },
  { name: "Lấp lánh", icon: "✦", markup: '<path d="M50 0 C52 30 70 48 100 50 C70 52 52 70 50 100 C48 70 30 52 0 50 C30 48 48 30 50 0 Z" fill="#c8a96e"/><path d="M118 60 C119 72 126 79 138 80 C126 81 119 88 118 100 C117 88 110 81 98 80 C110 79 117 72 118 60 Z" fill="#c8a96e"/>' },
];

// Mẫu chữ có sẵn khi bấm "Thêm chữ".
export const TEXT_PRESETS = [
  { name: "Tiêu đề", markup: '<text x="0" y="60" font-family="Playfair Display" font-weight="600" font-size="60" fill="#3b2f27">Tiêu đề</text>' },
  { name: "Tiêu đề phụ", markup: '<text x="0" y="32" font-family="Montserrat" font-weight="500" font-size="30" letter-spacing="4" fill="#68584a">TIÊU ĐỀ PHỤ</text>' },
  { name: "Chữ viết tay", markup: '<text x="0" y="60" font-family="Great Vibes" font-weight="400" font-size="64" fill="#9a7653">Cảm ơn bạn</text>' },
  { name: "Đoạn nội dung", markup: '<text x="0" y="26" font-family="Montserrat" font-weight="500" font-size="24" fill="#68584a">Nhập nội dung của bạn</text>' },
];

// Bảng màu gợi ý: màu logo / thẻ / voucher khách đã thiết kế (lưu trên trình duyệt) + vài màu cơ bản.
export function brandPalette(): string[] {
  const colors: string[] = [];
  for (const key of ["naile-logo-design", "naile-card-design", "naile-voucher-design", "naile-price-design"]) {
    try {
      const saved = JSON.parse(localStorage.getItem(key) ?? "null") as { colors?: Record<string, unknown> } | null;
      for (const v of Object.values(saved?.colors ?? {})) if (typeof v === "string" && /^#[\da-f]{6}$/i.test(v)) colors.push(v.toLowerCase());
    } catch {}
  }
  return [...new Set([...colors, "#2b211b", "#ffffff", "#b49b77", "#9a7653", "#c0395b", "#6e8b74"])].slice(0, 12);
}
