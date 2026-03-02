import { requireAdmin } from "@/lib/auth-utils";
import { getLandingConfig } from "@/lib/landing-config";
import { LandingConfigForm } from "@/components/admin/landing-config-form";

export default async function AdminLandingPage() {
  await requireAdmin();
  const config = await getLandingConfig();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Landing Page</h1>
        <p className="mt-1 text-muted-foreground">
          Show a configurable landing page (e.g. Coming Soon, Down for Maintenance) instead of the main site. Admins can always access /admin.
        </p>
      </div>

      <LandingConfigForm initialConfig={config} />
    </div>
  );
}
