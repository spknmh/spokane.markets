/**
 * Analytics helpers. Events are sent to GTM (dataLayer) and/or Umami based on env config.
 * GTM: NEXT_PUBLIC_GTM_ID. Umami: NEXT_PUBLIC_UMAMI_WEBSITE_ID.
 */
import { trackUmami } from "./umami";

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
  if (process.env.NEXT_PUBLIC_GTM_ID) {
    pushToDataLayer({ event: eventName, ...params } as Record<string, unknown>);
  }
  if (process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID) {
    const cleanParams = params
      ? (Object.fromEntries(
          Object.entries(params).filter(
            ([, v]) => v !== undefined && v !== null
          )
        ) as Record<string, string | number | boolean>)
      : undefined;
    trackUmami(eventName, cleanParams);
  }
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
