import { extractSocialHandle, normalizeUrlToHttps } from "@/lib/utils";

export function toOptional(value: string | undefined): string | undefined {
  if (value === undefined || value === "") return undefined;
  return value;
}

export function toOptionalUrl(value: string | undefined): string | undefined {
  if (value === undefined || value === "") return undefined;
  return normalizeUrlToHttps(value);
}

export function toOptionalHandle(
  value: string | undefined,
  platform: "facebook" | "instagram"
): string | undefined {
  if (value === undefined || value === "") return undefined;
  const handle = extractSocialHandle(value, platform);
  return handle ? handle : undefined;
}
