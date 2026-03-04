import { auth } from "@/auth";
import { db } from "@/lib/db";
import { tagSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (session.user.role !== "ADMIN") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session };
}

export async function GET() {
  const result = await requireAdmin();
  if ("error" in result && result.error) return result.error;

  const tags = await db.tag.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { events: true } } },
  });
  return NextResponse.json(tags);
}

export async function POST(request: Request) {
  const result = await requireAdmin();
  if ("error" in result && result.error) return result.error;

  const body = await request.json();
  const parsed = tagSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: "Validation failed", details: parsed.error.flatten() } },
      { status: 400 }
    );
  }

  const tag = await db.tag.create({
    data: { name: parsed.data.name, slug: parsed.data.slug },
  });
  return NextResponse.json(tag, { status: 201 });
}
