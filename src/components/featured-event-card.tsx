import Link from "next/link";
import type { Event, Venue, Tag, Feature } from "@prisma/client";
import type { PromotionType } from "@prisma/client";
import { isMultiDayEvent, formatEventTimeFromSchedule } from "@/lib/utils";
import { EventTimeLabel } from "@/components/event-time-label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Megaphone, Handshake, Star } from "lucide-react";

type ScheduleDay = { date: Date; startTime: string; endTime: string; allDay: boolean };

type EventWithRelations = Event & {
  venue: Venue;
  tags: Tag[];
  features: Feature[];
  _count?: { vendorEvents: number };
  scheduleDays?: ScheduleDay[];
};

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
  const timeDisplay = scheduleDays?.length ? (
    formatEventTimeFromSchedule(scheduleDays, event.timezone)
  ) : (
    <EventTimeLabel
      startDate={event.startDate}
      endDate={event.endDate}
      timezone={event.timezone}
    />
  );

  return (
    <Link href={`/events/${event.slug}`} className="group block">
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

            <p className="text-sm font-semibold text-foreground">{timeDisplay}</p>

            <p className="text-sm font-medium text-foreground">
              {event.venue.name}
            </p>

            {event._count && event._count.vendorEvents > 0 && (
              <p className="text-sm font-medium text-foreground">
                {event._count.vendorEvents} vendor
                {event._count.vendorEvents !== 1 ? "s" : ""} participating
              </p>
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
