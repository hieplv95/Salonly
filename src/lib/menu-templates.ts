// Menu bảng giá 2 mặt (A4): mặt trước là nhận diện tiệm (logo, ảnh móng, liên hệ, mã QR, khuyến mãi tuỳ chọn),
// mặt sau là bảng giá đầy đủ. Mỗi mẫu có bố cục mặt trước, kiểu bảng giá, màu và phông riêng (MenuSvg.tsx).

export type MenuItem = { name: string; price: string; desc: string };
export type MenuIcon = "hand" | "foot" | "nail" | "art" | "spa" | "gift" | "eye" | "plus";
export type MenuSection = { title: string; icon: MenuIcon; items: MenuItem[] };
export type MenuQr = { label: string; url: string };

export type MenuDesign = {
  templateId: string;
  salon: string;
  tagline: string;
  logo: string; // ảnh logo tải lên (data URL); trống thì dùng logo chữ của mẫu
  photos: string[]; // ảnh móng tải lên thay ảnh mẫu (tối đa 3)
  promoTitle: string; // VD "KHAI TRƯƠNG" — để trống mức giảm thì ẩn khuyến mãi
  promoDiscount: string;
  promoNote: string;
  highlights: string; // hiện khi không có khuyến mãi, VD "Manicure · Pedicure · Nail art"
  phone: string;
  address: string;
  hours: string; // xuống dòng bằng dấu "|"
  qrs: MenuQr[]; // tối đa 4 mã QR
  title: string; // tiêu đề mặt sau
  sections: MenuSection[]; // tối đa 8 nhóm
  policy: string[];
};

export type FrontLayout = "archHero" | "bigCircle" | "badgeCard" | "photoTop" | "collage" | "split" | "polaroids" | "minimal" | "frame" | "strip";
export type Emblem = "badge" | "script" | "serif" | "ring";
export type BackHead = "serif" | "script" | "big" | "band" | "photo";
export type MenuSectionStyle = "leader" | "cards" | "pill" | "wide" | "numbered" | "icon" | "tags" | "table" | "centered" | "sidebar";
export type MenuTemplate = {
  id: string;
  title: string;
  colors: { bg: string; ink: string; accent: string; soft: string };
  head: readonly [string, number];
  front: FrontLayout;
  emblem: Emblem;
  back: BackHead;
  section: MenuSectionStyle;
  photos: string[]; // 3 ảnh mẫu
  decor?: "frame" | "deco" | "veins" | "leaves" | "sun" | "roses" | "confetti" | "stripes" | "waves" | "dots" | "rings" | "band";
  dark?: boolean;
};

export const MENU_SIZE = { width: 2480, height: 3508, dpi: 300 } as const;

const it = (name: string, price: string, desc = ""): MenuItem => ({ name, price, desc });

