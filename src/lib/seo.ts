import "server-only";
import { headers } from "next/headers";
import { connection } from "next/server";
import { getSeo, type SiteSeo } from "./settings";

// Bot của các công cụ tìm kiếm / trợ lý AI (GEO). Admin chọn cho phép hay chặn cả nhóm.
export const AI_BOTS = [
  "GPTBot", "OAI-SearchBot", "ChatGPT-User",
  "ClaudeBot", "Claude-SearchBot", "Claude-User",
  "PerplexityBot", "Perplexity-User",
  "Google-Extended", "Applebot-Extended", "CCBot", "meta-externalagent",
];

// Trang công khai (đưa vào sitemap, llms.txt); khu quản trị và API luôn bị chặn.
export const PUBLIC_PAGES = [
  { path: "/", name: "Trang chính: tạo ảnh, video và thiết kế cho tiệm nail" },
  { path: "/register", name: "Đăng ký tài khoản miễn phí" },
  { path: "/login", name: "Đăng nhập" },
];
export const PRIVATE_PATHS = ["/admin", "/api/"];

// Đọc cài đặt lúc có request (không đóng băng vào bản build), kèm địa chỉ gốc của website.
export async function loadSeo() {
  await connection();
  const seo = getSeo();
  return { seo, base: await siteBase(seo) };
}

// Địa chỉ gốc của website: lấy từ cài đặt, chưa nhập thì theo tên miền đang truy cập.
export async function siteBase(seo: SiteSeo) {
  const set = seo.siteUrl.trim().replace(/\/+$/, "");
  if (set) return set;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

const lines = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean);

export const faqOf = (seo: SiteSeo) =>
  lines(seo.faq)
    .map((l) => l.split("|").map((p) => p.trim()))
    .filter(([q, a]) => q && a)
    .map(([q, a]) => ({ q, a }));

export const sameAsOf = (seo: SiteSeo) => lines(seo.sameAs).filter((u) => /^https?:\/\//.test(u));

const num = (s: string) => (s.trim() && Number.isFinite(Number(s)) ? Number(s) : null);
export const coordsOf = (seo: SiteSeo) => {
  const lat = num(seo.latitude), lng = num(seo.longitude);
  return lat !== null && lng !== null ? { lat, lng } : null;
};

// Dữ liệu có cấu trúc (schema.org) giúp Google và công cụ AI hiểu website là gì.
export function jsonLd(seo: SiteSeo, base: string) {
  const coords = coordsOf(seo);
  const faq = faqOf(seo);
  const org: Record<string, unknown> = {
    "@type": "Organization",
    "@id": `${base}/#org`,
    name: seo.title,
    url: base,
    description: seo.aiSummary || seo.description,
  };
  const sameAs = sameAsOf(seo);
  if (sameAs.length) org.sameAs = sameAs;
  if (seo.placename || seo.region) org.address = { "@type": "PostalAddress", addressLocality: seo.placename || undefined, addressRegion: seo.region || undefined, addressCountry: seo.region.slice(0, 2) || undefined };
  if (coords) org.location = { "@type": "Place", geo: { "@type": "GeoCoordinates", latitude: coords.lat, longitude: coords.lng } };

  const graph: Record<string, unknown>[] = [
    org,
    { "@type": "WebSite", "@id": `${base}/#website`, url: base, name: seo.title, description: seo.description, inLanguage: "vi-VN", publisher: { "@id": `${base}/#org` } },
    {
      "@type": "SoftwareApplication",
      name: seo.title,
      url: base,
      applicationCategory: "DesignApplication",
      operatingSystem: "Web",
      description: seo.aiSummary || seo.description,
      offers: { "@type": "Offer", price: 0, priceCurrency: "VND" },
      publisher: { "@id": `${base}/#org` },
    },
  ];
  if (faq.length) graph.push({ "@type": "FAQPage", mainEntity: faq.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) });
  return { "@context": "https://schema.org", "@graph": graph };
}

// /llms.txt: bản giới thiệu ngắn gọn dạng Markdown cho mô hình AI (đề xuất llmstxt.org).
export function llmsTxt(seo: SiteSeo, base: string) {
  const faq = faqOf(seo);
  const out = [`# ${seo.title}`, "", `> ${seo.description}`, ""];
  if (seo.aiSummary) out.push(seo.aiSummary, "");
  if (seo.placename || seo.region) out.push(`Khu vực: ${[seo.placename, seo.region].filter(Boolean).join(", ")}`, "");
  out.push("## Trang chính", ...PUBLIC_PAGES.map((p) => `- [${p.name}](${base}${p.path})`), "");
  if (faq.length) out.push("## Câu hỏi thường gặp", ...faq.flatMap(({ q, a }) => [`### ${q}`, a, ""]));
  const sameAs = sameAsOf(seo);
  if (sameAs.length) out.push("## Mạng xã hội", ...sameAs.map((u) => `- ${u}`), "");
  return out.join("\n");
}
