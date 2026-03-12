import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/api-auth";
import { apiError, apiValidationError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { neighborhoodSchema } from "@/lib/validations";

export async function GET() {
  try {
    const { error } = await requireApiAdmin();
    if (error) return error;

    const neighborhoods = await db.neighborhood.findMany({
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
      include: {
        _count: {
          select: {
            markets: true,
            venues: true,
          },
        },
      },
    });
    return NextResponse.json(neighborhoods);
  } catch (err) {
    console.error("[GET /api/admin/neighborhoods]", err);
    return apiError("Internal server error", 500);
  }
}

export async function POST(request: Request) {
  try {
    const { error } = await requireApiAdmin();
    if (error) return error;

    const body = await request.json();
    const parsed = neighborhoodSchema.safeParse(body);
    if (!parsed.success) {
      return apiValidationError(parsed.error.flatten().fieldErrors);
    }

    const created = await db.neighborhood.create({
      data: {
        label: parsed.data.label,
        slug: parsed.data.slug,
        sortOrder: parsed.data.sortOrder,
        isActive: parsed.data.isActive,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/neighborhoods]", err);
    return apiError("Internal server error", 500);
  }
}
