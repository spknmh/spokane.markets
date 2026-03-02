import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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

export function formatDateRange(start: Date, end: Date): string {
  const startStr = formatDate(start);
  const startTime = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(start));
  const endTime = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(end));
  return `${startStr} · ${startTime} – ${endTime}`;
}

export function getDirectionsUrl(address: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
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
