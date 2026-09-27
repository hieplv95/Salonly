// Preset dùng chung cho client (hiển thị) và server (prompt gửi AI).

export type Preset = { id: string; label: string; hint: string };

export const IMAGE_STYLES: (Preset & { prompt: string })[] = [
  {
    id: "studio",
    label: "Studio sang trọng",
    hint: "Nền be trơn, ánh sáng studio mềm",
    prompt:
      "Re-shoot this as a high-end professional nail product photo: clean seamless warm beige studio backdrop, large soft diffused key light, gentle glossy highlights on every nail, crisp macro sharpness, elegant hand pose.",
  },
  {
    id: "pastel",
    label: "Pastel mơ màng",
    hint: "Lụa hồng, cánh hoa, tone ngọt ngào",
    prompt:
      "Restyle into a dreamy soft-pastel beauty shot: blush pink silk fabric and a few scattered rose petals in the background, airy bright light, creamy bokeh, romantic feminine mood.",
  },
  {
    id: "editorial",
    label: "Tạp chí thời trang",
    hint: "Nền nhung tối, ánh sáng kịch tính",
    prompt:
      "Restyle into a luxury fashion-magazine editorial: deep dark velvet background, dramatic directional lighting with rich contrast, delicate gold jewelry on the fingers, glossy reflections on the nails.",
  },
  {
    id: "lifestyle",
    label: "Ánh nắng tự nhiên",
    hint: "Nắng cửa sổ, cốc cà phê, đời thường",
    prompt:
      "Restyle into a natural lifestyle photo: warm morning window sunlight, the hand gently holding a ceramic latte cup on a light wooden cafe table, soft natural shadows, authentic and candid.",
  },
];

export const VIDEO_MOTIONS: (Preset & { prompt: string })[] = [
  {
    id: "rotate",
    label: "Xoay tay nhẹ nhàng",
    hint: "Bàn tay xoay chậm khoe độ bóng",
    prompt:
      "The hand slowly and gracefully rotates to show off the manicure, light glides across the glossy nails creating realistic moving reflections, pearls and bow charms glint. Smooth, natural, photorealistic motion.",
  },
  {
    id: "macro",
    label: "Camera lướt cận cảnh",
    hint: "Macro dolly qua từng móng",
    prompt:
      "Slow cinematic macro dolly shot gliding across the nails from left to right, shallow depth of field with focus rolling from nail to nail, subtle sparkle on the pearl details. Photorealistic beauty commercial.",
  },
  {
    id: "sparkle",
    label: "Lấp lánh ánh sáng",
    hint: "Tay giữ yên, ánh sáng quét qua",
    prompt:
      "The hand stays almost still with tiny natural micro-movements, a soft beam of light sweeps across the nails revealing shimmer and glossy highlights, the fabric in the background moves gently. Calm, luxurious, realistic.",
  },
  {
    id: "pose",
    label: "Tạo dáng quảng cáo",
    hint: "Ngón tay uốn lượn như quảng cáo salon",
    prompt:
      "The fingers flex and pose elegantly like in a nail salon advertisement, one slow graceful gesture, soft studio lighting, camera slowly pushes in. Natural hand anatomy, photorealistic.",
  },
];

// Ô ảnh chỉ làm theo mô tả của người dùng (hiện khi có mô tả).
export const CUSTOM_STYLE: Preset = {
  id: "custom",
  label: "Theo yêu cầu",
  hint: "Làm đúng như bạn mô tả",
};

// Kiểu chuyển động chỉ làm theo mô tả video của người dùng.
export const CUSTOM_MOTION: Preset = {
  id: "custom",
  label: "Theo mô tả",
  hint: "Chuyển động đúng như bạn viết",
};

export const VIDEO_NOTE_SUGGESTIONS = [
  "Cầm ly trà sữa",
  "Hoa rơi nhẹ",
  "Zoom cận móng",
  "Nắng lấp lánh",
  "Vuốt tấm lụa",
  "Xoay tay khoe nhẫn",
];

// Kích thước đăng theo tỉ lệ chuẩn của từng nền tảng. `ratio` gửi cho AI; `css` để hiển thị.
// crop: Veo chỉ tạo 9:16 / 16:9, nên bài viết 4:5 và vuông 1:1 được cắt từ video 9:16.
export type Format = Preset & { ratio?: string; crop?: string; css: string };

// Nhiều nền tảng dùng chung tỉ lệ, nhưng tách riêng từng mục để người dùng dễ chọn đúng chỗ đăng.
export const IMAGE_FORMATS: Format[] = [
  { id: "original", label: "Tỉ lệ gốc", hint: "Không đổi khung", css: "aspect-[4/5]" },
  { id: "ig-post", label: "IG bài viết", hint: "4:5 · dọc", ratio: "4:5", css: "aspect-[4/5]" },
  { id: "ig-story", label: "IG Story", hint: "9:16 · toàn màn hình", ratio: "9:16", css: "aspect-[9/16]" },
  { id: "fb-post", label: "FB bài viết", hint: "4:5 · dọc", ratio: "4:5", css: "aspect-[4/5]" },
  { id: "fb-story", label: "FB Story", hint: "9:16 · toàn màn hình", ratio: "9:16", css: "aspect-[9/16]" },
  { id: "tiktok", label: "TikTok · Reels", hint: "9:16 · toàn màn hình", ratio: "9:16", css: "aspect-[9/16]" },
  { id: "square", label: "Vuông", hint: "1:1 · IG, FB", ratio: "1:1", css: "aspect-square" },
  { id: "landscape", label: "Ảnh ngang", hint: "16:9 · FB, YouTube", ratio: "16:9", css: "aspect-video" },
];

