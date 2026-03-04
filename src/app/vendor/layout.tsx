import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { DashboardSidebar } from "@/components/dashboard-sidebar";

function getVendorNavItems(profileSlug: string | null) {
  return [
    { label: "Overview", href: "/vendor/dashboard", icon: "LayoutDashboard" as const },
    { label: "Edit Profile", href: "/vendor/profile/edit", icon: "User" as const },
    { label: "Link to Event", href: "/vendor/events/link", icon: "Link2" as const },
    {
      label: "View Public Profile",
      href: profileSlug ? `/vendors/${profileSlug}` : "/vendors",
      icon: "ExternalLink" as const,
    },
  ];
}

export default async function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();

  const profile = await db.vendorProfile.findUnique({
    where: { userId: session.user.id },
    select: { slug: true },
  });

  const vendorNavItems = getVendorNavItems(profile?.slug ?? null);

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar
        title="Vendor Dashboard"
        subtitle="Manage your vendor profile"
        items={vendorNavItems}
        backLabel="Back to site"
      />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
