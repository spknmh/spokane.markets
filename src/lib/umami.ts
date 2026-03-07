/**
 * Umami custom event tracking. Calls window.umami.track() when Umami is loaded.
 * Used by lib/analytics.ts for dual-send (GTM + Umami).
 *
 * Uses the payload-function form of track() to explicitly include event data in the
 * request payload. The two-arg form umami.track(name, data) can fail to include
 * the data field in some Umami versions/scripts.
 */

declare global {
  interface Window {
    umami?: {
      track?: (
        eventNameOrPayload:
          | string
          | ((props: Record<string, unknown>) => Record<string, unknown>)
      ) => void;
      /** Legacy API (Umami v1); some custom scripts use this instead of track */
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
  } else if (process.env.NODE_ENV === "development") {
    console.warn("[Umami] track/trackEvent not available; script may not be loaded yet");
  }
}
