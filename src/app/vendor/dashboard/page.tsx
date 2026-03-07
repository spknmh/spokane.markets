import Link from "next/link";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { DashboardHeaderCard } from "@/components/dashboard-header-card";
import { evaluateAndGrantBadges } from "@/lib/badges";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { EventCard } from "@/components/event-card";
import { VendorPipelineBoard } from "@/components/vendor-pipeline-board";
import { ExternalLink, Heart } from "lucide-react";
import { VendorSocialLinks } from "@/components/vendor-social-links";

export default async function VendorDashboardPage() {
  const session = await requireAuth();

  await evaluateAndGrantBadges(session.user.id);

  const [user, profile] = await Promise.all([
    db.user.findUnique({
      where: { id: session.user.id },
      include: {
        userBadges: { include: { badge: true }, orderBy: { badge: { sortOrder: "asc" } } },
      },
    }),
    db.vendorProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        _count: { select: { favoriteVendors: true } },
        vendorEvents: {
          include: {
            event: {
              include: {
                venue: true,
                tags: true,
                features: true,
                _count: { select: { vendorEvents: true } },
              },
            },
          },
          orderBy: { event: { startDate: "asc" } },
        },
        vendorIntents: {
          where: {
            status: { in: ["ATTENDING", "REQUESTED", "APPLIED", "WAITLISTED"] },
          },
          include: {
            event: {
              include: {
                venue: true,
                tags: true,
                features: true,
                market: true,
                _count: { select: { vendorEvents: true } },
              },
            },
          },
          orderBy: { event: { startDate: "asc" } },
        },
      },
    }),
  ]);

  if (!user) return null;

  if (!profile) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
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
        <div className="mt-12 text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome, Vendor!
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            You don&apos;t have a vendor profile yet. Create one to start
            listing where you&apos;ll be selling.
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link href="/vendor/profile/edit">Create Your Vendor Profile</Link>
          </Button>
        </div>
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

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          Vendor Dashboard
        </h1>
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

      <Card className="mt-8">
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

      <section className="mt-10">
        <h2 className="text-xl font-semibold">My Season Pipeline</h2>
        <p className="mt-1 text-sm text-muted-foreground">
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

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Upcoming Events</h2>
          <Button asChild size="sm">
            <Link href="/vendor/events/link">Link to Event</Link>
          </Button>
        </div>

        {upcomingEvents.length === 0 ? (
          <Card className="mt-4">
            <CardContent className="py-8 text-center text-muted-foreground">
              <p>No upcoming events linked yet.</p>
              <p className="mt-1 text-sm">
                Link yourself to events so customers know where to find you.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-4 space-y-3">
            {upcomingEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
