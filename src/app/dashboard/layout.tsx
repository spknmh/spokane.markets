import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import {
  LayoutDashboard,
  Filter,
  CheckCircle2,
  Heart,
  User,
  Calendar,
  Award,
} from "lucide-react";

const consumerNavItems = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Saved Filters", href: "/settings/filters", icon: Filter },
  { label: "My RSVPs", href: "/dashboard#rsvps", icon: CheckCircle2 },
  { label: "Favorite Vendors", href: "/settings/favorites", icon: Heart },
  { label: "Badges", href: "/dashboard/badges", icon: Award },
  { label: "Account & Settings", href: "/dashboard#account", icon: User },
  { label: "Browse Events", href: "/events", icon: Calendar },
];

export default async function DashboardLayout({
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
        title="My Dashboard"
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
