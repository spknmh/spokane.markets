export type NeighborhoodOption = {
  value: string;
  label: string;
};

/**
 * Canonical bootstrap neighborhoods used for initial seed/migration.
 * Runtime source-of-truth is the `neighborhoods` table.
 */
export const DEFAULT_NEIGHBORHOODS: readonly NeighborhoodOption[] = [
  { label: "Downtown / Riverfront", value: "downtown" },
  { label: "Kendall Yards", value: "kendall-yards" },
  { label: "South Hill / Perry District", value: "south-hill" },
  { label: "Garland / North Monroe", value: "garland" },
  { label: "North Spokane / Mead", value: "north-spokane" },
  { label: "Spokane Valley / Millwood", value: "spokane-valley" },
  { label: "Liberty Lake", value: "liberty-lake" },
  { label: "Cheney / Airway Heights", value: "cheney" },
] as const;
