import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { TrackEventOnMount } from "@/components/analytics/track-event-on-mount";
import { Button } from "@/components/ui/button";
import { DashboardHeaderCard } from "@/components/dashboard-header-card";
import { evaluateAndGrantBadges } from "@/lib/badges";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { EventCard } from "@/components/event/event-card";
import { VendorPipelineBoard } from "@/components/vendor-pipeline-board";
import { VendorProfileProgress } from "@/components/vendor-profile-progress";
import { ExternalLink, Heart } from "lucide-react";
import { VendorSocialLinks } from "@/components/vendor-social-links";
import { computeVendorProfileCompletion } from "@/lib/vendor-profile";
import { evaluateVendorVerificationReadiness } from "@/lib/vendor-verification";
import { RequestVerificationButton } from "@/components/vendor/request-verification-button";
import { VendorOnboardingChecklist } from "@/components/vendor/vendor-onboarding-checklist";
import { Badge } from "@/components/ui/badge";
import { buildVendorDashboardProfileQuery } from "./query";

export const dynamic = "force-dynamic";

export default async function VendorDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ onboarding?: string }>;
}) {
  const session = await requireAuth("/vendor/dashboard");
  const params = await searchParams;

  await evaluateAndGrantBadges(session.user.id);

  const [user, profile] = await Promise.all([
    db.user.findUnique({
      where: { id: session.user.id },
      include: {
        userBadges: { include: { badge: true }, orderBy: { badge: { sortOrder: "asc" } } },
      },
    }),
    db.vendorProfile.findFirst(buildVendorDashboardProfileQuery(session.user.id)),
  ]);

  if (!user) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent("/vendor/dashboard")}`);
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <TrackEventOnMount
          eventName="vendor_dashboard_view"
          params={{ surface: "dashboard" }}
        />
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
        <Card className="border-2 border-dashed">
          <CardContent className="py-10 text-center">
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome, Vendor!
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
              You don&apos;t have a vendor profile yet. Create one to start
              listing where you&apos;ll be selling.
            </p>
            <Button asChild size="lg" className="mt-8">
              <Link href="/vendor/profile/edit">Create Your Vendor Profile</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const vendorEventIds = new Set(
    profile.vendorEvents.map((ve) => ve.event.id),
  );
  const fromVendorEvents = profile.vendorEvents
    .filter(
      (ve) =>
        ve.event.startDate >= new Date() && ve.event.status === "PUBLISHED",
    )
    .map((ve) => ve.event);
  const fromIntents = profile.vendorIntents
    .filter(
      (i) =>
        !vendorEventIds.has(i.event.id) &&
        i.event.startDate >= new Date() &&
        i.event.status === "PUBLISHED",
    )
    .map((i) => i.event);
  const upcomingEvents = [...fromVendorEvents, ...fromIntents].sort(
    (a, b) => a.startDate.getTime() - b.startDate.getTime(),
  );

  const favoritedCount = profile._count.favoriteVendors;
  const profileCompletionPercent = computeVendorProfileCompletion(profile);
  const readiness = evaluateVendorVerificationReadiness({ user, profile });
  const profileComplete = profileCompletionPercent >= 80;
  const verificationStatus = profile.verificationStatus;
  const verificationBadgeVariant =
    verificationStatus === "VERIFIED"
      ? "success"
      : verificationStatus === "PENDING"
        ? "warning"
        : "secondary";
  const canRequestVerification =
    readiness.isEligible && verificationStatus === "UNVERIFIED";

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <TrackEventOnMount
        eventName="vendor_dashboard_view"
        params={{ surface: "dashboard" }}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Vendor Dashboard
          </h1>
          <p className="mt-1 text-muted-foreground">
            Track profile readiness, events, and verification progress.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/vendors/${profile.slug}`}>
            <ExternalLink className="mr-2 h-4 w-4" />
            View Public Profile
          </Link>
        </Button>
      </div>

      <DashboardHeaderCard
        user={{
          name: user.name,
          email: user.email,
          image: user.image,
          createdAt: user.createdAt,
          role: user.role,
        }}
        vendorProfile={{ createdAt: profile.createdAt }}
        badges={user.userBadges.map((ub) => ({
          slug: ub.badge.slug,
          name: ub.badge.name,
          icon: ub.badge.icon,
        }))}
      />

      <VendorProfileProgress
        percent={profileCompletionPercent}
        profileComplete={profileComplete}
      />
      <VendorOnboardingChecklist showOnFirstCreate={params.onboarding === "1"} />

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Verification</CardTitle>
              <CardDescription className="mt-1">
                Verified vendors build trust and stand out in directory listings.
              </CardDescription>
            </div>
            <Badge variant={verificationBadgeVariant}>
              {verificationStatus}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {verificationStatus === "VERIFIED" ? (
            <p className="text-sm text-muted-foreground">
              Your vendor profile is verified.
            </p>
          ) : verificationStatus === "PENDING" ? (
            <p className="text-sm text-muted-foreground">
              Your verification request is pending review.
            </p>
          ) : canRequestVerification ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Your profile is eligible. Submit your request when ready.
              </p>
              <RequestVerificationButton />
            </div>
          ) : (
            <div className="space-y-2">
              <TrackEventOnMount
                eventName="vendor_verification_requirement_unmet"
                params={{
                  surface: "vendor_dashboard",
                  unmet_codes: readiness.unmetRequirements.map((r) => r.code).join(","),
                }}
              />
              <p className="text-sm text-muted-foreground">
                Complete the checklist below to request verification.
              </p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {readiness.unmetRequirements.map((requirement) => (
                  <li key={requirement.code}>{requirement.message}</li>
                ))}
              </ul>
              <Button asChild variant="outline" size="sm">
                <Link href="/vendor/profile/edit">Finish Profile</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <CardTitle className="text-xl">{profile.businessName}</CardTitle>
                <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                  <Heart className="h-4 w-4" />
                  {favoritedCount} {favoritedCount === 1 ? "favorite" : "favorites"}
                </span>
              </div>
              {profile.specialties && (
                <CardDescription className="mt-1">
                  {profile.specialties}
                </CardDescription>
              )}
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/vendor/profile/edit">Edit Profile</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {profile.description && (
            <p className="text-sm text-muted-foreground">
              {profile.description}
            </p>
          )}
          <VendorSocialLinks
            vendorId={profile.slug}
            websiteUrl={profile.websiteUrl}
            facebookUrl={profile.facebookUrl}
            instagramUrl={profile.instagramUrl}
          />
        </CardContent>
      </Card>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">My Season Pipeline</h2>
        <p className="text-sm text-muted-foreground">
          Events you&apos;ve requested, marked attending, or expressed interest in.
        </p>
        <VendorPipelineBoard
          intents={profile.vendorIntents.map((i) => ({
            id: i.id,
            status: i.status,
            visibility: i.visibility,
            event: {
              id: i.event.id,
              title: i.event.title,
              slug: i.event.slug,
              startDate: i.event.startDate,
              endDate: i.event.endDate,
              venue: i.event.venue,
              market: i.event.market,
            },
          }))}
        />
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Upcoming Events</h2>
          <Button asChild size="sm">
            <Link href="/vendor/events/link">Link to Event</Link>
          </Button>
        </div>

        {upcomingEvents.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <p>No upcoming events linked yet.</p>
              <p className="mt-1 text-sm">
                Link yourself to events so customers know where to find you.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {upcomingEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
