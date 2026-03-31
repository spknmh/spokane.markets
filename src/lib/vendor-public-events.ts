import type { EventStatus, VendorIntentStatus } from "@prisma/client";

/**
 * Intent statuses that mean "linked" on /vendor/events/link and should surface on the public vendor profile.
 * (Matches vendor/events/link page filters, plus APPROVED after organizer confirmation.)
 */
export const VENDOR_PROFILE_INTENT_STATUSES: VendorIntentStatus[] = [
  "ATTENDING",
  "APPROVED",
  "APPLIED",
  "WAITLISTED",
  "REQUESTED",
];

type EventLike = {
  id: string;
  startDate: Date;
  status: EventStatus;
};

/**
 * Dedupe by event id, then filter to upcoming published events for the public "Where We'll Be Next" section.
 */
export function mergeUpcomingPublicVendorEvents<T extends EventLike>(
  fromVendorEvents: T[],
  fromIntentEvents: T[],
  now: Date = new Date(),
): T[] {
  const byId = new Map<string, T>();
  for (const e of fromVendorEvents) {
    byId.set(e.id, e);
  }
  for (const e of fromIntentEvents) {
    if (!byId.has(e.id)) {
      byId.set(e.id, e);
    }
  }
  return Array.from(byId.values())
    .filter((e) => e.startDate >= now && e.status === "PUBLISHED")
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
}
