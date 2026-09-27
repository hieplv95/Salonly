import { cleanImageModel, cleanNote, cleanRatio, enhanceImage, friendlyError, isDemo, parseDataUrl } from "@/lib/gemini";
import { apiMember } from "@/lib/auth/session";
import { finalize, quotaSummary, release, reserve } from "@/lib/usage";

export const maxDuration = 120;

export async function POST(req: Request) {
  const { user, denied } = await apiMember();
  if (denied) return denied;
  const { image, styleId, note, ratio, model } = await req.json();
  const chosen = cleanImageModel(model);

  // Giữ 1 lượt trước khi gọi AI; chế độ demo không tốn phí nên không tính.
  const demo = isDemo();
  const slot = demo ? null : reserve(user, "image", chosen);
  if (slot && "error" in slot) return Response.json({ error: slot.error, quota: quotaSummary(user) }, { status: 429 });
  try {
    const out = await enhanceImage(parseDataUrl(image), styleId, cleanNote(note), cleanRatio(ratio), chosen);
    if (slot) finalize(slot.id, "image", out.model, out.source);
    return Response.json({ image: out.url, model: out.model, demo, quota: quotaSummary(user) });
  } catch (e) {
    if (slot) release(slot.id);
    return Response.json({ error: friendlyError(e) }, { status: 500 });
  }
}
