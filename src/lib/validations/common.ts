import { z } from "zod";

/** Accepts empty string, /uploads/ paths, or http(s) URLs. Use for imageUrl fields. */
export const imageUrlSchema = z
  .string()
  .optional()
  .refine(
    (v) =>
      !v ||
      v.trim() === "" ||
      v.startsWith("/uploads/") ||
      /^https?:\/\//.test(v),
    "Must be a valid image URL or upload path"
  );

/** Accepts www., http://, https://, or bare domain. Use for website/social URLs. */
function isValidFlexibleUrl(v: string | undefined): boolean {
  if (v == null || typeof v !== "string") return true;
  const trimmed = v.trim();
  if (!trimmed) return true;
  try {
    const withProtocol =
      /^https?:\/\//i.test(trimmed) ? trimmed : "https://" + trimmed;
    new URL(withProtocol);
    return true;
  } catch {
    return false;
  }
}

export const flexibleUrlSchema = z
  .string()
  .optional()
  .or(z.literal(""))
  .refine(isValidFlexibleUrl, "Please enter a valid URL (e.g. www.example.com or https://example.com)");

/** Accepts username or full URL. API normalizes to handle when saving. */
export const socialHandleSchema = z.string().optional().or(z.literal(""));

export const participationModeEnum = z.enum([
  "OPEN",
  "REQUEST_TO_JOIN",
  "INVITE_ONLY",
  "CAPACITY_LIMITED",
]);

export const neighborhoodSlugSchema = z
  .string()
  .regex(
    /^[a-z0-9-]+$/,
    "Neighborhood must be lowercase letters, numbers, and hyphens only"
  );
