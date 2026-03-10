import { z } from "zod";
import { requireApiAdmin } from "@/lib/api-auth";
import { apiError, apiValidationError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";
import { NextResponse } from "next/server";

const patchApplicationSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  notes: z.string().optional(),
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
    const parsed = patchApplicationSchema.safeParse(body);
    if (!parsed.success) {
      return apiValidationError(parsed.error.flatten().fieldErrors);
    }

    const { status, notes } = parsed.data;

    const application = await db.$transaction(async (tx) => {
      const app = await tx.application.update({
        where: { id },
        data: {
          status,
          notes: notes ?? undefined,
          reviewedAt: new Date(),
          reviewedBy: session.user.id,
        },
        include: {
          form: { select: { type: true } },
        },
      });

      if (status === "APPROVED" && app.userId) {
        const newRole = app.form.type === "VENDOR" ? "VENDOR" : "ORGANIZER";
        await tx.user.update({
          where: { id: app.userId },
          data: { role: newRole },
        });
      }

      return app;
    });

    if (status === "APPROVED" && application.userId) {
      const newRole = application.form.type === "VENDOR" ? "VENDOR" : "ORGANIZER";
      await logAudit(
        session.user.id,
        "APPROVE_APPLICATION",
        "APPLICATION",
        id,
        { email: application.email, newRole }
      );
    } else {
      await logAudit(
        session.user.id,
        status === "APPROVED" ? "APPROVE_APPLICATION" : "REJECT_APPLICATION",
        "APPLICATION",
        id,
        { email: application.email }
      );
    }

    if (application.userId) {
      const statusText = status === "APPROVED" ? "approved" : "rejected";
      await createNotification(
        application.userId,
        "APPLICATION_STATUS",
        `Your ${application.form.type.toLowerCase()} application has been ${statusText}`,
        null,
        `/dashboard`
      );
    }

    return NextResponse.json(application);
  } catch (err) {
    console.error("[PATCH /api/admin/applications/:id]", err);
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
    await db.application.delete({ where: { id } });

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("[DELETE /api/admin/applications/:id]", err);
    return apiError("Internal server error", 500);
  }
}
