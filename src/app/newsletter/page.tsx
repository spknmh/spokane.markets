import Image from "next/image";
import { NewsletterForm } from "@/components/newsletter-form";
import { COMMUNITY_IMAGES } from "@/lib/community-images";

export default function NewsletterPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <div className="mb-8 overflow-hidden rounded-xl">
        <Image
          src={COMMUNITY_IMAGES.marketCrowd}
          alt=""
          width={800}
          height={200}
          className="h-40 w-full object-cover"
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
