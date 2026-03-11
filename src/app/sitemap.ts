import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const dynamic = "force-dynamic";

export function getStaticSitemapRoutes(
  baseUrl: string,
  now: Date = new Date()
): MetadataRoute.Sitemap {
  return [
    { url: baseUrl, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/events`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/events/map`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/events/calendar`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/markets`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/vendors`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/apply/vendor`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/apply/market`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/submit`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/about/backstory`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { db } = await import("@/lib/db");
  const [events, markets, vendors] = await Promise.all([
    db.event.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
    }),
    db.market.findMany({
      select: { slug: true, updatedAt: true },
    }),
    db.vendorProfile.findMany({
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const staticRoutes = getStaticSitemapRoutes(BASE_URL);

  const eventRoutes: MetadataRoute.Sitemap = events.map((e) => ({
    url: `${BASE_URL}/events/${e.slug}`,
    lastModified: e.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const marketRoutes: MetadataRoute.Sitemap = markets.map((m) => ({
    url: `${BASE_URL}/markets/${m.slug}`,
    lastModified: m.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const vendorRoutes: MetadataRoute.Sitemap = vendors.map((v) => ({
    url: `${BASE_URL}/vendors/${v.slug}`,
    lastModified: v.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...eventRoutes, ...marketRoutes, ...vendorRoutes];
}