// Veo chỉ tạo được video 9:16 hoặc 16:9.
export const VIDEO_FORMATS: Format[] = [
  { id: "ig-post", label: "IG bài viết", hint: "4:5 · cắt từ 9:16", ratio: "9:16", crop: "4:5", css: "aspect-[4/5]" },
  { id: "ig-story", label: "IG Story", hint: "9:16 · toàn màn hình", ratio: "9:16", css: "aspect-[9/16]" },
  { id: "fb-post", label: "FB bài viết", hint: "4:5 · cắt từ 9:16", ratio: "9:16", crop: "4:5", css: "aspect-[4/5]" },
  { id: "fb-story", label: "FB Story", hint: "9:16 · toàn màn hình", ratio: "9:16", css: "aspect-[9/16]" },
  { id: "tiktok", label: "TikTok · Reels", hint: "9:16 · toàn màn hình", ratio: "9:16", css: "aspect-[9/16]" },
  { id: "square", label: "Vuông", hint: "1:1 · cắt từ 9:16", ratio: "9:16", crop: "1:1", css: "aspect-square" },
  { id: "landscape", label: "Video ngang", hint: "16:9 · FB, YouTube", ratio: "16:9", css: "aspect-video" },
];
export const DEFAULT_VIDEO_FORMAT = "tiktok";

export const IMAGE_RATIOS = ["1:1", "4:5", "9:16", "16:9"];
export const VIDEO_RATIOS = ["9:16", "16:9"];

export const NOTE_MAX = 300;

// Số ảnh / video tối đa mỗi lần bấm tạo, và lựa chọn mặc định.
export const MAX_IMAGES = 2;
export const MAX_VIDEOS = 2;
export const DEFAULT_STYLES = ["studio", "pastel"];
export const DEFAULT_MOTIONS = ["rotate"];

/* ---------- Model AI người dùng chọn được + giá ước tính ----------
 * Giá theo bảng giá Google (USD) × tỉ giá; đổi USD_TO_VND khi tỉ giá thay đổi.
 * Tên model là tên trên Vertex; với key AI Studio, video "-001" tự đổi sang "-preview". */
export const USD_TO_VND = 26000;
export const USD_TO_EUR = 0.86; // để ước tính credit Google Cloud tính bằng EUR
const vnd = (usd: number) => Math.round((usd * USD_TO_VND) / 100) * 100;

export type ModelOption = Preset & { usd: number; vnd: number };

// Giá mỗi ảnh (độ phân giải ~1K).
export const IMAGE_MODEL_OPTIONS: ModelOption[] = [
  { id: "gemini-3.1-flash-lite-image", label: "Chất lượng trung bình", hint: "Nhanh, rẻ nhất", usd: 0.034, vnd: vnd(0.034) },
  { id: "gemini-3.1-flash-image", label: "Chất lượng tốt", hint: "Cân bằng · nên dùng", usd: 0.067, vnd: vnd(0.067) },
  { id: "gemini-3-pro-image", label: "Chất lượng cao", hint: "Đẹp nhất, chậm hơn", usd: 0.134, vnd: vnd(0.134) },
];
export const DEFAULT_IMAGE_MODEL = "gemini-3.1-flash-image";

// Giá mỗi video 8 giây, cộng thêm 1 ảnh Flash để mở rộng khung trước khi dựng video.
const VIDEO_SECONDS = 8;
const FRAME_USD = 0.067;
const video = (perSecond: number) => perSecond * VIDEO_SECONDS + FRAME_USD;
export const VIDEO_MODEL_OPTIONS: ModelOption[] = [
  { id: "veo-3.1-lite-generate-001", label: "Chất lượng trung bình", hint: "720p · tiết kiệm", usd: video(0.05), vnd: vnd(video(0.05)) },
  { id: "veo-3.1-fast-generate-001", label: "Chất lượng tốt", hint: "720p · đẹp hơn", usd: video(0.1), vnd: vnd(video(0.1)) },
  { id: "veo-3.1-generate-001", label: "Chất lượng cao", hint: "1080p · đẹp nhất", usd: video(0.4), vnd: vnd(video(0.4)) },
];
export const DEFAULT_VIDEO_MODEL = "veo-3.1-generate-001";

export const NOTE_SUGGESTIONS = [
  "Nền hồng pastel",
  "Thêm hoa hồng",
  "Móng đỏ rượu",
  "Nhũ lấp lánh",
  "Cầm ly trà sữa",
  "Nắng hoàng hôn",
];

// Ràng buộc chung: giữ nguyên thiết kế móng — đây là "sản phẩm" của khách.
export const KEEP_DESIGN =
  "Keep the manicure design exactly identical: same nail shape and length, same nude color, same pearl lines, same bow charms and their positions, same number of fingers and natural hand anatomy. Improve skin texture subtly and make it look like a real photograph. Do not add any text, logos or watermarks.";

export const VIDEO_NEGATIVE =
  "extra fingers, missing fingers, deformed hands, morphing or changing nail design, melting nails, blurry, low quality, text, watermark, cartoon";
