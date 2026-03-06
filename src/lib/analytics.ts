/**
 * Google Tag Manager (GTM) analytics helpers. Events are pushed to dataLayer;
 * GTM forwards them to GA4 and other tags configured in the GTM container.
 *
 * Safe usage: all functions guard with `typeof window !== "undefined" && window.dataLayer`.
 * Analytics loads only when NEXT_PUBLIC_GTM_ID is set.
 */

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

function pushToDataLayer(payload: Record<string, unknown>): void {
  if (typeof window === "undefined" || !window.dataLayer) return;
  window.dataLayer.push(payload);
}

/** Push arbitrary payload to dataLayer. Used by AnalyticsProvider for page_view, user_properties. */
export function pushDataLayer(payload: Record<string, unknown>): void {
  if (!process.env.NEXT_PUBLIC_GTM_ID) return;
  pushToDataLayer(payload);
}

export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean | undefined>
): void {
  if (!process.env.NEXT_PUBLIC_GTM_ID) return;
  pushToDataLayer({ event: eventName, ...params } as Record<string, unknown>);
}

/**
 * Manually fire a pageview. Normally handled by AnalyticsProvider; use only for
 * edge cases (e.g. virtual page changes, iframes).
 */
export function trackPageView(url?: string, title?: string): void {
  if (!process.env.NEXT_PUBLIC_GTM_ID || typeof window === "undefined" || !window.dataLayer) return;
  pushToDataLayer({
    event: "page_view",
    page_location: url ?? window.location.href,
    page_title: title ?? document.title,
  });
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

/** Update consent. Call after user accepts or declines analytics cookies. */
export function updateAnalyticsConsent(granted: boolean): void {
  if (!process.env.NEXT_PUBLIC_GTM_ID || typeof window === "undefined" || !window.dataLayer) return;
  pushToDataLayer({
    event: "consent_update",
    analytics_storage: granted ? "granted" : "denied",
    ad_storage: "denied",
  });
}
