import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeleteButton, StatusButton } from "@/components/admin/action-buttons";
import { Pagination } from "@/components/pagination";
import { deleteVenue, restoreVenue } from "../actions";
import Link from "next/link";
import { parseAdminPagination, parseFlag, parseQuery } from "@/lib/admin/table-query";

export const dynamic = "force-dynamic";

export default async function AdminVenuesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; limit?: string; archived?: string; q?: string }>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const { page, limit } = parseAdminPagination(params);
  const archived = parseFlag(params.archived);
  const q = parseQuery(params.q);
  const where = {
    ...(archived ? {} : { deletedAt: null }),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { address: { contains: q, mode: "insensitive" as const } },
            { city: { contains: q, mode: "insensitive" as const } },
            { neighborhood: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [total, venues] = await Promise.all([
    db.venue.count({ where }),
    db.venue.findMany({
      where,
      orderBy: { name: "asc" },
      include: { _count: { select: { events: true } } },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Venues</h1>
        <div className="flex items-center gap-2">
          <Button asChild variant={archived ? "default" : "outline"}>
            <Link href={archived ? "/admin/venues" : "/admin/venues?archived=1"}>
              {archived ? "Hide archived" : "Show archived"}
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/venues/new">Create Venue</Link>
          </Button>
        </div>
      </div>

      <form className="flex items-center gap-2">
        <Input name="q" defaultValue={q} placeholder="Search venue, address, city..." />
        {archived && <input type="hidden" name="archived" value="1" />}
        <Button type="submit" variant="outline">Search</Button>
        <Button type="button" variant="outline" asChild>
          <Link
            href={`/api/admin/data/export/entity?entity=venues${archived ? "&archived=1" : ""}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
          >
            Export CSV
          </Link>
        </Button>
      </form>

      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium">Name</th>
              <th className="text-left p-3 font-medium">Address</th>
              <th className="text-left p-3 font-medium">Neighborhood</th>
              <th className="text-left p-3 font-medium">Events</th>
              <th className="text-left p-3 font-medium">State</th>
              <th className="text-right p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {venues.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted-foreground">
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
                  <td className="p-3">
                    {venue.deletedAt ? <Badge variant="secondary">Archived</Badge> : "Active"}
                  </td>
                  <td className="p-3 text-right space-x-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/venues/${venue.id}/edit`}>Edit</Link>
                    </Button>
                    {venue.deletedAt ? (
                      <StatusButton
                        action={restoreVenue.bind(null, venue.id)}
                        label="Restore"
                        variant="outline"
                      />
                    ) : (
                      <DeleteButton
                        action={deleteVenue.bind(null, venue.id)}
                        title="Archive venue"
                        description={`Archive "${venue.name}"? You can restore it later from archived venues.`}
                        label="Archive"
                      />
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} totalItems={total} limit={limit} />
    </div>
  );
}
