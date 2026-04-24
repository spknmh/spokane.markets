import { describe, it, expect } from "vitest";
import { isStaleServerActionError } from "./stale-action-error";

describe("isStaleServerActionError", () => {
  it("matches the exact Next.js message", () => {
    const err = { message: 'Failed to find Server Action "x". This request might be from an older or newer deployment.' };
    expect(isStaleServerActionError(err)).toBe(true);
  });

  it("matches the 'older or newer deployment' phrasing on its own", () => {
    expect(isStaleServerActionError({ message: "Response: older or newer deployment detected" })).toBe(true);
  });

  it("matches case-insensitively", () => {
    expect(isStaleServerActionError({ message: "FAILED TO FIND SERVER ACTION 'y'" })).toBe(true);
  });

  it("matches by error name when the message is redacted", () => {
    expect(isStaleServerActionError({ name: "ServerActionError", message: "" })).toBe(true);
  });

  it("does not match unrelated errors", () => {
    expect(isStaleServerActionError({ message: "Database connection refused" })).toBe(false);
    expect(isStaleServerActionError({ message: "Cannot read properties of undefined" })).toBe(false);
    expect(isStaleServerActionError({ name: "TypeError", message: "x is not a function" })).toBe(false);
  });

  it("is safe with null and undefined", () => {
    expect(isStaleServerActionError(null)).toBe(false);
    expect(isStaleServerActionError(undefined)).toBe(false);
  });

  it("is safe with empty error objects", () => {
    expect(isStaleServerActionError({})).toBe(false);
  });
});
