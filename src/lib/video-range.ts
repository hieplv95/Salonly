// Trả file video theo từng đoạn (HTTP Range). Safari/iPhone chỉ phát <video> khi máy chủ
// trả 206 + Content-Range cho yêu cầu "Range: bytes=…"; Chrome thì chấp nhận cả luồng liền.
export function videoResponse(data: Uint8Array<ArrayBuffer>, range: string | null, extra: Record<string, string> = {}): Response {
  const size = data.length;
  const base = { "Content-Type": "video/mp4", "Accept-Ranges": "bytes", ...extra };
  const m = range?.match(/^bytes=(\d*)-(\d*)$/);
  if (!m || (!m[1] && !m[2])) return new Response(data, { headers: { ...base, "Content-Length": String(size) } });

  // "bytes=500-" → từ 500 tới hết; "bytes=-500" → 500 byte cuối.
  let start = m[1] ? Number(m[1]) : Math.max(0, size - Number(m[2]));
  let end = m[1] && m[2] ? Number(m[2]) : size - 1;
  end = Math.min(end, size - 1);
  if (start >= size || start > end) return new Response(null, { status: 416, headers: { ...base, "Content-Range": `bytes */${size}` } });
  start = Math.max(0, start);
  return new Response(data.subarray(start, end + 1), {
    status: 206,
    headers: { ...base, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) },
  });
}
