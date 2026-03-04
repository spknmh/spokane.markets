import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { User, Shield, Store, LayoutDashboard, Bell, KeyRound } from "lucide-react";
import { ProfileForm } from "@/components/profile-form";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id! },
    include: {
      vendorProfile: true,
      _count: {
        select: { savedFilters: true, favoriteVendors: true },
      },
    },
  });

  if (!user) {
    redirect("/auth/signin");
  }

  const role = user.role;
  const isVendor = role === "VENDOR";
  const isOrganizer = role === "ORGANIZER";
  const isAdmin = role === "ADMIN";

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        My Profile
      </h1>
      <p className="mt-1 text-muted-foreground">
        Your account details and quick links
      </p>

      <div className="mt-8 space-y-6">
        {/* Account info */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <User className="h-5 w-5" />
              Account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileForm
              initialName={user.name}
              email={user.email}
              image={user.image}
              role={role}
            />
          </CardContent>
        </Card>

        {/* Quick links */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-foreground">Quick links</CardTitle>
            <CardDescription>
              Dashboards and settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-2 rounded-lg border-2 border-border p-3 font-semibold text-foreground transition-colors hover:border-primary hover:bg-muted/50"
              >
                <Shield className="h-4 w-4" />
                Admin Dashboard
              </Link>
            )}
            {isOrganizer && (
              <Link
                href="/organizer/dashboard"
                className="flex items-center gap-2 rounded-lg border-2 border-border p-3 font-semibold text-foreground transition-colors hover:border-primary hover:bg-muted/50"
              >
                <LayoutDashboard className="h-4 w-4" />
                Organizer Dashboard
              </Link>
            )}
            {isVendor && (
              <Link
                href="/vendor/dashboard"
                className="flex items-center gap-2 rounded-lg border-2 border-border p-3 font-semibold text-foreground transition-colors hover:border-primary hover:bg-muted/50"
              >
                <Store className="h-4 w-4" />
                Vendor Dashboard
              </Link>
            )}
            {isVendor && user.vendorProfile && (
              <Link
                href="/vendor/profile/edit"
                className="flex items-center gap-2 rounded-lg border-2 border-border p-3 font-semibold text-foreground transition-colors hover:border-primary hover:bg-muted/50"
              >
                <Store className="h-4 w-4" />
                Edit Vendor Profile
              </Link>
            )}
            <Link
              href="/auth/request-password-reset"
              className="flex items-center gap-2 rounded-lg border-2 border-border p-3 font-semibold text-foreground transition-colors hover:border-primary hover:bg-muted/50"
            >
              <KeyRound className="h-4 w-4" />
              Change password
            </Link>
            <Link
              href="/notifications"
              className="flex items-center gap-2 rounded-lg border-2 border-border p-3 font-semibold text-foreground transition-colors hover:border-primary hover:bg-muted/50"
            >
              <Bell className="h-4 w-4" />
              Notifications
            </Link>
            <Link
              href="/settings/filters"
              className="flex items-center gap-2 rounded-lg border-2 border-border p-3 font-semibold text-foreground transition-colors hover:border-primary hover:bg-muted/50"
            >
              Saved Filters
              {user._count.savedFilters > 0 && (
                <span className="rounded bg-primary/20 px-1.5 py-0.5 text-xs font-bold text-primary">
                  {user._count.savedFilters}
                </span>
              )}
            </Link>
            <Link
              href="/settings/favorites"
              className="flex items-center gap-2 rounded-lg border-2 border-border p-3 font-semibold text-foreground transition-colors hover:border-primary hover:bg-muted/50"
            >
              Favorite Vendors
              {user._count.favoriteVendors > 0 && (
                <span className="rounded bg-primary/20 px-1.5 py-0.5 text-xs font-bold text-primary">
                  {user._count.favoriteVendors}
                </span>
              )}
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
