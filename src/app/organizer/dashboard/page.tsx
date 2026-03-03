import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateRange } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Organizer Dashboard — Spokane Markets",
};

export default async function OrganizerDashboardPage() {
  const session = await requireRole("ORGANIZER");
  const userId = session.user.id;

  const [markets, events] = await Promise.all([
    db.market.findMany({
      where: { ownerId: userId },
      include: { venue: { select: { name: true } } },
      orderBy: { name: "asc" },
    }),
    db.event.findMany({
      where: { submittedById: userId },
      include: { venue: true, tags: true, features: true },
      orderBy: { startDate: "desc" },
    }),
  ]);

  const hasVerifiedMarket = markets.some(
    (m) => m.verificationStatus === "VERIFIED"
  );

  const statusColor: Record<string, string> = {
    DRAFT: "secondary",
    PENDING: "outline",
    PUBLISHED: "default",
    CANCELLED: "destructive",
  };

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

      {hasVerifiedMarket && (
        <div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm text-primary">
          You own a verified market — your submitted events will be
          auto-published.
        </div>
      )}

      {/* Markets */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Your Markets</h2>
        {markets.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            You don&apos;t own any markets yet. Claim a market from its detail
            page to get started.
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
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Your Events</h2>
        {events.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            You haven&apos;t submitted any events yet.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {events.map((event) => (
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
                            | "destructive") ?? "outline"
                        }
                      >
                        {event.status}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {formatDateRange(event.startDate, event.endDate)} ·{" "}
                      {event.venue.name}
                    </p>
                  </div>
                  <Link href={`/organizer/events/${event.id}/edit`}>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
