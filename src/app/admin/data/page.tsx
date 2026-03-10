import { requireAdmin } from "@/lib/auth-utils";
import { DataImportExport } from "@/components/admin/data-import-export";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Data Import / Export - Admin",
  description: "Import events, markets, and venues from JSON or CSV. Export backup to host.",
};

export default async function AdminDataPage() {
  await requireAdmin();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Data Import & Export</h1>
        <p className="mt-1 text-muted-foreground">
          Import events, markets, and venues from JSON or CSV. Export a full backup to the host.
        </p>
      </div>

      <DataImportExport />
    </div>
  );
}
