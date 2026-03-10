import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

const BACKUP_DIR = join(process.cwd(), "uploads", "backups");

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { filename } = await params;
  if (!filename || !/^backup-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.json$/.test(filename)) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  try {
    const filePath = join(BACKUP_DIR, filename);
    const content = await readFile(filePath, "utf-8");
    return new NextResponse(content, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Backup not found" }, { status: 404 });
  }
}
