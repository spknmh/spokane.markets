import { db } from "@/lib/db";

const LANDING_KEYS = ["landing_enabled", "landing_header", "landing_text"] as const;

export interface LandingConfig {
  enabled: boolean;
  header: string;
  text: string;
}

const DEFAULTS: LandingConfig = {
  enabled: false,
  header: "Coming Soon",
  text: "We're working on something great. Check back soon!",
};

/** Returns landing page config from DB. Used by pages and API. */
export async function getLandingConfig(): Promise<LandingConfig> {
  const rows = await db.siteConfig.findMany({
    where: { key: { in: [...LANDING_KEYS] } },
  });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    enabled: map.landing_enabled === "true",
    header: map.landing_header ?? DEFAULTS.header,
    text: map.landing_text ?? DEFAULTS.text,
  };
}
