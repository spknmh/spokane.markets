import type { Prisma } from "@prisma/client";

export const ADMIN_VENUES_SORT_FIELDS = [
  "name",
  "address",
  "neighborhood",
  "events",
  "status",
] as const;

export type AdminVenuesSortField = (typeof ADMIN_VENUES_SORT_FIELDS)[number];
export type AdminVenuesSortDirection = "asc" | "desc";

function isSortField(value?: string): value is AdminVenuesSortField {
  return ADMIN_VENUES_SORT_FIELDS.includes(value as AdminVenuesSortField);
}

function isSortDirection(value?: string): value is AdminVenuesSortDirection {
  return value === "asc" || value === "desc";
}

export function parseAdminVenuesSort({
  sort,
  dir,
}: {
  sort?: string;
  dir?: string;
}): { sort: AdminVenuesSortField; dir: AdminVenuesSortDirection } {
  const parsedSort: AdminVenuesSortField = isSortField(sort) ? sort : "name";
  const parsedDir: AdminVenuesSortDirection = isSortDirection(dir) ? dir : "asc";
  return { sort: parsedSort, dir: parsedDir };
}

export function buildAdminVenuesOrderBy({
  sort,
  dir,
}: {
  sort: AdminVenuesSortField;
  dir: AdminVenuesSortDirection;
}): Prisma.VenueOrderByWithRelationInput[] {
  const primary: Prisma.VenueOrderByWithRelationInput =
    sort === "address"
      ? { address: dir }
      : sort === "neighborhood"
        ? { neighborhood: dir }
        : sort === "events"
          ? { events: { _count: dir } }
          : sort === "status"
            ? { deletedAt: dir }
            : { name: dir };
  return [primary, { id: "asc" }];
}
