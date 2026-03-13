import { describe, it, expect } from "vitest";
import {
  formatDateOnlyLocal,
  formatDateOnlyUTC,
  formatTime12hr,
  parseDateOnlyToUTCNoon,
  parseDateTimeInTimezone,
} from "./utils";

describe("formatTime12hr", () => {
  it("converts 24h to 12h without timezone conversion", () => {
    expect(formatTime12hr("17:00")).toBe("5:00 PM");
    expect(formatTime12hr("20:30")).toBe("8:30 PM");
    expect(formatTime12hr("09:00")).toBe("9:00 AM");
    expect(formatTime12hr("00:00")).toBe("12:00 AM");
    expect(formatTime12hr("12:00")).toBe("12:00 PM");
  });

  it("returns invalid input unchanged", () => {
    expect(formatTime12hr("")).toBe("");
    expect(formatTime12hr("invalid")).toBe("invalid");
  });
});

describe("parseDateTimeInTimezone", () => {
  it("parses date+time in America/Los_Angeles correctly", () => {
    const d = parseDateTimeInTimezone("2026-03-07", "17:00", "America/Los_Angeles");
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Los_Angeles",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    expect(fmt.format(d)).toBe("5:00 PM");
  });

  it("parses 8:30 PM correctly", () => {
    const d = parseDateTimeInTimezone("2026-03-07", "20:30", "America/Los_Angeles");
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Los_Angeles",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    expect(fmt.format(d)).toBe("8:30 PM");
  });
});

describe("date-only helpers", () => {
  it("formats date-only using UTC parts", () => {
    expect(formatDateOnlyUTC(new Date("2026-03-14T00:00:00.000Z"))).toBe("2026-03-14");
  });

  it("formats date-only using local parts", () => {
    const d = new Date(2026, 2, 14, 8, 30, 0);
    expect(formatDateOnlyLocal(d)).toBe("2026-03-14");
  });

  it("parses date-only values to stable UTC noon", () => {
    const d = parseDateOnlyToUTCNoon("2026-03-14");
    expect(d.toISOString()).toBe("2026-03-14T12:00:00.000Z");
  });
});
