import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/api-auth";
import { apiError, apiValidationError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { marketingTagSchema } from "@/lib/validations/marketing";

export async function GET() {
  try {
    const { error } = await requireApiAdmin();
    if (error) return error;
    const tags = await db.marketingTag.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ tags });
  } catch (err) {
    console.error("[GET /api/admin/marketing/tags]", err);
    return apiError("Internal server error", 500);
  }
}

export async function POST(request: Request) {
  try {
    const { error } = await requireApiAdmin();
    if (error) return error;
    const body = await request.json();
    const parsed = marketingTagSchema.safeParse(body);
    if (!parsed.success) {
      return apiValidationError(parsed.error.flatten().fieldErrors);
    }
    const tag = await db.marketingTag.upsert({
      where: { name: parsed.data.name.trim() },
      create: {
        name: parsed.data.name.trim(),
        color: parsed.data.color?.trim() || null,
      },
      update: {
        color: parsed.data.color?.trim() || null,
      },
    });
    return NextResponse.json(tag, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/marketing/tags]", err);
    return apiError("Internal server error", 500);
  }
}
