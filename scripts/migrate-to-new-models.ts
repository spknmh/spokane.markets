/**
 * Data migration: copy legacy tables to new refactored models.
 * Run with: npx tsx scripts/migrate-to-new-models.ts [--dry-run]
 *
 * Prerequisites:
 * - Run prisma migrate to create new tables first
 * - Database must be accessible
 *
 * Order: venues→locations, markets→market_series, events→event_occurrences,
 *        vendor_profiles→vendors, vendor_events+intents+roster→vendor_appearances
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const DRY_RUN = process.argv.includes("--dry-run");

async function main() {
  if (DRY_RUN) {
    console.log("=== DRY RUN — no changes will be written ===\n");
  }

  const result = await prisma.$transaction(async (tx) => {
    const stats = {
      locationsCreated: 0,
      marketSeriesCreated: 0,
      eventOccurrencesCreated: 0,
      vendorsCreated: 0,
      vendorAppearancesCreated: 0,
      scheduleDaysCreated: 0,
      errors: [] as string[],
    };

    // 1. Venues → Locations
    const venues = await tx.venue.findMany({ orderBy: { id: "asc" } });
    const venueToLocation = new Map<string, string>();

    for (const v of venues) {
      if (DRY_RUN) {
        venueToLocation.set(v.id, `dry-run-loc-${v.id}`);
        stats.locationsCreated++;
        continue;
      }
      const loc = await tx.location.create({
        data: {
          name: v.name,
          address: v.address,
          city: v.city,
          state: v.state,
          zip: v.zip,
          lat: v.lat,
          lng: v.lng,
          neighborhood: v.neighborhood ?? undefined,
          parkingNotes: v.parkingNotes ?? undefined,
          legacyVenueId: v.id,
        },
      });
      venueToLocation.set(v.id, loc.id);
      stats.locationsCreated++;
    }

    // 2. Markets → MarketSeries
    const markets = await tx.market.findMany({ orderBy: { id: "asc" } });
    const marketToSeries = new Map<string, string>();

    for (const m of markets) {
      const locationId = venueToLocation.get(m.venueId);
      if (!locationId) {
        stats.errors.push(`Market ${m.id}: venue ${m.venueId} has no location`);
        continue;
      }
      if (DRY_RUN) {
        marketToSeries.set(m.id, `dry-run-ms-${m.id}`);
        stats.marketSeriesCreated++;
        continue;
      }
      const ms = await tx.marketSeries.create({
        data: {
          name: m.name,
          slug: m.slug,
          locationId,
          description: m.description ?? undefined,
          imageUrl: m.imageUrl ?? undefined,
          websiteUrl: m.websiteUrl ?? undefined,
          facebookUrl: m.facebookUrl ?? undefined,
          instagramUrl: m.instagramUrl ?? undefined,
          baseArea: m.baseArea ?? undefined,
          verificationStatus: m.verificationStatus,
          ownerId: m.ownerId ?? undefined,
          typicalSchedule: m.typicalSchedule ?? undefined,
          contactEmail: m.contactEmail ?? undefined,
          contactPhone: m.contactPhone ?? undefined,
          participationMode: m.participationMode,
          vendorCapacity: m.vendorCapacity ?? undefined,
          publicIntentListEnabled: m.publicIntentListEnabled,
          publicIntentNamesEnabled: m.publicIntentNamesEnabled,
          publicRosterEnabled: m.publicRosterEnabled,
          rosterClaimRequired: m.rosterClaimRequired,
          legacyMarketId: m.id,
        },
      });
      marketToSeries.set(m.id, ms.id);
      stats.marketSeriesCreated++;
    }

    // 3. Events → EventOccurrences
    const events = await tx.event.findMany({
      include: { scheduleDays: true, tags: true, features: true },
      orderBy: { id: "asc" },
    });
    const eventToOccurrence = new Map<string, string>();

    for (const e of events) {
      const locationId = venueToLocation.get(e.venueId);
      if (!locationId) {
        stats.errors.push(`Event ${e.id}: venue ${e.venueId} has no location`);
        continue;
      }
      const marketSeriesId = e.marketId ? marketToSeries.get(e.marketId) ?? null : null;

      if (DRY_RUN) {
        eventToOccurrence.set(e.id, `dry-run-eo-${e.id}`);
        stats.eventOccurrencesCreated++;
        stats.scheduleDaysCreated += e.scheduleDays.length;
        continue;
      }

      const eo = await tx.eventOccurrence.create({
        data: {
          marketSeriesId: marketSeriesId ?? undefined,
          locationId,
          title: e.title,
          slug: e.slug,
          description: e.description ?? undefined,
          startDate: e.startDate,
          endDate: e.endDate,
          timezone: e.timezone ?? undefined,
          imageUrl: e.imageUrl ?? undefined,
          status: e.status,
          recurrenceGroupId: e.recurrenceGroupId ?? undefined,
          websiteUrl: e.websiteUrl ?? undefined,
          facebookUrl: e.facebookUrl ?? undefined,
          participationMode: e.participationMode ?? undefined,
          vendorCapacity: e.vendorCapacity ?? undefined,
          publicIntentListEnabled: e.publicIntentListEnabled ?? undefined,
          publicIntentNamesEnabled: e.publicIntentNamesEnabled ?? undefined,
          publicRosterEnabled: e.publicRosterEnabled ?? undefined,
          submittedById: e.submittedById ?? undefined,
          legacyEventId: e.id,
        },
      });
      eventToOccurrence.set(e.id, eo.id);
      stats.eventOccurrencesCreated++;

      if (e.tags.length > 0 || e.features.length > 0) {
        await tx.eventOccurrence.update({
          where: { id: eo.id },
          data: {
            tags: { connect: e.tags.map((t) => ({ id: t.id })) },
            features: { connect: e.features.map((f) => ({ id: f.id })) },
          },
        });
      }

      for (const sd of e.scheduleDays) {
        await tx.eventOccurrenceScheduleDay.create({
          data: {
            eventOccurrenceId: eo.id,
            date: sd.date,
            startTime: sd.startTime,
            endTime: sd.endTime,
            allDay: sd.allDay,
          },
        });
        stats.scheduleDaysCreated++;
      }
    }

    // 4. VendorProfiles → Vendors
    const vendorProfiles = await tx.vendorProfile.findMany({ orderBy: { id: "asc" } });
    const vendorProfileToVendor = new Map<string, string>();

    for (const vp of vendorProfiles) {
      if (DRY_RUN) {
        vendorProfileToVendor.set(vp.id, `dry-run-v-${vp.id}`);
        stats.vendorsCreated++;
        continue;
      }
      const v = await tx.vendor.create({
        data: {
          userId: vp.userId ?? undefined,
          businessName: vp.businessName,
          slug: vp.slug,
          description: vp.description ?? undefined,
          imageUrl: vp.imageUrl ?? undefined,
          websiteUrl: vp.websiteUrl ?? undefined,
          facebookUrl: vp.facebookUrl ?? undefined,
          instagramUrl: vp.instagramUrl ?? undefined,
          contactEmail: vp.contactEmail ?? undefined,
          contactPhone: vp.contactPhone ?? undefined,
          galleryUrls: vp.galleryUrls,
          specialties: vp.specialties ?? undefined,
          contactVisible: vp.contactVisible,
          socialLinksVisible: vp.socialLinksVisible,
          legacyVendorProfileId: vp.id,
        },
      });
      vendorProfileToVendor.set(vp.id, v.id);
      stats.vendorsCreated++;
    }

    // 5. VendorEvent + EventVendorIntent + EventVendorRoster → VendorAppearance
    const vendorEvents = await tx.vendorEvent.findMany();
    for (const ve of vendorEvents) {
      const eoId = eventToOccurrence.get(ve.eventId);
      const vendorId = vendorProfileToVendor.get(ve.vendorProfileId);
      if (!eoId || !vendorId) {
        stats.errors.push(
          `VendorEvent ${ve.id}: event ${ve.eventId} or vendor ${ve.vendorProfileId} not migrated`
        );
        continue;
      }
      if (DRY_RUN) {
        stats.vendorAppearancesCreated++;
        continue;
      }
      await tx.vendorAppearance.upsert({
        where: {
          eventOccurrenceId_vendorId_source: {
            eventOccurrenceId: eoId,
            vendorId,
            source: "SELF_REPORTED",
          },
        },
        create: {
          eventOccurrenceId: eoId,
          vendorId,
          source: "SELF_REPORTED",
          status: "ATTENDING",
        },
        update: {},
      });
      stats.vendorAppearancesCreated++;
    }

    const intents = await tx.eventVendorIntent.findMany();
    for (const i of intents) {
      const eoId = eventToOccurrence.get(i.eventId);
      const vendorId = vendorProfileToVendor.get(i.vendorProfileId);
      if (!eoId || !vendorId) {
        stats.errors.push(
          `EventVendorIntent ${i.id}: event ${i.eventId} or vendor ${i.vendorProfileId} not migrated`
        );
        continue;
      }
      if (DRY_RUN) {
        stats.vendorAppearancesCreated++;
        continue;
      }
      await tx.vendorAppearance.upsert({
        where: {
          eventOccurrenceId_vendorId_source: {
            eventOccurrenceId: eoId,
            vendorId,
            source: "INTENT",
          },
        },
        create: {
          eventOccurrenceId: eoId,
          vendorId,
          source: "INTENT",
          status: i.status,
          notes: i.notes ?? undefined,
          visibility: i.visibility,
        },
        update: { status: i.status, notes: i.notes ?? undefined, visibility: i.visibility },
      });
      stats.vendorAppearancesCreated++;
    }

    const rosterEntries = await tx.eventVendorRoster.findMany();
    for (const r of rosterEntries) {
      const eoId = eventToOccurrence.get(r.eventId);
      const vendorId = vendorProfileToVendor.get(r.vendorProfileId);
      if (!eoId || !vendorId) {
        stats.errors.push(
          `EventVendorRoster ${r.id}: event ${r.eventId} or vendor ${r.vendorProfileId} not migrated`
        );
        continue;
      }
      if (DRY_RUN) {
        stats.vendorAppearancesCreated++;
        continue;
      }
      await tx.vendorAppearance.upsert({
        where: {
          eventOccurrenceId_vendorId_source: {
            eventOccurrenceId: eoId,
            vendorId,
            source: "ROSTER",
          },
        },
        create: {
          eventOccurrenceId: eoId,
          vendorId,
          source: "ROSTER",
          status: r.status,
          approvedByUserId: r.approvedByUserId ?? undefined,
          approvedAt: r.approvedAt ?? undefined,
        },
        update: {
          status: r.status,
          approvedByUserId: r.approvedByUserId ?? undefined,
          approvedAt: r.approvedAt ?? undefined,
        },
      });
      stats.vendorAppearancesCreated++;
    }

    return stats;
  });

  console.log("Migration complete:");
  console.log(`  Locations: ${result.locationsCreated}`);
  console.log(`  MarketSeries: ${result.marketSeriesCreated}`);
  console.log(`  EventOccurrences: ${result.eventOccurrencesCreated}`);
  console.log(`  EventOccurrenceScheduleDays: ${result.scheduleDaysCreated}`);
  console.log(`  Vendors: ${result.vendorsCreated}`);
  console.log(`  VendorAppearances: ${result.vendorAppearancesCreated}`);
  if (result.errors.length > 0) {
    console.log("\nErrors:");
    result.errors.forEach((e) => console.log(`  - ${e}`));
  }
  if (DRY_RUN) {
    console.log("\n(Dry run — no data was written)");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
