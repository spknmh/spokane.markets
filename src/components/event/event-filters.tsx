"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { DATE_FILTERS, NEIGHBORHOODS } from "@/lib/constants";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { trackEvent } from "@/lib/analytics";

type TagOption = { id: string; name: string; slug: string };
type FeatureOption = { id: string; name: string; slug: string; icon: string | null };

interface EventFiltersProps {
  tags: TagOption[];
  features: FeatureOption[];
}

export function EventFilters({ tags, features }: EventFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeDateRange = searchParams.get("dateRange") ?? "all";
  const activeNeighborhood = searchParams.get("neighborhood") ?? "";
  const activeCategory = searchParams.get("category") ?? "";
  const activeFeature = searchParams.get("feature") ?? "";
  const activeQuery = searchParams.get("q") ?? "";
  const [queryInput, setQueryInput] = useState(activeQuery);

  useEffect(() => {
    setQueryInput(activeQuery);
  }, [activeQuery]);

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }

      const dateRange = params.get("dateRange") ?? "";
      const neighborhood = params.get("neighborhood") ?? "";
      const category = params.get("category") ?? "";
      const feature = params.get("feature") ?? "";
      const query = params.get("q") ?? "";

      if (key === "q") {
        trackEvent("search_events", {
          query_length: query.length,
          has_date: !!(dateRange && dateRange !== "all"),
          has_neighborhood: !!neighborhood,
          has_category: !!category,
          has_feature: !!feature,
        });
      } else {
        const filterParams: Record<string, string> = {};
        if (dateRange) filterParams.date_range = dateRange;
        if (neighborhood) filterParams.neighborhood = neighborhood;
        if (category) filterParams.category = category;
        if (feature) filterParams.feature = feature;
        trackEvent("filter_applied", filterParams);
      }

      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="space-y-1.5">
        <Label htmlFor="filter-search" className="text-sm font-medium text-muted-foreground">
          Search
        </Label>
        <Input
          id="filter-search"
          type="search"
          placeholder="Search events..."
          value={queryInput}
          onChange={(e) => setQueryInput(e.target.value)}
          onBlur={() => {
            if (queryInput !== activeQuery) {
              updateFilter("q", queryInput);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (queryInput !== activeQuery) {
                updateFilter("q", queryInput);
              }
            }
          }}
          className="h-9"
        />
      </div>

      {/* Date Range */}
      <div className="space-y-1.5">
        <Label htmlFor="filter-date" className="text-sm font-medium text-muted-foreground">
          When
        </Label>
        <Select
          id="filter-date"
          value={activeDateRange}
          onChange={(e) => updateFilter("dateRange", e.target.value)}
        >
          {DATE_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </Select>
      </div>

      {/* Neighborhoods */}
      <div className="space-y-1.5">
        <Label htmlFor="filter-neighborhood" className="text-sm font-medium text-muted-foreground">
          Neighborhood
        </Label>
        <Select
          id="filter-neighborhood"
          value={activeNeighborhood}
          onChange={(e) => updateFilter("neighborhood", e.target.value)}
        >
          <option value="">All neighborhoods</option>
          {NEIGHBORHOODS.map((n) => (
            <option key={n.value} value={n.value}>
              {n.label}
            </option>
          ))}
        </Select>
      </div>

      {/* Categories */}
      <div className="space-y-1.5">
        <Label htmlFor="filter-category" className="text-sm font-medium text-muted-foreground">
          Category
        </Label>
        <Select
          id="filter-category"
          value={activeCategory}
          onChange={(e) => updateFilter("category", e.target.value)}
        >
          <option value="">All categories</option>
          {tags.map((tag) => (
            <option key={tag.id} value={tag.slug}>
              {tag.name}
            </option>
          ))}
        </Select>
      </div>

      {/* Features */}
      <div className="space-y-1.5">
        <Label htmlFor="filter-feature" className="text-sm font-medium text-muted-foreground">
          Feature
        </Label>
        <Select
          id="filter-feature"
          value={activeFeature}
          onChange={(e) => updateFilter("feature", e.target.value)}
        >
          <option value="">All features</option>
          {features.map((feat) => (
            <option key={feat.id} value={feat.slug}>
              {[feat.icon, feat.name].filter(Boolean).join(" ")}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
