import type { Event } from "@prisma/client";

export interface EventWithMarket extends Event {
  market?: { ownerId: string | null } | null;
}

/**
 * Returns true if the user can manage the event roster (approve, reject, add, remove vendors).
 * Organizer = event submitter OR market owner (when event has market) OR admin.
 */
export function canManageEventRoster(
  userId: string,
  event: EventWithMarket,
  userRole?: string
): boolean {
  if (userRole === "ADMIN") return true;
  if (event.submittedById === userId) return true;
  if (event.market?.ownerId === userId) return true;
  return false;
}
