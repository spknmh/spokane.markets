import { requireAdmin } from "@/lib/auth-utils";
import { getBannerImages } from "@/lib/banner-images";
import { COMMUNITY_IMAGES } from "@/lib/community-images";
import { getSiteTheme } from "@/lib/site-theme";
import { BannerEditor } from "@/components/admin/banner-editor";
import { SiteThemeSelector } from "@/components/admin/site-theme-selector";

const BANNER_LABELS: Record<string, string> = {
  hero: "Homepage hero",
  farmersMarket: "Markets page",
  produce: "About page",
  craftStall: "Submit page",
  community: "Auth layout",
  localVendor: "Vendors / Vendor survey",
  marketCrowd: "Market Dates / Newsletter",
  events: "Market date detail",
};

export default async function AdminContentPage() {
  await requireAdmin();
  const [images, siteTheme] = await Promise.all([
    getBannerImages(),
    getSiteTheme(),
  ]);

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Site</h1>
        <p className="mt-1 text-muted-foreground">
          Manage banner images, color palette, and landing page configuration.
        </p>
      </div>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold">Color palette</h2>
        <SiteThemeSelector currentTheme={siteTheme} />
      </section>

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
    </div>
  );
}