export const DEFAULT_MENU: Omit<MenuDesign, "templateId"> = {
  salon: "Luxe Nail Studio",
  tagline: "Nail · Spa · Beauty",
  logo: "",
  photos: [],
  promoTitle: "KHAI TRƯƠNG",
  promoDiscount: "30%",
  promoNote: "Tất cả dịch vụ · 01.10 – 15.10",
  highlights: "Manicure · Pedicure · Nail art · Nối mi",
  phone: "0909 123 456",
  address: "123 Nguyễn Huệ, Quận 1, TP.HCM",
  hours: "T2 – T6: 9:00 – 21:00 | T7 – CN: 8:30 – 21:30",
  qrs: [
    { label: "Facebook", url: "https://facebook.com/luxenail" },
    { label: "WhatsApp", url: "https://wa.me/84909123456" },
    { label: "Đặt lịch", url: "https://luxenail.vn/dat-lich" },
  ],
  title: "BẢNG GIÁ DỊCH VỤ",
  sections: [
    { title: "Chăm sóc móng tay", icon: "hand", items: [it("Cắt da – sửa form", "50K"), it("Sơn thường", "70K"), it("Sơn gel", "120K", "Bền màu 3–4 tuần"), it("Gel mắt mèo / tráng gương", "150K"), it("French gel", "150K")] },
    { title: "Chăm sóc móng chân", icon: "foot", items: [it("Cắt da chân", "60K"), it("Sơn gel chân", "130K"), it("Chà gót chân", "80K"), it("Pedicure spa thảo dược", "150K", "Ngâm, tẩy da chết, massage")] },
    { title: "Nối & đắp móng", icon: "nail", items: [it("Úp móng giả + sơn gel", "180K"), it("Đắp gel tự nhiên", "300K"), it("Đắp bột", "250K"), it("Nối móng Polygel", "350K"), it("Fill móng", "150K")] },
    { title: "Nail art", icon: "art", items: [it("Vẽ nghệ thuật (1 ngón)", "từ 10K"), it("Đính đá / charm", "từ 15K"), it("Ombre, French màu", "60K"), it("Nail 3D / hoa khô", "từ 20K")] },
    { title: "Spa tay & chân", icon: "spa", items: [it("Massage tay 15 phút", "60K"), it("Ủ paraffin", "80K"), it("Tẩy tế bào chết", "70K"), it("Mặt nạ dưỡng ẩm", "50K")] },
    { title: "Combo tiết kiệm", icon: "gift", items: [it("Gel tay + gel chân", "220K", "Tiết kiệm 30K"), it("Đắp gel + vẽ 2 ngón", "380K"), it("Pedicure spa + paraffin", "250K")] },
    { title: "Mi & chân mày", icon: "eye", items: [it("Nối mi classic", "250K"), it("Nối mi volume", "350K"), it("Uốn mi collagen", "150K"), it("Tỉa & định hình mày", "50K")] },
    { title: "Dịch vụ thêm", icon: "plus", items: [it("Sửa 1 móng gãy", "20K"), it("Dưỡng biotin", "40K"), it("Tháo bột / tháo đắp", "50K"), it("Đổi dáng móng", "20K")] },
  ],
  policy: ["Giá có thể thay đổi theo độ dài và mẫu móng", "Có phiếu quà tặng · Bảo hành sơn gel 3 ngày"],
};

const p = (n: string) => `/flyer/photos/${n}.jpg`;
const PLAY = ["Playfair Display", 600] as const;
const PLAY4 = ["Playfair Display", 400] as const;
const CORM = ["Cormorant Garamond", 600] as const;
const FRAUN = ["Fraunces", 900] as const;
const MONT = ["Montserrat", 700] as const;
const OSW = ["Oswald", 500] as const;
const DANC = ["Dancing Script", 700] as const;

