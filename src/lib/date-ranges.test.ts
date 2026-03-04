import { describe, it, expect } from "vitest";
import { getUpcomingWeekendRange, getPlanAheadRange } from "./date-ranges";

describe("getUpcomingWeekendRange", () => {
  it("returns start and end as Date instances", () => {
    const { start, end } = getUpcomingWeekendRange();
    expect(start).toBeInstanceOf(Date);
    expect(end).toBeInstanceOf(Date);
  });

  it("returns start before or equal to end", () => {
    const { start, end } = getUpcomingWeekendRange();
    expect(start.getTime()).toBeLessThanOrEqual(end.getTime());
  });

  it("returns a range of 1-3 days", () => {
    const { start, end } = getUpcomingWeekendRange();
    const diffMs = end.getTime() - start.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeGreaterThanOrEqual(0.9);
    expect(diffDays).toBeLessThanOrEqual(3.1);
  });
});

describe("getPlanAheadRange", () => {
  it("returns start and end as Date instances", () => {
    const { start, end } = getPlanAheadRange();
    expect(start).toBeInstanceOf(Date);
    expect(end).toBeInstanceOf(Date);
  });

  it("returns start before end", () => {
    const { start, end } = getPlanAheadRange();
    expect(start.getTime()).toBeLessThan(end.getTime());
  });

  it("returns start approximately 14 days from now", () => {
    const now = new Date();
    const { start } = getPlanAheadRange();
    const diffMs = start.getTime() - now.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeGreaterThanOrEqual(13);
    expect(diffDays).toBeLessThanOrEqual(15);
  });

  it("returns end approximately 28 days from now", () => {
    const now = new Date();
    const { end } = getPlanAheadRange();
    const diffMs = end.getTime() - now.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeGreaterThanOrEqual(27);
    expect(diffDays).toBeLessThanOrEqual(29);
  });
});
