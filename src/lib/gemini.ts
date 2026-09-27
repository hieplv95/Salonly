import "server-only";
import { GenerateVideosOperation, GoogleGenAI } from "@google/genai";
import {
  CUSTOM_MOTION,
  CUSTOM_STYLE,
  IMAGE_RATIOS,
  IMAGE_STYLES,
  KEEP_DESIGN,
  NOTE_MAX,
  VIDEO_MOTIONS,
  VIDEO_NEGATIVE,
  VIDEO_MODEL_OPTIONS,
  VIDEO_RATIOS,
  IMAGE_MODEL_OPTIONS,
  DEFAULT_VIDEO_MODEL,
} from "./presets";
import { langOf } from "./caption-langs";
import { getAiSources, type RuntimeSource } from "./settings";
import { creditState } from "./usage";

/* ---------- Nguồn AI (backend) ----------
 * Admin quản lý trên trang /admin/settings (nhiều project Vertex + API key, có credit từng nguồn);
 * chưa cấu hình thì đọc .env.local như trước:
 *   GOOGLE_CLOUD_PROJECT=projA,projB@C:\keys\b.json   (Vertex; "@file" = file khoá service account riêng)
 *   GEMINI_API_KEY=key1,key2                         (AI Studio)
 * Dùng lần lượt theo thứ tự; nguồn lỗi, đang tắt hoặc hết credit (ước tính) thì chuyển sang nguồn sau.
 */

type Backend = {
  id: string;
  name: string;
  kind: "vertex" | "studio";
  enabled: boolean;
  credit?: RuntimeSource["credit"];
  image: GoogleGenAI;
  video: GoogleGenAI;
  apiKey?: string;
  downUntil: number; // tạm bỏ qua nguồn này tới thời điểm này
};

function build(sources: RuntimeSource[], prev: Backend[] = []): Backend[] {
  return sources.map((s): Backend => {
    const base = { id: s.id, name: s.label, kind: s.kind, enabled: s.enabled, credit: s.credit, downUntil: prev.find((p) => p.id === s.id)?.downUntil ?? 0 };
    if (s.kind === "studio") {
      const ai = new GoogleGenAI({ apiKey: s.apiKey });
      return { ...base, image: ai, video: ai, apiKey: s.apiKey };
    }
    const auth = s.credentials
      ? { googleAuthOptions: { credentials: s.credentials, projectId: s.project } }
      : s.keyFilename
        ? { googleAuthOptions: { keyFilename: s.keyFilename } }
        : {};
    return {
      ...base,
      // Trên Vertex, Gemini 3 chạy ở "global" còn Veo cần một vùng cụ thể.
      image: new GoogleGenAI({ vertexai: true, project: s.project, location: s.imageLocation, ...auth }),
      video: new GoogleGenAI({ vertexai: true, project: s.project, location: s.videoLocation, ...auth }),
    };
  });
}

// Giữ qua các lần hot-reload để trạng thái "tạm bỏ qua" không bị mất; tạo lại khi cấu hình đổi
// (hoặc khi cấu trúc Backend trong code đổi: tăng BUILD).
const BUILD = 2;
const g = globalThis as unknown as { __backends?: { version: string; list: Backend[] } };
function backends() {
  const src = getAiSources();
  const version = `${BUILD}:${src.version}`;
  if (g.__backends?.version !== version) g.__backends = { version, list: build(src.sources, g.__backends?.list) };
  return g.__backends.list;
}

export const isDemo = () => backends().length === 0;

// Nguồn được phép dùng: đang bật và chưa hết credit ước tính.
const usable = (b: Backend) => b.enabled && !(b.credit && creditState(b.id, b.credit).exhausted);

// Thử lần lượt: model chính → bản Lite (rẻ, đẹp, ít bị nghẽn) → model cũ.
const IMAGE_MODELS = [
  process.env.GEMINI_IMAGE_MODEL,
  "gemini-3.1-flash-image",
  "gemini-3.1-flash-lite-image",
  "gemini-2.5-flash-image",
].filter(Boolean) as string[];

