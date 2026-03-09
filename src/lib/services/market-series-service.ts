/**
 * MarketSeriesService: unified access to markets.
 * When USE_NEW_MODELS=true, reads from market_series and adapts to Market-like shape.
 * When false, reads from legacy markets table.
 */

import { db } from "@/lib/db";
import type { Market, Venue, Event } from "@prisma/client";

const USE_NEW_MODELS = process.env.USE_NEW_MODELS === "true";

/** Market-like shape with venue and events. */
export type MarketForDisplay = Market & {
  venue: Venue;
  events: (Event & { venue: Venue })[];
};

export function useNewModels(): boolean {
  return USE_NEW_MODELS;
}

/**
 * Find market by slug. Returns Market-like shape for compatibility.
 */
export async function findMarketBySlug(slug: string): Promise<MarketForDisplay | null> {
  if (USE_NEW_MODELS) {
    const ms = await db.marketSeries.findUnique({
      where: { slug },
      include: {
        location: true,
        eventOccurrences: {
          where: { status: "PUBLISHED", startDate: { gte: new Date() } },
          orderBy: { startDate: "asc" },
          take: 10,
          include: { location: true },
        },
      },
    });
    if (!ms) return null;
    return adaptMarketSeriesToMarket(ms);
  }

  return db.market.findUnique({
    where: { slug },
    include: {
      venue: true,
      events: {
        where: { status: "PUBLISHED", startDate: { gte: new Date() } },
        orderBy: { startDate: "asc" },
        take: 10,
        include: { venue: true },
      },
    },
  }) as Promise<MarketForDisplay | null>;
}

function adaptMarketSeriesToMarket(ms: {
  id: string;
  name: string;
  slug: string;
  locationId: string;
  description: string | null;
  imageUrl: string | null;
  websiteUrl: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  baseArea: string | null;
  verificationStatus: string;
  ownerId: string | null;
  typicalSchedule: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  participationMode: string;
  vendorCapacity: number | null;
  publicIntentListEnabled: boolean;
  publicIntentNamesEnabled: boolean;
  publicRosterEnabled: boolean;
  rosterClaimRequired: boolean;
  legacyMarketId: string | null;
  createdAt: Date;
  updatedAt: Date;
  location: { id: string; name: string; address: string; city: string; state: string; zip: string; lat: number; lng: number; neighborhood: string | null; parkingNotes: string | null };
  eventOccurrences: { id: string; slug: string; title: string; startDate: Date; endDate: Date; timezone: string | null; legacyEventId: string | null; location: { id: string; name: string; address: string; city: string; state: string; zip: string; lat: number; lng: number; neighborhood: string | null; parkingNotes: string | null } }[];
}): MarketForDisplay {
  const venue = ms.location as unknown as Venue;
  const events = ms.eventOccurrences.map((eo) => ({
    id: eo.legacyEventId ?? eo.id,
    marketId: ms.legacyMarketId,
    venueId: eo.location.id,
    title: eo.title,
    slug: eo.slug,
    description: null,
    startDate: eo.startDate,
    endDate: eo.endDate,
    timezone: eo.timezone,
    imageUrl: null,
    status: "PUBLISHED" as const,
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
    venue: eo.location as unknown as Venue,
  })) as (Event & { venue: Venue })[];

  return {
    id: ms.legacyMarketId ?? ms.id,
    name: ms.name,
    slug: ms.slug,
    venueId: ms.location.id,
    description: ms.description,
    imageUrl: ms.imageUrl,
    websiteUrl: ms.websiteUrl,
    facebookUrl: ms.facebookUrl,
    instagramUrl: ms.instagramUrl,
    baseArea: ms.baseArea,
    verificationStatus: ms.verificationStatus as "UNVERIFIED" | "PENDING" | "VERIFIED",
    ownerId: ms.ownerId,
    typicalSchedule: ms.typicalSchedule,
    contactEmail: ms.contactEmail,
    contactPhone: ms.contactPhone,
    participationMode: ms.participationMode as "OPEN" | "REQUEST_TO_JOIN" | "INVITE_ONLY" | "CAPACITY_LIMITED",
    vendorCapacity: ms.vendorCapacity,
    publicIntentListEnabled: ms.publicIntentListEnabled,
    publicIntentNamesEnabled: ms.publicIntentNamesEnabled,
    publicRosterEnabled: ms.publicRosterEnabled,
    rosterClaimRequired: ms.rosterClaimRequired,
    createdAt: ms.createdAt,
    updatedAt: ms.updatedAt,
    venue,
    events,
  };
}
