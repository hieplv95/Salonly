// Dữ liệu cho tab Thẻ tích điểm: khổ danh thiếp 3,5×2 inch (ngang/dọc), nội dung mẫu.

export type CardStyle = "minimal" | "signature" | "insta" | "welcome" | "vip" | "marble" | "hearts" | "nude" | "sage" | "boho" | "lineart" | "platinum" | "noirscript" | "editorial" | "heritage" | "skinstudio" | "burgundy" | "midnight" | "clay" | "qrsplit" | "inkline" | "champagne" | "ribbon" | "obsidian" | "botanical" | "rosechip" | "bowlocked" | TrendCardStyle;

// Bộ 20 mẫu thẻ theo xu hướng 2025–2026 (vẽ trong CardTrendSvg).
export const TREND_CARD_STYLES = [
  "jelly-nails", "french-tip", "milk-bath", "bento-grid", "mesh-gradient", "matcha-latte", "strawberry-milk", "tennis-club", "retro-diner", "bauhaus-blocks", "terrazzo", "puffy-bubble", "zen-enso", "disco-ball", "butterfly-y2k", "lace-doily", "sticker-bomb", "sunset-stripes", "polish-swatch", "beauty-passport",
] as const;
export type TrendCardStyle = (typeof TREND_CARD_STYLES)[number];
export const isTrendCardStyle = (style: string): style is TrendCardStyle =>
  (TREND_CARD_STYLES as readonly string[]).includes(style);
export type CardOrientation = "landscape" | "portrait";

// Khung vẽ 300 điểm/inch; tải về ×2 = 600dpi để in thật nét.
export const CARD_SIZES: Record<CardOrientation, { w: number; h: number; label: string }> = {
  landscape: { w: 1050, h: 600, label: "Ngang 3,5×2 inch" },
  portrait: { w: 600, h: 1050, label: "Dọc 2×3,5 inch" },
};
export const CARD_EXPORT_SCALE = 2;
export const CARD_EXPORT_DPI = 600;

// bg: nền thẻ · ink: chữ và nét · accent: ô phần thưởng, điểm nhấn.
export type CardColors = { bg: string; ink: string; accent: string };

export type CardElement = {
  id: string;
  kind: "text" | "instagram";
  side: "front" | "back";
  text: string;
  x: number;
  y: number;
  size: number;
  color: string;
};

export type CardLayerTransform = { x: number; y: number; scale: number };
export type CardLayout = { front: Record<string, CardLayerTransform>; back: Record<string, CardLayerTransform> };

export function cardLayoutFrom(value: unknown): CardLayout {
  const result: CardLayout = { front: {}, back: {} };
  if (!value || typeof value !== "object") return result;
  const source = value as Partial<Record<"front" | "back", unknown>>;
  for (const side of ["front", "back"] as const) {
    const entries = source[side];
    if (!entries || typeof entries !== "object" || Array.isArray(entries)) continue;
    for (const [id, raw] of Object.entries(entries).slice(0, 250)) {
      if (!/^layer-\d+$/.test(id) || !raw || typeof raw !== "object") continue;
      const item = raw as Partial<CardLayerTransform>;
      result[side][id] = {
        x: Number.isFinite(item.x) ? Math.max(-2100, Math.min(2100, item.x!)) : 0,
        y: Number.isFinite(item.y) ? Math.max(-2100, Math.min(2100, item.y!)) : 0,
        scale: Number.isFinite(item.scale) ? Math.max(0.3, Math.min(3, item.scale!)) : 1,
      };
    }
  }
  return result;
}

// Bản thiết kế cũ trong localStorage có thể chưa có lớp nội dung tự thêm.
export function cardElementsFrom(value: unknown): CardElement[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 24).flatMap((item): CardElement[] => {
    if (!item || typeof item !== "object") return [];
    const e = item as Partial<CardElement>;
    if (typeof e.id !== "string" || (e.kind !== "text" && e.kind !== "instagram") || (e.side !== "front" && e.side !== "back")) return [];
    return [{
      id: e.id.slice(0, 80), kind: e.kind, side: e.side,
      text: typeof e.text === "string" ? e.text.slice(0, 80) : "",
      x: Number.isFinite(e.x) ? Math.max(0, Math.min(1050, e.x!)) : 70,
      y: Number.isFinite(e.y) ? Math.max(0, Math.min(1050, e.y!)) : 70,
      size: Number.isFinite(e.size) ? Math.max(14, Math.min(100, e.size!)) : 30,
      color: typeof e.color === "string" && /^#[0-9a-fA-F]{6}$/.test(e.color) ? e.color : "#1F1F1F",
    }];
  });
}

