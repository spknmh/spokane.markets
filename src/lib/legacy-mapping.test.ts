import { describe, it, expect, vi, beforeEach } from "vitest";

const mockEventOccurrenceFindUnique = vi.fn();
const mockMarketSeriesFindUnique = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    eventOccurrence: {
      findUnique: (...args: unknown[]) => mockEventOccurrenceFindUnique(...args),
    },
    marketSeries: {
      findUnique: (...args: unknown[]) => mockMarketSeriesFindUnique(...args),
    },
  },
}));

describe("legacy-mapping", () => {
  beforeEach(() => {
    mockEventOccurrenceFindUnique.mockReset();
    mockMarketSeriesFindUnique.mockReset();
  });

  it("getEventOccurrenceByLegacyId returns event occurrence when found", async () => {
    mockEventOccurrenceFindUnique.mockResolvedValue({
      id: "eo1",
      slug: "test-event",
    });

    const { getEventOccurrenceByLegacyId } = await import("./legacy-mapping");
    const result = await getEventOccurrenceByLegacyId("legacy-ev1");

    expect(mockEventOccurrenceFindUnique).toHaveBeenCalledWith({
      where: { legacyEventId: "legacy-ev1" },
      select: { id: true, slug: true },
    });
    expect(result).toEqual({ id: "eo1", slug: "test-event" });
  });

  it("getEventOccurrenceByLegacyId returns null when not found", async () => {
    mockEventOccurrenceFindUnique.mockResolvedValue(null);

    const { getEventOccurrenceByLegacyId } = await import("./legacy-mapping");
    const result = await getEventOccurrenceByLegacyId("legacy-ev1");

    expect(result).toBeNull();
  });

  it("getMarketSeriesByLegacyId returns market series when found", async () => {
    mockMarketSeriesFindUnique.mockResolvedValue({
      id: "ms1",
      slug: "test-market",
    });

    const { getMarketSeriesByLegacyId } = await import("./legacy-mapping");
    const result = await getMarketSeriesByLegacyId("legacy-m1");

    expect(mockMarketSeriesFindUnique).toHaveBeenCalledWith({
      where: { legacyMarketId: "legacy-m1" },
      select: { id: true, slug: true },
    });
    expect(result).toEqual({ id: "ms1", slug: "test-market" });
  });
});
