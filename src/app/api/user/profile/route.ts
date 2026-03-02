import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, image } = body;

  const data: { name?: string; image?: string | null } = {};
  if (typeof name === "string" && name.trim()) {
    data.name = name.trim();
  }
  if (image !== undefined) {
    data.image = typeof image === "string" ? image : null;
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