export type CardDesign = {
  templateId: string;
  style: CardStyle;
  orientation: CardOrientation;
  sides: 1 | 2;
  salon: string;
  tagline: string;
  title: string;
  offer: string;
  stamps: number;
  reward: string;
  midAt: number; // 0 = không có quà giữa chừng
  midReward: string;
  memberNo: string;
  valid: string;
  phone: string;
  website: string;
  social: string;
  qr: string; // link cho mã QR (để trống = không in mã QR)
  backTitle: string;
  backLine1: string;
  backLine2: string;
  colors: CardColors;
  elements: CardElement[];
  layout: CardLayout;
};

export type CardBackCopy = Pick<CardDesign, "backTitle" | "backLine1" | "backLine2">;

// Các dòng chữ riêng của mặt sau. Những mẫu còn lại dùng thông tin tiệm / ưu đãi / ô điểm đã có ô sửa riêng.
export const CARD_BACK_COPY: Partial<Record<CardStyle, Partial<CardBackCopy>>> = {
  heritage: { backTitle: "Cảm ơn bạn đã gắn bó", backLine1: "Mỗi lần ghé thăm đều là một niềm vui của chúng tôi", backLine2: "Hẹn gặp lại bạn trong buổi làm đẹp tiếp theo" },
  midnight: { backTitle: "Cảm ơn bạn", backLine1: "đã luôn tỏa sáng" },
  clay: { backTitle: "Cảm ơn bạn", backLine1: "đã dành thời gian cho mình" },
  minimal: { backTitle: "NAIL STUDIO" },
  signature: { backTitle: "NAIL & BEAUTY" },
  insta: { backTitle: "Quét để ghé thăm" },
  welcome: { backTitle: "Cảm ơn", backLine1: "vì đã", backLine2: "gắn bó" },
  marble: { backTitle: "NAIL STUDIO" },
  hearts: { backTitle: "Nâng niu đôi tay" },
  nude: { backTitle: "NAIL STUDIO" },
  sage: { backTitle: "Hẹn bạn ghé thăm" },
  qrsplit: { backTitle: "Quét mã để ghé tiệm" },
  ribbon: { backTitle: "Cùng đẹp hơn mỗi lần ghé", backLine1: "Cảm ơn bạn đã đồng hành cùng tiệm" },
  obsidian: { backTitle: "Mỗi lần ghé, thêm một niềm vui" },
  bowlocked: { backTitle: "Chào mừng vào hội thân thiết", backLine1: "Mỗi lần ghé lại gần hơn một món quà" },
};

export const cardBackCopyFrom = (style: CardStyle): CardBackCopy => ({
  backTitle: CARD_BACK_COPY[style]?.backTitle ?? "",
  backLine1: CARD_BACK_COPY[style]?.backLine1 ?? "",
  backLine2: CARD_BACK_COPY[style]?.backLine2 ?? "",
});

export type CardTemplate = { id: string; title: string; isNew?: boolean } & Pick<CardDesign, "style" | "orientation" | "sides" | "stamps" | "midAt" | "colors">;

