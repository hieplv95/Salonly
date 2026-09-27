// Dữ liệu cho tab Bảng giá: khổ giấy, bảng màu, nội dung mẫu và 30 mẫu bảng giá tiệm nail.
import type { LogoFontId, LogoIconId } from "./logo-templates";

export type PriceStyle =
  | "classic"
  | "banner"
  | "cards"
  | "sidebar"
  | "minimal"
  | "arch"
  | "frame"
  | "botanical"
  | "marble"
  | "split"
  | "editorial";

// w/h: khung vẽ; scale: phóng to khi tải về (A4 1240×1754 × 2 = 2480×3508 ≈ in 300dpi).
export type PriceFormatId = "a4" | "ig" | "story" | "square" | "rack";
export const PRICE_FORMATS: { id: PriceFormatId; label: string; hint: string; w: number; h: number; scale: number }[] = [
  { id: "a4", label: "A4 in treo tiệm", hint: "Dọc · in 300dpi", w: 1240, h: 1754, scale: 2 },
  { id: "ig", label: "Bài viết FB/IG", hint: "4:5", w: 1080, h: 1350, scale: 2 },
  { id: "story", label: "Story · TikTok", hint: "9:16", w: 1080, h: 1920, scale: 2 },
  { id: "square", label: "Vuông", hint: "1:1", w: 1080, h: 1080, scale: 2 },
  // Thẻ đứng 4×9 inch (để quầy lễ tân): 800×1800 × 1,5 = 1200×2700 ≈ in 300dpi.
  { id: "rack", label: "Thẻ đứng", hint: "4×9 inch · để quầy", w: 800, h: 1800, scale: 1.5 },
];
export const priceFormatOf = (id: PriceFormatId) => PRICE_FORMATS.find((f) => f.id === id) ?? PRICE_FORMATS[0];

// bg: nền trang · surface: nền thẻ/ô · primary: tiêu đề · text: chữ dịch vụ · accent: đường kẻ, hoạ tiết.
export type PriceColors = { bg: string; surface: string; primary: string; text: string; accent: string };
export const PRICE_PALETTES: { id: string; label: string; colors: PriceColors }[] = [
  { id: "blush", label: "Hồng phấn", colors: { bg: "#FFF4F4", surface: "#FFFFFF", primary: "#C0395B", text: "#4A2B33", accent: "#F2A7B8" } },
  { id: "nude", label: "Nude", colors: { bg: "#F7EFE7", surface: "#FFFBF7", primary: "#8A5A44", text: "#4B3528", accent: "#D9B8A0" } },
  { id: "rose", label: "Vàng hồng", colors: { bg: "#FFF7F3", surface: "#FFFFFF", primary: "#B76E79", text: "#4A3438", accent: "#E8C1B5" } },
  { id: "noir", label: "Đen vàng", colors: { bg: "#1E1B18", surface: "#2A2622", primary: "#E3C77A", text: "#F3EDE3", accent: "#B8964F" } },
  { id: "sage", label: "Xanh lá", colors: { bg: "#F3F4EC", surface: "#FFFFFF", primary: "#4E6E58", text: "#2F3B32", accent: "#B7C9A8" } },
  { id: "lavender", label: "Oải hương", colors: { bg: "#F6F2FF", surface: "#FFFFFF", primary: "#6D5BA8", text: "#3A3150", accent: "#C9B8F0" } },
  { id: "teal", label: "Xanh ngọc", colors: { bg: "#EEF5F3", surface: "#FFFFFF", primary: "#2F5D62", text: "#22393B", accent: "#A7C4BC" } },
  { id: "plum", label: "Mận vàng", colors: { bg: "#F6F1EA", surface: "#FFFFFF", primary: "#3B2F4A", text: "#3B2F4A", accent: "#C9A96E" } },
  { id: "peach", label: "Cam đào", colors: { bg: "#FFF1E8", surface: "#FFFFFF", primary: "#D2694C", text: "#4A3027", accent: "#F4C5AE" } },
  { id: "mono", label: "Đen trắng", colors: { bg: "#FFFFFF", surface: "#F4F4F4", primary: "#111111", text: "#222222", accent: "#BDBDBD" } },
  { id: "cherry", label: "Đỏ rượu", colors: { bg: "#3A0F1A", surface: "#4A1624", primary: "#F7C6D0", text: "#FBE9ED", accent: "#D9728A" } },
  { id: "sky", label: "Xanh biển", colors: { bg: "#F0F6FF", surface: "#FFFFFF", primary: "#1F3C88", text: "#1E2A4A", accent: "#8EC5FC" } },
  { id: "marble", label: "Đá trắng vàng", colors: { bg: "#F2F0EC", surface: "#FFFFFF", primary: "#B08D57", text: "#3A342E", accent: "#EFD5C9" } },
  { id: "marble-noir", label: "Đá đen vàng", colors: { bg: "#131313", surface: "#1D1D1D", primary: "#D4AF63", text: "#EFE9DF", accent: "#B8914B" } },
  { id: "marble-grey", label: "Đá xám", colors: { bg: "#ECECEC", surface: "#FFFFFF", primary: "#555555", text: "#333333", accent: "#D9D9D9" } },
  { id: "ivory", label: "Kem tối giản", colors: { bg: "#F4F1EC", surface: "#FFFFFF", primary: "#262626", text: "#262626", accent: "#8C8C8C" } },
];
const pal = (id: string) => PRICE_PALETTES.find((p) => p.id === id)!.colors;

