import { describe, it, expect } from "vitest";
import { getParticipationConfig } from "./participation-config";
import type { Event, Market } from "@prisma/client";

function createEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: "ev1",
    marketId: null,
    venueId: "v1",
    title: "Test",
    slug: "test",
    description: null,
    startDate: new Date(),
    endDate: new Date(),
    timezone: null,
    imageUrl: null,
    status: "PUBLISHED",
    recurrenceGroupId: null,
    websiteUrl: null,
    facebookUrl: null,
    participationMode: null,
    vendorCapacity: null,
    publicIntentListEnabled: null,
    publicIntentNamesEnabled: null,
    publicRosterEnabled: null,
    submittedById: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Event;
}

function createMarket(overrides: Partial<Market> = {}): Market {
  return {
    id: "m1",
    name: "Test Market",
    slug: "test-market",
    venueId: "v1",
    description: null,
    imageUrl: null,
    websiteUrl: null,
    facebookUrl: null,
    instagramUrl: null,
    baseArea: null,
    verificationStatus: "UNVERIFIED",
    ownerId: null,
    typicalSchedule: null,
    contactEmail: null,
    contactPhone: null,
    participationMode: "OPEN",
    vendorCapacity: null,
    publicIntentListEnabled: true,
    publicIntentNamesEnabled: true,
    publicRosterEnabled: true,
    rosterClaimRequired: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Market;
}

describe("getParticipationConfig", () => {
  it("returns site defaults when event has no market", () => {
    const event = createEvent({ marketId: null });
    const config = getParticipationConfig(event);
    expect(config.mode).toBe("OPEN");
    expect(config.vendorCapacity).toBeNull();
    expect(config.publicIntentListEnabled).toBe(true);
    expect(config.publicIntentNamesEnabled).toBe(true);
    expect(config.publicRosterEnabled).toBe(true);
    expect(config.rosterClaimRequired).toBe(false);
  });

  it("uses market config when event has no overrides", () => {
    const market = createMarket({
      participationMode: "REQUEST_TO_JOIN",
      vendorCapacity: 50,
      publicIntentListEnabled: false,
      publicIntentNamesEnabled: false,
      publicRosterEnabled: true,
      rosterClaimRequired: true,
    });
    const event = createEvent({ marketId: market.id });
    const config = getParticipationConfig({ ...event, market });
    expect(config.mode).toBe("REQUEST_TO_JOIN");
    expect(config.vendorCapacity).toBe(50);
    expect(config.publicIntentListEnabled).toBe(false);
    expect(config.publicIntentNamesEnabled).toBe(false);
    expect(config.publicRosterEnabled).toBe(true);
    expect(config.rosterClaimRequired).toBe(true);
  });

  it("event overrides take precedence over market", () => {
    const market = createMarket({
      participationMode: "REQUEST_TO_JOIN",
      vendorCapacity: 50,
      publicIntentListEnabled: false,
    });
    const event = createEvent({
      marketId: market.id,
      participationMode: "INVITE_ONLY",
      vendorCapacity: 20,
      publicIntentListEnabled: true,
    });
    const config = getParticipationConfig({ ...event, market });
    expect(config.mode).toBe("INVITE_ONLY");
    expect(config.vendorCapacity).toBe(20);
    expect(config.publicIntentListEnabled).toBe(true);
  });

  it("event null overrides fall back to market", () => {
    const market = createMarket({
      participationMode: "CAPACITY_LIMITED",
      vendorCapacity: 30,
    });
    const event = createEvent({
      marketId: market.id,
      participationMode: null,
      vendorCapacity: null,
    });
    const config = getParticipationConfig({ ...event, market });
    expect(config.mode).toBe("CAPACITY_LIMITED");
    expect(config.vendorCapacity).toBe(30);
  });
});
