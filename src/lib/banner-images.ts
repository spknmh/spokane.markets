import { db } from "@/lib/db";
import { COMMUNITY_IMAGES } from "@/lib/community-images";
import {
  BANNER_KEYS,
  createDefaultBannerImages,
  DEFAULT_BANNER_FOCAL_X,
  DEFAULT_BANNER_FOCAL_Y,
  getBannerFocalXKey,
  getBannerFocalYKey,
  parseBannerFocalValue,
  type BannerImageConfig,
  type BannerKey,
} from "@/lib/banner-config";

/** Returns banner URLs and focal settings from DB, falling back to defaults. */
export async function getBannerImages(): Promise<Record<BannerKey, BannerImageConfig>> {
  try {
    const rows = await db.siteConfig.findMany({
      where: {
        key: {
          in: [
            ...BANNER_KEYS,
            ...BANNER_KEYS.map((key) => getBannerFocalXKey(key)),
            ...BANNER_KEYS.map((key) => getBannerFocalYKey(key)),
          ],
        },
      },
    });
    const overrides: Record<string, string> = {};
    for (const row of rows) {
      overrides[row.key] = row.value;
    }
    const makeConfig = (key: BannerKey): BannerImageConfig => {
      const url = overrides[key] ?? COMMUNITY_IMAGES[key];
      const focalX = parseBannerFocalValue(
        overrides[getBannerFocalXKey(key)],
        DEFAULT_BANNER_FOCAL_X
      );
      const focalY = parseBannerFocalValue(
        overrides[getBannerFocalYKey(key)],
        DEFAULT_BANNER_FOCAL_Y
      );
      return {
        url,
        focalX,
        focalY,
        objectPosition: `${focalX}% ${focalY}%`,
      };
    };
    return {
      hero: makeConfig("hero"),
      farmersMarket: makeConfig("farmersMarket"),
      produce: makeConfig("produce"),
      craftStall: makeConfig("craftStall"),
      community: makeConfig("community"),
      localVendor: makeConfig("localVendor"),
      marketCrowd: makeConfig("marketCrowd"),
      events: makeConfig("events"),
    };
  } catch {
    return createDefaultBannerImages();
  }
}
