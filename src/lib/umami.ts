/**
 * Umami custom event tracking. Uses window.umami.track() when the script is loaded.
 * Queues events when script is not yet ready; flushes when umami appears (poll up to 5s).
 * When the script never loads (e.g. Sec-GPC, ad blockers), falls back to direct POST
 * to /api/send so events still reach Umami. Session continuity via distinct ID in payload.
 */

const DEFAULT_SCRIPT_URL = "https://analytics.spokane.markets/script.js";
const DISTINCT_ID_MAX_LENGTH = 50;

let distinctId: string | null = null;

function getUmamiApiHost(): string | null {
  const url =
    process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL || DEFAULT_SCRIPT_URL;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

function getOrCreateVisitorId(): string {
  if (typeof window === "undefined" || !window.localStorage) {
    return "";
  }
  const key = "umami_visitor_id";
  let id = localStorage.getItem(key);
  if (!id && typeof crypto !== "undefined" && crypto.randomUUID) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id ?? "";
}

function getPayloadId(): string {
  if (distinctId) {
    return distinctId.length > DISTINCT_ID_MAX_LENGTH
      ? distinctId.slice(0, DISTINCT_ID_MAX_LENGTH)
      : distinctId;
  }
  return getOrCreateVisitorId();
}

function sendToUmamiApi(
  eventName: string,
  data?: Record<string, string | number | boolean>
): void {
  const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  const host = getUmamiApiHost();
  if (!websiteId || !host || typeof fetch !== "function") return;

  const payload: Record<string, unknown> = {
    hostname: window.location.hostname,
    language: navigator.language,
    referrer: document.referrer || "",
    screen: `${window.screen.width}x${window.screen.height}`,
    title: document.title,
    url: window.location.pathname + window.location.search,
    website: websiteId,
    name: eventName,
    ...(data && Object.keys(data).length > 0 ? { data } : {}),
  };
  const id = getPayloadId();
  if (id) payload.id = id;

  fetch(`${host}/api/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ payload, type: "event" }),
    keepalive: true,
  }).catch(() => {
    /* fire-and-forget */
  });
}

function sendPageviewToApi(url: string): void {
  const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  const host = getUmamiApiHost();
  if (!websiteId || !host || typeof fetch !== "function") return;
  const payload: Record<string, unknown> = {
    hostname: window.location.hostname,
    language: navigator.language,
    referrer: document.referrer || "",
    screen: `${window.screen.width}x${window.screen.height}`,
    title: document.title,
    url,
    website: websiteId,
    name: "pageview",
  };
  const id = getPayloadId();
  if (id) payload.id = id;

  fetch(`${host}/api/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ payload, type: "event" }),
    keepalive: true,
  }).catch(() => {});
}

function flushQueueViaApi(): void {
  for (const item of queue) {
    if (item.type === "pageview") {
      sendPageviewToApi(item.url);
    } else {
      sendToUmamiApi(item.name, item.data);
    }
  }
}

declare global {
  interface Window {
    umami?: {
      track?: (
        eventNameOrPayload?:
          | string
          | Record<string, unknown>
          | ((props: Record<string, unknown>) => Record<string, unknown>),
        data?: Record<string, unknown>
      ) => void;
      identify?: (id: string, data?: Record<string, unknown>) => void;
    };
  }
}

/**
 * Set distinct ID for Umami session. Call when user logs in; pass null on logout.
 * Script path: calls umami.identify(). API fallback: stores for payload id.
 */
export function identifyUmami(
  userId: string | null,
  data?: Record<string, unknown>
): void {
  distinctId = userId;

  if (typeof window === "undefined") return;

  const identify = window.umami?.identify;
  if (typeof identify === "function" && userId) {
    const safeId =
      userId.length > DISTINCT_ID_MAX_LENGTH
        ? userId.slice(0, DISTINCT_ID_MAX_LENGTH)
        : userId;
    identify(safeId, data);
  }
}

const MAX_EVENT_NAME_LENGTH = 50;
const POLL_INTERVAL_MS = 100;
const POLL_TIMEOUT_MS = 5000;

type QueuedItem =
  | { type: "pageview"; url: string }
  | { type: "event"; name: string; data?: Record<string, string | number | boolean> };

const queue: QueuedItem[] = [];
let pollTimer: ReturnType<typeof setInterval> | null = null;
let timeoutWarned = false;

function flushQueue(): void {
  const track = window.umami?.track;
  if (typeof track !== "function") return;

  while (queue.length > 0) {
    const item = queue.shift();
    if (!item) continue;
    if (item.type === "pageview") {
      track((props: Record<string, unknown>) => ({
        ...props,
        url: item.url,
        title: document.title,
      }));
    } else {
      const hasData = item.data && Object.keys(item.data).length > 0;
      if (hasData) {
        track((props: Record<string, unknown>) => ({
          ...props,
          name: item.name,
          data: item.data,
        }));
      } else {
        track(item.name);
      }
    }
  }

  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

function startPoll(): void {
  if (pollTimer) return;

  const start = Date.now();
  pollTimer = setInterval(() => {
    if (typeof window.umami?.track === "function") {
      flushQueue();
      return;
    }
    if (Date.now() - start >= POLL_TIMEOUT_MS) {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
      if (queue.length > 0) {
        if (process.env.NODE_ENV === "development" && !timeoutWarned) {
          timeoutWarned = true;
          console.warn(
            "[Umami] Script did not load within 5s; flushing",
            queue.length,
            "events via API fallback"
          );
        }
        flushQueueViaApi();
        queue.length = 0;
      }
    }
  }, POLL_INTERVAL_MS);
}

export function trackUmami(
  eventName: string,
  data?: Record<string, string | number | boolean>
): void {
  if (typeof window === "undefined") return;
  if (!process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID) return;

  let safeName = eventName;
  if (eventName.length > MAX_EVENT_NAME_LENGTH) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        `Umami event name too long (${eventName.length}). Truncating:`,
        eventName
      );
    }
    safeName = eventName.slice(0, MAX_EVENT_NAME_LENGTH);
  }

  const track = window.umami?.track;

  if (typeof track === "function") {
    const hasData = data && Object.keys(data).length > 0;
    if (hasData) {
      track((props: Record<string, unknown>) => ({
        ...props,
        name: safeName,
        data,
      }));
    } else {
      track(safeName);
    }
  } else {
    queue.push({ type: "event", name: safeName, data });
    startPoll();
  }
}

/**
 * Track a pageview. Call on route change for SPA navigation.
 * Pass url explicitly so Umami records the correct path for journey/funnel reports.
 */
export function trackUmamiPageview(url?: string): void {
  if (typeof window === "undefined") return;
  if (!process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID) return;

  const path = url ?? window.location.pathname + window.location.search;

  const track = window.umami?.track;

  if (typeof track === "function") {
    track((props: Record<string, unknown>) => ({
      ...props,
      url: path,
      title: document.title,
    }));
  } else {
    queue.push({ type: "pageview", url: path });
    startPoll();
  }
}
