import { redirect } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Filter, Heart, CheckCircle2, Star, User, Shield, Store, LayoutDashboard, KeyRound } from "lucide-react";
import { EventTimeLabel } from "@/components/event-time-label";
import { ProfileForm } from "@/components/profile-form";
import { DashboardHeaderCard } from "@/components/dashboard-header-card";
import { evaluateAndGrantBadges } from "@/lib/badges";
import { SITE_NAME } from "@/lib/constants";
import { PendingVerificationModal } from "@/components/pending-verification-modal";

export const metadata = {
  title: `My Account — ${SITE_NAME}`,
  description: "Your saved filters, event RSVPs, favorite vendors, and account settings.",
};

interface DashboardPageProps {
  searchParams: Promise<{ pendingVerification?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const session = await auth.api.getSession({ headers: await headers() });
  const params = await searchParams;
  const showPendingVerification = params.pendingVerification === "1";
  if (!session?.user) {
    redirect("/auth/signin");
  }

  await evaluateAndGrantBadges(session.user.id!);

  const user = await db.user.findUnique({
    where: { id: session.user.id! },
    include: {
      vendorProfile: true,
      userBadges: { include: { badge: true }, orderBy: { badge: { sortOrder: "asc" } } },
    },
  });
  if (!user) redirect("/auth/signin");

  const [savedFilters, attendances, favoriteVendors] = await Promise.all([
    db.savedFilter.findMany({
      where: { userId: session.user.id! },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    db.attendance.findMany({
      where: { userId: session.user.id! },
      include: {
        event: {
          include: { venue: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.favoriteVendor.findMany({
      where: { userId: session.user.id! },
      include: { vendorProfile: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const upcomingRsvps = attendances.filter(
    (a) => a.event.startDate >= new Date() && a.event.status === "PUBLISHED"
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <PendingVerificationModal
        emailVerified={user.emailVerified}
        showPendingVerification={showPendingVerification}
      />
      <h1 className="text-3xl font-bold tracking-tight">My Account</h1>
      <p className="mt-1 text-muted-foreground">
        Your saved filters, event RSVPs, and favorite vendors
      </p>

      <DashboardHeaderCard
        user={{
          name: user.name,
          email: user.email,
          image: user.image,
          createdAt: user.createdAt,
          role: user.role,
        }}
        badges={(user.userBadges ?? []).map((ub) => ({
          slug: ub.badge.slug,
          name: ub.badge.name,
          icon: ub.badge.icon,
        }))}
      />

      <div className="mt-8 flex flex-col gap-6 sm:gap-8">
        {/* Saved Filters */}
        <Card id="saved-filters" className="border-2 scroll-mt-8">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Saved Filters
              </CardTitle>
              <CardDescription>Quick access to your event search filters</CardDescription>
            </div>
            <Link
              href="/events"
              className="min-h-[44px] shrink-0 rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              Browse Events
            </Link>
          </CardHeader>
          <CardContent>
            {savedFilters.length === 0 ? (
              <p className="py-4 text-center text-muted-foreground">
                No saved filters yet.{" "}
                <Link href="/events" className="text-primary hover:underline">
                  Browse events
                </Link>{" "}
                and save a filter to get started.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {savedFilters.map((filter) => {
                  const params = new URLSearchParams();
                  if (filter.dateRange) params.set("dateRange", filter.dateRange);
                  if (filter.neighborhoods[0]) params.set("neighborhood", filter.neighborhoods[0]);
                  if (filter.categories[0]) params.set("category", filter.categories[0]);
                  if (filter.features[0]) params.set("feature", filter.features[0]);
                  return (
                    <Link
                      key={filter.id}
                      href={`/events?${params.toString()}`}
                      className="min-h-[44px] inline-flex items-center rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
                    >
                      {filter.name}
                      {filter.emailAlerts && (
                        <Badge variant="outline" className="ml-1.5 text-[10px]">
                          Alerts
                        </Badge>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
            {savedFilters.length > 0 && (
              <Link
                href="/settings/filters"
                className="mt-3 inline-block text-sm text-primary hover:underline"
              >
                Manage all filters →
              </Link>
            )}
          </CardContent>
        </Card>

        {/* My RSVPs */}
        <Card id="rsvps" className="border-2 scroll-mt-8">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                My RSVPs
              </CardTitle>
              <CardDescription>Events you marked Going or Interested</CardDescription>
            </div>
            <Link
              href="/events"
              className="min-h-[44px] shrink-0 rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              Find Events
            </Link>
          </CardHeader>
          <CardContent>
            {upcomingRsvps.length === 0 ? (
              <p className="py-4 text-center text-muted-foreground">
                No upcoming RSVPs.{" "}
                <Link href="/events" className="text-primary hover:underline">
                  Find events
                </Link>{" "}
                and mark Going or Interested!
              </p>
            ) : (
              <ul className="space-y-3">
                {upcomingRsvps.slice(0, 5).map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/events/${a.event.slug}`}
                      className="flex min-h-[44px] flex-col gap-0.5 rounded-lg border border-border p-3 transition-colors hover:bg-muted sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <span className="font-medium">{a.event.title}</span>
                        <span className="ml-2">
                          <EventTimeLabel
                            startDate={a.event.startDate}
                            endDate={a.event.endDate}
                            timezone={a.event.timezone}
                          />
                        </span>
                      </div>
                      <Badge
                        variant={a.status === "GOING" ? "default" : "secondary"}
                        className="w-fit"
                      >
                        {a.status === "GOING" ? (
                          <><CheckCircle2 className="mr-1 h-3 w-3" /> Going</>
                        ) : (
                          <><Star className="mr-1 h-3 w-3" /> Interested</>
                        )}
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Favorite Vendors */}
        <Card id="favorites" className="border-2 scroll-mt-8">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Favorite Vendors
              </CardTitle>
              <CardDescription>Vendors you follow for updates</CardDescription>
            </div>
            <Link
              href="/vendors"
              className="min-h-[44px] shrink-0 rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              Browse Vendors
            </Link>
          </CardHeader>
          <CardContent>
            {favoriteVendors.length === 0 ? (
              <p className="py-4 text-center text-muted-foreground">
                No favorite vendors yet.{" "}
                <Link href="/vendors" className="text-primary hover:underline">
                  Browse vendors
                </Link>{" "}
                and heart your favorites!
              </p>
            ) : (
              <div className="space-y-2">
                {favoriteVendors.map((fv) => (
                  <Link
                    key={fv.id}
                    href={`/vendors/${fv.vendorProfile.slug}`}
                    className="flex min-h-[44px] items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted"
                  >
                    {fv.vendorProfile.imageUrl ? (
                      <img
                        src={fv.vendorProfile.imageUrl}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-primary">
                        {fv.vendorProfile.businessName.charAt(0)}
                      </div>
                    )}
                    <span className="font-medium">{fv.vendorProfile.businessName}</span>
                  </Link>
                ))}
              </div>
            )}
            {favoriteVendors.length > 0 && (
              <Link
                href="/settings/favorites"
                className="mt-3 inline-block text-sm text-primary hover:underline"
              >
                Manage all favorites →
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Account & Settings */}
        <Card id="account" className="border-2 scroll-mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account & Settings
            </CardTitle>
            <CardDescription>
              Your profile details and quick links
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ProfileForm
              initialName={user.name}
              email={user.email}
              image={user.image}
              role={user.role}
            />
            <div className="space-y-2 border-t border-border pt-4">
              <Link
                href="/auth/request-password-reset"
                className="flex min-h-[44px] items-center gap-2 rounded-lg border border-border p-3 font-medium text-foreground transition-colors hover:bg-muted"
              >
                <KeyRound className="h-4 w-4" />
                Change password
              </Link>
              {user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="flex min-h-[44px] items-center gap-2 rounded-lg border border-border p-3 font-medium text-foreground transition-colors hover:bg-muted"
                >
                  <Shield className="h-4 w-4" />
                  Admin Dashboard
                </Link>
              )}
              {user.role === "ORGANIZER" && (
                <Link
                  href="/organizer/dashboard"
                  className="flex min-h-[44px] items-center gap-2 rounded-lg border border-border p-3 font-medium text-foreground transition-colors hover:bg-muted"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Organizer Dashboard
                </Link>
              )}
              {user.role === "VENDOR" && (
                <>
                  <Link
                    href="/vendor/dashboard"
                    className="flex min-h-[44px] items-center gap-2 rounded-lg border border-border p-3 font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    <Store className="h-4 w-4" />
                    Vendor Dashboard
                  </Link>
                  {user.vendorProfile && (
                    <Link
                      href="/vendor/profile/edit"
                      className="flex min-h-[44px] items-center gap-2 rounded-lg border border-border p-3 font-medium text-foreground transition-colors hover:bg-muted"
                    >
                      <Store className="h-4 w-4" />
                      Edit Vendor Profile
                    </Link>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
