import { requireAdmin } from "@/lib/auth-utils";
import { MarketForm } from "@/components/admin/market-form";

export default async function NewMarketPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Create Market</h1>
      <MarketForm />
    </div>
  );
}
