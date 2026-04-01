/** Matches `galleryUrls` refine in `vendorProfileSchema` (upload paths + http(s)). */
export const GALLERY_URL_MAX = 6;

export function isAllowedGalleryImageUrl(s: string): boolean {
  const t = s.trim();
  return t.length > 0 && (t.startsWith("/uploads/") || /^https?:\/\//.test(t));
}

/** One URL per line (admin textarea and API `galleryUrlsText`). */
export function parseGalleryUrlsFromMultilineText(text: string): string[] {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(isAllowedGalleryImageUrl)
    .slice(0, GALLERY_URL_MAX);
}
