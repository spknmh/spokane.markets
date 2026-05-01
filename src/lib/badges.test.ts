import { describe, expect, it } from "vitest";
import { isAutoGrantedBadgeCategory } from "./badges";

describe("isAutoGrantedBadgeCategory", () => {
  it("returns true for USER_ACHIEVEMENT", () => {
    expect(isAutoGrantedBadgeCategory("USER_ACHIEVEMENT")).toBe(true);
  });

  it("returns false for LISTING_COMMUNITY", () => {
    expect(isAutoGrantedBadgeCategory("LISTING_COMMUNITY")).toBe(false);
  });
});
