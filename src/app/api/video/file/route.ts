import type { NextRequest } from "next/server";
import { cleanCrop, cropVideo } from "@/lib/crop";
import { fetchVideo, friendlyError, getVideo } from "@/lib/gemini";
import { apiAccess } from "@/lib/auth/session";
import { videoResponse } from "@/lib/video-range";

export const maxDuration = 60;

// Video gốc giữ lại một ít trong bộ nhớ: Safari tải video thành nhiều đoạn (Range),
// không nên tải lại từ Google cho mỗi đoạn.
const g = globalThis as unknown as { __videoCache?: Map<string, Buffer> };
const cache = (g.__videoCache ??= new Map());
const CACHE_MAX = 20;

async function original(op: string): Promise<Buffer | Response> {
  const hit = cache.get(op);
  if (hit) return hit;
  const status = await getVideo(op);
  if (!status.done) return new Response("Video chưa xong", { status: 409 });
  const upstream = await fetchVideo(status.video, status.apiKey);
  if (!upstream.ok) return new Response("Không tải được video", { status: 502 });
  const data = Buffer.from(await upstream.arrayBuffer());
  cache.set(op, data);
  if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value!);
  return data;
}

// Tra lại URI từ operation (không nhận URI từ client) rồi trả file mp4, hỗ trợ tải theo đoạn.
// ?crop=4:5 | 1:1 → cắt phần giữa video (cho bài viết IG/FB, ảnh vuông).
export async function GET(req: NextRequest) {
  const { denied } = await apiAccess();
  if (denied) return denied;
  const op = req.nextUrl.searchParams.get("op");
  if (!op) return new Response("Thiếu op", { status: 400 });
  const crop = cleanCrop(req.nextUrl.searchParams.get("crop"));
  try {
    const data = await original(op);
    if (data instanceof Response) return data;
    const body = crop ? await cropVideo(op, data, crop) : data;
    return videoResponse(new Uint8Array(body), req.headers.get("range"), { "Cache-Control": "private, max-age=3600" });
  } catch (e) {
    return new Response(friendlyError(e), { status: 500 });
  }
}
