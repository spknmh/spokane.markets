import { requireAdmin } from "@/lib/auth-utils";
import { getBannerImages } from "@/lib/banner-images";
import { COMMUNITY_IMAGES } from "@/lib/community-images";
import { BannerEditor } from "@/components/admin/banner-editor";

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

export default async function AdminBannersPage() {
  await requireAdmin();
  const images = await getBannerImages();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Banner Images</h1>
        <p className="mt-1 text-muted-foreground">
          Configure hero and banner images for pages. Upload a new image or paste a URL. Leave empty to use the default.
        </p>
      </div>

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
    </div>
  );
}
