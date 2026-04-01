import { describe, expect, it } from "vitest";
import {
  getCropPresetForBanner,
  getCropPresetForProfileAvatar,
  getCropPresetForSquareLogo,
  getCropPresetForUploaderAspect,
  shouldSkipImageCrop,
} from "./image-crop-utils";

describe("shouldSkipImageCrop", () => {
  it("skips GIF and SVG so animation / vectors stay intact", () => {
    expect(shouldSkipImageCrop(new File([], "a.gif", { type: "image/gif" }))).toBe(true);
    expect(shouldSkipImageCrop(new File([], "a.svg", { type: "image/svg+xml" }))).toBe(
      true
    );
    expect(shouldSkipImageCrop(new File([], "a.jpg", { type: "image/jpeg" }))).toBe(
      false
    );
  });
});

describe("crop presets", () => {
  it("uses round 1:1 for profile avatars", () => {
    expect(getCropPresetForProfileAvatar()).toEqual({
      aspect: 1,
      cropShape: "round",
    });
  });

  it("uses square 1:1 for logos", () => {
    expect(getCropPresetForSquareLogo()).toEqual({
      aspect: 1,
      cropShape: "rect",
    });
  });

  it("uses 16:9 for banners", () => {
    const p = getCropPresetForBanner();
    expect(p.cropShape).toBe("rect");
    expect(p.aspect).toBeCloseTo(16 / 9, 5);
  });

  it("maps uploader aspect ratio to square vs banner", () => {
    expect(getCropPresetForUploaderAspect("square")).toEqual(getCropPresetForSquareLogo());
    expect(getCropPresetForUploaderAspect("banner")).toEqual(getCropPresetForBanner());
  });
});
