import { requireAdmin } from "@/lib/auth-utils";
import { AdminVendorForm } from "@/components/admin/vendor-form";
import { getListingCommunityBadgeOptions } from "@/lib/listing-community-badges";

export const dynamic = "force-dynamic";

export default async function NewVendorPage() {
  await requireAdmin();
  const listingCommunityBadgeOptions = await getListingCommunityBadgeOptions();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Create Vendor</h1>
      <AdminVendorForm listingCommunityBadgeOptions={listingCommunityBadgeOptions} />
    </div>
  );
}
