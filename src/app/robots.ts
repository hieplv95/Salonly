import type { MetadataRoute } from "next";
import { AI_BOTS, PRIVATE_PATHS, loadSeo } from "@/lib/seo";

// robots.txt theo cài đặt SEO & GEO trong trang quản trị.
export default async function robots(): Promise<MetadataRoute.Robots> {
  const { seo, base } = await loadSeo();
  if (!seo.indexing) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE_PATHS },
      seo.allowAiBots ? { userAgent: AI_BOTS, allow: "/", disallow: PRIVATE_PATHS } : { userAgent: AI_BOTS, disallow: "/" },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
