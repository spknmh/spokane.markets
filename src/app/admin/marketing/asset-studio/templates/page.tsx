import { requireAdmin } from "@/lib/auth-utils";
import { MarketingTemplatesManager } from "@/components/admin/marketing/marketing-templates-manager";

export const dynamic = "force-dynamic";

export default async function MarketingTemplateManagerPage() {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Template Registry</h1>
        <p className="mt-1 text-muted-foreground">
          Maintain runtime templates, placeholder schemas, and render profiles.
        </p>
      </div>
      <MarketingTemplatesManager />
    </div>
  );
}
