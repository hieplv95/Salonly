import { apiMember } from "@/lib/auth/session";
import { cleanImageModel, friendlyError, isDemo, parseDataUrl, removeBackground } from "@/lib/gemini";
import { finalize, quotaSummary, release, reserve } from "@/lib/usage";

export const maxDuration = 120;

// Xoá nền ảnh trong trình thiết kế: tính như 1 lượt tạo ảnh (hạn mức + chi phí).
export async function POST(req: Request) {
  const { user, denied } = await apiMember();
  if (denied) return denied;
  const { image, model } = await req.json();
  const chosen = cleanImageModel(model);
  const slot = isDemo() ? null : reserve(user, "image", chosen);
  if (slot && "error" in slot) return Response.json({ error: slot.error, quota: quotaSummary(user) }, { status: 429 });
  try {
    const out = await removeBackground(parseDataUrl(image), chosen);
    if (slot) finalize(slot.id, "image", out.model, out.source);
    return Response.json({ image: out.url, model: out.model });
  } catch (e) {
    if (slot) release(slot.id);
    return Response.json({ error: friendlyError(e) }, { status: 500 });
  }
}
