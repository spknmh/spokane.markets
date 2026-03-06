/**
 * GA4 analytics helpers. gtag is injected by AnalyticsProvider.
 * Use trackEvent for custom events; page_view is handled by the provider.
 */

declare global {
  interface Window {
    gtag?: (
      command: "config" | "event" | "consent" | "set",
      targetId: string,
      config?: Record<string, unknown>
    ) => void;
    dataLayer?: unknown[];
  }
}

export function gtag(
  command: "config" | "event" | "consent" | "set",
  targetId: string,
  config?: Record<string, unknown>
): void {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag(command, targetId, config);
  }
}

export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean | undefined>
): void {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (!measurementId) return;
  gtag("event", eventName, { ...params, send_to: measurementId } as Record<string, unknown>);
}
