import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, LEGAL_ENTITY_WITH_DBA } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Terms of Service — ${SITE_NAME}`,
  description: `Terms of Service for ${SITE_NAME}`,
};

const LAST_UPDATED = "March 2, 2025";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
      <p className="mt-2 text-muted-foreground">Last updated: {LAST_UPDATED}</p>

      <div className="prose prose-neutral mt-8 dark:prose-invert max-w-none">
        <h2 className="mt-6 text-xl font-semibold">1. Acceptance of Terms</h2>
        <p>
          By accessing or using {LEGAL_ENTITY_WITH_DBA} (&quot;the Service&quot;), you agree to be bound by these
          Terms of Service and our{" "}
          <Link href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
          . If you do not agree to these terms, do not use the Service.
        </p>

        <h2 className="mt-6 text-xl font-semibold">2. Use of the Service</h2>
        <p>
          The Service provides a platform to discover local markets, craft fairs, vendor events, and
          community gatherings in the Spokane area. You may browse events, markets, and vendor profiles, create
          an account to save favorites, submit events, write reviews, and claim markets or vendor profiles
          where applicable.
        </p>
        <p>
          You agree to provide accurate information when creating an account or submitting content. You are
          responsible for maintaining the confidentiality of your account credentials.
        </p>

        <h2 className="mt-6 text-xl font-semibold">3. Prohibited Conduct</h2>
        <p>You agree not to:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Use the Service for any illegal purpose or in violation of any laws</li>
          <li>Post false, misleading, or fraudulent content</li>
          <li>Impersonate any person or entity</li>
          <li>Harass, abuse, or harm others</li>
          <li>Spam, scrape, or use automated means to access the Service without permission</li>
          <li>Interfere with or disrupt the Service or its infrastructure</li>
          <li>Attempt to gain unauthorized access to any user accounts or systems</li>
        </ul>

        <h2 className="mt-6 text-xl font-semibold">4. Intellectual Property</h2>
        <p>
          The Service and its original content, features, and functionality are owned by {LEGAL_ENTITY_WITH_DBA} and
          are protected by copyright, trademark, and other intellectual property laws. You may not copy,
          modify, distribute, or create derivative works without our prior written consent.
        </p>
        <p>
          You retain ownership of content you submit (e.g., reviews, photos). By submitting content, you
          grant us a non-exclusive, royalty-free license to use, display, and distribute that content in
          connection with the Service.
        </p>

        <h2 className="mt-6 text-xl font-semibold">5. Disclaimers</h2>
        <p>
          THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND,
          EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR
          FREE OF HARMFUL COMPONENTS.
        </p>
        <p>
          Event listings, market information, and vendor profiles are provided by users and third parties.
          We do not verify the accuracy of all content. We encourage you to confirm details directly with
          event organizers or vendors before attending or purchasing.
        </p>

        <h2 className="mt-6 text-xl font-semibold">6. Limitation of Liability</h2>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, {LEGAL_ENTITY_WITH_DBA} AND ITS AFFILIATES SHALL NOT BE LIABLE
          FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS,
          DATA, OR GOODWILL, ARISING FROM YOUR USE OF THE SERVICE.
        </p>
        <p>
          OUR TOTAL LIABILITY FOR ANY CLAIMS ARISING FROM OR RELATED TO THE SERVICE SHALL NOT EXCEED THE
          AMOUNT YOU PAID US, IF ANY, IN THE TWELVE MONTHS PRECEDING THE CLAIM.
        </p>

        <h2 className="mt-6 text-xl font-semibold">7. Termination</h2>
        <p>
          We may suspend or terminate your access to the Service at any time, with or without cause or
          notice. You may terminate your account at any time by contacting us or through account settings. Upon
          termination, your right to use the Service ceases immediately.
        </p>

        <h2 className="mt-6 text-xl font-semibold">8. Governing Law</h2>
        <p>
          These Terms shall be governed by and construed in accordance with the laws of the State of
          Washington, without regard to its conflict of law provisions. Any disputes shall be resolved in
          the courts of Spokane County, Washington.
        </p>

        <h2 className="mt-6 text-xl font-semibold">9. Changes</h2>
        <p>
          We may update these Terms from time to time. We will notify you of material changes by posting the
          updated Terms on this page and updating the &quot;Last updated&quot; date. Your continued use of the
          Service after such changes constitutes acceptance of the updated Terms.
        </p>

        <h2 className="mt-6 text-xl font-semibold">10. Contact</h2>
        <p>
          For questions about these Terms, contact us at{" "}
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
