export const VENDOR_DASHBOARD_INTENT_STATUSES = [
  "ATTENDING",
  "REQUESTED",
  "APPLIED",
  "WAITLISTED",
] as const;

export function buildVendorDashboardProfileQuery(userId: string) {
  return {
    where: { userId, deletedAt: null },
    include: {
      _count: { select: { favoriteVendors: true } },
      vendorEvents: {
        where: {
          event: {
            deletedAt: null,
          },
        },
        include: {
          event: {
            include: {
              venue: true,
              tags: true,
              features: true,
              _count: { select: { vendorEvents: true } },
              scheduleDays: { orderBy: { date: "asc" as const } },
            },
          },
        },
        orderBy: { event: { startDate: "asc" as const } },
      },
      vendorIntents: {
        where: {
          status: { in: VENDOR_DASHBOARD_INTENT_STATUSES },
          event: {
            deletedAt: null,
          },
        },
        include: {
          event: {
            include: {
              venue: true,
              tags: true,
              features: true,
              market: true,
              _count: { select: { vendorEvents: true } },
              scheduleDays: { orderBy: { date: "asc" as const } },
            },
          },
        },
        orderBy: { event: { startDate: "asc" as const } },
      },
    },
  };
}
