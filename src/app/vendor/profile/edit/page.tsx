import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { extractSocialHandle } from "@/lib/utils";
import { VendorProfileForm } from "@/components/vendor/vendor-profile-form";

export default async function VendorProfileEditPage() {
  const session = await requireAuth("/vendor/profile/edit");

  const profile = await db.vendorProfile.findUnique({
    where: { userId: session.user.id },
  });

  const initialData = profile
    ? {
        id: profile.id,
        businessName: profile.businessName,
        slug: profile.slug,
        description: profile.description ?? "",
        imageUrl: profile.imageUrl ?? "",
        websiteUrl: profile.websiteUrl ?? "",
        facebookUrl: profile.facebookUrl
          ? extractSocialHandle(profile.facebookUrl, "facebook")
          : "",
        instagramUrl: profile.instagramUrl
          ? extractSocialHandle(profile.instagramUrl, "instagram")
          : "",
        contactEmail: profile.contactEmail ?? "",
        contactPhone: profile.contactPhone ?? "",
        galleryUrlsText: (profile.galleryUrls ?? []).join("\n"),
        specialties: profile.specialties ?? "",
      }
    : undefined;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">
        {profile ? "Edit Vendor Profile" : "Create Vendor Profile"}
      </h1>
      <VendorProfileForm initialData={initialData} />
    </div>
  );
}
