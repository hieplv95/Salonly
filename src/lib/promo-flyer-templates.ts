// Tờ rơi quảng cáo khổ A4 (khai trương, giảm giá): nhiều nội dung — bảng giá dịch vụ, quà tặng, liên hệ.
// Mỗi mẫu có bố cục riêng (PromoFlyerSvg.tsx); mặt sau là bảng giá đầy đủ cùng phong cách. Nội dung khách tự sửa được.
import type { PriceSection } from "./price-templates";

export type PromoOffer = { name: string; old: string; now: string };

export type PromoFlyerDesign = {
  templateId: string;
  salon: string;
  eyebrow: string; // dòng nhỏ trên tiêu đề
  headline: string;
  subhead: string;
  discount: string; // VD "30%"
  discountLabel: string;
  offers: PromoOffer[]; // tối đa 6 dịch vụ
  perks: string[]; // tối đa 3 quà tặng
  dates: string;
  hours: string;
  address: string;
  phone: string;
  social: string;
  note: string;
  // Mặt sau: bảng giá đầy đủ.
  backTitle: string;
  backNote: string;
  menu: PriceSection[]; // tối đa 4 nhóm, mỗi nhóm tối đa 8 dịch vụ
};

export type PromoColors = { bg: string; ink: string; accent: string; soft: string };
export type PromoFlyerTemplate = {
  id: string;
  title: string;
  kind: "open" | "sale";
  colors: PromoColors;
  photo?: string;
  content: Partial<PromoFlyerDesign>;
};

export const PROMO_SIZE = { width: 2480, height: 3508, dpi: 300 } as const; // A4 300dpi; khung vẽ 600×849

export const DEFAULT_PROMO: Omit<PromoFlyerDesign, "templateId"> = {
  salon: "Luxe Nail Studio",
  eyebrow: "GRAND OPENING",
  headline: "KHAI TRƯƠNG",
  subhead: "Ưu đãi lớn mừng ngày đầu mở cửa",
  discount: "30%",
  discountLabel: "GIẢM GIÁ TẤT CẢ DỊCH VỤ",
  offers: [
    { name: "Sơn gel trơn", old: "150K", now: "99K" },
    { name: "Đắp gel tự nhiên", old: "350K", now: "245K" },
    { name: "Vẽ nail nghệ thuật", old: "200K", now: "140K" },
    { name: "Chăm sóc da tay", old: "120K", now: "79K" },
    { name: "Pedicure spa thảo dược", old: "180K", now: "119K" },
    { name: "Nối mi classic", old: "250K", now: "175K" },
  ],
  perks: ["Tặng sơn dưỡng miễn phí", "Voucher 50K cho lần sau", "Trà & bánh ngọt miễn phí"],
  dates: "01.10 – 15.10.2026",
  hours: "9:00 – 21:00 mỗi ngày",
  address: "123 Nguyễn Huệ, Quận 1, TP.HCM",
  phone: "0909 123 456",
  social: "fb.com/luxenail · WhatsApp +84 909 123 456",
  note: "Áp dụng khi đặt lịch trước · Không cộng dồn với chương trình khác",
  backTitle: "BẢNG GIÁ DỊCH VỤ",
  backNote: "Giá đã gồm công & vật liệu · Miễn phí nước uống",
  menu: [
    {
      title: "Chăm sóc móng tay",
      items: [
        { name: "Cắt da – sửa form móng", price: "50K" },
        { name: "Sơn thường", price: "70K" },
        { name: "Sơn gel trơn", price: "120K" },
        { name: "Sơn gel mắt mèo", price: "150K" },
        { name: "French tip", price: "150K" },
        { name: "Tháo gel", price: "30K" },
      ],
    },
    {
      title: "Nối & đắp móng",
      items: [
        { name: "Úp móng giả + sơn gel", price: "180K" },
        { name: "Đắp gel tự nhiên", price: "300K" },
        { name: "Đắp bột", price: "250K" },
        { name: "Nối móng Polygel", price: "350K" },
        { name: "Fill móng", price: "150K" },
        { name: "Tháo móng đắp", price: "50K" },
      ],
    },
    {
      title: "Chăm sóc chân",
      items: [
        { name: "Cắt da chân", price: "60K" },
        { name: "Sơn gel chân", price: "130K" },
        { name: "Chà gót chân", price: "80K" },
        { name: "Ngâm chân thảo dược", price: "60K" },
        { name: "Pedicure spa trọn gói", price: "150K" },
        { name: "Massage chân 30 phút", price: "120K" },
      ],
    },
    {
      title: "Vẽ & trang trí",
      items: [
        { name: "Vẽ nghệ thuật (1 ngón)", price: "từ 10K" },
        { name: "Đính đá / charm (1 ngón)", price: "từ 15K" },
        { name: "Tráng gương, mắt mèo", price: "50K" },
        { name: "Ombre, French", price: "60K" },
        { name: "Nail 3D / hoa khô", price: "từ 20K" },
        { name: "Sticker dán móng", price: "5K" },
      ],
    },
  ],
};

