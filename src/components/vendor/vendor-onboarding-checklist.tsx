"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";

const STORAGE_KEY = "vendor_onboarding_dismissed_v1";

interface VendorOnboardingChecklistProps {
  showOnFirstCreate?: boolean;
}

export function VendorOnboardingChecklist({
  showOnFirstCreate = false,
}: VendorOnboardingChecklistProps) {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") {
      return !showOnFirstCreate;
    }
    const hasDismissed = window.localStorage.getItem(STORAGE_KEY) === "1";
    const visible = showOnFirstCreate || !hasDismissed;
    return !visible;
  });

  useEffect(() => {
    if (!dismissed) {
      trackEvent("vendor_onboarding_checklist_view", { surface: "vendor_dashboard" });
    }
  }, [dismissed]);

  if (dismissed) {
    return null;
  }

  return (
    <Card className="mt-6 border-primary/30 bg-primary/5">
      <CardHeader>
        <CardTitle>Quick start checklist</CardTitle>
        <CardDescription>
          Complete these steps to improve discoverability and unlock verification.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          <li>Add a clear logo and business description.</li>
          <li>Include at least one contact method and one public link.</li>
          <li>Set specialties so markets can find your fit faster.</li>
          <li>Request verification once your profile is ready.</li>
        </ul>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/vendor/profile/edit">Finish profile</Link>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              window.localStorage.setItem(STORAGE_KEY, "1");
              setDismissed(true);
              trackEvent("vendor_onboarding_checklist_dismiss", {
                surface: "vendor_dashboard",
              });
            }}
          >
            Dismiss
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
