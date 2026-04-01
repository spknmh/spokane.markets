import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { FounderPhoto } from "@/components/founder-photo";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Backstory — ${SITE_NAME}`,
  description:
    `The story behind ${SITE_NAME}—who built it, why, and what we're trying to do for the Spokane community.`,
};

export default function BackstoryPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <Link
        href="/about"
        className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to About
      </Link>

      <h1 className="text-3xl font-bold tracking-tight">The Backstory</h1>
      <p className="mt-2 text-lg text-muted-foreground">
        Who built {SITE_NAME}, and why.
      </p>

      <div className="mt-12 flex flex-col gap-10 sm:flex-row sm:items-start sm:gap-12">
        <div className="shrink-0">
          <FounderPhoto />
        </div>

        <div className="min-w-0 flex-1 space-y-6">
          <section>
            <h2 className="text-xl font-semibold">Who I Am</h2>
            <p className="mt-2 text-muted-foreground leading-relaxed">
              I&apos;m a developer and Spokane-area resident who got tired of hunting for
              market and craft fair info across Facebook, Instagram, and random websites.
              I wanted one place to find what&apos;s happening—with real filters, real dates,
              and real trust.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">Why I Built This</h2>
            <p className="mt-2 text-muted-foreground leading-relaxed">
              {SITE_NAME} started from a simple frustration: finding local events shouldn&apos;t
              require digging through social feeds or hoping someone posts the right link.
              Vendors deserve a pipeline. Organizers deserve visibility. Visitors deserve
              clarity. This site is my attempt to give all three something better.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">What&apos;s Next</h2>
            <p className="mt-2 text-muted-foreground leading-relaxed">
              I&apos;m iterating based on feedback from vendors, organizers, and visitors.
              If you have ideas, spot a bug, or just want to say hi—{" "}
              <Link href="/about#contact" className="text-primary hover:underline">
                get in touch
              </Link>
              . This is a side project built for the community, and I&apos;d love to hear
              from you.
            </p>
          </section>
        </div>
      </div>

      <div className="mt-12">
        <Link
          href="/about"
          className="inline-flex items-center gap-2 text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to About & Contact
        </Link>
      </div>
    </div>
  );
}
