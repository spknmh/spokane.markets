import type { MarketingTemplateProfile } from "@prisma/client";

function sanitizeStem(stem: string): string {
  const trimmed = stem.trim().toLowerCase();
  return trimmed.replace(/[^a-z0-9-_]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export function getDefaultFilenameStem(templateSlug: string): string {
  return sanitizeStem(templateSlug || "marketing-asset") || "marketing-asset";
}

export function buildPngFilename(opts: {
  stem: string;
  profile: MarketingTemplateProfile;
  scale: number;
  includeScaleSuffix?: boolean;
}): string {
  const safeStem = sanitizeStem(opts.stem) || "asset";
  const profileSuffix = opts.profile === "IG_STORY" ? "story" : "square";
  const scaleSuffix = opts.includeScaleSuffix && opts.scale > 1 ? `@${opts.scale}x` : "";
  return `${safeStem}-${profileSuffix}${scaleSuffix}.png`;
}

export function buildTxtFilename(opts: { stem: string; key: string }): string {
  const safeStem = sanitizeStem(opts.stem) || "asset";
  const safeKey = sanitizeStem(opts.key) || "caption";
  return `${safeStem}-${safeKey}.txt`;
}
