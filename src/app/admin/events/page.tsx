import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDateRangeInTimezone, cn } from "@/lib/utils";
import { DeleteButton, StatusButton } from "@/components/admin/action-buttons";
import { Pagination } from "@/components/pagination";
import { deleteEvent, restoreEvent } from "../actions";
import Link from "next/link";
import type { EventStatus } from "@prisma/client";
import { parseAdminPagination, parseFlag, parseQuery } from "@/lib/admin/table-query";

export const dynamic = "force-dynamic";

const STATUS_TABS = [
  { label: "All", value: "" },
  { label: "Draft", value: "DRAFT" },
  { label: "Pending Review", value: "PENDING" },
  { label: "Published", value: "PUBLISHED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Cancelled", value: "CANCELLED" },
] as const;

const statusVariant: Record<EventStatus, "info" | "warning" | "success" | "destructive" | "outline"> = {
  DRAFT: "info",
  PENDING: "warning",
  PUBLISHED: "success",
  REJECTED: "destructive",
  CANCELLED: "destructive",
};

const statusLabel: Record<EventStatus, string> = {
  DRAFT: "Draft",
  PENDING: "Pending Review",
  PUBLISHED: "Published",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string; limit?: string; archived?: string; q?: string }>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const statusFilter = params.status as EventStatus | undefined;
  const archived = parseFlag(params.archived);
  const q = parseQuery(params.q);
  const { page, limit } = parseAdminPagination(params);

  const where = {
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(archived ? {} : { deletedAt: null }),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { slug: { contains: q, mode: "insensitive" as const } },
            { venue: { name: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };
  const [total, events] = await Promise.all([
    db.event.count({ where }),
    db.event.findMany({
      where,
      include: { venue: { select: { name: true } } },
      orderBy: { startDate: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Events</h1>
        <div className="flex items-center gap-2">
          <Button asChild variant={archived ? "default" : "outline"}>
            <Link href={archived ? "/admin/events" : "/admin/events?archived=1"}>
              {archived ? "Hide archived" : "Show archived"}
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/events/new">Create Event</Link>
          </Button>
        </div>
      </div>

      <form className="flex items-center gap-2">
        <Input name="q" defaultValue={q} placeholder="Search title, slug, venue..." />
        {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
        {archived && <input type="hidden" name="archived" value="1" />}
        <Button type="submit" variant="outline">Search</Button>
        <Button type="button" variant="outline" asChild>
          <Link
            href={`/api/admin/data/export/entity?entity=events${statusFilter ? `&status=${statusFilter}` : ""}${archived ? "&archived=1" : ""}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
          >
            Export CSV
          </Link>
        </Button>
      </form>

      <div className="flex gap-2 border-b border-border pb-2">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={tab.value ? `/admin/events?status=${tab.value}&page=1${archived ? "&archived=1" : ""}` : `/admin/events?page=1${archived ? "&archived=1" : ""}`}
            className={cn(
              "px-3 py-1.5 text-sm rounded-md transition-colors",
              (statusFilter ?? "") === tab.value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium">Title</th>
              <th className="text-left p-3 font-medium">Date</th>
              <th className="text-left p-3 font-medium">Venue</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-right p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {events.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted-foreground">
                  No events found.
                </td>
              </tr>
            ) : (
              events.map((event) => (
                <tr key={event.id} className="hover:bg-muted/30">
                  <td className="p-3 font-medium">{event.title}</td>
                  <td className="p-3 text-muted-foreground">
                    {formatDateRangeInTimezone(event.startDate, event.endDate, null)}
                  </td>
                  <td className="p-3 text-muted-foreground">{event.venue.name}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={statusVariant[event.status]}>
                        {statusLabel[event.status]}
                      </Badge>
                      {event.deletedAt && <Badge variant="secondary">Archived</Badge>}
                    </div>
                  </td>
                  <td className="p-3 text-right space-x-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/events/${event.id}/edit`}>Edit</Link>
                    </Button>
                    {event.deletedAt ? (
                      <StatusButton
                        action={restoreEvent.bind(null, event.id)}
                        label="Restore"
                        variant="outline"
                      />
                    ) : (
                      <DeleteButton
                        action={deleteEvent.bind(null, event.id)}
                        title="Archive event"
                        description={`Archive "${event.title}"? You can restore it later from archived events.`}
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
