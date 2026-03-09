/**
 * Event sync: no-op. Previously synced Event to EventOccurrence when USE_NEW_MODELS=true.
 */

export async function syncEventToOccurrence(_eventId: string): Promise<void> {
  // No-op: new models removed
}
