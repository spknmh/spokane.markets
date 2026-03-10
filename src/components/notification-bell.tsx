"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/utils";

interface NotificationBellProps {
  unreadCount: number;
}

type Notification = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
};

function toDate(d: Date | string): Date {
  return typeof d === "string" ? new Date(d) : d;
}

export function NotificationBell({ unreadCount }: NotificationBellProps) {
  const [open, setOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [markingAll, setMarkingAll] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (open) {
      setLoading(true);
      fetch("/api/notifications?limit=10")
        .then((res) => (res.ok ? res.json() : []))
        .then(setNotifications)
        .finally(() => setLoading(false));
    }
  }, [open]);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  async function markAllAsRead() {
    setMarkingAll(true);
    try {
      const res = await fetch("/api/notifications/read-all", {
        method: "PATCH",
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() }))
        );
        window.location.reload();
      }
    } finally {
      setMarkingAll(false);
    }
  }

  const displayCount = notifications.filter((n) => n.readAt == null).length;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative rounded p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label={
          unreadCount > 0
            ? `${unreadCount} unread notifications`
            : "Notifications"
        }
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-80 overflow-hidden rounded-md border border-border bg-background shadow-lg">
          <div className="flex items-center justify-between border-b border-border p-3">
            <span className="font-semibold">Notifications</span>
            <div className="flex items-center gap-1">
              {displayCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={markAllAsRead}
                  disabled={markingAll}
                >
                  <CheckCheck className="mr-1 h-3 w-3" />
                  Mark all read
                </Button>
              )}
              <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
                <Link href="/notifications" onClick={() => setOpen(false)}>
                  View all
                </Link>
              </Button>
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <p className="p-4 text-center text-sm text-muted-foreground">
                Loading…
              </p>
            ) : notifications.length === 0 ? (
              <p className="p-4 text-center text-sm text-muted-foreground">
                No notifications yet
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {notifications.map((n) => (
                  <li key={n.id}>
                    {n.link ? (
                      <Link
                        href={n.link}
                        onClick={() => setOpen(false)}
                        className={`block p-3 transition-colors hover:bg-muted/50 ${
                          n.readAt == null ? "bg-primary/5" : ""
                        }`}
                      >
                        <p className="font-medium text-foreground">{n.title}</p>
                        {n.body && (
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                            {n.body}
                          </p>
                        )}
                        <time
                          dateTime={toDate(n.createdAt).toISOString()}
                          className="mt-1 block text-xs text-muted-foreground"
                        >
                          {formatRelativeTime(toDate(n.createdAt))}
                        </time>
                      </Link>
                    ) : (
                      <div
                        className={`p-3 ${n.readAt == null ? "bg-primary/5" : ""}`}
                      >
                        <p className="font-medium text-foreground">{n.title}</p>
                        {n.body && (
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                            {n.body}
                          </p>
                        )}
                        <time
                          dateTime={toDate(n.createdAt).toISOString()}
                          className="mt-1 block text-xs text-muted-foreground"
                        >
                          {formatRelativeTime(toDate(n.createdAt))}
                        </time>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
