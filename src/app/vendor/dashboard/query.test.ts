import { describe, expect, it } from "vitest";
import {
  buildVendorDashboardProfileQuery,
  VENDOR_DASHBOARD_INTENT_STATUSES,
} from "./query";

describe("buildVendorDashboardProfileQuery", () => {
  it("filters soft-deleted vendor profiles and events", () => {
    const query = buildVendorDashboardProfileQuery("user-123");

    expect(query.where).toEqual({ userId: "user-123", deletedAt: null });
    expect(query.include.vendorEvents.where).toEqual({
      event: { deletedAt: null },
    });
    expect(query.include.vendorIntents.where).toEqual({
      status: { in: VENDOR_DASHBOARD_INTENT_STATUSES },
      event: { deletedAt: null },
    });
  });
});
