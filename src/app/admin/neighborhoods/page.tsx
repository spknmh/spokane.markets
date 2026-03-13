import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { NeighborhoodsManager } from "@/components/admin/neighborhoods-manager";

export const dynamic = "force-dynamic";

export default async function AdminNeighborhoodsPage() {
  await requireAdmin();

  const neighborhoods = await db.neighborhood.findMany({
    orderBy: [{ label: "asc" }],
    include: {
      _count: {
        select: {
          markets: true,
          venues: true,
        },
      },
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Neighborhoods</h1>
        <p className="mt-1 text-muted-foreground">
          Manage the neighborhood list used by markets, venues, filters, and
          newsletter subscriptions.
        </p>
      </div>

      <NeighborhoodsManager initialNeighborhoods={neighborhoods} />
    </div>
  );
}
