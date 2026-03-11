"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset?: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
    trackEvent("error_view");
  }, [error]);

  function handleTryAgain() {
    trackEvent("error_try_again_click");
    if (typeof reset === "function") {
      reset();
      return;
    }
    window.location.reload();
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
