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
export type BannerConfigKey =
  | BannerKey
  | `${BannerKey}FocalX`
  | `${BannerKey}FocalY`;

export interface BannerImageConfig {
  url: string;
  focalX: number;
  focalY: number;
  objectPosition: string;
}

const DEFAULT_FOCAL_X = 50;
const DEFAULT_FOCAL_Y = 50;

export function getBannerFocalXKey(key: BannerKey): `${BannerKey}FocalX` {
  return `${key}FocalX`;
}

export function getBannerFocalYKey(key: BannerKey): `${BannerKey}FocalY` {
  return `${key}FocalY`;
}

export function isBannerConfigKey(value: string): value is BannerConfigKey {
  return (
    (BANNER_KEYS as readonly string[]).includes(value) ||
    BANNER_KEYS.some(
      (key) => value === getBannerFocalXKey(key) || value === getBannerFocalYKey(key)
    )
  );
}

function parseFocalValue(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(100, Math.max(0, parsed));
}

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
      const focalX = parseFocalValue(
        overrides[getBannerFocalXKey(key)],
        DEFAULT_FOCAL_X
      );
      const focalY = parseFocalValue(
        overrides[getBannerFocalYKey(key)],
        DEFAULT_FOCAL_Y
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
    return {
      hero: {
        url: COMMUNITY_IMAGES.hero,
        focalX: DEFAULT_FOCAL_X,
        focalY: DEFAULT_FOCAL_Y,
        objectPosition: `${DEFAULT_FOCAL_X}% ${DEFAULT_FOCAL_Y}%`,
      },
      farmersMarket: {
        url: COMMUNITY_IMAGES.farmersMarket,
        focalX: DEFAULT_FOCAL_X,
        focalY: DEFAULT_FOCAL_Y,
        objectPosition: `${DEFAULT_FOCAL_X}% ${DEFAULT_FOCAL_Y}%`,
      },
      produce: {
        url: COMMUNITY_IMAGES.produce,
        focalX: DEFAULT_FOCAL_X,
        focalY: DEFAULT_FOCAL_Y,
        objectPosition: `${DEFAULT_FOCAL_X}% ${DEFAULT_FOCAL_Y}%`,
      },
      craftStall: {
        url: COMMUNITY_IMAGES.craftStall,
        focalX: DEFAULT_FOCAL_X,
        focalY: DEFAULT_FOCAL_Y,
        objectPosition: `${DEFAULT_FOCAL_X}% ${DEFAULT_FOCAL_Y}%`,
      },
      community: {
        url: COMMUNITY_IMAGES.community,
        focalX: DEFAULT_FOCAL_X,
        focalY: DEFAULT_FOCAL_Y,
        objectPosition: `${DEFAULT_FOCAL_X}% ${DEFAULT_FOCAL_Y}%`,
      },
      localVendor: {
        url: COMMUNITY_IMAGES.localVendor,
        focalX: DEFAULT_FOCAL_X,
        focalY: DEFAULT_FOCAL_Y,
        objectPosition: `${DEFAULT_FOCAL_X}% ${DEFAULT_FOCAL_Y}%`,
      },
      marketCrowd: {
        url: COMMUNITY_IMAGES.marketCrowd,
        focalX: DEFAULT_FOCAL_X,
        focalY: DEFAULT_FOCAL_Y,
        objectPosition: `${DEFAULT_FOCAL_X}% ${DEFAULT_FOCAL_Y}%`,
      },
      events: {
        url: COMMUNITY_IMAGES.events,
        focalX: DEFAULT_FOCAL_X,
        focalY: DEFAULT_FOCAL_Y,
        objectPosition: `${DEFAULT_FOCAL_X}% ${DEFAULT_FOCAL_Y}%`,
      },
    };
  }
}