// Cùng model nhưng tên khác nhau giữa AI Studio và Vertex.
// Mặc định Veo 3.1 bản đầy đủ. VEO_MODEL có thể ghi tên kiểu Vertex ("-001");
// với key AI Studio sẽ tự đổi sang đuôi "-preview".
// Chỉ nhận model có trong danh sách hiển thị cho người dùng.
export const cleanImageModel = (m: unknown) =>
  typeof m === "string" && IMAGE_MODEL_OPTIONS.some((o) => o.id === m) ? m : undefined;
export const cleanVideoModel = (m: unknown) =>
  typeof m === "string" && VIDEO_MODEL_OPTIONS.some((o) => o.id === m) ? m : undefined;

const videoModel = (b: Backend, chosen?: string) => {
  const name = chosen || process.env.VEO_MODEL || DEFAULT_VIDEO_MODEL;
  return b.kind === "vertex" ? name : name.replace(/-001$/, "-preview");
};

// Veo 3.1 đầy đủ tính cùng giá cho 720p và 1080p nên dùng 1080p; Lite/Fast 1080p đắt hơn nên giữ 720p.
const videoResolution = (model: string) => (/lite|fast/.test(model) ? "720p" : "1080p");

export type InlineImage = { mimeType: string; data: string };

/* ---------- Phân loại lỗi ---------- */

const text = (e: unknown) => (e instanceof Error ? e.message : String(e));
const isRateLimit = (e: unknown) => /429|RESOURCE_EXHAUSTED/.test(text(e)) && !isOutOfMoney(e);
const isOutOfMoney = (e: unknown) =>
  /prepayment credits are depleted|"code":402|limit: 0|BILLING_DISABLED|requires billing|billing account .*(disabled|closed)/i.test(
    text(e),
  );
const isNoAccess = (e: unknown) =>
  /API key not valid|API_KEY_INVALID|"code":40[13]|PERMISSION_DENIED|UNAUTHENTICATED|Could not load the default credentials/i.test(
    text(e),
  );
// Hết thời gian chờ (Google không trả lời): thử model / nguồn khác thay vì treo mãi.
const isTimeout = (e: unknown) => /TimeoutError|aborted|timed? ?out/i.test(`${(e as Error)?.name ?? ""} ${text(e)}`);
const timeout = (ms: number) => AbortSignal.timeout(ms);
const isMissingModel = (e: unknown) => /"code":404|not found|not supported/i.test(text(e));

// Lỗi do nguồn (hết tiền / hết quyền / bị giới hạn) → nên chuyển nguồn; lỗi do ảnh, prompt… thì không.
const isBackendProblem = (e: unknown) => isRateLimit(e) || isOutOfMoney(e) || isNoAccess(e);

function markDown(b: Backend, e: unknown) {
  // Hết tiền: bỏ qua 6 giờ (credit dùng thử hết thì không tự có lại); mất quyền: 30 phút; bị giới hạn theo phút: 1 phút.
  const ms = isRateLimit(e) ? 60_000 : isOutOfMoney(e) ? 6 * 3600_000 : 30 * 60_000;
  b.downUntil = Date.now() + ms;
  console.warn(`[ai] ${b.name} tạm bỏ qua ${ms / 1000}s:`, text(e).slice(0, 200));
}

// Các nguồn đang dùng được; nếu tất cả đều đang bị tạm bỏ qua vì lỗi thì vẫn thử hết (có thể đã hồi phục).
function available() {
  const all = backends().filter(usable);
  if (!all.length) throw new Error("Hệ thống AI đang tạm ngưng (các nguồn đã tắt hoặc hết credit). Vui lòng liên hệ quản trị viên.");
  const ok = all.filter((b) => b.downUntil <= Date.now());
  return ok.length ? ok : all;
}

