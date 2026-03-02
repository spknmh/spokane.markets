/**
 * Simple in-memory rate limit for anti-spam.
 * For production with multiple instances, use Redis (e.g. @upstash/ratelimit).
 */

const store = new Map<string, { count: number; resetAt: number }>();

const DEFAULT_WINDOW_MS = 60 * 1000; // 1 minute
const DEFAULT_MAX_REQUESTS = 5;

const ACTION_CONFIG: Record<
  string,
  { windowMs: number; maxRequests: number }
> = {
  subscribe: { windowMs: 60 * 1000, maxRequests: 5 },
  newsletter: { windowMs: 60 * 1000, maxRequests: 5 },
  register: { windowMs: 60 * 1000, maxRequests: 5 },
  reviews: { windowMs: 60 * 60 * 1000, maxRequests: 10 },
  uploads: { windowMs: 60 * 60 * 1000, maxRequests: 20 },
  claims: { windowMs: 60 * 60 * 1000, maxRequests: 5 },
  vendorSurvey: { windowMs: 60 * 1000, maxRequests: 5 },
  reports: { windowMs: 60 * 60 * 1000, maxRequests: 5 },
};

function getKey(identifier: string, action: string): string {
  return `${action}:${identifier}`;
}

function getConfig(action: string) {
  const config = ACTION_CONFIG[action];
  return config ?? { windowMs: DEFAULT_WINDOW_MS, maxRequests: DEFAULT_MAX_REQUESTS };
}

export function checkRateLimit(
  identifier: string,
  action: string
): { ok: boolean; remaining: number; retryAfter?: number } {
  const { windowMs, maxRequests } = getConfig(action);
  const key = getKey(identifier, action);
  const now = Date.now();
  const entry = store.get(key);

  if (!entry) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: maxRequests - 1 };
  }

  if (now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: maxRequests - 1 };
  }

  entry.count++;
  const remaining = Math.max(0, maxRequests - entry.count);
  const ok = entry.count <= maxRequests;
  const retryAfter = ok ? undefined : Math.ceil((entry.resetAt - now) / 1000);
  return { ok, remaining, retryAfter };
}

/** Cleanup expired entries periodically */
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (now > entry.resetAt) store.delete(key);
    }
  }, 60_000);
}

