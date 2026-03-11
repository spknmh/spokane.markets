import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";

export type SiteTheme = "cedar" | "evergreen" | "paper" | "clay";

const SITE_THEME_KEY = "site_theme";
const VALID_THEMES: SiteTheme[] = ["cedar", "evergreen", "paper", "clay"];
export const SITE_THEME_CACHE_TAG = "site-config:theme";

export function isValidTheme(value: string): value is SiteTheme {
  return VALID_THEMES.includes(value as SiteTheme);
}

const getCachedSiteTheme = unstable_cache(
  async (): Promise<SiteTheme> => {
    try {
      const row = await db.siteConfig.findUnique({
        where: { key: SITE_THEME_KEY },
      });
      if (!row?.value || !isValidTheme(row.value)) {
        return "cedar";
      }
      return row.value as SiteTheme;
    } catch {
      return "cedar";
    }
  },
  ["site-config-theme"],
  { tags: [SITE_THEME_CACHE_TAG] }
);

export async function getSiteTheme(): Promise<SiteTheme> {
  return getCachedSiteTheme();
}
