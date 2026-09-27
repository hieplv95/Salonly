import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ffmpeg-static trỏ tới file ffmpeg.exe trong node_modules; không cho Next.js đóng gói lại.
  serverExternalPackages: ["ffmpeg-static"],
};

export default nextConfig;