// Đổi lỗi thô (JSON dài của Google) thành câu tiếng Việt ngắn để hiện trên điện thoại.
export function friendlyError(e: unknown): string {
  const msg = text(e);
  if (/prepayment credits are depleted|"code":402/.test(msg))
    return "Tài khoản AI đã hết credit. Nạp thêm hoặc thêm tài khoản dự phòng.";
  if (/free_tier|FreeTier/.test(msg) && /limit: 0/.test(msg))
    return "Tài khoản Google AI chưa bật thanh toán (billing) nên chưa dùng được model này.";
  if (/429|RESOURCE_EXHAUSTED/.test(msg)) return "Đang quá tải hoặc hết hạn mức, thử lại sau ít phút.";
  if (isTimeout(e)) return "AI phản hồi quá lâu, vui lòng thử lại.";
  if (isNoAccess(e)) return "API key / tài khoản không hợp lệ hoặc không có quyền dùng model này.";
  if (/"code":404|was not found or your project does not have access/.test(msg))
    return "Không tìm thấy model hoặc tài khoản chưa có quyền dùng model này (kiểm tra VEO_MODEL / GEMINI_IMAGE_MODEL).";
  if (/SAFETY|blocked|filtered/i.test(msg)) return "Ảnh bị bộ lọc an toàn chặn, hãy thử ảnh khác.";
  return msg.startsWith("{") ? "Có lỗi từ máy chủ AI, thử lại sau." : msg;
}

export function parseDataUrl(dataUrl: string): InlineImage {
  const m = /^data:(image\/[\w+.-]+);base64,(.+)$/.exec(dataUrl);
  if (!m) throw new Error("Ảnh không hợp lệ");
  return { mimeType: m[1], data: m[2] };
}

// Hạn mức theo phút hay trả 429 khi gửi dồn dập: chờ rồi thử lại thay vì báo lỗi ngay.
async function withRetry<T>(fn: () => Promise<T>, delays: number[]): Promise<T> {
  for (let i = 0; ; i++) {
    try {
      return await fn();
    } catch (e) {
      console.error(`[ai] attempt ${i + 1} failed:`, text(e).slice(0, 300));
      if (i >= delays.length || !isRateLimit(e)) throw e;
      await new Promise((r) => setTimeout(r, delays[i] + Math.random() * 1000));
    }
  }
}

/* ---------- Ảnh ---------- */

// Với mỗi nguồn: thử lần lượt các model; nguồn có vấn đề thì chuyển sang nguồn sau.
// preferred: model người dùng chọn, thử trước; nghẽn thì vẫn lùi về các model còn lại.
async function editImage(
  image: InlineImage,
  prompt: string,
  aspectRatio?: string,
  preferred?: string,
): Promise<InlineImage & { model: string; source: string }> {
  const models = preferred ? [preferred, ...IMAGE_MODELS.filter((m) => m !== preferred)] : IMAGE_MODELS;
  let lastError: unknown;
  for (const b of available()) {
    for (const model of models) {
      try {
        // Chờ ngắn 1 lần rồi chuyển model, để khách không phải đợi lâu.
        const res = await withRetry(
          () =>
            b.image.models.generateContent({
              model,
              contents: [{ role: "user", parts: [{ inlineData: image }, { text: prompt }] }],
              config: { responseModalities: ["IMAGE"], ...(aspectRatio && { imageConfig: { aspectRatio } }), abortSignal: timeout(90_000) },
            }),
          [3000],
        );
        const part = res.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
        if (!part?.inlineData?.data) throw new Error("AI không trả về ảnh (có thể bị bộ lọc an toàn chặn)");
        return { mimeType: part.inlineData.mimeType ?? "image/png", data: part.inlineData.data, model, source: b.id };
      } catch (e) {
        lastError = e;
        if (isRateLimit(e) || isMissingModel(e) || isTimeout(e)) continue; // thử model khác cùng nguồn
        if (isBackendProblem(e)) break; // hết tiền / mất quyền → sang nguồn khác
        throw e; // lỗi do ảnh hoặc prompt: đổi nguồn cũng không giúp được
      }
    }
    if (isBackendProblem(lastError)) markDown(b, lastError);
  }
  throw lastError;
}

