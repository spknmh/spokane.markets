"use client";

import { useCallback, useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics";

interface UsePageDurationOptions {
  /** Only fire if seconds_elapsed >= minSeconds (avoids noise) */
  minSeconds?: number;
}

/**
 * Tracks time-on-page. Fires when user leaves (visibilitychange or beforeunload).
 * Use on maintenance, 404, unauthorized, error, landing.
 */
export function usePageDuration(
  eventName: string,
  options?: UsePageDurationOptions
): void {
  const startRef = useRef<number>(0);
  const firedRef = useRef(false);
  const minSeconds = options?.minSeconds ?? 0;

  const fire = useCallback(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    const secondsElapsed = Math.round((Date.now() - startRef.current) / 1000);
    if (secondsElapsed >= minSeconds) {
      trackEvent(eventName, { seconds_elapsed: secondsElapsed });
    }
  }, [eventName, minSeconds]);

  useEffect(() => {
    if (startRef.current === 0) startRef.current = Date.now();

    const onVisibilityChange = () => {
      if (document.hidden) fire();
    };

    const onBeforeUnload = () => {
      fire();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [eventName, minSeconds, fire]);
}
