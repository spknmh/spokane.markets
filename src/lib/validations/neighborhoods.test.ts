import { describe, expect, it } from "vitest";
import {
  venueSchema,
  marketSchema,
  organizerMarketPatchSchema,
  subscriberSchema,
  savedFilterSchema,
  neighborhoodSchema,
} from "@/lib/validations";

describe("neighborhood-related validation", () => {
  it("accepts valid neighborhood slug format", () => {
    const result = neighborhoodSchema.safeParse({
      label: "Test Neighborhood",
      slug: "test-neighborhood-1",
      isActive: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid neighborhood slug format", () => {
    const result = neighborhoodSchema.safeParse({
      label: "Test Neighborhood",
      slug: "Test Neighborhood!",
      isActive: true,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid venue neighborhood slug", () => {
    const result = venueSchema.safeParse({
      name: "Venue",
      address: "123 Main St",
      city: "Spokane",
      state: "WA",
      zip: "99201",
      lat: 47.6,
      lng: -117.4,
      neighborhood: "Downtown / Riverfront",
      parkingNotes: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid market baseArea slug", () => {
    const result = marketSchema.safeParse({
      name: "Market",
      slug: "market",
      venueId: "venue-1",
      baseArea: "Downtown / Riverfront",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid organizer market baseArea slug", () => {
    const result = organizerMarketPatchSchema.safeParse({
      name: "Market",
      baseArea: "Spokane Valley / Millwood",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid subscriber areas", () => {
    const result = subscriberSchema.safeParse({
      email: "a@example.com",
      areas: ["downtown", "South Hill"],
      company: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid saved filter neighborhoods", () => {
    const result = savedFilterSchema.safeParse({
      name: "My Filter",
      neighborhoods: ["downtown", "Kendall Yards"],
    });
    expect(result.success).toBe(false);
  });
});
