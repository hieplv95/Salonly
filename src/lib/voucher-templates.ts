// Dữ liệu cho tab Voucher quà tặng: khổ DL 210×99 mm (ngang), 30 mẫu hai mặt.

export const NEW_VOUCHER_STYLES = [
  "lavender-arch", "citrus-rays", "midnight-sky", "pearl-shell", "terracotta-tiles",
  "blueprint", "matcha-orbit", "sakura", "ocean-wave", "postcard",
  "coral-mirror", "emerald-fan", "violet-flow", "daisy-garden", "burgundy-stripe",
  "checker-pop", "linen-stitch", "type-grid", "opal-prism", "espresso-swirls",
] as const;
export type NewVoucherStyle = (typeof NEW_VOUCHER_STYLES)[number];
export const isNewVoucherStyle = (style: string): style is NewVoucherStyle =>
  (NEW_VOUCHER_STYLES as readonly string[]).includes(style);

export type VoucherStyle =
  | "noir"
  | "ribbon"
  | "ticket"
  | "marble"
  | "minimal"
  | "botanical"
  | "split"
  | "deco"
  | "floral"
  | "polish"
  | NewVoucherStyle;

// Khung vẽ 150 điểm/inch; tải về ×2 = 300dpi (2480×1170 px) để in sắc nét.
export const VOUCHER_SIZE = { w: 1240, h: 585, label: "Khổ DL 210×99 mm" };
export const VOUCHER_EXPORT_SCALE = 2;
export const VOUCHER_EXPORT_DPI = 300;

// bg: nền · ink: chữ · accent: điểm nhấn (tiêu đề, trị giá, nơ, khung).
export type VoucherColors = { bg: string; ink: string; accent: string };

export type VoucherDesign = {
  templateId: string;
  style: VoucherStyle;
  salon: string;
  title: string;
  value: string;
  service: string;
  code: string;
  expiry: string;
  phone: string;
  website: string;
  terms: string;
  backHeading: string;
  backLine1: string;
  backLine2: string;
  colors: VoucherColors;
};

export type VoucherTemplate = {
  id: string;
  title: string;
  style: VoucherStyle;
  colors: VoucherColors;
  backHeading: string;
  backLine1: string;
  backLine2: string;
  isNew?: boolean;
};

