import type { Event, Market, VendorApplicationState, VendorWorkflowMode } from "@prisma/client";
import { vendorDualWorkflowEnabled } from "@/lib/feature-flags";

export type ParticipationMode = "OPEN" | "REQUEST_TO_JOIN" | "INVITE_ONLY" | "CAPACITY_LIMITED";

export interface EventWithMarket extends Event {
  market?: Market | null;
}

export interface ParticipationConfig {
  mode: ParticipationMode;
  vendorCapacity: number | null;
  publicIntentListEnabled: boolean;
  publicIntentNamesEnabled: boolean;
  publicRosterEnabled: boolean;
  rosterClaimRequired: boolean;
  vendorWorkflowMode: VendorWorkflowMode;
  vendorApplicationState: VendorApplicationState;
  vendorApplicationDeadline: Date | null;
}

const SITE_DEFAULTS: ParticipationConfig = {
  mode: "OPEN",
  vendorCapacity: null,
  publicIntentListEnabled: true,
  publicIntentNamesEnabled: true,
  publicRosterEnabled: true,
  rosterClaimRequired: false,
  vendorWorkflowMode: "INTENT_ONLY",
  vendorApplicationState: "NOT_ACCEPTING",
  vendorApplicationDeadline: null,
};

/**
 * Resolves participation config for an event.
 * Event overrides market; event without market uses site defaults.
 */
export function getParticipationConfig(event: EventWithMarket): ParticipationConfig {
  const market = event.market;
  const marketConfig = market
    ? {
        mode: market.participationMode,
        vendorCapacity: market.vendorCapacity,
        publicIntentListEnabled: market.publicIntentListEnabled,
        publicIntentNamesEnabled: market.publicIntentNamesEnabled,
        publicRosterEnabled: market.publicRosterEnabled,
        rosterClaimRequired: market.rosterClaimRequired,
        vendorWorkflowMode: market.vendorWorkflowMode,
        vendorApplicationState: market.vendorApplicationState,
        vendorApplicationDeadline: market.vendorApplicationDeadline,
      }
    : SITE_DEFAULTS;

  const dual = vendorDualWorkflowEnabled();

  return {
    mode: event.participationMode ?? marketConfig.mode,
    vendorCapacity: event.vendorCapacity ?? marketConfig.vendorCapacity,
    publicIntentListEnabled:
      event.publicIntentListEnabled ?? marketConfig.publicIntentListEnabled,
    publicIntentNamesEnabled:
      event.publicIntentNamesEnabled ?? marketConfig.publicIntentNamesEnabled,
    publicRosterEnabled: event.publicRosterEnabled ?? marketConfig.publicRosterEnabled,
    rosterClaimRequired: marketConfig.rosterClaimRequired,
    vendorWorkflowMode: dual
      ? (event.vendorWorkflowMode ?? marketConfig.vendorWorkflowMode)
      : "INTENT_ONLY",
    vendorApplicationState:
      event.vendorApplicationState ?? marketConfig.vendorApplicationState,
    vendorApplicationDeadline:
      event.vendorApplicationDeadline ?? marketConfig.vendorApplicationDeadline ?? null,
  };
}

export function applicationPipelineSupported(mode: ParticipationMode): boolean {
  return mode === "REQUEST_TO_JOIN" || mode === "CAPACITY_LIMITED";
}

export function intentPipelineSupported(mode: ParticipationMode): boolean {
  return mode === "OPEN" || mode === "INVITE_ONLY";
}

/** Whether official roster requests are accepted (participation + application state + deadline). */
export function rosterRequestsAllowed(config: ParticipationConfig): boolean {
  if (!applicationPipelineSupported(config.mode)) return false;
  if (config.vendorApplicationState !== "OPEN" && config.vendorApplicationState !== "WAITLIST") {
    return false;
  }
  if (config.vendorApplicationDeadline && config.vendorApplicationDeadline.getTime() < Date.now()) {
    return false;
  }
  return true;
}
