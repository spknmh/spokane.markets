export type CoverageStatus = "implemented" | "partial" | "missing";

export type ChecklistCategory =
  | "overview-home"
  | "user-management"
  | "roles-permissions"
  | "content-moderation"
  | "listings-records"
  | "applications-onboarding"
  | "reports-abuse-safety"
  | "search-filtering"
  | "analytics-insights"
  | "notifications-alerts"
  | "audit-log"
  | "cms-content-management"
  | "communications-tools"
  | "data-import-export"
  | "settings"
  | "support-operations"
  | "billing-monetization"
  | "system-health-tech-ops";

export type ChecklistCoverageEntry = {
  category: ChecklistCategory;
  title: string;
  status: CoverageStatus;
  notes: string;
  evidencePaths: string[];
};

export const ADMIN_DASHBOARD_CHECKLIST_COVERAGE: ChecklistCoverageEntry[] = [
  {
    category: "overview-home",
    title: "Overview / home",
    status: "implemented",
    notes: "Overview metrics, queues, quick actions, and recent activity are present.",
    evidencePaths: [
      "src/app/admin/page.tsx",
      "src/app/admin/queues/page.tsx",
      "src/lib/admin/queues.ts",
    ],
  },
  {
    category: "user-management",
    title: "User management",
    status: "implemented",
    notes: "Admin user table supports search, role changes, profile detail, reset, and delete.",
    evidencePaths: [
      "src/app/admin/users/page.tsx",
      "src/app/admin/users/[id]/page.tsx",
      "src/app/api/admin/users/[id]/route.ts",
    ],
  },
  {
    category: "roles-permissions",
    title: "Roles and permissions",
    status: "partial",
    notes: "Role assignment exists but no granular permission matrix or escalation safeguards.",
    evidencePaths: [
      "prisma/schema.prisma",
      "src/app/api/admin/users/[id]/route.ts",
    ],
  },
  {
    category: "content-moderation",
    title: "Content moderation",
    status: "implemented",
    notes: "Moderation queues exist for submissions, reviews, photos, reports, and applications.",
    evidencePaths: [
      "src/app/admin/submissions/page.tsx",
      "src/app/admin/reviews/page.tsx",
      "src/app/admin/photos/page.tsx",
      "src/app/admin/reports/page.tsx",
      "src/app/admin/applications/page.tsx",
    ],
  },
  {
    category: "listings-records",
    title: "Listings / records management",
    status: "partial",
    notes: "Entity tables and edit flows exist, but bulk operations and soft delete/restore are limited.",
    evidencePaths: [
      "src/app/admin/events/page.tsx",
      "src/app/admin/vendors/page.tsx",
      "src/app/admin/markets/page.tsx",
      "src/app/admin/venues/page.tsx",
      "src/app/admin/actions.ts",
    ],
  },
  {
    category: "applications-onboarding",
    title: "Applications / onboarding",
    status: "partial",
    notes: "Applications are reviewable with approve/reject, but request-more-info and duplicate handling are limited.",
    evidencePaths: [
      "src/app/admin/applications/applications-client.tsx",
      "src/app/api/admin/applications/[id]/route.ts",
    ],
  },
  {
    category: "reports-abuse-safety",
    title: "Reports / abuse / safety",
    status: "partial",
    notes: "Basic reporting and resolution exists, but severity/escalation workflows are not present.",
    evidencePaths: [
      "src/app/api/reports/route.ts",
      "src/app/admin/reports/page.tsx",
    ],
  },
  {
    category: "search-filtering",
    title: "Search and filtering everywhere",
    status: "partial",
    notes: "Some pages include status filters/search; cross-entity global search is missing.",
    evidencePaths: [
      "src/app/admin/users/page.tsx",
      "src/app/admin/events/page.tsx",
      "src/app/admin/reviews/page.tsx",
    ],
  },
  {
    category: "analytics-insights",
    title: "Analytics and insights",
    status: "partial",
    notes: "Snapshot metrics exist; trend/funnel analytics are not fully implemented.",
    evidencePaths: [
      "src/app/admin/page.tsx",
      "src/lib/analytics.test.ts",
    ],
  },
  {
    category: "notifications-alerts",
    title: "Notifications and alerts",
    status: "partial",
    notes: "Notification primitives exist, but dedicated admin alert center is not complete.",
    evidencePaths: [
      "src/lib/notification-types.ts",
      "src/app/admin/page.tsx",
    ],
  },
  {
    category: "audit-log",
    title: "Audit log / activity log",
    status: "partial",
    notes: "Audit logging exists but lacks broad before/after diffs and session-history depth.",
    evidencePaths: [
      "src/lib/audit.ts",
      "src/lib/audit/labels.ts",
      "src/app/admin/audit-log/page.tsx",
    ],
  },
  {
    category: "cms-content-management",
    title: "CMS / site content management",
    status: "partial",
    notes: "Theme/banner/announcement management exists; broader content editing is limited.",
    evidencePaths: [
      "src/app/admin/settings/page.tsx",
      "src/app/api/admin/site-config/route.ts",
      "src/app/api/admin/site-config/announcement/route.ts",
    ],
  },
  {
    category: "communications-tools",
    title: "Communications tools",
    status: "missing",
    notes: "No complete admin communication campaign/template/history surface yet.",
    evidencePaths: [
      "src/lib/notification-types.ts",
    ],
  },
  {
    category: "data-import-export",
    title: "Data import / export",
    status: "partial",
    notes: "Import/export flows exist; validation preview and advanced duplicate handling are limited.",
    evidencePaths: [
      "src/app/admin/data/page.tsx",
      "src/components/admin/data-import-export.tsx",
      "src/app/api/admin/data/import/route.ts",
      "src/app/api/admin/data/export/route.ts",
    ],
  },
  {
    category: "settings",
    title: "Settings",
    status: "implemented",
    notes: "Admin settings for theme, announcement, banners, and maintenance are available.",
    evidencePaths: [
      "src/app/admin/settings/page.tsx",
      "src/app/api/admin/site-config/theme/route.ts",
      "src/app/api/admin/site-config/maintenance/route.ts",
    ],
  },
  {
    category: "support-operations",
    title: "Support / operations tools",
    status: "missing",
    notes: "Dedicated support ticket case-management workflows are not present in admin.",
    evidencePaths: [],
  },
  {
    category: "billing-monetization",
    title: "Billing / monetization",
    status: "missing",
    notes: "Billing and payment administration features are not currently implemented.",
    evidencePaths: [],
  },
  {
    category: "system-health-tech-ops",
    title: "System health / technical ops",
    status: "missing",
    notes: "No dedicated admin surface for jobs, webhooks, and runtime health signals.",
    evidencePaths: [],
  },
];

export function getCoverageCounts(entries = ADMIN_DASHBOARD_CHECKLIST_COVERAGE) {
  return entries.reduce(
    (acc, item) => {
      acc[item.status] += 1;
      return acc;
    },
    { implemented: 0, partial: 0, missing: 0 } as Record<CoverageStatus, number>
  );
}

