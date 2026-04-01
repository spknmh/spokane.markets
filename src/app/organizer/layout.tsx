import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { SITE_NAME } from "@/lib/constants";
import { getAccountDashboardNavSections } from "@/lib/account-dashboard-nav";

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
  const sections = await getAccountDashboardNavSections(session.user.id);

  if (!sections) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar
        title="Account"
        subtitle={SITE_NAME}
        sections={sections}
        backLabel="Back to site"
      />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
