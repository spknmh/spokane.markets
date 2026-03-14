import { describe, expect, it } from "vitest";
import {
  ADMIN_DASHBOARD_CHECKLIST_COVERAGE,
  getCoverageCounts,
  type ChecklistCategory,
} from "./dashboard-checklist";

const EXPECTED_CATEGORIES: ChecklistCategory[] = [
  "overview-home",
  "user-management",
  "roles-permissions",
  "content-moderation",
  "listings-records",
  "applications-onboarding",
  "reports-abuse-safety",
  "search-filtering",
  "analytics-insights",
  "notifications-alerts",
  "audit-log",
  "cms-content-management",
  "communications-tools",
  "data-import-export",
  "settings",
  "support-operations",
  "billing-monetization",
  "system-health-tech-ops",
];

describe("admin dashboard checklist coverage", () => {
  it("tracks all expected checklist categories exactly once", () => {
    const categories = ADMIN_DASHBOARD_CHECKLIST_COVERAGE.map((item) => item.category);
    expect(categories).toHaveLength(EXPECTED_CATEGORIES.length);
    expect(new Set(categories).size).toBe(EXPECTED_CATEGORIES.length);
    expect(new Set(categories)).toEqual(new Set(EXPECTED_CATEGORIES));
  });

  it("keeps coverage entry quality baseline", () => {
    for (const item of ADMIN_DASHBOARD_CHECKLIST_COVERAGE) {
      expect(item.title.trim().length).toBeGreaterThan(0);
      expect(item.notes.trim().length).toBeGreaterThan(0);
      expect(["implemented", "partial", "missing"]).toContain(item.status);
    }
  });

  it("maintains baseline status distribution for regression visibility", () => {
    const counts = getCoverageCounts();
    expect(counts).toEqual({
      implemented: 4,
      partial: 10,
      missing: 4,
    });
  });
});

