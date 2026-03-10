import { requireApiAdmin } from "@/lib/api-auth";
import { apiError, apiValidationError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { venueSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireApiAdmin();
    if (error) return error;

    const { id } = await params;
    const body = await request.json();
    const parsed = venueSchema.safeParse(body);

    if (!parsed.success) {
      return apiValidationError(parsed.error.flatten().fieldErrors);
    }

    const venue = await db.venue.update({
      where: { id },
      data: {
        ...parsed.data,
        neighborhood: parsed.data.neighborhood || null,
        parkingNotes: parsed.data.parkingNotes || null,
      },
    });

    return NextResponse.json(venue);
  } catch (err) {
    console.error("[PUT /api/admin/venues/:id]", err);
    return apiError("Internal server error", 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireApiAdmin();
    if (error) return error;

    const { id } = await params;
    await db.venue.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("[DELETE /api/admin/venues/:id]", err);
    return apiError("Internal server error", 500);
  }
}
