import { db } from "@/lib/db";

/** Matches event detail: active roster rows. */
const ROSTER_STATUSES = ["INVITED", "ACCEPTED", "CONFIRMED"] as const;

/** Matches event detail `vendorIntents` filter for public listing context. */
const INTENT_STATUSES = ["ATTENDING", "INTERESTED"] as const;

export type VendorParticipationCountsMap = Record<string, number>;

/**
 * Unique vendor count per event across: self-linked events (`VendorEvent`),
 * organizer roster (`EventVendorRoster`), and qualifying intents (`EventVendorIntent`).
 * Listing cards use this instead of `_count.vendorEvents` alone, which only reflects the link table.
 */
export async function getVendorParticipationCountsByEventIds(
  eventIds: string[],
): Promise<VendorParticipationCountsMap> {
  if (eventIds.length === 0) return {};

  const [links, roster, intents] = await Promise.all([
    db.vendorEvent.findMany({
      where: { eventId: { in: eventIds } },
      select: { eventId: true, vendorProfileId: true },
    }),
    db.eventVendorRoster.findMany({
      where: {
        eventId: { in: eventIds },
        status: { in: [...ROSTER_STATUSES] },
      },
      select: { eventId: true, vendorProfileId: true },
    }),
    db.eventVendorIntent.findMany({
      where: {
        eventId: { in: eventIds },
        status: { in: [...INTENT_STATUSES] },
      },
      select: { eventId: true, vendorProfileId: true },
    }),
  ]);

  const byEvent = new Map<string, Set<string>>();

  const add = (eventId: string, vendorProfileId: string) => {
    let set = byEvent.get(eventId);
    if (!set) {
      set = new Set<string>();
      byEvent.set(eventId, set);
    }
    set.add(vendorProfileId);
  };

  for (const row of links) add(row.eventId, row.vendorProfileId);
  for (const row of roster) add(row.eventId, row.vendorProfileId);
  for (const row of intents) add(row.eventId, row.vendorProfileId);

  const counts: VendorParticipationCountsMap = {};
  for (const id of eventIds) {
    counts[id] = byEvent.get(id)?.size ?? 0;
  }
  return counts;
}
