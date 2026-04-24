// Stale Server Action errors surface when a client holds HTML/action IDs
// from a previous build (deploy skew) or from a misrouted response where
// a different Next.js app rendered the page (e.g., the Caddy → wrong-upstream
// bug in April 2026). Both conditions cause `Failed to find Server Action`
// on the server; the client receives a generic error with a digest.
//
// Detection is tolerant: we match on the message when Next.js doesn't redact
// it, the `name` when present, and the `digest` prefix which Next.js stamps
// on action-routing failures in production.

const MESSAGE_PATTERN = /Failed to find Server Action|older or newer deployment/i;

export interface MaybeStaleActionError {
  message?: string;
  name?: string;
  digest?: string;
}

export function isStaleServerActionError(error: MaybeStaleActionError | null | undefined): boolean {
  if (!error) return false;
  if (error.message && MESSAGE_PATTERN.test(error.message)) return true;
  if (error.name === "ServerActionError") return true;
  return false;
}

// Session-scoped key so a one-shot auto-reload can't loop forever.
// If a reload has already been attempted in this session, we stop and
// show the normal error UI instead of reloading again.
export const RELOAD_GUARD_KEY = "market:stale-action-reload-attempted";
