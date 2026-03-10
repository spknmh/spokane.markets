import { requireAdmin } from "@/lib/auth-utils";
import { getMaintenanceState } from "@/lib/maintenance";
import { MaintenanceForm } from "@/components/admin/maintenance-form";

export const dynamic = "force-dynamic";

export default async function AdminMaintenancePage() {
  await requireAdmin();
  const maintenanceState = await getMaintenanceState();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Maintenance Mode</h1>
        <p className="mt-1 text-muted-foreground">
          Control site-wide access. When enabled, non-privileged visitors see a
          maintenance page. Admins can always access /admin. Vendors and
          organizers can be allowed in &quot;Privileged&quot; mode.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          <strong>Config:</strong> Set{" "}
          <code className="rounded bg-muted px-1">NEXT_PUBLIC_APP_URL</code> in
          .env.local for middleware to fetch config when behind a reverse proxy.
        </p>
      </div>

      <MaintenanceForm
        initialState={{
          mode: maintenanceState.mode,
          messageTitle: maintenanceState.messageTitle,
          messageBody: maintenanceState.messageBody,
          links: maintenanceState.links,
          eta: maintenanceState.eta,
        }}
      />
    </div>
  );
}
