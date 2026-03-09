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

/**
 * Formats a phone string for display. US 10-digit: (XXX) XXX-XXXX.
 * 11-digit with leading 1: +1 (XXX) XXX-XXXX. Otherwise returns trimmed input.
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone?.trim()) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone.trim();
}

/**
 * Formats phone input as the user types. US format: (XXX) XXX-XXXX.
 * For 11 digits with leading 1: +1 (XXX) XXX-XXXX.
 */
export function formatPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

/**
 * Normalizes a URL to https:// for use in links.
 * Accepts: www.example.com, http://example.com, https://example.com, example.com
 */
export function normalizeUrlToHttps(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("http://")) return "https://" + trimmed.slice(7);
  return trimmed.startsWith("www.") ? "https://" + trimmed : "https://" + trimmed;
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

/** Pacific timezone for Spokane area. */
const PST = "America/Los_Angeles";

/** Get local date/time parts in a timezone. Use for heuristics instead of getHours/getDate. */
function getPartsInTimezone(date: Date, timeZone: string): { year: number; month: number; date: number; hours: number; minutes: number } {
  const d = new Date(date);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(d);
  const get = (type: string) => parseInt(parts.find((p) => p.type === type)?.value ?? "0", 10);
  return {
    year: get("year"),
    month: get("month") - 1,
    date: get("day"),
    hours: get("hour"),
    minutes: get("minute"),
  };
}

/** Format date in a specific timezone (weekday, month, day). */
export function formatDateInTimezone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone,
  }).format(new Date(date));
}

/** Format a Date for datetime-local input in a specific timezone. Returns "YYYY-MM-DDTHH:mm". */
export function formatForDateTimeLocal(date: Date, timeZone: string = PST): string {
  const d = new Date(date);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

/** Parse date (YYYY-MM-DD) + time (HH:mm) as a moment in the given timezone.
 * Returns a Date (UTC). Use when server may be in a different TZ than the event. */
export function parseDateTimeInTimezone(
  dateStr: string,
  timeStr: string,
  timeZone: string = PST
): Date {
  const iso = `${dateStr}T${timeStr}:00`;
  const refDate = new Date(`${dateStr}T12:00:00Z`);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
  }).formatToParts(refDate);
  const tzPart = parts.find((p) => p.type === "timeZoneName")?.value ?? "";
  const match = tzPart.match(/GMT([+-])(\d+)(?::(\d+))?/);
  const offset = match
    ? `${match[1]}${match[2].padStart(2, "0")}:${(match[3] ?? "00").padStart(2, "0")}`
    : "-08:00";
  return new Date(`${iso}${offset}`);
}

/** Format HH:mm (24hr) to 12hr format (e.g. "17:00" → "5:00 PM").
 * Treats input as literal time in event timezone — no Date conversion to avoid server TZ issues. */
export function formatTime12hr(hhmm: string): string {
  if (!hhmm || !/^\d{2}:\d{2}$/.test(hhmm)) return hhmm;
  const [h, m] = hhmm.split(":").map(Number);
  const hour12 = h % 12 || 12;
  const period = h >= 12 ? "PM" : "AM";
  return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
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
    hour12: true,
    timeZone: PST,
  }).format(new Date(start));
  const endTime = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: PST,
  }).format(new Date(end));
  const dateOpts = { timeZone: PST };
  if (isMultiDayEvent(start, end)) {
    const startDateStr = new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      ...dateOpts,
    }).format(new Date(start));
    const endDateStr = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      ...dateOpts,
    }).format(new Date(end));
    return `${startDateStr} – ${endDateStr} · ${startTime} – ${endTime}`;
  }
  const dateStr = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    ...dateOpts,
  }).format(new Date(start));
  return `${dateStr} · ${startTime} – ${endTime}`;
}

/**
 * Format date range in a specific timezone when provided.
 * Handles multi-day events. Falls back to formatDateRange (PST) when timezone is null.
 */
