"use client";

import { useEffect } from "react";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics";
import { Button } from "@/components/ui/button";

interface NotFoundTrackerProps {
  path?: string;
}

/** Client component that tracks not_found_view, not_found_go_home_click. */
export function NotFoundTracker({ path }: NotFoundTrackerProps) {
  useEffect(() => {
    trackEvent("not_found_view", {
      path: path ?? (typeof window !== "undefined" ? window.location.pathname : ""),
    });
  }, [path]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4">
      <h1 className="text-2xl font-bold tracking-tight">Page not found</h1>
      <p className="mt-2 text-center text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Button
        asChild
        className="mt-6"
        onClick={() => trackEvent("not_found_go_home_click")}
      >
        <Link href="/">Go home</Link>
      </Button>
    </div>
  );
}
