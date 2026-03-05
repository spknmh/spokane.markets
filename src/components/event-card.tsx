import Link from "next/link";
import type { Event, Venue, Tag, Feature } from "@prisma/client";
import { EventTimeLabel } from "@/components/event-time-label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { isMultiDayEvent, formatDateShort } from "@/lib/utils";

type EventWithRelations = Event & {
  venue: Venue;
  tags: Tag[];
  features: Feature[];
  _count?: { vendorEvents: number };
};

interface EventCardProps {
  event: EventWithRelations;
}

export function EventCard({ event }: EventCardProps) {
  const start = new Date(event.startDate);
  const end = new Date(event.endDate);
  const multiDay = isMultiDayEvent(start, end);

  return (
    <Link href={`/events/${event.slug}`} className="group block">
      <Card className="h-full min-h-[140px] border-2 transition-all hover:shadow-lg hover:border-primary/50">
        <CardContent className="flex gap-4 p-5">
          <div className="flex shrink-0 flex-col items-center justify-center self-start rounded-lg bg-primary px-3 py-2 text-center">
            <span className="text-xs font-bold uppercase tracking-wide text-primary-foreground">
              {new Intl.DateTimeFormat("en-US", { month: "short" }).format(start)}
            </span>
            <span className="text-2xl font-bold text-primary-foreground">
              {new Intl.DateTimeFormat("en-US", { day: "numeric" }).format(start)}
            </span>
            {multiDay && (
              <>
                <span className="mt-1 text-[10px] font-medium uppercase tracking-wide text-primary-foreground/90">
                  thru
                </span>
                <span className="text-xs font-bold text-primary-foreground">
                  {formatDateShort(end)}
                </span>
              </>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <h3 className="font-sans line-clamp-3 text-lg font-bold leading-tight text-foreground group-hover:text-primary">
              {event.title}
            </h3>

            <p className="text-sm font-semibold text-foreground">
              <EventTimeLabel
                startDate={event.startDate}
                endDate={event.endDate}
                timezone={event.timezone}
              />
            </p>

            <p className="line-clamp-2 text-sm font-medium text-foreground">
              {event.venue.name}
            </p>

            {event._count && event._count.vendorEvents > 0 && (
              <p className="text-sm font-medium text-foreground">
                {event._count.vendorEvents} vendor{event._count.vendorEvents !== 1 ? "s" : ""} participating
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
