"use client";

import { useEffect } from "react";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { SITE_NAME } from "@/lib/constants";

/** Client component that tracks business_card_qr when user lands via QR code. */
export function QRTracker() {
  useEffect(() => {
    trackEvent("business_card_qr", { source: "qr" });
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
        Welcome to {SITE_NAME}
      </h1>
      <p className="mt-6 max-w-xl text-lg text-muted-foreground">
        Discover local markets, craft fairs, and vendor market dates in the Spokane
        area.
      </p>
      <div className="mt-10 flex flex-wrap justify-center gap-4">
        <Button asChild size="lg">
          <Link href="/events">Browse Market Dates</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/markets">View Markets</Link>
        </Button>
      </div>
    </div>
  );
}
