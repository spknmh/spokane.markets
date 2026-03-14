import Link from "next/link";
import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeleteButton, StatusButton } from "@/components/admin/action-buttons";
import { Pagination } from "@/components/pagination";
import { deleteVendor, restoreVendor } from "../actions";
import { parseAdminPagination, parseFlag, parseQuery } from "@/lib/admin/table-query";

export const dynamic = "force-dynamic";

export default async function AdminVendorsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; limit?: string; orphaned?: string; archived?: string; q?: string }>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const { page, limit } = parseAdminPagination(params);
  const orphanedOnly = parseFlag(params.orphaned);
  const archived = parseFlag(params.archived);
  const q = parseQuery(params.q);

  const where = {
    ...(orphanedOnly ? { userId: null } : {}),
    ...(archived ? {} : { deletedAt: null }),
    ...(q
      ? {
          OR: [
            { businessName: { contains: q, mode: "insensitive" as const } },
            { slug: { contains: q, mode: "insensitive" as const } },
            { specialties: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [total, vendors] = await Promise.all([
    db.vendorProfile.count({ where }),
    db.vendorProfile.findMany({
      where,
      orderBy: { businessName: "asc" },
      include: {
        _count: { select: { vendorEvents: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vendors</h1>
          <p className="mt-1 text-muted-foreground">
            Manage vendor profiles. Create, edit, or delete.
          </p>
          <div className="mt-2 flex gap-2">
            <Button
              variant={orphanedOnly ? "default" : "outline"}
              size="sm"
              asChild
            >
              <Link href={orphanedOnly ? "/admin/vendors" : "/admin/vendors?orphaned=true"}>
                {orphanedOnly ? "All vendors" : "Unlinked only"}
              </Link>
            </Button>
            <Button variant={archived ? "default" : "outline"} size="sm" asChild>
              <Link href={archived ? "/admin/vendors" : "/admin/vendors?archived=1"}>
                {archived ? "Hide archived" : "Show archived"}
              </Link>
            </Button>
          </div>
        </div>
        <Button asChild>
          <Link href="/admin/vendors/new">Create Vendor</Link>
        </Button>
      </div>

      <form className="flex items-center gap-2">
        <Input name="q" defaultValue={q} placeholder="Search business, slug, specialty..." />
        {orphanedOnly && <input type="hidden" name="orphaned" value="1" />}
        {archived && <input type="hidden" name="archived" value="1" />}
        <Button type="submit" variant="outline">Search</Button>
        <Button type="button" variant="outline" asChild>
          <Link
            href={`/api/admin/data/export/entity?entity=vendors${orphanedOnly ? "&orphaned=1" : ""}${archived ? "&archived=1" : ""}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
          >
            Export CSV
          </Link>
        </Button>
      </form>

      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Business Name</th>
              <th className="px-4 py-3 text-left font-medium">Slug</th>
              <th className="px-4 py-3 text-left font-medium">Specialties</th>
              <th className="px-4 py-3 text-left font-medium">Ownership</th>
              <th className="px-4 py-3 text-left font-medium">Events</th>
              <th className="px-4 py-3 text-left font-medium">Link</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vendors.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  No vendor profiles yet.
                </td>
              </tr>
            ) : (
              vendors.map((v) => (
                <tr key={v.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{v.businessName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{v.slug}</td>
                  <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">
                    {v.specialties ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={v.userId ? "default" : "secondary"}>
                        {v.userId ? "Managed" : "Unassigned"}
                      </Badge>
                      {v.deletedAt && <Badge variant="secondary">Archived</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3">{v._count.vendorEvents}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/vendors/${v.slug}`}
                      className="text-primary hover:underline"
                    >
                      View
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/vendors/${v.id}/edit`}>Edit</Link>
                    </Button>
                    {v.deletedAt ? (
                      <StatusButton
                        action={restoreVendor.bind(null, v.id)}
                        label="Restore"
                        variant="outline"
                      />
                    ) : (
                      <DeleteButton
                        action={deleteVendor.bind(null, v.id)}
                        title="Archive vendor"
                        description={`Archive "${v.businessName}"? You can restore it later from archived vendors.`}
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
