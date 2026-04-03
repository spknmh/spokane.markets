import Link from "next/link";
import type { Event, Venue, Tag, Feature } from "@prisma/client";
import type { PromotionType } from "@prisma/client";
import { isMultiDayEvent, formatTime12hr } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Megaphone, Handshake, Star, UserCheck, Heart, Store } from "lucide-react";
import { cn } from "@/lib/utils";

type ScheduleDay = { date: Date; startTime: string; endTime: string; allDay: boolean };

type EventWithRelations = Event & {
  venue: Venue;
  tags: Tag[];
  features: Feature[];
  _count?: { vendorEvents: number };
  scheduleDays?: ScheduleDay[];
  attendance?: { going: number; interested: number };
};

function hasFeaturedCardStats(event: EventWithRelations): boolean {
  const v = event._count?.vendorEvents ?? 0;
  const g = event.attendance?.going ?? 0;
  const i = event.attendance?.interested ?? 0;
  return v > 0 || g > 0 || i > 0;
}

const PROMOTION_CONFIG: Record<
  PromotionType,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  SPONSORED: { label: "Sponsored", icon: Megaphone },
  PARTNERSHIP: { label: "Partner Spotlight", icon: Handshake },
  FEATURED: { label: "Featured", icon: Star },
};

interface FeaturedEventCardProps {
  event: EventWithRelations;
  promotionType: PromotionType;
  sponsorName?: string | null;
}

const monthFormatUTC = new Intl.DateTimeFormat("en-US", {
  month: "short",
  timeZone: "UTC",
});
const dayFormatUTC = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  timeZone: "UTC",
});
const shortDateFormatUTC = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});
const fullDateFormatUTC = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});
const timeFormatPST = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: "America/Los_Angeles",
});

export function FeaturedEventCard({
  event,
  promotionType,
  sponsorName,
}: FeaturedEventCardProps) {
  const config = PROMOTION_CONFIG[promotionType];
  const Icon = config.icon;
  const scheduleDays = event.scheduleDays;
  const start = scheduleDays?.length
    ? new Date(scheduleDays[0].date)
    : new Date(event.startDate);
  const end = scheduleDays?.length
    ? new Date(scheduleDays[scheduleDays.length - 1].date)
    : new Date(event.endDate);
  const multiDay = scheduleDays?.length
    ? scheduleDays.length > 1
    : isMultiDayEvent(new Date(event.startDate), new Date(event.endDate));
  const dateLine = multiDay
    ? `${fullDateFormatUTC.format(start)} - ${fullDateFormatUTC.format(end)}`
    : fullDateFormatUTC.format(start);
  let timeLine = `${timeFormatPST.format(new Date(event.startDate))} - ${timeFormatPST.format(
    new Date(event.endDate)
  )}`;
  if (scheduleDays?.length) {
    const first = scheduleDays[0];
    const allSameTime = scheduleDays.every(
      (d) =>
        d.startTime === first.startTime &&
        d.endTime === first.endTime &&
        d.allDay === first.allDay
    );
    if (allSameTime && first.allDay) {
      timeLine = "All day";
    } else if (allSameTime && !first.allDay) {
      timeLine = `${formatTime12hr(first.startTime)} - ${formatTime12hr(first.endTime)}`;
    } else {
      timeLine = "Various times";
    }
  }

  return (
    <Link href={`/events/${event.slug}`} prefetch={false} className="group block">
      <Card className="relative h-full min-h-[140px] border-2 border-accent/40 bg-accent/5 transition-all hover:shadow-lg hover:border-accent/60 hover:bg-accent/10">
        <Badge
          variant="secondary"
          className="absolute right-3 top-3 flex items-center gap-1.5 text-[11px]"
        >
          <Icon className="h-3 w-3" />
          {config.label}
          {sponsorName && (
            <span className="text-muted-foreground">· {sponsorName}</span>
          )}
        </Badge>
        <CardContent className="flex gap-4 p-5">
          <div className="flex shrink-0 flex-col items-center justify-center self-start rounded-lg bg-primary px-3 py-2 text-center">
            <span className="text-xs font-bold uppercase tracking-wide text-primary-foreground">
              {monthFormatUTC.format(start)}
            </span>
            <span className="text-2xl font-bold text-primary-foreground">
              {dayFormatUTC.format(start)}
            </span>
            {multiDay && (
              <>
                <span className="mt-1 text-[10px] font-medium uppercase tracking-wide text-primary-foreground/90">
                  thru
                </span>
                <span className="text-xs font-bold text-primary-foreground">
                  {shortDateFormatUTC.format(end)}
                </span>
              </>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-2 pt-8">
            <h3 className="font-sans line-clamp-4 text-lg font-bold leading-tight text-foreground group-hover:text-primary">
              {event.title}
            </h3>
            <p className="text-sm font-semibold leading-snug text-foreground">
              <span>{dateLine}</span>
              <br />
              <span>{timeLine}</span>
            </p>

            <p className="text-sm font-medium text-foreground">
              {event.venue.name}
            </p>

            {hasFeaturedCardStats(event) && (
              <div
                className={cn(
                  "flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm tabular-nums",
                  "text-muted-foreground"
                )}
              >
                {(event.attendance?.going ?? 0) > 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    <UserCheck className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
                    <span className="text-foreground">{event.attendance?.going} going</span>
                  </span>
                )}
                {(event.attendance?.interested ?? 0) > 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    <Heart className="h-4 w-4 shrink-0 text-rose-500 dark:text-rose-400" aria-hidden />
                    <span className="text-foreground">{event.attendance?.interested} interested</span>
                  </span>
                )}
                {(event._count?.vendorEvents ?? 0) > 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    <Store className="h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400" aria-hidden />
                    <span className="text-foreground">
                      {event._count?.vendorEvents} vendor{event._count?.vendorEvents !== 1 ? "s" : ""}
                    </span>
                  </span>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {event.tags.slice(0, 3).map((tag) => (
                <Badge key={tag.id} variant="secondary" className="text-[11px]">
                  {tag.name}
                </Badge>
              ))}
              {event.features.slice(0, 3).map((feature) => (
                <Badge key={feature.id} variant="outline" className="text-[11px]">
                  {feature.icon && <span className="mr-1">{feature.icon}</span>}
                  {feature.name}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
