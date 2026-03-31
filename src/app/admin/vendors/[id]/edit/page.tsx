import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { extractSocialHandle } from "@/lib/utils";
import { AdminVendorForm } from "@/components/admin/vendor-form";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditVendorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const vendor = await db.vendorProfile.findUnique({
    where: { id },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  if (!vendor) notFound();

  const initialData = {
    id: vendor.id,
    businessName: vendor.businessName,
    slug: vendor.slug,
    description: vendor.description ?? "",
    imageUrl: vendor.imageUrl ?? "",
    websiteUrl: vendor.websiteUrl ?? "",
    facebookUrl: vendor.facebookUrl
      ? extractSocialHandle(vendor.facebookUrl, "facebook")
      : "",
    instagramUrl: vendor.instagramUrl
      ? extractSocialHandle(vendor.instagramUrl, "instagram")
      : "",
    contactEmail: vendor.contactEmail ?? "",
    contactPhone: vendor.contactPhone ?? "",
    galleryUrlsText: vendor.galleryUrls?.join("\n") ?? "",
    specialties: vendor.specialties ?? "",
    userId: vendor.userId ?? null,
    user: vendor.user
      ? { id: vendor.user.id, name: vendor.user.name, email: vendor.user.email }
      : null,
    contactVisible: vendor.contactVisible,
    socialLinksVisible: vendor.socialLinksVisible,
    verificationStatus: vendor.verificationStatus,
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Edit Vendor</h1>
      <AdminVendorForm initialData={initialData} />
    </div>
  );
}
