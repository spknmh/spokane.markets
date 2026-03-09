import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { StatusButton } from "@/components/admin/action-buttons";
import { Pagination } from "@/components/pagination";
import { updatePhotoStatus } from "../actions";
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

export default async function AdminPhotosPage({
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
  const [total, photos] = await Promise.all([
    db.photo.count({ where }),
    db.photo.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        uploadedBy: { select: { name: true, email: true } },
        event: { select: { title: true, slug: true } },
        market: { select: { name: true, slug: true } },
        review: { select: { id: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Photos</h1>

      <div className="flex gap-2 border-b border-border pb-2">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={`/admin/photos?status=${tab.value}`}
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
        {photos.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center">
            No {statusFilter.toLowerCase()} photos.
          </p>
        ) : (
          photos.map((photo) => (
            <div
              key={photo.id}
              className="border border-border rounded-lg p-4 space-y-3 flex flex-col sm:flex-row gap-4"
            >
              <div className="shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={photo.alt ?? "Photo"}
                  width={200}
                  height={150}
                  className="rounded-md object-cover w-[200px] h-[150px]"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      by {photo.uploadedBy.name || photo.uploadedBy.email}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {photo.event
                        ? `Market date: ${photo.event.title}`
                        : photo.market
                          ? `Market: ${photo.market.name}`
                          : photo.review
                            ? "Review photo"
                            : "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={statusVariant[photo.status]}>
                      {photo.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(photo.createdAt)}
                    </span>
                  </div>
                </div>

                {photo.event && (
                  <Link
                    href={`/events/${photo.event.slug}`}
                    className="text-sm text-primary hover:underline mt-1 inline-block"
                  >
                    View market date →
                  </Link>
                )}
                {photo.market && (
                  <Link
                    href={`/markets/${photo.market.slug}`}
                    className="text-sm text-primary hover:underline mt-1 inline-block"
                  >
                    View market →
                  </Link>
                )}

                {photo.status === "PENDING" && (
                  <div className="flex gap-2 mt-3">
                    <StatusButton
                      action={updatePhotoStatus.bind(null, photo.id, "APPROVED")}
                      label="Approve"
                    />
                    <StatusButton
                      action={updatePhotoStatus.bind(null, photo.id, "REJECTED")}
                      label="Reject"
                      variant="destructive"
                    />
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      <Pagination page={page} totalPages={totalPages} totalItems={total} limit={limit} />
    </div>
  );
}
