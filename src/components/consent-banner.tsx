"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { updateAnalyticsConsent, trackEvent } from "@/lib/analytics";

const STORAGE_KEY = "cookie_consent";

export function ConsentBanner() {
  const [show, setShow] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as "granted" | "denied" | null;
      if (stored === "granted" || stored === "denied") return false;
      return true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as "granted" | "denied" | null;
    if (stored === "granted") updateAnalyticsConsent(true);
    else if (stored === "denied") updateAnalyticsConsent(false);
  }, []);

  function handleAccept() {
    trackEvent("consent_accept");
    updateAnalyticsConsent(true);
    try {
      localStorage.setItem(STORAGE_KEY, "granted");
    } catch {
      /* ignore */
    }
    setShow(false);
  }

  function handleDecline() {
    trackEvent("consent_decline");
    updateAnalyticsConsent(false);
    try {
      localStorage.setItem(STORAGE_KEY, "denied");
    } catch {
      /* ignore */
    }
    setShow(false);
  }

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-label="Analytics consent"
      className="fixed bottom-0 left-0 right-0 z-[100] border-t border-border bg-background px-4 py-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] sm:px-6"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          We collect anonymous usage analytics on our own infrastructure to improve this
          site. No data is shared with third parties.{" "}
          <Link href="/privacy" className="text-primary underline underline-offset-4 hover:no-underline">
            Privacy Policy
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={handleDecline}>
            Decline
          </Button>
          <Button size="sm" onClick={handleAccept}>
            Allow analytics
          </Button>
        </div>
      </div>
    </div>
  );
}
