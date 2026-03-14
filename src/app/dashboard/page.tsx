import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
import { Heart, Shield, KeyRound } from "lucide-react";
import { ProfileForm } from "@/components/profile-form";
import { DashboardHeaderCard } from "@/components/dashboard-header-card";
import { evaluateAndGrantBadges } from "@/lib/badges";
import { SITE_NAME } from "@/lib/constants";
import { PendingVerificationModal } from "@/components/pending-verification-modal";
import { organizerAnyMarketWhere } from "@/lib/market-membership";

export const dynamic = "force-dynamic";

export const metadata = {
  title: `My Account — ${SITE_NAME}`,
  description: "Your account dashboard.",
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

  const [favoriteVendors, organizerOwnedMarketsCount, organizerSubmittedEventsCount] =
    await Promise.all([
      db.favoriteVendor.findMany({
      where: { userId: session.user.id! },
      include: { vendorProfile: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    db.market.count({
      where: organizerAnyMarketWhere(session.user.id!),
    }),
    db.event.count({
      where: { submittedById: session.user.id! },
    }),
  ]);
  const hasOrganizerOwnershipOrMembership =
    organizerOwnedMarketsCount > 0 || organizerSubmittedEventsCount > 0;
  const showFirstRunOnboarding = !user.vendorProfile && !hasOrganizerOwnershipOrMembership;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <PendingVerificationModal
        emailVerified={user.emailVerified}
        showPendingVerification={showPendingVerification}
      />
      <h1 className="text-3xl font-bold tracking-tight">My Account</h1>

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
      >
        <div className="space-y-4">
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
          </div>
        </div>
      </DashboardHeaderCard>

      {showFirstRunOnboarding && (
        <Card className="mt-6 border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle>Get started</CardTitle>
            <CardDescription>
              Pick your first step to set up your presence and discover opportunities.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <Link
              href="/vendor/profile/edit"
              className="min-h-[44px] rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              Create Vendor Profile
            </Link>
            <Link
              href="/organizer/markets/new"
              className="min-h-[44px] rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              Create Market
            </Link>
            <Link
              href="/events"
              className="min-h-[44px] rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              Browse Events
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="mt-8 flex flex-col gap-6 sm:gap-8">
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
                      <Image
                        src={fv.vendorProfile.imageUrl}
                        alt=""
                        width={40}
                        height={40}
                        className="h-10 w-10 shrink-0 rounded-full object-cover"
                        unoptimized
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

      </div>
    </div>
  );
}
