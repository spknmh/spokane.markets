import { z } from "zod";
import { requireApiAdmin } from "@/lib/api-auth";
import { apiError, apiValidationError, apiNotFound } from "@/lib/api-response";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { NextResponse } from "next/server";

const patchUserSchema = z.object({
  role: z.enum(["USER", "VENDOR", "ORGANIZER", "ADMIN"]).optional(),
  sendPasswordReset: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error } = await requireApiAdmin();
    if (error) return error;

    const { id } = await params;
    const body = await request.json();
    const parsed = patchUserSchema.safeParse(body);
    if (!parsed.success) {
      return apiValidationError(parsed.error.flatten().fieldErrors);
    }

    const { role, sendPasswordReset } = parsed.data;

    if (sendPasswordReset) {
      const targetUser = await db.user.findUnique({
        where: { id },
        select: { email: true },
      });
      if (!targetUser) {
        return apiNotFound("User");
      }
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
    }

    if (!role) {
      return apiError("Role is required when not sending password reset", 400);
    }

    const user = await db.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await logAudit(session.user.id, "UPDATE_USER_ROLE", "USER", id, {
      newRole: role,
    });

    return NextResponse.json(user);
  } catch (err) {
    console.error("[PATCH /api/admin/users/:id]", err);
    return apiError("Internal server error", 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error } = await requireApiAdmin();
    if (error) return error;

    const { id } = await params;

    if (id === session.user.id) {
      return apiError("You cannot delete your own account", 400);
    }

    await db.user.delete({ where: { id } });
    await logAudit(session.user.id, "DELETE_USER", "USER", id);

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("[DELETE /api/admin/users/:id]", err);
    return apiError("Internal server error", 500);
  }
}
