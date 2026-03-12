import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { assertNeighborhoodSlugList } from "@/lib/neighborhoods";
import { savedFilterSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const filters = await db.savedFilter.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(filters);
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = savedFilterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: "Validation failed", details: parsed.error.flatten() } },
      { status: 400 }
    );
  }

  let neighborhoods: string[];
  try {
    neighborhoods = await assertNeighborhoodSlugList(
      parsed.data.neighborhoods,
      "neighborhoods"
    );
  } catch (err) {
    return NextResponse.json(
      {
        error: {
          message:
            err instanceof Error ? err.message : "Invalid neighborhoods values",
        },
      },
      { status: 400 }
    );
  }

  const filter = await db.savedFilter.create({
    data: {
      userId: session.user.id,
      name: parsed.data.name,
      dateRange: parsed.data.dateRange ?? null,
      neighborhoods,
      categories: parsed.data.categories ?? [],
      features: parsed.data.features ?? [],
      emailAlerts: parsed.data.emailAlerts ?? false,
    },
  });

  return NextResponse.json(filter, { status: 201 });
}
