"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

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
  useEffect(() => {
    trackEvent("market_view", {
      market_id: marketId,
      neighborhood: neighborhood ?? undefined,
    });
  }, [marketId, neighborhood]);
  return null;
}

export function TrackVendorView({ vendorId, category }: TrackVendorViewProps) {
  useEffect(() => {
    trackEvent("vendor_view", {
      vendor_id: vendorId,
      category: category ?? undefined,
    });
  }, [vendorId, category]);
  return null;
}
