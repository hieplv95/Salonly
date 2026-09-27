export type FlyerTemplate = {
  id: string;
  title: string;
  mood: string;
  bg: string;
  ink: string;
  accent: string;
  photo: string;
};

export type FlyerDesign = {
  templateId: string;
  salon: string;
  headline: string;
  discount: string;
  service: string;
  dates: string;
  address: string;
  phone: string;
  note: string;
  backHeading: string;
  backMessage: string;
};

export const FLYER_SIZE = { width: 2480, height: 3508, dpi: 300 } as const;

export const FLYER_TEMPLATES: FlyerTemplate[] = [
  { id: "blush-editorial", title: "Tạp chí hồng phấn", mood: "Thanh lịch", bg: "#f5e8e4", ink: "#3b2530", accent: "#bd657b", photo: "/flyer/photos/pexels-9775261.jpg" },
  { id: "midnight-gala", title: "Dạ tiệc ánh vàng", mood: "Sang trọng", bg: "#17171c", ink: "#fff8e7", accent: "#d4af6c", photo: "/flyer/photos/user-gold-glam.jpg" },
  { id: "coral-pop", title: "Sắc cam rực rỡ", mood: "Năng động", bg: "#ff715b", ink: "#fffaf0", accent: "#2d2845", photo: "/flyer/photos/pexels-6852174.jpg" },
  { id: "sage-garden", title: "Vườn lá xanh", mood: "Tự nhiên", bg: "#dfe9dc", ink: "#244b41", accent: "#6f9879", photo: "/flyer/photos/pexels-35440213.jpg" },
  { id: "lilac-ribbon", title: "Dải lụa tím", mood: "Mộng mơ", bg: "#e9e2f5", ink: "#3d3159", accent: "#9677ba", photo: "/flyer/photos/user-halloween-pink.jpg" },
  { id: "cobalt-block", title: "Khối xanh cobalt", mood: "Hiện đại", bg: "#f5f4ef", ink: "#1642ae", accent: "#ffdb62", photo: "/flyer/photos/pexels-12653044.jpg" },
  { id: "terracotta-arch", title: "Vòm đất nung", mood: "Ấm áp", bg: "#f4e6d5", ink: "#5c3328", accent: "#c37959", photo: "/flyer/photos/pexels-8377206.jpg" },
  { id: "lemon-sunburst", title: "Nắng vàng khai trương", mood: "Tươi vui", bg: "#fff3b1", ink: "#2e3529", accent: "#f2a83b", photo: "/flyer/photos/pexels-5871817.jpg" },
  { id: "cherry-magazine", title: "Bìa báo đỏ cherry", mood: "Thời trang", bg: "#a6233d", ink: "#fff2e7", accent: "#f2a2a9", photo: "/flyer/photos/pexels-15491629.jpg" },
  { id: "mint-checker", title: "Ô caro bạc hà", mood: "Trẻ trung", bg: "#d7f0e8", ink: "#174f4b", accent: "#72b6a2", photo: "/flyer/photos/pexels-38283820.jpg" },
  { id: "pearl-minimal", title: "Cẩm thạch ảnh ghép", mood: "Theo ảnh bạn gửi", bg: "#f7f4ee", ink: "#4e4b48", accent: "#c9bdae", photo: "/flyer/photos/pexels-31642925.jpg" },
  { id: "pink-candy", title: "Kẹo hồng retro", mood: "Hoài cổ", bg: "#ffe5ec", ink: "#a83259", accent: "#f7a5bd", photo: "/flyer/photos/pexels-15491630.jpg" },
  { id: "aqua-wave", title: "Sóng xanh nhiệt đới", mood: "Mùa hè", bg: "#def5f1", ink: "#09575d", accent: "#21aab0", photo: "/flyer/photos/pexels-17471377.jpg" },
  { id: "violet-neon", title: "Đêm tím neon", mood: "Nổi bật", bg: "#22133d", ink: "#fff2fc", accent: "#ed78d3", photo: "/flyer/photos/pexels-16007289.jpg" },
  { id: "kraft-collage", title: "Giấy thủ công", mood: "Thủ công", bg: "#e8d4b4", ink: "#42392e", accent: "#bd6f60", photo: "/flyer/photos/pexels-4467861.jpg" },
  { id: "teal-ticket", title: "Vé mời khai trương", mood: "Độc đáo", bg: "#12666a", ink: "#fff8e8", accent: "#facb79", photo: "/flyer/photos/pexels-35533836.jpg" },
  { id: "chrome-glow", title: "Ánh bạc tương lai", mood: "Cá tính", bg: "#e9e8ed", ink: "#282732", accent: "#8d77bd", photo: "/flyer/photos/pexels-13038494.jpg" },
  { id: "rose-garden", title: "Vườn hồng cổ điển", mood: "Lãng mạn", bg: "#f8eee9", ink: "#6e3945", accent: "#bd7d83", photo: "/flyer/photos/pexels-34997577.jpg" },
  { id: "mono-type", title: "Đen trắng typography", mood: "Tối giản", bg: "#f5f3ee", ink: "#171717", accent: "#a5a5a0", photo: "/flyer/photos/pexels-34121866.jpg" },
  { id: "confetti-party", title: "Tiệc sắc màu", mood: "Lễ hội", bg: "#fff8e9", ink: "#372449", accent: "#ed674e", photo: "/flyer/photos/user-halloween-orange.jpg" },
];

