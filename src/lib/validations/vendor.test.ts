import { describe, expect, it } from "vitest";
import { adminVendorProfileSchema, vendorProfileSchema } from "./vendor";

const validInput = {
  businessName: "Sunshine Farm",
  slug: "sunshine-farm",
  description: "Fresh produce",
  imageUrl: "/uploads/vendor/example.jpg",
  websiteUrl: "",
  facebookUrl: "",
  instagramUrl: "",
  contactEmail: "",
  contactPhone: "",
  galleryUrls: ["/uploads/vendor/gallery-1.jpg", "https://example.com/gallery-2.jpg"],
  specialties: "Produce",
};

describe("vendorProfileSchema", () => {
  it("accepts upload paths in galleryUrls", () => {
    const result = vendorProfileSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("rejects invalid slug format", () => {
    const result = vendorProfileSchema.safeParse({
      ...validInput,
      slug: "Bad Slug!",
    });
    expect(result.success).toBe(false);
  });

  it("rejects more than 6 gallery images", () => {
    const result = vendorProfileSchema.safeParse({
      ...validInput,
      galleryUrls: [
        "/uploads/vendor/1.jpg",
        "/uploads/vendor/2.jpg",
        "/uploads/vendor/3.jpg",
        "/uploads/vendor/4.jpg",
        "/uploads/vendor/5.jpg",
        "/uploads/vendor/6.jpg",
        "/uploads/vendor/7.jpg",
      ],
    });
    expect(result.success).toBe(false);
  });
});

describe("adminVendorProfileSchema", () => {
  const baseAdmin = {
    businessName: "Sunshine Farm",
    slug: "sunshine-farm",
    imageUrl: "/uploads/vendor/example.jpg",
    websiteUrl: "",
    facebookUrl: "",
    instagramUrl: "",
    contactEmail: "",
    contactPhone: "",
    specialties: "",
  };

  it("accepts verificationStatus when present", () => {
    const result = adminVendorProfileSchema.safeParse({
      ...baseAdmin,
      verificationStatus: "VERIFIED",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.verificationStatus).toBe("VERIFIED");
    }
  });

  it("rejects invalid verificationStatus", () => {
    const result = adminVendorProfileSchema.safeParse({
      ...baseAdmin,
      verificationStatus: "FAKE",
    });
    expect(result.success).toBe(false);
  });
});
