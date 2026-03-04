import { auth } from "@/auth";
import { db } from "@/lib/db";
import { compare } from "bcryptjs";
import { signOut } from "@/auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const deleteAccountSchema = z.object({
  confirmation: z.literal("DELETE"),
  password: z.string().optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = deleteAccountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Type DELETE to confirm account deletion" },
      { status: 400 }
    );
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { hashedPassword: true },
  });

  if (user?.hashedPassword && parsed.data.password) {
    const valid = await compare(parsed.data.password, user.hashedPassword);
    if (!valid) {
      return NextResponse.json(
        { error: "Password is incorrect" },
        { status: 400 }
      );
    }
  } else if (user?.hashedPassword && !parsed.data.password) {
    return NextResponse.json(
      { error: "Password is required to delete your account" },
      { status: 400 }
    );
  }

  await db.user.delete({
    where: { id: session.user.id },
  });

  await signOut({ redirect: false });

  return NextResponse.json({ success: true });
}
