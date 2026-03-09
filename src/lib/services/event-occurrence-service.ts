/**
 * EventOccurrenceService: unified access to events.
 * When USE_NEW_MODELS=true, reads from event_occurrences and adapts to Event-like shape.
 * When false, reads from legacy events table.
 */

import { db } from "@/lib/db";
import type { Event, Venue, Market, EventScheduleDay, EventVendorRoster, EventVendorIntent } from "@prisma/client";

const USE_NEW_MODELS = process.env.USE_NEW_MODELS === "true";

/** Event-like shape consumed by pages and components (venue, market, roster, intents, attendances). */
export type EventForDisplay = Event & {
  venue: Venue;
  market: Market | null;
  tags: { id: string; name: string; slug: string }[];
  features: { id: string; name: string; slug: string; icon: string | null }[];
  scheduleDays: EventScheduleDay[];
  attendances: { id: string; userId: string; eventId: string; status: string }[];
  vendorRoster: (EventVendorRoster & {
    vendorProfile: { id: string; businessName: string; slug: string; imageUrl: string | null; specialties: string | null };
  })[];
  vendorIntents: (EventVendorIntent & {
    vendorProfile: { id: string; businessName: string; slug: string; imageUrl: string | null; specialties: string | null };
  })[];
};

export function useNewModels(): boolean {
  return USE_NEW_MODELS;
}

/**
 * Find event by slug. Returns Event-like shape for compatibility.
 */
export async function findEventBySlug(slug: string): Promise<EventForDisplay | null> {
  if (USE_NEW_MODELS) {
    const eo = await db.eventOccurrence.findUnique({
      where: { slug },
      include: {
        location: true,
        marketSeries: true,
        tags: true,
        features: true,
        scheduleDays: { orderBy: { date: "asc" } },
        vendorAppearances: {
          include: { vendor: true },
        },
      },
    });
    if (!eo || !eo.legacyEventId) return null;

    const attendances = await db.attendance.findMany({
      where: { eventId: eo.legacyEventId },
    });

    const rosterAppearances = eo.vendorAppearances.filter(
      (a) => a.source === "ROSTER" && ["INVITED", "ACCEPTED", "CONFIRMED"].includes(a.status)
    );
    const intentAppearances = eo.vendorAppearances.filter(
      (a) =>
        (a.source === "INTENT" && ["ATTENDING", "INTERESTED"].includes(a.status)) ||
        (a.source === "SELF_REPORTED" && a.visibility === "PUBLIC")
    );

    return adaptEventOccurrenceToEvent(eo, attendances, rosterAppearances, intentAppearances);
  }

  return db.event.findUnique({
    where: { slug },
    include: {
      venue: true,
      market: true,
      tags: true,
      features: true,
      scheduleDays: { orderBy: { date: "asc" } },
      attendances: true,
      vendorRoster: {
        where: { status: { in: ["INVITED", "ACCEPTED", "CONFIRMED"] } },
        include: {
          vendorProfile: {
            select: { id: true, businessName: true, slug: true, imageUrl: true, specialties: true },
          },
        },
      },
      vendorIntents: {
        where: {
          status: { in: ["ATTENDING", "INTERESTED"] },
          visibility: "PUBLIC",
        },
        include: {
          vendorProfile: {
            select: { id: true, businessName: true, slug: true, imageUrl: true, specialties: true },
          },
        },
      },
    },
  }) as Promise<EventForDisplay | null>;
}

/**
 * Find event by id or slug (for API routes that accept either).
 */
export async function findEventByIdOrSlug(idOrSlug: string): Promise<EventForDisplay | null> {
  if (USE_NEW_MODELS) {
    const eo = await db.eventOccurrence.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      include: {
        location: true,
        marketSeries: true,
        tags: true,
        features: true,
        scheduleDays: { orderBy: { date: "asc" } },
        vendorAppearances: { include: { vendor: true } },
      },
    });
    if (!eo || !eo.legacyEventId) return null;

    const attendances = await db.attendance.findMany({
      where: { eventId: eo.legacyEventId },
    });

    const rosterAppearances = eo.vendorAppearances.filter(
      (a) => a.source === "ROSTER" && ["INVITED", "ACCEPTED", "CONFIRMED"].includes(a.status)
    );
    const intentAppearances = eo.vendorAppearances.filter(
      (a) =>
        (a.source === "INTENT" && ["ATTENDING", "INTERESTED"].includes(a.status)) ||
        (a.source === "SELF_REPORTED" && a.visibility === "PUBLIC")
    );

    return adaptEventOccurrenceToEvent(eo, attendances, rosterAppearances, intentAppearances);
  }

  return db.event.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    include: {
      venue: true,
      market: true,
      tags: true,
      features: true,
      scheduleDays: { orderBy: { date: "asc" } },
      attendances: true,
      vendorRoster: {
        where: { status: { in: ["INVITED", "ACCEPTED", "CONFIRMED"] } },
        include: {
          vendorProfile: {
            select: { id: true, businessName: true, slug: true, imageUrl: true, specialties: true },
          },
        },
      },
      vendorIntents: {
        where: {
          status: { in: ["ATTENDING", "INTERESTED"] },
          visibility: "PUBLIC",
        },
        include: {
          vendorProfile: {
            select: { id: true, businessName: true, slug: true, imageUrl: true, specialties: true },
          },
        },
      },
    },
  }) as Promise<EventForDisplay | null>;
}

