import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/db";
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
      include: { tags: true, features: true },
    }),
    db.venue.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.market.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.tag.findMany({ orderBy: { name: "asc" } }),
    db.feature.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!event) notFound();

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
    status: event.status as "DRAFT" | "PENDING" | "PUBLISHED" | "CANCELLED",
    websiteUrl: event.websiteUrl ?? "",
    facebookUrl: event.facebookUrl ?? "",
    tagIds: event.tags.map((t) => t.id),
    featureIds: event.features.map((f) => f.id),
  };

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
