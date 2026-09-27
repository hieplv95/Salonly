import { cleanImageModel, cleanNote, cleanRatio, enhanceImage, friendlyError, isDemo, parseDataUrl } from "@/lib/gemini";
import { apiMember } from "@/lib/auth/session";
import { finalize, release, reserveSlot, usageInfo } from "@/lib/usage";

export const maxDuration = 120;

export async function POST(req: Request) {
  const { user, denied } = await apiMember();
  if (denied) return denied;
  const { image, styleId, note, ratio, model } = await req.json();
  const chosen = cleanImageModel(model);

  // Giữ 1 lượt trước khi gọi AI; chế độ demo không tốn phí nên không tính.
  const demo = isDemo();
  const { slot, visitor } = demo ? { slot: null, visitor: undefined } : await reserveSlot(user, "image", chosen);
  if (slot && "error" in slot) return Response.json({ error: slot.error, needAccount: slot.needAccount, ...usageInfo(user, visitor) }, { status: 429 });
  try {
    const out = await enhanceImage(parseDataUrl(image), styleId, cleanNote(note), cleanRatio(ratio), chosen);
    if (slot) finalize(slot.id, "image", out.model, out.source);
    return Response.json({ image: out.url, model: out.model, demo, ...usageInfo(user, visitor) });
  } catch (e) {
    if (slot) release(slot.id);
    return Response.json({ error: friendlyError(e) }, { status: 500 });
  }
}
