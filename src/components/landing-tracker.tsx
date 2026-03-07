"use client";

import { useEffect } from "react";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics";
import { usePageDuration } from "@/hooks/use-page-duration";
import { Button } from "@/components/ui/button";

interface LandingTrackerProps {
  header: string;
  text: string;
}

/** Client component that tracks landing_view, landing_duration. */
export function LandingTracker({ header, text }: LandingTrackerProps) {
  usePageDuration("landing_duration", { minSeconds: 1 });

  useEffect(() => {
    trackEvent("landing_view");
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
        {header}
      </h1>
      <p className="mt-6 max-w-xl text-lg text-muted-foreground whitespace-pre-line">
        {text}
      </p>
      <div className="mt-10">
        <Button asChild variant="outline" size="lg">
          <Link href="/auth/signin">Admin login</Link>
        </Button>
      </div>
    </div>
  );
}
