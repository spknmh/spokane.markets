"use client";

import { useEffect } from "react";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics";
import { usePageDuration } from "@/hooks/use-page-duration";
import { Button } from "@/components/ui/button";

/** Client component that tracks unauthorized_view, unauthorized_return_click. */
export function UnauthorizedTracker() {
  usePageDuration("unauthorized_duration", { minSeconds: 1 });

  useEffect(() => {
    const referrer =
      typeof document !== "undefined" ? document.referrer : undefined;
    trackEvent("unauthorized_view", referrer ? { referrer } : undefined);
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-4 py-12">
      <h1 className="mb-2 text-2xl font-bold tracking-tight">Access Denied</h1>
      <p className="mb-6 text-muted-foreground">
        You do not have permission to access this page.
      </p>
      <Button
        asChild
        onClick={() => trackEvent("unauthorized_return_click")}
      >
        <Link href="/">Return home</Link>
      </Button>
    </div>
  );
}
