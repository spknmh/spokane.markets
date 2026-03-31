import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { buildDashboardNavSections } from "@/lib/dashboard-nav";
import { organizerAnyMarketWhere } from "@/lib/market-membership";

export const metadata: Metadata = {
  title: "Organizer Dashboard",
};

export default async function OrganizerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // requireAuth only: `/organizer/markets/new` must be reachable before the user is
  // promoted to ORGANIZER. Other organizer routes call `requireRole("ORGANIZER")` in their page.
  const session = await requireAuth("/organizer");
  const userId = session.user.id;

  const [user, organizerMarkets, organizerEvents] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        vendorProfile: { select: { slug: true } },
      },
    }),
    db.market.count({ where: organizerAnyMarketWhere(userId) }),
    db.event.count({ where: { submittedById: userId } }),
  ]);

  if (!user) {
    return null;
  }

  const sections = buildDashboardNavSections({
    isAdmin: user.role === "ADMIN",
    hasVendorProfile: Boolean(user.vendorProfile),
    hasOrganizerAccess: user.role === "ORGANIZER" || organizerMarkets > 0 || organizerEvents > 0,
    vendorSlug: user.vendorProfile?.slug ?? null,
  });

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar
        title="Dashboards"
        subtitle="Your workspace"
        sections={sections}
        backLabel="Back to site"
      />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
