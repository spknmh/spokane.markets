import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { join } from "path";
import { mkdir, writeFile } from "fs/promises";
import { requireApiAdminPermission } from "@/lib/api-auth";

const BACKUP_DIR = join(process.cwd(), "uploads", "backups");

export async function POST(_request: Request) {
  const { error } = await requireApiAdminPermission("admin.system.read");
  if (error) return error;

  try {
    const [venues, markets, events] = await Promise.all([
      db.venue.findMany({ where: { deletedAt: null }, orderBy: { createdAt: "asc" } }),
      db.market.findMany({
        where: { deletedAt: null },
        include: { venue: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      }),
      db.event.findMany({
        where: { deletedAt: null },
        include: {
          venue: { select: { id: true, name: true } },
          market: { select: { id: true, name: true, slug: true } },
          tags: { select: { id: true, name: true, slug: true } },
          features: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    const backup = {
      exportedAt: new Date().toISOString(),
      venues,
      markets,
      events,
    };

    await mkdir(BACKUP_DIR, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const filename = `backup-${timestamp}.json`;
    const filePath = join(BACKUP_DIR, filename);
    await writeFile(filePath, JSON.stringify(backup, null, 2), "utf-8");

    const downloadUrl = `/api/admin/data/backup/${filename}`;
    return NextResponse.json({
      ok: true,
      url: downloadUrl,
      filename,
      counts: { venues: venues.length, markets: markets.length, events: events.length },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Export failed" },
      { status: 500 }
    );
  }
}
