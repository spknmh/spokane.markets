import type { Metadata } from "next";
import Image from "next/image";
import { SubmissionForm } from "@/components/forms/submission-form";
import { requireAuth } from "@/lib/auth-utils";
import { getBannerImages } from "@/lib/banner-images";
import { isBannerUnoptimized } from "@/lib/utils";
import { SITE_NAME } from "@/lib/constants";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Submit an Event — ${SITE_NAME}`,
  description:
    "Submit a market, craft fair, or community event for inclusion in the Spokane Markets calendar. We review submissions within a few business days.",
  robots: { index: false, follow: true },
};

export default async function SubmitPage() {
  const [session, banners, markets, tags, features] = await Promise.all([
    requireAuth("/submit"),
    getBannerImages(),
    db.market.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.tag.findMany({ select: { id: true, name: true, slug: true }, orderBy: { name: "asc" } }),
    db.feature.findMany({ select: { id: true, name: true, slug: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8 overflow-hidden rounded-xl">
        <Image
          src={banners.craftStall.url}
          alt="Craft stall at a local market"
          width={800}
          height={200}
          className="h-40 w-full object-cover"
          style={{ objectPosition: banners.craftStall.objectPosition }}
          unoptimized={isBannerUnoptimized(banners.craftStall.url)}
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
      <SubmissionForm session={session} markets={markets} tags={tags} features={features} />
    </div>
  );
}
