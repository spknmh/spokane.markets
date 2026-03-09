import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";
import Image from "next/image";
import { db } from "@/lib/db";
import { getBannerImages } from "@/lib/banner-images";
import { isBannerUnoptimized } from "@/lib/utils";
import { EventsMap } from "@/components/events-map";

export const metadata: Metadata = {
  title: `Events Map — ${SITE_NAME}`,
  description: "Find markets and events near you on the map.",
};

interface MapPageProps {
  searchParams: Promise<{ dateRange?: string }>;
}

function getDateRange(filter: string): { gte: Date; lt: Date } {
  const now = new Date();
  switch (filter) {
    case "today": {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      return { gte: start, lt: end };
    }
    case "weekend": {
      const day = now.getDay();
      const start = new Date(now);
      if (day === 0) start.setHours(0, 0, 0, 0);
      else if (day === 6) start.setHours(0, 0, 0, 0);
      else {
        start.setDate(now.getDate() + (6 - day));
        start.setHours(0, 0, 0, 0);
      }
      const end = new Date(start);
      end.setDate(start.getDate() + (start.getDay() === 6 ? 2 : 1));
      end.setHours(23, 59, 59, 999);
      return { gte: start, lt: end };
    }
    case "week": {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      return { gte: start, lt: end };
    }
    case "month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return { gte: start, lt: end };
    }
    default: {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return { gte: start, lt: new Date("2100-01-01") };
    }
  }
}

export default async function EventsMapPage({ searchParams }: MapPageProps) {
  const params = await searchParams;
  const dateRange = params.dateRange ?? "all";
  const { gte, lt } = getDateRange(dateRange);

  const where: Prisma.EventWhereInput = {
    status: "PUBLISHED",
    startDate: { lte: lt },
    endDate: { gte: gte },
  };

  const allEvents = await db.event.findMany({
    where,
    include: { venue: true },
    orderBy: { startDate: "asc" },
    take: 100,
  });

  const events = allEvents.filter(
    (e) => e.venue.lat !== 0 || e.venue.lng !== 0
  );

  const banners = await getBannerImages();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="relative -mx-4 mb-10 overflow-hidden rounded-xl sm:-mx-6 lg:-mx-8">
        <Image
          src={banners.marketCrowd}
          alt="Markets and events map"
          width={1200}
          height={400}
          className="h-52 w-full object-cover sm:h-64"
          unoptimized={isBannerUnoptimized(banners.marketCrowd)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6">
          <div className="inline-block max-w-2xl rounded-lg bg-black/50 px-4 py-3 backdrop-blur-sm sm:px-5 sm:py-4">
            <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-sm sm:text-4xl">
              Events Map
            </h1>
            <p className="mt-1 text-base text-white/95 sm:text-lg">
              Find events near you
            </p>
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link
          href="/events"
          className="min-h-[44px] inline-flex items-center rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
        >
          List View
        </Link>
        <Link
          href="/events/calendar"
          className="min-h-[44px] inline-flex items-center rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
        >
          Calendar View
        </Link>
      </div>

      <div className="min-h-[400px] w-full rounded-lg border border-border overflow-hidden">
        <EventsMap events={events} />
      </div>

      {events.length === 0 && (
        <p className="mt-4 text-center text-muted-foreground">
          No events with location data for this period. Try a different date range or{" "}
          <Link href="/events" className="text-primary hover:underline">
            browse the list
          </Link>
          .
        </p>
      )}
    </div>
  );
}