export const FLYER_BACK_COPY: Record<string, [string, string]> = {
  "blush-editorial": ["CẢM ƠN BẠN ĐÃ ĐẾN", "Một buổi làm đẹp nhỏ, một niềm vui thật lớn."],
  "midnight-gala": ["LỜI MỜI ĐẶC BIỆT", "Hẹn gặp bạn trong buổi khai trương rực rỡ."],
  "coral-pop": ["HẸN BẠN TẠI TIỆM", "Đến chơi, chọn màu yêu thích và mang quà về."],
  "sage-garden": ["MỘT KHỞI ĐẦU ÊM ÁI", "Cảm ơn bạn đã cùng chúng tôi bắt đầu hành trình."],
  "lilac-ribbon": ["DÀNH RIÊNG CHO BẠN", "Mong mỗi lần ghé tiệm đều là một phút thư giãn."],
  "cobalt-block": ["ĐẸP THEO CÁCH CỦA BẠN", "Chúng tôi đã sẵn sàng chăm chút từng đầu ngón tay."],
  "terracotta-arch": ["CHÀO MỪNG BẠN GHÉ THĂM", "Một chiếc ghế ấm và một bộ móng mới đang chờ."],
  "lemon-sunburst": ["CÙNG NHAU TỎA SÁNG", "Niềm vui khai trương sẽ trọn vẹn hơn khi có bạn."],
  "cherry-magazine": ["MỘT CUỘC HẸN THẬT ĐẸP", "Phong cách mới của bạn bắt đầu từ hôm nay."],
  "mint-checker": ["CHÚNG MÌNH GẶP NHAU NHÉ", "Ghé tiệm và tận hưởng một ngày thật tươi mới."],
  "pearl-minimal": ["CẢM ƠN BẠN ĐÃ GHÉ", "Chăm chút đôi tay bạn bằng sự tỉ mỉ và yêu thương."],
  "pink-candy": ["MỘT CHÚT NGỌT NGÀO", "Đến nhận ưu đãi và chọn kiểu nail làm bạn vui."],
  "aqua-wave": ["GẶP NHAU NGÀY NẮNG ĐẸP", "Để đôi tay rạng rỡ như một chuyến đi mùa hè."],
  "violet-neon": ["HẸN BẠN TỎA SÁNG", "Bước vào tiệm, bước ra với phong cách mới."],
  "kraft-collage": ["GỬI BẠN LỜI CẢM ƠN", "Mỗi bộ móng đều được làm bằng cả sự nâng niu."],
  "teal-ticket": ["VÉ MỜI CỦA BẠN", "Mang tờ rơi này đến tiệm để cùng mừng khai trương."],
  "chrome-glow": ["ĐẸP HƠN MỖI NGÀY", "Khám phá những sắc màu mới cùng chúng tôi."],
  "rose-garden": ["CẢM ƠN VÌ ĐÃ CHỌN CHÚNG TÔI", "Hẹn bạn ở tiệm cho một buổi làm đẹp thật dịu dàng."],
  "mono-type": ["LỜI MỜI KHAI TRƯƠNG", "Bạn đến, chúng tôi chuẩn bị mọi thứ còn lại."],
  "confetti-party": ["CÙNG MỪNG KHAI TRƯƠNG", "Mỗi vị khách là một phần của ngày vui này."],
};

export function flyerDesignFrom(template: FlyerTemplate, content?: Partial<FlyerDesign>): FlyerDesign {
  return {
    salon: "Luxe Nail Studio",
    headline: "MỪNG KHAI TRƯƠNG",
    discount: "30",
    service: "Tất cả dịch vụ nail & spa",
    dates: "01.10 – 15.10.2026",
    address: "123 Nguyễn Huệ, Quận 1, TP.HCM",
    phone: "0909 123 456",
    note: "Đặt lịch ngay · Số lượng ưu đãi có hạn",
    ...content,
    templateId: template.id,
    backHeading: content?.backHeading ?? FLYER_BACK_COPY[template.id][0],
    backMessage: content?.backMessage ?? FLYER_BACK_COPY[template.id][1],
  };
}
