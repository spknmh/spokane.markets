import type { VendorIntentStatus } from "@prisma/client";

/**
 * Visibility for a new EventVendorIntent row. ATTENDING / INTERESTED default to PUBLIC so they appear
 * on `/events/[slug]` unless the client explicitly requests PRIVATE (e.g. invite-only flow).
 */
export function resolveIntentVisibilityForCreate(
  status: VendorIntentStatus,
  explicit?: "PUBLIC" | "PRIVATE" | null
): "PUBLIC" | "PRIVATE" {
  if (explicit != null) return explicit;
  return status === "ATTENDING" || status === "INTERESTED" ? "PUBLIC" : "PRIVATE";
}
