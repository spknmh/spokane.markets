import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { StatusButton } from "@/components/admin/action-buttons";
import { updateSubmissionStatus } from "../actions";
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

export default async function AdminSubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const statusFilter = (params.status as ModerationStatus) || "PENDING";

  const submissions = await db.submission.findMany({
    where: { status: statusFilter },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Submissions</h1>

      <div className="flex gap-2 border-b border-border pb-2">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={`/admin/submissions?status=${tab.value}`}
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
                    {sub.eventDate} at {sub.eventTime} &middot;{" "}
                    {sub.venueName}, {sub.venueAddress}
                  </p>
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

              {sub.eventDescription && (
                <p className="text-sm">{sub.eventDescription}</p>
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
    </div>
  );
}
