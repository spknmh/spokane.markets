import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/api-auth";
import { apiError, apiValidationError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { marketingFolderSchema } from "@/lib/validations/marketing";

export async function GET() {
  try {
    const { error } = await requireApiAdmin();
    if (error) return error;
    const folders = await db.marketingFolder.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ folders });
  } catch (err) {
    console.error("[GET /api/admin/marketing/folders]", err);
    return apiError("Internal server error", 500);
  }
}

export async function POST(request: Request) {
  try {
    const { session, error } = await requireApiAdmin();
    if (error) return error;
    const body = await request.json();
    const parsed = marketingFolderSchema.safeParse(body);
    if (!parsed.success) {
      return apiValidationError(parsed.error.flatten().fieldErrors);
    }
    const folder = await db.marketingFolder.create({
      data: {
        name: parsed.data.name.trim(),
        createdById: session!.user.id,
      },
    });
    return NextResponse.json(folder, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/marketing/folders]", err);
    return apiError("Internal server error", 500);
  }
}
