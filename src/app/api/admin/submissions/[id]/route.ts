import { z } from "zod";
import { requireApiAdmin } from "@/lib/api-auth";
import { apiError, apiValidationError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";
import { NextResponse } from "next/server";

const patchSubmissionSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
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
    const parsed = patchSubmissionSchema.safeParse(body);
    if (!parsed.success) {
      return apiValidationError(parsed.error.flatten().fieldErrors);
    }

    const submission = await db.submission.update({
      where: { id },
      data: {
        status: parsed.data.status,
        reviewerId: session.user.id,
      },
    });

    const user = await db.user.findUnique({
      where: { email: submission.submitterEmail },
      select: { id: true },
    });
    if (user) {
      const title =
        parsed.data.status === "APPROVED"
          ? "Your event submission was approved"
          : "Your event submission was rejected";
      const link = parsed.data.status === "APPROVED" ? "/events" : "/submit";
      await createNotification({
        userId: user.id,
        type: parsed.data.status === "APPROVED" ? "SUBMISSION_APPROVED" : "SUBMISSION_REJECTED",
        title,
        link,
        objectType: "submission",
      });
    }
    await logAudit(session.user.id, "UPDATE_SUBMISSION_STATUS", "SUBMISSION", id, {
      status: parsed.data.status,
    });

    return NextResponse.json(submission);
  } catch (err) {
    console.error("[PATCH /api/admin/submissions/:id]", err);
    return apiError("Internal server error", 500);
  }
}