export function formatDateRangeInTimezone(
  start: Date,
  end: Date,
  timezone: string | null | undefined
): string {
  const tz = timezone || PST;
  const tzOpts = { timeZone: tz };
  const startParts = getPartsInTimezone(start, tz);
  const endParts = getPartsInTimezone(end, tz);
  const sameDay =
    startParts.year === endParts.year &&
    startParts.month === endParts.month &&
    startParts.date === endParts.date;

  const startTime = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    ...tzOpts,
  }).format(new Date(start));
  const endTime = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    ...tzOpts,
  }).format(new Date(end));

  if (!sameDay) {
    const startDateStr = formatDateInTimezone(start, tz);
    const endDateStr = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      ...tzOpts,
    }).format(new Date(end));
    return `${startDateStr} – ${endDateStr} · ${startTime} – ${endTime}`;
  }

  const dateStr = formatDateInTimezone(start, tz);
  return `${dateStr} · ${startTime} – ${endTime}`;
}

/**
 * Format event time with all-day and time-TBD heuristics.
 * Uses event timezone (or PST) for all heuristics and display to avoid server TZ issues.
 * - All day: start 00:00 and end 23:59 same day, or end next day 00:00
 * - Time TBD: start and end both midnight on same calendar day
 * - Otherwise: date + time range
 */
export function formatEventTime(
  start: Date,
  end: Date,
  timezone?: string | null
): string {
  const tz = timezone || PST;
  const startParts = getPartsInTimezone(start, tz);
  const endParts = getPartsInTimezone(end, tz);

  const startHr = startParts.hours;
  const startMin = startParts.minutes;
  const endHr = endParts.hours;
  const endMin = endParts.minutes;

  const sameDay =
    startParts.year === endParts.year &&
    startParts.month === endParts.month &&
    startParts.date === endParts.date;

  // Time TBD: both midnight, same day (in event timezone)
  if (
    sameDay &&
    startHr === 0 &&
    startMin === 0 &&
    endHr === 0 &&
    endMin === 0
  ) {
    const dateStr = formatDateInTimezone(start, tz);
    return `${dateStr} · Time TBD`;
  }

  // All day: start midnight, end 23:59 same day OR end next day 00:00
  const startDateNum = new Date(startParts.year, startParts.month, startParts.date).getTime();
  const endDateNum = new Date(endParts.year, endParts.month, endParts.date).getTime();
  const daysDiff = Math.round((endDateNum - startDateNum) / (24 * 60 * 60 * 1000));
  const endIsNextDayMidnight =
    !sameDay && endHr === 0 && endMin === 0 && daysDiff === 1;
  const endIs2359 = sameDay && endHr === 23 && endMin === 59;

  if (
    startHr === 0 &&
    startMin === 0 &&
    (endIs2359 || endIsNextDayMidnight)
  ) {
    const dateStr = formatDateInTimezone(start, tz);
    return `${dateStr} · All day`;
  }

  // Multi-day: show date range + time range (in event timezone)
  const dateStr = formatDateInTimezone(start, tz);
  const endDateStr = formatDateInTimezone(end, tz);
  const tzOpts = { timeZone: tz };
  const startTime = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    ...tzOpts,
  }).format(new Date(start));
  const endTime = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    ...tzOpts,
  }).format(new Date(end));
  if (!sameDay) {
    return `${dateStr} – ${endDateStr} · ${startTime} – ${endTime}`;
  }

  return formatDateRangeInTimezone(start, end, tz);
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

/**
 * Format "When" summary from schedule days (source of truth for recurring events).
 * Uses UTC for date-only fields to avoid timezone shift; times are stored as local HH:mm.
 */
export function formatEventTimeFromSchedule(
  scheduleDays: { date: Date; startTime: string; endTime: string; allDay: boolean }[],
  timezone?: string | null
): string {
  if (!scheduleDays.length) return "";
  const tz = timezone || PST;
  const first = scheduleDays[0];
  const last = scheduleDays[scheduleDays.length - 1];
  const dateFormat = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
  const firstDateStr = dateFormat.format(new Date(first.date));
  const lastDateStr = dateFormat.format(new Date(last.date));
  const dateRange =
    scheduleDays.length === 1 ? firstDateStr : `${firstDateStr} – ${lastDateStr}`;
  const allSameTime = scheduleDays.every(
    (d) =>
      d.startTime === first.startTime &&
      d.endTime === first.endTime &&
      d.allDay === first.allDay
  );
  if (allSameTime && first.allDay) {
    return `${dateRange} · All day`;
  }
  if (allSameTime && !first.allDay) {
    return `${dateRange} · ${formatTime12hr(first.startTime)} – ${formatTime12hr(first.endTime)}`;
  }
  return `${dateRange} · Various times`;
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
