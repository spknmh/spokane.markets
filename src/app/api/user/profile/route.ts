import { auth } from "@/auth";
import { db } from "@/lib/db";
import { userProfilePatchSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = userProfilePatchSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: first?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const data: { name?: string; image?: string | null } = {};
  if (parsed.data.name !== undefined) {
    data.name = parsed.data.name;
  }
  if (parsed.data.image !== undefined) {
    data.image = parsed.data.image;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const user = await db.user.update({
    where: { id: session.user.id! },
    data,
  });

  return NextResponse.json(user);
}
