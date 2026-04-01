import type { VendorProfile } from "@prisma/client";

export function computeVendorProfileCompletion(p: VendorProfile): number {
  const checks = [
    !!p.businessName?.trim(),
    !!p.description?.trim(),
    !!p.imageUrl?.trim(),
    !!p.contactEmail?.trim(),
    !!p.contactPhone?.trim(),
    !!p.websiteUrl?.trim(),
    !!(p.primaryCategory?.trim() || p.specialties?.trim()),
    !!(p.facebookUrl?.trim() || p.instagramUrl?.trim()),
    p.galleryUrls.length > 0,
    !!p.serviceAreaLabel?.trim(),
  ];
  const filled = checks.filter(Boolean).length;
  return Math.round((filled / checks.length) * 100);
}
