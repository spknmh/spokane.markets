import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";
import Image from "next/image";
import { db } from "@/lib/db";
import { getBannerImages } from "@/lib/banner-images";
import { isBannerUnoptimized } from "@/lib/utils";
import { EventTimeLabel } from "@/components/event-time-label";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarMetadataProps {
  searchParams: Promise<{ year?: string; month?: string }>;
}

export async function generateMetadata({ searchParams }: CalendarMetadataProps): Promise<Metadata> {
  const params = await searchParams;
  const now = new Date();
  const year = parseInt(params.year ?? String(now.getFullYear()), 10) || now.getFullYear();
  const month = Math.max(0, Math.min(11, parseInt(params.month ?? String(now.getMonth()), 10) || now.getMonth()));
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);
  const isPastMonth = monthEnd < now;

  return {
    title: `Events Calendar — ${SITE_NAME}`,
    description: "Browse upcoming markets and events by date.",
    ...(isPastMonth && { robots: { index: false, follow: true } }),
  };
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getMonthBounds(year: number, month: number) {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59);
  return { start, end };
}

interface CalendarPageProps {
  searchParams: Promise<{ year?: string; month?: string }>;
}

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const params = await searchParams;
  const now = new Date();
  const year = parseInt(params.year ?? String(now.getFullYear()), 10) || now.getFullYear();
  const month = Math.max(0, Math.min(11, parseInt(params.month ?? String(now.getMonth()), 10) || now.getMonth()));

  const { start: monthStart, end: monthEnd } = getMonthBounds(year, month);

  const where: Prisma.EventWhereInput = {
    status: "PUBLISHED",
    startDate: { gte: monthStart, lte: monthEnd },
  };

  const events = await db.event.findMany({
    where,
    include: { venue: true, tags: true, features: true },
    orderBy: { startDate: "asc" },
  });

  const eventsByDay = new Map<number, typeof events>();
  for (const event of events) {
    const d = new Date(event.startDate).getDate();
    if (!eventsByDay.has(d)) eventsByDay.set(d, []);
    eventsByDay.get(d)!.push(event);
  }

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;

  const monthName = new Date(year, month).toLocaleString("en-US", { month: "long", year: "numeric" });

  const banners = await getBannerImages();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="relative -mx-4 mb-10 overflow-hidden rounded-xl sm:-mx-6 lg:-mx-8">
        <Image
          src={banners.marketCrowd}
          alt="Markets and events calendar"
          width={1200}
          height={400}
          className="h-52 w-full object-cover sm:h-64"
          unoptimized={isBannerUnoptimized(banners.marketCrowd)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6">
          <div className="inline-block max-w-2xl rounded-lg bg-black/50 px-4 py-3 backdrop-blur-sm sm:px-5 sm:py-4">
            <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-sm sm:text-4xl">
              Events Calendar
            </h1>
            <p className="mt-1 text-base text-white/95 sm:text-lg">
              Browse events by date
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Link
            href={`/events/calendar?year=${prevYear}&month=${prevMonth}`}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-border transition-colors hover:bg-muted"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h2 className="text-xl font-semibold">{monthName}</h2>
          <Link
            href={`/events/calendar?year=${nextYear}&month=${nextMonth}`}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-border transition-colors hover:bg-muted"
          >
            <ChevronRight className="h-5 w-5" />
          </Link>
        </div>
        <Link
          href="/events"
          className="min-h-[44px] rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
        >
          List View
        </Link>
      </div>

      {/* Mobile: list view */}
      <div className="sm:hidden space-y-4">
        {events.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">No events this month</p>
        ) : (
          events.map((event) => (
            <Link
              key={event.id}
              href={`/events/${event.slug}`}
              className="block rounded-lg border border-border p-4 transition-colors hover:bg-muted"
            >
              <span className="font-medium">{event.title}</span>
              <span className="ml-2 text-sm text-muted-foreground">
                <EventTimeLabel
                  startDate={event.startDate}
                  endDate={event.endDate}
                  timezone={event.timezone}
                />
              </span>
              <p className="mt-1 text-sm text-muted-foreground">{event.venue.name}</p>
            </Link>
          ))
        )}
      </div>

      {/* Desktop: month grid */}
      <div className="hidden sm:block overflow-x-auto">
        <div className="min-w-[600px] rounded-lg border border-border">
          <div className="grid grid-cols-7 border-b border-border">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="min-h-[36px] border-r border-border px-2 py-2 text-center text-sm font-medium last:border-r-0"
              >
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: firstDay }, (_, i) => (
              <div key={`empty-${i}`} className="min-h-[100px] border-b border-r border-border bg-muted/30 last:border-r-0" />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const dayEvents = eventsByDay.get(day) ?? [];
              const isToday =
                now.getFullYear() === year &&
                now.getMonth() === month &&
                now.getDate() === day;
              return (
                <div
                  key={day}
                  className={`min-h-[100px] border-b border-r border-border p-1 last:border-r-0 ${
                    isToday ? "bg-primary/5" : ""
                  }`}
                >
                  <span className={`text-sm font-medium ${isToday ? "text-primary" : ""}`}>
                    {day}
                  </span>
                  <div className="mt-1 space-y-1">
                    {dayEvents.slice(0, 3).map((event) => (
                      <Link
                        key={event.id}
                        href={`/events/${event.slug}`}
                        className="block truncate rounded px-1 py-0.5 text-xs font-medium text-primary hover:bg-primary/10"
                        title={event.title}
                      >
                        {event.title}
                      </Link>
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="block px-1 text-xs text-muted-foreground">
                        +{dayEvents.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
