import type { MaintenanceMode, Role } from "@prisma/client";

/**
 * Returns true if the user's role is allowed to access the app in the given maintenance mode.
 * Edge-safe: no DB imports.
 * - OFF: everyone
 * - MAINTENANCE_ADMIN_ONLY: only ADMIN
 * - MAINTENANCE_PRIVILEGED: ADMIN, VENDOR, ORGANIZER
 */
export function isPrivilegedForMaintenance(
  role: Role | null | undefined,
  mode: MaintenanceMode
): boolean {
  if (mode === "OFF") return true;
  if (!role) return false;
  if (mode === "MAINTENANCE_ADMIN_ONLY") return role === "ADMIN";
  if (mode === "MAINTENANCE_PRIVILEGED") {
    return role === "ADMIN" || role === "VENDOR" || role === "ORGANIZER";
  }
  return false;
}
