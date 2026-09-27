// Hàm dùng chung phía trình duyệt cho các công cụ AI (ảnh, video, caption, thử mẫu).

// Thu nhỏ ảnh trước khi gửi để request nhẹ và nhanh hơn.
export async function fileToDataUrl(file: File, maxSide = 1536): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.92);
}

// Lỗi từ API; needAccount = khách chưa đăng nhập đã hết lượt dùng thử, cần tạo tài khoản.
export class ApiError extends Error {
  needAccount: boolean;
  data: Record<string, unknown>;
  constructor(message: string, data: Record<string, unknown> = {}) {
    super(message);
    this.needAccount = data.needAccount === true;
    this.data = data;
  }
}

export async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new ApiError(data.error || "Có lỗi xảy ra", data);
  return data;
}

export const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e));
