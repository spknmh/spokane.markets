"use client";

import * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

const PHOTON_API = "https://photon.komoot.io/api/";

export type AddressResult = {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lng: number;
};

interface AddressAutocompleteProps {
  onSelect: (address: AddressResult) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Bounding box to bias results: [minLng, minLat, maxLng, maxLat] */
  bbox?: [number, number, number, number];
}

function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), ms);
  };
}

type PhotonFeature = {
  type: string;
  geometry?: { type: string; coordinates?: number[] };
  properties?: Record<string, string>;
};

function parsePhotonFeature(f: PhotonFeature): AddressResult | null {
  const coords = f.geometry?.type === "Point" ? f.geometry.coordinates : null;
  if (!coords || coords.length < 2) return null;
  const [lng, lat] = coords;
  const p = (f.properties || {}) as Record<string, string | undefined>;
  const street = [p.street, p.housenumber].filter(Boolean).join(" ") || p.name || "";
  const city = p.city || p.locality || p.county || "";
  const state = p.state || "";
  const zip = p.postcode || "";
  const name = p.name || (street ? `${street}, ${city}`.trim() : city) || "Unknown";
  const address = street || p.name || "";

  return {
    name: name.trim() || "Unknown",
    address: address.trim(),
    city: city.trim(),
    state: state.trim(),
    zip: zip.trim(),
    lat,
    lng,
  };
}

function formatResultLabel(r: AddressResult): string {
  const parts = [r.address, r.city, r.state, r.zip].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : r.name;
}

export function AddressAutocomplete({
  onSelect,
  placeholder = "Search for an address...",
  disabled = false,
  className,
  bbox,
}: AddressAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AddressResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(
    debounce(async (q: string) => {
      if (!q || q.trim().length < 3) {
        setResults([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const params = new URLSearchParams({
          q: q.trim(),
          limit: "8",
          lang: "en",
        });
        if (bbox) {
          params.set("bbox", bbox.join(","));
        }
        const res = await fetch(`${PHOTON_API}?${params}`);
        if (res.ok) {
          const data = (await res.json()) as { features?: PhotonFeature[] };
          const parsed = (data.features || [])
            .map(parsePhotonFeature)
            .filter((r): r is AddressResult => r !== null);
          setResults(parsed);
        } else {
          setResults([]);
        }
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    [bbox]
  );

  useEffect(() => {
    if (query.trim().length >= 3) {
      search(query.trim());
      setOpen(true);
    } else {
      setResults([]);
      setOpen(false);
    }
  }, [query, search]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (r: AddressResult) => {
    onSelect(r);
    setQuery(formatResultLabel(r));
    setResults([]);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        onFocus={() => query.length >= 3 && setOpen(true)}
      />
      {open && (results.length > 0 || loading) && (
        <ul
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-background py-1 shadow-lg"
          role="listbox"
        >
          {loading ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">Searching...</li>
          ) : (
            results.map((r, i) => (
              <li
                key={`${r.lat}-${r.lng}-${i}`}
                role="option"
                className="cursor-pointer px-3 py-2 text-sm hover:bg-muted"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(r);
                }}
              >
                {formatResultLabel(r)}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
