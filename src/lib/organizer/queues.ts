import { db } from "@/lib/db";

export type OrganizerQueueType =
  | "vendor_requests"
  | "events_pending";

export type OrganizerQueueSummary = {
  type: OrganizerQueueType;
  count: number;
  oldestAt: Date | null;
  href: string;
  eventId?: string;
};

const organizerEventWhere = (userId: string) => ({
  OR: [{ submittedById: userId }, { market: { ownerId: userId } }],
});

export async function getOrganizerQueuesSummary(
  userId: string
): Promise<OrganizerQueueSummary[]> {
  const [vendorRequestsFirst, vendorRequestsCount, eventsPendingOldest, eventsPendingCount] =
    await Promise.all([
      db.eventVendorIntent.findFirst({
        where: {
          event: organizerEventWhere(userId),
          status: { in: ["REQUESTED", "APPLIED"] },
        },
        orderBy: { createdAt: "asc" },
        select: { createdAt: true, eventId: true },
      }),
      db.eventVendorIntent.count({
        where: {
          event: organizerEventWhere(userId),
          status: { in: ["REQUESTED", "APPLIED"] },
        },
      }),
      db.event.findFirst({
        where: {
          ...organizerEventWhere(userId),
          status: "PENDING",
        },
        orderBy: { createdAt: "asc" },
        select: { createdAt: true },
      }),
      db.event.count({
        where: {
          ...organizerEventWhere(userId),
          status: "PENDING",
        },
      }),
    ]);

  return [
    {
      type: "vendor_requests",
      count: vendorRequestsCount,
      oldestAt: vendorRequestsFirst?.createdAt ?? null,
      href: vendorRequestsFirst?.eventId
        ? `/organizer/events/${vendorRequestsFirst.eventId}/roster`
        : "/organizer/dashboard#events",
      eventId: vendorRequestsFirst?.eventId,
    },
    {
      type: "events_pending",
      count: eventsPendingCount,
      oldestAt: eventsPendingOldest?.createdAt ?? null,
      href: "/organizer/dashboard#events",
    },
  ];
}
