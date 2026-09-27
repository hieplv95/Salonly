import type { MetadataRoute } from "next";
import { PUBLIC_PAGES, loadSeo } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { seo, base } = await loadSeo();
  if (!seo.indexing) return [];
  return PUBLIC_PAGES.map((p) => ({
    url: `${base}${p.path === "/" ? "" : p.path}`,
    changeFrequency: p.path === "/" ? "weekly" : "monthly",
    priority: p.path === "/" ? 1 : 0.5,
  }));
}
