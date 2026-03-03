import { requireAdmin } from "@/lib/auth-utils";
import { getBannerImages } from "@/lib/banner-images";
import { COMMUNITY_IMAGES } from "@/lib/community-images";
import { getMaintenanceState } from "@/lib/maintenance";
import { BannerEditor } from "@/components/admin/banner-editor";
import { MaintenanceForm } from "@/components/admin/maintenance-form";

const BANNER_LABELS: Record<string, string> = {
  hero: "Homepage hero",
  farmersMarket: "Markets page",
  produce: "About page",
  craftStall: "Submit page",
  community: "Auth layout",
  localVendor: "Vendors / Vendor survey",
  marketCrowd: "Events / Newsletter",
  events: "Event detail",
};

export default async function AdminContentPage() {
  await requireAdmin();
  const [images, maintenanceState] = await Promise.all([
    getBannerImages(),
    getMaintenanceState(),
  ]);

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Content</h1>
        <p className="mt-1 text-muted-foreground">
          Manage banner images and landing page configuration.
        </p>
      </div>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold">Banner Images</h2>
        <p className="text-sm text-muted-foreground">
          Configure hero and banner images for pages. Upload a new image or paste a URL. Leave empty to use the default.
        </p>
        <div className="grid gap-6 sm:grid-cols-2">
          {(Object.keys(BANNER_LABELS) as Array<keyof typeof BANNER_LABELS>).map((key) => {
            const k = key as keyof typeof COMMUNITY_IMAGES;
            return (
              <BannerEditor
                key={key}
                bannerKey={key}
                label={BANNER_LABELS[key]}
                currentUrl={images[k]}
                isCustom={images[k] !== COMMUNITY_IMAGES[k]}
              />
            );
          })}
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold">Maintenance Mode</h2>
        <p className="text-sm text-muted-foreground">
          Control site-wide access. When enabled, non-privileged visitors see a maintenance page. Admins can always access /admin. Vendors and organizers can be allowed in &quot;Privileged&quot; mode.
        </p>
        <p className="text-sm text-muted-foreground">
          <strong>Config:</strong> Set <code className="rounded bg-muted px-1">NEXT_PUBLIC_APP_URL</code> in .env.local for middleware to fetch config when behind a reverse proxy.
        </p>
        <MaintenanceForm
          initialState={{
            mode: maintenanceState.mode,
            messageTitle: maintenanceState.messageTitle,
            messageBody: maintenanceState.messageBody,
            eta: maintenanceState.eta,
          }}
        />
      </section>
    </div>
  );
}
