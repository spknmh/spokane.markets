import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import type { MaintenanceMode } from "@prisma/client";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const row = await db.siteState.findUnique({
    where: { id: "default" },
  });
  if (!row) {
    return NextResponse.json({
      mode: "OFF",
      messageTitle: "We'll be right back",
      messageBody: null,
      eta: null,
    });
  }

  return NextResponse.json({
    mode: row.mode,
    messageTitle: row.messageTitle,
    messageBody: row.messageBody,
    eta: row.eta?.toISOString() ?? null,
  });
}

const MODES: MaintenanceMode[] = [
  "OFF",
  "MAINTENANCE_ADMIN_ONLY",
  "MAINTENANCE_PRIVILEGED",
];

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const mode = typeof body.mode === "string" && MODES.includes(body.mode as MaintenanceMode)
    ? (body.mode as MaintenanceMode)
    : "OFF";
  const messageTitle =
    typeof body.messageTitle === "string"
      ? body.messageTitle.trim() || "We'll be right back"
      : "We'll be right back";
  const messageBody =
    typeof body.messageBody === "string" ? body.messageBody.trim() || null : null;
  let eta: Date | null = null;
  if (body.eta != null && body.eta !== "") {
    const parsed = new Date(body.eta);
    if (!Number.isNaN(parsed.getTime())) eta = parsed;
  }

  await db.siteState.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      mode,
      messageTitle,
      messageBody,
      eta,
      updatedByUserId: session.user.id,
    },
    update: {
      mode,
      messageTitle,
      messageBody,
      eta,
      updatedByUserId: session.user.id,
    },
  });

  await logAudit(
    session.user.id,
    "UPDATE_MAINTENANCE_MODE",
    "SITE_STATE",
    "default",
    { mode, messageTitle }
  );

  revalidatePath("/");
  revalidatePath("/maintenance");

  return NextResponse.json({ ok: true });
}
