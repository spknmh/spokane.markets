"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface AttendanceToggleProps {
  eventId: string;
  slug: string;
  initialGoingCount: number;
  initialInterestedCount: number;
  initialUserStatus: "GOING" | "INTERESTED" | null;
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
}: AttendanceToggleProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

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
    startTransition(async () => {
      setOptimistic(status);

      const res = await fetch(`/api/events/${slug}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, status }),
      });

      if (res.status === 401) {
        router.push("/auth/signin");
        return;
      }

      router.refresh();
    });
  }

  const isGoing = optimistic.userStatus === "GOING";
  const isInterested = optimistic.userStatus === "INTERESTED";

  return (
    <div className="mt-6 rounded-xl border border-border bg-muted/30 p-4">
      <p className="mb-3 text-sm font-medium text-foreground">
        Planning to attend? Let others know!
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={isPending}
          onClick={() => handleClick("GOING")}
          className={cn(
            "inline-flex min-w-[140px] items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-all disabled:opacity-50",
            isGoing
              ? "bg-[#15803d] text-white shadow-md ring-2 ring-[#15803d]/40"
              : "border-2 border-[#15803d]/50 bg-white text-[#15803d] hover:bg-[#15803d]/10"
          )}
        >
          <CheckCircle2 className="h-4 w-4" />
          Going · {optimistic.goingCount}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => handleClick("INTERESTED")}
          className={cn(
            "inline-flex min-w-[140px] items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-all disabled:opacity-50",
            isInterested
              ? "bg-[#d97706] text-white shadow-md ring-2 ring-[#d97706]/40"
              : "border-2 border-[#d97706]/50 bg-white text-[#d97706] hover:bg-[#d97706]/10"
          )}
        >
          <Star className="h-4 w-4" />
          Interested · {optimistic.interestedCount}
        </button>
      </div>
    </div>
  );
}
