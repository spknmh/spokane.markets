import type { VendorProfile } from "@prisma/client";
import {
  getFacebookDisplayUrl,
  getInstagramDisplayUrl,
  normalizeUrlToHttps,
} from "@/lib/utils";

/** Shopper-safe vendor fields for public pages and JSON-LD. */
export type PublicVendorProfile = Pick<
  VendorProfile,
  | "id"
  | "slug"
  | "businessName"
  | "description"
  | "imageUrl"
  | "imageFocalX"
  | "imageFocalY"
  | "heroImageUrl"
  | "heroImageFocalX"
  | "heroImageFocalY"
  | "primaryCategory"
  | "serviceAreaLabel"
  | "galleryUrls"
  | "specialties"
  | "verificationStatus"
> & {
  websiteUrl: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
};

function absoluteAssetUrl(baseUrl: string, url: string | null | undefined): string | undefined {
  if (!url?.trim()) return undefined;
  if (url.startsWith("http")) return url;
  return `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
}

/**
 * Strip private fields and redact contact/social based on visibility flags.
 */
export function toPublicVendorProfile(
  v: VendorProfile,
  _baseUrl: string = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
): PublicVendorProfile {
  const showContact = v.contactVisible === true;
  const showSocial = v.socialLinksVisible === true;

  return {
    id: v.id,
    slug: v.slug,
    businessName: v.businessName,
    description: v.description,
    imageUrl: v.imageUrl,
    imageFocalX: v.imageFocalX,
    imageFocalY: v.imageFocalY,
    heroImageUrl: v.heroImageUrl,
    heroImageFocalX: v.heroImageFocalX,
    heroImageFocalY: v.heroImageFocalY,
    primaryCategory: v.primaryCategory,
    serviceAreaLabel: v.serviceAreaLabel,
    galleryUrls: v.galleryUrls,
    specialties: v.specialties,
    verificationStatus: v.verificationStatus,
    websiteUrl: showSocial ? v.websiteUrl : null,
    facebookUrl: showSocial ? v.facebookUrl : null,
    instagramUrl: showSocial ? v.instagramUrl : null,
    contactEmail: showContact ? v.contactEmail : null,
    contactPhone: showContact ? v.contactPhone : null,
  };
}

/** JSON-LD for LocalBusiness; never includes hidden contact or social. */
export function buildVendorProfileJsonLd(
  publicProfile: PublicVendorProfile,
  baseUrl: string = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
): Record<string, unknown> {
  const vendorUrl = `${baseUrl}/vendors/${publicProfile.slug}`;
  const avatar = absoluteAssetUrl(baseUrl, publicProfile.imageUrl);
  const hero = absoluteAssetUrl(baseUrl, publicProfile.heroImageUrl);
  const image = hero ?? avatar;

  const sameAs = [
    publicProfile.websiteUrl ? normalizeUrlToHttps(publicProfile.websiteUrl) : null,
    getFacebookDisplayUrl(publicProfile.facebookUrl),
    getInstagramDisplayUrl(publicProfile.instagramUrl),
  ].filter((u): u is string => !!u);

  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: publicProfile.businessName,
    description: publicProfile.description ?? undefined,
    url: vendorUrl,
    image: image,
    ...(sameAs.length > 0 && { sameAs }),
    ...(publicProfile.contactEmail && { email: publicProfile.contactEmail }),
    ...(publicProfile.contactPhone && { telephone: publicProfile.contactPhone }),
  };
}
