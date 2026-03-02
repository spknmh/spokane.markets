import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — Spokane Markets",
  description: "Privacy Policy for Spokane Markets",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-muted-foreground">Last updated: March 2025</p>

      <div className="prose prose-neutral mt-8 dark:prose-invert">
        <p>
          Spokane Markets respects your privacy. This is a placeholder. Please replace with your actual
          privacy policy before launch.
        </p>
        <h2 className="mt-6 text-xl font-semibold">1. Information We Collect</h2>
        <p>
          We collect information you provide when you sign up, subscribe to our newsletter, submit events,
          or interact with the site. This may include your name, email address, and preferences.
        </p>
        <h2 className="mt-6 text-xl font-semibold">2. How We Use Your Information</h2>
        <p>
          We use your information to provide the service, send updates, and improve Spokane Markets. We do
          not sell your personal information to third parties.
        </p>
        <h2 className="mt-6 text-xl font-semibold">3. Email Communications</h2>
        <p>
          By subscribing to our newsletter or enabling email alerts, you consent to receive emails from us.
          You can unsubscribe at any time via the link in each email or at{" "}
          <Link href="/unsubscribe" className="text-primary hover:underline">
            /unsubscribe
          </Link>
          .
        </p>
        <h2 className="mt-6 text-xl font-semibold">4. Contact</h2>
        <p>
          For privacy-related questions, contact us at{" "}
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
