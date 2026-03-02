import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { StatusButton } from "@/components/admin/action-buttons";
import { updateReportStatus } from "../actions";
import { formatDate, cn } from "@/lib/utils";
import Link from "next/link";

const STATUS_TABS = [
  { label: "Pending", value: "PENDING" },
  { label: "Resolved", value: "RESOLVED" },
  { label: "Dismissed", value: "DISMISSED" },
] as const;

async function getTargetInfo(
  targetType: string,
  targetId: string
): Promise<{ label: string; link: string | null }> {
  switch (targetType) {
    case "EVENT": {
      const e = await db.event.findUnique({
        where: { id: targetId },
        select: { title: true, slug: true },
      });
      return e
        ? { label: e.title, link: `/events/${e.slug}` }
        : { label: targetId, link: null };
    }
    case "MARKET": {
      const m = await db.market.findUnique({
        where: { id: targetId },
        select: { name: true, slug: true },
      });
      return m
        ? { label: m.name, link: `/markets/${m.slug}` }
        : { label: targetId, link: null };
    }
    case "VENDOR": {
      const v = await db.vendorProfile.findUnique({
        where: { id: targetId },
        select: { businessName: true, slug: true },
      });
      return v
        ? { label: v.businessName, link: `/vendors/${v.slug}` }
        : { label: targetId, link: null };
    }
    case "REVIEW":
      return { label: `Review ${targetId.slice(0, 8)}...`, link: null };
    default:
      return { label: targetId, link: null };
  }
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const statusFilter = (params.status ?? "PENDING") as "PENDING" | "RESOLVED" | "DISMISSED";

  const reports = await db.report.findMany({
    where: { status: statusFilter },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Reports</h1>

      <div className="flex gap-2">
        {STATUS_TABS.map((s) => (
          <Link
            key={s.value}
            href={`/admin/reports?status=${s.value}`}
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

      <div className="space-y-4">
        {reports.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            No {statusFilter.toLowerCase()} reports.
          </p>
        ) : (
          reports.map(async (report) => {
            const { label: targetLabel, link: targetLink } = await getTargetInfo(
              report.targetType,
              report.targetId
            );

            return (
              <div
                key={report.id}
                className="rounded-lg border border-border p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{report.targetType}</Badge>
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
                      Reported by {report.user.name || report.user.email}
                    </p>
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
                  <div className="flex gap-2">
                    <StatusButton
                      action={updateReportStatus.bind(null, report.id, "RESOLVED")}
                      label="Resolve"
                    />
                    <StatusButton
                      action={updateReportStatus.bind(null, report.id, "DISMISSED")}
                      label="Dismiss"
                      variant="outline"
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
