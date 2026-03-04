"use client";

import { useState } from "react";
import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Lock, Star } from "lucide-react";
import { AuthRequiredModal } from "@/components/auth-required-modal";
import { cn } from "@/lib/utils";

interface AttendanceToggleProps {
  eventId: string;
  slug: string;
  initialGoingCount: number;
  initialInterestedCount: number;
  initialUserStatus: "GOING" | "INTERESTED" | null;
  isLoggedIn?: boolean;
  callbackUrl?: string;
}

interface AttendanceState {
  goingCount: number;
  interestedCount: number;
  userStatus: "GOING" | "INTERESTED" | null;
}

export function AttendanceToggle({
  eventId,
  slug,
  initialGoingCount,
  initialInterestedCount,
  initialUserStatus,
  isLoggedIn = true,
  callbackUrl = "/",
}: AttendanceToggleProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const [optimistic, setOptimistic] = useOptimistic<AttendanceState, "GOING" | "INTERESTED">(
    {
      goingCount: initialGoingCount,
      interestedCount: initialInterestedCount,
      userStatus: initialUserStatus,
    },
    (current, newStatus) => {
      if (current.userStatus === newStatus) {
        return {
          goingCount: current.goingCount - (newStatus === "GOING" ? 1 : 0),
          interestedCount: current.interestedCount - (newStatus === "INTERESTED" ? 1 : 0),
          userStatus: null,
        };
      }

      let goingDelta = 0;
      let interestedDelta = 0;

      if (current.userStatus === "GOING") goingDelta--;
      if (current.userStatus === "INTERESTED") interestedDelta--;
      if (newStatus === "GOING") goingDelta++;
      if (newStatus === "INTERESTED") interestedDelta++;

      return {
        goingCount: current.goingCount + goingDelta,
        interestedCount: current.interestedCount + interestedDelta,
        userStatus: newStatus,
      };
    }
  );

  async function handleClick(status: "GOING" | "INTERESTED") {
    if (!isLoggedIn) {
      setAuthModalOpen(true);
      return;
    }
    startTransition(async () => {
      setOptimistic(status);

      const res = await fetch(`/api/events/${slug}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, status }),
      });

      if (res.status === 401) {
        setAuthModalOpen(true);
        return;
      }

      router.refresh();
    });
  }

  const isGoing = optimistic.userStatus === "GOING";
  const isInterested = optimistic.userStatus === "INTERESTED";

  return (
    <>
      <div className="mt-6 rounded-xl border border-border bg-muted/30 p-4">
        <p className="mb-3 text-sm font-medium text-foreground">
          Planning to attend? Let others know!
        </p>
        {!isLoggedIn && (
          <p className="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground" title="Sign in to mark your attendance">
            <Lock className="h-4 w-4 shrink-0" aria-hidden />
            Sign in to mark your attendance
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleClick("GOING")}
            title={!isLoggedIn ? "Sign in to mark your attendance" : undefined}
            className={cn(
              "inline-flex min-h-[44px] min-w-[140px] items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-all disabled:opacity-50",
              isGoing
                ? "bg-going text-going-foreground shadow-md ring-2 ring-going/40"
                : "border-2 border-going/50 bg-background text-going hover:bg-going/10"
            )}
          >
            {!isLoggedIn && <Lock className="h-4 w-4 shrink-0" aria-hidden />}
            <CheckCircle2 className="h-4 w-4" />
            Going · {optimistic.goingCount}
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleClick("INTERESTED")}
            title={!isLoggedIn ? "Sign in to mark your attendance" : undefined}
            className={cn(
              "inline-flex min-h-[44px] min-w-[140px] items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-all disabled:opacity-50",
              isInterested
                ? "bg-interested text-interested-foreground shadow-md ring-2 ring-interested/40"
                : "border-2 border-interested/50 bg-background text-interested hover:bg-interested/10"
            )}
          >
            {!isLoggedIn && <Lock className="h-4 w-4 shrink-0" aria-hidden />}
            <Star className="h-4 w-4" />
            Interested · {optimistic.interestedCount}
          </button>
        </div>
      </div>
      <AuthRequiredModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        title="Sign in to mark attendance"
        description="Create an account or sign in to mark Going or Interested."
        callbackUrl={callbackUrl}
      />
    </>
  );
}
