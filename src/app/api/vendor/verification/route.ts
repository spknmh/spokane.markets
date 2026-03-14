import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { requireApiAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";
import { evaluateVendorVerificationReadiness } from "@/lib/vendor-verification";

export async function POST() {
  try {
    const { session, error } = await requireApiAuth();
    if (error) return error;

    const userId = session.user.id;

    const [user, profile] = await Promise.all([
      db.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, emailVerified: true },
      }),
      db.vendorProfile.findUnique({
        where: { userId },
        select: {
          id: true,
          slug: true,
          verificationStatus: true,
          businessName: true,
          description: true,
          imageUrl: true,
          contactEmail: true,
          contactPhone: true,
          websiteUrl: true,
          facebookUrl: true,
          instagramUrl: true,
          specialties: true,
          galleryUrls: true,
        },
      }),
    ]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!profile) {
      return NextResponse.json(
        { error: "Vendor profile not found" },
        { status: 404 },
      );
    }

    if (profile.verificationStatus === "VERIFIED") {
      return NextResponse.json(
        { error: "Vendor is already verified" },
        { status: 409 },
      );
    }

    const readiness = evaluateVendorVerificationReadiness({ user, profile });
    if (!readiness.isEligible) {
      return NextResponse.json(
        {
          error: "Vendor is not eligible for verification yet",
          isEligible: false,
          profileCompletionPercent: readiness.profileCompletionPercent,
          unmetRequirements: readiness.unmetRequirements,
        },
        { status: 400 },
      );
    }

    const result = await db.$transaction(async (tx) => {
      const form = await tx.applicationForm.upsert({
        where: { type: "VENDOR_VERIFICATION" },
        update: { active: true },
        create: {
          type: "VENDOR_VERIFICATION",
          title: "Vendor Verification",
          description: "Internal workflow form for vendor verification requests.",
          fields: [] as Prisma.InputJsonValue,
          active: true,
        },
      });

      const pending = await tx.application.findFirst({
        where: { formId: form.id, userId, status: "PENDING" },
        orderBy: { createdAt: "desc" },
      });

      if (pending) {
        if (profile.verificationStatus !== "PENDING") {
          await tx.vendorProfile.update({
            where: { id: profile.id },
            data: { verificationStatus: "PENDING" },
          });
        }
        return { application: pending, alreadyPending: true };
      }

      const latest = await tx.application.findFirst({
        where: { formId: form.id, userId },
        orderBy: { createdAt: "desc" },
      });

      const answers = {
        vendorProfileId: profile.id,
        vendorSlug: profile.slug,
      } satisfies Record<string, string>;

      const application = latest
        ? await tx.application.update({
            where: { id: latest.id },
            data: {
              status: "PENDING",
              reviewedAt: null,
              reviewedBy: null,
              notes: null,
              name: user.name ?? profile.businessName,
              email: user.email,
              answers: answers as Prisma.InputJsonValue,
            },
          })
        : await tx.application.create({
            data: {
              formId: form.id,
              userId,
              status: "PENDING",
              name: user.name ?? profile.businessName,
              email: user.email,
              answers: answers as Prisma.InputJsonValue,
            },
          });

      await tx.vendorProfile.update({
        where: { id: profile.id },
        data: { verificationStatus: "PENDING" },
      });

      return { application, alreadyPending: false };
    });

    if (!result.alreadyPending) {
      await logAudit(
        userId,
        "REQUEST_VENDOR_VERIFICATION",
        "VENDOR_PROFILE",
        profile.id,
        { applicationId: result.application.id, vendorSlug: profile.slug },
      );
    }

    await createNotification({
      userId,
      type: "APPLICATION_RECEIVED",
      title: "Verification request received",
      body: "Your vendor verification request is pending review.",
      link: "/vendor/dashboard",
      objectId: result.application.id,
      objectType: "application",
    });

    return NextResponse.json({
      success: true,
      applicationId: result.application.id,
      status: result.application.status,
      alreadyPending: result.alreadyPending,
    });
  } catch (err) {
    console.error("[POST /api/vendor/verification]", err);
    return NextResponse.json(
      { error: "Failed to request verification" },
      { status: 500 },
    );
  }
}
