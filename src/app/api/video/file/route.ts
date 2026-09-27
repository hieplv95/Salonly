import type { NextRequest } from "next/server";
import { cleanCrop, cropVideo } from "@/lib/crop";
import { fetchVideo, friendlyError, getVideo } from "@/lib/gemini";
import { apiAccess } from "@/lib/auth/session";

export const maxDuration = 60;

// Tra lại URI từ operation (không nhận URI từ client) rồi stream file mp4 về.
// ?crop=4:5 | 1:1 → cắt phần giữa video (cho bài viết IG/FB, ảnh vuông).
export async function GET(req: NextRequest) {
  const { denied } = await apiAccess();
  if (denied) return denied;
  const op = req.nextUrl.searchParams.get("op");
  if (!op) return new Response("Thiếu op", { status: 400 });
  const crop = cleanCrop(req.nextUrl.searchParams.get("crop"));
  try {
    const status = await getVideo(op);
    if (!status.done) return new Response("Video chưa xong", { status: 409 });
    const upstream = await fetchVideo(status.video, status.apiKey);
    if (!upstream.ok || !upstream.body) return new Response("Không tải được video", { status: 502 });
    const headers = { "Content-Type": "video/mp4", "Cache-Control": "private, max-age=3600" };
    if (!crop) return new Response(upstream.body, { headers });

    const cropped = await cropVideo(op, Buffer.from(await upstream.arrayBuffer()), crop);
    return new Response(new Uint8Array(cropped), {
      headers: { ...headers, "Content-Length": String(cropped.length) },
    });
  } catch (e) {
    return new Response(friendlyError(e), { status: 500 });
  }
}
