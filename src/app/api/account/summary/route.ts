import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { computeVendorProfileCompletion } from "@/lib/vendor-profile";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const role = session.user.role ?? "USER";

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, image: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const response: {
    user: { id: string; name: string | null; email: string; role: string; image: string | null };
    consumer?: {
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
  } = {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      image: user.image,
    },
  };

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

  response.consumer = {
    upcomingRsvpsCount,
    savedFiltersCount,
    favoriteVendorsCount,
  };

  if (role === "VENDOR" || role === "ADMIN") {
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

    const profileComplete = !!(
      vendorProfile?.businessName &&
      vendorProfile?.description &&
      vendorProfile?.contactEmail
    );

    const profileCompletionPercent = vendorProfile
      ? computeVendorProfileCompletion(vendorProfile)
      : 0;

    response.vendor = {
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
      response.vendor.reviewsCount = reviewsCount;
    }
  }

  if (role === "ORGANIZER" || role === "ADMIN") {
    const [marketsCount, eventsCount, pendingReviewsCount] = await Promise.all([
      db.market.count({ where: { ownerId: userId } }),
      db.event.count({ where: { submittedById: userId } }),
      db.review.count({
        where: {
          status: "PENDING",
          OR: [
            { event: { submittedById: userId } },
            { market: { ownerId: userId } },
          ],
        },
      }),
    ]);

    response.organizer = {
      marketsCount,
      eventsCount,
      pendingReviewsCount,
    };
  }

  return NextResponse.json(response);
}
