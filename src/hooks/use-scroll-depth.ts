"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics";

const DEFAULT_THRESHOLDS = [25, 50, 75, 100];

/**
 * Tracks scroll depth. Fires once per threshold when user scrolls past it.
 * Use on event detail, market detail, vendor profile, homepage.
 */
export function useScrollDepth(
  eventName: string,
  thresholds: number[] = DEFAULT_THRESHOLDS
): void {
  const firedRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;

      const percent = Math.round((scrollTop / docHeight) * 100);

      for (const thresh of thresholds) {
        if (percent >= thresh && !firedRef.current.has(thresh)) {
          firedRef.current.add(thresh);
          trackEvent(eventName, {
            depth: thresh,
            page_path: typeof window !== "undefined" ? window.location.pathname : "",
          });
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [eventName, thresholds]);
}
