"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset?: () => void;
}) {
  useEffect(() => {
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