/**
 * Resolve event ID for use in Attendance, EventVendorIntent, etc.
 * When using new models, returns legacyEventId so legacy FKs still work.
 */
export async function getEventIdForLegacyFks(eventOrOccurrence: { id: string; legacyEventId?: string | null }): Promise<string> {
  if (USE_NEW_MODELS && eventOrOccurrence.legacyEventId) {
    return eventOrOccurrence.legacyEventId;
  }
  return eventOrOccurrence.id;
}

function adaptEventOccurrenceToEvent(
  eo: {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    startDate: Date;
    endDate: Date;
    timezone: string | null;
    imageUrl: string | null;
    status: string;
    recurrenceGroupId: string | null;
    websiteUrl: string | null;
    facebookUrl: string | null;
    participationMode: string | null;
    vendorCapacity: number | null;
    publicIntentListEnabled: boolean | null;
    publicIntentNamesEnabled: boolean | null;
    publicRosterEnabled: boolean | null;
    submittedById: string | null;
    legacyEventId: string | null;
    createdAt: Date;
    updatedAt: Date;
    location: { id: string; name: string; address: string; city: string; state: string; zip: string; lat: number; lng: number; neighborhood: string | null; parkingNotes: string | null };
    marketSeries: { id: string; name: string; slug: string; ownerId: string | null; participationMode: string; vendorCapacity: number | null; publicIntentListEnabled: boolean; publicIntentNamesEnabled: boolean; publicRosterEnabled: boolean; rosterClaimRequired: boolean } | null;
    tags: { id: string; name: string; slug: string }[];
    features: { id: string; name: string; slug: string; icon: string | null }[];
    scheduleDays: { id: string; date: Date; startTime: string; endTime: string; allDay: boolean }[];
    vendorAppearances: { source: string; visibility: string; vendor: { id: string; businessName: string; slug: string; imageUrl: string | null; specialties: string | null } }[];
  },
  attendances: { id: string; userId: string; eventId: string; status: string }[],
  rosterAppearances: { vendor: { id: string; businessName: string; slug: string; imageUrl: string | null; specialties: string | null } }[],
  intentAppearances: { vendor: { id: string; businessName: string; slug: string; imageUrl: string | null; specialties: string | null } }[]
): EventForDisplay {
  const venue = eo.location as unknown as Venue;
  const market = eo.marketSeries
    ? ({
        id: eo.marketSeries.id,
        name: eo.marketSeries.name,
        slug: eo.marketSeries.slug,
        ownerId: eo.marketSeries.ownerId,
        participationMode: eo.marketSeries.participationMode,
        vendorCapacity: eo.marketSeries.vendorCapacity,
        publicIntentListEnabled: eo.marketSeries.publicIntentListEnabled,
        publicIntentNamesEnabled: eo.marketSeries.publicIntentNamesEnabled,
        publicRosterEnabled: eo.marketSeries.publicRosterEnabled,
        rosterClaimRequired: eo.marketSeries.rosterClaimRequired,
      } as unknown as Market)
    : null;

  const vendorRoster = rosterAppearances.map((a) => ({
    id: "",
    eventId: eo.legacyEventId!,
    vendorProfileId: a.vendor.id,
    status: "CONFIRMED" as const,
    approvedByUserId: null,
    approvedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    vendorProfile: {
      id: a.vendor.id,
      businessName: a.vendor.businessName,
      slug: a.vendor.slug,
      imageUrl: a.vendor.imageUrl,
      specialties: a.vendor.specialties,
    },
  }));

  const vendorIntents = intentAppearances.map((a) => ({
    id: "",
    eventId: eo.legacyEventId!,
    vendorProfileId: a.vendor.id,
    status: "ATTENDING" as const,
    notes: null,
    visibility: "PUBLIC" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    vendorProfile: {
      id: a.vendor.id,
      businessName: a.vendor.businessName,
      slug: a.vendor.slug,
      imageUrl: a.vendor.imageUrl,
      specialties: a.vendor.specialties,
    },
  }));

  return {
    id: eo.legacyEventId ?? eo.id,
    marketId: null,
    venueId: eo.location.id,
    title: eo.title,
    slug: eo.slug,
    description: eo.description,
    startDate: eo.startDate,
    endDate: eo.endDate,
    timezone: eo.timezone,
    imageUrl: eo.imageUrl,
    status: eo.status as "DRAFT" | "PENDING" | "PUBLISHED" | "CANCELLED" | "REJECTED",
    recurrenceGroupId: eo.recurrenceGroupId,
    websiteUrl: eo.websiteUrl,
    facebookUrl: eo.facebookUrl,
    participationMode: eo.participationMode as "OPEN" | "REQUEST_TO_JOIN" | "INVITE_ONLY" | "CAPACITY_LIMITED" | null,
    vendorCapacity: eo.vendorCapacity,
    publicIntentListEnabled: eo.publicIntentListEnabled,
    publicIntentNamesEnabled: eo.publicIntentNamesEnabled,
    publicRosterEnabled: eo.publicRosterEnabled,
    submittedById: eo.submittedById,
    createdAt: eo.createdAt,
    updatedAt: eo.updatedAt,
    venue,
    market,
    tags: eo.tags,
    features: eo.features,
    scheduleDays: eo.scheduleDays as EventScheduleDay[],
    attendances,
    vendorRoster: vendorRoster as EventForDisplay["vendorRoster"],
    vendorIntents: vendorIntents as EventForDisplay["vendorIntents"],
  };
}
