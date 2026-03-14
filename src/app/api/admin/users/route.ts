import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { adminCreateUserSchema } from "@/lib/validations";
import { requireApiAdminPermission } from "@/lib/api-auth";

export async function POST(request: Request) {
  const { error } = await requireApiAdminPermission("admin.users.manage");
  if (error) return error;

  const body = await request.json();
  const parsed = adminCreateUserSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { name, email, password, role } = parsed.data;

  const existing = await db.user.findUnique({
    where: { email },
  });
  if (existing) {
    return NextResponse.json(
      { error: { email: ["An account with this email already exists"] } },
      { status: 409 }
    );
  }

  const signUpResult = await auth.api.signUpEmail({
    body: { name, email, password },
  });

  if (!signUpResult?.user) {
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }

  const user = await db.user.update({
    where: { id: signUpResult.user.id },
    data: { role, emailVerified: true },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      accountStatus: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(user);
}
