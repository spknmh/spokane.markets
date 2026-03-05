import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { NEIGHBORHOODS } from "@/lib/constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** True if a banner URL should use unoptimized Image (local uploads or external URLs). */
export function isBannerUnoptimized(url: string): boolean {
  return url.startsWith("/uploads/") || url.startsWith("http://") || url.startsWith("https://");
}

/** Returns display label for a neighborhood/baseArea slug, or title-cased fallback. */
export function formatNeighborhoodLabel(slug: string | null | undefined): string {
  if (!slug) return "";
  const found = NEIGHBORHOODS.find((n) => n.value === slug);
  if (found) return found.label;
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatRelativeTime(date: Date): string {
  const rtf = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" });
  const now = new Date();
  const diffMs = new Date(date).getTime() - now.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHr = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHr / 24);

  if (Math.abs(diffSec) < 60) return rtf.format(diffSec, "second");
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, "minute");
  if (Math.abs(diffHr) < 24) return rtf.format(diffHr, "hour");
  if (Math.abs(diffDay) < 30) return rtf.format(diffDay, "day");
  return formatDate(date);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

/** Format date as "May 12" for compact display (e.g. "thru May 12"). */
export function formatDateShort(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

/** True if start and end are on different calendar days. */
export function isMultiDayEvent(start: Date, end: Date): boolean {
  const s = new Date(start);
  const e = new Date(end);
  return (
    s.getFullYear() !== e.getFullYear() ||
    s.getMonth() !== e.getMonth() ||
    s.getDate() !== e.getDate()
  );
}

export function formatDateRange(start: Date, end: Date): string {
  const startTime = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(start));
  const endTime = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(end));
  if (isMultiDayEvent(start, end)) {
    return `${formatDate(start)} – ${formatDateShort(end)} · ${startTime} – ${endTime}`;
  }
  return `${formatDate(start)} · ${startTime} – ${endTime}`;
}

/**
 * Format date range in a specific timezone when provided.
 * Falls back to formatDateRange (local/server time) when timezone is null.
 */
export function formatDateRangeInTimezone(
  start: Date,
  end: Date,
  timezone: string | null | undefined
): string {
  if (!timezone) {
    return formatDateRange(start, end);
  }
  const tzOpts = { timeZone: timezone };
  const dateStr = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    ...tzOpts,
  }).format(new Date(start));
  const startTime = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    ...tzOpts,
  }).format(new Date(start));
  const endTime = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    ...tzOpts,
  }).format(new Date(end));
  return `${dateStr} · ${startTime} – ${endTime}`;
}

/**
 * Format event time with all-day and time-TBD heuristics.
 * - All day: start 00:00 and end 23:59 same day, or end next day 00:00
 * - Time TBD: start and end both midnight on same calendar day
 * - Otherwise: date + time range
 */
export function formatEventTime(
  start: Date,
  end: Date,
  timezone?: string | null
): string {
  const s = new Date(start);
  const e = new Date(end);

  const startHr = s.getHours();
  const startMin = s.getMinutes();
  const endHr = e.getHours();
  const endMin = e.getMinutes();

  const sameDay =
    s.getFullYear() === e.getFullYear() &&
    s.getMonth() === e.getMonth() &&
    s.getDate() === e.getDate();

  // Time TBD: both midnight, same day
  if (
    sameDay &&
    startHr === 0 &&
    startMin === 0 &&
    endHr === 0 &&
    endMin === 0
  ) {
    const dateStr = formatDate(s);
    return `${dateStr} · Time TBD`;
  }

  // All day: start midnight, end 23:59 same day OR end next day 00:00
  const endDate = new Date(e.getFullYear(), e.getMonth(), e.getDate());
  const startDate = new Date(s.getFullYear(), s.getMonth(), s.getDate());
  const daysDiff = (endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000);
  const endIsNextDayMidnight =
    !sameDay && endHr === 0 && endMin === 0 && daysDiff === 1;
  const endIs2359 = sameDay && endHr === 23 && endMin === 59;

  if (
    startHr === 0 &&
    startMin === 0 &&
    (endIs2359 || endIsNextDayMidnight)
  ) {
    const dateStr = formatDate(s);
    return `${dateStr} · All day`;
  }

  // Multi-day: show date range + time range
  const dateStr = formatDate(s);
  const endDateStr = formatDate(e);
  const startTime = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(s);
  const endTime = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(e);
  if (!sameDay) {
    return `${dateStr} – ${endDateStr} · ${startTime} – ${endTime}`;
  }

  return timezone
    ? formatDateRangeInTimezone(start, end, timezone)
    : formatDateRange(start, end);
}

export function getDirectionsUrl(address: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
}

/**
 * Validates callbackUrl to prevent open redirect attacks.
 * Only allows relative paths (e.g. /events, /vendor/dashboard).
 */
export function isValidCallbackUrl(url: string | null | undefined): boolean {
  if (url == null || typeof url !== "string" || url === "") return false;
  return url.startsWith("/") && !url.startsWith("//");
}

export function getCompletenessScore(event: Record<string, unknown>): { score: number; total: number } {
  const fields = ["title", "description", "startDate", "endDate", "imageUrl", "websiteUrl", "facebookUrl", "venueId", "marketId", "tags"];
  let filled = 0;
  for (const field of fields) {
    const value = event[field];
    if (value !== null && value !== undefined && value !== "" && !(Array.isArray(value) && value.length === 0)) {
      filled++;
    }
  }
  return { score: filled, total: fields.length };
}
