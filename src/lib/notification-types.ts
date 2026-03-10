export const SEVERITY = {
  ACTION_REQUIRED: "action_required",
  IMPORTANT: "important",
  INFO: "info",
  SUCCESS: "success",
  WARNING: "warning",
  SYSTEM: "system",
} as const;

export type Severity = (typeof SEVERITY)[keyof typeof SEVERITY];

export const CATEGORY = {
  OPERATIONAL: "operational",
  DISCOVERY: "discovery",
  TRUST_SAFETY: "trust_safety",
  GROWTH: "growth",
  SYSTEM: "system",
} as const;

export type Category = (typeof CATEGORY)[keyof typeof CATEGORY];

export const ROLE_TARGET = {
  SHOPPER: "shopper",
  VENDOR: "vendor",
  ORGANIZER: "organizer",
  ADMIN: "admin",
  ANY: "any",
} as const;

export type RoleTarget = (typeof ROLE_TARGET)[keyof typeof ROLE_TARGET];

export interface NotificationTypeDef {
  severity: Severity;
  category: Category;
  roleTarget: RoleTarget;
}

export const NOTIFICATION_TYPES: Record<string, NotificationTypeDef> = {
  // Roster / vendor operations
  ROSTER_ADD: {
    severity: SEVERITY.INFO,
    category: CATEGORY.OPERATIONAL,
    roleTarget: ROLE_TARGET.VENDOR,
  },
  ROSTER_APPROVED: {
    severity: SEVERITY.SUCCESS,
    category: CATEGORY.OPERATIONAL,
    roleTarget: ROLE_TARGET.VENDOR,
  },
  ROSTER_REJECTED: {
    severity: SEVERITY.WARNING,
    category: CATEGORY.OPERATIONAL,
    roleTarget: ROLE_TARGET.VENDOR,
  },
  ROSTER_REMOVE: {
    severity: SEVERITY.WARNING,
    category: CATEGORY.OPERATIONAL,
    roleTarget: ROLE_TARGET.VENDOR,
  },
  VENDOR_ROSTER_REQUEST: {
    severity: SEVERITY.ACTION_REQUIRED,
    category: CATEGORY.OPERATIONAL,
    roleTarget: ROLE_TARGET.ORGANIZER,
  },

  // Discovery
  FAVORITE_VENDOR_EVENT: {
    severity: SEVERITY.INFO,
    category: CATEGORY.DISCOVERY,
    roleTarget: ROLE_TARGET.SHOPPER,
  },
  NEW_EVENT_MATCH: {
    severity: SEVERITY.INFO,
    category: CATEGORY.DISCOVERY,
    roleTarget: ROLE_TARGET.SHOPPER,
  },

  // Reviews
  NEW_REVIEW: {
    severity: SEVERITY.INFO,
    category: CATEGORY.OPERATIONAL,
    roleTarget: ROLE_TARGET.ANY,
  },
  NEW_REVIEW_REQUIRES_RESPONSE: {
    severity: SEVERITY.ACTION_REQUIRED,
    category: CATEGORY.OPERATIONAL,
    roleTarget: ROLE_TARGET.ORGANIZER,
  },

  // Event lifecycle
  EVENT_PUBLISHED: {
    severity: SEVERITY.SUCCESS,
    category: CATEGORY.OPERATIONAL,
    roleTarget: ROLE_TARGET.ORGANIZER,
  },
  EVENT_REJECTED: {
    severity: SEVERITY.WARNING,
    category: CATEGORY.OPERATIONAL,
    roleTarget: ROLE_TARGET.ORGANIZER,
  },
  EVENT_CHANGED: {
    severity: SEVERITY.IMPORTANT,
    category: CATEGORY.OPERATIONAL,
    roleTarget: ROLE_TARGET.ANY,
  },
  EVENT_CANCELLED: {
    severity: SEVERITY.IMPORTANT,
    category: CATEGORY.OPERATIONAL,
    roleTarget: ROLE_TARGET.ANY,
  },
  EVENT_REMINDER_UPCOMING: {
    severity: SEVERITY.INFO,
    category: CATEGORY.OPERATIONAL,
    roleTarget: ROLE_TARGET.SHOPPER,
  },
  EVENT_REMINDER_VENDOR: {
    severity: SEVERITY.INFO,
    category: CATEGORY.OPERATIONAL,
    roleTarget: ROLE_TARGET.VENDOR,
  },
  EVENT_DETAILS_UPDATED: {
    severity: SEVERITY.IMPORTANT,
    category: CATEGORY.OPERATIONAL,
    roleTarget: ROLE_TARGET.VENDOR,
  },
  EVENT_DATE_APPROACHING_WITH_GAPS: {
    severity: SEVERITY.ACTION_REQUIRED,
    category: CATEGORY.OPERATIONAL,
    roleTarget: ROLE_TARGET.ORGANIZER,
  },
  EVENT_INFO_INCOMPLETE: {
    severity: SEVERITY.ACTION_REQUIRED,
    category: CATEGORY.OPERATIONAL,
    roleTarget: ROLE_TARGET.ORGANIZER,
  },

  // Submissions
  SUBMISSION_APPROVED: {
    severity: SEVERITY.SUCCESS,
    category: CATEGORY.OPERATIONAL,
    roleTarget: ROLE_TARGET.ORGANIZER,
  },
  SUBMISSION_REJECTED: {
    severity: SEVERITY.WARNING,
    category: CATEGORY.OPERATIONAL,
    roleTarget: ROLE_TARGET.ORGANIZER,
  },

  // Claims
  CLAIM_APPROVED: {
    severity: SEVERITY.SUCCESS,
    category: CATEGORY.TRUST_SAFETY,
    roleTarget: ROLE_TARGET.ANY,
  },
  CLAIM_REJECTED: {
    severity: SEVERITY.WARNING,
    category: CATEGORY.TRUST_SAFETY,
    roleTarget: ROLE_TARGET.ANY,
  },
  VENDOR_CLAIM_APPROVED: {
    severity: SEVERITY.SUCCESS,
    category: CATEGORY.TRUST_SAFETY,
    roleTarget: ROLE_TARGET.VENDOR,
  },
  VENDOR_CLAIM_REJECTED: {
    severity: SEVERITY.WARNING,
    category: CATEGORY.TRUST_SAFETY,
    roleTarget: ROLE_TARGET.VENDOR,
  },
  MARKET_VERIFIED: {
    severity: SEVERITY.SUCCESS,
    category: CATEGORY.TRUST_SAFETY,
    roleTarget: ROLE_TARGET.ORGANIZER,
  },
  MARKET_CLAIM_REQUEST: {
    severity: SEVERITY.ACTION_REQUIRED,
    category: CATEGORY.TRUST_SAFETY,
    roleTarget: ROLE_TARGET.ADMIN,
  },

  // Applications
  APPLICATION_STATUS: {
    severity: SEVERITY.IMPORTANT,
    category: CATEGORY.OPERATIONAL,
    roleTarget: ROLE_TARGET.ANY,
  },
  APPLICATION_RECEIVED: {
    severity: SEVERITY.INFO,
    category: CATEGORY.OPERATIONAL,
    roleTarget: ROLE_TARGET.VENDOR,
  },
  APPLICATION_NEEDS_CHANGES: {
    severity: SEVERITY.ACTION_REQUIRED,
    category: CATEGORY.OPERATIONAL,
    roleTarget: ROLE_TARGET.VENDOR,
  },
  APPLICATION_DEADLINE_SOON: {
    severity: SEVERITY.IMPORTANT,
    category: CATEGORY.OPERATIONAL,
    roleTarget: ROLE_TARGET.VENDOR,
  },
  NEW_VENDOR_APPLICATION: {
    severity: SEVERITY.ACTION_REQUIRED,
    category: CATEGORY.OPERATIONAL,
    roleTarget: ROLE_TARGET.ORGANIZER,
  },

  // Profile / growth
  PROFILE_INCOMPLETE: {
    severity: SEVERITY.ACTION_REQUIRED,
    category: CATEGORY.GROWTH,
    roleTarget: ROLE_TARGET.VENDOR,
  },

  // Admin
  NEW_MARKET_SUBMISSION: {
    severity: SEVERITY.ACTION_REQUIRED,
    category: CATEGORY.OPERATIONAL,
    roleTarget: ROLE_TARGET.ADMIN,
  },
  NEW_EVENT_SUBMISSION: {
    severity: SEVERITY.ACTION_REQUIRED,
    category: CATEGORY.OPERATIONAL,
    roleTarget: ROLE_TARGET.ADMIN,
  },
  NEW_CLAIM_SUBMISSION: {
    severity: SEVERITY.ACTION_REQUIRED,
    category: CATEGORY.TRUST_SAFETY,
    roleTarget: ROLE_TARGET.ADMIN,
  },
  STALE_PENDING_ITEM: {
    severity: SEVERITY.WARNING,
    category: CATEGORY.OPERATIONAL,
    roleTarget: ROLE_TARGET.ADMIN,
  },
  REVIEW_FLAGGED: {
    severity: SEVERITY.ACTION_REQUIRED,
    category: CATEGORY.TRUST_SAFETY,
    roleTarget: ROLE_TARGET.ADMIN,
  },
  JOB_FAILURE_ALERT: {
    severity: SEVERITY.WARNING,
    category: CATEGORY.SYSTEM,
    roleTarget: ROLE_TARGET.ADMIN,
  },

  // System / account
  ACCOUNT_ALERT: {
    severity: SEVERITY.SYSTEM,
    category: CATEGORY.SYSTEM,
    roleTarget: ROLE_TARGET.ANY,
  },
  REVIEW_RESPONSE: {
    severity: SEVERITY.INFO,
    category: CATEGORY.GROWTH,
    roleTarget: ROLE_TARGET.SHOPPER,
  },
} as const;

export function getNotificationType(type: string): NotificationTypeDef {
  return NOTIFICATION_TYPES[type] ?? {
    severity: SEVERITY.INFO,
    category: CATEGORY.SYSTEM,
    roleTarget: ROLE_TARGET.ANY,
  };
}

/** Map category string to the in-app preference field name */
export function getCategoryPrefField(category: Category): string {
  const map: Record<Category, string> = {
    operational: "inAppOperationalEnabled",
    discovery: "inAppDiscoveryEnabled",
    trust_safety: "inAppTrustSafetyEnabled",
    growth: "inAppGrowthEnabled",
    system: "inAppSystemEnabled",
  };
  return map[category];
}
