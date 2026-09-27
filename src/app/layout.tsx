import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Playfair_Display } from "next/font/google";
import "./globals.css";
import "./logo-fonts.css";
import { coordsOf, jsonLd, loadSeo } from "@/lib/seo";

const sans = Be_Vietnam_Pro({
  variable: "--font-sans-vn",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600"],
});

const serif = Playfair_Display({
  variable: "--font-serif-vn",
  subsets: ["latin", "vietnamese"],
});

// Tiêu đề, mô tả, chia sẻ mạng xã hội, xác minh và thẻ vị trí: lấy từ Cài đặt › SEO & GEO.
export async function generateMetadata(): Promise<Metadata> {
  const { seo, base } = await loadSeo();
  const coords = coordsOf(seo);
  const images = seo.ogImage ? [seo.ogImage] : undefined;
  const other: Record<string, string> = {};
  if (seo.bingVerification) other["msvalidate.01"] = seo.bingVerification;
  if (seo.region) other["geo.region"] = seo.region;
  if (seo.placename) other["geo.placename"] = seo.placename;
  if (coords) {
    other["geo.position"] = `${coords.lat};${coords.lng}`;
    other.ICBM = `${coords.lat}, ${coords.lng}`;
  }
  return {
    metadataBase: new URL(base),
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords.split(",").map((k) => k.trim()).filter(Boolean),
    applicationName: seo.title,
    robots: seo.indexing ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: { type: "website", locale: "vi_VN", url: base, siteName: seo.title, title: seo.title, description: seo.description, images },
    twitter: { card: images ? "summary_large_image" : "summary", title: seo.title, description: seo.description, images },
    verification: seo.googleVerification ? { google: seo.googleVerification } : undefined,
    appleWebApp: { capable: true, title: "Salonly", statusBarStyle: "default" },
    other,
  };
}

export const viewport: Viewport = {
  themeColor: "#f6f6f5",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { seo, base } = await loadSeo();
  return (
    <html lang="vi" className={`${sans.variable} ${serif.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {/* Dữ liệu có cấu trúc schema.org cho Google và công cụ AI */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(seo, base)).replace(/</g, "\\u003c") }} />
        {children}
      </body>
    </html>
  );
}
