import { describe, it, expect } from "vitest";
import { formatTime12hr, parseDateTimeInTimezone } from "./utils";

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
