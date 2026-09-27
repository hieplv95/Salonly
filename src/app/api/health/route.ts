import { backendStatus } from "@/lib/gemini";
import { apiGuard } from "@/lib/auth/session";

// Xem nhanh các nguồn AI đang dùng được hay đang bị tạm bỏ qua (không lộ key).
export async function GET() {
  const denied = await apiGuard();
  if (denied) return denied;
  return Response.json({ backends: backendStatus() });
}
