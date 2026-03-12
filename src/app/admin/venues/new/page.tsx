import { requireAdmin } from "@/lib/auth-utils";
import { VenueForm } from "@/components/admin/venue-form";
import { getNeighborhoodOptions } from "@/lib/neighborhoods";

export const dynamic = "force-dynamic";

export default async function NewVenuePage() {
  await requireAdmin();
  const neighborhoods = await getNeighborhoodOptions();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Create Venue</h1>
      <VenueForm neighborhoods={neighborhoods} />
    </div>
  );
}
