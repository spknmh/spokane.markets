import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { getBannerImages } from "@/lib/banner-images";
import { isBannerUnoptimized } from "@/lib/utils";
import { getSession } from "@/lib/auth-utils";
import { EventCard } from "@/components/event-card";
import { EventFilters } from "@/components/event-filters";
import { SaveFilterDialog } from "@/components/save-filter-dialog";
import { Pagination } from "@/components/pagination";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Events — Spokane Markets",
  description:
    "Browse upcoming markets, craft fairs, and community events in the Spokane area. Filter by date, neighborhood, and category.",
};

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
      if (day === 0) {
        start.setHours(0, 0, 0, 0);
      } else if (day === 6) {
        start.setHours(0, 0, 0, 0);
      } else {
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
    case "all":
    default: {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      const end = new Date("2100-01-01");
      return { gte: start, lt: end };
    }
  }
}

const DEFAULT_LIMIT = 24;

interface EventsPageProps {
  searchParams: Promise<{
    dateRange?: string;
    neighborhood?: string;
    category?: string;
    feature?: string;
    q?: string;
    page?: string;
    limit?: string;
  }>;
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const params = await searchParams;
  const banners = await getBannerImages();
  const dateRange = params.dateRange ?? "all";
  const neighborhood = params.neighborhood ?? "";
  const category = params.category ?? "";
  const feature = params.feature ?? "";
  const query = params.q ?? "";
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(params.limit ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT));

  const session = await getSession();
  const [savedFilters, tags, features] = await Promise.all([
    session?.user
      ? db.savedFilter.findMany({
          where: { userId: session.user.id },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
    db.tag.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, slug: true } }),
    db.feature.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, slug: true, icon: true } }),
  ]);

  const { gte, lt } = getDateRange(dateRange);

  const where: Prisma.EventWhereInput = {
    status: "PUBLISHED",
    startDate: { gte, lt },
  };

  if (neighborhood) {
    where.venue = { neighborhood };
  }

  if (category) {
    where.tags = { some: { slug: category } };
  }

  if (feature) {
    where.features = { some: { slug: feature } };
  }

  if (query) {
    where.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
    ];
  }

  const [events, totalCount] = await Promise.all([
    db.event.findMany({
      where,
      include: {
        venue: true,
        tags: true,
        features: true,
        _count: { select: { vendorEvents: true } },
      },
      orderBy: { startDate: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.event.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="relative -mx-4 mb-10 overflow-hidden rounded-xl sm:-mx-6 lg:-mx-8">
        <Image
          src={banners.marketCrowd}
          alt=""
          width={1200}
          height={400}
          className="h-52 w-full object-cover sm:h-64"
          unoptimized={isBannerUnoptimized(banners.marketCrowd)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6">
          <div className="inline-block max-w-2xl rounded-lg bg-black/50 px-4 py-3 backdrop-blur-sm sm:px-5 sm:py-4">
            <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-sm sm:text-4xl">
              Events
            </h1>
            <p className="mt-1 text-base text-white/95 sm:text-lg">
              Find markets, fairs, and community events across Spokane.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Sidebar filters */}
        <aside className="shrink-0 lg:w-64">
          <div className="rounded-lg border border-border bg-muted/30 p-4 lg:sticky lg:top-24">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Filters
            </h2>
            <EventFilters tags={tags} features={features} />
          </div>
        </aside>

        {/* Main content */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/events/calendar"
              className="min-h-[44px] inline-flex items-center rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              Calendar View
            </Link>
            <Link
              href="/events/map"
              className="min-h-[44px] inline-flex items-center rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              Map View
            </Link>
            <SaveFilterDialog
              session={session}
              currentFilters={{ dateRange, neighborhood, category, feature }}
              callbackUrl={(() => {
                const p = new URLSearchParams();
                if (dateRange && dateRange !== "all") p.set("dateRange", dateRange);
                if (neighborhood) p.set("neighborhood", neighborhood);
                if (category) p.set("category", category);
                if (feature) p.set("feature", feature);
                if (query) p.set("q", query);
                if (page > 1) p.set("page", String(page));
                const qs = p.toString();
                return qs ? `/events?${qs}` : "/events";
              })()}
            />
            {savedFilters.length > 0 && (
              <>
                <span className="text-sm text-muted-foreground">Saved:</span>
                {savedFilters.map((filter) => {
                  const filterParams = new URLSearchParams();
                  if (filter.dateRange) filterParams.set("dateRange", filter.dateRange);
                  if (filter.neighborhoods[0]) filterParams.set("neighborhood", filter.neighborhoods[0]);
                  if (filter.categories[0]) filterParams.set("category", filter.categories[0]);
                  if (filter.features[0]) filterParams.set("feature", filter.features[0]);
                  return (
                    <Link key={filter.id} href={`/events?${filterParams.toString()}`}>
                      <Badge variant="secondary" className="cursor-pointer transition-colors hover:bg-primary hover:text-primary-foreground">
                        {filter.name}
                        {filter.emailAlerts && <span className="ml-1" title="Email alerts on">*</span>}
                      </Badge>
                    </Link>
                  );
                })}
              </>
            )}
          </div>

          <div className="mt-8">
            <p className="mb-4 text-sm text-muted-foreground">
              {totalCount} {totalCount === 1 ? "event" : "events"} found
            </p>

            {events.length > 0 ? (
              <>
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-2">
                  {events.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  totalItems={totalCount}
                  limit={limit}
                />
              </>
            ) : (
              <div className="rounded-lg border border-dashed border-border py-16 text-center">
                <p className="text-lg font-medium">No events found</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try adjusting your filters or check back later.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