export function cleanNote(note: unknown): string {
  return typeof note === "string" ? note.replace(/\s+/g, " ").trim().slice(0, NOTE_MAX) : "";
}

// Ghép mô tả của người dùng (thường là tiếng Việt) vào prompt. Mô tả được ưu tiên,
// kể cả khi muốn đổi màu móng; phần nào không nhắc tới thì giữ nguyên.
function withNote(base: string, note: string) {
  if (!note) return `${base} ${KEEP_DESIGN}`;
  return (
    `${base} The client also asked (in Vietnamese), follow it carefully and give it priority: "${note}". ` +
    `If the request changes the nails, apply exactly that change; keep every other detail of the manicure identical. ` +
    KEEP_DESIGN.replace("Keep the manicure design exactly identical", "Otherwise keep the manicure design identical")
  );
}

// Chỉ nhận các tỉ lệ đã hỗ trợ; tỉ lệ lạ thì bỏ qua (giữ khung gốc).
export const cleanRatio = (r: unknown, allowed = IMAGE_RATIOS) =>
  typeof r === "string" && allowed.includes(r) ? r : undefined;
export const cleanVideoRatio = (r: unknown) => cleanRatio(r, VIDEO_RATIOS) ?? "9:16";

const orientation = (ratio: string) => {
  const [w, h] = ratio.split(":").map(Number);
  return w === h ? "square" : w > h ? "horizontal" : "vertical";
};

// Khung 9:16 (Story, Reels, TikTok): mép trên/dưới bị tên tài khoản, nút và chữ của app che.
const safeZone = (ratio: string) =>
  ratio === "9:16"
    ? " Keep the hands and nails in the central area, leaving the top and bottom edges as calm background because app buttons and captions cover them."
    : "";

// Đổi khung ảnh theo tỉ lệ nền tảng: mở rộng bối cảnh, không cắt mất móng.
const reframe = (ratio: string) =>
  ` Output a ${orientation(ratio)} ${ratio} frame: extend or recompose the scene naturally so the whole manicure stays fully visible, uncropped and well centered.` +
  safeZone(ratio);

export async function enhanceImage(image: InlineImage, styleId: string, note = "", ratio?: string, model?: string) {
  const style =
    styleId === CUSTOM_STYLE.id && note
      ? {
          prompt:
            "Transform this nail photo according to the client's request below. Make a clearly visible, high-impact improvement, " +
            "not a subtle one: if the request is vague (e.g. 'a prettier background'), confidently choose an elegant, on-trend " +
            "beauty-shoot setting with styled props, flattering soft light and depth of field, so the result looks like a premium " +
            "nail salon advertisement.",
        }
      : IMAGE_STYLES.find((s) => s.id === styleId);
  if (!style) throw new Error("Style không tồn tại");
  if (isDemo()) return { url: `data:${image.mimeType};base64,${image.data}`, model: model ?? "demo", source: "demo" };
  const out = await editImage(image, withNote(style.prompt, note) + (ratio ? reframe(ratio) : ""), ratio, model);
  // Trả kèm model thực tế đã dùng (có thể khác model đã chọn nếu model đó đang bận) và nguồn đã xử lý.
  return { url: `data:${out.mimeType};base64,${out.data}`, model: out.model, source: out.source };
}

/* ---------- Video ---------- */

// Veo chỉ có khung 16:9 hoặc 9:16; ảnh khác tỉ lệ sẽ bị viền đen. Mở rộng ảnh đúng khung trước.
const toFrame = (ratio: string) =>
  `Extend this photo into a ${orientation(ratio)} ${ratio} frame by naturally continuing the background and scene around it. ` +
  `Do not crop, zoom or move the hands.${safeZone(ratio)} ${KEEP_DESIGN}`;

