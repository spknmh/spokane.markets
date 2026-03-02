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

export const CATEGORIES = [
  { label: "Farmers Market", value: "farmers-market", icon: "🌽" },
  { label: "Craft Fair", value: "craft-fair", icon: "🎨" },
  { label: "Art Fair", value: "art-fair", icon: "🖼️" },
  { label: "Street Fair", value: "street-fair", icon: "🎪" },
  { label: "Food Festival", value: "food-festival", icon: "🍕" },
  { label: "Holiday Market", value: "holiday-market", icon: "🎄" },
  { label: "Flea Market", value: "flea-market", icon: "📦" },
  { label: "Night Market", value: "night-market", icon: "🌙" },
] as const;

export const FEATURES = [
  { label: "Indoor", value: "indoor", icon: "🏠" },
  { label: "Outdoor", value: "outdoor", icon: "☀️" },
  { label: "Food Trucks", value: "food-trucks", icon: "🚚" },
  { label: "Beer/Wine/Cider", value: "beer-wine-cider", icon: "🍺" },
  { label: "Live Music", value: "live-music", icon: "🎵" },
  { label: "Kid-Friendly", value: "kid-friendly", icon: "👶" },
  { label: "Dog-Friendly", value: "dog-friendly", icon: "🐕" },
  { label: "ADA Accessible", value: "ada-accessible", icon: "♿" },
  { label: "Free Parking", value: "free-parking", icon: "🅿️" },
  { label: "Power Available", value: "power-available", icon: "🔌" },
  { label: "Free Admission", value: "free-admission", icon: "🎟️" },
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
export type CategoryValue = (typeof CATEGORIES)[number]["value"];
export type FeatureValue = (typeof FEATURES)[number]["value"];
export type DateFilterValue = (typeof DATE_FILTERS)[number]["value"];
