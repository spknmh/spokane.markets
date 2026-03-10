import { describe, it, expect, vi } from "vitest";

process.env.BETTER_AUTH_SECRET = "test-secret-key-for-unit-tests";

vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/lib/validations", () => ({ subscriberSchema: { safeParse: vi.fn() } }));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: vi.fn() }));

import { generateUnsubscribeToken } from "./route";

describe("generateUnsubscribeToken", () => {
  it("generates deterministic tokens (same email = same token)", () => {
    const t1 = generateUnsubscribeToken("user@example.com");
    const t2 = generateUnsubscribeToken("user@example.com");
    expect(t1).toBe(t2);
  });

  it("produces different tokens for different emails", () => {
    const t1 = generateUnsubscribeToken("alice@example.com");
    const t2 = generateUnsubscribeToken("bob@example.com");
    expect(t1).not.toBe(t2);
  });

  it("returns a hex string", () => {
    const token = generateUnsubscribeToken("test@example.com");
    expect(token).toMatch(/^[a-f0-9]+$/);
  });

  it("returns a 64-character SHA-256 HMAC hex digest", () => {
    const token = generateUnsubscribeToken("test@example.com");
    expect(token).toHaveLength(64);
  });

  it("is case-sensitive on input (email should be normalized before calling)", () => {
    const t1 = generateUnsubscribeToken("User@Example.com");
    const t2 = generateUnsubscribeToken("user@example.com");
    expect(t1).not.toBe(t2);
  });
});
