import { describe, expect, it, vi, beforeEach } from "vitest";

const vendorEventFindMany = vi.fn();
const rosterFindMany = vi.fn();
const intentFindMany = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    vendorEvent: { findMany: (...a: unknown[]) => vendorEventFindMany(...a) },
    eventVendorRoster: { findMany: (...a: unknown[]) => rosterFindMany(...a) },
    eventVendorIntent: { findMany: (...a: unknown[]) => intentFindMany(...a) },
  },
}));

import { getVendorParticipationCountsByEventIds } from "./event-vendor-participation-count";

describe("getVendorParticipationCountsByEventIds", () => {
  beforeEach(() => {
    vendorEventFindMany.mockReset();
    rosterFindMany.mockReset();
    intentFindMany.mockReset();
  });

  it("returns zeros for empty ids without querying", async () => {
    expect(await getVendorParticipationCountsByEventIds([])).toEqual({});
    expect(vendorEventFindMany).not.toHaveBeenCalled();
  });

  it("dedupes the same vendor across link, roster, and intent", async () => {
    vendorEventFindMany.mockResolvedValue([{ eventId: "e1", vendorProfileId: "v1" }]);
    rosterFindMany.mockResolvedValue([{ eventId: "e1", vendorProfileId: "v1" }]);
    intentFindMany.mockResolvedValue([{ eventId: "e1", vendorProfileId: "v1" }]);
    const map = await getVendorParticipationCountsByEventIds(["e1"]);
    expect(map.e1).toBe(1);
  });

  it("sums distinct vendors per event", async () => {
    vendorEventFindMany.mockResolvedValue([{ eventId: "e1", vendorProfileId: "a" }]);
    rosterFindMany.mockResolvedValue([{ eventId: "e1", vendorProfileId: "b" }]);
    intentFindMany.mockResolvedValue([
      { eventId: "e1", vendorProfileId: "c" },
      { eventId: "e2", vendorProfileId: "c" },
    ]);
    const map = await getVendorParticipationCountsByEventIds(["e1", "e2"]);
    expect(map.e1).toBe(3);
    expect(map.e2).toBe(1);
  });
});
