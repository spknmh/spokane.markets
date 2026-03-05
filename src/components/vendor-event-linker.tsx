"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateRange } from "@/lib/utils";
import type { ParticipationMode } from "@/lib/participation-config";

interface EventSummary {
  id: string;
  title: string;
  slug: string;
  startDate: string;
  endDate: string;
  venue: { name: string; neighborhood: string | null };
  mode: ParticipationMode;
}

interface VendorEventLinkerProps {
  events: EventSummary[];
  linkedEventIds: string[];
}

export function VendorEventLinker({
  events,
  linkedEventIds,
}: VendorEventLinkerProps) {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [pending, setPending] = React.useState<Set<string>>(new Set());
  const [linked, setLinked] = React.useState<Set<string>>(
    new Set(linkedEventIds),
  );
  const [error, setError] = React.useState<string | null>(null);

  const filtered = events.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase()),
  );

  async function toggleLink(event: EventSummary) {
    const eventId = event.id;
    setError(null);
    setPending((prev) => new Set(prev).add(eventId));

    const isLinked = linked.has(eventId);
    let res: Response;

    if (isLinked) {
      res = await fetch(`/api/events/${eventId}/intent`, { method: "DELETE" });
      if (res.ok) {
        setLinked((prev) => {
          const next = new Set(prev);
          next.delete(eventId);
          return next;
        });
        router.refresh();
      }
    } else {
      if (event.mode === "OPEN") {
        res = await fetch(`/api/events/${eventId}/intent`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "ATTENDING", visibility: "PUBLIC" }),
        });
      } else {
        res = await fetch(`/api/events/${eventId}/request-roster`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
      }
      if (res.ok) {
        setLinked((prev) => new Set(prev).add(eventId));
        router.refresh();
      }
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong");
    }

    setPending((prev) => {
      const next = new Set(prev);
      next.delete(eventId);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search events..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {error && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          No upcoming events found.
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((event) => {
            const isLinked = linked.has(event.id);
            const isPending = pending.has(event.id);
            const isInviteOnly = event.mode === "INVITE_ONLY";
            const isRequestMode =
              event.mode === "REQUEST_TO_JOIN" ||
              event.mode === "CAPACITY_LIMITED";

            const badgeLabel = isInviteOnly
              ? null
              : isLinked
                ? isRequestMode
                  ? "Request sent"
                  : "Attending"
                : null;

            const buttonLabel = isInviteOnly
              ? "Invite only"
              : isPending
                ? "..."
                : isLinked
                  ? "Withdraw"
                  : isRequestMode
                    ? "Request to join"
                    : "Mark attending";

            return (
              <Card key={event.id}>
                <CardContent className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{event.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateRange(
                        new Date(event.startDate),
                        new Date(event.endDate),
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {event.venue.name}
                      {event.venue.neighborhood && (
                        <> &middot; {event.venue.neighborhood}</>
                      )}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {badgeLabel && (
                      <Badge variant="secondary">{badgeLabel}</Badge>
                    )}
                    <Button
                      size="sm"
                      variant={isLinked ? "outline" : "default"}
                      disabled={isPending || isInviteOnly}
                      onClick={() => !isInviteOnly && toggleLink(event)}
                      title={
                        isInviteOnly
                          ? "Organizers add vendors to this event"
                          : undefined
                      }
                    >
                      {buttonLabel}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
