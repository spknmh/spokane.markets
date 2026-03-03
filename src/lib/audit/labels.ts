export type AuditEntry = {
  action: string;
  targetType: string | null;
  targetId: string | null;
  metadata: unknown;
  user: { name: string | null; email: string };
};

const ACTION_MESSAGES: Record<string, (entry: AuditEntry) => string> = {
  DELETE_EVENT: () => "deleted an event",
  DELETE_VENUE: () => "deleted a venue",
  DELETE_MARKET: () => "deleted a market",
  UPDATE_SUBMISSION_STATUS: (e) => {
    const status = (e.metadata as { status?: string })?.status;
    return status === "APPROVED" ? "approved a submission" : "rejected a submission";
  },
  UPDATE_REVIEW_STATUS: (e) => {
    const status = (e.metadata as { status?: string })?.status;
    return status === "APPROVED" ? "approved a review" : "rejected a review";
  },
  UPDATE_PHOTO_STATUS: (e) => {
    const status = (e.metadata as { status?: string })?.status;
    return status === "APPROVED" ? "approved a photo" : "rejected a photo";
  },
  UPDATE_CLAIM_STATUS: (e) => {
    const status = (e.metadata as { status?: string })?.status;
    return status === "APPROVED" ? "approved a market claim" : "rejected a market claim";
  },
  UPDATE_VENDOR_CLAIM_STATUS: (e) => {
    const status = (e.metadata as { status?: string })?.status;
    return status === "APPROVED" ? "approved a vendor claim" : "rejected a vendor claim";
  },
  UPDATE_REPORT_STATUS: () => "resolved a report",
  UPDATE_USER_ROLE: (e) => {
    const role = (e.metadata as { newRole?: string })?.newRole;
    return role ? `changed user role to ${role}` : "updated user role";
  },
  DELETE_USER: () => "deleted a user",
  UPDATE_MAINTENANCE_MODE: () => "updated maintenance mode",
};

const TARGET_HREFS: Record<string, string> = {
  EVENT: "/admin/events",
  VENUE: "/admin/venues",
  MARKET: "/admin/markets",
  USER: "/admin/users",
  SUBMISSION: "/admin/submissions",
  REVIEW: "/admin/reviews",
  PHOTO: "/admin/photos",
  CLAIM: "/admin/claims",
  VENDOR_CLAIM: "/admin/claims",
  REPORT: "/admin/reports",
  SITE_STATE: "/admin/maintenance",
};

export function formatAuditEntry(
  entry: AuditEntry
): { message: string; href: string | null } {
  const formatter = ACTION_MESSAGES[entry.action];
  const verb = formatter ? formatter(entry) : entry.action.replace(/_/g, " ").toLowerCase();
  const actor = entry.user.name ?? entry.user.email ?? "Admin";
  const message = `${actor} ${verb}`;
  const href = entry.targetType ? TARGET_HREFS[entry.targetType] ?? null : null;
  return { message, href };
}
