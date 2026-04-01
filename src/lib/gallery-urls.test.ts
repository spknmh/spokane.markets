import { describe, expect, it } from "vitest";
import {
  GALLERY_URL_MAX,
  isAllowedGalleryImageUrl,
  parseGalleryUrlsFromMultilineText,
} from "./gallery-urls";

describe("isAllowedGalleryImageUrl", () => {
  it("allows site upload paths and http(s) URLs", () => {
    expect(isAllowedGalleryImageUrl("/uploads/vendor/a.jpg")).toBe(true);
    expect(isAllowedGalleryImageUrl("https://example.com/x.png")).toBe(true);
    expect(isAllowedGalleryImageUrl("http://example.com/x.png")).toBe(true);
  });

  it("rejects other strings", () => {
    expect(isAllowedGalleryImageUrl("")).toBe(false);
    expect(isAllowedGalleryImageUrl("ftp://x")).toBe(false);
    expect(isAllowedGalleryImageUrl("/static/foo.jpg")).toBe(false);
  });
});

describe("parseGalleryUrlsFromMultilineText", () => {
  it("keeps /uploads/ lines (admin gallery textarea)", () => {
    const text = "/uploads/vendor/a.jpg\nhttps://cdn.example.com/b.png\n";
    expect(parseGalleryUrlsFromMultilineText(text)).toEqual([
      "/uploads/vendor/a.jpg",
      "https://cdn.example.com/b.png",
    ]);
  });

  it(`caps at ${GALLERY_URL_MAX} URLs`, () => {
    const lines = Array.from({ length: 10 }, (_, i) => `https://x.com/${i}.jpg`).join("\n");
    expect(parseGalleryUrlsFromMultilineText(lines)).toHaveLength(GALLERY_URL_MAX);
  });
});
