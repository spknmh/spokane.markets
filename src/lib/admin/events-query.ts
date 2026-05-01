import type { EventStatus, Prisma } from "@prisma/client";

export type AdminEventsTimeScope = "active" | "past" | "all_records";

export function resolveAdminEventsTimeScope({
  archived,
  past,
}: {
  archived: boolean;
  past: boolean;
}): AdminEventsTimeScope {
  if (archived) return "all_records";
  if (past) return "past";
  return "active";
}

export interface BuildAdminEventsWhereOptions {
  statusFilter?: EventStatus;
  timeScope: AdminEventsTimeScope;
  q: string;
  // Injected for determinism in tests and to keep `count` and `findMany`
  // consistent within a single request.
  now: Date;
}

// Admin "Events" list filter.
//
// Default (archived=false): hide events that are archived, where "archived" means:
//   - soft-deleted (deletedAt IS NOT NULL), OR
//   - past (endDate < now)
//
// archived=true: include all events regardless of deletedAt or endDate so
// operators can find historical events for editing or restoration.
export function buildAdminEventsWhere(
  options: BuildAdminEventsWhereOptions,
): Prisma.EventWhereInput {
  const { statusFilter, timeScope, q, now } = options;

  const where: Prisma.EventWhereInput = {};

  if (statusFilter) {
    where.status = statusFilter;
  }

  if (timeScope === "active") {
    where.deletedAt = null;
    where.endDate = { gte: now };
  } else if (timeScope === "past") {
    where.deletedAt = null;
    where.endDate = { lt: now };
  }

  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
      { venue: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  return where;
}

// CSV export uses a smaller search surface (no venue join) and reuses the
// same archive semantics. Splitting the OR keeps the contains-list aligned
// with what the export already supported.
export function buildAdminEventsExportWhere(
  options: BuildAdminEventsWhereOptions,
): Prisma.EventWhereInput {
  const where = buildAdminEventsWhere(options);
  if (where.OR && options.q) {
    where.OR = [
      { title: { contains: options.q, mode: "insensitive" } },
      { slug: { contains: options.q, mode: "insensitive" } },
    ];
  }
  return where;
}
