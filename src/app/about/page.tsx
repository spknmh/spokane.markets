import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContactForm } from "@/components/contact-form";
import { getBannerImages } from "@/lib/banner-images";
import { isBannerUnoptimized } from "@/lib/utils";

export const metadata: Metadata = {
  title: "About & Contact — Spokane Markets",
  description:
    "Learn about Spokane Markets and how to get in touch. We help connect vendors, organizers, and visitors with local markets and events.",
};

export default async function AboutPage() {
  const banners = await getBannerImages();
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8 overflow-hidden rounded-xl">
        <Image
          src={banners.produce}
          alt=""
          width={800}
          height={300}
          className="h-48 w-full object-cover"
          unoptimized={isBannerUnoptimized(banners.produce)}
        />
      </div>
      <h1 className="text-3xl font-bold tracking-tight">About Spokane Markets</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Spokane Markets is your go-to guide for discovering markets, craft fairs,
        and community events across the Spokane area. We aim to beat Facebook for
        clarity, filtering, and trust—giving you one place to find what&apos;s
        happening this weekend.
      </p>

      <section className="mt-12">
        <h2 className="text-xl font-semibold">What We Do</h2>
        <ul className="mt-3 space-y-2 text-muted-foreground">
          <li>• Index and normalize event information from across the region</li>
          <li>• Filter by date, neighborhood, category, and features</li>
          <li>• Support verified organizers and market claims</li>
          <li>• Help vendors find events and build their pipeline</li>
          <li>• Provide structured reviews and trust signals</li>
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold">Contact</h2>
        <p className="mt-2 text-muted-foreground">
          Have a question, suggestion, or want to report an issue? We&apos;d love
          to hear from you.
        </p>
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Get in Touch
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Send us a message and we&apos;ll get back to you as soon as we can.
            </p>
            <ContactForm />
            <p className="text-sm text-muted-foreground">
              For event submissions or vendor questions, you can also use{" "}
              <Link href="/submit" className="text-primary hover:underline">
                Submit an Event
              </Link>{" "}
              or{" "}
              <Link href="/vendor-survey" className="text-primary hover:underline">
                Vendor Survey
              </Link>
              . Or email{" "}
              <a
                href="mailto:hello@spokane.markets"
                className="text-primary hover:underline"
              >
                hello@spokane.markets
              </a>
              .
            </p>
          </CardContent>
        </Card>
      </section>

      <div className="mt-12">
        <Button asChild variant="outline">
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    </div>
  );
}
