/**
 * Umami custom event tracking. Tries (1) window.umami.track(), (2) trackEvent(),
 * then (3) direct POST to /api/send when the script API is unavailable.
 * Used by lib/analytics.ts for dual-send (GTM + Umami).
 */

declare global {
  interface Window {
    umami?: {
      track?: (
        eventNameOrPayload:
          | string
          | ((props: Record<string, unknown>) => Record<string, unknown>)
      ) => void;
      trackEvent?: (eventName: string, data?: Record<string, unknown>) => void;
    };
  }
}

const MAX_EVENT_NAME_LENGTH = 50;

function getUmamiApiHost(): string | null {
  const url = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL;
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

function sendToUmamiApi(
  eventName: string,
  data?: Record<string, string | number | boolean>
): void {
  const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  const host = getUmamiApiHost();
  if (!websiteId || !host || typeof fetch !== "function") return;

  const payload = {
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

  fetch(`${host}/api/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ payload, type: "event" }),
    keepalive: true,
  }).catch(() => {
    /* fire-and-forget */
  });
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
  } else {
    sendToUmamiApi(safeName, data);
  }
}
