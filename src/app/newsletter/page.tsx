import Image from "next/image";
import { NewsletterForm } from "@/components/newsletter-form";
import { getBannerImages } from "@/lib/banner-images";
import { isBannerUnoptimized } from "@/lib/utils";

export default async function NewsletterPage() {
  const banners = await getBannerImages();
  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <div className="mb-8 overflow-hidden rounded-xl">
        <Image
          src={banners.marketCrowd}
          alt="Community at a farmers market"
          width={800}
          height={200}
          className="h-40 w-full object-cover"
          unoptimized={isBannerUnoptimized(banners.marketCrowd)}
        />
      </div>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Newsletter</h1>
        <p className="mt-3 text-muted-foreground">
          Get a weekly digest of upcoming markets and events in the Spokane area
          delivered to your inbox every Thursday. No spam, ever.
        </p>
      </div>
      <NewsletterForm />
    </div>
  );
}
