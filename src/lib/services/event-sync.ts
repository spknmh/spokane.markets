/**
 * Dual-write sync: when USE_NEW_MODELS=true, sync Event create/update to EventOccurrence.
 * Ensures new events created via admin/organizer are available when reading from new models.
 */

import { db } from "@/lib/db";

const USE_NEW_MODELS = process.env.USE_NEW_MODELS === "true";

export async function syncEventToOccurrence(eventId: string): Promise<void> {
  if (!USE_NEW_MODELS) return;

  const event = await db.event.findUnique({
    where: { id: eventId },
    include: {
      venue: true,
      market: true,
      tags: true,
      features: true,
      scheduleDays: { orderBy: { date: "asc" } },
    },
  });
  if (!event) return;

  let location = await db.location.findUnique({
    where: { legacyVenueId: event.venueId },
  });
  if (!location) {
    location = await db.location.create({
      data: {
        name: event.venue.name,
        address: event.venue.address,
        city: event.venue.city,
        state: event.venue.state,
        zip: event.venue.zip,
        lat: event.venue.lat,
        lng: event.venue.lng,
        neighborhood: event.venue.neighborhood ?? undefined,
        parkingNotes: event.venue.parkingNotes ?? undefined,
        legacyVenueId: event.venueId,
      },
    });
  }

  let marketSeriesId: string | null = null;
  if (event.marketId) {
    let ms = await db.marketSeries.findUnique({
      where: { legacyMarketId: event.marketId },
    });
    if (!ms) {
      const market = await db.market.findUnique({
        where: { id: event.marketId },
        include: { venue: true },
      });
      if (market) {
        let loc = await db.location.findUnique({
          where: { legacyVenueId: market.venueId },
        });
        if (!loc) {
          loc = await db.location.create({
            data: {
              name: market.venue.name,
              address: market.venue.address,
              city: market.venue.city,
              state: market.venue.state,
              zip: market.venue.zip,
              lat: market.venue.lat,
              lng: market.venue.lng,
              neighborhood: market.venue.neighborhood ?? undefined,
              parkingNotes: market.venue.parkingNotes ?? undefined,
              legacyVenueId: market.venueId,
            },
          });
        }
        ms = await db.marketSeries.create({
          data: {
            name: market.name,
            slug: market.slug,
            locationId: loc.id,
            description: market.description ?? undefined,
            imageUrl: market.imageUrl ?? undefined,
            websiteUrl: market.websiteUrl ?? undefined,
            facebookUrl: market.facebookUrl ?? undefined,
            instagramUrl: market.instagramUrl ?? undefined,
            baseArea: market.baseArea ?? undefined,
            verificationStatus: market.verificationStatus,
            ownerId: market.ownerId ?? undefined,
            typicalSchedule: market.typicalSchedule ?? undefined,
            contactEmail: market.contactEmail ?? undefined,
            contactPhone: market.contactPhone ?? undefined,
            participationMode: market.participationMode,
            vendorCapacity: market.vendorCapacity ?? undefined,
            publicIntentListEnabled: market.publicIntentListEnabled,
            publicIntentNamesEnabled: market.publicIntentNamesEnabled,
            publicRosterEnabled: market.publicRosterEnabled,
            rosterClaimRequired: market.rosterClaimRequired,
            legacyMarketId: market.id,
          },
        });
      }
    }
    marketSeriesId = ms?.id ?? null;
  }

  const existing = await db.eventOccurrence.findUnique({
    where: { legacyEventId: eventId },
  });

  const eoData = {
    marketSeriesId: marketSeriesId ?? undefined,
    locationId: location.id,
    title: event.title,
    slug: event.slug,
    description: event.description ?? undefined,
    startDate: event.startDate,
    endDate: event.endDate,
    timezone: event.timezone ?? undefined,
    imageUrl: event.imageUrl ?? undefined,
    status: event.status,
    recurrenceGroupId: event.recurrenceGroupId ?? undefined,
    websiteUrl: event.websiteUrl ?? undefined,
    facebookUrl: event.facebookUrl ?? undefined,
    participationMode: event.participationMode ?? undefined,
    vendorCapacity: event.vendorCapacity ?? undefined,
    publicIntentListEnabled: event.publicIntentListEnabled ?? undefined,
    publicIntentNamesEnabled: event.publicIntentNamesEnabled ?? undefined,
    publicRosterEnabled: event.publicRosterEnabled ?? undefined,
    submittedById: event.submittedById ?? undefined,
    legacyEventId: event.id,
  };

  if (existing) {
    await db.eventOccurrence.update({
      where: { id: existing.id },
      data: {
        ...eoData,
        tags: { set: event.tags.map((t) => ({ id: t.id })) },
        features: { set: event.features.map((f) => ({ id: f.id })) },
      },
    });
    await db.eventOccurrenceScheduleDay.deleteMany({
      where: { eventOccurrenceId: existing.id },
    });
    if (event.scheduleDays.length > 0) {
      await db.eventOccurrenceScheduleDay.createMany({
        data: event.scheduleDays.map((d) => ({
          eventOccurrenceId: existing.id,
          date: d.date,
          startTime: d.startTime,
          endTime: d.endTime,
          allDay: d.allDay,
        })),
      });
    }
  } else {
    const eo = await db.eventOccurrence.create({
      data: {
        ...eoData,
        tags: { connect: event.tags.map((t) => ({ id: t.id })) },
        features: { connect: event.features.map((f) => ({ id: f.id })) },
      },
    });
    if (event.scheduleDays.length > 0) {
      await db.eventOccurrenceScheduleDay.createMany({
        data: event.scheduleDays.map((d) => ({
          eventOccurrenceId: eo.id,
          date: d.date,
          startTime: d.startTime,
          endTime: d.endTime,
          allDay: d.allDay,
        })),
      });
    }
  }
}
