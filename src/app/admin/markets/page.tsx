import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteButton, StatusButton } from "@/components/admin/action-buttons";
import { Pagination } from "@/components/pagination";
import { deleteMarket, verifyMarket } from "../actions";
import Link from "next/link";
import type { VerificationStatus } from "@prisma/client";

const DEFAULT_LIMIT = 25;

const verificationVariant: Record<VerificationStatus, "secondary" | "default" | "outline"> = {
  UNVERIFIED: "secondary",
  PENDING: "outline",
  VERIFIED: "default",
};

export default async function AdminMarketsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; limit?: string }>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(params.limit ?? String(DEFAULT_LIMIT), 10)));

  const [total, markets] = await Promise.all([
    db.market.count(),
    db.market.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { events: true } },
        owner: { select: { name: true, email: true } },
        claimRequests: {
          where: { status: "PENDING" },
          select: { id: true },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);
  const totalPages = Math.ceil(total / limit);

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
              <th className="text-left p-3 font-medium">Claim</th>
              <th className="text-left p-3 font-medium">Market Dates</th>
              <th className="text-right p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {markets.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-muted-foreground">
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
                  <td className="p-3">
                    <Badge
                      variant={
                        market.ownerId
                          ? "default"
                          : market.claimRequests.length > 0
                            ? "outline"
                            : "secondary"
                      }
                    >
                      {market.ownerId
                        ? "Claimed"
                        : market.claimRequests.length > 0
                          ? "Claim pending review"
                          : "Unclaimed"}
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
                    <DeleteButton
                        action={deleteMarket.bind(null, market.id)}
                        title="Delete market"
                        description={`Are you sure you want to delete "${market.name}"? This will remove the market and all associated data.`}
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
