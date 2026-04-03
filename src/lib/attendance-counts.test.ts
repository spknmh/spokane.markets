import { describe, expect, it, vi, beforeEach } from "vitest";

const groupBy = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    attendance: {
      groupBy: (...args: unknown[]) => groupBy(...args),
    },
  },
}));

import { getAttendanceCountsByEventIds } from "./attendance-counts";

describe("getAttendanceCountsByEventIds", () => {
  beforeEach(() => {
    groupBy.mockReset();
  });

  it("returns empty map for empty ids", async () => {
    expect(await getAttendanceCountsByEventIds([])).toEqual({});
    expect(groupBy).not.toHaveBeenCalled();
  });

  it("aggregates GOING and INTERESTED per event", async () => {
    groupBy.mockResolvedValue([
      { eventId: "a", status: "GOING", _count: { _all: 3 } },
      { eventId: "a", status: "INTERESTED", _count: { _all: 2 } },
      { eventId: "b", status: "GOING", _count: { _all: 1 } },
    ]);
    const map = await getAttendanceCountsByEventIds(["a", "b"]);
    expect(map.a).toEqual({ going: 3, interested: 2 });
    expect(map.b).toEqual({ going: 1, interested: 0 });
  });
});
