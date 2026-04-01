/**
 * Eligibility rules and operator-facing workflow: `docs/audits/vendor-verification.md`.
 */
import type { User, VendorProfile } from "@prisma/client";
import { computeVendorProfileCompletion } from "@/lib/vendor-profile";

export type VendorVerificationRequirementCode =
  | "EMAIL_NOT_VERIFIED"
  | "PROFILE_COMPLETION_BELOW_MINIMUM"
  | "MISSING_BUSINESS_NAME"
  | "MISSING_DESCRIPTION"
  | "MISSING_IMAGE_URL"
  | "MISSING_CONTACT_METHOD"
  | "MISSING_DISCOVERABILITY_LINK"
  | "MISSING_SPECIALTIES";

export interface VendorVerificationUnmetRequirement {
  code: VendorVerificationRequirementCode;
  message: string;
}

export interface VendorVerificationReadiness {
  isEligible: boolean;
  profileCompletionPercent: number;
  unmetRequirements: VendorVerificationUnmetRequirement[];
}

interface ReadinessParams {
  user: Pick<User, "emailVerified">;
  profile: Pick<
    VendorProfile,
    | "businessName"
    | "description"
    | "imageUrl"
    | "contactEmail"
    | "contactPhone"
    | "websiteUrl"
    | "facebookUrl"
    | "instagramUrl"
    | "specialties"
    | "galleryUrls"
  >;
}

function hasText(value: string | null | undefined): boolean {
  return !!value?.trim();
}

export function evaluateVendorVerificationReadiness({
  user,
  profile,
}: ReadinessParams): VendorVerificationReadiness {
  const unmetRequirements: VendorVerificationUnmetRequirement[] = [];

  if (!user.emailVerified) {
    unmetRequirements.push({
      code: "EMAIL_NOT_VERIFIED",
      message: "Verify your account email.",
    });
  }

  const profileCompletionPercent = computeVendorProfileCompletion(
    profile as VendorProfile,
  );
  if (profileCompletionPercent < 80) {
    unmetRequirements.push({
      code: "PROFILE_COMPLETION_BELOW_MINIMUM",
      message: "Increase profile completion to at least 80%.",
    });
  }

  if (!hasText(profile.businessName)) {
    unmetRequirements.push({
      code: "MISSING_BUSINESS_NAME",
      message: "Add a business name.",
    });
  }
  if (!hasText(profile.description)) {
    unmetRequirements.push({
      code: "MISSING_DESCRIPTION",
      message: "Add a business description.",
    });
  }
  if (!hasText(profile.imageUrl)) {
    unmetRequirements.push({
      code: "MISSING_IMAGE_URL",
      message: "Add a profile image.",
    });
  }

  const hasContactMethod =
    hasText(profile.contactEmail) || hasText(profile.contactPhone);
  if (!hasContactMethod) {
    unmetRequirements.push({
      code: "MISSING_CONTACT_METHOD",
      message: "Add at least one contact method (email or phone).",
    });
  }

  const hasDiscoverabilityLink =
    hasText(profile.websiteUrl) ||
    hasText(profile.facebookUrl) ||
    hasText(profile.instagramUrl);
  if (!hasDiscoverabilityLink) {
    unmetRequirements.push({
      code: "MISSING_DISCOVERABILITY_LINK",
      message: "Add at least one discoverability link (website or social).",
    });
  }

  if (!hasText(profile.specialties)) {
    unmetRequirements.push({
      code: "MISSING_SPECIALTIES",
      message: "Add specialties to help shoppers find your business.",
    });
  }

  return {
    isEligible: unmetRequirements.length === 0,
    profileCompletionPercent,
    unmetRequirements,
  };
}
