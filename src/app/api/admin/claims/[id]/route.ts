import { z } from "zod";
import { requireApiAdmin } from "@/lib/api-auth";
import { apiError, apiValidationError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";
import { evaluateAndGrantBadges } from "@/lib/badges";
import { NextResponse } from "next/server";

const patchClaimSchema = z.object({
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
    const parsed = patchClaimSchema.safeParse(body);
    if (!parsed.success) {
      return apiValidationError(parsed.error.flatten().fieldErrors);
    }

    const { status } = parsed.data;

    const claim = await db.claimRequest.update({
      where: { id },
      data: {
        status,
        reviewerId: session.user.id,
      },
      include: { market: true },
    });

    if (status === "APPROVED") {
      await db.market.update({
        where: { id: claim.marketId },
        data: {
          verificationStatus: "VERIFIED",
          ownerId: claim.userId,
        },
      });
      evaluateAndGrantBadges(claim.userId).catch(() => {});
      await createNotification({
        userId: claim.userId,
        type: "CLAIM_APPROVED",
        title: `Your claim for ${claim.market.name} was approved`,
        link: `/markets/${claim.market.slug}`,
        objectType: "market",
        objectId: claim.marketId,
        metadata: { marketName: claim.market.name },
      });
    } else {
      await createNotification({
        userId: claim.userId,
        type: "CLAIM_REJECTED",
        title: `Your claim for ${claim.market.name} was rejected`,
        link: `/markets/${claim.market.slug}`,
        objectType: "market",
        objectId: claim.marketId,
        metadata: { marketName: claim.market.name },
      });
    }
    await logAudit(session.user.id, "UPDATE_CLAIM_STATUS", "CLAIM", id, {
      status,
      type: "MARKET",
    });

    return NextResponse.json(claim);
  } catch (err) {
    console.error("[PATCH /api/admin/claims/:id]", err);
    return apiError("Internal server error", 500);
  }
}
