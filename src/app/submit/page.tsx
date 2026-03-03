import Image from "next/image";
import { SubmissionForm } from "@/components/submission-form";
import { requireAuth } from "@/lib/auth-utils";
import { getBannerImages } from "@/lib/banner-images";
import { isBannerUnoptimized } from "@/lib/utils";

export default async function SubmitPage() {
  const [session, banners] = await Promise.all([requireAuth("/submit"), getBannerImages()]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8 overflow-hidden rounded-xl">
        <Image
          src={banners.craftStall}
          alt=""
          width={800}
          height={200}
          className="h-40 w-full object-cover"
          unoptimized={isBannerUnoptimized(banners.craftStall)}
        />
      </div>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Submit an Event</h1>
        <p className="mt-3 text-muted-foreground">
          Know of a market, craft fair, or community event in the Spokane area?
          Submit it here and we&apos;ll review it for inclusion in our calendar.
          Submissions are typically reviewed within a few business days.
        </p>
      </div>
      <SubmissionForm session={session} />
    </div>
  );
}
