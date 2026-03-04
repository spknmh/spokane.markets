import { db } from "@/lib/db";

type Criteria = {
  type: string;
  years?: number;
  min?: number;
};

/**
 * Evaluates badge criteria for a user and grants any newly earned badges.
 * Idempotent: skips badges the user already has.
 * Call after relevant mutations (review, attendance, favorite, vendor event link, claim approval).
 */
export async function evaluateAndGrantBadges(userId: string): Promise<void> {
  const [user, badges, existingUserBadges] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      include: {
        vendorProfile: true,
        ownedMarkets: { select: { id: true, createdAt: true } },
        organizerEvents: { select: { createdAt: true } },
        reviews: { where: { status: "APPROVED" }, select: { id: true } },
        attendances: { select: { id: true } },
        favoriteVendors: { select: { id: true } },
        userBadges: { select: { badgeId: true } },
      },
    }),
    db.badgeDefinition.findMany({ orderBy: { sortOrder: "asc" } }),
    db.userBadge.findMany({ where: { userId }, select: { badgeId: true } }),
  ]);

  if (!user) return;

  const earnedBadgeIds = new Set(existingUserBadges.map((ub) => ub.badgeId));
  const userRole = user.role;

  for (const badge of badges) {
    if (earnedBadgeIds.has(badge.id)) continue;

    // Role gate: VENDOR badges require VENDOR role, ORGANIZER badges require ORGANIZER role
    if (badge.requiredRole === "VENDOR" && userRole !== "VENDOR") continue;
    if (badge.requiredRole === "ORGANIZER" && userRole !== "ORGANIZER" && userRole !== "ADMIN") continue;

    const criteria = badge.criteria as Criteria | null;
    if (!criteria) continue;

    let earned = false;

    switch (criteria.type) {
      case "member_years": {
        const years = criteria.years ?? 1;
        const cutoff = new Date();
        cutoff.setFullYear(cutoff.getFullYear() - years);
        earned = user.createdAt <= cutoff;
        break;
      }
      case "reviews_count": {
        const min = criteria.min ?? 1;
        earned = user.reviews.length >= min;
        break;
      }
      case "attendances_count": {
        const min = criteria.min ?? 3;
        earned = user.attendances.length >= min;
        break;
      }
      case "favorites_count": {
        const min = criteria.min ?? 5;
        earned = user.favoriteVendors.length >= min;
        break;
      }
      case "vendor_years": {
        if (!user.vendorProfile) break;
        const years = criteria.years ?? 1;
        const cutoff = new Date();
        cutoff.setFullYear(cutoff.getFullYear() - years);
        earned = user.vendorProfile.createdAt <= cutoff;
        break;
      }
      case "vendor_events_count": {
        if (!user.vendorProfile) break;
        const count = await db.vendorEvent.count({
          where: { vendorProfileId: user.vendorProfile.id },
        });
        earned = count >= (criteria.min ?? 10);
        break;
      }
      case "organizer_years": {
        const dates: Date[] = [
          ...user.organizerEvents.map((e) => e.createdAt),
          ...user.ownedMarkets.map((m) => m.createdAt),
        ];
        const firstActivity = dates.length > 0 ? new Date(Math.min(...dates.map((d) => d.getTime()))) : null;
        if (!firstActivity) break;
        const years = criteria.years ?? 1;
        const cutoff = new Date();
        cutoff.setFullYear(cutoff.getFullYear() - years);
        earned = firstActivity <= cutoff;
        break;
      }
      case "owned_markets_count": {
        const min = criteria.min ?? 5;
        earned = user.ownedMarkets.length >= min;
        break;
      }
    }

    if (earned) {
      await db.userBadge.create({
        data: { userId, badgeId: badge.id },
      });
      earnedBadgeIds.add(badge.id);
    }
  }
}
