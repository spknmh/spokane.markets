import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — Spokane Markets",
  description: "Terms of Service for Spokane Markets",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
      <p className="mt-2 text-muted-foreground">Last updated: March 2025</p>

      <div className="prose prose-neutral mt-8 dark:prose-invert">
        <p>
          Welcome to Spokane Markets. By using this site, you agree to these terms. This is a placeholder.
          Please replace with your actual terms of service before launch.
        </p>
        <h2 className="mt-6 text-xl font-semibold">1. Acceptance of Terms</h2>
        <p>
          By accessing or using Spokane Markets, you agree to be bound by these Terms of Service and our{" "}
          <Link href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
        <h2 className="mt-6 text-xl font-semibold">2. Use of the Service</h2>
        <p>
          You may use Spokane Markets to discover local markets, events, and vendors. You agree to provide
          accurate information and not to misuse the service.
        </p>
        <h2 className="mt-6 text-xl font-semibold">3. Contact</h2>
        <p>
          For questions about these terms, contact us at{" "}
          <a href="mailto:hello@spokane.markets" className="text-primary hover:underline">
            hello@spokane.markets
          </a>
          .
        </p>
      </div>

      <p className="mt-8">
        <Link href="/" className="text-primary hover:underline">
          ← Back to home
        </Link>
      </p>
    </div>
  );
}
