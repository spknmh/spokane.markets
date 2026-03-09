import { describe, it, expect } from "vitest";
import {
  formatPhoneNumber,
  formatPhoneInput,
  normalizeUrlToHttps,
} from "./utils";

describe("formatPhoneNumber", () => {
  it("formats 10-digit US number as (XXX) XXX-XXXX", () => {
    expect(formatPhoneNumber("5095551234")).toBe("(509) 555-1234");
  });

  it("formats 11-digit number with leading 1 as +1 (XXX) XXX-XXXX", () => {
    expect(formatPhoneNumber("15095551234")).toBe("+1 (509) 555-1234");
  });

  it("formats already-formatted input consistently", () => {
    expect(formatPhoneNumber("(509) 555-1234")).toBe("(509) 555-1234");
  });

  it("returns trimmed input for non-standard lengths", () => {
    expect(formatPhoneNumber("50955512")).toBe("50955512");
  });

  it("strips formatting from input before formatting", () => {
    expect(formatPhoneNumber("509-555-1234")).toBe("(509) 555-1234");
    expect(formatPhoneNumber(" 509-555-1234 ")).toBe("(509) 555-1234");
  });

  it("returns empty string for null, undefined, or whitespace", () => {
    expect(formatPhoneNumber(null)).toBe("");
    expect(formatPhoneNumber(undefined)).toBe("");
    expect(formatPhoneNumber("")).toBe("");
    expect(formatPhoneNumber("   ")).toBe("");
  });
});

describe("formatPhoneInput", () => {
  it("formats as user types", () => {
    expect(formatPhoneInput("5")).toBe("(5");
    expect(formatPhoneInput("509")).toBe("(509");
    expect(formatPhoneInput("5095")).toBe("(509) 5");
    expect(formatPhoneInput("5095551234")).toBe("(509) 555-1234");
  });

  it("handles 11-digit with leading 1", () => {
    expect(formatPhoneInput("15095551234")).toBe("+1 (509) 555-1234");
  });

  it("strips non-digits before formatting", () => {
    expect(formatPhoneInput("509-555-1234")).toBe("(509) 555-1234");
  });
});

describe("normalizeUrlToHttps", () => {
  it("leaves https:// URLs unchanged", () => {
    expect(normalizeUrlToHttps("https://example.com")).toBe("https://example.com");
  });

  it("converts http:// to https://", () => {
    expect(normalizeUrlToHttps("http://example.com")).toBe("https://example.com");
  });

  it("adds https:// to www. URLs", () => {
    expect(normalizeUrlToHttps("www.example.com")).toBe("https://www.example.com");
  });

  it("adds https:// to bare domains", () => {
    expect(normalizeUrlToHttps("example.com")).toBe("https://example.com");
  });

  it("returns empty string for empty or whitespace input", () => {
    expect(normalizeUrlToHttps("")).toBe("");
    expect(normalizeUrlToHttps("   ")).toBe("");
  });
});
