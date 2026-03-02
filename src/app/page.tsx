import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { EventCard } from "@/components/event-card";
import { Input } from "@/components/ui/input";
import { COMMUNITY_IMAGES } from "@/lib/community-images";

function getUpcomingWeekendRange(): { start: Date; end: Date } {
  const now = new Date();
  const day = now.getDay();

  const start = new Date(now);
  if (day === 0) {
    start.setDate(now.getDate());
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

  return { start, end };
}

export default async function HomePage() {
  const { start, end } = getUpcomingWeekendRange();

  const weekendEvents = await db.event.findMany({
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
  });

  return (
    <>
      {/* Hero with community imagery */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={COMMUNITY_IMAGES.hero}
            alt="Local farmers market"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-background" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 py-20 md:py-28 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white drop-shadow-md md:text-5xl lg:text-6xl">
            Discover Spokane Markets
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/90 drop-shadow-sm">
            Your community hub for finding markets, craft fairs, and local events
            across the Spokane area. Never miss a weekend market again.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" asChild className="shadow-lg">
              <Link href="/events">Browse Events</Link>
            </Button>
            <Button size="lg" variant="secondary" asChild className="bg-white/90 text-foreground hover:bg-white shadow-lg">
              <Link href="/submit">Submit an Event</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* This Weekend */}
      <section className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">This Weekend</h2>
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
