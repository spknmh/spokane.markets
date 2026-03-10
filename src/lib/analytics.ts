/**
 * Analytics helpers. Events are sent to GTM (dataLayer) and/or Umami based on env config.
 * GTM: NEXT_PUBLIC_GTM_ID. Umami: NEXT_PUBLIC_UMAMI_WEBSITE_ID.
 */
import { trackUmami } from "./umami";

export type AnalyticsValue = string | number | boolean;
export type AnalyticsParams = Record<
  string,
  AnalyticsValue | null | undefined
>;

const ATTRIBUTION_STORAGE_KEY = "analytics_attribution";
const LANDING_PATH_STORAGE_KEY = "analytics_landing_path";

let analyticsContext: Record<string, AnalyticsValue> = {};

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

function cleanAnalyticsParams(
  params?: AnalyticsParams
): Record<string, AnalyticsValue> | undefined {
  if (!params) return undefined;

  const cleaned = Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) =>
        value !== undefined &&
        value !== null &&
        !(typeof value === "string" && value.trim() === "")
    )
  ) as Record<string, AnalyticsValue>;

  return Object.keys(cleaned).length > 0 ? cleaned : undefined;
}

function getCurrentPath(): string {
  if (typeof window === "undefined") return "/";
  return `${window.location.pathname}${window.location.search}`;
}

export function getReferrerType(
  referrer: string,
  currentHost: string
):
  | "search"
  | "social"
  | "direct"
  | "internal"
  | "referral"
  | "unknown" {
  if (!referrer) return "direct";

  try {
    const referrerUrl = new URL(referrer);
    const referrerHost = referrerUrl.hostname.replace(/^www\./, "");
    const normalizedCurrentHost = currentHost.replace(/^www\./, "");

    if (referrerHost === normalizedCurrentHost) {
      return "internal";
    }

    if (
      /(google|bing|yahoo|duckduckgo|ecosia|baidu)\./i.test(referrerHost)
    ) {
      return "search";
    }

    if (
      /(facebook|instagram|tiktok|x\.com|twitter|linkedin|pinterest|youtube|reddit)\./i.test(
        referrerHost
      )
    ) {
      return "social";
    }

    return "referral";
  } catch {
    return "unknown";
  }
}

export function initializeAnalyticsSession(): void {
  if (
    typeof window === "undefined" ||
    typeof window.sessionStorage === "undefined"
  ) {
    return;
  }

  if (!sessionStorage.getItem(LANDING_PATH_STORAGE_KEY)) {
    sessionStorage.setItem(LANDING_PATH_STORAGE_KEY, getCurrentPath());
  }

  if (sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY)) return;

  const url = new URL(window.location.href);
  const utmSource = url.searchParams.get("utm_source") ?? undefined;
  const utmMedium = url.searchParams.get("utm_medium") ?? undefined;
  const utmCampaign = url.searchParams.get("utm_campaign") ?? undefined;
  const referrerType = getReferrerType(document.referrer, window.location.host);
  const landingPath = sessionStorage.getItem(LANDING_PATH_STORAGE_KEY) ?? "/";

  let entrySource: AnalyticsValue = "direct";
  if (
    utmSource?.toLowerCase() === "qr" ||
    utmMedium?.toLowerCase() === "qr"
  ) {
    entrySource = "qr";
  } else if (utmSource || utmMedium || utmCampaign) {
    entrySource = "utm";
  } else if (referrerType === "search") {
    entrySource = "organic";
  } else if (referrerType === "social" || referrerType === "referral") {
    entrySource = "referral";
  }

  const attribution = cleanAnalyticsParams({
    entry_source: entrySource,
    utm_source: utmSource,
    utm_medium: utmMedium,
    utm_campaign: utmCampaign,
    landing_path: landingPath,
    referrer_type: referrerType,
  });

  sessionStorage.setItem(
    ATTRIBUTION_STORAGE_KEY,
    JSON.stringify(attribution ?? {})
  );
}

export function getAttributionContext(): Record<string, AnalyticsValue> {
  if (
    typeof window === "undefined" ||
    typeof window.sessionStorage === "undefined"
  ) {
    return {};
  }

  initializeAnalyticsSession();

  try {
    const raw = sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, AnalyticsValue>;
    return parsed ?? {};
  } catch {
    return {};
  }
}

export function setAnalyticsContext(params?: AnalyticsParams): void {
  analyticsContext = cleanAnalyticsParams(params) ?? {};
}

export function trackEvent(
  eventName: string,
  params?: AnalyticsParams
): void {
  const cleanParams = cleanAnalyticsParams({
    ...analyticsContext,
    ...params,
  });

  if (process.env.NEXT_PUBLIC_GTM_ID) {
    pushToDataLayer({
      event: eventName,
      ...(cleanParams ?? {}),
    } as Record<string, unknown>);
  }
  if (process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID) {
    trackUmami(eventName, cleanParams);
  }
}

export function trackMilestoneEvent(
  eventName: string,
  params?: AnalyticsParams
): void {
  trackEvent(eventName, {
    ...getAttributionContext(),
    ...params,
  });
}

export function trackApiError(
  endpointGroup: string,
  status: number,
  params?: AnalyticsParams
): void {
  trackEvent("api_error", {
    endpoint_group: endpointGroup,
    status,
    ...params,
  });
}

export function trackFormError(
  formId: string,
  reason: "validation" | "network" | "server" | "auth" | "rate_limit",
  params?: AnalyticsParams
): void {
  trackEvent("form_error", {
    form_id: formId,
    reason,
    ...params,
  });
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
