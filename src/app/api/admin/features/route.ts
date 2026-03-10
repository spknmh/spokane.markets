import { requireApiAdmin } from "@/lib/api-auth";
import { apiError, apiValidationError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { featureSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { session, error } = await requireApiAdmin();
    if (error) return error;

    const features = await db.feature.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { events: true } } },
    });
    return NextResponse.json(features);
  } catch (err) {
    console.error("[GET /api/admin/features]", err);
    return apiError("Internal server error", 500);
  }
}

export async function POST(request: Request) {
  try {
    const { session, error } = await requireApiAdmin();
    if (error) return error;

    const body = await request.json();
    const parsed = featureSchema.safeParse(body);
    if (!parsed.success) {
      return apiValidationError(parsed.error.flatten().fieldErrors);
    }

    const feature = await db.feature.create({
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        icon: parsed.data.icon || null,
      },
    });
    return NextResponse.json(feature, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/features]", err);
    return apiError("Internal server error", 500);
  }
}
