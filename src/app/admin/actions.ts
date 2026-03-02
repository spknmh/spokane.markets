"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
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
  const market = await db.market.findUnique({
    where: { id },
    select: { ownerId: true, name: true, slug: true },
  });
  await db.market.update({
    where: { id },
    data: { verificationStatus: "VERIFIED" },
  });
  if (market?.ownerId) {
    await createNotification(
      market.ownerId,
      "MARKET_VERIFIED",
      `Your market ${market.name} is now verified`,
      null,
      `/markets/${market.slug}`
    );
  }
  revalidatePath("/admin/markets");
}

export async function setMarketVerificationStatus(
  id: string,
  status: "UNVERIFIED" | "PENDING" | "VERIFIED"
) {
  await requireAdminAction();
  const market = await db.market.findUnique({
    where: { id },
    select: { ownerId: true, name: true, slug: true },
  });
  await db.market.update({
    where: { id },
    data: { verificationStatus: status },
  });
  if (status === "VERIFIED" && market?.ownerId) {
    await createNotification(
      market.ownerId,
      "MARKET_VERIFIED",
      `Your market ${market.name} is now verified`,
      null,
      `/markets/${market.slug}`
    );
  }
  revalidatePath("/admin/markets");
}

export async function updateSubmissionStatus(id: string, status: "APPROVED" | "REJECTED") {
  const session = await requireAdminAction();
  const submission = await db.submission.findUnique({
    where: { id },
    select: { submitterEmail: true },
  });
  if (!submission) return;
  await db.submission.update({
    where: { id },
    data: { status, reviewerId: session.user.id },
  });
  const user = await db.user.findUnique({
    where: { email: submission.submitterEmail },
    select: { id: true },
  });
  if (user) {
    const title =
      status === "APPROVED"
        ? "Your event submission was approved"
        : "Your event submission was rejected";
    const link = status === "APPROVED" ? "/events" : "/submit";
    await createNotification(
      user.id,
      status === "APPROVED" ? "SUBMISSION_APPROVED" : "SUBMISSION_REJECTED",
      title,
      null,
      link
    );
  }
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

export async function updatePhotoStatus(id: string, status: "APPROVED" | "REJECTED") {
  await requireAdminAction();
  await db.photo.update({
    where: { id },
    data: { status },
  });
  revalidatePath("/admin/photos");
}

export async function updateClaimStatus(id: string, status: "APPROVED" | "REJECTED") {
  const session = await requireAdminAction();
  const claim = await db.claimRequest.update({
    where: { id },
    data: { status, reviewerId: session.user.id },
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
    await createNotification(
      claim.userId,
      "CLAIM_APPROVED",
      `Your claim for ${claim.market.name} was approved`,
      null,
      `/markets/${claim.market.slug}`
    );
  } else {
    await createNotification(
      claim.userId,
      "CLAIM_REJECTED",
      `Your claim for ${claim.market.name} was rejected`,
      null,
      `/markets/${claim.market.slug}`
    );
  }

  revalidatePath("/admin/claims");
}

export async function updateVendorClaimStatus(id: string, status: "APPROVED" | "REJECTED") {
  const session = await requireAdminAction();
  const claim = await db.vendorClaimRequest.findUnique({
    where: { id },
    include: { vendorProfile: { select: { businessName: true, slug: true } } },
  });
  if (!claim) return;
  await db.vendorClaimRequest.update({
    where: { id },
    data: { status, reviewerId: session.user.id },
  });
  const link = `/vendors/${claim.vendorProfile.slug}`;
  if (status === "APPROVED") {
    await db.vendorProfile.update({
      where: { id: claim.vendorProfileId },
      data: { userId: claim.userId },
    });
    await createNotification(
      claim.userId,
      "VENDOR_CLAIM_APPROVED",
      `Your claim for ${claim.vendorProfile.businessName} was approved`,
      null,
      link
    );
  } else {
    await createNotification(
      claim.userId,
      "VENDOR_CLAIM_REJECTED",
      `Your claim for ${claim.vendorProfile.businessName} was rejected`,
      null,
      link
    );
  }
  revalidatePath("/admin/claims");
}
