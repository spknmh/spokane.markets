import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteButton, StatusButton } from "@/components/admin/action-buttons";
import { deleteMarket, verifyMarket } from "../actions";
import Link from "next/link";
import type { VerificationStatus } from "@prisma/client";

const verificationVariant: Record<VerificationStatus, "secondary" | "default" | "outline"> = {
  UNVERIFIED: "secondary",
  PENDING: "outline",
  VERIFIED: "default",
};

export default async function AdminMarketsPage() {
  await requireAdmin();

  const markets = await db.market.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { events: true } },
      owner: { select: { name: true, email: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Markets</h1>
        <Button asChild>
          <Link href="/admin/markets/new">Create Market</Link>
        </Button>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium">Name</th>
              <th className="text-left p-3 font-medium">Area</th>
              <th className="text-left p-3 font-medium">Owner</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-left p-3 font-medium">Events</th>
              <th className="text-right p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {markets.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted-foreground">
                  No markets found.
                </td>
              </tr>
            ) : (
              markets.map((market) => (
                <tr key={market.id} className="hover:bg-muted/30">
                  <td className="p-3 font-medium">{market.name}</td>
                  <td className="p-3 text-muted-foreground">
                    {market.baseArea ?? "—"}
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {market.owner?.name || market.owner?.email || "—"}
                  </td>
                  <td className="p-3">
                    <Badge variant={verificationVariant[market.verificationStatus]}>
                      {market.verificationStatus}
                    </Badge>
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {market._count.events}
                  </td>
                  <td className="p-3 text-right space-x-2">
                    {market.verificationStatus !== "VERIFIED" && (
                      <StatusButton
                        action={verifyMarket.bind(null, market.id)}
                        label="Verify"
                      />
                    )}
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/markets/${market.id}/edit`}>Edit</Link>
                    </Button>
                    <DeleteButton action={deleteMarket.bind(null, market.id)} />
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
