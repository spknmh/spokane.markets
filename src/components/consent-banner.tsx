"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { updateAnalyticsConsent } from "@/lib/analytics";

const STORAGE_KEY = "cookie_consent";

export function ConsentBanner() {
  const [show, setShow] = useState<boolean | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as "granted" | "denied" | null;
    if (stored === "granted") {
      updateAnalyticsConsent(true);
      setShow(false);
    } else if (stored === "denied") {
      updateAnalyticsConsent(false);
      setShow(false);
    } else {
      setShow(true);
    }
  }, []);

  function handleAccept() {
    updateAnalyticsConsent(true);
    localStorage.setItem(STORAGE_KEY, "granted");
    setShow(false);
  }

  function handleDecline() {
    updateAnalyticsConsent(false);
    localStorage.setItem(STORAGE_KEY, "denied");
    setShow(false);
  }

  if (show !== true) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 px-4 py-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] backdrop-blur supports-[backdrop-filter]:bg-background/90 sm:px-6"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          We use cookies to understand how visitors use our site and improve your experience.{" "}
          <Link href="/privacy" className="text-primary underline underline-offset-4 hover:no-underline">
            Privacy Policy
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={handleDecline}>
            Decline
          </Button>
          <Button size="sm" onClick={handleAccept}>
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
