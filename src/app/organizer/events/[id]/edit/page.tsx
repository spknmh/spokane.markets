import type { Metadata } from "next";
import { requireRole } from "@/lib/auth-utils";
import { SITE_NAME } from "@/lib/constants";
import { db } from "@/lib/db";
import { TrackEventOnMount } from "@/components/analytics/track-event-on-mount";
import { OrganizerEventForm } from "@/components/organizer-event-form";
import { notFound, redirect } from "next/navigation";
import { formatDateOnlyUTC, formatForDateTimeLocal } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Edit Event — ${SITE_NAME}`,
};

export default async function OrganizerEditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole("ORGANIZER");
  const { id } = await params;

  const [event, venues, tags, features, markets] = await Promise.all([
    db.event.findUnique({
      where: { id },
      include: { tags: true, features: true, scheduleDays: { orderBy: { date: "asc" } } },
    }),
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

  if (!event) notFound();

  const isOwner = event.submittedById === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    redirect("/unauthorized");
  }

  const tz = "America/Los_Angeles";
  const scheduleDays =
    event.scheduleDays?.length
      ? event.scheduleDays.map((d) => ({
          date: formatDateOnlyUTC(d.date),
          allDay: d.allDay,
          startTime: d.allDay ? undefined : d.startTime,
          endTime: d.allDay ? undefined : d.endTime,
        }))
      : undefined;

  const initialData = {
    id: event.id,
    title: event.title,
    slug: event.slug,
    description: event.description ?? "",
    startDate: formatForDateTimeLocal(event.startDate, tz),
    endDate: formatForDateTimeLocal(event.endDate, tz),
    venueId: event.venueId,
    venueName: "",
    venueAddress: "",
    venueCity: "Spokane",
    venueState: "WA",
    venueZip: "",
    venueLat: undefined,
    venueLng: undefined,
    marketId: event.marketId ?? "",
    imageUrl: event.imageUrl ?? "",
    showImageInList: event.showImageInList ?? false,
    imageFocalX: event.imageFocalX ?? 50,
    imageFocalY: event.imageFocalY ?? 50,
    websiteUrl: event.websiteUrl ?? "",
    facebookUrl: event.facebookUrl ?? "",
    tagIds: event.tags.map((t) => t.id),
    featureIds: event.features.map((f) => f.id),
    scheduleDays,
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <TrackEventOnMount
        eventName="event_edit_started"
        params={{ event_id: event.id, surface: "dashboard" }}
      />
      <h1 className="text-3xl font-bold tracking-tight">Edit Event</h1>
      <div className="mt-6">
        <OrganizerEventForm
          venues={venues}
          markets={markets}
          tags={tags}
          features={features}
          initialData={initialData}
        />
      </div>
    </div>
  );
}
