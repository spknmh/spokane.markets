import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { AdminVendorForm } from "@/components/admin/vendor-form";
import { notFound } from "next/navigation";

export default async function EditVendorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const vendor = await db.vendorProfile.findUnique({ where: { id } });
  if (!vendor) notFound();

  const initialData = {
    id: vendor.id,
    businessName: vendor.businessName,
    slug: vendor.slug,
    description: vendor.description ?? "",
    imageUrl: vendor.imageUrl ?? "",
    websiteUrl: vendor.websiteUrl ?? "",
    facebookUrl: vendor.facebookUrl ?? "",
    instagramUrl: vendor.instagramUrl ?? "",
    contactEmail: vendor.contactEmail ?? "",
    contactPhone: vendor.contactPhone ?? "",
    galleryUrlsText: vendor.galleryUrls?.join("\n") ?? "",
    specialties: vendor.specialties ?? "",
    userId: vendor.userId ?? null,
    contactVisible: vendor.contactVisible,
    socialLinksVisible: vendor.socialLinksVisible,
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Edit Vendor</h1>
      <AdminVendorForm initialData={initialData} />
    </div>
  );
}
