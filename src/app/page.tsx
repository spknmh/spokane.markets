import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { EventCard } from "@/components/event-card";
import { FeaturedEventCard } from "@/components/featured-event-card";
import { Input } from "@/components/ui/input";
import { AuthGate } from "@/components/auth-gate";
import { getBannerImages } from "@/lib/banner-images";
import { isBannerUnoptimized } from "@/lib/utils";
import {
  getUpcomingWeekendRange,
  getPlanAheadRange,
} from "@/lib/date-ranges";
import { SITE_NAME } from "@/lib/constants";
import { HomeScrollDepth } from "@/components/home-scroll-depth";

export default async function HomePage() {
  const session = await auth();
  const banners = await getBannerImages();
  const { start, end } = getUpcomingWeekendRange();
  const planAheadRange = getPlanAheadRange();

  const [promotions, weekendEvents, planAheadEvents] = await Promise.all([
    db.promotion.findMany({
      where: {
        eventId: { not: null },
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
        event: { status: "PUBLISHED" },
      },
      include: {
        event: {
          include: {
            venue: true,
            tags: true,
            features: true,
            _count: { select: { vendorEvents: true } },
          },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { startDate: "asc" }],
      take: 5,
    }),
    db.event.findMany({
      where: {
        status: "PUBLISHED",
        startDate: { gte: start, lt: end },
      },
      include: {
        venue: true,
        tags: true,
        features: true,
        _count: { select: { vendorEvents: true } },
      },
      orderBy: { startDate: "asc" },
      take: 8,
    }),
    db.event.findMany({
      where: {
        status: "PUBLISHED",
        startDate: {
          gte: planAheadRange.start,
          lte: planAheadRange.end,
        },
      },
      include: {
        venue: true,
        tags: true,
        features: true,
        _count: { select: { vendorEvents: true } },
      },
      orderBy: { startDate: "asc" },
      take: 6,
    }),
  ]);

  return (
    <>
      <HomeScrollDepth />
      {/* Hero with community imagery */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={banners.hero}
            alt="Local farmers market"
            fill
            className="object-cover"
            priority
            sizes="100vw"
            unoptimized={isBannerUnoptimized(banners.hero)}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-background" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 py-20 md:py-28 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white drop-shadow-md md:text-5xl lg:text-6xl">
            Discover {SITE_NAME}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/90 drop-shadow-sm">
            Find markets, craft fairs, and local events across Spokane. Never
            miss a weekend market again.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" asChild className="shadow-lg">
              <Link href="/events">Browse Events</Link>
            </Button>
            <Button size="lg" variant="secondary" asChild className="bg-background/90 text-foreground hover:bg-background shadow-lg border border-border/50">
              <Link href="/markets">View Markets</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured / Sponsored */}
      {promotions.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight">
              Featured Events
            </h2>
            <p className="mt-1 text-muted-foreground">
              Sponsored and partner events worth planning for
            </p>
          </div>
          <div
            className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 snap-x snap-mandatory"
            style={{ scrollbarWidth: "thin" }}
          >
            {promotions.map(
              (p) =>
                p.event && (
                  <div
                    key={p.id}
                    className="w-[min(400px,90vw)] shrink-0 snap-start"
                  >
                    <FeaturedEventCard
                      event={{
                        ...p.event,
                        _count: p.event._count,
                      }}
                      promotionType={p.type}
                      sponsorName={p.sponsorName}
                    />
                  </div>
                )
            )}
          </div>
        </section>
      )}

      {/* This Weekend */}
      <section className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">This Weekend in Spokane</h2>
            <p className="mt-1 text-muted-foreground">
              Markets and events happening this Saturday &amp; Sunday
            </p>
          </div>
          <Link
            href="/events?dateRange=weekend"
            className="hidden text-sm font-medium text-primary transition-colors hover:underline sm:block"
          >
            View all →
          </Link>
        </div>

        {weekendEvents.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-2">
            {weekendEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border py-12 text-center">
            <p className="text-muted-foreground">
              No events scheduled for this weekend yet.
            </p>
            <Link
              href="/events?dateRange=all"
              className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
            >
              Browse all upcoming events →
            </Link>
          </div>
        )}

        <Link
          href="/events?dateRange=weekend"
          className="mt-4 block text-center text-sm font-medium text-primary hover:underline sm:hidden"
        >
          View all weekend events →
        </Link>
      </section>

      {/* Plan in Advance */}
      <section className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Plan in Advance
            </h2>
            <p className="mt-1 text-muted-foreground">
              Markets and events 2–4 weeks out
            </p>
          </div>
          <Link
            href="/events?dateRange=month"
            className="hidden text-sm font-medium text-primary transition-colors hover:underline sm:block"
          >
            View all →
          </Link>
        </div>

        {planAheadEvents.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-2">
            {planAheadEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border py-12 text-center">
            <p className="text-muted-foreground">
              No events scheduled 2–4 weeks out yet.
            </p>
            <Link
              href="/events?dateRange=all"
              className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
            >
              Browse all upcoming events →
            </Link>
          </div>
        )}

        <Link
          href="/events?dateRange=month"
          className="mt-4 block text-center text-sm font-medium text-primary hover:underline sm:hidden"
        >
          View all →
        </Link>
      </section>

      {/* Newsletter Signup */}
      <section className="border-t border-border bg-muted/50 py-12 md:py-16">
        <div className="mx-auto max-w-xl px-4 text-center">
          <h2 className="text-2xl font-bold tracking-tight">Stay in the Loop</h2>
          <p className="mt-2 text-muted-foreground">
            Get a weekly digest of upcoming markets and events delivered to your
            inbox every Thursday.
          </p>
          <form
            action="/api/subscribe"
            method="POST"
            className="mt-6 flex gap-2"
          >
            {/* Honeypot — hidden from users */}
            <input
              type="text"
              name="company"
              tabIndex={-1}
              autoComplete="off"
              className="absolute -left-[9999px]"
              aria-hidden
            />
            <Input
              type="email"
              name="email"
              placeholder="you@email.com"
              required
              className="flex-1"
            />
            <Button type="submit">Subscribe</Button>
          </form>
          <p className="mt-3 text-xs text-muted-foreground">
            No spam, ever. Unsubscribe anytime.
          </p>
        </div>
      </section>
    </>
  );
}
