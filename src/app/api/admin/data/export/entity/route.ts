import { NextResponse } from "next/server";
import { requireApiAdminPermission } from "@/lib/api-auth";
import { db } from "@/lib/db";
import {
  buildAdminEventsExportWhere,
  resolveAdminEventsTimeScope,
} from "@/lib/admin/events-query";
import type { EventStatus } from "@prisma/client";

type Entity = "events" | "markets" | "vendors" | "venues";

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes("\"") || text.includes("\n")) {
    return `"${text.replaceAll("\"", "\"\"")}"`;
  }
  return text;
}

function toCsv(rows: Record<string, unknown>[]) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => csvEscape(row[h])).join(","));
  }
  return lines.join("\n");
}

export async function GET(request: Request) {
  const { error } = await requireApiAdminPermission("admin.system.read");
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const entity = searchParams.get("entity") as Entity | null;
  const q = (searchParams.get("q") ?? "").trim();
  const archived = searchParams.get("archived") === "1";
  const past = searchParams.get("past") === "1";

  if (!entity || !["events", "markets", "vendors", "venues"].includes(entity)) {
    return NextResponse.json({ error: "Invalid entity" }, { status: 400 });
  }

  let rows: Record<string, unknown>[] = [];

  if (entity === "events") {
    const status = searchParams.get("status") as EventStatus | null;
    const timeScope = resolveAdminEventsTimeScope({ archived, past });
    const data = await db.event.findMany({
      where: buildAdminEventsExportWhere({
        statusFilter: status ?? undefined,
        timeScope,
        q,
        now: new Date(),
      }),
      include: { venue: { select: { name: true } } },
      orderBy: { startDate: "desc" },
      take: 5000,
    });
    rows = data.map((item) => ({
      id: item.id,
      title: item.title,
      slug: item.slug,
      status: item.status,
      venue: item.venue.name,
      startDate: item.startDate.toISOString(),
      endDate: item.endDate.toISOString(),
      archived: item.deletedAt ? "yes" : "no",
    }));
  } else if (entity === "markets") {
    const data = await db.market.findMany({
      where: {
        ...(archived ? {} : { deletedAt: null }),
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { slug: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: { owner: { select: { email: true } } },
      orderBy: { name: "asc" },
      take: 5000,
    });
    rows = data.map((item) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      verificationStatus: item.verificationStatus,
      ownerEmail: item.owner?.email ?? "",
      archived: item.deletedAt ? "yes" : "no",
    }));
  } else if (entity === "vendors") {
    const orphaned = searchParams.get("orphaned") === "1";
    const data = await db.vendorProfile.findMany({
      where: {
        ...(orphaned ? { userId: null } : {}),
        ...(archived ? {} : { deletedAt: null }),
        ...(q
          ? {
              OR: [
                { businessName: { contains: q, mode: "insensitive" } },
                { slug: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { businessName: "asc" },
      take: 5000,
    });
    rows = data.map((item) => ({
      id: item.id,
      businessName: item.businessName,
      slug: item.slug,
      contactEmail: item.contactEmail ?? "",
      userId: item.userId ?? "",
      archived: item.deletedAt ? "yes" : "no",
    }));
  } else if (entity === "venues") {
    const data = await db.venue.findMany({
      where: {
        ...(archived ? {} : { deletedAt: null }),
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { address: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { name: "asc" },
      take: 5000,
    });
    rows = data.map((item) => ({
      id: item.id,
      name: item.name,
      address: item.address,
      city: item.city,
      neighborhood: item.neighborhood ?? "",
      archived: item.deletedAt ? "yes" : "no",
    }));
  }

  const csv = toCsv(rows);
  const fileName = `${entity}-export-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}

