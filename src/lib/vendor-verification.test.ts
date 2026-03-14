import { describe, expect, it } from "vitest";
import { evaluateVendorVerificationReadiness } from "./vendor-verification";

describe("evaluateVendorVerificationReadiness", () => {
  const baseUser = {
    emailVerified: true,
  };

  const completeProfile = {
    businessName: "Acme Vendor",
    description: "Handmade goods and local art.",
    imageUrl: "https://example.com/vendor.jpg",
    contactEmail: "hello@acme.test",
    contactPhone: "",
    websiteUrl: "https://acme.test",
    facebookUrl: "",
    instagramUrl: "acmevendor",
    specialties: "Art, Home Decor",
    galleryUrls: ["https://example.com/gallery.jpg"],
  };

  it("returns eligible when all requirements are met", () => {
    const readiness = evaluateVendorVerificationReadiness({
      user: baseUser,
      profile: completeProfile,
    });

    expect(readiness.isEligible).toBe(true);
    expect(readiness.unmetRequirements).toHaveLength(0);
    expect(readiness.profileCompletionPercent).toBeGreaterThanOrEqual(80);
  });

  it("returns unmet machine-readable requirements when profile is incomplete", () => {
    const readiness = evaluateVendorVerificationReadiness({
      user: { emailVerified: false },
      profile: {
        ...completeProfile,
        description: "",
        imageUrl: "",
        contactEmail: "",
        contactPhone: "",
        websiteUrl: "",
        instagramUrl: "",
        specialties: "",
      },
    });

    expect(readiness.isEligible).toBe(false);
    expect(readiness.unmetRequirements.map((r) => r.code)).toEqual(
      expect.arrayContaining([
        "EMAIL_NOT_VERIFIED",
        "PROFILE_COMPLETION_BELOW_MINIMUM",
        "MISSING_DESCRIPTION",
        "MISSING_IMAGE_URL",
        "MISSING_CONTACT_METHOD",
        "MISSING_DISCOVERABILITY_LINK",
        "MISSING_SPECIALTIES",
      ]),
    );
  });
});
