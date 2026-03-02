import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { StatusButton } from "@/components/admin/action-buttons";
import { updateClaimStatus } from "../actions";
import { formatDate, cn } from "@/lib/utils";
import Link from "next/link";
import type { ModerationStatus } from "@prisma/client";

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
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const statusFilter = (params.status as ModerationStatus) || "PENDING";

  const claims = await db.claimRequest.findMany({
    where: { status: statusFilter },
    orderBy: { createdAt: "desc" },
    include: {
      market: { select: { name: true } },
      user: { select: { name: true, email: true } },
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Claim Requests</h1>

      <div className="flex gap-2 border-b border-border pb-2">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={`/admin/claims?status=${tab.value}`}
            className={cn(
              "px-3 py-1.5 text-sm rounded-md transition-colors",
              statusFilter === tab.value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="space-y-4">
        {claims.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center">
            No {statusFilter.toLowerCase()} claims.
          </p>
        ) : (
          claims.map((claim) => (
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
      </div>
    </div>
  );
}
