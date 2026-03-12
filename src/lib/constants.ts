/** DBA (display name) used across the site. */
export const SITE_NAME = "Spokane Markets";

/** Legal entity for Terms, Privacy, copyright. */
export const LEGAL_ENTITY = "Spokane Market Hive, LLC";

/** Legal entity with DBA for formal legal text. */
export const LEGAL_ENTITY_WITH_DBA = "Spokane Market Hive, LLC, doing business as Spokane Markets";

export const DATE_FILTERS = [
  { label: "Today", value: "today" },
  { label: "This Weekend", value: "weekend" },
  { label: "Next 7 Days", value: "week" },
  { label: "2–4 Weeks Out", value: "plan-ahead" },
  { label: "This Month", value: "month" },
  { label: "All Upcoming", value: "all" },
] as const;

export type DateFilterValue = (typeof DATE_FILTERS)[number]["value"];
