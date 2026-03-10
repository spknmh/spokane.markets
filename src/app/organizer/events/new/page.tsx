import type { Metadata } from "next";
import { requireRole } from "@/lib/auth-utils";
import { SITE_NAME } from "@/lib/constants";
import { db } from "@/lib/db";
import { OrganizerEventForm } from "@/components/organizer-event-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Submit Event — ${SITE_NAME}`,
};

export default async function OrganizerNewEventPage() {
  const session = await requireRole("ORGANIZER");

  const [venues, tags, features, markets] = await Promise.all([
    db.venue.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.tag.findMany({ orderBy: { name: "asc" } }),
    db.feature.findMany({ orderBy: { name: "asc" } }),
    db.market.findMany({
      where: { ownerId: session.user.id },
      select: { id: true, name: true, venueId: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight">Submit New Event</h1>
      <p className="mt-1 text-muted-foreground">
        Fill out the details below to submit your event for listing.
      </p>
      <div className="mt-6">
        <OrganizerEventForm
          venues={venues}
          markets={markets}
          tags={tags}
          features={features}
        />
      </div>
    </div>
  );
}
