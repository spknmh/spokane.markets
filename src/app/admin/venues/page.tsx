import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/admin/action-buttons";
import { deleteVenue } from "../actions";
import Link from "next/link";

export default async function AdminVenuesPage() {
  await requireAdmin();

  const venues = await db.venue.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { events: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Venues</h1>
        <Button asChild>
          <Link href="/admin/venues/new">Create Venue</Link>
        </Button>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium">Name</th>
              <th className="text-left p-3 font-medium">Address</th>
              <th className="text-left p-3 font-medium">Neighborhood</th>
              <th className="text-left p-3 font-medium">Events</th>
              <th className="text-right p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {venues.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted-foreground">
                  No venues found.
                </td>
              </tr>
            ) : (
              venues.map((venue) => (
                <tr key={venue.id} className="hover:bg-muted/30">
                  <td className="p-3 font-medium">{venue.name}</td>
                  <td className="p-3 text-muted-foreground">
                    {venue.address}, {venue.city}
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {venue.neighborhood ?? "—"}
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {venue._count.events}
                  </td>
                  <td className="p-3 text-right space-x-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/venues/${venue.id}/edit`}>Edit</Link>
                    </Button>
                    <DeleteButton
                      action={deleteVenue.bind(null, venue.id)}
                      title="Delete venue"
                      description={`Are you sure you want to delete "${venue.name}"? This will remove the venue. Events using it must be updated first.`}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
