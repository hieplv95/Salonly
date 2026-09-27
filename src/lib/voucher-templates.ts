// Dữ liệu cho tab Voucher quà tặng: khổ DL 210×99 mm (ngang), 50 mẫu hai mặt.

export const NEW_VOUCHER_STYLES = [
  "lavender-arch", "citrus-rays", "midnight-sky", "pearl-shell", "terracotta-tiles",
  "blueprint", "matcha-orbit", "sakura", "ocean-wave", "postcard",
  "coral-mirror", "emerald-fan", "violet-flow", "daisy-garden", "burgundy-stripe",
  "checker-pop", "linen-stitch", "type-grid", "opal-prism", "espresso-swirls",
] as const;
export type NewVoucherStyle = (typeof NEW_VOUCHER_STYLES)[number];
export const isNewVoucherStyle = (style: string): style is NewVoucherStyle =>
  (NEW_VOUCHER_STYLES as readonly string[]).includes(style);

// Bộ 20 mẫu theo xu hướng thiết kế 2025–2026 (vẽ trong VoucherTrendSvg).
export const TREND_VOUCHER_STYLES = [
  "chrome-y2k", "mocha-mousse", "butter-scallop", "aura-glow", "neo-brutal",
  "coquette-bow", "glass-frost", "groovy-wave", "cherry-bomb", "old-money",
  "leopard-luxe", "tortoise-shell", "polka-dot", "boarding-pass", "receipt",
  "wax-seal", "gingham-picnic", "editorial-swiss", "cat-eye-velvet", "glazed-pearl",
] as const;
export type TrendVoucherStyle = (typeof TREND_VOUCHER_STYLES)[number];
export const isTrendVoucherStyle = (style: string): style is TrendVoucherStyle =>
  (TREND_VOUCHER_STYLES as readonly string[]).includes(style);

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
  | NewVoucherStyle
  | TrendVoucherStyle;

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
  { id: "lavender-arch", title: "Cửa vòm oải hương", style: "lavender-arch", colors: { bg: "#F3EEF8", ink: "#3F3158", accent: "#A98CC6" }, backHeading: "Dành riêng bạn", backLine1: "Một cánh cửa nhỏ mở ra khoảng lặng thật êm.", backLine2: "Cảm ơn vì đã trao nhau phút giây này." },
  { id: "citrus-rays", title: "Nắng cam mùa hè", style: "citrus-rays", colors: { bg: "#FFF3DA", ink: "#5C3428", accent: "#E89048" }, backHeading: "Ngày thêm rực rỡ", backLine1: "Mong món quà này ấm như một tia nắng.", backLine2: "Cảm ơn bạn đã mang niềm vui đến gần hơn." },
  { id: "midnight-sky", title: "Bầu trời sao đêm", style: "midnight-sky", colors: { bg: "#13243F", ink: "#F8F1E5", accent: "#D9BC78" }, backHeading: "Một vì sao nhỏ", backLine1: "Có những điều đẹp nhất chỉ dành cho bạn.", backLine2: "Cảm ơn vì đã làm đêm nay thêm lấp lánh." },
  { id: "pearl-shell", title: "Vỏ sò ngọc trai", style: "pearl-shell", colors: { bg: "#F7F3F1", ink: "#605560", accent: "#CDAFAF" }, backHeading: "Nâng niu", backLine1: "Một chút dịu dàng được cất trong món quà này.", backLine2: "Cảm ơn bạn đã nâng niu người thương." },
  { id: "terracotta-tiles", title: "Gạch đất nung", style: "terracotta-tiles", colors: { bg: "#F5E8D9", ink: "#633E30", accent: "#B76E50" }, backHeading: "Từ mái nhà nhỏ", backLine1: "Món quà mộc mạc mang theo hơi ấm.", backLine2: "Cảm ơn bạn đã chọn niềm vui thật gần." },
  { id: "blueprint", title: "Bản vẽ xanh cobalt", style: "blueprint", colors: { bg: "#EAF1F7", ink: "#173D68", accent: "#3675A6" }, backHeading: "Được thiết kế cho bạn", backLine1: "Từng phút chăm sóc đều dành riêng cho bạn.", backLine2: "Cảm ơn đã để chúng mình góp một nét đẹp." },
  { id: "matcha-orbit", title: "Quỹ đạo matcha", style: "matcha-orbit", colors: { bg: "#E9EAD8", ink: "#334632", accent: "#788B5D" }, backHeading: "Thật bình yên", backLine1: "Một vòng tròn nhỏ của niềm vui giản dị.", backLine2: "Cảm ơn bạn đã đến và ở lại cùng chúng mình." },
  { id: "sakura", title: "Cành anh đào", style: "sakura", colors: { bg: "#FFF5F4", ink: "#68414B", accent: "#D88FA7" }, backHeading: "Mùa hoa nở", backLine1: "Ước cho bạn luôn rạng rỡ như hoa đầu mùa.", backLine2: "Cảm ơn vì một lần gặp gỡ thật đẹp." },
  { id: "ocean-wave", title: "Sóng biển xanh", style: "ocean-wave", colors: { bg: "#EDF7F6", ink: "#214C53", accent: "#428A91" }, backHeading: "Gửi chút an yên", backLine1: "Để mọi muộn phiền trôi nhẹ theo con sóng.", backLine2: "Cảm ơn bạn đã ghé bờ bình yên này." },
  { id: "postcard", title: "Bưu thiếp vintage", style: "postcard", colors: { bg: "#F6F0E4", ink: "#453C32", accent: "#A67D57" }, backHeading: "Một tấm thiệp xa", backLine1: "Gửi bạn lời thương qua một tấm bưu thiếp.", backLine2: "Cảm ơn vì đã nhớ tới người mình yêu quý." },
  { id: "coral-mirror", title: "Gương san hô", style: "coral-mirror", colors: { bg: "#FBEAE5", ink: "#683C39", accent: "#D67E73" }, backHeading: "Bạn thật đẹp", backLine1: "Trong chiếc gương này có một người rất đặc biệt.", backLine2: "Cảm ơn vì đã luôn yêu thương chính mình." },
  { id: "emerald-fan", title: "Quạt lụa ngọc lục", style: "emerald-fan", colors: { bg: "#E7EEE9", ink: "#184B3B", accent: "#4C8A70" }, backHeading: "Một làn gió lành", backLine1: "Gửi bạn chút mát lành giữa ngày bận rộn.", backLine2: "Cảm ơn đã cho mình dịp chăm sóc bạn." },
  { id: "violet-flow", title: "Dải lụa tím", style: "violet-flow", colors: { bg: "#EEE9F5", ink: "#4C3A65", accent: "#8F72B0" }, backHeading: "Mềm như mây", backLine1: "Mong mọi điều đến với bạn thật nhẹ nhàng.", backLine2: "Cảm ơn vì đã gửi gắm một điều ngọt ngào." },
  { id: "daisy-garden", title: "Vườn cúc trắng", style: "daisy-garden", colors: { bg: "#FFF8E5", ink: "#4A5136", accent: "#E4AC38" }, backHeading: "Nở một nụ cười", backLine1: "Một bông hoa nhỏ thay cho lời cảm ơn lớn.", backLine2: "Chúc bạn một ngày sáng trong và vui vẻ." },
  { id: "burgundy-stripe", title: "Sọc đỏ rượu", style: "burgundy-stripe", colors: { bg: "#F6E8E5", ink: "#57252E", accent: "#963D50" }, backHeading: "Thương mến", backLine1: "Mỗi đường nét đều mang theo sự trân quý.", backLine2: "Cảm ơn đã chọn một món quà thật có lòng." },
  { id: "checker-pop", title: "Ô vuông hồng retro", style: "checker-pop", colors: { bg: "#FFEDE9", ink: "#632F40", accent: "#C66177" }, backHeading: "Niềm vui bé xíu", backLine1: "Bật mở món quà, bật sáng một nụ cười.", backLine2: "Cảm ơn đã làm ngày thường thêm đáng yêu." },
  { id: "linen-stitch", title: "Vải lanh thêu chỉ", style: "linen-stitch", colors: { bg: "#EEE5D7", ink: "#51483D", accent: "#9B8061" }, backHeading: "Khâu từng lời thương", backLine1: "Một đường kim nhỏ, một lời cảm ơn chân thành.", backLine2: "Mong món quà ở lại thật lâu trong ký ức." },
  { id: "type-grid", title: "Chữ đen kẻ ô", style: "type-grid", colors: { bg: "#F6F5F2", ink: "#1F1F1F", accent: "#636363" }, backHeading: "Dành cho bạn", backLine1: "Một khoảng nghỉ xứng đáng với bạn.", backLine2: "Cảm ơn đã để chúng mình chăm chút khoảnh khắc ấy." },
  { id: "opal-prism", title: "Lăng kính opal", style: "opal-prism", colors: { bg: "#F1F5F4", ink: "#455A61", accent: "#A8B8BD" }, backHeading: "Lấp lánh riêng bạn", backLine1: "Mỗi góc nhìn đều có một vẻ đẹp rất riêng.", backLine2: "Cảm ơn đã cùng chúng mình khám phá điều ấy." },
  { id: "espresso-swirls", title: "Vòng xoáy cà phê", style: "espresso-swirls", colors: { bg: "#F3E9DF", ink: "#4B3429", accent: "#A16D4B" }, backHeading: "Một chiều thật êm", backLine1: "Như tách cà phê ấm trong một ngày thong thả.", backLine2: "Cảm ơn vì đã dành thời gian cho yêu thương." },
  { id: "chrome-y2k", title: "Chrome bạc Y2K", style: "chrome-y2k", colors: { bg: "#101014", ink: "#F4F5F8", accent: "#C8CDD6" }, backHeading: "Lấp lánh riêng bạn", backLine1: "Một chút ánh bạc cho ngày thêm rực rỡ.", backLine2: "Cảm ơn vì đã chọn tỏa sáng theo cách của mình.", isNew: true },
  { id: "mocha-mousse", title: "Mocha Mousse", style: "mocha-mousse", colors: { bg: "#A47864", ink: "#FFF6EE", accent: "#F1E2D2" }, backHeading: "Ấm áp", backLine1: "Như tách mocha thơm giữa một ngày dịu nhẹ.", backLine2: "Cảm ơn bạn đã dành chút thời gian cho mình.", isNew: true },
  { id: "butter-scallop", title: "Vàng bơ viền sò", style: "butter-scallop", colors: { bg: "#FFF0B5", ink: "#5A4A1C", accent: "#E4BE4F" }, backHeading: "Ngọt như bơ", backLine1: "Một món quà nhỏ, mềm mại và thật đáng yêu.", backLine2: "Chúc bạn một ngày vàng ươm niềm vui.", isNew: true },
  { id: "aura-glow", title: "Aura hào quang", style: "aura-glow", colors: { bg: "#F5F0FA", ink: "#2B2340", accent: "#9D7CE8" }, backHeading: "Năng lượng tốt", backLine1: "Gửi bạn một vầng sáng dịu dàng và bình yên.", backLine2: "Mong mọi điều tốt đẹp luôn tìm đến bạn.", isNew: true },
  { id: "neo-brutal", title: "Neo-brutalism rực màu", style: "neo-brutal", colors: { bg: "#FFF4DE", ink: "#111111", accent: "#FF5C39" }, backHeading: "Quà xịn cho bạn!", backLine1: "Không cần lý do, chỉ cần bạn vui là đủ.", backLine2: "Đặt lịch ngay và tận hưởng thôi nào.", isNew: true },
  { id: "coquette-bow", title: "Nơ coquette", style: "coquette-bow", colors: { bg: "#FCE9EF", ink: "#6E3B4C", accent: "#E597AE" }, backHeading: "Gửi người thương", backLine1: "Một chiếc nơ xinh gói trọn lời yêu thương.", backLine2: "Mong bạn luôn dịu dàng và rạng rỡ.", isNew: true },
  { id: "glass-frost", title: "Kính mờ pastel", style: "glass-frost", colors: { bg: "#DDE5F4", ink: "#1E2A45", accent: "#6D7CFF" }, backHeading: "Trong trẻo", backLine1: "Một khoảng thư giãn trong veo dành cho bạn.", backLine2: "Cảm ơn vì đã để chúng mình chăm chút.", isNew: true },
  { id: "groovy-wave", title: "Groovy thập niên 70", style: "groovy-wave", colors: { bg: "#F8E7C9", ink: "#4A2412", accent: "#E2572B" }, backHeading: "Good vibes only", backLine1: "Thả lỏng, chill một chút và làm đẹp thôi.", backLine2: "Cảm ơn bạn đã mang năng lượng vui đến tiệm.", isNew: true },
  { id: "cherry-bomb", title: "Cherry đỏ", style: "cherry-bomb", colors: { bg: "#FFF5EF", ink: "#6E0F1D", accent: "#D7263D" }, backHeading: "Ngọt lịm tim", backLine1: "Món quà ngọt như trái cherry đầu mùa.", backLine2: "Cảm ơn vì đã khiến ngày thường thêm đáng yêu.", isNew: true },
  { id: "old-money", title: "Old money sang trọng", style: "old-money", colors: { bg: "#F3EEE2", ink: "#1E3B2F", accent: "#B39556" }, backHeading: "Trân trọng kính tặng", backLine1: "Một trải nghiệm tinh tế dành cho người đặc biệt.", backLine2: "Rất hân hạnh được phục vụ quý khách.", isNew: true },
  { id: "leopard-luxe", title: "Da báo quyến rũ", style: "leopard-luxe", colors: { bg: "#EAD5B3", ink: "#24170E", accent: "#8A5A2E" }, backHeading: "Tự tin tỏa sáng", backLine1: "Dành cho người luôn biết mình đẹp nhất.", backLine2: "Cảm ơn bạn đã chọn phong cách của riêng mình.", isNew: true },
  { id: "tortoise-shell", title: "Đồi mồi hổ phách", style: "tortoise-shell", colors: { bg: "#F7EDE0", ink: "#3B2313", accent: "#B06A2C" }, backHeading: "Cổ điển mà chất", backLine1: "Nét đẹp không bao giờ lỗi mốt dành cho bạn.", backLine2: "Cảm ơn đã cùng chúng mình giữ gìn vẻ đẹp.", isNew: true },
  { id: "polka-dot", title: "Chấm bi cổ điển", style: "polka-dot", colors: { bg: "#FBF7F0", ink: "#1E2440", accent: "#1E2440" }, backHeading: "Vui như chấm bi", backLine1: "Từng chấm nhỏ là từng niềm vui gửi tới bạn.", backLine2: "Hẹn gặp bạn trong một ngày thật xinh.", isNew: true },
  { id: "boarding-pass", title: "Vé máy bay", style: "boarding-pass", colors: { bg: "#F3F6FA", ink: "#16213E", accent: "#F2784B" }, backHeading: "Chuyến bay thư giãn", backLine1: "Điểm đến: một buổi chăm sóc thật trọn vẹn.", backLine2: "Chúc bạn một hành trình nhẹ nhàng và vui vẻ.", isNew: true },
  { id: "receipt", title: "Hoá đơn tối giản", style: "receipt", colors: { bg: "#E7E2DA", ink: "#1C1C1C", accent: "#6B6B6B" }, backHeading: "Cảm ơn quý khách", backLine1: "Hoá đơn này đã được thanh toán bằng yêu thương.", backLine2: "Hẹn gặp lại bạn ở lần làm đẹp tới.", isNew: true },
  { id: "wax-seal", title: "Thư sáp niêm phong", style: "wax-seal", colors: { bg: "#F1E7D6", ink: "#3A2A1E", accent: "#8E1F2F" }, backHeading: "Thư tay gửi bạn", backLine1: "Một lá thư nhỏ niêm phong cả tấm chân tình.", backLine2: "Mong món quà mang đến cho bạn nụ cười.", isNew: true },
  { id: "gingham-picnic", title: "Caro gingham picnic", style: "gingham-picnic", colors: { bg: "#FFFFFF", ink: "#1F3B5C", accent: "#7EA9DB" }, backHeading: "Một ngày dã ngoại", backLine1: "Nhẹ nhàng, tươi mới như buổi picnic cuối tuần.", backLine2: "Cảm ơn bạn đã ghé chơi cùng chúng mình.", isNew: true },
  { id: "editorial-swiss", title: "Tạp chí Swiss", style: "editorial-swiss", colors: { bg: "#F1EEE8", ink: "#111111", accent: "#E63312" }, backHeading: "Trang bìa của bạn", backLine1: "Bạn xứng đáng là nhân vật chính hôm nay.", backLine2: "Cảm ơn đã để chúng mình góp một trang đẹp.", isNew: true },
  { id: "cat-eye-velvet", title: "Móng mắt mèo nhung", style: "cat-eye-velvet", colors: { bg: "#1C1030", ink: "#F4ECFF", accent: "#C6A6FF" }, backHeading: "Ánh nhìn mê hoặc", backLine1: "Lấp lánh như bộ móng mắt mèo dưới ánh đèn.", backLine2: "Cảm ơn bạn đã cho chúng mình tỏa sáng cùng.", isNew: true },
  { id: "glazed-pearl", title: "Glazed ngọc trai", style: "glazed-pearl", colors: { bg: "#FBF4EF", ink: "#4E3F47", accent: "#D8B4C2" }, backHeading: "Láng mịn như ngọc", backLine1: "Một lớp óng ánh cho đôi tay thêm xinh.", backLine2: "Cảm ơn bạn đã yêu thương chính mình.", isNew: true },
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
