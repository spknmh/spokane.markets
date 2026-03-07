/**
 * Umami custom event tracking. Calls window.umami.track() when Umami is loaded.
 * Used by lib/analytics.ts for dual-send (GTM + Umami).
 */

declare global {
  interface Window {
    umami?: {
      track: (eventName: string, data?: Record<string, string | number | boolean>) => void;
    };
  }
}

export function trackUmami(
  eventName: string,
  data?: Record<string, string | number | boolean>
): void {
  if (typeof window === "undefined" || !window.umami) return;
  if (!process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID) return;
  window.umami.track(eventName, data);
}
