// Mẫu con dấu tích điểm (dấu tròn 1 cm, 1 màu mực). Vẽ trên khung 100×100 = 10×10 mm.

export type StampDesign = { templateId: string; name: string; tagline: string; color: string };
export type StampTemplate = { id: string; title: string; name: string; tagline: string; color: string };

export const STAMP_SIZE_MM = 10;
export const STAMP_INKS = [
  { id: "red", label: "Đỏ", color: "#D7263D" },
  { id: "pink", label: "Hồng", color: "#E0457B" },
  { id: "purple", label: "Tím", color: "#6A3FA0" },
  { id: "navy", label: "Xanh navy", color: "#1F3A73" },
  { id: "green", label: "Xanh lá", color: "#2E7D4F" },
  { id: "black", label: "Đen", color: "#1A1A1A" },
];

const t = (id: string, title: string, name: string, tagline: string, color: string): StampTemplate => ({ id, title, name, tagline, color });

export const BRANDED_STAMP_TEMPLATES: StampTemplate[] = [
  t("brand-rose", "Rosé Atelier", "Rosé Atelier", "", "#D7263D"),
  t("brand-good-mood", "Good Mood Nails", "Good Mood Nails", "", "#D7263D"),
  t("brand-luxe", "Luxe Nail Studio", "Luxe Nail Studio", "", "#D7263D"),
  t("brand-queen", "Queen’s Touch", "Queen’s Touch", "", "#D7263D"),
  t("brand-bloom", "Bloom Nail Co.", "Bloom Nail Co.", "", "#D7263D"),
  t("brand-moon", "Moonlight Nails", "Moonlight Nails", "", "#D7263D"),
  t("brand-gloss", "Gloss Society", "Gloss Society", "", "#D7263D"),
  t("brand-ivory", "Ivory Tips", "Ivory Tips", "", "#D7263D"),
  t("brand-cherry", "Cherry Pop", "Cherry Pop", "", "#D7263D"),
  t("brand-noir", "Noir Nail Bar", "Noir Nail Bar", "", "#D7263D"),
  t("brand-pearl", "Pearl Polish", "Pearl Polish", "", "#D7263D"),
  t("brand-jade", "Jade Studio", "Jade Studio", "", "#D7263D"),
  t("brand-velvet", "Velvet Nails", "Velvet Nails", "", "#D7263D"),
  t("brand-golden", "Golden Hour", "Golden Hour", "", "#D7263D"),
  t("brand-cocoa", "Cocoa Nails", "Cocoa Nails", "", "#D7263D"),
  t("brand-fleur", "Fleur de Nail", "Fleur de Nail", "", "#D7263D"),
  t("brand-fresh", "Fresh Set", "Fresh Set", "", "#D7263D"),
  t("brand-crystal", "Crystal Tips", "Crystal Tips", "", "#D7263D"),
  t("brand-muse", "Nail Muse", "Nail Muse", "", "#D7263D"),
  t("brand-bonbon", "Bonbon Nails", "Bonbon Nails", "", "#D7263D"),
];

export const TYPOGRAPHY_STAMP_TEMPLATES: StampTemplate[] = [
  t("type-atelier-ix", "Atelier IX", "Atelier IX", "", "#D7263D"),
  t("type-soho", "Soho Nails", "Soho Nails", "", "#D7263D"),
  t("type-mira", "Mira Nails", "Mira Nails", "", "#D7263D"),
  t("type-dot", "Dot Studio", "Dot Studio", "", "#D7263D"),
  t("type-vera", "Vera Lab", "Vera Lab", "", "#D7263D"),
  t("type-no1", "N°1 Nails", "N°1 Nails", "", "#D7263D"),
  t("type-pink-unit", "Pink Unit", "Pink Unit", "", "#D7263D"),
  t("type-salon-5", "Salon 5", "Salon 5", "", "#D7263D"),
  t("type-set-theory", "Set Theory", "Set Theory", "", "#D7263D"),
  t("type-oui", "Oui Nails", "Oui Nails", "", "#D7263D"),
  t("type-blanc", "Blanc Bar", "Blanc Bar", "", "#D7263D"),
  t("type-ama", "Ama Studio", "Ama Studio", "", "#D7263D"),
  t("type-tips-co", "Tips & Co", "Tips & Co", "", "#D7263D"),
  t("type-polish-dept", "Polish Dept.", "Polish Dept.", "", "#D7263D"),
  t("type-lumi", "Lumi Room", "Lumi Room", "", "#D7263D"),
  t("type-nail-note", "Nail Note", "Nail Note", "", "#D7263D"),
  t("type-soft-set", "Soft Set", "Soft Set", "", "#D7263D"),
  t("type-line-lab", "Line Lab", "Line Lab", "", "#D7263D"),
  t("type-day-01", "Day 01", "Day 01", "", "#D7263D"),
  t("type-mint-club", "Mint Club", "Mint Club", "", "#D7263D"),
];

export const CLASSIC_STAMP_TEMPLATES: StampTemplate[] = [
  t("script-two", "Chữ ký 2 dòng", "Emily's Colour", "", "#D7263D"),
  t("ring-text", "Vòng chữ tròn", "The Nail Studio", "Since 2024", "#D7263D"),
  t("script-slant", "Chữ nghiêng gạch chân", "Good Nails", "", "#E0457B"),
  t("heart-mono", "Tim chữ lồng", "Hồng Nail", "", "#E0457B"),
  t("bottle", "Chai sơn", "Luxe Nails", "", "#6A3FA0"),
  t("check-burst", "Ngôi sao dấu tích", "Luxe Nails", "", "#D7263D"),
  t("solid-mono", "Tròn đặc chữ lồng", "Bella Nails", "", "#1F3A73"),
  t("crown", "Vương miện", "Queen Nails", "", "#6A3FA0"),
  t("flower", "Bông hoa", "Mai Nails", "", "#E0457B"),
  t("star-ring", "Vòng sao", "Star Nail Bar", "", "#1F3A73"),
  t("hexagon", "Lục giác", "Hana Nails", "", "#1A1A1A"),
  t("scallop-thanks", "Viền răng cưa cảm ơn", "Thank you", "", "#D7263D"),
  t("nail-letter", "Móng chữ cái", "Nail House", "", "#E0457B"),
  t("butterfly", "Bướm", "Butterfly", "", "#6A3FA0"),
  t("sparkle-name", "Lấp lánh", "Glow Nails", "", "#1F3A73"),
  t("gem", "Kim cương", "Gem Nails", "", "#2E7D4F"),
  t("laurel", "Vòng nguyệt quế", "Royal Nails", "", "#1A1A1A"),
  t("smile", "Mặt cười", "Happy Nails", "", "#D7263D"),
  t("dot-ring", "Vòng chấm bi", "Coco Nails", "", "#2E7D4F"),
  t("banner", "Băng rôn ngang", "Nail Bar", "", "#D7263D"),
];

export const STAMP_TEMPLATES: StampTemplate[] = [
  ...BRANDED_STAMP_TEMPLATES,
  ...TYPOGRAPHY_STAMP_TEMPLATES,
  ...CLASSIC_STAMP_TEMPLATES,
];

export const stampDesignFrom = (s: StampTemplate, content?: Partial<StampDesign>): StampDesign => ({
  name: s.name,
  tagline: s.tagline,
  color: s.color,
  ...content,
  templateId: s.id,
});
