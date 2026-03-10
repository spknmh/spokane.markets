import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { VenueForm } from "@/components/admin/venue-form";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditVenuePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const venue = await db.venue.findUnique({ where: { id } });
  if (!venue) notFound();

  const initialData = {
    id: venue.id,
    name: venue.name,
    address: venue.address,
    city: venue.city,
    state: venue.state,
    zip: venue.zip,
    lat: venue.lat,
    lng: venue.lng,
    neighborhood: venue.neighborhood ?? "",
    parkingNotes: venue.parkingNotes ?? "",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Edit Venue</h1>
      <VenueForm initialData={initialData} />
    </div>
  );
}
