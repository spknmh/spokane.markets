import { buildFacebookUrl, buildInstagramUrl, normalizeUrlToHttps } from "@/lib/utils";

export function getAppBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function vendorListingUrl(slug: string): string {
  return `${getAppBaseUrl()}/vendors/${slug}`;
}

export function eventListingUrl(slug: string): string {
  return `${getAppBaseUrl()}/events/${slug}`;
}

export function marketListingUrl(slug: string): string {
  return `${getAppBaseUrl()}/markets/${slug}`;
}

export function toNormalizedUrl(value: string | null | undefined): string {
  if (!value?.trim()) return "";
  return normalizeUrlToHttps(value);
}

export function toInstagramUrlFromHandle(handle: string | null | undefined): string {
  if (!handle?.trim()) return "";
  return buildInstagramUrl(handle.replace(/^@/, ""));
}

export function toFacebookUrlFromHandle(handle: string | null | undefined): string {
  if (!handle?.trim()) return "";
  return buildFacebookUrl(handle.replace(/^@/, ""));
}
