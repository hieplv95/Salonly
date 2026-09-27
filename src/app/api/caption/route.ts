import { apiMember } from "@/lib/auth/session";
import { CAPTION_LANGS } from "@/lib/caption-langs";
import { cleanNote, friendlyError, parseDataUrl, writeCaptions, type CaptionOptions } from "@/lib/gemini";

export const maxDuration = 60;

const pick = <T extends string>(v: unknown, all: readonly T[], fallback: T) => (all.includes(v as T) ? (v as T) : fallback);
const short = (v: unknown, max = 120) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");

// Viết 3 lựa chọn caption + hashtag. Chỉ là AI viết chữ (rất rẻ) nên không tính vào hạn mức ảnh/video.
export async function POST(req: Request) {
  const { denied } = await apiMember();
  if (denied) return denied;
  try {
    const body = await req.json();
    const options: CaptionOptions = {
      platform: pick(body.platform, ["facebook", "instagram", "tiktok"] as const, "facebook"),
      tone: pick(body.tone, ["sang-trong", "de-thuong", "khuyen-mai", "toi-gian"] as const, "sang-trong"),
      lang: pick(body.lang, CAPTION_LANGS.map((l) => l.id), "vi"),
      withVi: body.withVi === true,
      salon: short(body.salon, 60),
      contact: short(body.contact),
      note: cleanNote(body.note),
    };
    const image = typeof body.image === "string" && body.image ? parseDataUrl(body.image) : null;
    if (!image && !options.note) return Response.json({ error: "Chọn ảnh móng hoặc ghi vài dòng mô tả để AI viết caption." }, { status: 400 });
    const out = await writeCaptions(image, options);
    return Response.json({ captions: out.captions, model: out.model });
  } catch (e) {
    return Response.json({ error: friendlyError(e) }, { status: 500 });
  }
}
