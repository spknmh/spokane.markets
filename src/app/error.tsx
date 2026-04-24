"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";
import { RELOAD_GUARD_KEY, isStaleServerActionError } from "@/lib/stale-action-error";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset?: () => void;
}) {
  const [autoReloading, setAutoReloading] = useState(false);

  useEffect(() => {
    console.error("Application error:", error);
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
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-4">
        <p className="text-muted-foreground">Refreshing…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4">
      <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
      <p className="mt-2 text-center text-muted-foreground">
        We encountered an unexpected error. Please try again.
      </p>
      <div className="mt-6 flex gap-4">
        <Button onClick={handleTryAgain}>
          Try again
        </Button>
        <Button variant="outline" asChild>
          <Link href="/" onClick={() => trackEvent("error_go_home_click")}>
            Go home
          </Link>
        </Button>
      </div>
    </div>
  );
}
