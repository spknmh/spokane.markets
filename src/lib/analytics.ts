/**
 * GA4 analytics helpers. gtag is injected by the script in app/layout.tsx.
 * Use trackEvent for custom events; page_view is handled by AnalyticsProvider.
 *
 * Safe usage: all functions guard with `typeof window !== "undefined" && window.gtag`.
 * Analytics loads only when NEXT_PUBLIC_GA_MEASUREMENT_ID is set.
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
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag(command, targetId, config);
}

export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean | undefined>
): void {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (!measurementId) return;
  gtag("event", eventName, { ...params, send_to: measurementId } as Record<string, unknown>);
}

/**
 * Manually fire a pageview. Normally handled by AnalyticsProvider; use only for
 * edge cases (e.g. virtual page changes, iframes).
 */
export function trackPageView(url?: string, title?: string): void {
  if (typeof window === "undefined" || !window.gtag) return;
  gtag("event", "page_view", {
    page_location: url ?? window.location.href,
    page_title: title ?? document.title,
  } as Record<string, unknown>);
}

/** Track vendor signup completion. */
export function trackVendorSignup(): void {
  trackEvent("vendor_signup");
}

/** Track market detail view. */
export function trackMarketView(marketId: string): void {
  trackEvent("market_view", { market_id: marketId });
}

/** Track vendor website link click. */
export function trackVendorWebsiteClick(vendorId: string): void {
  trackEvent("vendor_website_click", { vendor_id: vendorId });
}

/** Update GA4 consent. Call after user accepts or declines analytics cookies. */
export function updateAnalyticsConsent(granted: boolean): void {
  if (typeof window === "undefined" || !window.gtag) return;
  (window.gtag as (cmd: string, action: string, config: Record<string, string>) => void)(
    "consent",
    "update",
    {
      analytics_storage: granted ? "granted" : "denied",
      ad_storage: "denied",
    }
  );
}
