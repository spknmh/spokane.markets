import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const mediaUpdateSchema = z.object({
  target: z.enum(["avatar", "banner"]),
  imageUrl: z.string().min(1, "Image URL is required"),
  focalX: z.number().int().min(0).max(100).optional(),
  focalY: z.number().int().min(0).max(100).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const vendor = await db.vendorProfile.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, userId: true },
    });

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    const isAdmin = session.user.role === "ADMIN";
    const isOwner = vendor.userId === session.user.id;
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = mediaUpdateSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Validation failed";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const focalX = parsed.data.focalX ?? 50;
    const focalY = parsed.data.focalY ?? 50;
    const data =
      parsed.data.target === "avatar"
        ? {
            imageUrl: parsed.data.imageUrl,
            imageFocalX: focalX,
            imageFocalY: focalY,
          }
        : {
            heroImageUrl: parsed.data.imageUrl,
            heroImageFocalX: focalX,
            heroImageFocalY: focalY,
          };

    const updated = await db.vendorProfile.update({
      where: { id: vendor.id },
      data,
      select: {
        id: true,
        imageUrl: true,
        imageFocalX: true,
        imageFocalY: true,
        heroImageUrl: true,
        heroImageFocalX: true,
        heroImageFocalY: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PATCH /api/vendor/media/:id]", error);
    return NextResponse.json(
      { error: "Failed to update vendor media" },
      { status: 500 }
    );
  }
}
