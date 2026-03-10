import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import type { QueueItem } from "@/lib/admin/queues";

const TYPE_LABELS: Record<QueueItem["type"], string> = {
  submission: "Submission",
  review: "Review",
  photo: "Photo",
  market_claim: "Market Claim",
  vendor_claim: "Vendor Claim",
  report: "Report",
  application: "Application",
};

export function QueueRow({ item }: { item: QueueItem }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{TYPE_LABELS[item.type]}</Badge>
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(item.createdAt)}
          </span>
        </div>
        <p className="font-medium truncate">{item.title}</p>
        {item.subtitle && (
          <p className="text-sm text-muted-foreground truncate">
            {item.subtitle}
          </p>
        )}
      </div>
      {item.imageUrl && (
        <div className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.imageUrl}
            alt=""
            width={80}
            height={60}
            className="rounded object-cover"
          />
        </div>
      )}
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatDate(item.createdAt)}
        </span>
        <Button asChild size="sm">
          <Link href={item.href}>Review</Link>
        </Button>
      </div>
    </div>
  );
}
