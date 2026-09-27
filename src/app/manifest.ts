import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Salonly · AI Studio",
    short_name: "Salonly",
    description: "Ảnh & video móng đẹp bằng AI",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f6f5",
    theme_color: "#f6f6f5",
    icons: [{ src: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
  };
}
