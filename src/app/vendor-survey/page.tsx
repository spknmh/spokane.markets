import Image from "next/image";
import { VendorSurveyForm } from "@/components/vendor-survey-form";
import { getBannerImages } from "@/lib/banner-images";
import { isBannerUnoptimized } from "@/lib/utils";

export default async function VendorSurveyPage() {
  const banners = await getBannerImages();
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8 overflow-hidden rounded-xl">
        <Image
          src={banners.localVendor}
          alt="Local vendor at Spokane markets"
          width={800}
          height={200}
          className="h-40 w-full object-cover"
          unoptimized={isBannerUnoptimized(banners.localVendor)}
        />
      </div>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Vendor Survey</h1>
        <p className="mt-3 text-muted-foreground">
          Are you a vendor who sells at Spokane-area markets? We&apos;d love to
          hear from you. Your feedback helps us build better tools and resources
          for the local market community. All responses are anonymous unless you
          choose to share your contact info.
        </p>
      </div>
      <VendorSurveyForm />
    </div>
  );
}
