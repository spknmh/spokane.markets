import type { Metadata } from "next";
import { requireRole } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { OrganizerEventForm } from "@/components/organizer-event-form";
import { notFound, redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Edit Event — Spokane Markets",
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
      include: { tags: true, features: true },
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
    websiteUrl: event.websiteUrl ?? "",
    facebookUrl: event.facebookUrl ?? "",
    tagIds: event.tags.map((t) => t.id),
    featureIds: event.features.map((f) => f.id),
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
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