const photo = (name: string) => `/flyer/photos/${name}.jpg`;

export const PROMO_TEMPLATES: PromoFlyerTemplate[] = [
  // 10 mẫu khai trương
  { id: "open-gold-gala", title: "Dạ tiệc vàng", kind: "open", colors: { bg: "#121212", ink: "#FFF7E6", accent: "#D4AF6C", soft: "#2A2620" }, content: {} },
  { id: "open-blush-photo", title: "Vòm ảnh hồng phấn", kind: "open", photo: photo("pexels-9775261"), colors: { bg: "#FBEFEF", ink: "#3B2530", accent: "#C0587A", soft: "#F4D3DB" }, content: {} },
  { id: "open-balloons", title: "Bóng bay pastel", kind: "open", colors: { bg: "#FFF6EC", ink: "#3A2F55", accent: "#FF8FA3", soft: "#FFD6A5" }, content: { eyebrow: "CHÀO MỪNG KHAI TRƯƠNG" } },
  { id: "open-editorial", title: "Tạp chí đen trắng", kind: "open", photo: photo("pexels-4467861"), colors: { bg: "#F7F5F1", ink: "#1B1B1B", accent: "#B89B72", soft: "#E9E3D8" }, content: {} },
  { id: "open-confetti", title: "Tiệc hoa giấy", kind: "open", colors: { bg: "#FFF8E7", ink: "#22223B", accent: "#EF476F", soft: "#FFD166" }, content: { headline: "GRAND OPENING", eyebrow: "KHAI TRƯƠNG RỘN RÀNG", subhead: "Ghé tiệm nhận quà – làm đẹp giá siêu hời" } },
  { id: "open-ticket", title: "Vé mời & phiếu giảm", kind: "open", colors: { bg: "#0F5257", ink: "#FFF8E8", accent: "#F9C74F", soft: "#13696F" }, content: { eyebrow: "THƯ MỜI", subhead: "Mang phiếu này đến tiệm để nhận thêm ưu đãi" } },
  { id: "open-botanical", title: "Lá xanh & ảnh", kind: "open", photo: photo("pexels-35440213"), colors: { bg: "#EEF3EA", ink: "#2F4A3A", accent: "#6F9A7C", soft: "#DCE8D6" }, content: { subhead: "Một góc xanh thư thái cho đôi tay bạn" } },
  { id: "open-retro-sun", title: "Mặt trời retro", kind: "open", colors: { bg: "#FFF1DC", ink: "#5B2C1E", accent: "#E4572E", soft: "#F3A712" }, content: {} },
  { id: "open-magazine", title: "Bìa tạp chí", kind: "open", photo: photo("pexels-15491629"), colors: { bg: "#FFFFFF", ink: "#1A1A1A", accent: "#B3202F", soft: "#F5E6E0" }, content: { subhead: "Tiệm nail mới – phong cách mới cho bạn" } },
  { id: "open-swiss", title: "Chữ số khổng lồ", kind: "open", colors: { bg: "#F2F0EB", ink: "#111111", accent: "#E63946", soft: "#DAD6CE" }, content: {} },
  // 10 mẫu giảm giá / khuyến mãi
  { id: "sale-red-burst", title: "SALE đỏ rực", kind: "sale", colors: { bg: "#D62828", ink: "#FFFFFF", accent: "#FCBF49", soft: "#9D1B1B" }, content: { eyebrow: "SIÊU ƯU ĐÃI", headline: "SALE", subhead: "Giảm đến 50% – chỉ trong 7 ngày", discount: "50%", discountLabel: "GIẢM ĐẾN" } },
  { id: "sale-combo", title: "Combo tiết kiệm", kind: "sale", colors: { bg: "#FDF0F4", ink: "#4A1D3F", accent: "#E05780", soft: "#FFC2D4" }, content: { eyebrow: "ƯU ĐÃI THÁNG NÀY", headline: "COMBO TIẾT KIỆM", subhead: "Làm đẹp trọn gói – tiết kiệm đến 35%", discount: "35%" } },
  { id: "sale-happy-hour", title: "Happy Hour", kind: "sale", colors: { bg: "#1D3557", ink: "#F1FAEE", accent: "#FFB703", soft: "#274A73" }, content: { eyebrow: "GIỜ VÀNG GIẢM GIÁ", headline: "HAPPY HOUR", subhead: "10:00 – 14:00 · Thứ Hai đến Thứ Sáu", discount: "20%", discountLabel: "GIẢM NGAY" } },
  { id: "sale-summer", title: "Hè rực rỡ", kind: "sale", photo: photo("pexels-6852174"), colors: { bg: "#E0F7F5", ink: "#0B4F6C", accent: "#FF7F50", soft: "#9EE3DF" }, content: { eyebrow: "SUMMER SALE", headline: "HÈ RỰC RỠ", subhead: "Móng xinh đón nắng – giảm 25% cả tháng", discount: "25%" } },
  { id: "sale-women-day", title: "Mừng 20/10", kind: "sale", colors: { bg: "#FFF0F3", ink: "#9D174D", accent: "#E8558F", soft: "#FBCFE8" }, content: { eyebrow: "MỪNG NGÀY PHỤ NỮ VIỆT NAM", headline: "20.10", subhead: "Tặng hoa & giảm 20% cho mọi chị em", discount: "20%", dates: "15.10 – 22.10.2026" } },
  { id: "sale-tet", title: "Làm nail đón Tết", kind: "sale", photo: photo("pexels-15491629"), colors: { bg: "#B71C1C", ink: "#FFF3D6", accent: "#FFD54F", soft: "#8E0E0E" }, content: { eyebrow: "XUÂN BÍNH NGỌ 2026", headline: "ĐÓN TẾT RẠNG RỠ", subhead: "Lì xì giảm 30% – móng đẹp du xuân", dates: "01.01 – 15.02.2027" } },
  { id: "sale-black-friday", title: "Black Friday", kind: "sale", colors: { bg: "#0B0B0B", ink: "#FFFFFF", accent: "#FF2E88", soft: "#262626" }, content: { eyebrow: "CHỈ 3 NGÀY", headline: "BLACK FRIDAY", subhead: "Giảm sốc đến 50% toàn bộ dịch vụ", discount: "50%", dates: "27.11 – 29.11.2026" } },
  { id: "sale-bogo", title: "Mua 1 tặng 1", kind: "sale", colors: { bg: "#FFF7E0", ink: "#3D2C8D", accent: "#FF6B6B", soft: "#FFD93D" }, content: { eyebrow: "ĐI CÙNG BẠN THÂN", headline: "MUA 1 TẶNG 1", subhead: "Người thứ hai được sơn gel miễn phí", discount: "1+1" } },
  { id: "sale-member", title: "Thẻ thành viên", kind: "sale", colors: { bg: "#F4F1EC", ink: "#2B2B2B", accent: "#B08D57", soft: "#E7DED0" }, content: { eyebrow: "KHÁCH HÀNG THÂN THIẾT", headline: "THẺ THÀNH VIÊN", subhead: "Giảm 15% trọn đời – tích điểm đổi quà", discount: "15%", perks: ["Tích điểm mỗi lần làm đẹp", "Quà tặng tháng sinh nhật", "Ưu tiên đặt lịch cuối tuần"] } },
  { id: "sale-pedicure", title: "Tuần lễ chăm sóc chân", kind: "sale", photo: photo("pexels-35533836"), colors: { bg: "#F3EDE4", ink: "#4A3B2A", accent: "#A47148", soft: "#E6D5C0" }, content: { eyebrow: "TUẦN LỄ CHĂM SÓC", headline: "PEDICURE SPA", subhead: "Ngâm thảo dược · tẩy da chết · massage chân", discount: "40%" } },
];

export function promoDesignFrom(t: PromoFlyerTemplate, content?: Partial<PromoFlyerDesign>): PromoFlyerDesign {
  const d = { ...DEFAULT_PROMO, ...t.content, ...content, templateId: t.id };
  // Bản lưu cũ (trước khi có mặt sau) có thể thiếu bảng giá.
  return Array.isArray(d.menu) && d.menu.length ? d : { ...d, menu: DEFAULT_PROMO.menu };
}
