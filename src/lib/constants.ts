export const NEIGHBORHOODS = [
  { label: "Downtown / Riverfront", value: "downtown" },
  { label: "Kendall Yards", value: "kendall-yards" },
  { label: "South Hill / Perry District", value: "south-hill" },
  { label: "Garland / North Monroe", value: "garland" },
  { label: "North Spokane / Mead", value: "north-spokane" },
  { label: "Spokane Valley / Millwood", value: "spokane-valley" },
  { label: "Liberty Lake", value: "liberty-lake" },
  { label: "Cheney / Airway Heights", value: "cheney" },
] as const;

export const DATE_FILTERS = [
  { label: "Today", value: "today" },
  { label: "This Weekend", value: "weekend" },
  { label: "Next 7 Days", value: "week" },
  { label: "This Month", value: "month" },
  { label: "All Upcoming", value: "all" },
] as const;

/** US timezones for event scheduling (curated list). */
export const US_TIMEZONES = [
  { label: "Pacific (Spokane)", value: "America/Los_Angeles" },
  { label: "Mountain", value: "America/Denver" },
  { label: "Central", value: "America/Chicago" },
  { label: "Eastern", value: "America/New_York" },
] as const;

export type NeighborhoodValue = (typeof NEIGHBORHOODS)[number]["value"];
export type DateFilterValue = (typeof DATE_FILTERS)[number]["value"];