// Font chữ thường (chỉ các font có sẵn file nhúng khi tải về).
export type BodyFontId = "montserrat" | "josefin" | "cormorant";
export const BODY_FONTS: { id: BodyFontId; label: string; family: string; weight: number; bold: number; width: number }[] = [
  { id: "montserrat", label: "Montserrat", family: "Montserrat", weight: 500, bold: 700, width: 0.6 },
  { id: "josefin", label: "Josefin", family: "Josefin Sans", weight: 600, bold: 600, width: 0.55 },
  { id: "cormorant", label: "Cormorant", family: "Cormorant Garamond", weight: 600, bold: 600, width: 0.47 },
];
export const bodyFontOf = (id: BodyFontId) => BODY_FONTS.find((f) => f.id === id) ?? BODY_FONTS[0];

export type PriceItem = { name: string; price: string };
export type PriceSection = { title: string; items: PriceItem[] };

// Nội dung mẫu: bảng giá tiệm nail phổ biến (khách tự sửa).
export const SAMPLE_SECTIONS: PriceSection[] = [
  {
    title: "Chăm sóc móng tay",
    items: [
      { name: "Cắt da – sửa form móng", price: "50K" },
      { name: "Sơn thường", price: "70K" },
      { name: "Sơn gel", price: "120K" },
      { name: "Tháo gel / tháo bột", price: "30K" },
    ],
  },
  {
    title: "Nối & đắp móng",
    items: [
      { name: "Úp móng giả + sơn gel", price: "180K" },
      { name: "Đắp bột", price: "250K" },
      { name: "Đắp gel", price: "300K" },
      { name: "Fill móng", price: "150K" },
    ],
  },
  {
    title: "Vẽ & trang trí",
    items: [
      { name: "Vẽ nghệ thuật (1 ngón)", price: "từ 10K" },
      { name: "Đính đá / charm (1 ngón)", price: "từ 15K" },
      { name: "Tráng gương, mắt mèo", price: "50K" },
      { name: "French, ombre", price: "60K" },
    ],
  },
  {
    title: "Chăm sóc chân",
    items: [
      { name: "Ngâm chân thảo dược", price: "60K" },
      { name: "Chà gót chân", price: "80K" },
      { name: "Pedicure spa trọn gói", price: "150K" },
    ],
  },
];

export type PriceDesign = {
  templateId: string;
  style: PriceStyle;
  format: PriceFormatId;
  salon: string;
  heading: string;
  sections: PriceSection[];
  phone: string;
  instagram: string;
  whatsapp: string;
  address: string;
  hours: string;
  headFont: LogoFontId;
  bodyFont: BodyFontId;
  colors: PriceColors;
  decor: LogoIconId;
};

export type PriceTemplate = { id: string; title: string } & Pick<PriceDesign, "style" | "format" | "headFont" | "bodyFont" | "colors" | "decor">;

const t = (
  id: string,
  title: string,
  style: PriceStyle,
  palette: string,
  headFont: LogoFontId,
  bodyFont: BodyFontId,
  decor: LogoIconId,
  format: PriceFormatId = "ig",
): PriceTemplate => ({ id, title, style, colors: pal(palette), headFont, bodyFont, decor, format });

