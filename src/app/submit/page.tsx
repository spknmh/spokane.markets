import Image from "next/image";
import { SubmissionForm } from "@/components/submission-form";
import { COMMUNITY_IMAGES } from "@/lib/community-images";

export default function SubmitPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8 overflow-hidden rounded-xl">
        <Image
          src={COMMUNITY_IMAGES.craftStall}
          alt=""
          width={800}
          height={200}
          className="h-40 w-full object-cover"
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
      <SubmissionForm />
    </div>
  );
}
