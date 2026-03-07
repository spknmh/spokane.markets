/**
 * Umami custom event tracking. Uses window.umami.track() when the script is loaded.
 * No direct API fallback — the script manages session continuity; direct fetch would
 * create a new session per request and inflate counts.
 */

declare global {
  interface Window {
    umami?: {
      track?: (
        eventNameOrPayload?:
          | string
          | ((props: Record<string, unknown>) => Record<string, unknown>)
      ) => void;
      trackEvent?: (eventName: string, data?: Record<string, unknown>) => void;
    };
  }
}

const MAX_EVENT_NAME_LENGTH = 50;

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

  const umami = window.umami;
  const track = umami?.track;
  const trackEvent = umami?.trackEvent;

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
  } else if (typeof trackEvent === "function") {
    trackEvent(safeName, data);
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
  }
}
