"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateRange } from "@/lib/utils";

interface EventSummary {
  id: string;
  title: string;
  slug: string;
  startDate: string;
  endDate: string;
  venue: { name: string; neighborhood: string | null };
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

  async function toggleLink(eventId: string) {
    setError(null);
    setPending((prev) => new Set(prev).add(eventId));

    const isLinked = linked.has(eventId);
    const method = isLinked ? "DELETE" : "POST";

    const res = await fetch("/api/vendor/events", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Something went wrong");
    } else {
      setLinked((prev) => {
        const next = new Set(prev);
        if (isLinked) {
          next.delete(eventId);
        } else {
          next.add(eventId);
        }
        return next;
      });
      router.refresh();
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
                    {isLinked && (
                      <Badge variant="secondary">Linked</Badge>
                    )}
                    <Button
                      size="sm"
                      variant={isLinked ? "outline" : "default"}
                      disabled={isPending}
                      onClick={() => toggleLink(event.id)}
                    >
                      {isPending
                        ? "..."
                        : isLinked
                          ? "Unlink"
                          : "Link"}
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
