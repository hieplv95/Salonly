import { llmsTxt, loadSeo } from "@/lib/seo";

// /llms.txt: giới thiệu website cho công cụ tìm kiếm AI (GEO). Tắt khi admin chặn bot AI hoặc chặn index.
export async function GET() {
  const { seo, base } = await loadSeo();
  if (!seo.indexing || !seo.allowAiBots) return new Response("Not found", { status: 404 });
  return new Response(llmsTxt(seo, base), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
