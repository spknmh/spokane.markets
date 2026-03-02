import Image from "next/image";
import { VendorSurveyForm } from "@/components/vendor-survey-form";
import { COMMUNITY_IMAGES } from "@/lib/community-images";

export default function VendorSurveyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8 overflow-hidden rounded-xl">
        <Image
          src={COMMUNITY_IMAGES.localVendor}
          alt=""
          width={800}
          height={200}
          className="h-40 w-full object-cover"
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
