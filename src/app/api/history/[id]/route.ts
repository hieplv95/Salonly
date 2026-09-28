import type { NextRequest } from "next/server";
import { apiAccess } from "@/lib/auth/session";
import { peekVisitor } from "@/lib/auth/visitor";
import { deleteHistory, ownerOf, readHistory } from "@/lib/history";

async function ownerFromRequest() {
  const { user, denied } = await apiAccess();
  if (denied) return { denied, owner: null };
  return { denied: null, owner: ownerOf(user, await peekVisitor()) };
}

// Ảnh trong lịch sử (?thumb=1: ảnh thu nhỏ). Chỉ chủ sở hữu mới xem được.
export async function GET(req: NextRequest, ctx: RouteContext<"/api/history/[id]">) {
  const { denied, owner } = await ownerFromRequest();
  if (denied) return denied;
  const { id } = await ctx.params;
  const file = owner && (await readHistory(owner, id, req.nextUrl.searchParams.has("thumb")));
  if (!file) return new Response("Không tìm thấy ảnh", { status: 404 });
  return new Response(new Uint8Array(file.data), { headers: { "Content-Type": file.mime, "Cache-Control": "private, max-age=31536000, immutable" } });
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/history/[id]">) {
  const { denied, owner } = await ownerFromRequest();
  if (denied) return denied;
  const { id } = await ctx.params;
  return owner && (await deleteHistory(owner, id)) ? Response.json({ ok: true }) : Response.json({ error: "Không tìm thấy ảnh" }, { status: 404 });
}