export const CARD_TEMPLATES: CardTemplate[] = [
  { id: "minimal-white", title: "Tối giản trắng", style: "minimal", orientation: "landscape", sides: 2, stamps: 10, midAt: 0, colors: { bg: "#FFFFFF", ink: "#1F1F1F", accent: "#1F1F1F" } },
  { id: "qr-split", title: "Mã QR chia đôi", style: "qrsplit", orientation: "landscape", sides: 2, stamps: 9, midAt: 0, colors: { bg: "#E1E0D9", ink: "#292926", accent: "#82836A" } },
  { id: "inkline-card", title: "Chữ tay đen trắng", style: "inkline", orientation: "landscape", sides: 2, stamps: 10, midAt: 0, colors: { bg: "#FFFFFF", ink: "#1D1D1D", accent: "#1D1D1D" } },
  { id: "champagne-foil", title: "Champagne ánh kim", style: "champagne", orientation: "landscape", sides: 2, stamps: 10, midAt: 0, colors: { bg: "#E8E1D3", ink: "#786F63", accent: "#B5A183" } },
  { id: "ribbon-tribe", title: "Nơ và sọc be", style: "ribbon", orientation: "landscape", sides: 2, stamps: 6, midAt: 0, colors: { bg: "#FAF7F2", ink: "#594638", accent: "#D7CEC3" } },
  { id: "obsidian-freebies", title: "Đen tối giản", style: "obsidian", orientation: "landscape", sides: 2, stamps: 10, midAt: 5, colors: { bg: "#090909", ink: "#FFFFFF", accent: "#D5D5D5" } },
  { id: "botanical-ink", title: "Lá mảnh cổ điển", style: "botanical", orientation: "landscape", sides: 2, stamps: 10, midAt: 0, colors: { bg: "#FFFFFF", ink: "#242824", accent: "#728270" } },
  { id: "rose-chip", title: "Thẻ hồng ánh vàng", style: "rosechip", orientation: "landscape", sides: 2, stamps: 10, midAt: 5, colors: { bg: "#F3EAE7", ink: "#342F2E", accent: "#C6A663" } },
  { id: "bow-locked", title: "Nơ hội thân thiết", style: "bowlocked", orientation: "landscape", sides: 2, stamps: 6, midAt: 3, colors: { bg: "#FEFDFC", ink: "#303033", accent: "#DAD8D8" } },
  { id: "heritage-ivory", title: "Cổ điển viền hoa", style: "heritage", orientation: "landscape", sides: 2, stamps: 10, midAt: 0, colors: { bg: "#F8F6F1", ink: "#4B382C", accent: "#A78B67" } },
  { id: "skin-studio", title: "Studio màu be", style: "skinstudio", orientation: "landscape", sides: 2, stamps: 10, midAt: 0, colors: { bg: "#CFC4B4", ink: "#574C43", accent: "#9B8979" } },
  { id: "burgundy-club", title: "Câu lạc bộ đỏ rượu", style: "burgundy", orientation: "landscape", sides: 2, stamps: 10, midAt: 0, colors: { bg: "#F3E7E4", ink: "#70243A", accent: "#9B3D54" } },
  { id: "midnight-hearts", title: "Đêm ánh bạc", style: "midnight", orientation: "landscape", sides: 2, stamps: 6, midAt: 0, colors: { bg: "#0F0E12", ink: "#F6EEF2", accent: "#D6BFCB" } },
  { id: "clay-circles", title: "Nâu cát thanh lịch", style: "clay", orientation: "landscape", sides: 2, stamps: 10, midAt: 0, colors: { bg: "#AB8F75", ink: "#FFF8EF", accent: "#6F523F" } },
  { id: "boho-gold", title: "Boho trái tim vàng", style: "boho", orientation: "landscape", sides: 2, stamps: 10, midAt: 5, colors: { bg: "#D9C8B9", ink: "#49392F", accent: "#E5CD80" } },
  { id: "lineart-ivory", title: "Nét vẽ ngà", style: "lineart", orientation: "landscape", sides: 2, stamps: 10, midAt: 5, colors: { bg: "#F4F0E6", ink: "#292724", accent: "#B36883" } },
  { id: "platinum-pearl", title: "Ánh kim ngọc trai", style: "platinum", orientation: "landscape", sides: 2, stamps: 10, midAt: 5, colors: { bg: "#E9E4D9", ink: "#776D60", accent: "#B69D73" } },
  { id: "noirscript-bw", title: "Chữ ký đen trắng", style: "noirscript", orientation: "landscape", sides: 2, stamps: 6, midAt: 0, colors: { bg: "#FFFFFF", ink: "#151515", accent: "#151515" } },
  { id: "editorial-cream", title: "Biên tập thanh lịch", style: "editorial", orientation: "landscape", sides: 2, stamps: 10, midAt: 0, colors: { bg: "#F8F7F3", ink: "#252320", accent: "#B4A9A4" } },
  { id: "signature-bw", title: "Chữ ký cổ điển", style: "signature", orientation: "landscape", sides: 2, stamps: 10, midAt: 0, colors: { bg: "#FFFFFF", ink: "#111111", accent: "#111111" } },
  { id: "insta-beige", title: "Instagram be", style: "insta", orientation: "portrait", sides: 2, stamps: 9, midAt: 0, colors: { bg: "#D9CCBB", ink: "#5A4636", accent: "#7A5C45" } },
  { id: "welcome-cream", title: "Chào mừng gia đình", style: "welcome", orientation: "portrait", sides: 2, stamps: 8, midAt: 4, colors: { bg: "#EFE8DD", ink: "#2B2724", accent: "#2B2724" } },
  { id: "vip-gold", title: "VIP vàng", style: "vip", orientation: "landscape", sides: 2, stamps: 10, midAt: 5, colors: { bg: "#D8C39A", ink: "#161616", accent: "#161616" } },
  { id: "vip-noir", title: "VIP đen vàng", style: "vip", orientation: "landscape", sides: 2, stamps: 10, midAt: 5, colors: { bg: "#1D1C1A", ink: "#E6CF9A", accent: "#E6CF9A" } },
  { id: "marble-gold", title: "Đá cẩm thạch vàng", style: "marble", orientation: "landscape", sides: 2, stamps: 10, midAt: 0, colors: { bg: "#F4F2EE", ink: "#3A342E", accent: "#B08D57" } },
  { id: "hearts-blush", title: "Trái tim hồng phấn", style: "hearts", orientation: "landscape", sides: 2, stamps: 8, midAt: 4, colors: { bg: "#FCE9ED", ink: "#7A2E45", accent: "#C0395B" } },
  { id: "nude-nails", title: "Nude bộ móng", style: "nude", orientation: "landscape", sides: 2, stamps: 10, midAt: 0, colors: { bg: "#EADBCB", ink: "#5B4332", accent: "#8A5A44" } },
  { id: "sage-arch", title: "Xanh lá mái vòm", style: "sage", orientation: "portrait", sides: 2, stamps: 9, midAt: 0, colors: { bg: "#E7ECE2", ink: "#3C5244", accent: "#6E8B74" } },
  // 20 mẫu xu hướng mới (trang sau).
  { id: "jelly-nails", title: "Thạch jelly bóng", isNew: true, style: "jelly-nails", orientation: "landscape", sides: 2, stamps: 10, midAt: 5, colors: { bg: "#FFE6F0", ink: "#7A1F4B", accent: "#FF5C9A" } },
  { id: "french-tip", title: "French tip viền trắng", isNew: true, style: "french-tip", orientation: "landscape", sides: 2, stamps: 10, midAt: 0, colors: { bg: "#F4E6DC", ink: "#5A3E36", accent: "#C98F7E" } },
  { id: "milk-bath", title: "Milk bath hoa nổi", isNew: true, style: "milk-bath", orientation: "portrait", sides: 2, stamps: 9, midAt: 0, colors: { bg: "#F8F5F0", ink: "#5E5A57", accent: "#EFB3C3" } },
  { id: "bento-grid", title: "Bento ô khối", isNew: true, style: "bento-grid", orientation: "landscape", sides: 2, stamps: 10, midAt: 0, colors: { bg: "#EEECE7", ink: "#1E1E1E", accent: "#FF7A59" } },
  { id: "mesh-gradient", title: "Loang màu mesh", isNew: true, style: "mesh-gradient", orientation: "landscape", sides: 2, stamps: 10, midAt: 5, colors: { bg: "#6C4DF6", ink: "#FFFFFF", accent: "#FFD1E8" } },
  { id: "matcha-latte", title: "Matcha latte", isNew: true, style: "matcha-latte", orientation: "landscape", sides: 2, stamps: 10, midAt: 0, colors: { bg: "#E3E7CF", ink: "#3C4A2A", accent: "#8CA35C" } },
  { id: "strawberry-milk", title: "Sữa dâu", isNew: true, style: "strawberry-milk", orientation: "portrait", sides: 2, stamps: 9, midAt: 0, colors: { bg: "#FFE3EA", ink: "#8B2C45", accent: "#E8476A" } },
  { id: "tennis-club", title: "Câu lạc bộ tennis", isNew: true, style: "tennis-club", orientation: "landscape", sides: 2, stamps: 10, midAt: 5, colors: { bg: "#F3EFE2", ink: "#1F4D3A", accent: "#C9A74F" } },
  { id: "retro-diner", title: "Diner retro Mỹ", isNew: true, style: "retro-diner", orientation: "landscape", sides: 2, stamps: 10, midAt: 0, colors: { bg: "#FFF5E1", ink: "#C8102E", accent: "#1FA39A" } },
  { id: "bauhaus-blocks", title: "Khối màu Bauhaus", isNew: true, style: "bauhaus-blocks", orientation: "landscape", sides: 2, stamps: 10, midAt: 0, colors: { bg: "#F7F1E5", ink: "#1B1B3A", accent: "#FF6B35" } },
  { id: "terrazzo", title: "Đá terrazzo", isNew: true, style: "terrazzo", orientation: "landscape", sides: 2, stamps: 10, midAt: 0, colors: { bg: "#F2EDE6", ink: "#333333", accent: "#E07A5F" } },
  { id: "puffy-bubble", title: "Chữ phồng 3D", isNew: true, style: "puffy-bubble", orientation: "landscape", sides: 2, stamps: 10, midAt: 5, colors: { bg: "#CFE6FF", ink: "#1C3D7A", accent: "#FF8FC7" } },
  { id: "zen-enso", title: "Thiền ensō", isNew: true, style: "zen-enso", orientation: "portrait", sides: 2, stamps: 9, midAt: 0, colors: { bg: "#F1ECE2", ink: "#2A2A2A", accent: "#B5402F" } },
  { id: "disco-ball", title: "Quả cầu disco", isNew: true, style: "disco-ball", orientation: "landscape", sides: 2, stamps: 10, midAt: 0, colors: { bg: "#1B1426", ink: "#F7F2FF", accent: "#D9DEEA" } },
  { id: "butterfly-y2k", title: "Bướm Y2K", isNew: true, style: "butterfly-y2k", orientation: "landscape", sides: 2, stamps: 10, midAt: 5, colors: { bg: "#EEE5FF", ink: "#4B2E83", accent: "#B08CFF" } },
  { id: "lace-doily", title: "Ren doily cổ điển", isNew: true, style: "lace-doily", orientation: "portrait", sides: 2, stamps: 9, midAt: 0, colors: { bg: "#F7EAE6", ink: "#6B4040", accent: "#D8A39D" } },
  { id: "sticker-bomb", title: "Sticker vui nhộn", isNew: true, style: "sticker-bomb", orientation: "landscape", sides: 2, stamps: 10, midAt: 5, colors: { bg: "#FFF4E6", ink: "#222222", accent: "#FF4F8B" } },
  { id: "sunset-stripes", title: "Hoàng hôn retro", isNew: true, style: "sunset-stripes", orientation: "landscape", sides: 2, stamps: 10, midAt: 0, colors: { bg: "#FFE9D6", ink: "#6B2C1A", accent: "#F26B3A" } },
  { id: "polish-swatch", title: "Bảng màu sơn", isNew: true, style: "polish-swatch", orientation: "landscape", sides: 2, stamps: 10, midAt: 0, colors: { bg: "#FFFFFF", ink: "#2A2A2A", accent: "#D6336C" } },
  { id: "beauty-passport", title: "Hộ chiếu làm đẹp", isNew: true, style: "beauty-passport", orientation: "portrait", sides: 2, stamps: 9, midAt: 0, colors: { bg: "#1E3557", ink: "#E7D3A0", accent: "#B8402F" } },
];

export const CARD_CONTENT = {
  salon: "Luxe Nail Studio",
  tagline: "Nail & Beauty",
  title: "Thẻ tích điểm",
  offer: "", // để trống = tự ghi "Làm N-1 lần, tặng lần thứ N"
  reward: "Miễn phí",
  midReward: "-50%",
  memberNo: "0336 5432 1459",
  valid: "12/26",
  phone: "0909 123 456",
  website: "luxenail.vn",
  social: "@luxenailstudio",
  qr: "https://luxenail.vn",
};

export const cardDesignFrom = (t: CardTemplate, content?: Partial<CardDesign>): CardDesign => ({
  ...CARD_CONTENT,
  ...cardBackCopyFrom(t.style),
  ...(content ?? {}),
  templateId: t.id,
  style: t.style,
  orientation: t.orientation,
  sides: t.sides,
  stamps: content?.stamps ?? t.stamps,
  midAt: content?.midAt ?? t.midAt,
  colors: content?.colors ?? { ...t.colors },
  elements: cardElementsFrom(content?.elements),
  layout: cardLayoutFrom(content?.layout),
});
