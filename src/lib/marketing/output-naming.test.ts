import { describe, expect, it } from "vitest";
import { buildPngFilename, buildTxtFilename, getDefaultFilenameStem } from "@/lib/marketing/output-naming";

describe("marketing output naming", () => {
  it("builds square png name with optional scale suffix", () => {
    const filename = buildPngFilename({
      stem: "Vendor Spotlight",
      profile: "SQUARE",
      scale: 2,
      includeScaleSuffix: true,
    });
    expect(filename).toBe("vendor-spotlight-square@2x.png");
  });

  it("builds ig story name and text companion names", () => {
    expect(
      buildPngFilename({
        stem: "holiday-drop",
        profile: "IG_STORY",
        scale: 1,
        includeScaleSuffix: true,
      })
    ).toBe("holiday-drop-story.png");
    expect(buildTxtFilename({ stem: "holiday-drop", key: "caption" })).toBe(
      "holiday-drop-caption.txt"
    );
  });

  it("falls back to deterministic stem", () => {
    expect(getDefaultFilenameStem("Vendor Theme 01")).toBe("vendor-theme-01");
  });
});