// Mã video trả cho trình duyệt gồm "mã nguồn|tên operation", để lần hỏi tiến độ
// sau gọi đúng nguồn đã tạo video.
const encodeOp = (b: Backend, name: string) => `${b.id}|${name}`;
function decodeOp(token: string) {
  const i = token.indexOf("|");
  const b = backends().find((x) => x.id === token.slice(0, i));
  if (i < 0 || !b) throw new Error("Mã video không hợp lệ");
  return { b, name: token.slice(i + 1) };
}

// Video sẽ được cắt phần giữa (bài viết 4:5, vuông 1:1): dặn AI giữ tay trong vùng giữ lại.
function cropZone(ratio: string, crop?: string) {
  if (!crop) return "";
  const [sw, sh] = ratio.split(":").map(Number);
  const [cw, ch] = crop.split(":").map(Number);
  const keep = Math.round(100 * (sw / sh) * (ch / cw));
  return ` The final video will be center-cropped to ${crop}, so keep the hands and every nail inside the middle ${keep}% of the frame height at all times.`;
}

export async function startVideo(
  image: InlineImage,
  motionId: string,
  note = "",
  ratio = "9:16",
  crop?: string,
  model?: string,
) {
  const motion =
    motionId === CUSTOM_MOTION.id && note
      ? {
          prompt:
            "Animate this nail photo into a short, photorealistic beauty video exactly as the client describes below, " +
            "with smooth natural motion and cinematic lighting.",
        }
      : VIDEO_MOTIONS.find((m) => m.id === motionId);
  if (!motion) throw new Error("Chuyển động không tồn tại");
  if (isDemo()) throw new Error("Chế độ demo: cần cấu hình Google AI để tạo video");

  // Nếu mở rộng lỗi thì vẫn tạo video từ ảnh gốc (chấp nhận viền đen).
  const frame = await editImage(image, toFrame(ratio) + cropZone(ratio, crop), ratio).catch(() => image);

  let lastError: unknown;
  for (const b of available()) {
    try {
      const op = await withRetry(
        () =>
          b.video.models.generateVideos({
            model: videoModel(b, model),
            source: {
              prompt: withNote(motion.prompt, note) + cropZone(ratio, crop),
              image: { imageBytes: frame.data, mimeType: frame.mimeType },
            },
            config: {
              aspectRatio: ratio,
              resolution: videoResolution(videoModel(b, model)),
              durationSeconds: 8, // 1080p bắt buộc 8 giây
              negativePrompt: VIDEO_NEGATIVE,
              personGeneration: "allow_adult",
              numberOfVideos: 1,
              abortSignal: timeout(60_000),
            },
          }),
        [5000],
      );
      if (!op.name) throw new Error("Không khởi tạo được video");
      return { token: encodeOp(b, op.name), source: b.id };
    } catch (e) {
      lastError = e;
      if (!isBackendProblem(e) && !isMissingModel(e)) throw e;
      markDown(b, e);
    }
  }
  throw lastError;
}

export async function getVideo(token: string) {
  if (isDemo()) throw new Error("Chế độ demo");
  const { b, name } = decodeOp(token);
  const ref = new GenerateVideosOperation();
  ref.name = name;
  const op = await b.video.operations.getVideosOperation({ operation: ref, config: { abortSignal: timeout(20_000) } });
  if (!op.done) return { done: false as const };
  if (op.error) throw new Error(String(op.error.message ?? "Tạo video thất bại"));
  // AI Studio trả về link tải; Vertex (không cấu hình Cloud Storage) trả thẳng dữ liệu video.
  const video = op.response?.generatedVideos?.[0]?.video;
  if (!video?.uri && !video?.videoBytes) {
    const reasons = op.response?.raiMediaFilteredReasons?.join("; ");
    throw new Error(reasons || "Video bị bộ lọc an toàn chặn, hãy thử kiểu chuyển động khác");
  }
  return { done: true as const, video, apiKey: b.apiKey };
}

