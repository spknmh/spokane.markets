import Link from "next/link";
import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/admin/action-buttons";
import { Pagination } from "@/components/pagination";
import { deleteVendor } from "../actions";

export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 25;

export default async function AdminVendorsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; limit?: string; orphaned?: string }>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(params.limit ?? String(DEFAULT_LIMIT), 10)));
  const orphanedOnly = params.orphaned === "1" || params.orphaned === "true";

  const where = orphanedOnly ? { userId: null } : undefined;

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
          </div>
        </div>
        <Button asChild>
          <Link href="/admin/vendors/new">Create Vendor</Link>
        </Button>
      </div>

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
                    <Badge variant={v.userId ? "default" : "secondary"}>
                      {v.userId ? "Managed" : "Unassigned"}
                    </Badge>
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
                    <DeleteButton
                      action={deleteVendor.bind(null, v.id)}
                      title="Delete vendor"
                      description={`Are you sure you want to delete "${v.businessName}"? This will remove the vendor profile and all associated data.`}
                    />
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
