import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async redirects() {
    return [
      { source: "/admin/analytics", destination: "/admin", permanent: true },
      { source: "/admin/banners", destination: "/admin/content", permanent: true },
      { source: "/admin/landing", destination: "/admin/content", permanent: true },
      { source: "/admin/moderation", destination: "/admin/queues", permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "platform-lookaside.fbsbx.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
