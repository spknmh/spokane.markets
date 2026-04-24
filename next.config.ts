import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  output: "standalone",
  // Caddy handles compression (`encode zstd gzip` in /opt/caddy/Caddyfile).
  // Leaving Next's default gzip on causes double-encoding → NS_ERROR_CORRUPTED_CONTENT
  // in Firefox on fresh requests (masked in non-private windows by the immutable
  // cache headers on /_next/static/*).
  compress: false,
  async redirects() {
    return [
      { source: "/admin/analytics", destination: "/admin", permanent: true },
      { source: "/admin/banners", destination: "/admin/content", permanent: true },
      { source: "/admin/landing", destination: "/admin/content", permanent: true },
      { source: "/admin/moderation", destination: "/admin/queues", permanent: true },
      { source: "/profile", destination: "/dashboard", permanent: true },
      { source: "/settings/filters", destination: "/account/saved?tab=filters", permanent: true },
      { source: "/settings/favorites", destination: "/account/saved?tab=favorites", permanent: true },
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

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  bundleSizeOptimizations: {
    excludeDebugStatements: true,
  },
  tunnelRoute: "/monitoring",
});
