import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — Spokane Markets",
  description: "Privacy Policy for Spokane Markets",
};

const LAST_UPDATED = "March 2, 2025";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-muted-foreground">Last updated: {LAST_UPDATED}</p>

      <div className="prose prose-neutral mt-8 dark:prose-invert max-w-none">
        <p>
          Spokane Markets (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) respects your privacy. This policy describes
          how we collect, use, and protect your personal information when you use our website and services.
        </p>

        <h2 className="mt-6 text-xl font-semibold">1. Information We Collect</h2>
        <p>
          We collect information you provide directly to us, including:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Account information:</strong> Name, email address, and password when you sign up</li>
          <li><strong>Profile information:</strong> Name, profile image, and preferences you choose to share</li>
          <li><strong>Submissions:</strong> Event details, market information, vendor profiles, and reviews you submit</li>
          <li><strong>Newsletter:</strong> Email address and area preferences when you subscribe</li>
          <li><strong>Communications:</strong> Messages you send when contacting us</li>
        </ul>
        <p>
          We collect information automatically when you use the Service, such as IP address, browser type,
          device information, and pages visited. We use cookies and similar technologies as described below.
        </p>

        <h2 className="mt-6 text-xl font-semibold">2. How We Use Your Information</h2>
        <p>We use your information to:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Provide, maintain, and improve the Service</li>
          <li>Process your account, submissions, and requests</li>
          <li>Send you newsletters and email alerts (with your consent)</li>
          <li>Respond to your inquiries and support requests</li>
          <li>Detect and prevent fraud, spam, and abuse</li>
          <li>Analyze usage patterns and improve user experience</li>
          <li>Comply with legal obligations</li>
        </ul>
        <p>
          We do not sell your personal information to third parties.
        </p>

        <h2 className="mt-6 text-xl font-semibold">3. Cookies and Similar Technologies</h2>
        <p>
          We use cookies and similar technologies (e.g., local storage) to enable essential functionality,
          remember your preferences, and analyze how visitors use the Service. Essential cookies are
          required for the Service to function. You can disable non-essential cookies in your browser
          settings, though some features may not work correctly.
        </p>

        <h2 className="mt-6 text-xl font-semibold">4. Third Parties</h2>
        <p>
          We may share your information with:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Service providers:</strong> Hosting, analytics, and email delivery services that assist us in operating the Service</li>
          <li><strong>Legal requirements:</strong> When required by law or to protect our rights</li>
        </ul>
        <p>
          Our Service may contain links to third-party websites (e.g., Facebook, Instagram, event websites).
          We are not responsible for the privacy practices of those sites.
        </p>

        <h2 className="mt-6 text-xl font-semibold">5. Data Retention</h2>
        <p>
          We retain your information for as long as your account is active or as needed to provide the
          Service. We may retain certain information after account deletion for legal compliance, dispute
          resolution, and enforcement of our agreements. Review content may be retained in anonymized form
          for analytics.
        </p>

        <h2 className="mt-6 text-xl font-semibold">6. Your Rights</h2>
        <p>
          Depending on your location, you may have the right to:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
          <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data</li>
          <li><strong>Deletion:</strong> Request deletion of your personal data</li>
          <li><strong>Portability:</strong> Request a copy of your data in a portable format</li>
          <li><strong>Objection:</strong> Object to processing of your data</li>
          <li><strong>Restriction:</strong> Request restriction of processing</li>
          <li><strong>Withdraw consent:</strong> Withdraw consent where processing is based on consent</li>
        </ul>
        <p>
          To exercise these rights, contact us at{" "}
          <a href="mailto:hello@spokane.markets" className="text-primary hover:underline">
            hello@spokane.markets
          </a>
          . You may also have the right to lodge a complaint with a supervisory authority in your
          jurisdiction.
        </p>

        <h2 className="mt-6 text-xl font-semibold">7. Email Communications and Unsubscribe</h2>
        <p>
          By subscribing to our newsletter or enabling email alerts (e.g., for saved filters or events), you
          consent to receive emails from us. You can unsubscribe at any time via the link in each email or
          by visiting{" "}
          <Link href="/unsubscribe" className="text-primary hover:underline">
            /unsubscribe
          </Link>
          .
        </p>

        <h2 className="mt-6 text-xl font-semibold">8. Security</h2>
        <p>
          We implement reasonable security measures to protect your personal information. However, no
          method of transmission over the Internet or electronic storage is 100% secure. We cannot
          guarantee absolute security.
        </p>

        <h2 className="mt-6 text-xl font-semibold">9. Children</h2>
        <p>
          The Service is not intended for children under 13. We do not knowingly collect personal
          information from children under 13. If you believe we have collected such information, please
          contact us.
        </p>

        <h2 className="mt-6 text-xl font-semibold">10. Changes</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify you of material changes by
          posting the updated policy on this page and updating the &quot;Last updated&quot; date. Your continued
          use of the Service after such changes constitutes acceptance of the updated policy.
        </p>

        <h2 className="mt-6 text-xl font-semibold">11. Contact</h2>
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
