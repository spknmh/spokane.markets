import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import type { EventInput } from "@/lib/validations";
import { EventForm } from "@/components/admin/event-form";
import { notFound } from "next/navigation";
import { formatDateOnlyUTC, formatForDateTimeLocal } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const [event, venues, markets, tags, features] = await Promise.all([
    db.event.findUnique({
      where: { id },
      include: { tags: true, features: true, scheduleDays: { orderBy: { date: "asc" } } },
    }),
    db.venue.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.market.findMany({ select: { id: true, name: true, venueId: true }, orderBy: { name: "asc" } }),
    db.tag.findMany({ orderBy: { name: "asc" } }),
    db.feature.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!event) notFound();

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
    showImageInList: event.showImageInList ?? true,
    imageFocalX: event.imageFocalX ?? 50,
    imageFocalY: event.imageFocalY ?? 50,
    status: event.status as "DRAFT" | "PENDING" | "PUBLISHED" | "REJECTED" | "CANCELLED",
    websiteUrl: event.websiteUrl ?? "",
    facebookUrl: event.facebookUrl ?? "",
    instagramUrl: event.instagramUrl ?? "",
    tagIds: event.tags.map((t) => t.id),
    featureIds: event.features.map((f) => f.id),
    scheduleDays,
    participationMode: (event.participationMode ?? "") as string,
    vendorCapacity: event.vendorCapacity ?? undefined,
    publicIntentListEnabled: event.publicIntentListEnabled ?? undefined,
    publicIntentNamesEnabled: event.publicIntentNamesEnabled ?? undefined,
    publicRosterEnabled: event.publicRosterEnabled ?? undefined,
  } as EventInput & { id: string; scheduleDays?: typeof scheduleDays };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Edit Event</h1>
      <EventForm
        venues={venues}
        markets={markets}
        tags={tags}
        features={features}
        initialData={initialData}
      />
    </div>
  );
}
