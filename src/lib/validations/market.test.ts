import { describe, expect, it } from "vitest";
import {
  marketSchema,
  organizerMarketCreateSchema,
  organizerMarketPatchSchema,
} from "./market";

const baseMarketInput = {
  name: "South Hill Market",
  slug: "south-hill-market",
  venueId: "venue-1",
  description: "",
  imageUrl: "",
  imageFocalX: 50,
  imageFocalY: 50,
  websiteUrl: "",
  facebookUrl: "",
  instagramUrl: "",
  baseArea: undefined,
  typicalSchedule: "",
  contactEmail: "",
  contactPhone: "",
};

describe("market badge validation", () => {
  it("accepts listingCommunityBadgeIds in marketSchema", () => {
    const result = marketSchema.safeParse({
      ...baseMarketInput,
      listingCommunityBadgeIds: ["badge-1", "badge-2"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects too many listingCommunityBadgeIds in organizer schemas", () => {
    const tooMany = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
    const createResult = organizerMarketCreateSchema.safeParse({
      ...baseMarketInput,
      listingCommunityBadgeIds: tooMany,
    });
    const patchResult = organizerMarketPatchSchema.safeParse({
      ...baseMarketInput,
      listingCommunityBadgeIds: tooMany,
    });
    expect(createResult.success).toBe(false);
    expect(patchResult.success).toBe(false);
  });
});
