"use client";

import * as React from "react";
import Link from "next/link";
import { formatRelativeTime, cn } from "@/lib/utils";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

function toDate(d: Date | string): Date {
  return typeof d === "string" ? new Date(d) : d;
}

type Notification = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  readAt: Date | string | null;
  createdAt: Date | string;
};

interface NotificationsListProps {
  notifications: Notification[];
}

export function NotificationsList({ notifications }: NotificationsListProps) {
  const [items, setItems] = React.useState(notifications);
  const [markingAll, setMarkingAll] = React.useState(false);

  const unreadCount = items.filter((n) => n.readAt == null).length;

  async function markAllAsRead() {
    setMarkingAll(true);
    try {
      const res = await fetch("/api/notifications/read-all", {
        method: "PATCH",
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() }))
        );
      }
    } finally {
      setMarkingAll(false);
    }
  }

  async function markAsRead(id: string) {
    const res = await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    if (res.ok) {
        setItems((prev) =>
          prev.map((n) =>
            n.id === id ? { ...n, readAt: n.readAt ?? new Date().toISOString() } : n
          )
        );
    }
  }

  if (items.length === 0) {
    return (
      <div className="mt-8 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border py-16 text-center">
        <Bell className="h-12 w-12 text-muted-foreground" />
        <p className="mt-4 text-muted-foreground">No notifications yet</p>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-4">
      {unreadCount > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={markAllAsRead}
          disabled={markingAll}
          className="gap-2"
        >
          <CheckCheck className="h-4 w-4" />
          Mark all as read
        </Button>
      )}

      <ul className="space-y-2">
        {items.map((n) => (
          <li key={n.id}>
            {n.link ? (
              <Link
                href={n.link}
                onClick={() => n.readAt == null && markAsRead(n.id)}
                className={cn(
                  "block rounded-lg border-2 p-4 transition-colors hover:bg-muted/50",
                  n.readAt != null
                    ? "border-border bg-muted/30"
                    : "border-primary/30 bg-primary/5"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-foreground">{n.title}</p>
                    {n.body && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {n.body}
                      </p>
                    )}
                  </div>
                  <time
                    dateTime={toDate(n.createdAt).toISOString()}
                    className="shrink-0 text-xs text-muted-foreground"
                  >
                    {formatRelativeTime(toDate(n.createdAt))}
                  </time>
                </div>
              </Link>
            ) : (
              <div
                className={cn(
                  "rounded-lg border-2 p-4",
                  n.readAt != null
                    ? "border-border bg-muted/30"
                    : "border-primary/30 bg-primary/5"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-foreground">{n.title}</p>
                    {n.body && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {n.body}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {n.readAt == null && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(n.id)}
                        className="h-7 text-xs"
                      >
                        Mark read
                      </Button>
                    )}
                    <time
                      dateTime={toDate(n.createdAt).toISOString()}
                      className="text-xs text-muted-foreground"
                    >
                      {formatRelativeTime(toDate(n.createdAt))}
                    </time>
                  </div>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
