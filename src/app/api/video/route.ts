import type { NextRequest } from "next/server";
import { cleanCrop } from "@/lib/crop";
import { cleanNote, cleanVideoModel, cleanVideoRatio, friendlyError, getVideo, parseDataUrl, startVideo } from "@/lib/gemini";
import { apiAccess, apiMember } from "@/lib/auth/session";
import { DEFAULT_VIDEO_MODEL } from "@/lib/presets";
import { finalize, release, reserveSlot, usageInfo } from "@/lib/usage";

export const maxDuration = 120;

const fail = (e: unknown) =>
  Response.json({ error: friendlyError(e) }, { status: 500 });

// Bắt đầu tạo video, trả về tên operation để client hỏi tiến độ.
// Lượt video được tính khi Google nhận yêu cầu; không khởi tạo được thì trả lại lượt.
export async function POST(req: Request) {
  const { user, denied } = await apiMember();
  if (denied) return denied;
  const { image, motionId, note, ratio, crop, model } = await req.json();
  const chosen = cleanVideoModel(model);
  const { slot, visitor } = await reserveSlot(user, "video", chosen);
  if ("error" in slot) return Response.json({ error: slot.error, needAccount: slot.needAccount, ...usageInfo(user, visitor) }, { status: 429 });
  try {
    const { token: op, source } = await startVideo(parseDataUrl(image), motionId, cleanNote(note), cleanVideoRatio(ratio), cleanCrop(crop), chosen);
    finalize(slot.id, "video", chosen ?? DEFAULT_VIDEO_MODEL, source);
    return Response.json({ op, ...usageInfo(user, visitor) });
  } catch (e) {
    release(slot.id);
    return fail(e);
  }
}

// Hỏi tiến độ: ?op=<operation name>
export async function GET(req: NextRequest) {
  const { denied } = await apiAccess();
  if (denied) return denied;
  try {
    const op = req.nextUrl.searchParams.get("op");
    if (!op) return Response.json({ error: "Thiếu op" }, { status: 400 });
    const status = await getVideo(op);
    return Response.json(
      status.done
        ? { done: true, url: `/api/video/file?op=${encodeURIComponent(op)}` }
        : { done: false },
    );
  } catch (e) {
    return fail(e);
  }
}
