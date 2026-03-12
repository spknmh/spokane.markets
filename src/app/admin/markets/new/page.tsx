import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { MarketForm } from "@/components/admin/market-form";
import { getNeighborhoodOptions } from "@/lib/neighborhoods";

export const dynamic = "force-dynamic";

export default async function NewMarketPage() {
  await requireAdmin();

  const [venues, neighborhoods] = await Promise.all([
    db.venue.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    getNeighborhoodOptions(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Create Market</h1>
      <MarketForm venues={venues} neighborhoods={neighborhoods} />
    </div>
  );
}
