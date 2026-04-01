import { describe, expect, it } from "vitest";
import type { VendorProfile } from "@prisma/client";
import { buildVendorProfileJsonLd, toPublicVendorProfile } from "./vendor-public-profile";

function baseVendor(overrides: Partial<VendorProfile> = {}): VendorProfile {
  return {
    id: "vp1",
    userId: "u1",
    businessName: "Test Farm",
    slug: "test-farm",
    description: "Fresh food",
    imageUrl: "/uploads/v.jpg",
    imageFocalX: 50,
    imageFocalY: 50,
    heroImageUrl: null,
    heroImageFocalX: 50,
    heroImageFocalY: 50,
    websiteUrl: "https://example.com",
    facebookUrl: "farmfb",
    instagramUrl: "farmingram",
    contactEmail: "a@b.com",
    contactPhone: "5551234567",
    galleryUrls: [],
    specialties: "Produce",
    primaryCategory: "Produce",
    serviceAreaLabel: "Spokane",
    verificationStatus: "UNVERIFIED",
    contactVisible: false,
    socialLinksVisible: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

describe("toPublicVendorProfile", () => {
  it("redacts contact and social when visibility flags are false", () => {
    const p = toPublicVendorProfile(baseVendor(), "https://app.example");
    expect(p.contactEmail).toBeNull();
    expect(p.contactPhone).toBeNull();
    expect(p.websiteUrl).toBeNull();
    expect(p.facebookUrl).toBeNull();
    expect(p.instagramUrl).toBeNull();
  });

  it("includes contact and social when flags are true", () => {
    const p = toPublicVendorProfile(
      baseVendor({ contactVisible: true, socialLinksVisible: true }),
      "https://app.example",
    );
    expect(p.contactEmail).toBe("a@b.com");
    expect(p.websiteUrl).toBe("https://example.com");
  });
});

describe("buildVendorProfileJsonLd", () => {
  it("omits email when public profile has no contact", () => {
    const pub = toPublicVendorProfile(baseVendor(), "https://app.example");
    const ld = buildVendorProfileJsonLd(pub, "https://app.example");
    expect(ld.email).toBeUndefined();
    expect(ld.telephone).toBeUndefined();
  });

  it("includes sameAs only when social links are present on public profile", () => {
    const pub = toPublicVendorProfile(
      baseVendor({ socialLinksVisible: true }),
      "https://app.example",
    );
    const ld = buildVendorProfileJsonLd(pub, "https://app.example") as {
      sameAs?: string[];
    };
    expect(ld.sameAs?.length).toBeGreaterThan(0);
  });
});
