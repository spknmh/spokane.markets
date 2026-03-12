import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { assertNeighborhoodSlug } from "@/lib/neighborhoods";
import { venueSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = venueSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: "Validation failed", details: parsed.error.flatten() } },
      { status: 400 }
    );
  }

  let neighborhood: string | null;
  try {
    neighborhood = await assertNeighborhoodSlug(
      parsed.data.neighborhood,
      "neighborhood"
    );
  } catch (err) {
    return NextResponse.json(
      {
        error: {
          message:
            err instanceof Error ? err.message : "Invalid neighborhood value",
        },
      },
      { status: 400 }
    );
  }

  const venue = await db.venue.create({
    data: {
      ...parsed.data,
      neighborhood,
      parkingNotes: parsed.data.parkingNotes || null,
    },
  });

  return NextResponse.json(venue, { status: 201 });
}
