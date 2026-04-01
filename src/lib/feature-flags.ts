/**
 * Runtime feature flags (staged rollout). Prefer env vars documented in README / ops docs.
 * Do not read .env files from code paths; use process.env only (injected by the host).
 */

/** When false, vendor UI behaves as INTENT_ONLY (legacy single pipeline). */
export function vendorDualWorkflowEnabled(): boolean {
  return process.env.NEXT_PUBLIC_VENDOR_DUAL_WORKFLOW === "true";
}

/** Shopper-facing organizer onboarding fields (short description, policies, etc.). */
export function organizerOnboardingDisplayEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ORGANIZER_ONBOARDING_DISPLAY === "true";
}

/** Admin evidence upload + moderation notes APIs and UI sections. */
export function adminListingEvidenceEnabled(): boolean {
  return process.env.ADMIN_LISTING_EVIDENCE === "true";
}
