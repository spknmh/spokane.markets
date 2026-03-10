"use client";

import { useEffect, useRef } from "react";
import type { AnalyticsParams } from "@/lib/analytics";
import { trackEvent } from "@/lib/analytics";

interface UseAbandonTrackingOptions {
  eventName: string;
  isDirty: boolean;
  isComplete: boolean;
  enabled?: boolean;
  params?: AnalyticsParams;
}

export function useAbandonTracking({
  eventName,
  isDirty,
  isComplete,
  enabled = true,
  params,
}: UseAbandonTrackingOptions): void {
  const firedRef = useRef(false);
  const paramsRef = useRef<AnalyticsParams | undefined>(params);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    if (!enabled || isComplete) {
      firedRef.current = false;
      return;
    }

    const fire = () => {
      if (!isDirty || isComplete || firedRef.current) return;
      firedRef.current = true;
      trackEvent(eventName, paramsRef.current);
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        fire();
      }
    };

    window.addEventListener("beforeunload", fire);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", fire);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [enabled, eventName, isComplete, isDirty]);
}
