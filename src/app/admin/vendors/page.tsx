import Link from "next/link";
import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { Pagination } from "@/components/pagination";

const DEFAULT_LIMIT = 25;

export default async function AdminVendorsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; limit?: string }>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(params.limit ?? String(DEFAULT_LIMIT), 10)));

  const [total, vendors] = await Promise.all([
    db.vendorProfile.count(),
    db.vendorProfile.findMany({
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Vendors</h1>
        <p className="mt-1 text-muted-foreground">
          View vendor profiles. Links open the public profile page.
        </p>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Business Name</th>
              <th className="px-4 py-3 text-left font-medium">Slug</th>
              <th className="px-4 py-3 text-left font-medium">Specialties</th>
              <th className="px-4 py-3 text-left font-medium">Events</th>
              <th className="px-4 py-3 text-left font-medium">Link</th>
            </tr>
          </thead>
          <tbody>
            {vendors.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No vendor profiles yet.
                </td>
              </tr>
            ) : (
              vendors.map((v) => (
                <tr key={v.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{v.businessName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{v.slug}</td>
                  <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">
                    {v.specialties ?? "—"}
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
