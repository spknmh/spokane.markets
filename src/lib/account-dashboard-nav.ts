import { db } from "@/lib/db";
import { buildDashboardNavSections } from "@/lib/dashboard-nav";
import { organizerAnyMarketWhere } from "@/lib/market-membership";

/**
 * Loads role-aware dashboard sidebar sections (account + settings + vendor/organizer/admin).
 */
export async function getAccountDashboardNavSections(userId: string) {
  const [user, organizerMarkets, organizerEvents, applicationCount] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        vendorProfile: { select: { slug: true } },
      },
    }),
    db.market.count({ where: organizerAnyMarketWhere(userId) }),
    db.event.count({ where: { submittedById: userId } }),
    db.application.count({ where: { userId } }),
  ]);

  if (!user) {
    return null;
  }

  return buildDashboardNavSections({
    isAdmin: user.role === "ADMIN",
    hasVendorProfile: Boolean(user.vendorProfile),
    hasOrganizerAccess:
      user.role === "ORGANIZER" || organizerMarkets > 0 || organizerEvents > 0,
    vendorSlug: user.vendorProfile?.slug ?? null,
    hasApplications: applicationCount > 0,
  });
}