export const PRICE_TEMPLATES: PriceTemplate[] = [
  t("classic-rose", "Cổ điển vàng hồng", "classic", "rose", "playfair", "montserrat", "sparkle", "a4"),
  t("classic-noir", "Cổ điển đen vàng", "classic", "noir", "cormorant", "montserrat", "crown"),
  t("banner-blush", "Băng rôn hồng", "banner", "blush", "greatvibes", "montserrat", "sparkle"),
  t("banner-teal", "Băng rôn xanh ngọc", "banner", "teal", "montserrat", "josefin", "lotus", "a4"),
  t("cards-nude", "Thẻ nude", "cards", "nude", "playfair", "montserrat", "nails"),
  t("cards-lavender", "Thẻ oải hương", "cards", "lavender", "dancing", "montserrat", "butterfly", "a4"),
  t("sidebar-plum", "Cột mận vàng", "sidebar", "plum", "playfair", "montserrat", "diamond", "a4"),
  t("sidebar-peach", "Cột cam đào", "sidebar", "peach", "dancing", "josefin", "flower"),
  t("minimal-mono", "Tối giản đen trắng", "minimal", "mono", "playfair", "montserrat", "sparkle", "a4"),
  t("minimal-sage", "Tối giản xanh lá", "minimal", "sage", "cormorant", "josefin", "laurel"),
  t("arch-rose", "Mái vòm hồng", "arch", "blush", "greatvibes", "montserrat", "flower"),
  t("arch-sky", "Mái vòm xanh biển", "arch", "sky", "playfair", "montserrat", "diamond", "a4"),
  t("frame-nude", "Khung cổ điển", "frame", "nude", "cormorant", "cormorant", "laurel", "a4"),
  t("frame-cherry", "Khung đỏ rượu", "frame", "cherry", "playfair", "montserrat", "sparkle"),
  t("botanical-sage", "Thảo mộc", "botanical", "sage", "dancing", "montserrat", "lotus", "a4"),
  t("botanical-blush", "Hoa hồng phấn", "botanical", "blush", "greatvibes", "montserrat", "flower"),
  t("cards-noir", "Thẻ đen vàng", "cards", "noir", "playfair", "montserrat", "crown", "story"),
  t("banner-lavender", "Băng rôn tím", "banner", "lavender", "playfair", "montserrat", "butterfly", "story"),
  t("classic-peach", "Cổ điển cam đào", "classic", "peach", "dancing", "josefin", "butterfly", "square"),
  t("minimal-teal", "Tối giản xanh ngọc", "minimal", "teal", "montserrat", "montserrat", "polish", "square"),
  // Phong cách đá cẩm thạch, chia đôi tên | giá, và kiểu tạp chí "Nail & Co".
  t("marble-gold", "Đá trắng khung vàng", "marble", "marble", "greatvibes", "cormorant", "sparkle", "a4"),
  t("marble-noir", "Đá đen vân vàng", "marble", "marble-noir", "greatvibes", "montserrat", "sparkle", "rack"),
  t("marble-blush", "Đá trắng hồng phấn", "marble", "rose", "dancing", "montserrat", "flower", "ig"),
  t("marble-grey", "Đá xám tối giản", "marble", "marble-grey", "cormorant", "josefin", "diamond", "a4"),
  t("split-gold", "Chia đôi viền vàng", "split", "marble", "greatvibes", "cormorant", "sparkle", "rack"),
  t("split-noir", "Chia đôi đen vàng", "split", "noir", "playfair", "montserrat", "crown", "ig"),
  t("editorial-ivory", "Tạp chí kem", "editorial", "ivory", "cormorant", "josefin", "sparkle", "a4"),
  t("editorial-blush", "Tạp chí hồng", "editorial", "blush", "playfair", "montserrat", "flower", "a4"),
  t("editorial-sage", "Tạp chí xanh lá", "editorial", "sage", "cormorant", "montserrat", "laurel", "ig"),
  t("editorial-noir", "Tạp chí đen", "editorial", "marble-noir", "playfair", "josefin", "diamond", "a4"),
];

export const DEFAULT_CONTENT = {
  salon: "Rosé Nail Lounge",
  heading: "Bảng giá dịch vụ",
  phone: "0909 123 456",
  instagram: "@rosenail.lounge",
  whatsapp: "0909 123 456",
  address: "12 Nguyễn Trãi, Quận 1",
  hours: "9:00 – 21:00 mỗi ngày",
};

export const priceDesignFrom = (tpl: PriceTemplate, content?: Partial<PriceDesign>): PriceDesign => ({
  templateId: tpl.id,
  style: tpl.style,
  format: tpl.format,
  headFont: tpl.headFont,
  bodyFont: tpl.bodyFont,
  colors: { ...tpl.colors },
  decor: tpl.decor,
  salon: content?.salon ?? DEFAULT_CONTENT.salon,
  heading: content?.heading ?? DEFAULT_CONTENT.heading,
  phone: content?.phone ?? DEFAULT_CONTENT.phone,
  instagram: content?.instagram ?? DEFAULT_CONTENT.instagram,
  whatsapp: content?.whatsapp ?? DEFAULT_CONTENT.whatsapp,
  address: content?.address ?? DEFAULT_CONTENT.address,
  hours: content?.hours ?? DEFAULT_CONTENT.hours,
  sections: content?.sections ?? structuredClone(SAMPLE_SECTIONS),
});
