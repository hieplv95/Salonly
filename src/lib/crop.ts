import "server-only";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import ffmpegPath from "ffmpeg-static";

const run = promisify(execFile);

export const CROP_RATIOS = ["4:5", "1:1"];
export const cleanCrop = (c: unknown) => (typeof c === "string" && CROP_RATIOS.includes(c) ? c : undefined);

// Kết quả cắt được giữ lại một ít trong bộ nhớ, vì trình duyệt hay tải lại video khi tua.
const g = globalThis as unknown as { __cropCache?: Map<string, Buffer> };
const cache = (g.__cropCache ??= new Map());
const CACHE_MAX = 20;

// Veo chỉ tạo được 9:16 / 16:9; bài viết IG/FB (4:5) và ảnh vuông (1:1) được cắt phần giữa
// của video 9:16, giữ nguyên bề ngang. Không tốn thêm tiền AI.
export async function cropVideo(key: string, input: Buffer, ratio: string): Promise<Buffer> {
  const cacheKey = `${key}|${ratio}`;
  const hit = cache.get(cacheKey);
  if (hit) return hit;
  if (!ffmpegPath) throw new Error("Máy chủ chưa có ffmpeg để cắt video");

  const [w, h] = ratio.split(":").map(Number);
  const dir = await mkdtemp(path.join(tmpdir(), "naile-crop-"));
  try {
    const src = path.join(dir, "in.mp4");
    const out = path.join(dir, "out.mp4");
    await writeFile(src, input);
    await run(ffmpegPath, [
      "-y",
      "-loglevel", "error",
      "-i", src,
      // Giữ toàn bộ bề ngang, cắt chiều cao ở giữa theo tỉ lệ (làm tròn số chẵn cho H.264).
      "-vf", `crop=iw:trunc(iw*${h}/${w}/2)*2`,
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p",
      "-c:a", "copy",
      "-movflags", "+faststart",
      out,
    ]);
    const result = await readFile(out);
    cache.set(cacheKey, result);
    if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value!);
    return result;
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
