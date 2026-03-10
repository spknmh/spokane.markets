import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { StatusButton } from "@/components/admin/action-buttons";
import { Pagination } from "@/components/pagination";
import { updateClaimStatus, updateVendorClaimStatus } from "../actions";
import { formatDate, cn } from "@/lib/utils";
import Link from "next/link";
import type { ModerationStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 25;

const CLAIM_TABS = [
  { label: "Market Claims", value: "market" },
  { label: "Vendor Claims", value: "vendor" },
] as const;

const STATUS_TABS = [
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
] as const;

const statusVariant: Record<ModerationStatus, "outline" | "default" | "destructive"> = {
  PENDING: "outline",
  APPROVED: "default",
  REJECTED: "destructive",
};

export default async function AdminClaimsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; status?: string; page?: string; limit?: string }>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const tab = (params.tab === "vendor" ? "vendor" : "market") as "market" | "vendor";
  const statusFilter = (params.status as ModerationStatus) || "PENDING";
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(params.limit ?? String(DEFAULT_LIMIT), 10)));

  const where = { status: statusFilter };

  const [marketTotal, marketClaims, vendorTotal, vendorClaims] = await Promise.all([
    db.claimRequest.count({ where }),
    tab === "market"
      ? db.claimRequest.findMany({
          where,
          orderBy: { createdAt: "desc" },
          include: {
            market: { select: { name: true } },
            user: { select: { name: true, email: true } },
          },
          skip: (page - 1) * limit,
          take: limit,
        })
      : [],
    db.vendorClaimRequest.count({ where }),
    tab === "vendor"
      ? db.vendorClaimRequest.findMany({
          where,
          orderBy: { createdAt: "desc" },
          include: {
            vendorProfile: { select: { businessName: true, slug: true } },
            user: { select: { name: true, email: true } },
          },
          skip: (page - 1) * limit,
          take: limit,
        })
      : [],
  ]);

  const total = tab === "market" ? marketTotal : vendorTotal;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Claim Requests</h1>

      <div className="flex flex-col gap-4">
        <div className="flex gap-2 border-b border-border pb-2">
          {CLAIM_TABS.map((t) => (
            <Link
              key={t.value}
              href={`/admin/claims?tab=${t.value}&status=${statusFilter}&page=1`}
              className={cn(
                "px-3 py-1.5 text-sm rounded-md transition-colors",
                tab === t.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {t.label}
            </Link>
          ))}
        </div>

        <div className="flex gap-2">
          {STATUS_TABS.map((s) => (
            <Link
              key={s.value}
              href={`/admin/claims?tab=${tab}&status=${s.value}`}
              className={cn(
                "px-3 py-1.5 text-sm rounded-md transition-colors",
                statusFilter === s.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {tab === "market" && (
          <>
            {marketClaims.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">
                No {statusFilter.toLowerCase()} market claims.
              </p>
            ) : (
              marketClaims.map((claim) => (
                <div
                  key={claim.id}
                  className="border border-border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{claim.market.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Claimed by {claim.user.name || claim.user.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusVariant[claim.status]}>
                        {claim.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(claim.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium">Proof:</p>
                    <p className="text-sm text-muted-foreground">{claim.proof}</p>
                  </div>

                  {claim.status === "PENDING" && (
                    <div className="flex gap-2">
                      <StatusButton
                        action={updateClaimStatus.bind(null, claim.id, "APPROVED")}
                        label="Approve"
                      />
                      <StatusButton
                        action={updateClaimStatus.bind(null, claim.id, "REJECTED")}
                        label="Reject"
                        variant="destructive"
                      />
                    </div>
                  )}
                </div>
              ))
            )}
            {tab === "market" && (
              <Pagination page={page} totalPages={totalPages} totalItems={total} limit={limit} />
            )}
          </>
        )}

        {tab === "vendor" && (
          <>
            {vendorClaims.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">
                No {statusFilter.toLowerCase()} vendor claims.
              </p>
            ) : (
              vendorClaims.map((claim) => (
                <div
                  key={claim.id}
                  className="border border-border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">
                        {claim.vendorProfile.businessName}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Claimed by {claim.user.name || claim.user.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusVariant[claim.status]}>
                        {claim.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(claim.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium">Proof:</p>
                    <p className="text-sm text-muted-foreground">{claim.proof}</p>
                  </div>

                  {claim.status === "PENDING" && (
                    <div className="flex gap-2">
                      <StatusButton
                        action={updateVendorClaimStatus.bind(
                          null,
                          claim.id,
                          "APPROVED"
                        )}
                        label="Approve"
                      />
                      <StatusButton
                        action={updateVendorClaimStatus.bind(
                          null,
                          claim.id,
                          "REJECTED"
                        )}
                        label="Reject"
                        variant="destructive"
                      />
                    </div>
                  )}
                </div>
              ))
            )}
            <Pagination page={page} totalPages={totalPages} totalItems={total} limit={limit} />
          </>
        )}
      </div>
    </div>
  );
}
