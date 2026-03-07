"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";
import { useScrollDepth } from "@/hooks/use-scroll-depth";

interface TrackEventViewProps {
  eventId: string;
  category?: string;
  neighborhood?: string;
}

interface TrackMarketViewProps {
  marketId: string;
  neighborhood?: string;
}

interface TrackVendorViewProps {
  vendorId: string;
  category?: string;
}

export function TrackEventView({ eventId, category, neighborhood }: TrackEventViewProps) {
  useScrollDepth("scroll_depth");

  useEffect(() => {
    trackEvent("event_view", {
      event_id: eventId,
      category: category ?? undefined,
      neighborhood: neighborhood ?? undefined,
    });
  }, [eventId, category, neighborhood]);
  return null;
}

export function TrackMarketView({ marketId, neighborhood }: TrackMarketViewProps) {
  useScrollDepth("scroll_depth");

  useEffect(() => {
    trackEvent("market_view", {
      market_id: marketId,
      neighborhood: neighborhood ?? undefined,
    });
  }, [marketId, neighborhood]);
  return null;
}

export function TrackVendorView({ vendorId, category }: TrackVendorViewProps) {
  useScrollDepth("scroll_depth");

  useEffect(() => {
    trackEvent("vendor_view", {
      vendor_id: vendorId,
      category: category ?? undefined,
    });
  }, [vendorId, category]);
  return null;
}
