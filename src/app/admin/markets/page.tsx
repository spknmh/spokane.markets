import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeleteButton, StatusButton } from "@/components/admin/action-buttons";
import { Pagination } from "@/components/pagination";
import { deleteMarket, restoreMarket, verifyMarket } from "../actions";
import Link from "next/link";
import type { VerificationStatus } from "@prisma/client";
import { parseAdminPagination, parseFlag, parseQuery } from "@/lib/admin/table-query";

export const dynamic = "force-dynamic";

const verificationVariant: Record<VerificationStatus, "secondary" | "default" | "outline"> = {
  UNVERIFIED: "secondary",
  PENDING: "outline",
  VERIFIED: "default",
};

export default async function AdminMarketsPage({
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
            { slug: { contains: q, mode: "insensitive" as const } },
            { baseArea: { contains: q, mode: "insensitive" as const } },
            {
              owner: {
                OR: [
                  { name: { contains: q, mode: "insensitive" as const } },
                  { email: { contains: q, mode: "insensitive" as const } },
                ],
              },
            },
          ],
        }
      : {}),
  };

  const [total, markets] = await Promise.all([
    db.market.count({ where }),
    db.market.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        _count: { select: { events: true } },
        owner: { select: { name: true, email: true } },
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
        <div className="flex items-center gap-2">
          <Button asChild variant={archived ? "default" : "outline"}>
            <Link href={archived ? "/admin/markets" : "/admin/markets?archived=1"}>
              {archived ? "Hide archived" : "Show archived"}
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/markets/new">Create Market</Link>
          </Button>
        </div>
      </div>

      <form className="flex items-center gap-2">
        <Input name="q" defaultValue={q} placeholder="Search market, slug, owner..." />
        {archived && <input type="hidden" name="archived" value="1" />}
        <Button type="submit" variant="outline">Search</Button>
        <Button type="button" variant="outline" asChild>
          <Link
            href={`/api/admin/data/export/entity?entity=markets${archived ? "&archived=1" : ""}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
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
              <th className="text-left p-3 font-medium">Area</th>
              <th className="text-left p-3 font-medium">Owner</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-left p-3 font-medium">Ownership</th>
              <th className="text-left p-3 font-medium">Events</th>
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
                    <div className="flex items-center gap-2">
                      <Badge variant={verificationVariant[market.verificationStatus]}>
                        {market.verificationStatus}
                      </Badge>
                      {market.deletedAt && <Badge variant="secondary">Archived</Badge>}
                    </div>
                  </td>
                  <td className="p-3">
                    <Badge variant={market.ownerId ? "default" : "secondary"}>
                      {market.ownerId ? "Managed" : "Unassigned"}
                    </Badge>
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {market._count.events}
                  </td>
                  <td className="p-3 text-right space-x-2">
                    {market.verificationStatus !== "VERIFIED" && !market.deletedAt && (
                      <StatusButton
                        action={verifyMarket.bind(null, market.id)}
                        label="Verify"
                      />
                    )}
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/markets/${market.id}/edit`}>Edit</Link>
                    </Button>
                    {market.deletedAt ? (
                      <StatusButton
                        action={restoreMarket.bind(null, market.id)}
                        label="Restore"
                        variant="outline"
                      />
                    ) : (
                      <DeleteButton
                        action={deleteMarket.bind(null, market.id)}
                        title="Archive market"
                        description={`Archive "${market.name}"? You can restore it later from archived markets.`}
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
