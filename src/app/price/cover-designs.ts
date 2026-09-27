// Toạ độ tính theo phần trăm chiều rộng/cao của mặt trước. Mỗi mẫu có bố cục riêng.
export type CoverText = {
  x: number;
  y: number;
  size: number;
  width: number;
  align?: "start" | "middle" | "end";
  color?: "primary" | "text" | "bg" | "surface";
  upper?: boolean;
};

export type CoverContact = "card" | "grid" | "band" | "split" | "lines";
export type CoverDesign = {
  salon: CoverText;
  title: CoverText;
  contact: CoverContact;
  taglineY?: number;
};

const center = (y: number, size = 8, width = 78, color?: CoverText["color"]): CoverText => ({ x: 50, y, size, width, color });
const left = (x: number, y: number, size = 8, width = 70, color?: CoverText["color"]): CoverText => ({ x, y, size, width, align: "start", color });
const right = (x: number, y: number, size = 8, width = 70, color?: CoverText["color"]): CoverText => ({ x, y, size, width, align: "end", color });

export const COVER_DESIGNS: Record<string, CoverDesign> = {
  "classic-rose": { salon: center(18, 8), title: center(61, 5.8), contact: "card" },
  "classic-noir": { salon: center(16, 8.2), title: center(62, 5.8), contact: "lines" },
  "banner-blush": { salon: center(11.5, 8.2, 80, "bg"), title: center(59, 5.5), contact: "band" },
  "banner-teal": { salon: left(24, 19, 7.5, 65), title: left(24, 60, 5.5, 64), contact: "split" },
  "cards-nude": { salon: center(18, 7.8), title: center(63, 5.4), contact: "grid" },
  "cards-lavender": { salon: center(16, 7.4), title: center(64, 5.5), contact: "card" },
  "sidebar-plum": { salon: left(13, 19, 7.7, 70), title: left(13, 61, 5.4, 70), contact: "lines" },
  "sidebar-peach": { salon: right(87, 18, 7.8, 72), title: right(87, 61, 5.4, 72), contact: "band" },
  "minimal-mono": { salon: left(10, 14, 5.5, 72), title: left(10, 39, 8.5, 77), contact: "lines", taglineY: 64 },
  "minimal-sage": { salon: left(10, 15, 6.5, 67), title: left(10, 61, 6.5, 76), contact: "grid" },
  "arch-rose": { salon: center(19, 7.5), title: center(59, 5.5), contact: "card" },
  "arch-sky": { salon: center(18, 7.5), title: center(67, 5.4, 76, "bg"), contact: "split" },
  "frame-nude": { salon: center(20, 8.2), title: center(62, 5.5), contact: "lines" },
  "frame-cherry": { salon: center(18, 8, 75, "bg"), title: center(61, 5.4, 75, "bg"), contact: "band" },
  "botanical-sage": { salon: center(24, 8), title: center(59, 5.4), contact: "grid" },
  "botanical-blush": { salon: center(16, 7.8), title: center(66, 5.5), contact: "card" },
  "cards-noir": { salon: left(14, 20, 7.5, 70), title: left(14, 61, 5.5, 72), contact: "split" },
  "banner-lavender": { salon: center(21, 7.7), title: center(51, 5.7, 80, "bg"), contact: "grid" },
  "classic-peach": { salon: center(16, 8), title: center(64, 5.3), contact: "lines" },
  "minimal-teal": { salon: right(88, 18, 6.6, 70), title: right(88, 60, 6, 68), contact: "band" },
  "marble-gold": { salon: center(19, 8), title: center(62, 5.5), contact: "card" },
  "marble-noir": { salon: center(20, 7.8), title: center(64, 5.6), contact: "lines" },
  "marble-blush": { salon: left(15, 20, 7.6, 72), title: left(15, 62, 5.2, 70), contact: "grid" },
  "marble-grey": { salon: right(85, 20, 7.4, 72), title: right(85, 62, 5.3, 71), contact: "split" },
  "split-gold": { salon: left(12, 19, 7.7, 70), title: left(12, 62, 5.4, 74), contact: "band" },
  "split-noir": { salon: { x: 73, y: 20, size: 7.2, width: 42, color: "bg" }, title: { x: 73, y: 61, size: 5.1, width: 42, color: "bg" }, contact: "card" },
  "editorial-ivory": { salon: left(10, 14, 5.5, 70), title: left(10, 44, 9, 80), contact: "lines", taglineY: 65 },
  "editorial-blush": { salon: left(27, 19, 7.4, 65), title: left(27, 63, 5.2, 65), contact: "grid" },
  "editorial-sage": { salon: left(12, 21, 7.5, 68), title: left(12, 60, 5.4, 67), contact: "split" },
  "editorial-noir": { salon: center(17, 8.2), title: center(64, 5.5), contact: "band" },
};
