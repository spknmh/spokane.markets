import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { role, sendPasswordReset } = body;

  if (sendPasswordReset) {
    const targetUser = await db.user.findUnique({
      where: { id },
      select: { email: true },
    });
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    try {
      // Use Better Auth's forget password endpoint directly
      const baseUrl = process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      const res = await fetch(`${baseUrl}/api/auth/forget-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: targetUser.email,
          redirectTo: "/auth/reset-password",
        }),
      });
      if (!res.ok) throw new Error("API call failed");
      return NextResponse.json({ success: true, message: "Password reset email sent" });
    } catch {
      return NextResponse.json(
        { error: "Failed to send password reset email" },
        { status: 500 }
      );
    }
  }

  const validRoles = ["USER", "VENDOR", "ORGANIZER", "ADMIN"];
  if (!role || !validRoles.includes(role)) {
    return NextResponse.json(
      { error: { message: "Invalid role" } },
      { status: 400 }
    );
  }

  const user = await db.user.update({
    where: { id },
    data: { role },
  });

  await logAudit(session.user.id, "UPDATE_USER_ROLE", "USER", id, {
    newRole: role,
  });

  return NextResponse.json(user);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  if (id === session.user.id) {
    return NextResponse.json(
      { error: "You cannot delete your own account" },
      { status: 400 }
    );
  }

  await db.user.delete({
    where: { id },
  });

  await logAudit(session.user.id, "DELETE_USER", "USER", id);

  return NextResponse.json({ success: true });
}
