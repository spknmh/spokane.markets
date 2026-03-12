import Image from "next/image";
import { NewsletterForm } from "@/components/forms/newsletter-form";
import { getBannerImages } from "@/lib/banner-images";
import { getNeighborhoodOptions } from "@/lib/neighborhoods";
import { isBannerUnoptimized } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function NewsletterPage() {
  const [banners, neighborhoods] = await Promise.all([
    getBannerImages(),
    getNeighborhoodOptions(),
  ]);
  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <div className="mb-8 overflow-hidden rounded-xl">
        <Image
          src={banners.marketCrowd.url}
          alt="Community at a farmers market"
          width={800}
          height={200}
          className="h-40 w-full object-cover"
          style={{ objectPosition: banners.marketCrowd.objectPosition }}
          unoptimized={isBannerUnoptimized(banners.marketCrowd.url)}
        />
      </div>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Newsletter</h1>
        <p className="mt-3 text-muted-foreground">
          Get a weekly digest of upcoming markets and events in the Spokane area
          delivered to your inbox every Thursday. No spam, ever.
        </p>
      </div>
      <NewsletterForm neighborhoods={neighborhoods} />
    </div>
  );
}
