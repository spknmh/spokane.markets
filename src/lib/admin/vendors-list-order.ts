import type { Prisma } from "@prisma/client";

export const ADMIN_VENDORS_SORT_FIELDS = [
  "businessName",
  "slug",
  "specialties",
  "verificationStatus",
  "managed",
  "events",
] as const;

export type AdminVendorsSortField = (typeof ADMIN_VENDORS_SORT_FIELDS)[number];
export type AdminVendorsSortDirection = "asc" | "desc";

function isSortField(value?: string): value is AdminVendorsSortField {
  return ADMIN_VENDORS_SORT_FIELDS.includes(value as AdminVendorsSortField);
}

function isSortDirection(value?: string): value is AdminVendorsSortDirection {
  return value === "asc" || value === "desc";
}

export function parseAdminVendorsSort({
  sort,
  dir,
}: {
  sort?: string;
  dir?: string;
}): { sort: AdminVendorsSortField; dir: AdminVendorsSortDirection } {
  const parsedSort: AdminVendorsSortField = isSortField(sort) ? sort : "businessName";
  const parsedDir: AdminVendorsSortDirection = isSortDirection(dir) ? dir : "asc";
  return { sort: parsedSort, dir: parsedDir };
}

export function buildAdminVendorsOrderBy({
  sort,
  dir,
}: {
  sort: AdminVendorsSortField;
  dir: AdminVendorsSortDirection;
}): Prisma.VendorProfileOrderByWithRelationInput[] {
  const primary: Prisma.VendorProfileOrderByWithRelationInput =
    sort === "slug"
      ? { slug: dir }
      : sort === "specialties"
        ? { specialties: dir }
        : sort === "verificationStatus"
          ? { verificationStatus: dir }
          : sort === "managed"
            ? { userId: dir }
            : sort === "events"
              ? { vendorEvents: { _count: dir } }
              : { businessName: dir };
  return [primary, { id: "asc" }];
}
