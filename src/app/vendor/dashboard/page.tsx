import Link from "next/link";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
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
import { ExternalLink } from "lucide-react";
import { VendorSocialLinks } from "@/components/vendor-social-links";

export default async function VendorDashboardPage() {
  const session = await requireAuth();

  const profile = await db.vendorProfile.findUnique({
    where: { userId: session.user.id },
    include: {
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
    },
  });

  if (!profile) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
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
    );
  }

  const upcomingEvents = profile.vendorEvents.filter(
    (ve) =>
      ve.event.startDate >= new Date() && ve.event.status === "PUBLISHED",
  );

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

      <Card className="mt-8">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">{profile.businessName}</CardTitle>
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
            websiteUrl={profile.websiteUrl}
            facebookUrl={profile.facebookUrl}
            instagramUrl={profile.instagramUrl}
          />
        </CardContent>
      </Card>

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
            {upcomingEvents.map((ve) => (
              <EventCard key={ve.id} event={ve.event} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
