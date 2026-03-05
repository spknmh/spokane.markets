import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard-sidebar";

const accountNavItems = [
  { label: "Overview", href: "/dashboard", icon: "LayoutDashboard" as const },
  { label: "Settings", href: "/account/settings", icon: "Settings" as const },
  { label: "Security", href: "/account/security", icon: "Shield" as const },
  { label: "Privacy", href: "/account/privacy", icon: "Eye" as const },
  { label: "Notifications", href: "/account/notifications", icon: "Bell" as const },
  { label: "Saved", href: "/account/saved", icon: "Bookmark" as const },
];

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar
        title="Account"
        subtitle="Manage your account"
        items={accountNavItems}
        backLabel="Back to site"
      />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
