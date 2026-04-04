import { describe, expect, it } from "vitest";
import { MARKETING_PLACEHOLDER_MAPPING } from "@/lib/marketing/prefill-map";

describe("marketing prefill mapping catalog", () => {
  it("includes required vendor spotlight placeholders", () => {
    const placeholders = new Set(MARKETING_PLACEHOLDER_MAPPING.map((item) => item.placeholder));
    expect(placeholders.has("VENDOR_NAME")).toBe(true);
    expect(placeholders.has("LISTING_URL")).toBe(true);
    expect(placeholders.has("HANDLE")).toBe(true);
  });

  it("maps event and market URL placeholders", () => {
    const eventUrl = MARKETING_PLACEHOLDER_MAPPING.find((item) => item.placeholder === "EVENT_URL");
    const marketUrl = MARKETING_PLACEHOLDER_MAPPING.find((item) => item.placeholder === "MARKET_URL");
    expect(eventUrl?.entity).toBe("Event");
    expect(marketUrl?.entity).toBe("Market");
  });
});