const tpl = (t: MenuTemplate) => t;
export const MENU_TEMPLATES: MenuTemplate[] = [
  tpl({ id: "menu-noir-gold", title: "Đen ánh vàng vòm ảnh", colors: { bg: "#17120F", ink: "#F6EEDC", accent: "#C9A56A", soft: "#2A221B" }, head: PLAY4, front: "archHero", emblem: "serif", back: "serif", section: "leader", photos: [p("pexels-34997577"), p("user-gold-glam"), p("pexels-15491629")], decor: "rings", dark: true }),
  tpl({ id: "menu-blush-circle", title: "Hồng vòng ảnh lớn", colors: { bg: "#FDF0F3", ink: "#4A1D3F", accent: "#C2185B", soft: "#F7C9D9" }, head: DANC, front: "bigCircle", emblem: "script", back: "band", section: "pill", photos: [p("pexels-13038494"), p("pexels-17471377"), p("pexels-9775261")], decor: "band" }),
  tpl({ id: "menu-gold-badge", title: "Vàng huy hiệu", colors: { bg: "#FFF6DC", ink: "#5B4520", accent: "#D19A2A", soft: "#FBE3A6" }, head: FRAUN, front: "badgeCard", emblem: "badge", back: "big", section: "icon", photos: [p("pexels-12653044"), p("pexels-6852174"), p("pexels-35533836")], decor: "waves" }),
  tpl({ id: "menu-sage-split", title: "Sage ảnh dọc", colors: { bg: "#F1F4EE", ink: "#2F4A3A", accent: "#6F9A7C", soft: "#DCE8D6" }, head: PLAY, front: "split", emblem: "serif", back: "serif", section: "sidebar", photos: [p("pexels-35440213"), p("pexels-38283820"), p("pexels-5871817")], decor: "leaves" }),
  tpl({ id: "menu-lilac-polaroid", title: "Tím ảnh polaroid", colors: { bg: "#F5F1FB", ink: "#3D3159", accent: "#8E6CC0", soft: "#E3D8F4" }, head: DANC, front: "polaroids", emblem: "script", back: "script", section: "cards", photos: [p("pexels-13038494"), p("pexels-17471377"), p("user-halloween-pink")], decor: "dots" }),
  tpl({ id: "menu-coral-photo", title: "Cam san hô ảnh lớn", colors: { bg: "#FFF3EE", ink: "#2D2845", accent: "#FF6B57", soft: "#FFD3C8" }, head: FRAUN, front: "photoTop", emblem: "badge", back: "big", section: "tags", photos: [p("pexels-6852174"), p("pexels-12653044"), p("pexels-5871817")] }),
  tpl({ id: "menu-marble-frame", title: "Cẩm thạch khung ảnh", colors: { bg: "#F7F5F1", ink: "#3F3A36", accent: "#B89B72", soft: "#ECE5DA" }, head: CORM, front: "frame", emblem: "ring", back: "serif", section: "centered", photos: [p("pexels-13038494"), p("pexels-31642925"), p("pexels-4467861")], decor: "veins" }),
  tpl({ id: "menu-terracotta-strip", title: "Đất nung dải ảnh", colors: { bg: "#F7ECE2", ink: "#5C3328", accent: "#C0654A", soft: "#EFD6C6" }, head: FRAUN, front: "strip", emblem: "serif", back: "band", section: "numbered", photos: [p("pexels-8377206"), p("pexels-6852174"), p("pexels-35533836")], decor: "sun" }),
  tpl({ id: "menu-navy-collage", title: "Navy ảnh ghép", colors: { bg: "#FBF8F2", ink: "#1C2B4A", accent: "#D9A441", soft: "#E8EDF6" }, head: PLAY, front: "collage", emblem: "badge", back: "band", section: "table", photos: [p("pexels-12653044"), p("pexels-34997577"), p("pexels-4467861")] }),
  tpl({ id: "menu-mint-minimal", title: "Bạc hà tối giản", colors: { bg: "#EFF8F5", ink: "#174F4B", accent: "#2FA08C", soft: "#CFEDE4" }, head: MONT, front: "minimal", emblem: "ring", back: "big", section: "pill", photos: [p("pexels-17471377"), p("pexels-38283820"), p("pexels-5871817")], decor: "dots" }),
  tpl({ id: "menu-cherry-badge", title: "Đỏ cherry huy hiệu", colors: { bg: "#FFF6EF", ink: "#4A1020", accent: "#B3202F", soft: "#F6DCD6" }, head: FRAUN, front: "badgeCard", emblem: "badge", back: "big", section: "leader", photos: [p("pexels-15491629"), p("pexels-15491630"), p("pexels-31642925")], decor: "stripes" }),
  tpl({ id: "menu-nude-minimal", title: "Nude tối giản", colors: { bg: "#F6F0E9", ink: "#4A3F37", accent: "#A88468", soft: "#E8DCCF" }, head: CORM, front: "minimal", emblem: "serif", back: "serif", section: "icon", photos: [p("pexels-8377206"), p("pexels-31642925"), p("pexels-35533836")] }),
  tpl({ id: "menu-pink-polaroid", title: "Hồng sticker polaroid", colors: { bg: "#FFF0F6", ink: "#6A1B4D", accent: "#E6358B", soft: "#FFC9E3" }, head: FRAUN, front: "polaroids", emblem: "badge", back: "script", section: "tags", photos: [p("pexels-15491630"), p("user-halloween-pink"), p("pexels-9775261")], decor: "confetti" }),
  tpl({ id: "menu-cocoa-arch", title: "Nâu cacao vòm ảnh", colors: { bg: "#2E211B", ink: "#F3E6D6", accent: "#E0B07A", soft: "#3C2C24" }, head: DANC, front: "archHero", emblem: "script", back: "script", section: "sidebar", photos: [p("pexels-4467861"), p("pexels-31642925"), p("user-gold-glam")], decor: "frame", dark: true }),
  tpl({ id: "menu-ocean-photo", title: "Biển xanh ảnh lớn", colors: { bg: "#F0F7FC", ink: "#0B3C5D", accent: "#1C8ACB", soft: "#D3E8F6" }, head: PLAY, front: "photoTop", emblem: "serif", back: "photo", section: "icon", photos: [p("pexels-12653044"), p("pexels-17471377"), p("pexels-6852174")], decor: "waves" }),
  tpl({ id: "menu-forest-frame", title: "Xanh rừng khung ảnh", colors: { bg: "#1F3A30", ink: "#F3EBD8", accent: "#D6B26A", soft: "#2A4A3E" }, head: PLAY4, front: "frame", emblem: "badge", back: "serif", section: "leader", photos: [p("pexels-35440213"), p("pexels-34997577"), p("user-gold-glam")], decor: "leaves", dark: true }),
  tpl({ id: "menu-rose-circle", title: "Vườn hồng vòng ảnh", colors: { bg: "#FDF4F3", ink: "#6E3945", accent: "#C0707E", soft: "#F4D9DC" }, head: DANC, front: "bigCircle", emblem: "script", back: "script", section: "cards", photos: [p("pexels-9775261"), p("pexels-35440213"), p("pexels-13038494")], decor: "roses" }),
  tpl({ id: "menu-swiss-strip", title: "Đen trắng dải ảnh", colors: { bg: "#F2F0EB", ink: "#111111", accent: "#E63946", soft: "#DAD6CE" }, head: MONT, front: "strip", emblem: "serif", back: "big", section: "numbered", photos: [p("pexels-4467861"), p("pexels-38283820"), p("pexels-15491629")] }),
  tpl({ id: "menu-lavender-split", title: "Oải hương ảnh dọc", colors: { bg: "#F7F4FB", ink: "#3A2F55", accent: "#9677BA", soft: "#E6DDF2" }, head: CORM, front: "split", emblem: "ring", back: "photo", section: "pill", photos: [p("pexels-9775261"), p("pexels-13038494"), p("pexels-17471377")] }),
  tpl({ id: "menu-champagne-collage", title: "Sâm panh ảnh ghép", colors: { bg: "#F8F3E8", ink: "#2A2620", accent: "#B8955A", soft: "#EDE3CF" }, head: OSW, front: "collage", emblem: "ring", back: "serif", section: "table", photos: [p("user-gold-glam"), p("pexels-15491629"), p("pexels-34997577")], decor: "deco" }),
];

export function menuDesignFrom(t: MenuTemplate, content?: Partial<MenuDesign>): MenuDesign {
  const design = { ...DEFAULT_MENU, ...content, templateId: t.id };
  return {
    ...design,
    qrs: design.qrs.map((qr) =>
      qr.label === "Zalo" && qr.url === "https://zalo.me/0909123456"
        ? { label: "WhatsApp", url: "https://wa.me/84909123456" }
        : qr,
    ),
  };
}
