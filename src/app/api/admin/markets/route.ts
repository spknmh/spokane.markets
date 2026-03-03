import { auth } from "@/auth";
import { db } from "@/lib/db";
import { marketSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = marketSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: "Validation failed", details: parsed.error.flatten() } },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const market = await db.market.create({
    data: {
      name: data.name,
      slug: data.slug,
      venueId: data.venueId,
      description: data.description || null,
      imageUrl: data.imageUrl || null,
      websiteUrl: data.websiteUrl || null,
      facebookUrl: data.facebookUrl || null,
      instagramUrl: data.instagramUrl || null,
      baseArea: data.baseArea || null,
      typicalSchedule: data.typicalSchedule || null,
      contactEmail: data.contactEmail || null,
      contactPhone: data.contactPhone || null,
    },
  });

  return NextResponse.json(market, { status: 201 });
}
