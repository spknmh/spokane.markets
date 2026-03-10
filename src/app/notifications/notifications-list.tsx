"use client";

import * as React from "react";
import Link from "next/link";
import { formatRelativeTime, cn } from "@/lib/utils";
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  Info,
  CheckCircle,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";

function toDate(d: Date | string): Date {
  return typeof d === "string" ? new Date(d) : d;
}

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  severity: string;
  category: string | null;
  readAt: Date | string | null;
  createdAt: Date | string;
};

type Filter = "all" | "unread" | "action_required";

const severityConfig: Record<
  string,
  { icon: React.ElementType; label: string; chipClass: string; iconClass: string }
> = {
  action_required: {
    icon: AlertTriangle,
    label: "Action required",
    chipClass: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
    iconClass: "text-orange-600 dark:text-orange-400",
  },
  important: {
    icon: AlertCircle,
    label: "Important",
    chipClass: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
    iconClass: "text-blue-600 dark:text-blue-400",
  },
  warning: {
    icon: AlertTriangle,
    label: "Warning",
    chipClass: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    iconClass: "text-amber-600 dark:text-amber-400",
  },
  success: {
    icon: CheckCircle,
    label: "Success",
    chipClass: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
    iconClass: "text-green-600 dark:text-green-400",
  },
  info: {
    icon: Info,
    label: "Info",
    chipClass: "bg-muted text-muted-foreground",
    iconClass: "text-muted-foreground",
  },
  system: {
    icon: Info,
    label: "System",
    chipClass: "bg-muted text-muted-foreground",
    iconClass: "text-muted-foreground",
  },
};

function SeverityChip({ severity }: { severity: string }) {
  const config = severityConfig[severity] ?? severityConfig.info;
  const Icon = config.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        config.chipClass
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

interface NotificationsListProps {
  notifications: Notification[];
}

export function NotificationsList({ notifications }: NotificationsListProps) {
  const [items, setItems] = React.useState(notifications);
  const [markingAll, setMarkingAll] = React.useState(false);
  const [filter, setFilter] = React.useState<Filter>("all");

  const unreadCount = items.filter((n) => n.readAt == null).length;
  const actionRequiredCount = items.filter(
    (n) => n.readAt == null && n.severity === "action_required"
  ).length;

  const filtered = React.useMemo(() => {
    switch (filter) {
      case "unread":
        return items.filter((n) => n.readAt == null);
      case "action_required":
        return items.filter((n) => n.severity === "action_required" && n.readAt == null);
      default:
        return items;
    }
  }, [items, filter]);

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
      <div className="flex flex-wrap items-center gap-2">
        {(["all", "unread", "action_required"] as const).map((f) => {
          const labels: Record<Filter, string> = {
            all: "All",
            unread: `Unread (${unreadCount})`,
            action_required: `Action required (${actionRequiredCount})`,
          };
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full px-3 py-1 text-sm font-medium transition-colors",
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {labels[f]}
            </button>
          );
        })}

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            disabled={markingAll}
            className="ml-auto gap-2"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No notifications match this filter.
        </p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((n) => {
            const bgClass =
              n.readAt != null
                ? "border-border bg-muted/30"
                : n.severity === "action_required"
                  ? "border-orange-300 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/30"
                  : "border-primary/30 bg-primary/5";

            const cardContent = (
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <SeverityChip severity={n.severity} />
                    <time
                      dateTime={toDate(n.createdAt).toISOString()}
                      className="shrink-0 text-xs text-muted-foreground"
                    >
                      {formatRelativeTime(toDate(n.createdAt))}
                    </time>
                  </div>
                  <p className="mt-1.5 font-semibold text-foreground">{n.title}</p>
                  {n.body && (
                    <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
                  )}
                  {n.link && (
                    <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary">
                      View details <ExternalLink className="h-3 w-3" />
                    </span>
                  )}
                </div>
                {n.readAt == null && !n.link && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      markAsRead(n.id);
                    }}
                    className="h-7 shrink-0 text-xs"
                  >
                    Mark read
                  </Button>
                )}
              </div>
            );

            return (
              <li key={n.id}>
                {n.link ? (
                  <Link
                    href={n.link}
                    onClick={() => n.readAt == null && markAsRead(n.id)}
                    className={cn(
                      "block rounded-lg border-2 p-4 transition-colors hover:bg-muted/50",
                      bgClass
                    )}
                  >
                    {cardContent}
                  </Link>
                ) : (
                  <div className={cn("rounded-lg border-2 p-4", bgClass)}>
                    {cardContent}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
