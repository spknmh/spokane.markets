import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/api-auth";
import { apiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import {
  DEFAULT_ADMIN_PERMISSION_MATRIX,
  normalizePermissionMatrix,
} from "@/lib/admin/permissions";
import { logAudit } from "@/lib/audit";

const PERMISSIONS_KEY = "admin_permissions_matrix";

export async function GET() {
  try {
    const { error } = await requireApiAdmin();
    if (error) return error;
    const row = await db.siteConfig.findUnique({
      where: { key: PERMISSIONS_KEY },
    });
    if (!row) return NextResponse.json(DEFAULT_ADMIN_PERMISSION_MATRIX);
    const parsed = JSON.parse(row.value) as unknown;
    return NextResponse.json(normalizePermissionMatrix(parsed));
  } catch (err) {
    console.error("[GET /api/admin/permissions]", err);
    return apiError("Internal server error", 500);
  }
}

export async function PUT(request: Request) {
  try {
    const { session, error } = await requireApiAdmin();
    if (error) return error;
    const body = await request.json();
    const matrix = normalizePermissionMatrix(body);

    const previous = await db.siteConfig.findUnique({
      where: { key: PERMISSIONS_KEY },
    });
    await db.siteConfig.upsert({
      where: { key: PERMISSIONS_KEY },
      create: { key: PERMISSIONS_KEY, value: JSON.stringify(matrix) },
      update: { value: JSON.stringify(matrix) },
    });
    await logAudit(session.user.id, "UPDATE_ADMIN_PERMISSION_MATRIX", "SITE_CONFIG", PERMISSIONS_KEY, {
      previousValue: previous?.value ? JSON.parse(previous.value) : null,
      newValue: matrix,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PUT /api/admin/permissions]", err);
    return apiError("Internal server error", 500);
  }
}

