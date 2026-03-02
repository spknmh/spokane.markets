"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { DATE_FILTERS, NEIGHBORHOODS, CATEGORIES, FEATURES } from "@/lib/constants";

export function EventFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [showAllFeatures, setShowAllFeatures] = useState(false);

  const activeDateRange = searchParams.get("dateRange") ?? "weekend";
  const activeNeighborhood = searchParams.get("neighborhood") ?? "";
  const activeCategory = searchParams.get("category") ?? "";
  const activeFeature = searchParams.get("feature") ?? "";

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const current = params.get(key);
      if (current === value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  return (
    <div className="space-y-4">
      {/* Date Range */}
      <div>
        <h3 className="mb-2 text-sm font-medium text-muted-foreground">When</h3>
        <div className="flex flex-wrap gap-2">
          {DATE_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => updateFilter("dateRange", filter.value)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                activeDateRange === filter.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:bg-muted"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Neighborhoods */}
      <div>
        <h3 className="mb-2 text-sm font-medium text-muted-foreground">Neighborhood</h3>
        <div className="flex flex-wrap gap-2">
          {NEIGHBORHOODS.map((n) => (
            <button
              key={n.value}
              onClick={() => updateFilter("neighborhood", n.value)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                activeNeighborhood === n.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:bg-muted"
              )}
            >
              {n.label}
            </button>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div>
        <h3 className="mb-2 text-sm font-medium text-muted-foreground">Category</h3>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => updateFilter("category", cat.value)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                activeCategory === cat.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:bg-muted"
              )}
            >
              <span className="mr-1">{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Features (collapsible) */}
      <div>
        <div className="mb-2 flex items-center gap-2">
          <h3 className="text-sm font-medium text-muted-foreground">Features</h3>
          <button
            onClick={() => setShowAllFeatures(!showAllFeatures)}
            className="text-xs text-primary hover:underline"
          >
            {showAllFeatures ? "Show less" : "Show all"}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(showAllFeatures ? FEATURES : FEATURES.slice(0, 5)).map((feat) => (
            <button
              key={feat.value}
              onClick={() => updateFilter("feature", feat.value)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                activeFeature === feat.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:bg-muted"
              )}
            >
              <span className="mr-1">{feat.icon}</span>
              {feat.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
