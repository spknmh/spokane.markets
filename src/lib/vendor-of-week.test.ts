import { describe, expect, it } from "vitest";
import { getWeekKey, pickVendorOfWeekCandidate, type VendorOfWeek } from "./vendor-of-week";

function vendor(
  id: string,
  overrides: Partial<VendorOfWeek> = {}
): VendorOfWeek {
  return {
    id,
    slug: `vendor-${id}`,
    businessName: `Vendor ${id}`,
    description: null,
    imageUrl: null,
    specialties: null,
    websiteUrl: null,
    facebookUrl: null,
    instagramUrl: null,
    verificationStatus: "UNVERIFIED",
    _count: {
      vendorEvents: 0,
      favoriteVendors: 0,
    },
    ...overrides,
  };
}

describe("pickVendorOfWeekCandidate", () => {
  it("is deterministic for the same week and inputs", () => {
    const vendors = [
      vendor("a", { imageUrl: "/uploads/vendor/a.jpg", _count: { vendorEvents: 2, favoriteVendors: 1 } }),
      vendor("b", { description: "Great produce vendor" }),
      vendor("c"),
    ];
    const weekKey = "2026-W10";
    const first = pickVendorOfWeekCandidate(vendors, weekKey, []);
    const second = pickVendorOfWeekCandidate(vendors, weekKey, []);
    expect(first?.id).toBe(second?.id);
  });

  it("excludes recently selected vendors during cooldown period", () => {
    const vendors = [
      vendor("a", { imageUrl: "/uploads/vendor/a.jpg", _count: { vendorEvents: 4, favoriteVendors: 3 } }),
      vendor("b", { description: "Popular vendor", _count: { vendorEvents: 1, favoriteVendors: 1 } }),
      vendor("c"),
    ];
    const weekKey = "2026-W10";
    const history = [{ weekKey: "2026-W09", vendorId: "a" }];
    const selected = pickVendorOfWeekCandidate(vendors, weekKey, history, 8);
    expect(selected?.id).not.toBe("a");
  });

  it("falls back to full pool if all vendors are inside cooldown window", () => {
    const vendors = [
      vendor("a", { imageUrl: "/uploads/vendor/a.jpg", _count: { vendorEvents: 10, favoriteVendors: 8 } }),
      vendor("b"),
    ];
    const weekKey = "2026-W10";
    const history = [
      { weekKey: "2026-W09", vendorId: "a" },
      { weekKey: "2026-W08", vendorId: "b" },
    ];
    const selected = pickVendorOfWeekCandidate(vendors, weekKey, history, 8);
    expect(selected).not.toBeNull();
    expect(["a", "b"]).toContain(selected?.id);
  });
});

describe("getWeekKey", () => {
  it("returns a stable ISO week key format", () => {
    const key = getWeekKey(new Date("2026-03-11T12:00:00.000Z"));
    expect(key).toMatch(/^\d{4}-W\d{2}$/);
  });
});
