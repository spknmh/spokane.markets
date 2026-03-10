import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { adminCreateUserSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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
  });

  return NextResponse.json(user);
}
