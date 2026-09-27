// Dữ liệu cho tab Logo: font, bảng màu, biểu tượng và các mẫu logo cho tiệm nail.
// Logo vẽ bằng SVG nên chữ luôn đúng dấu tiếng Việt và khách sửa được mọi thứ.

export type LogoFontId = "playfair" | "cormorant" | "greatvibes" | "dancing" | "montserrat" | "josefin" | "didone" | "fraunces" | "oswald" | "pacifico";

// width: bề rộng trung bình 1 ký tự (tính theo cỡ chữ) để ước lượng tự thu nhỏ tên dài.
export const LOGO_FONTS: { id: LogoFontId; label: string; family: string; weight: number; width: number; script?: boolean }[] = [
  { id: "playfair", label: "Playfair", family: "Playfair Display", weight: 600, width: 0.56 },
  { id: "cormorant", label: "Cormorant", family: "Cormorant Garamond", weight: 600, width: 0.48 },
  { id: "greatvibes", label: "Great Vibes", family: "Great Vibes", weight: 400, width: 0.52, script: true },
  { id: "dancing", label: "Dancing", family: "Dancing Script", weight: 700, width: 0.52, script: true },
  { id: "montserrat", label: "Montserrat", family: "Montserrat", weight: 700, width: 0.66 },
  { id: "josefin", label: "Josefin", family: "Josefin Sans", weight: 600, width: 0.58 },
  { id: "didone", label: "Playfair mảnh", family: "Playfair Display", weight: 400, width: 0.55 },
  { id: "fraunces", label: "Fraunces", family: "Fraunces", weight: 900, width: 0.62 },
  { id: "oswald", label: "Oswald", family: "Oswald", weight: 500, width: 0.42 },
  { id: "pacifico", label: "Pacifico", family: "Pacifico", weight: 400, width: 0.58, script: true },
];
export const TAGLINE_FONT = { family: "Montserrat", weight: 500, width: 0.66 };

// signature: logo vẽ riêng theo từng mẫu (xem SignatureLogo.tsx), không dùng biểu tượng chọn được.
export type LogoLayout = "stack" | "row" | "badge" | "monogram" | "editorial" | "arch" | "script" | "line" | "emblem" | "seal" | "boxframe" | "signature";
export const LAYOUT_USES_ICON: Record<LogoLayout, boolean> = {
  stack: true,
  row: true,
  badge: true,
  monogram: false,
  editorial: false,
  arch: true,
  script: true,
  line: true,
  emblem: true,
  seal: true,
  boxframe: true,
  signature: false,
};

export type LogoIconId =
  | "nails" | "polish" | "lotus" | "sparkle" | "crown" | "butterfly" | "flower" | "laurel" | "diamond"
  | "hand" | "foot" | "brush" | "lipstick" | "mirror" | "perfume" | "cream" | "dropper" | "leaf" | "stones"
  | "candle" | "towel" | "rose" | "heart" | "comb" | "scissors" | "file" | "drip" | "eyelash" | "shell"
  | "lineHand" | "polishCutout" | "leafFeet" | "nailFan" | "bottleFlower" | "polishStroke" | "handFootCircle" | "chromeNail" | "spaFoot";
export const LOGO_ICONS: { id: LogoIconId; label: string }[] = [
  { id: "nails", label: "Bộ móng" },
  { id: "polish", label: "Sơn móng" },
  { id: "lotus", label: "Hoa sen" },
  { id: "sparkle", label: "Lấp lánh" },
  { id: "crown", label: "Vương miện" },
  { id: "butterfly", label: "Bướm" },
  { id: "flower", label: "Hoa" },
  { id: "laurel", label: "Vòng nguyệt quế" },
  { id: "diamond", label: "Kim cương" },
  { id: "hand", label: "Bàn tay móng dài" },
  { id: "foot", label: "Bàn chân" },
  { id: "file", label: "Dũa móng" },
  { id: "drip", label: "Sơn chảy giọt" },
  { id: "brush", label: "Cọ trang điểm" },
  { id: "lipstick", label: "Son môi" },
  { id: "eyelash", label: "Mi mắt" },
  { id: "mirror", label: "Gương" },
  { id: "perfume", label: "Nước hoa" },
  { id: "cream", label: "Hũ kem" },
  { id: "dropper", label: "Serum" },
  { id: "leaf", label: "Lá" },
  { id: "stones", label: "Đá spa" },
  { id: "candle", label: "Nến thơm" },
  { id: "towel", label: "Khăn spa" },
  { id: "rose", label: "Hoa hồng" },
  { id: "heart", label: "Trái tim" },
  { id: "comb", label: "Lược" },
  { id: "scissors", label: "Kéo" },
  { id: "shell", label: "Vỏ sò" },
  { id: "lineHand", label: "Bàn tay nét liền" },
  { id: "polishCutout", label: "Chai sơn âm bản" },
  { id: "leafFeet", label: "Móng chân lá xanh" },
  { id: "nailFan", label: "Quạt đầu móng" },
  { id: "bottleFlower", label: "Hoa chai sơn" },
  { id: "polishStroke", label: "Cọ sơn chuyển động" },
  { id: "handFootCircle", label: "Tay và chân" },
  { id: "chromeNail", label: "Móng chrome xanh" },
  { id: "spaFoot", label: "Chăm sóc chân" },
];

