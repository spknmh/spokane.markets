"use client";

import { useState, useTransition, useCallback } from "react";
import { trackEvent } from "@/lib/analytics";
import { useRouter } from "next/navigation";
import { Lock, CheckCircle2, Star, Send } from "lucide-react";
import { AuthRequiredModal } from "@/components/auth-required-modal";
import { Button } from "@/components/ui/button";
import type { ParticipationConfig } from "@/lib/participation-config";
import {
  applicationPipelineSupported,
  intentPipelineSupported,
  rosterRequestsAllowed,
} from "@/lib/participation-config";

type IntentStatus =
  | "INTERESTED"
  | "APPLIED"
  | "REQUESTED"
  | "ATTENDING"
  | "WAITLISTED"
  | "DECLINED"
  | "WITHDREW"
  | "APPROVED";

interface EventVendorActionsProps {
  eventId: string;
  config: ParticipationConfig;
  isLoggedIn: boolean;
  hasVendorProfile: boolean;
  userIntent: IntentStatus | null;
  callbackUrl: string;
}

export function EventVendorActions({
  eventId,
  config,
  isLoggedIn,
  hasVendorProfile,
  userIntent,
  callbackUrl,
}: EventVendorActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [intentError, setIntentError] = useState<string | null>(null);
  const [applicationError, setApplicationError] = useState<string | null>(null);

  const mode = config.mode;
  const showApplication = applicationPipelineSupported(mode);
  const showOpenIntent =
    intentPipelineSupported(mode) ||
    (config.vendorWorkflowMode === "BOTH" && showApplication);
  const rosterOk = rosterRequestsAllowed(config);

  const setIntent = useCallback(
    async (status: "ATTENDING" | "INTERESTED", visibility: "PUBLIC" | "PRIVATE" = "PUBLIC") => {
      if (!isLoggedIn || !hasVendorProfile) {
        setAuthModalOpen(true);
        return;
      }
      setIntentError(null);
      startTransition(async () => {
        const res = await fetch(`/api/events/${eventId}/intent`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, visibility }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setIntentError(data.error ?? "Something went wrong");
          return;
        }
        trackEvent("vendor_intent_set", { status, event_id: eventId });
        router.refresh();
      });
    },
    [eventId, isLoggedIn, hasVendorProfile, router]
  );

  const removeIntent = useCallback(async () => {
    if (!isLoggedIn || !hasVendorProfile) return;
    setIntentError(null);
    startTransition(async () => {
      const res = await fetch(`/api/events/${eventId}/intent`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setIntentError(data.error ?? "Something went wrong");
        return;
      }
      router.refresh();
    });
  }, [eventId, isLoggedIn, hasVendorProfile, router]);

  const requestRoster = useCallback(async () => {
    if (!isLoggedIn || !hasVendorProfile) {
      setAuthModalOpen(true);
      return;
    }
    setApplicationError(null);
    startTransition(async () => {
      const res = await fetch(`/api/events/${eventId}/request-roster`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setApplicationError(data.error ?? "Something went wrong");
        return;
      }
      trackEvent("vendor_roster_request", { event_id: eventId });
      router.refresh();
    });
  }, [eventId, isLoggedIn, hasVendorProfile, router]);

  const openIntentHeading =
    mode === "INVITE_ONLY"
      ? "Vendor participation"
      : showApplication && config.vendorWorkflowMode === "BOTH"
        ? "Vendor interest (optional)"
        : "Vendor? Mark your attendance";

  const renderOpenIntentBlock = () => {
    const isAttending = userIntent === "ATTENDING";
    const isInterested = userIntent === "INTERESTED";
    return (
      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <p className="text-sm font-medium text-foreground">{openIntentHeading}</p>
        {!hasVendorProfile && isLoggedIn ? null : !isLoggedIn ? (
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Lock className="h-4 w-4 shrink-0" />
            Sign in with a vendor account to mark attendance or interest.
          </p>
        ) : (
          <>
            {intentError && (
              <p className="mt-2 text-sm text-destructive">{intentError}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={isAttending ? "default" : "outline"}
                disabled={isPending}
                onClick={() => (isAttending ? removeIntent() : setIntent("ATTENDING", "PUBLIC"))}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {isAttending ? "Attending" : "Mark Attending"}
              </Button>
              <Button
                size="sm"
                variant={isInterested ? "default" : "outline"}
                disabled={isPending}
                onClick={() => (isInterested ? removeIntent() : setIntent("INTERESTED", "PUBLIC"))}
              >
                <Star className="mr-2 h-4 w-4" />
                {isInterested ? "Interested" : "Interested"}
              </Button>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderApplicationBlock = () => {
    const isRequested =
      userIntent === "REQUESTED" || userIntent === "APPLIED" || userIntent === "WAITLISTED";
    const waitlist = config.vendorApplicationState === "WAITLIST";
    const statusNote = !rosterOk
      ? config.vendorApplicationDeadline &&
        config.vendorApplicationDeadline.getTime() < Date.now()
        ? "The application deadline has passed."
        : config.vendorApplicationState === "CLOSED" || config.vendorApplicationState === "NOT_ACCEPTING"
          ? "The organizer is not accepting new vendor applications for this event."
          : null
      : waitlist
        ? "Applications are in waitlist mode — you may still request; the organizer will follow up."
        : null;

    return (
      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <p className="text-sm font-medium text-foreground">Official vendor placement</p>
        {!hasVendorProfile && isLoggedIn ? null : !isLoggedIn ? (
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Lock className="h-4 w-4 shrink-0" />
            Sign in with a vendor account to request placement.
          </p>
        ) : (
          <>
            {statusNote && <p className="mt-2 text-sm text-muted-foreground">{statusNote}</p>}
            {applicationError && (
              <p className="mt-2 text-sm text-destructive">{applicationError}</p>
            )}
            <Button
              size="sm"
              className="mt-3"
              disabled={isPending || isRequested || !rosterOk}
              onClick={() => (isRequested || !rosterOk ? undefined : requestRoster())}
            >
              {isRequested ? (
                "Request sent"
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Request to be listed as an official vendor
                </>
              )}
            </Button>
          </>
        )}
      </div>
    );
  };

  if (!hasVendorProfile && isLoggedIn) return null;

  if (mode === "INVITE_ONLY") {
    return (
      <>
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <p className="text-sm font-medium text-foreground">Vendor participation</p>
          <p className="mt-1 text-sm text-muted-foreground">
            This event is invite-only. Only organizers can add vendors to the official roster.
          </p>
          {hasVendorProfile && (
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              disabled={isPending}
              onClick={() =>
                userIntent === "INTERESTED" ? removeIntent() : setIntent("INTERESTED", "PRIVATE")
              }
            >
              {userIntent === "INTERESTED" ? (
                "Interested (private)"
              ) : (
                <>
                  <Star className="mr-2 h-4 w-4" />
                  Mark Interested (private)
                </>
              )}
            </Button>
          )}
        </div>
        <AuthRequiredModal
          open={authModalOpen}
          onOpenChange={setAuthModalOpen}
          title="Sign in to mark vendor interest"
          description="Sign in with your vendor account to mark interest."
          callbackUrl={callbackUrl}
        />
      </>
    );
  }

  if (showOpenIntent && showApplication && config.vendorWorkflowMode === "BOTH") {
    return (
      <>
        <div className="space-y-4">
          {renderApplicationBlock()}
          {renderOpenIntentBlock()}
        </div>
        <AuthRequiredModal
          open={authModalOpen}
          onOpenChange={setAuthModalOpen}
          title="Sign in to participate as a vendor"
          description="Sign in with your vendor account to continue."
          callbackUrl={callbackUrl}
        />
      </>
    );
  }

  if (showApplication) {
    return (
      <>
        {renderApplicationBlock()}
        <AuthRequiredModal
          open={authModalOpen}
          onOpenChange={setAuthModalOpen}
          title="Sign in to request vendor placement"
          description="Sign in with your vendor account to request to be listed."
          callbackUrl={callbackUrl}
        />
      </>
    );
  }

  if (showOpenIntent) {
    return (
      <>
        {renderOpenIntentBlock()}
        <AuthRequiredModal
          open={authModalOpen}
          onOpenChange={setAuthModalOpen}
          title="Sign in to mark vendor attendance"
          description="Sign in with your vendor account to mark attending or interested."
          callbackUrl={callbackUrl}
        />
      </>
    );
  }

  return null;
}
