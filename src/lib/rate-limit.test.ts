import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

beforeEach(() => {
  delete process.env.REDIS_URL;
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

// Dynamic import so REDIS_URL is unset before module loads
async function loadRateLimiter() {
  // Clear cached module so each test gets a fresh memory store
  await vi.importActual<typeof import("node:url")>("node:url");
  vi.resetModules();
  const mod = await import("./rate-limit");
  return mod.checkRateLimit;
}

describe("checkRateLimit (in-memory)", () => {
  let checkRateLimit: Awaited<ReturnType<typeof loadRateLimiter>>;

  beforeEach(async () => {
    checkRateLimit = await loadRateLimiter();
  });

  it("allows requests up to the limit", async () => {
    // "subscribe" action has maxRequests: 5
    for (let i = 0; i < 5; i++) {
      const result = await checkRateLimit("127.0.0.1", "subscribe");
      expect(result.ok).toBe(true);
    }
  });

  it("blocks requests after the limit is exceeded", async () => {
    for (let i = 0; i < 5; i++) {
      await checkRateLimit("127.0.0.1", "subscribe");
    }
    const result = await checkRateLimit("127.0.0.1", "subscribe");
    expect(result.ok).toBe(false);
  });

  it("returns correct remaining count", async () => {
    const r1 = await checkRateLimit("127.0.0.1", "subscribe");
    expect(r1.remaining).toBe(4); // 5 max - 1 used

    const r2 = await checkRateLimit("127.0.0.1", "subscribe");
    expect(r2.remaining).toBe(3);

    // Use up the rest
    await checkRateLimit("127.0.0.1", "subscribe");
    await checkRateLimit("127.0.0.1", "subscribe");
    const r5 = await checkRateLimit("127.0.0.1", "subscribe");
    expect(r5.remaining).toBe(0);
  });

  it("returns retryAfter when blocked", async () => {
    for (let i = 0; i < 5; i++) {
      await checkRateLimit("127.0.0.1", "subscribe");
    }
    const result = await checkRateLimit("127.0.0.1", "subscribe");
    expect(result.ok).toBe(false);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it("resets after the window expires", async () => {
    // Use up all requests
    for (let i = 0; i < 5; i++) {
      await checkRateLimit("127.0.0.1", "subscribe");
    }
    const blocked = await checkRateLimit("127.0.0.1", "subscribe");
    expect(blocked.ok).toBe(false);

    // Advance past the 60s window
    vi.advanceTimersByTime(61_000);

    const afterReset = await checkRateLimit("127.0.0.1", "subscribe");
    expect(afterReset.ok).toBe(true);
    expect(afterReset.remaining).toBe(4);
  });

  it("tracks different identifiers independently", async () => {
    for (let i = 0; i < 5; i++) {
      await checkRateLimit("10.0.0.1", "subscribe");
    }
    const blockedA = await checkRateLimit("10.0.0.1", "subscribe");
    expect(blockedA.ok).toBe(false);

    // Different IP should still be allowed
    const allowedB = await checkRateLimit("10.0.0.2", "subscribe");
    expect(allowedB.ok).toBe(true);
  });

  it("tracks different actions independently", async () => {
    for (let i = 0; i < 5; i++) {
      await checkRateLimit("127.0.0.1", "subscribe");
    }
    const blockedSubscribe = await checkRateLimit("127.0.0.1", "subscribe");
    expect(blockedSubscribe.ok).toBe(false);

    // Same IP, different action should still be allowed
    const allowedRegister = await checkRateLimit("127.0.0.1", "register");
    expect(allowedRegister.ok).toBe(true);
  });
});
