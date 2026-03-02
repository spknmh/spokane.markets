import { requireAdmin } from "@/lib/auth-utils";
import { VenueForm } from "@/components/admin/venue-form";

export default async function NewVenuePage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Create Venue</h1>
      <VenueForm />
    </div>
  );
}