export type LogoColors = { primary: string; accent: string; bg: string };
export const LOGO_PALETTES: { id: string; label: string; colors: LogoColors }[] = [
  { id: "rose", label: "Vàng hồng", colors: { primary: "#B76E79", accent: "#E8C1B5", bg: "#FFF7F3" } },
  { id: "blush", label: "Hồng phấn", colors: { primary: "#C0395B", accent: "#F2A7B8", bg: "#FFF0F3" } },
  { id: "nude", label: "Nude", colors: { primary: "#8A5A44", accent: "#D9B8A0", bg: "#FAF3EC" } },
  { id: "plum", label: "Mận vàng", colors: { primary: "#3B2F4A", accent: "#C9A96E", bg: "#F6F1EA" } },
  { id: "sage", label: "Xanh lá", colors: { primary: "#4E6E58", accent: "#B7C9A8", bg: "#F5F3EC" } },
  { id: "teal", label: "Xanh ngọc", colors: { primary: "#2F5D62", accent: "#A7C4BC", bg: "#F2F5F2" } },
  { id: "lavender", label: "Oải hương", colors: { primary: "#6D5BA8", accent: "#C9B8F0", bg: "#F7F4FF" } },
  { id: "noir", label: "Đen vàng", colors: { primary: "#E3C77A", accent: "#B8964F", bg: "#1E1B18" } },
  { id: "peach", label: "Cam đào", colors: { primary: "#D2694C", accent: "#F4C5AE", bg: "#FFF3EC" } },
  { id: "sky", label: "Xanh biển", colors: { primary: "#1F3C88", accent: "#9CC7F5", bg: "#F2F7FF" } },
  { id: "cherry", label: "Đỏ rượu", colors: { primary: "#F7C6D0", accent: "#D9728A", bg: "#3A0F1A" } },
  { id: "mono", label: "Đen trắng", colors: { primary: "#1A1A1A", accent: "#BDBDBD", bg: "#FFFFFF" } },
];

export type LogoDesign = {
  templateId: string;
  layout: LogoLayout;
  name: string;
  tagline: string;
  font: LogoFontId;
  upper: boolean;
  icon: LogoIconId;
  colors: LogoColors;
  transparent: boolean;
  // Người dùng đã tự gõ tên/slogan → giữ lại khi đổi mẫu.
  nameEdited: boolean;
  taglineEdited: boolean;
};

export type LogoTemplate = { id: string; title: string; isNew?: boolean } & Pick<
  LogoDesign,
  "layout" | "name" | "tagline" | "font" | "upper" | "icon" | "colors"
>;

const palette = (id: string) => LOGO_PALETTES.find((p) => p.id === id)!.colors;

