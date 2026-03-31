import { describe, expect, it } from "vitest";
import { mergeUpcomingPublicVendorEvents } from "./vendor-public-events";

describe("mergeUpcomingPublicVendorEvents", () => {
  const future = new Date("2030-06-01T12:00:00.000Z");
  const past = new Date("2020-01-01T12:00:00.000Z");
  const now = new Date("2025-01-15T12:00:00.000Z");

  it("merges vendor_events and intent events without duplicate ids", () => {
    const a = {
      id: "e1",
      startDate: future,
      status: "PUBLISHED" as const,
    };
    const b = {
      id: "e2",
      startDate: future,
      status: "PUBLISHED" as const,
    };
    const merged = mergeUpcomingPublicVendorEvents([a], [b], now);
    expect(merged.map((e) => e.id).sort()).toEqual(["e1", "e2"]);
  });

  it("prefers vendor_events when same id appears in both lists", () => {
    const fromVe = {
      id: "e1",
      startDate: future,
      status: "PUBLISHED" as const,
    };
    const fromIntent = {
      id: "e1",
      startDate: future,
      status: "PUBLISHED" as const,
    };
    const merged = mergeUpcomingPublicVendorEvents([fromVe], [fromIntent], now);
    expect(merged).toHaveLength(1);
    expect(merged[0]).toBe(fromVe);
  });

  it("excludes draft and past events", () => {
    const upcoming = {
      id: "ok",
      startDate: future,
      status: "PUBLISHED" as const,
    };
    const draft = {
      id: "bad",
      startDate: future,
      status: "DRAFT" as const,
    };
    const old = {
      id: "old",
      startDate: past,
      status: "PUBLISHED" as const,
    };
    expect(
      mergeUpcomingPublicVendorEvents([upcoming, draft, old], [], now),
    ).toEqual([upcoming]);
  });
});
