import { auth } from "@/auth";
import { db } from "@/lib/db";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { hashedPassword: true },
  });

  if (!user?.hashedPassword) {
    return NextResponse.json(
      { error: "Password change not available for accounts signed in with social login" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: first?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { compare } = await import("bcryptjs");
  const valid = await compare(parsed.data.currentPassword, user.hashedPassword);
  if (!valid) {
    return NextResponse.json(
      { error: "Current password is incorrect" },
      { status: 400 }
    );
  }

  const hashedPassword = await hash(parsed.data.newPassword, 10);
  await db.user.update({
    where: { id: session.user.id },
    data: { hashedPassword },
  });

  return NextResponse.json({ success: true });
}
