import { apiAccess } from "@/lib/auth/session";
import { peekVisitor } from "@/lib/auth/visitor";
import { listHistory, ownerOf } from "@/lib/history";

// Danh sách ảnh đã tạo của người đang dùng (thành viên theo tài khoản, khách theo trình duyệt).
export async function GET() {
  const { user, denied } = await apiAccess();
  if (denied) return denied;
  const owner = ownerOf(user, await peekVisitor());
  return Response.json({ items: owner ? listHistory(owner) : [], guest: owner?.visitor != null || !owner });
}
