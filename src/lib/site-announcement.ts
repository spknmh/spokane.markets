const SITE_ANNOUNCEMENT_KEYS = [
  "site_announcement_enabled",
  "site_announcement_text",
  "site_announcement_link_label",
  "site_announcement_link_url",
] as const;

export interface SiteAnnouncement {
  enabled: boolean;
  text: string;
  linkLabel: string | null;
  linkUrl: string | null;
}

const DEFAULTS: SiteAnnouncement = {
  enabled: false,
  text: "",
  linkLabel: null,
  linkUrl: null,
};

export function isValidSiteAnnouncementUrl(value: string): boolean {
  return (
    value.startsWith("/") ||
    value.startsWith("http://") ||
    value.startsWith("https://")
  );
}

export function normalizeSiteAnnouncement(input: Partial<SiteAnnouncement>): SiteAnnouncement {
  const text = input.text?.trim() ?? "";
  const linkLabel = input.linkLabel?.trim() ?? "";
  const linkUrl = input.linkUrl?.trim() ?? "";

  const hasValidLink =
    Boolean(linkLabel) &&
    Boolean(linkUrl) &&
    isValidSiteAnnouncementUrl(linkUrl);

  return {
    enabled: Boolean(input.enabled) && Boolean(text),
    text,
    linkLabel: hasValidLink ? linkLabel : null,
    linkUrl: hasValidLink ? linkUrl : null,
  };
}

/** Returns the admin-managed site announcement from DB. */
export async function getSiteAnnouncement(): Promise<SiteAnnouncement> {
  try {
    const { db } = await import("@/lib/db");
    const rows = await db.siteConfig.findMany({
      where: {
        key: {
          in: [...SITE_ANNOUNCEMENT_KEYS],
        },
      },
    });

    const values = Object.fromEntries(rows.map((row) => [row.key, row.value]));

    return normalizeSiteAnnouncement({
      enabled: values.site_announcement_enabled === "true",
      text: values.site_announcement_text ?? DEFAULTS.text,
      linkLabel: values.site_announcement_link_label ?? DEFAULTS.linkLabel,
      linkUrl: values.site_announcement_link_url ?? DEFAULTS.linkUrl,
    });
  } catch {
    return DEFAULTS;
  }
}
