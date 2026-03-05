import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth-utils";
import { SITE_NAME } from "@/lib/constants";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { DashboardHeaderCard } from "@/components/dashboard-header-card";
import { evaluateAndGrantBadges } from "@/lib/badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, formatDateRange } from "@/lib/utils";

export const metadata: Metadata = {
  title: `Organizer Dashboard — ${SITE_NAME}`,
};

export default async function OrganizerDashboardPage() {
  const session = await requireRole("ORGANIZER");
  const userId = session.user.id;

  await evaluateAndGrantBadges(userId);

  const [markets, events, pendingByEvent] = await Promise.all([
    db.market.findMany({
      where: { ownerId: userId },
      include: {
        venue: { select: { name: true } },
        _count: { select: { events: true } },
        events: {
          where: { startDate: { gte: new Date() }, status: "PUBLISHED" },
          orderBy: { startDate: "asc" },
          take: 1,
          select: { id: true, title: true, startDate: true, slug: true },
        },
      },
      orderBy: { name: "asc" },
    }),
    db.event.findMany({
      where: {
        OR: [
          { submittedById: userId },
          { market: { ownerId: userId } },
        ],
      },
      include: {
        venue: true,
        tags: true,
        features: true,
        market: { select: { id: true, name: true, ownerId: true } },
      },
      orderBy: { startDate: "asc" },
    }),
    db.eventVendorIntent.groupBy({
      by: ["eventId"],
      where: {
        event: {
          OR: [
            { submittedById: userId },
            { market: { ownerId: userId } },
          ],
        },
        status: { in: ["REQUESTED", "APPLIED"] },
      },
      _count: true,
    }),
  ]);

  const pendingCountByEventId = Object.fromEntries(
    pendingByEvent.map((p) => [p.eventId, p._count] as const)
  ) as Record<string, number>;
  const totalPendingRequests = pendingByEvent.reduce((s, p) => s + p._count, 0);

  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      userBadges: { include: { badge: true }, orderBy: { badge: { sortOrder: "asc" } } },
    },
  });

  const hasVerifiedMarket = markets.some(
    (m) => m.verificationStatus === "VERIFIED"
  );

  const organizerSince =
    events.length > 0
      ? new Date(Math.min(...events.map((e) => e.createdAt.getTime())))
      : markets.length > 0
        ? new Date(Math.min(...markets.map((m) => m.createdAt.getTime())))
        : undefined;

  const statusColor: Record<string, string> = {
    DRAFT: "info",
    PENDING: "warning",
    PUBLISHED: "success",
    REJECTED: "destructive",
    CANCELLED: "destructive",
  };

  const statusLabel: Record<string, string> = {
    DRAFT: "Draft",
    PENDING: "Pending Review",
    PUBLISHED: "Published",
    REJECTED: "Rejected",
    CANCELLED: "Cancelled",
  };

  const eventCounts = {
    published: events.filter((e) => e.status === "PUBLISHED").length,
    pending: events.filter((e) => e.status === "PENDING").length,
    draft: events.filter((e) => e.status === "DRAFT").length,
    rejected: events.filter((e) => e.status === "REJECTED").length,
  };

  const now = new Date();
  const upcomingEvents = events.filter((e) => e.startDate >= now);
  const pastEvents = events.filter((e) => e.startDate < now);

  const getPendingForEvent = (eventId: string) =>
    pendingCountByEventId[eventId] ?? 0;

  if (!user) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organizer Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your markets and events.
          </p>
        </div>
        <Link href="/organizer/events/new">
          <Button>Submit New Event</Button>
        </Link>
      </div>

      <DashboardHeaderCard
        user={{
          name: user.name,
          email: user.email,
          image: user.image,
          createdAt: user.createdAt,
          role: user.role,
        }}
        organizerSince={organizerSince}
        badges={(user.userBadges ?? []).map((ub) => ({
          slug: ub.badge.slug,
          name: ub.badge.name,
          icon: ub.badge.icon,
        }))}
      />

      {hasVerifiedMarket && (
        <div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm text-primary">
          You own a verified market — your submitted events will be
          auto-published.
        </div>
      )}

      {totalPendingRequests > 0 && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200">
          <span className="font-medium">
            {totalPendingRequests} vendor request{totalPendingRequests !== 1 ? "s" : ""} pending review
          </span>
          <Link
            href="#events"
            className="text-amber-700 dark:text-amber-300 underline hover:no-underline"
          >
            Review in Your Events
          </Link>
        </div>
      )}

      {/* Event stats */}
      {events.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <span className="rounded-full bg-emerald-500/10 px-3 py-1 font-medium text-emerald-700 dark:text-emerald-400">
            {eventCounts.published} published
          </span>
          {eventCounts.pending > 0 && (
            <span className="rounded-full bg-amber-500/10 px-3 py-1 font-medium text-amber-700 dark:text-amber-400">
              {eventCounts.pending} pending review
            </span>
          )}
          {eventCounts.draft > 0 && (
            <span className="rounded-full bg-blue-500/10 px-3 py-1 font-medium text-blue-700 dark:text-blue-400">
              {eventCounts.draft} draft
            </span>
          )}
          {eventCounts.rejected > 0 && (
            <span className="rounded-full bg-destructive/10 px-3 py-1 font-medium text-destructive">
              {eventCounts.rejected} rejected
            </span>
          )}
        </div>
      )}

      {/* Browse to claim CTA */}
      {markets.length === 0 && (
        <Card className="mt-6 border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-8 text-center sm:flex-row">
            <p className="text-muted-foreground">
              Don&apos;t own a market? Browse markets to claim one.
            </p>
            <Button asChild variant="outline">
              <Link href="/markets">Browse Markets</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Markets */}
      <section id="markets" className="mt-10 scroll-mt-8">
        <h2 className="text-xl font-semibold">Your Markets</h2>
        {markets.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            You don&apos;t own any markets yet.{" "}
            <Link href="/markets" className="text-primary hover:underline">
              Browse markets
            </Link>{" "}
            and claim one from its detail page to get started.
          </p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {markets.map((market) => (
              <Card key={market.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/markets/${market.slug}`}
                      className="font-semibold hover:text-primary"
                    >
                      {market.name}
                    </Link>
                    <Badge
                      variant={
                        market.verificationStatus === "VERIFIED"
                          ? "default"
                          : "outline"
                      }
                    >
                      {market.verificationStatus}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    At {market.venue.name}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span>{market._count.events} events</span>
                    {market.events[0] && (
                      <span>
                        Next:{" "}
                        <Link
                          href={`/events/${market.events[0].slug}`}
                          className="text-primary hover:underline"
                        >
                          {formatDate(market.events[0].startDate)}
                        </Link>
                      </span>
                    )}
                  </div>
                  {market.description && (
                    <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                      {market.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Events */}
      <section id="events" className="mt-10 scroll-mt-8">
        <h2 className="text-xl font-semibold">Your Events</h2>
        {events.length === 0 ? (
          <Card className="mt-4 border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center gap-3 py-10 text-center">
              <p className="text-muted-foreground">
                You haven&apos;t submitted any events yet.
              </p>
              <Button asChild>
                <Link href="/organizer/events/new">Submit Your First Event</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-4 space-y-8">
            {upcomingEvents.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                  Upcoming ({upcomingEvents.length})
                </h3>
                <div className="space-y-3">
                  {upcomingEvents.map((event) => {
                    const pending = getPendingForEvent(event.id);
                    return (
                      <Card key={event.id}>
                        <CardContent className="flex items-center justify-between gap-4 p-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/events/${event.slug}`}
                                className="truncate font-medium hover:text-primary"
                              >
                                {event.title}
                              </Link>
                              <Badge
                                variant={
                                  (statusColor[event.status] as
                                    | "default"
                                    | "secondary"
                                    | "outline"
                                    | "destructive"
                                    | "warning"
                                    | "success"
                                    | "info") ?? "outline"
                                }
                              >
                                {statusLabel[event.status] ?? event.status}
                              </Badge>
                            </div>
                            <p className="mt-0.5 text-sm text-muted-foreground">
                              {formatDateRange(event.startDate, event.endDate)} ·{" "}
                              {event.venue.name}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/organizer/events/${event.id}/roster`}>
                                Roster{pending > 0 ? ` (${pending})` : ""}
                              </Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/organizer/events/${event.id}/edit`}>
                                Edit
                              </Link>
                            </Button>
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/events/${event.slug}`}>
                                View
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
            {pastEvents.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                  Past ({pastEvents.length})
                </h3>
                <div className="space-y-3">
                  {pastEvents.map((event) => {
                    const pending = getPendingForEvent(event.id);
                    return (
                      <Card key={event.id} className="opacity-80">
                        <CardContent className="flex items-center justify-between gap-4 p-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/events/${event.slug}`}
                                className="truncate font-medium hover:text-primary"
                              >
                                {event.title}
                              </Link>
                              <Badge
                                variant={
                                  (statusColor[event.status] as
                                    | "default"
                                    | "secondary"
                                    | "outline"
                                    | "destructive"
                                    | "warning"
                                    | "success"
                                    | "info") ?? "outline"
                                }
                              >
                                {statusLabel[event.status] ?? event.status}
                              </Badge>
                            </div>
                            <p className="mt-0.5 text-sm text-muted-foreground">
                              {formatDateRange(event.startDate, event.endDate)} ·{" "}
                              {event.venue.name}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/organizer/events/${event.id}/roster`}>
                                Roster{pending > 0 ? ` (${pending})` : ""}
                              </Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/organizer/events/${event.id}/edit`}>
                                Edit
                              </Link>
                            </Button>
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/events/${event.slug}`}>
                                View
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