export const VOUCHER_TEMPLATES: VoucherTemplate[] = [
  { id: "noir-gold", title: "Đen ánh vàng", style: "noir", colors: { bg: "#151412", ink: "#F3EBDD", accent: "#C9A45C" }, backHeading: "Trân quý", backLine1: "Cảm ơn bạn đã chọn một món quà đầy tinh tế.", backLine2: "Mong phút giây này trở thành kỷ niệm thật đẹp." },
  { id: "ribbon-blush", title: "Nơ hồng phấn", style: "ribbon", colors: { bg: "#F6E6E3", ink: "#5E3A3A", accent: "#B76E79" }, backHeading: "Gói yêu thương", backLine1: "Một chiếc nơ nhỏ gói trọn yêu thương.", backLine2: "Cảm ơn vì đã để chúng mình trao gửi điều ấy." },
  { id: "ticket-cream", title: "Vé kem cổ điển", style: "ticket", colors: { bg: "#F3EDE3", ink: "#2E2A26", accent: "#9C7A4F" }, backHeading: "Hẹn gặp bạn", backLine1: "Tấm vé này mở ra một buổi chiều dành riêng cho bạn.", backLine2: "Cảm ơn vì đã trao đi một khoảng thời gian dịu dàng." },
  { id: "marble-gold", title: "Cẩm thạch vàng", style: "marble", colors: { bg: "#F5F3EF", ink: "#3A342E", accent: "#B08D57" }, backHeading: "Lời cảm ơn", backLine1: "Cảm ơn bạn đã để vẻ đẹp bắt đầu từ sự quan tâm.", backLine2: "Hẹn gặp nhau trong một khoảnh khắc thật rạng rỡ." },
  { id: "minimal-white", title: "Tối giản trắng", style: "minimal", colors: { bg: "#FFFFFF", ink: "#1E1E1E", accent: "#1E1E1E" }, backHeading: "Cảm ơn", backLine1: "Cảm ơn vì đã nghĩ đến nhau.", backLine2: "Một món quà nhỏ, một niềm vui dài lâu." },
  { id: "botanical-sage", title: "Lá xanh mái vòm", style: "botanical", colors: { bg: "#E6EBE0", ink: "#34493B", accent: "#6E8B74" }, backHeading: "Thương gửi", backLine1: "Như chiếc lá nâng niu mầm xanh,", backLine2: "cảm ơn bạn đã gieo một ngày thật dịu dàng." },
  { id: "split-mauve", title: "Hai màu tím khói", style: "split", colors: { bg: "#FBF7F4", ink: "#3F2F33", accent: "#7D5A63" }, backHeading: "Từ trái tim", backLine1: "Có những lời thương không cần nói thật nhiều.", backLine2: "Cảm ơn bạn đã chọn cách trao đi bằng hành động." },
  { id: "deco-navy", title: "Art Deco xanh navy", style: "deco", colors: { bg: "#14223B", ink: "#F2E9D8", accent: "#D4AF6A" }, backHeading: "Một lời tri ân", backLine1: "Một lời cảm ơn lấp lánh dành riêng cho bạn.", backLine2: "Mong mỗi phút giây chăm sóc đều thật đáng nhớ." },
  { id: "floral-rose", title: "Hoa hồng cổ điển", style: "floral", colors: { bg: "#EAD3CF", ink: "#5B2F36", accent: "#8E4A55" }, backHeading: "Gửi điều dịu dàng", backLine1: "Gửi bạn một đóa hoa và một lời cảm ơn.", backLine2: "Mong món quà này nở thành niềm vui bất ngờ." },
  { id: "polish-nude", title: "Chai sơn nude", style: "polish", colors: { bg: "#E9DBCD", ink: "#3B2A20", accent: "#A0583A" }, backHeading: "Cảm ơn bạn", backLine1: "Cảm ơn bạn đã thêm sắc màu cho hôm nay.", backLine2: "Hẹn gặp bạn trong một ngày thật xinh." },
  { id: "lavender-arch", title: "Cửa vòm oải hương", style: "lavender-arch", colors: { bg: "#F3EEF8", ink: "#3F3158", accent: "#A98CC6" }, backHeading: "Dành riêng bạn", backLine1: "Một cánh cửa nhỏ mở ra khoảng lặng thật êm.", backLine2: "Cảm ơn vì đã trao nhau phút giây này.", isNew: true },
  { id: "citrus-rays", title: "Nắng cam mùa hè", style: "citrus-rays", colors: { bg: "#FFF3DA", ink: "#5C3428", accent: "#E89048" }, backHeading: "Ngày thêm rực rỡ", backLine1: "Mong món quà này ấm như một tia nắng.", backLine2: "Cảm ơn bạn đã mang niềm vui đến gần hơn.", isNew: true },
  { id: "midnight-sky", title: "Bầu trời sao đêm", style: "midnight-sky", colors: { bg: "#13243F", ink: "#F8F1E5", accent: "#D9BC78" }, backHeading: "Một vì sao nhỏ", backLine1: "Có những điều đẹp nhất chỉ dành cho bạn.", backLine2: "Cảm ơn vì đã làm đêm nay thêm lấp lánh.", isNew: true },
  { id: "pearl-shell", title: "Vỏ sò ngọc trai", style: "pearl-shell", colors: { bg: "#F7F3F1", ink: "#605560", accent: "#CDAFAF" }, backHeading: "Nâng niu", backLine1: "Một chút dịu dàng được cất trong món quà này.", backLine2: "Cảm ơn bạn đã nâng niu người thương.", isNew: true },
  { id: "terracotta-tiles", title: "Gạch đất nung", style: "terracotta-tiles", colors: { bg: "#F5E8D9", ink: "#633E30", accent: "#B76E50" }, backHeading: "Từ mái nhà nhỏ", backLine1: "Món quà mộc mạc mang theo hơi ấm.", backLine2: "Cảm ơn bạn đã chọn niềm vui thật gần.", isNew: true },
  { id: "blueprint", title: "Bản vẽ xanh cobalt", style: "blueprint", colors: { bg: "#EAF1F7", ink: "#173D68", accent: "#3675A6" }, backHeading: "Được thiết kế cho bạn", backLine1: "Từng phút chăm sóc đều dành riêng cho bạn.", backLine2: "Cảm ơn đã để chúng mình góp một nét đẹp.", isNew: true },
  { id: "matcha-orbit", title: "Quỹ đạo matcha", style: "matcha-orbit", colors: { bg: "#E9EAD8", ink: "#334632", accent: "#788B5D" }, backHeading: "Thật bình yên", backLine1: "Một vòng tròn nhỏ của niềm vui giản dị.", backLine2: "Cảm ơn bạn đã đến và ở lại cùng chúng mình.", isNew: true },
  { id: "sakura", title: "Cành anh đào", style: "sakura", colors: { bg: "#FFF5F4", ink: "#68414B", accent: "#D88FA7" }, backHeading: "Mùa hoa nở", backLine1: "Ước cho bạn luôn rạng rỡ như hoa đầu mùa.", backLine2: "Cảm ơn vì một lần gặp gỡ thật đẹp.", isNew: true },
  { id: "ocean-wave", title: "Sóng biển xanh", style: "ocean-wave", colors: { bg: "#EDF7F6", ink: "#214C53", accent: "#428A91" }, backHeading: "Gửi chút an yên", backLine1: "Để mọi muộn phiền trôi nhẹ theo con sóng.", backLine2: "Cảm ơn bạn đã ghé bờ bình yên này.", isNew: true },
  { id: "postcard", title: "Bưu thiếp vintage", style: "postcard", colors: { bg: "#F6F0E4", ink: "#453C32", accent: "#A67D57" }, backHeading: "Một tấm thiệp xa", backLine1: "Gửi bạn lời thương qua một tấm bưu thiếp.", backLine2: "Cảm ơn vì đã nhớ tới người mình yêu quý.", isNew: true },
  { id: "coral-mirror", title: "Gương san hô", style: "coral-mirror", colors: { bg: "#FBEAE5", ink: "#683C39", accent: "#D67E73" }, backHeading: "Bạn thật đẹp", backLine1: "Trong chiếc gương này có một người rất đặc biệt.", backLine2: "Cảm ơn vì đã luôn yêu thương chính mình.", isNew: true },
  { id: "emerald-fan", title: "Quạt lụa ngọc lục", style: "emerald-fan", colors: { bg: "#E7EEE9", ink: "#184B3B", accent: "#4C8A70" }, backHeading: "Một làn gió lành", backLine1: "Gửi bạn chút mát lành giữa ngày bận rộn.", backLine2: "Cảm ơn đã cho mình dịp chăm sóc bạn.", isNew: true },
  { id: "violet-flow", title: "Dải lụa tím", style: "violet-flow", colors: { bg: "#EEE9F5", ink: "#4C3A65", accent: "#8F72B0" }, backHeading: "Mềm như mây", backLine1: "Mong mọi điều đến với bạn thật nhẹ nhàng.", backLine2: "Cảm ơn vì đã gửi gắm một điều ngọt ngào.", isNew: true },
  { id: "daisy-garden", title: "Vườn cúc trắng", style: "daisy-garden", colors: { bg: "#FFF8E5", ink: "#4A5136", accent: "#E4AC38" }, backHeading: "Nở một nụ cười", backLine1: "Một bông hoa nhỏ thay cho lời cảm ơn lớn.", backLine2: "Chúc bạn một ngày sáng trong và vui vẻ.", isNew: true },
  { id: "burgundy-stripe", title: "Sọc đỏ rượu", style: "burgundy-stripe", colors: { bg: "#F6E8E5", ink: "#57252E", accent: "#963D50" }, backHeading: "Thương mến", backLine1: "Mỗi đường nét đều mang theo sự trân quý.", backLine2: "Cảm ơn đã chọn một món quà thật có lòng.", isNew: true },
  { id: "checker-pop", title: "Ô vuông hồng retro", style: "checker-pop", colors: { bg: "#FFEDE9", ink: "#632F40", accent: "#C66177" }, backHeading: "Niềm vui bé xíu", backLine1: "Bật mở món quà, bật sáng một nụ cười.", backLine2: "Cảm ơn đã làm ngày thường thêm đáng yêu.", isNew: true },
  { id: "linen-stitch", title: "Vải lanh thêu chỉ", style: "linen-stitch", colors: { bg: "#EEE5D7", ink: "#51483D", accent: "#9B8061" }, backHeading: "Khâu từng lời thương", backLine1: "Một đường kim nhỏ, một lời cảm ơn chân thành.", backLine2: "Mong món quà ở lại thật lâu trong ký ức.", isNew: true },
  { id: "type-grid", title: "Chữ đen kẻ ô", style: "type-grid", colors: { bg: "#F6F5F2", ink: "#1F1F1F", accent: "#636363" }, backHeading: "Dành cho bạn", backLine1: "Một khoảng nghỉ xứng đáng với bạn.", backLine2: "Cảm ơn đã để chúng mình chăm chút khoảnh khắc ấy.", isNew: true },
  { id: "opal-prism", title: "Lăng kính opal", style: "opal-prism", colors: { bg: "#F1F5F4", ink: "#455A61", accent: "#A8B8BD" }, backHeading: "Lấp lánh riêng bạn", backLine1: "Mỗi góc nhìn đều có một vẻ đẹp rất riêng.", backLine2: "Cảm ơn đã cùng chúng mình khám phá điều ấy.", isNew: true },
  { id: "espresso-swirls", title: "Vòng xoáy cà phê", style: "espresso-swirls", colors: { bg: "#F3E9DF", ink: "#4B3429", accent: "#A16D4B" }, backHeading: "Một chiều thật êm", backLine1: "Như tách cà phê ấm trong một ngày thong thả.", backLine2: "Cảm ơn vì đã dành thời gian cho yêu thương.", isNew: true },
];

export const VOUCHER_CONTENT = {
  salon: "Luxe Nail Studio",
  title: "Phiếu quà tặng",
  value: "500.000đ",
  service: "Áp dụng cho tất cả dịch vụ nail & spa",
  code: "0001",
  expiry: "31/12/2026",
  phone: "0909 123 456",
  website: "luxenail.vn",
  terms: "Không quy đổi thành tiền mặt · Vui lòng đặt lịch trước",
};

export const voucherDesignFrom = (t: VoucherTemplate, content?: Partial<VoucherDesign>): VoucherDesign => ({
  ...VOUCHER_CONTENT,
  ...(content ?? {}),
  backHeading: content?.backHeading ?? t.backHeading,
  backLine1: content?.backLine1 ?? t.backLine1,
  backLine2: content?.backLine2 ?? t.backLine2,
  templateId: t.id,
  style: t.style,
  colors: { ...t.colors },
});
