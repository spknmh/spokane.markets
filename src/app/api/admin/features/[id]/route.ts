import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { featureSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (session.user.role !== "ADMIN") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireAdmin();
  if ("error" in result && result.error) return result.error;

  const { id } = await params;
  const body = await request.json();
  const parsed = featureSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: "Validation failed", details: parsed.error.flatten() } },
      { status: 400 }
    );
  }

  const feature = await db.feature.update({
    where: { id },
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      icon: parsed.data.icon || null,
    },
  });
  return NextResponse.json(feature);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireAdmin();
  if ("error" in result && result.error) return result.error;

  const { id } = await params;
  await db.feature.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
