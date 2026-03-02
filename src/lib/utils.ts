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
