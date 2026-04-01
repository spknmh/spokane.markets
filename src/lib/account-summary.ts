import { db } from "@/lib/db";
import { computeVendorProfileCompletion } from "@/lib/vendor-profile";
import { organizerAnyMarketWhere, organizerManageMarketWhere } from "@/lib/market-membership";

export type AccountSummary = {
  consumer: {
    upcomingRsvpsCount: number;
    savedFiltersCount: number;
    favoriteVendorsCount: number;
  };
  vendor?: {
    profileComplete: boolean;
    profileCompletionPercent: number;
    upcomingEventsCount: number;
    favoritedCount: number;
    reviewsCount: number;
  };
  organizer?: {
    marketsCount: number;
    eventsCount: number;
    pendingReviewsCount: number;
  };
};

/**
 * Role-aware counts for account overview and `/api/account/summary`.
 */
export async function getAccountSummary(
  userId: string,
  role: string
): Promise<AccountSummary> {
  const now = new Date();

  const [upcomingRsvpsCount, savedFiltersCount, favoriteVendorsCount] =
    await Promise.all([
      db.attendance.count({
        where: {
          userId,
          event: {
            startDate: { gte: now },
            status: "PUBLISHED",
          },
        },
      }),
      db.savedFilter.count({ where: { userId } }),
      db.favoriteVendor.count({ where: { userId } }),
    ]);

  const summary: AccountSummary = {
    consumer: {
      upcomingRsvpsCount,
      savedFiltersCount,
      favoriteVendorsCount,
    },
  };

  const vendorProfile = await db.vendorProfile.findUnique({
    where: { userId },
    include: {
      vendorEvents: {
        where: {
          event: {
            startDate: { gte: now },
            status: "PUBLISHED",
          },
        },
        include: { event: true },
      },
      _count: { select: { favoriteVendors: true } },
    },
  });

  if (vendorProfile || role === "VENDOR" || role === "ADMIN") {
    const profileComplete = !!(
      vendorProfile?.businessName &&
      vendorProfile?.description &&
      vendorProfile?.contactEmail
    );

    const profileCompletionPercent = vendorProfile
      ? computeVendorProfileCompletion(vendorProfile)
      : 0;

    summary.vendor = {
      profileComplete,
      profileCompletionPercent,
      upcomingEventsCount: vendorProfile?.vendorEvents.length ?? 0,
      favoritedCount: vendorProfile?._count.favoriteVendors ?? 0,
      reviewsCount: 0,
    };

    if (vendorProfile) {
      const reviewsCount = await db.review.count({
        where: {
          event: {
            vendorEvents: {
              some: { vendorProfileId: vendorProfile.id },
            },
          },
        },
      });
      summary.vendor.reviewsCount = reviewsCount;
    }
  }

  if (role === "ORGANIZER" || role === "ADMIN") {
    const [marketsCount, eventsCount, pendingReviewsCount] = await Promise.all([
      db.market.count({ where: organizerAnyMarketWhere(userId) }),
      db.event.count({ where: { submittedById: userId } }),
      db.review.count({
        where: {
          status: "PENDING",
          OR: [
            { event: { submittedById: userId } },
            { market: organizerManageMarketWhere(userId) },
          ],
        },
      }),
    ]);

    summary.organizer = {
      marketsCount,
      eventsCount,
      pendingReviewsCount,
    };
  }

  return summary;
}
