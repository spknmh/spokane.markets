"use client";

import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { RELOAD_GUARD_KEY, isStaleServerActionError } from "@/lib/stale-action-error";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset?: () => void;
}) {
  const [autoReloading, setAutoReloading] = useState(false);

  useEffect(() => {
    trackEvent("error_view");

    if (!isStaleServerActionError(error)) return;
    if (typeof window === "undefined") return;

    const alreadyTried = window.sessionStorage.getItem(RELOAD_GUARD_KEY);
    if (alreadyTried) {
      trackEvent("error_stale_action_persist");
      return;
    }

    window.sessionStorage.setItem(RELOAD_GUARD_KEY, String(Date.now()));
    trackEvent("error_stale_action_auto_reload");
    setAutoReloading(true);
    const id = window.setTimeout(() => window.location.reload(), 600);
    return () => window.clearTimeout(id);
  }, [error]);

  function handleTryAgain() {
    trackEvent("error_try_again_click");
    if (typeof reset === "function") {
      reset();
      return;
    }
    window.location.reload();
  }

  if (autoReloading) {
    return (
      <html lang="en">
        <body>
          <div className="flex min-h-screen flex-col items-center justify-center px-4">
            <p className="text-muted-foreground">Refreshing…</p>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center px-4">
          <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
          <p className="mt-2 text-center text-muted-foreground">
            A critical error occurred. Please try again.
          </p>
          <button
            onClick={handleTryAgain}
            className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
