import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { MarketForm } from "@/components/admin/market-form";

export const dynamic = "force-dynamic";

export default async function NewMarketPage() {
  await requireAdmin();

  const venues = await db.venue.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Create Market</h1>
      <MarketForm venues={venues} />
    </div>
  );
}
