"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface MarketsSearchProps {
  defaultValue?: string;
}

export function MarketsSearch({ defaultValue = "" }: MarketsSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeQuery = searchParams.get("q") ?? "";
  const [queryInput, setQueryInput] = useState(activeQuery || defaultValue);

  useEffect(() => {
    setQueryInput(activeQuery || defaultValue);
  }, [activeQuery, defaultValue]);

  const updateFilter = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) {
        params.set("q", value.trim());
      } else {
        params.delete("q");
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  return (
    <div className="space-y-1.5">
      <Label htmlFor="markets-search" className="text-sm font-medium text-muted-foreground">
        Search markets
      </Label>
      <Input
        id="markets-search"
        type="search"
        placeholder="Search by name or description..."
        value={queryInput}
        onChange={(e) => setQueryInput(e.target.value)}
        onBlur={() => {
          if (queryInput !== activeQuery) {
            updateFilter(queryInput);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (queryInput !== activeQuery) {
              updateFilter(queryInput);
            }
          }
        }}
        className="max-w-md"
      />
    </div>
  );
}
