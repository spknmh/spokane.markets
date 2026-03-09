import { requireRole } from "@/lib/auth-utils";
import { DashboardSidebar } from "@/components/dashboard-sidebar";

const organizerNavItems = [
  { label: "Overview", href: "/organizer/dashboard", icon: "LayoutDashboard" as const },
  { label: "Submit Event", href: "/organizer/events/new", icon: "PlusCircle" as const },
  { label: "Browse Markets", href: "/markets", icon: "MapPin" as const },
];

export default async function OrganizerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("ORGANIZER");

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar
        title="Organizer Dashboard"
        subtitle="Manage markets and events"
        items={organizerNavItems}
        backLabel="Back to site"
      />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
