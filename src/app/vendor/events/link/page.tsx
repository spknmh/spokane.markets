import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { getParticipationConfig } from "@/lib/participation-config";
import { Button } from "@/components/ui/button";
import { VendorEventLinker } from "@/components/vendor-event-linker";
import { ArrowLeft } from "lucide-react";

export default async function VendorEventsLinkPage() {
  const session = await requireAuth();

  const profile = await db.vendorProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      vendorEvents: { select: { eventId: true } },
      vendorIntents: {
        where: {
          status: { in: ["ATTENDING", "REQUESTED", "APPLIED", "WAITLISTED"] },
        },
        select: { eventId: true },
      },
    },
  });

  if (!profile) {
    redirect("/vendor/profile/edit");
  }

  const linkedFromEvents = new Set(profile.vendorEvents.map((ve) => ve.eventId));
  const linkedFromIntents = new Set(
    profile.vendorIntents.map((i) => i.eventId),
  );
  const linkedEventIds = Array.from(
    new Set([...linkedFromEvents, ...linkedFromIntents]),
  );

  const upcomingEvents = await db.event.findMany({
    where: {
      status: "PUBLISHED",
      startDate: { gte: new Date() },
    },
    include: {
      venue: { select: { name: true, neighborhood: true } },
      market: true,
    },
    orderBy: { startDate: "asc" },
  });

  const serializedEvents = upcomingEvents.map((e) => ({
    id: e.id,
    title: e.title,
    slug: e.slug,
    startDate: e.startDate.toISOString(),
    endDate: e.endDate.toISOString(),
    venue: e.venue,
    mode: getParticipationConfig(e).mode,
  }));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/vendor/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">
          Link to Events
        </h1>
      </div>

      <p className="mb-6 text-muted-foreground">
        Select the upcoming events where you&apos;ll be selling. Linked events
        will appear on your public vendor profile.
      </p>

      <VendorEventLinker
        events={serializedEvents}
        linkedEventIds={linkedEventIds}
      />
    </div>
  );
}
