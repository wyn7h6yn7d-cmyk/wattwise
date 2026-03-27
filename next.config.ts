import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Brauserid küsivad vaikimisi /favicon.ico — suuname sama ikoonile kui /icon
  async rewrites() {
    return [{ source: "/favicon.ico", destination: "/icon" }];
  },
};

export default nextConfig;