// 20 mẫu vẽ riêng (layout "signature", xem SignatureLogo.tsx): hiện ở đầu thư viện, gắn nhãn "Mới".
const draft = (id: string, title: string, font: LogoFontId, upper: boolean, name: string, tagline: string, primary: string, accent: string, bg: string): LogoTemplate => ({
  id, title, isNew: true, layout: "signature", icon: "nails", font, upper, name, tagline, colors: { primary, accent, bg },
});
const SIGNATURE_TEMPLATES: LogoTemplate[] = [
  draft("v2-offset-nail", "Móng tối giản", "cormorant", true, "Élan Nails", "Nail Studio", "#3A2E2A", "#E3B5AC", "#FBF7F4"),
  draft("v2-script-blob", "Chữ ký mềm mại", "greatvibes", false, "Nail Bar", "Manicure Lounge", "#1E1A1A", "#EFC7C2", "#FFF9F7"),
  draft("v2-monogram", "Chữ lồng vòng tròn", "montserrat", true, "Maison Nails", "Nail & Beauty", "#2C2C2C", "#B89B72", "#F7F2EC"),
  draft("v2-flat-bottle", "Chai sơn bóng", "fraunces", false, "Berry Polish", "Gel · Nail Art", "#8C2F4B", "#F4A7B9", "#FDF3F1"),
  draft("v2-retro-arch", "Cầu vồng retro", "fraunces", false, "Sunny Nails", "Est. 2024", "#C9553F", "#F2B880", "#FFF5E8"),
  draft("v2-gold-frame", "Khung vàng nền tối", "didone", true, "Aurum Nails", "Nail Lounge", "#D8BC86", "#8A7550", "#151412"),
  draft("v2-ombre-row", "Năm móng ombre", "montserrat", true, "Ombré Studio", "Manicure · Pedicure", "#3B3355", "#EBBACB", "#FFFFFF"),
  draft("v2-brush-stroke", "Nét cọ quét", "dancing", false, "Brush & Co", "Nail Art Studio", "#2F3A56", "#F29AA3", "#FBF7F2"),
  draft("v2-bottle-i", "Chữ I chai sơn", "oswald", true, "Olivia", "Nail Art Studio", "#1F3566", "#E0322B", "#F8EFE8"),
  draft("v2-round-seal", "Con dấu tròn", "montserrat", true, "Mocha Nails", "Nail & Spa", "#6B4F3F", "#E8D8C8", "#F4EFEA"),
  draft("v2-botanical", "Móng & nhánh lá", "cormorant", true, "Sage Nail Spa", "Natural Nail Care", "#4F6146", "#C9D3B8", "#F6F5EF"),
  draft("v2-drip", "Sơn chảy giọt", "fraunces", false, "Drip Nails", "Gel · Acrylic · Art", "#E0357A", "#FFC2D6", "#FFF6F9"),
  draft("v2-card-row", "Danh thiếp ngang", "playfair", false, "Noir Nail Studio", "Luxury Manicure", "#1D1D1F", "#C9A27E", "#FFFFFF"),
  draft("v2-bow", "Nơ ruy băng", "didone", false, "Coquette Nails", "Nails & Lashes", "#B5475F", "#F7CFD7", "#FFF7F8"),
  draft("v2-cherry", "Quả cherry", "fraunces", false, "Cherry Nails", "Nail Salon", "#B3202F", "#3E7A3A", "#FFF8F1"),
  draft("v2-french", "Móng French", "didone", true, "Le French", "French Manicure", "#2B2B2B", "#F1DDD2", "#FBF8F5"),
  draft("v2-heart", "Trái tim bóng", "pacifico", false, "Love Nails", "Nail Art & Care", "#D63A68", "#FFB3C6", "#FFF3F6"),
  draft("v2-gem", "Viên đá đính", "montserrat", true, "Gem Nail Art", "Nails · Gems · Charms", "#3A4A7A", "#C5D5F2", "#F5F7FC"),
  draft("v2-oval-mirror", "Gương oval cổ điển", "greatvibes", false, "Vintage Beauty", "Nail Parlour", "#7A5C3E", "#D9C1A0", "#F9F4ED"),
  draft("v2-y2k", "Sticker Y2K", "fraunces", false, "Chrome Girls", "Nail Art", "#6A2CC9", "#C6F432", "#F6F1FF"),
];

