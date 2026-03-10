import { describe, expect, it } from "vitest";
import { getReferrerType } from "./analytics";

describe("getReferrerType", () => {
  it("returns direct when no referrer is present", () => {
    expect(getReferrerType("", "spokane.markets")).toBe("direct");
  });

  it("classifies internal referrers", () => {
    expect(
      getReferrerType("https://www.spokane.markets/events", "spokane.markets")
    ).toBe("internal");
  });

  it("classifies search referrers", () => {
    expect(
      getReferrerType("https://www.google.com/search?q=markets", "spokane.markets")
    ).toBe("search");
  });

  it("classifies social referrers", () => {
    expect(
      getReferrerType("https://www.instagram.com/spokane", "spokane.markets")
    ).toBe("social");
  });

  it("classifies unknown valid hosts as referral", () => {
    expect(
      getReferrerType("https://example.com/some-page", "spokane.markets")
    ).toBe("referral");
  });

  it("classifies malformed referrers as unknown", () => {
    expect(getReferrerType("not-a-url", "spokane.markets")).toBe("unknown");
  });
});
