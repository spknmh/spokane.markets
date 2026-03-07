"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics";

interface EventsEmptyStateTrackerProps {
  eventCount: number;
  query: string;
  dateRange: string;
  neighborhood: string;
  category: string;
  feature: string;
}

/**
 * Fires search_zero_results or filter_zero_results when events list is empty
 * and user has applied search or filters. Fires once per "search session".
 */
export function EventsEmptyStateTracker({
  eventCount,
  query,
  dateRange,
  neighborhood,
  category,
  feature,
}: EventsEmptyStateTrackerProps) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (eventCount !== 0 || firedRef.current) return;

    const hasQuery = query.trim().length > 0;
    const hasFilters =
      (dateRange && dateRange !== "all") || !!neighborhood || !!category || !!feature;

    if (!hasQuery && !hasFilters) return;

    firedRef.current = true;

    if (hasQuery) {
      const filterSummary: string[] = [];
      if (dateRange && dateRange !== "all") filterSummary.push(`date:${dateRange}`);
      if (neighborhood) filterSummary.push(`neighborhood:${neighborhood}`);
      if (category) filterSummary.push(`category:${category}`);
      if (feature) filterSummary.push(`feature:${feature}`);

      trackEvent("search_zero_results", {
        query_length: query.trim().length,
        filter_summary: filterSummary.join(",") || undefined,
      });
    } else {
      const filterParams: Record<string, string> = {};
      if (dateRange) filterParams.date_range = dateRange;
      if (neighborhood) filterParams.neighborhood = neighborhood;
      if (category) filterParams.category = category;
      if (feature) filterParams.feature = feature;

      trackEvent("filter_zero_results", filterParams);
    }
  }, [eventCount, query, dateRange, neighborhood, category, feature]);

  return null;
}
