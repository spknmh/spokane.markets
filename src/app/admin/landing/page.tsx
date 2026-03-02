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
        <p className="mt-2 text-sm text-muted-foreground">
          <strong>Config:</strong> Set <code className="rounded bg-muted px-1">NEXT_PUBLIC_APP_URL</code> in .env.local (e.g. <code className="rounded bg-muted px-1">https://spokane.markets</code> or <code className="rounded bg-muted px-1">http://localhost:3000</code>). Test in an incognito window or different browser—visit / to see the landing page.
        </p>
      </div>

      <LandingConfigForm initialConfig={config} />
    </div>
  );
}
