import { requireAuth } from "@/lib/auth-utils";
import { DashboardSidebar } from "@/components/dashboard-sidebar";

const consumerNavItems = [
  { label: "Overview", href: "/dashboard", icon: "LayoutDashboard" as const },
  { label: "Saved Filters", href: "/account/saved?tab=filters", icon: "Filter" as const },
  { label: "My RSVPs", href: "/account/saved?tab=rsvps", icon: "CheckCircle2" as const },
  { label: "Favorite Vendors", href: "/account/saved?tab=favorites", icon: "Heart" as const },
  { label: "Badges", href: "/dashboard/badges", icon: "Award" as const },
  { label: "Account & Settings", href: "/account/settings", icon: "User" as const },
  { label: "Browse Events", href: "/events", icon: "Calendar" as const },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth("/dashboard");

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar
        title="My Account"
        subtitle="Your hub"
        items={consumerNavItems}
        backLabel="Back to site"
      />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
