import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { extractSocialHandle } from "@/lib/utils";
import { VendorProfileForm } from "@/components/vendor/vendor-profile-form";
import { getListingCommunityBadgeOptions } from "@/lib/listing-community-badges";

export const dynamic = "force-dynamic";

export default async function VendorProfileEditPage() {
  const session = await requireAuth("/vendor/profile/edit");

  const [profile, listingCommunityBadgeOptions] = await Promise.all([
    db.vendorProfile.findUnique({
      where: { userId: session.user.id },
      include: { listingCommunityBadges: { select: { id: true } } },
    }),
    getListingCommunityBadgeOptions(),
  ]);

  const initialData = profile
    ? {
        id: profile.id,
        businessName: profile.businessName,
        slug: profile.slug,
        description: profile.description ?? "",
        imageUrl: profile.imageUrl ?? "",
        imageFocalX: profile.imageFocalX ?? 50,
        imageFocalY: profile.imageFocalY ?? 50,
        heroImageUrl: profile.heroImageUrl ?? "",
        heroImageFocalX: profile.heroImageFocalX ?? 50,
        heroImageFocalY: profile.heroImageFocalY ?? 50,
        primaryCategory: profile.primaryCategory ?? "",
        serviceAreaLabel: profile.serviceAreaLabel ?? "",
        websiteUrl: profile.websiteUrl ?? "",
        facebookUrl: profile.facebookUrl
          ? extractSocialHandle(profile.facebookUrl, "facebook")
          : "",
        instagramUrl: profile.instagramUrl
          ? extractSocialHandle(profile.instagramUrl, "instagram")
          : "",
        contactEmail: profile.contactEmail ?? "",
        contactPhone: profile.contactPhone ?? "",
        contactVisible: profile.contactVisible,
        socialLinksVisible: profile.socialLinksVisible,
        galleryUrls: profile.galleryUrls ?? [],
        galleryUrlsText: (profile.galleryUrls ?? []).join("\n"),
        specialties: profile.specialties ?? "",
        listingCommunityBadgeIds: profile.listingCommunityBadges.map(
          (badge) => badge.id
        ),
      }
    : undefined;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">
        {profile ? "Edit Vendor Profile" : "Create Vendor Profile"}
      </h1>
      <VendorProfileForm
        initialData={initialData}
        listingCommunityBadgeOptions={listingCommunityBadgeOptions}
      />
    </div>
  );
}
