import { requireAdmin } from "@/lib/auth-utils";
import { AdminVendorForm } from "@/components/admin/vendor-form";

export default async function NewVendorPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Create Vendor</h1>
      <AdminVendorForm />
    </div>
  );
}
