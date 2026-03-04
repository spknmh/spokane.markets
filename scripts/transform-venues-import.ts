#!/usr/bin/env npx tsx
/**
 * Transforms imp.json (or similar venue JSON) into import-ready format.
 * Fills empty zip/address with defaults so venueSchema validation passes.
 *
 * Usage: npx tsx scripts/transform-venues-import.ts imp.json
 *        Writes imp-ready.json in the same directory.
 */

import { readFileSync, writeFileSync } from "fs";
import { basename, dirname, join } from "path";

const CITY_ZIP_DEFAULTS: Record<string, string> = {
  Spokane: "99201",
  "Spokane Valley": "99216",
};

function defaultZip(city: string): string {
  return CITY_ZIP_DEFAULTS[city] ?? "99201";
}

interface VenueInput {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lng: number;
  neighborhood?: string | null;
  parkingNotes?: string | null;
}

function transform(venues: VenueInput[]): VenueInput[] {
  return venues.map((v) => ({
    ...v,
    address: (v.address || "").trim() || `${v.name}, ${v.city}`,
    zip: (v.zip || "").trim().length >= 5 ? v.zip : defaultZip(v.city),
    neighborhood: v.neighborhood || undefined,
    parkingNotes: v.parkingNotes || undefined,
  }));
}

function main() {
  const inputPath = process.argv[2] || "imp.json";
  const input = JSON.parse(readFileSync(inputPath, "utf-8"));

  const venues = Array.isArray(input.venues) ? input.venues : input;
  const transformed = transform(venues);

  const base = basename(inputPath, ".json");
  const out = join(dirname(inputPath), `${base}-ready.json`);

  const result = Array.isArray(input.venues) ? { ...input, venues: transformed } : transformed;
  writeFileSync(out, JSON.stringify(result, null, 2));
  console.log(`Wrote ${out} (${transformed.length} venues)`);
}

main();
