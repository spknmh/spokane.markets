import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import type { EventInput } from "@/lib/validations";
import { EventForm } from "@/components/admin/event-form";
import { notFound } from "next/navigation";

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

  const scheduleDays =
    event.scheduleDays?.length
      ? event.scheduleDays.map((d) => ({
          date: d.date.toISOString().slice(0, 10),
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
    startDate: event.startDate.toISOString().slice(0, 16),
    endDate: event.endDate.toISOString().slice(0, 16),
    timezone: event.timezone ?? "",
    venueId: event.venueId,
    marketId: event.marketId ?? "",
    imageUrl: event.imageUrl ?? "",
    status: event.status as "DRAFT" | "PENDING" | "PUBLISHED" | "REJECTED" | "CANCELLED",
    websiteUrl: event.websiteUrl ?? "",
    facebookUrl: event.facebookUrl ?? "",
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