// Link video của AI Studio cần API key để tải, nên server tải hộ và trả lại cho trình duyệt.
export async function fetchVideo(video: { uri?: string; videoBytes?: string }, apiKey?: string): Promise<Response> {
  if (video.videoBytes) return new Response(Buffer.from(video.videoBytes, "base64"));
  return fetch(video.uri!, { headers: { "x-goog-api-key": apiKey ?? "" } });
}

// Tình trạng từng nguồn (trang admin, /api/health; không lộ key): lỗi tạm thời, đang tắt, hết credit ước tính.
export function backendStatus() {
  return backends().map((b) => {
    const credit = b.credit ? creditState(b.id, b.credit) : null;
    return {
      id: b.id,
      name: b.name,
      enabled: b.enabled,
      exhausted: !!credit?.exhausted,
      available: b.enabled && !credit?.exhausted && b.downUntil <= Date.now(),
      retryInSeconds: Math.max(0, Math.round((b.downUntil - Date.now()) / 1000)),
    };
  });
}

// Kiểm tra kết nối (dùng cho trang admin): đếm token 1 chữ (miễn phí) trên model tạo ảnh chính của app.
// Khác với việc chỉ hỏi thông tin model, lệnh này kiểm tra thật project, quyền truy cập, API key
// và quyền dùng đúng model app cần (model cũ như gemini-2.5-flash đã bị ngừng với tài khoản mới).
export async function testConnection(sources: RuntimeSource[]) {
  const list = build(sources);
  if (!list.length) return [{ id: "", name: "—", ok: false, message: "Chưa có nguồn nào." }];
  return Promise.all(
    list.map(async (b) => {
      try {
        await b.image.models.countTokens({ model: IMAGE_MODELS[0], contents: "ping", config: { abortSignal: timeout(15_000) } });
        return { id: b.id, name: b.name, ok: true, message: "Kết nối được" };
      } catch (e) {
        return { id: b.id, name: b.name, ok: false, message: friendlyError(e) };
      }
    }),
  );
}

/* ---------- Viết caption đăng mạng xã hội ---------- */

// Model viết chữ: thử lần lượt (model cũ như gemini-2.5-flash đã ngừng với tài khoản mới).
const TEXT_MODELS = [process.env.GEMINI_TEXT_MODEL, "gemini-3.8-flash", "gemini-3.5-flash", "gemini-3.1-flash-lite"].filter(Boolean) as string[];

export type CaptionOptions = {
  platform: "facebook" | "instagram" | "tiktok";
  tone: "sang-trong" | "de-thuong" | "khuyen-mai" | "toi-gian";
  lang: string; // mã trong CAPTION_LANGS
  withVi: boolean; // thêm bản tiếng Việt bên dưới để chủ tiệm hiểu nội dung
  salon: string;
  contact: string; // SĐT / địa chỉ / link đặt lịch
  note: string; // ưu đãi, thông tin thêm
};
export type Caption = { caption: string; hashtags: string[] };

const PLATFORM_GUIDE = {
  facebook: "Facebook post: 3–6 short lines, warm and inviting, a clear call to book (inbox / call), 5–8 hashtags at the end.",
  instagram: "Instagram caption: a catchy first line, 2–4 short lines with tasteful emojis, a call to action, 10–15 relevant hashtags.",
  tiktok: "TikTok caption: very short and punchy (1–2 lines, under 150 characters), trendy tone, 4–6 hashtags including trending nail tags.",
};
const TONE_GUIDE = {
  "sang-trong": "luxurious, elegant, refined vocabulary, few emojis",
  "de-thuong": "cute, playful, friendly, youthful, more emojis",
  "khuyen-mai": "promotional and urgent: highlight the offer and a deadline, strong call to action",
  "toi-gian": "minimal, calm and aesthetic, very few words",
};
function langGuide(id: string, withVi: boolean) {
  const l = langOf(id);
  if (l.id === "vi") return "Write in natural Vietnamese as spoken by Vietnamese nail salons (with full diacritics). Hashtags may mix Vietnamese without diacritics and English.";
  return (
    `Write in natural, fluent ${l.name} as a local nail salon in ${l.market} would, with correct spelling, diacritics and local beauty vocabulary (do not translate word by word). ` +
    `Hashtags: mostly ${l.name} and popular English nail hashtags. ` +
    (withVi ? "After the main text, add a blank line and then a faithful Vietnamese translation of it (with full diacritics) so the Vietnamese owner understands it." : "")
  );
}

