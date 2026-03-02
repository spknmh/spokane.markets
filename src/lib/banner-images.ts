import { db } from "@/lib/db";
import { COMMUNITY_IMAGES } from "@/lib/community-images";

export const BANNER_KEYS = [
  "hero",
  "farmersMarket",
  "produce",
  "craftStall",
  "community",
  "localVendor",
  "marketCrowd",
  "events",
] as const;

export type BannerKey = (typeof BANNER_KEYS)[number];

/** Returns banner URLs from DB, falling back to COMMUNITY_IMAGES defaults. */
export async function getBannerImages(): Promise<Record<BannerKey, string>> {
  const rows = await db.siteConfig.findMany({
    where: { key: { in: [...BANNER_KEYS] } },
  });
  const overrides: Record<string, string> = {};
  for (const row of rows) {
    overrides[row.key] = row.value;
  }
  return {
    hero: overrides.hero ?? COMMUNITY_IMAGES.hero,
    farmersMarket: overrides.farmersMarket ?? COMMUNITY_IMAGES.farmersMarket,
    produce: overrides.produce ?? COMMUNITY_IMAGES.produce,
    craftStall: overrides.craftStall ?? COMMUNITY_IMAGES.craftStall,
    community: overrides.community ?? COMMUNITY_IMAGES.community,
    localVendor: overrides.localVendor ?? COMMUNITY_IMAGES.localVendor,
    marketCrowd: overrides.marketCrowd ?? COMMUNITY_IMAGES.marketCrowd,
    events: overrides.events ?? COMMUNITY_IMAGES.events,
  };
}
