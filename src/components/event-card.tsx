import Link from "next/link";
import type { Event, Venue, Tag, Feature } from "@prisma/client";
import { formatDate, formatDateRange } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

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
  const dateLabel = formatDate(event.startDate);
  const timeRange = formatDateRange(event.startDate, event.endDate);

  return (
    <Link href={`/events/${event.slug}`} className="group block">
      <Card className="h-full transition-all hover:shadow-lg hover:border-primary/30">
        <CardContent className="flex gap-4 p-4">
          <div className="flex shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10 px-3 py-2 text-center ring-1 ring-primary/10">
            <span className="text-xs font-medium text-primary">
              {new Intl.DateTimeFormat("en-US", { month: "short" }).format(new Date(event.startDate))}
            </span>
            <span className="text-xl font-bold text-primary">
              {new Intl.DateTimeFormat("en-US", { day: "numeric" }).format(new Date(event.startDate))}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold group-hover:text-primary">
              {event.title}
            </h3>

            <p className="mt-0.5 text-sm text-muted-foreground">{timeRange}</p>

            <p className="mt-1 truncate text-sm text-muted-foreground">
              {event.venue.name}
              {event.venue.neighborhood && (
                <> · {event.venue.neighborhood}</>
              )}
            </p>

            {event._count && event._count.vendorEvents > 0 && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {event._count.vendorEvents} vendor{event._count.vendorEvents !== 1 ? "s" : ""} participating
              </p>
            )}

            <div className="mt-2 flex flex-wrap gap-1.5">
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
