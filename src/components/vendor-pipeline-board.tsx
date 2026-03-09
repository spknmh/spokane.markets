"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDateRange } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface IntentEvent {
  id: string;
  title: string;
  slug: string;
  startDate: Date;
  endDate: Date;
  venue: { name: string };
  market?: { name: string; slug: string } | null;
}

interface Intent {
  id: string;
  status: string;
  visibility: string;
  event: IntentEvent;
}

interface VendorPipelineBoardProps {
  intents: Intent[];
}

const REQUESTED_APPLIED = ["REQUESTED", "APPLIED"];
const ACCEPTED_ATTENDING = ["ATTENDING", "INTERESTED"];
const WAITLISTED = ["WAITLISTED"];
const DECLINED_WITHDREW = ["DECLINED", "WITHDREW"];

function groupByStatus(intents: Intent[]) {
  return {
    requested: intents.filter((i) => REQUESTED_APPLIED.includes(i.status)),
    accepted: intents.filter((i) => ACCEPTED_ATTENDING.includes(i.status)),
    waitlisted: intents.filter((i) => WAITLISTED.includes(i.status)),
    declined: intents.filter((i) => DECLINED_WITHDREW.includes(i.status)),
  };
}

function IntentCard({
  intent,
  onWithdraw,
  isPending,
}: {
  intent: Intent;
  onWithdraw: (eventId: string) => void;
  isPending: boolean;
}) {
  const event = intent.event;
  const canWithdraw = ["REQUESTED", "APPLIED", "ATTENDING", "INTERESTED"].includes(
    intent.status
  );

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-4">
        <div className="min-w-0 flex-1">
          <Link
            href={`/events/${event.slug}`}
            className="font-medium hover:text-primary hover:underline"
          >
            {event.title}
          </Link>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {formatDateRange(
              new Date(event.startDate),
              new Date(event.endDate)
            )}{" "}
            · {event.venue.name}
          </p>
          {event.market && (
            <Link
              href={`/markets/${event.market.slug}`}
              className="text-xs text-muted-foreground hover:text-primary"
            >
              {event.market.name}
            </Link>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge variant="secondary">{intent.status}</Badge>
          {intent.visibility === "PUBLIC" && (
            <Badge variant="outline">Public</Badge>
          )}
          {canWithdraw && (
            <Button
              size="sm"
              variant="ghost"
              disabled={isPending}
              onClick={() => onWithdraw(event.id)}
            >
              Withdraw
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function VendorPipelineBoard({ intents }: VendorPipelineBoardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const groups = groupByStatus(intents);

  async function handleWithdraw(eventId: string) {
    startTransition(async () => {
      const res = await fetch(`/api/events/${eventId}/intent`, {
        method: "DELETE",
      });
      if (res.ok) router.refresh();
    });
  }

  const hasAny = intents.length > 0;
  const [activeTab, setActiveTab] = useState<"requested" | "accepted" | "waitlisted" | "declined">("requested");

  if (!hasAny) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <p>No market dates in your pipeline yet.</p>
          <p className="mt-1 text-sm">
            Visit market date pages to mark attending, request roster placement, or
            mark interested.
          </p>
        </CardContent>
      </Card>
    );
  }

  const tabButtons = [
    { value: "requested" as const, label: "Requested", count: groups.requested.length },
    { value: "accepted" as const, label: "Attending/Interested", count: groups.accepted.length },
    { value: "waitlisted" as const, label: "Waitlisted", count: groups.waitlisted.length },
    { value: "declined" as const, label: "Declined", count: groups.declined.length },
  ];

  const currentIntents =
    activeTab === "requested"
      ? groups.requested
      : activeTab === "accepted"
        ? groups.accepted
        : activeTab === "waitlisted"
          ? groups.waitlisted
          : groups.declined;

  const canWithdrawTab = activeTab === "requested" || activeTab === "accepted";

  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        {tabButtons.map((tab) => (
          <Button
            key={tab.value}
            variant={activeTab === tab.value ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab(tab.value)}
          >
            {tab.label} ({tab.count})
          </Button>
        ))}
      </div>
      <div className="mt-4 space-y-3">
        {currentIntents.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No market dates in this category.
          </p>
        ) : (
          currentIntents.map((i) => (
            <IntentCard
              key={i.id}
              intent={i}
              onWithdraw={handleWithdraw}
              isPending={isPending && canWithdrawTab}
            />
          ))
        )}
      </div>
    </div>
  );
}
