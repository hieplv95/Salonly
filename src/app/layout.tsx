import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Playfair_Display } from "next/font/google";
import "./globals.css";
import "./logo-fonts.css";

const sans = Be_Vietnam_Pro({
  variable: "--font-sans-vn",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600"],
});

const serif = Playfair_Display({
  variable: "--font-serif-vn",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: "Salonly · AI Studio",
  description: "Tải ảnh móng lên để nhận ảnh chỉnh đẹp và video chân thực bằng AI",
  appleWebApp: { capable: true, title: "Salonly", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#f6f6f5",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${sans.variable} ${serif.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