export const LOGO_TEMPLATES: LogoTemplate[] = [
  ...SIGNATURE_TEMPLATES,
  // 10 mẫu mới nằm ở trang đầu để khách thấy ngay; biểu tượng SVG vẫn sửa tên, màu và tải file được.
  { id: "top-line-hand", title: "Bàn tay nét liền", layout: "stack", icon: "lineHand", font: "playfair", upper: false, name: "Top Nails", tagline: "", colors: { primary: "#553229", accent: "#BF7056", bg: "#FFF9F5" } },
  { id: "top-polish-cutout", title: "Chai sơn âm bản", layout: "stack", icon: "polishCutout", font: "playfair", upper: false, name: "Top Nails", tagline: "", colors: { primary: "#5A1830", accent: "#E8B6BD", bg: "#FFFAF8" } },
  { id: "top-leaf-feet", title: "Móng chân lá xanh", layout: "stack", icon: "leafFeet", font: "cormorant", upper: true, name: "Top Nails", tagline: "", colors: { primary: "#284F3A", accent: "#A9BC9A", bg: "#FBFAF5" } },
  { id: "top-nail-fan", title: "Quạt đầu móng", layout: "stack", icon: "nailFan", font: "josefin", upper: true, name: "Top Nails", tagline: "", colors: { primary: "#8C6370", accent: "#D3A6AF", bg: "#FCF8F7" } },
  { id: "top-bottle-flower", title: "Hoa chai sơn", layout: "stack", icon: "bottleFlower", font: "montserrat", upper: false, name: "Top Nails", tagline: "", colors: { primary: "#193A64", accent: "#F16A7B", bg: "#FFFDF8" } },
  { id: "top-editorial-tn", title: "Chữ lồng TN", layout: "editorial", icon: "nails", font: "playfair", upper: false, name: "Top Nails", tagline: "", colors: { primary: "#472D24", accent: "#BD886D", bg: "#FFF9F5" } },
  { id: "top-polish-stroke", title: "Cọ sơn chuyển động", layout: "stack", icon: "polishStroke", font: "josefin", upper: false, name: "Top Nails", tagline: "", colors: { primary: "#8C1836", accent: "#EB5C83", bg: "#FFF9F8" } },
  { id: "top-hand-foot", title: "Tay và chân", layout: "stack", icon: "handFootCircle", font: "josefin", upper: false, name: "Top Nails", tagline: "", colors: { primary: "#553363", accent: "#C5A8CF", bg: "#FCF9FF" } },
  { id: "top-chrome-nail", title: "Móng chrome xanh", layout: "stack", icon: "chromeNail", font: "montserrat", upper: false, name: "Top Nails", tagline: "", colors: { primary: "#153FA0", accent: "#B9CCE9", bg: "#F8FAFF" } },
  { id: "top-spa-foot", title: "Chăm sóc chân", layout: "stack", icon: "spaFoot", font: "playfair", upper: false, name: "Top Nails", tagline: "", colors: { primary: "#704432", accent: "#D8B99F", bg: "#FFFBF7" } },
  { id: "rose-lounge", title: "Thanh lịch", layout: "stack", icon: "nails", font: "playfair", upper: false, name: "Rosé Nail Lounge", tagline: "Nail & Beauty", colors: palette("rose") },
  { id: "luna-badge", title: "Con dấu tròn", layout: "badge", icon: "lotus", font: "montserrat", upper: true, name: "Luna Nails & Spa", tagline: "Nails · Spa · Beauty", colors: palette("teal") },
  { id: "bella-script", title: "Chữ ký", layout: "script", icon: "sparkle", font: "greatvibes", upper: false, name: "Bella Nails", tagline: "Nail Studio", colors: palette("blush") },
  { id: "velvet-row", title: "Ngang sang trọng", layout: "row", icon: "polish", font: "cormorant", upper: false, name: "Velvet Nail Bar", tagline: "Manicure · Pedicure", colors: palette("plum") },
  { id: "hong-arch", title: "Mái vòm", layout: "arch", icon: "flower", font: "dancing", upper: false, name: "Hồng Nail House", tagline: "Tiệm nail & mi", colors: palette("blush") },
  { id: "aura-mono", title: "Chữ lồng", layout: "monogram", icon: "sparkle", font: "cormorant", upper: true, name: "Aura Nail Studio", tagline: "Luxury Nails", colors: { primary: "#1E1E1E", accent: "#C8A97E", bg: "#FAF7F2" } },
  { id: "gem-emblem", title: "Huy hiệu", layout: "emblem", icon: "diamond", font: "montserrat", upper: true, name: "Gem Nails", tagline: "Nail Art & Care", colors: { primary: "#1F3C88", accent: "#8EC5FC", bg: "#F3F7FF" } },
  { id: "queen-dark", title: "Nền tối hoàng gia", layout: "stack", icon: "crown", font: "playfair", upper: true, name: "Queen Nails", tagline: "Nail Spa", colors: palette("noir") },
  { id: "butterfly-line", title: "Tối giản", layout: "line", icon: "butterfly", font: "josefin", upper: true, name: "Butterfly Nails", tagline: "Nails & Lashes", colors: palette("lavender") },
  { id: "moc-laurel", title: "Mộc mạc", layout: "badge", icon: "laurel", font: "playfair", upper: true, name: "Mộc Nail & Spa", tagline: "Nail · Spa · Thư giãn", colors: palette("sage") },
  // Bộ 20 mẫu thứ hai: biểu tượng móng tay, móng chân, spa, mỹ phẩm.
  { id: "hand-rose", title: "Bàn tay thanh lịch", layout: "stack", icon: "hand", font: "playfair", upper: false, name: "Lumière Hands", tagline: "Nail Art Studio", colors: palette("rose") },
  { id: "foot-teal", title: "Spa chân", layout: "badge", icon: "foot", font: "montserrat", upper: true, name: "Happy Feet Spa", tagline: "Pedicure · Foot Care", colors: palette("teal") },
  { id: "brush-blush", title: "Cọ trang điểm", layout: "script", icon: "brush", font: "greatvibes", upper: false, name: "Glow Beauty", tagline: "Makeup & Nails", colors: palette("blush") },
  { id: "lipstick-plum", title: "Son môi", layout: "row", icon: "lipstick", font: "cormorant", upper: false, name: "Rouge Nail Bar", tagline: "Nails · Makeup", colors: palette("plum") },
  { id: "mirror-nude", title: "Gương soi", layout: "arch", icon: "mirror", font: "dancing", upper: false, name: "Mirror Beauty", tagline: "Làm đẹp trọn gói", colors: palette("nude") },
  { id: "perfume-noir", title: "Nước hoa", layout: "seal", icon: "perfume", font: "playfair", upper: false, name: "Maison Belle", tagline: "Nails & Beauty", colors: palette("noir") },
  { id: "cream-sage", title: "Hũ kem", layout: "emblem", icon: "cream", font: "montserrat", upper: true, name: "Crème Spa", tagline: "Skin · Nails", colors: palette("sage") },
  { id: "dropper-lavender", title: "Serum", layout: "line", icon: "dropper", font: "josefin", upper: true, name: "Serum Lab", tagline: "Chăm sóc da & móng", colors: palette("lavender") },
  { id: "leaf-sage", title: "Lá xanh", layout: "boxframe", icon: "leaf", font: "cormorant", upper: true, name: "Lá Spa", tagline: "Nail · Spa · Thư giãn", colors: palette("sage") },
  { id: "stones-teal", title: "Đá spa", layout: "stack", icon: "stones", font: "montserrat", upper: true, name: "Zen Stones", tagline: "Massage & Spa", colors: palette("teal") },
  { id: "candle-peach", title: "Nến thơm", layout: "seal", icon: "candle", font: "dancing", upper: false, name: "Hương Spa", tagline: "Thư giãn · Làm đẹp", colors: palette("peach") },
  { id: "towel-nude", title: "Khăn spa", layout: "boxframe", icon: "towel", font: "playfair", upper: false, name: "Mộc Beauty", tagline: "Nail & Spa", colors: palette("nude") },
  { id: "rose-cherry", title: "Hoa hồng đỏ", layout: "badge", icon: "rose", font: "playfair", upper: true, name: "Rosa Nails", tagline: "Nails · Lashes · Brows", colors: palette("cherry") },
  { id: "heart-blush", title: "Trái tim", layout: "script", icon: "heart", font: "dancing", upper: false, name: "Love Nails", tagline: "Tiệm nail xinh", colors: palette("blush") },
  { id: "comb-mono", title: "Lược tối giản", layout: "row", icon: "comb", font: "montserrat", upper: true, name: "Comb & Co", tagline: "Hair · Nails", colors: palette("mono") },
  { id: "scissors-noir", title: "Kéo salon", layout: "emblem", icon: "scissors", font: "playfair", upper: true, name: "Sharp Salon", tagline: "Hair & Nails", colors: palette("noir") },
  { id: "file-rose", title: "Dũa móng", layout: "line", icon: "file", font: "josefin", upper: true, name: "File & Polish", tagline: "Manicure Bar", colors: palette("rose") },
  { id: "drip-blush", title: "Sơn chảy giọt", layout: "seal", icon: "drip", font: "montserrat", upper: true, name: "Drip Nails", tagline: "Gel · Acrylic · Art", colors: palette("blush") },
  { id: "eyelash-lavender", title: "Nối mi", layout: "arch", icon: "eyelash", font: "greatvibes", upper: false, name: "Mi Xinh", tagline: "Nối mi · Làm móng", colors: palette("lavender") },
  { id: "shell-sky", title: "Vỏ sò biển", layout: "badge", icon: "shell", font: "cormorant", upper: true, name: "Ocean Nail Spa", tagline: "Nails · Spa · Relax", colors: palette("sky") },
];

export const designFrom = (t: LogoTemplate): LogoDesign => ({
  templateId: t.id,
  layout: t.layout,
  name: t.name,
  tagline: t.tagline,
  font: t.font,
  upper: t.upper,
  icon: t.icon,
  colors: { ...t.colors },
  transparent: false,
  nameEdited: false,
  taglineEdited: false,
});

export const fontOf = (id: LogoFontId) => LOGO_FONTS.find((f) => f.id === id) ?? LOGO_FONTS[0];

