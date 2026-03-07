import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { StatusButton } from "@/components/admin/action-buttons";
import { Pagination } from "@/components/pagination";
import { updateSubmissionStatus } from "../actions";
import { formatDate, formatTime12hr, cn } from "@/lib/utils";
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

export default async function AdminSubmissionsPage({
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
  const [total, submissions, markets, tags, features] = await Promise.all([
    db.submission.count({ where }),
    db.submission.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.market.findMany({ select: { id: true, name: true } }),
    db.tag.findMany({ select: { id: true, name: true } }),
    db.feature.findMany({ select: { id: true, name: true } }),
  ]);
  const totalPages = Math.ceil(total / limit);
  const marketMap = new Map(markets.map((m) => [m.id, m.name]));
  const tagMap = new Map(tags.map((t) => [t.id, t.name]));
  const featureMap = new Map(features.map((f) => [f.id, f.name]));

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Submissions</h1>

      <div className="flex gap-2 border-b border-border pb-2">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={`/admin/submissions?status=${tab.value}&page=1`}
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
        {submissions.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center">
            No {statusFilter.toLowerCase()} submissions.
          </p>
        ) : (
          submissions.map((sub) => (
            <div
              key={sub.id}
              className="border border-border rounded-lg p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{sub.eventTitle}</h3>
                  <p className="text-sm text-muted-foreground">
                    Submitted by {sub.submitterName} ({sub.submitterEmail})
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {sub.eventDate}
                    {sub.allDay ? " (all day)" : ` at ${formatTime12hr(sub.eventTime)}`}
                    {sub.endDate && sub.endDate !== sub.eventDate && ` – ${sub.endDate}`}
                    {sub.endTime && !sub.allDay && sub.endTime !== sub.eventTime && ` at ${formatTime12hr(sub.endTime)}`}
                    {sub.timezone && ` (${sub.timezone})`}
                    {" · "}
                    {sub.venueName}
                    {[sub.venueAddress, [sub.venueCity, sub.venueState, sub.venueZip].filter(Boolean).join(", ")]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  {sub.marketId && marketMap.has(sub.marketId) && (
                    <p className="text-sm text-muted-foreground">
                      Market: {marketMap.get(sub.marketId)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={statusVariant[sub.status]}>
                    {sub.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(sub.createdAt)}
                  </span>
                </div>
              </div>

              {sub.imageUrl && (
                <p className="text-sm">
                  <a href={sub.imageUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                    Event image
                  </a>
                </p>
              )}
              {sub.eventDescription && (
                <p className="text-sm">{sub.eventDescription}</p>
              )}
              {(sub.tagIds?.length ?? 0) > 0 && (
                <p className="text-sm text-muted-foreground">
                  Tags: {sub.tagIds!.map((id) => tagMap.get(id) ?? id).join(", ")}
                </p>
              )}
              {(sub.featureIds?.length ?? 0) > 0 && (
                <p className="text-sm text-muted-foreground">
                  Features: {sub.featureIds!.map((id) => featureMap.get(id) ?? id).join(", ")}
                </p>
              )}
              {sub.notes && (
                <p className="text-sm text-muted-foreground">
                  Notes: {sub.notes}
                </p>
              )}

              {sub.status === "PENDING" && (
                <div className="flex gap-2">
                  <StatusButton
                    action={updateSubmissionStatus.bind(null, sub.id, "APPROVED")}
                    label="Approve"
                  />
                  <StatusButton
                    action={updateSubmissionStatus.bind(null, sub.id, "REJECTED")}
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
