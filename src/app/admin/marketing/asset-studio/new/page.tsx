import { requireAdmin } from "@/lib/auth-utils";
import { MarketingRenderEditor } from "@/components/admin/marketing/marketing-render-editor";

export const dynamic = "force-dynamic";

export default async function MarketingAssetStudioNewPage() {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Marketing Render</h1>
        <p className="mt-1 text-muted-foreground">
          Select a template, prefill variables from entities, edit in-place, and queue a supersampled render.
        </p>
      </div>
      <MarketingRenderEditor />
    </div>
  );
}
