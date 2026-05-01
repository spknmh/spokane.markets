import type { Prisma } from "@prisma/client";
import type { AdminEventsTimeScope } from "@/lib/admin/events-query";

export const ADMIN_EVENTS_SORT_FIELDS = ["title", "startDate", "venue", "status"] as const;
export type AdminEventsSortField = (typeof ADMIN_EVENTS_SORT_FIELDS)[number];
export type AdminEventsSortDirection = "asc" | "desc";

function isSortField(value?: string): value is AdminEventsSortField {
  return ADMIN_EVENTS_SORT_FIELDS.includes(value as AdminEventsSortField);
}

function isSortDirection(value?: string): value is AdminEventsSortDirection {
  return value === "asc" || value === "desc";
}

function defaultDirection(sort: AdminEventsSortField, timeScope: AdminEventsTimeScope): AdminEventsSortDirection {
  if (sort === "startDate") {
    return timeScope === "active" ? "asc" : "desc";
  }
  return "asc";
}

export function parseAdminEventsSort({
  sort,
  dir,
  timeScope,
}: {
  sort?: string;
  dir?: string;
  timeScope: AdminEventsTimeScope;
}): { sort: AdminEventsSortField; dir: AdminEventsSortDirection } {
  const parsedSort: AdminEventsSortField = isSortField(sort) ? sort : "startDate";
  const parsedDir = isSortDirection(dir) ? dir : defaultDirection(parsedSort, timeScope);
  return { sort: parsedSort, dir: parsedDir };
}

export function buildAdminEventsOrderBy({
  sort,
  dir,
}: {
  sort: AdminEventsSortField;
  dir: AdminEventsSortDirection;
}): Prisma.EventOrderByWithRelationInput[] {
  const primary: Prisma.EventOrderByWithRelationInput =
    sort === "venue"
      ? { venue: { name: dir } }
      : sort === "title"
        ? { title: dir }
        : sort === "status"
          ? { status: dir }
          : { startDate: dir };
  return [primary, { id: "asc" }];
}
