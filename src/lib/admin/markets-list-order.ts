import type { Prisma } from "@prisma/client";

export const ADMIN_MARKETS_SORT_FIELDS = [
  "name",
  "baseArea",
  "owner",
  "verificationStatus",
  "managed",
  "events",
] as const;

export type AdminMarketsSortField = (typeof ADMIN_MARKETS_SORT_FIELDS)[number];
export type AdminMarketsSortDirection = "asc" | "desc";

function isSortField(value?: string): value is AdminMarketsSortField {
  return ADMIN_MARKETS_SORT_FIELDS.includes(value as AdminMarketsSortField);
}

function isSortDirection(value?: string): value is AdminMarketsSortDirection {
  return value === "asc" || value === "desc";
}

export function parseAdminMarketsSort({
  sort,
  dir,
}: {
  sort?: string;
  dir?: string;
}): { sort: AdminMarketsSortField; dir: AdminMarketsSortDirection } {
  const parsedSort: AdminMarketsSortField = isSortField(sort) ? sort : "name";
  const parsedDir: AdminMarketsSortDirection = isSortDirection(dir) ? dir : "asc";
  return { sort: parsedSort, dir: parsedDir };
}

export function buildAdminMarketsOrderBy({
  sort,
  dir,
}: {
  sort: AdminMarketsSortField;
  dir: AdminMarketsSortDirection;
}): Prisma.MarketOrderByWithRelationInput[] {
  const primary: Prisma.MarketOrderByWithRelationInput =
    sort === "baseArea"
      ? { baseArea: dir }
      : sort === "owner"
        ? { owner: { name: dir } }
        : sort === "verificationStatus"
          ? { verificationStatus: dir }
          : sort === "managed"
            ? { ownerId: dir }
            : sort === "events"
              ? { events: { _count: dir } }
              : { name: dir };
  return [primary, { id: "asc" }];
}
