import { db } from "@/lib/db";
import { organizerManageEventWhere } from "@/lib/market-membership";

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

export async function getOrganizerQueuesSummary(
  userId: string
): Promise<OrganizerQueueSummary[]> {
  const [vendorRequestsFirst, vendorRequestsCount, eventsPendingOldest, eventsPendingCount] =
    await Promise.all([
      db.eventVendorIntent.findFirst({
        where: {
          event: organizerManageEventWhere(userId),
          status: { in: ["REQUESTED", "APPLIED"] },
        },
        orderBy: { createdAt: "asc" },
        select: { createdAt: true, eventId: true },
      }),
      db.eventVendorIntent.count({
        where: {
          event: organizerManageEventWhere(userId),
          status: { in: ["REQUESTED", "APPLIED"] },
        },
      }),
      db.event.findFirst({
        where: {
          ...organizerManageEventWhere(userId),
          status: "PENDING",
        },
        orderBy: { createdAt: "asc" },
        select: { createdAt: true },
      }),
      db.event.count({
        where: {
          ...organizerManageEventWhere(userId),
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
