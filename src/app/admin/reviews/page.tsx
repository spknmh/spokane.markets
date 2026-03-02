import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { StatusButton } from "@/components/admin/action-buttons";
import { Pagination } from "@/components/pagination";
import { updateReviewStatus } from "../actions";
import { formatDate, cn } from "@/lib/utils";
import Link from "next/link";
import type { ModerationStatus } from "@prisma/client";

const DEFAULT_LIMIT = 25;

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

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string; limit?: string }>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const statusFilter = (params.status as ModerationStatus) || "PENDING";
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(params.limit ?? String(DEFAULT_LIMIT), 10)));

  const where = { status: statusFilter };
  const [total, reviews] = await Promise.all([
    db.review.count({ where }),
    db.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        event: { select: { title: true } },
        market: { select: { name: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Reviews</h1>

      <div className="flex gap-2 border-b border-border pb-2">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={`/admin/reviews?status=${tab.value}&page=1`}
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
        {reviews.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center">
            No {statusFilter.toLowerCase()} reviews.
          </p>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              className="border border-border rounded-lg p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">
                    {"★".repeat(review.rating)}
                    {"☆".repeat(5 - review.rating)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    by {review.user.name || review.user.email}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {review.event
                      ? `Event: ${review.event.title}`
                      : review.market
                        ? `Market: ${review.market.name}`
                        : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={statusVariant[review.status]}>
                    {review.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(review.createdAt)}
                  </span>
                </div>
              </div>

              {review.text && <p className="text-sm">{review.text}</p>}

              {review.status === "PENDING" && (
                <div className="flex gap-2">
                  <StatusButton
                    action={updateReviewStatus.bind(null, review.id, "APPROVED")}
                    label="Approve"
                  />
                  <StatusButton
                    action={updateReviewStatus.bind(null, review.id, "REJECTED")}
                    label="Reject"
                    variant="destructive"
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>
      <Pagination page={page} totalPages={totalPages} totalItems={total} limit={limit} />
    </div>
  );
}
