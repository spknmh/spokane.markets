/**
 * Umami custom event tracking. Uses window.umami.track() when the script is loaded.
 * Queues events when script is not yet ready; flushes when umami appears (poll up to 5s).
 * No direct API fallback — the script manages session continuity; direct fetch would
 * create a new session per request and inflate counts.
 */

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
    };
  }
}

const MAX_EVENT_NAME_LENGTH = 50;
const POLL_INTERVAL_MS = 100;
const POLL_TIMEOUT_MS = 5000;

type QueuedItem =
  | { type: "pageview" }
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
      track();
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
      if (
        process.env.NODE_ENV === "development" &&
        !timeoutWarned &&
        queue.length > 0
      ) {
        timeoutWarned = true;
        console.warn(
          "[Umami] Script did not load within 5s;",
          queue.length,
          "events dropped"
        );
      }
      queue.length = 0;
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
 */
export function trackUmamiPageview(): void {
  if (typeof window === "undefined") return;
  if (!process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID) return;

  const track = window.umami?.track;

  if (typeof track === "function") {
    track();
  } else {
    queue.push({ type: "pageview" });
    startPoll();
  }
}
