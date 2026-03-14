import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { StatusButton } from "@/components/admin/action-buttons";
import { Pagination } from "@/components/pagination";
import { bulkUpdateReportStatus, updateReportStatus, updateReportTriage } from "../actions";
import { formatDate, cn } from "@/lib/utils";
import { getReportTargetInfo } from "@/lib/report-target";
import Link from "next/link";

export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 25;

const STATUS_TABS = [
  { label: "Pending", value: "PENDING" },
  { label: "Resolved", value: "RESOLVED" },
  { label: "Dismissed", value: "DISMISSED" },
] as const;

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string; limit?: string; severity?: string; escalation?: string }>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const statusFilter = (params.status ?? "PENDING") as "PENDING" | "RESOLVED" | "DISMISSED";
  const severityFilter = params.severity as
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "CRITICAL"
    | undefined;
  const escalationFilter = params.escalation as
    | "NEW"
    | "TRIAGED"
    | "ESCALATED"
    | "CLOSED"
    | undefined;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(params.limit ?? String(DEFAULT_LIMIT), 10)));

  const where = {
    status: statusFilter,
    ...(severityFilter ? { severity: severityFilter } : {}),
    ...(escalationFilter ? { escalationStatus: escalationFilter } : {}),
  };
  const [total, reports] = await Promise.all([
    db.report.count({ where }),
    db.report.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Reports</h1>

      <div className="flex gap-2">
        {STATUS_TABS.map((s) => (
          <Link
            key={s.value}
            href={`/admin/reports?status=${s.value}&page=1`}
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

      <div className="flex flex-wrap gap-2 text-sm">
        <Link href={`/admin/reports?status=${statusFilter}&page=1`} className={cn("px-3 py-1.5 rounded-md transition-colors", !severityFilter ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted")}>
          All severities
        </Link>
        {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const).map((severity) => (
          <Link
            key={severity}
            href={`/admin/reports?status=${statusFilter}&severity=${severity}&page=1`}
            className={cn(
              "px-3 py-1.5 rounded-md transition-colors",
              severityFilter === severity
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {severity}
          </Link>
        ))}
      </div>

      <form className="space-y-4">
        {statusFilter === "PENDING" && (
          <div className="flex gap-2">
            <button
              type="submit"
              formAction={bulkUpdateReportStatus.bind(null, "RESOLVED")}
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground"
            >
              Bulk resolve selected
            </button>
            <button
              type="submit"
              formAction={bulkUpdateReportStatus.bind(null, "DISMISSED")}
              className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-background px-3 text-sm font-medium"
            >
              Bulk dismiss selected
            </button>
          </div>
        )}
        {reports.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            No {statusFilter.toLowerCase()} reports.
          </p>
        ) : (
          reports.map(async (report) => {
            const { label: targetLabel, link: targetLink } = await getReportTargetInfo(
              report.targetType,
              report.targetId
            );

            return (
              <div
                key={report.id}
                className="rounded-lg border border-border p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {statusFilter === "PENDING" && (
                      <input
                        type="checkbox"
                        name="selectedIds"
                        value={report.id}
                        className="mt-1 h-4 w-4"
                      />
                    )}
                    <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{report.targetType}</Badge>
                      <Badge variant="secondary">{report.severity}</Badge>
                      <Badge variant="outline">{report.escalationStatus}</Badge>
                      {targetLink ? (
                        <Link
                          href={targetLink}
                          className="font-semibold text-primary hover:underline"
                        >
                          {targetLabel}
                        </Link>
                      ) : (
                        <span className="font-semibold">{targetLabel}</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Reported by {report.user?.name || report.user?.email || "Unknown"}
                    </p>
                    {report.internalNotes && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Internal: {report.internalNotes}
                      </p>
                    )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(report.createdAt)}
                  </span>
                </div>

                {(report.reason || report.notes) && (
                  <div>
                    {report.reason && (
                      <p className="text-sm">
                        <span className="font-medium">Reason:</span> {report.reason}
                      </p>
                    )}
                    {report.notes && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {report.notes}
                      </p>
                    )}
                  </div>
                )}

                {report.status === "PENDING" && (
                  <div className="flex flex-wrap gap-2">
                    <StatusButton
                      action={updateReportStatus.bind(null, report.id, "RESOLVED")}
                      label="Resolve"
                    />
                    <StatusButton
                      action={updateReportStatus.bind(null, report.id, "DISMISSED")}
                      label="Dismiss"
                      variant="outline"
                    />
                    <StatusButton
                      action={updateReportTriage.bind(null, report.id, {
                        severity: "HIGH",
                        escalationStatus: "ESCALATED",
                      })}
                      label="Escalate"
                      variant="outline"
                    />
                    <StatusButton
                      action={updateReportTriage.bind(null, report.id, {
                        escalationStatus: "TRIAGED",
                      })}
                      label="Mark triaged"
                      variant="outline"
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </form>
      <Pagination page={page} totalPages={totalPages} totalItems={total} limit={limit} />
    </div>
  );
}
