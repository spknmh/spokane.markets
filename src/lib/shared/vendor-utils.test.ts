import { describe, it, expect } from "vitest";
import { toOptional, toOptionalUrl, toOptionalHandle } from "./vendor-utils";

describe("toOptional", () => {
  it("returns undefined for undefined input", () => {
    expect(toOptional(undefined)).toBeUndefined();
  });

  it("returns undefined for empty string", () => {
    expect(toOptional("")).toBeUndefined();
  });

  it("returns the string for valid input", () => {
    expect(toOptional("hello")).toBe("hello");
  });

  it("preserves whitespace-only strings (no trim)", () => {
    // toOptional does not trim — it only checks undefined and ""
    expect(toOptional("   ")).toBe("   ");
  });
});

describe("toOptionalUrl", () => {
  it("returns undefined for undefined input", () => {
    expect(toOptionalUrl(undefined)).toBeUndefined();
  });

  it("returns undefined for empty string", () => {
    expect(toOptionalUrl("")).toBeUndefined();
  });

  it("normalizes http URL to https", () => {
    expect(toOptionalUrl("http://example.com")).toBe("https://example.com");
  });

  it("returns https URL unchanged", () => {
    expect(toOptionalUrl("https://example.com")).toBe("https://example.com");
  });

  it("adds https:// to bare domain", () => {
    expect(toOptionalUrl("example.com")).toBe("https://example.com");
  });
});

describe("toOptionalHandle", () => {
  it("returns undefined for undefined input", () => {
    expect(toOptionalHandle(undefined, "facebook")).toBeUndefined();
  });

  it("returns undefined for empty string", () => {
    expect(toOptionalHandle("", "instagram")).toBeUndefined();
  });

  it("extracts handle from a Facebook URL", () => {
    expect(toOptionalHandle("https://facebook.com/mypage", "facebook")).toBe("mypage");
  });

  it("extracts handle from an Instagram URL", () => {
    expect(toOptionalHandle("https://instagram.com/myhandle", "instagram")).toBe("myhandle");
  });

  it("returns handle as-is when not a URL", () => {
    expect(toOptionalHandle("myhandle", "instagram")).toBe("myhandle");
  });
});
