"use client";

import { useEffect, useRef } from "react";
import type { AnalyticsParams } from "@/lib/analytics";
import { trackEvent } from "@/lib/analytics";

interface TrackEventOnMountProps {
  eventName: string;
  params?: AnalyticsParams;
}

export function TrackEventOnMount({
  eventName,
  params,
}: TrackEventOnMountProps) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    trackEvent(eventName, params);
  }, [eventName, params]);

  return null;
}
