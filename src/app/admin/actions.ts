"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

async function requireAdminAction() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function deleteEvent(id: string) {
  await requireAdminAction();
  await db.event.delete({ where: { id } });
  revalidatePath("/admin/events");
}

export async function deleteVenue(id: string) {
  await requireAdminAction();
  await db.venue.delete({ where: { id } });
  revalidatePath("/admin/venues");
}

export async function deleteMarket(id: string) {
  await requireAdminAction();
  await db.market.delete({ where: { id } });
  revalidatePath("/admin/markets");
}

export async function verifyMarket(id: string) {
  await requireAdminAction();
  await db.market.update({
    where: { id },
    data: { verificationStatus: "VERIFIED" },
  });
  revalidatePath("/admin/markets");
}

export async function setMarketVerificationStatus(
  id: string,
  status: "UNVERIFIED" | "PENDING" | "VERIFIED"
) {
  await requireAdminAction();
  await db.market.update({
    where: { id },
    data: { verificationStatus: status },
  });
  revalidatePath("/admin/markets");
}

export async function updateSubmissionStatus(id: string, status: "APPROVED" | "REJECTED") {
  const session = await requireAdminAction();
  await db.submission.update({
    where: { id },
    data: { status, reviewerId: session.user.id },
  });
  revalidatePath("/admin/submissions");
}

export async function updateReviewStatus(id: string, status: "APPROVED" | "REJECTED") {
  await requireAdminAction();
  await db.review.update({
    where: { id },
    data: { status },
  });
  revalidatePath("/admin/reviews");
}

export async function updateClaimStatus(id: string, status: "APPROVED" | "REJECTED") {
  const session = await requireAdminAction();
  const claim = await db.claimRequest.update({
    where: { id },
    data: { status, reviewerId: session.user.id },
  });

  if (status === "APPROVED") {
    await db.market.update({
      where: { id: claim.marketId },
      data: {
        verificationStatus: "VERIFIED",
        ownerId: claim.userId,
      },
    });
  }

  revalidatePath("/admin/claims");
}
