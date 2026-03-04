import type { Event, Market } from "@prisma/client";

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
}

const SITE_DEFAULTS: ParticipationConfig = {
  mode: "OPEN",
  vendorCapacity: null,
  publicIntentListEnabled: true,
  publicIntentNamesEnabled: true,
  publicRosterEnabled: true,
  rosterClaimRequired: false,
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
      }
    : SITE_DEFAULTS;

  return {
    mode: event.participationMode ?? marketConfig.mode,
    vendorCapacity: event.vendorCapacity ?? marketConfig.vendorCapacity,
    publicIntentListEnabled:
      event.publicIntentListEnabled ?? marketConfig.publicIntentListEnabled,
    publicIntentNamesEnabled:
      event.publicIntentNamesEnabled ?? marketConfig.publicIntentNamesEnabled,
    publicRosterEnabled: event.publicRosterEnabled ?? marketConfig.publicRosterEnabled,
    rosterClaimRequired: marketConfig.rosterClaimRequired,
  };
}