// Viết 3 lựa chọn caption từ ảnh móng (nếu có) + thông tin tiệm.
export async function writeCaptions(image: InlineImage | null, o: CaptionOptions): Promise<{ captions: Caption[]; model: string; source: string }> {
  if (isDemo()) throw new Error("Chế độ demo: cần cấu hình Google AI để viết caption");
  const prompt =
    "You are a social media copywriter for a nail salon. " +
    (image ? "Look closely at the nail photo: describe the real colors, finish, shape and nail art you can see (do not invent details). " : "") +
    `${PLATFORM_GUIDE[o.platform]} Tone: ${TONE_GUIDE[o.tone]}. ${langGuide(o.lang, o.withVi)} ` +
    (o.salon ? `Salon name: "${o.salon}". ` : "") +
    (o.contact ? `Include this contact / booking info exactly: "${o.contact}". ` : "") +
    (o.note
      ? `The owner's note, written in Vietnamese: "${o.note}". Use its meaning (design details, offers) naturally in the caption's language; ` +
        "never copy or quote the Vietnamese words in the main text. "
      : "") +
    "Write 3 clearly different options. Put hashtags only in the hashtags array (each starting with #), not inside the caption. " +
    'Return JSON only: [{"caption": string, "hashtags": string[]}].';
  const parts = [...(image ? [{ inlineData: image }] : []), { text: prompt }];
  let lastError: unknown;
  for (const b of available()) {
    for (const model of TEXT_MODELS) {
      try {
        const res = await withRetry(
          () => b.image.models.generateContent({ model, contents: [{ role: "user", parts }], config: { responseMimeType: "application/json", temperature: 0.9, abortSignal: timeout(45_000) } }),
          [3000],
        );
        const list = JSON.parse(res.text ?? "[]") as Caption[];
        const captions = list
          .filter((c) => typeof c?.caption === "string" && c.caption.trim())
          .slice(0, 3)
          .map((c) => ({ caption: c.caption.trim(), hashtags: (Array.isArray(c.hashtags) ? c.hashtags : []).map((h) => `#${String(h).replace(/^#+/, "").replace(/\s+/g, "")}`).filter((h) => h.length > 1) }));
        if (!captions.length) throw new Error("AI chưa viết được caption, thử lại nhé");
        return { captions, model, source: b.id };
      } catch (e) {
        lastError = e;
        if (isRateLimit(e) || isMissingModel(e) || isTimeout(e)) continue;
        if (isBackendProblem(e)) break;
        throw e;
      }
    }
    if (isBackendProblem(lastError)) markDown(b, lastError);
  }
  throw lastError;
}

/* ---------- Xoá nền ảnh (trình thiết kế) ----------
 * Model ảnh không xuất được nền trong suốt, nên nhờ AI thay nền bằng 1 màu xanh lá thuần;
 * trình duyệt tách màu xanh đó thành trong suốt. */

export const KEY_GREEN = "#00FF00";

export async function removeBackground(image: InlineImage, model?: string) {
  if (isDemo()) throw new Error("Chế độ demo: cần cấu hình Google AI để xoá nền ảnh");
  const prompt =
    "Keep the main subject of this image (logo, text, product, hands, person or object) exactly as it is: same shape, colors, size and position, " +
    `with clean crisp edges. Replace everything else (the whole background) with a perfectly flat, uniform pure green color ${KEY_GREEN}: ` +
    "no shadows, no gradients, no reflections, no texture, no green tint on the subject. Do not add, remove or redraw anything.";
  const out = await editImage(image, prompt, undefined, model);
  return { url: `data:${out.mimeType};base64,${out.data}`, model: out.model, source: out.source };
}
