import type { ApplicationStatus } from "@prisma/client";

const STATUS_USER: Record<
  ApplicationStatus,
  { label: string; description: string }
> = {
  PENDING: {
    label: "Under review",
    description: "We'll notify you when there's an update.",
  },
  APPROVED: {
    label: "Approved",
    description: "Your application was approved.",
  },
  REJECTED: {
    label: "Not approved",
    description: "This application was not approved. Contact support if you have questions.",
  },
  NEEDS_INFO: {
    label: "More information needed",
    description: "Check your email for details or next steps.",
  },
  DUPLICATE: {
    label: "Closed",
    description: "We closed this as a duplicate of another submission.",
  },
};

export function getApplicationStatusForUser(status: ApplicationStatus) {
  return STATUS_USER[status] ?? STATUS_USER.PENDING;
}
