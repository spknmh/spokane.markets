import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, LEGAL_ENTITY_WITH_DBA } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Privacy Policy — ${SITE_NAME}`,
  description: `Privacy Policy for ${SITE_NAME}`,
};

const EFFECTIVE_DATE = "March 11, 2026";
const LAST_UPDATED = "March 11, 2026";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-muted-foreground">
        Effective: {EFFECTIVE_DATE} · Last updated: {LAST_UPDATED}
      </p>

      <div className="prose prose-neutral mt-8 max-w-none dark:prose-invert">
        <p>
          {LEGAL_ENTITY_WITH_DBA} (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) respects your privacy.
          This Privacy Policy explains how we collect, use, disclose, retain, and protect
          personal information when you use {SITE_NAME}, including our website, accounts,
          listings, submissions, reviews, alerts, newsletters, and related services
          (collectively, the &quot;Service&quot;).
        </p>

        <p>
          We are based in the United States and process personal information to operate,
          secure, maintain, and improve the Service. We do not sell your personal
          information for money. We also do not share your personal information with third
          parties for their own independent marketing or advertising purposes.
        </p>

        <p>
          Regardless of where you live, we aim to provide a clear and respectful privacy
          experience. Upon request, we will provide access to the personal information we
          hold about you and, subject to limited exceptions permitted or required by law or
          reasonably necessary for security, fraud prevention, dispute resolution, or core
          recordkeeping, we will honor requests to delete personal information we no longer
          need.
        </p>

        <h2 className="mt-6 text-xl font-semibold">1. Information We Collect</h2>
        <p>
          We collect information you provide directly to us, information generated through
          your use of the Service, and certain information from service providers or third
          parties you choose to interact with through the Service.
        </p>

        <h3 className="mt-4 text-lg font-semibold">Information you provide directly</h3>
        <ul className="list-disc space-y-1 pl-6">
          <li>
            <strong>Account information:</strong> such as your name, email address, password,
            and account login details when you register or authenticate
          </li>
          <li>
            <strong>Profile information:</strong> such as your display name, profile image,
            biography, business details, social links, preferences, and other information you
            choose to include in your account or public profile
          </li>
          <li>
            <strong>Submissions and listings:</strong> such as event details, market
            information, vendor profiles, verification requests, roster requests, edits, supporting
            documents, and related submission content
          </li>
          <li>
            <strong>Reviews and public contributions:</strong> such as ratings, reviews,
            comments, photos, and other feedback you submit
          </li>
          <li>
            <strong>Newsletter and alert signups:</strong> such as your email address and any
            category, area, or notification preferences you choose
          </li>
          <li>
            <strong>Communications:</strong> such as messages, emails, support requests, and
            other correspondence you send to us
          </li>
          {/* Payment/transaction bullet — uncomment when paid features are introduced
          <li>
            <strong>Payment or transaction-related information:</strong> only if and to the
            extent such features are offered, such as billing contact details or limited
            transaction metadata processed through our service providers
          </li>
          */}
        </ul>

        <h3 className="mt-4 text-lg font-semibold">Information collected automatically</h3>
        <p>
          When you use the Service, we may automatically collect certain technical and usage
          information, including:
        </p>
        <ul className="list-disc space-y-1 pl-6">
          <li>
            <strong>Device and browser information:</strong> such as browser type, operating
            system, device type, language, and similar technical details
          </li>
          <li>
            <strong>Log and network information:</strong> such as IP address, timestamps,
            referring pages, approximate location inferred from IP, and request metadata
          </li>
          <li>
            <strong>Usage information:</strong> such as pages viewed, listings viewed, search
            and filter activity, clicks, navigation paths, session activity, and interactions
            with features, emails, or alerts
          </li>
          <li>
            <strong>Identifiers and local storage data:</strong> such as cookies, session
            identifiers, and similar technologies used to keep you signed in, remember
            preferences, and understand Service usage
          </li>
          <li>
            <strong>Error and diagnostic information:</strong> such as crash data, request
            failures, validation issues, and operational logs used to troubleshoot and secure
            the Service
          </li>
        </ul>

        <h3 className="mt-4 text-lg font-semibold">Information from third parties</h3>
        <p>
          We may receive information from authentication providers, hosting providers,
          analytics providers, email delivery providers, social platforms you choose to link
          or visit, and other service providers that support our operations. We may also
          receive information from market organizers, vendors, or other users when they submit
          content involving you, such as roster requests, public reviews, or verification-related
          information.
        </p>

        <h2 className="mt-6 text-xl font-semibold">2. Public Content and User Submissions</h2>
        <p>
          Some parts of the Service are designed to be public or visible to other users. If
          you submit content for publication, that content may be displayed publicly or shared
          with other users depending on the feature.
        </p>
        <p>Examples of content that may be public or visible to others include:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Market, event, and vendor listing information</li>
          <li>Vendor or organizer profile details you choose to publish</li>
          <li>Reviews, ratings, and related feedback</li>
          <li>Display names, profile images, and public-facing account details</li>
          <li>Other content you knowingly submit to public-facing areas of the Service</li>
        </ul>
        <p>
          Please do not submit sensitive or confidential personal information to public areas
          of the Service unless you intend for that information to be visible to others.
        </p>

        <h2 className="mt-6 text-xl font-semibold">3. How We Use Your Information</h2>
        <p>We use personal information for the following purposes:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Provide, operate, maintain, and improve the Service</li>
          <li>Create and manage accounts and authenticate users</li>
          <li>Publish, review, moderate, verify, and manage listings and submissions</li>
          <li>Process market onboarding, vendor verification requests, roster requests, reviews, and edits</li>
          <li>Send account, security, transactional, and support communications</li>
          <li>Send newsletters, alerts, and other optional communications you request or enable</li>
          <li>Personalize aspects of the Service, such as saved preferences and alerts</li>
          <li>Measure feature usage, understand engagement, and improve the user experience</li>
          <li>Detect, investigate, prevent, and respond to fraud, spam, abuse, policy violations, and security incidents</li>
          <li>Comply with legal obligations and enforce our terms, policies, and rights</li>
          <li>Create aggregated or de-identified analytics and reporting where appropriate</li>
        </ul>

        <p>
          We do not use personal information we collect from you to allow third parties to
          market unrelated products or services to you for their own benefit.
        </p>

        <h2 className="mt-6 text-xl font-semibold">4. Cookies and Similar Technologies</h2>
        <p>
          We use cookies, local storage, and similar technologies to operate the Service,
          maintain session state, remember your preferences, improve performance, understand
          usage patterns, and support security and fraud prevention.
        </p>
        <p>
          Our analytics are processed on infrastructure we own and control. We do not share
          browsing or usage data with third-party advertising networks or data brokers.
          Analytics data is used solely to understand how visitors interact with the Service
          and to improve the experience.
        </p>
        <p>
          Some of these technologies are essential for the Service to function properly. Where
          required, we will seek consent before using non-essential cookies or similar
          technologies. You can also control certain cookie settings through your browser,
          though disabling some technologies may affect functionality.
        </p>

        <h2 className="mt-6 text-xl font-semibold">5. How We Disclose Information</h2>
        <p>
          We may disclose personal information only as reasonably necessary to operate the
          Service, fulfill your requests, protect users and the Service, or comply with law.
        </p>
        <p>We may disclose information to the following categories of recipients:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>
            <strong>Service providers and vendors:</strong> such as providers of hosting,
            infrastructure, authentication, analytics, email delivery, storage, customer
            support, moderation, and security services that process information on our behalf
          </li>
          <li>
            <strong>Other users or the public:</strong> when you submit content to public or
            shared parts of the Service
          </li>
          <li>
            <strong>Organizers, vendors, or verification participants:</strong> where needed to
            process submissions, requests, approvals, disputes, or related workflows
          </li>
          <li>
            <strong>Legal and safety disclosures:</strong> when required by law, subpoena,
            court order, or other legal process, or when we reasonably believe disclosure is
            necessary to protect rights, property, safety, the Service, or others
          </li>
          <li>
            <strong>Business transfers:</strong> in connection with a merger, acquisition,
            financing, restructuring, sale of assets, or similar transaction, subject to
            applicable confidentiality and legal requirements
          </li>
        </ul>

        <p>
          We do not authorize third parties to use personal information we provide to them for
          their own independent marketing or advertising purposes.
        </p>

        <p>
          The Service may link to third-party sites or services such as social media pages,
          event websites, organizer websites, or vendor websites. We are not responsible for
          the privacy practices of those third parties.
        </p>

        <h2 className="mt-6 text-xl font-semibold">6. Email Communications and Notifications</h2>
        <p>
          We may send different kinds of emails and notifications depending on your activity
          and settings, including:
        </p>
        <ul className="list-disc space-y-1 pl-6">
          <li>
            <strong>Essential service communications:</strong> such as account verification,
            password resets, security notices, legal notices, and important transactional or
            operational updates
          </li>
          <li>
            <strong>Optional communications:</strong> such as newsletters, saved search or
            filter alerts, favorite vendor alerts, event notifications, and similar product
            updates you choose to receive
          </li>
        </ul>

        <p>
          You can unsubscribe from optional marketing or newsletter emails at any time by
          using the unsubscribe link in the email or by visiting{" "}
          <Link href="/unsubscribe" className="text-primary hover:underline">
            /unsubscribe
          </Link>
          . You may still receive essential service-related communications when necessary for
          account, security, legal, or transactional purposes.
        </p>

        <h2 className="mt-6 text-xl font-semibold">7. Data Retention</h2>
        <p>
          We retain personal information for as long as reasonably necessary for the purposes
          described in this Privacy Policy, including to provide the Service, maintain
          accounts, support public listings and reviews, resolve disputes, prevent fraud,
          enforce our agreements, comply with legal obligations, and maintain security and
          backup records.
        </p>
        <p>Retention may vary depending on the type of information, including:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>
            <strong>Account information:</strong> generally retained while your account is
            active and for a reasonable period afterward for security, compliance, and recordkeeping
          </li>
          <li>
            <strong>Public listings, profiles, reviews, and submissions:</strong> may be
            retained as part of the operational history and integrity of the Service, including
            where content has been published, moderated, disputed, or relied upon by others
          </li>
          <li>
            <strong>Communications and support records:</strong> retained as reasonably
            necessary to respond to inquiries, investigate issues, and maintain records
          </li>
          <li>
            <strong>Logs, analytics, and diagnostics:</strong> retained for a limited period
            appropriate to security, performance, troubleshooting, and trend analysis
          </li>
        </ul>

        <p>
          When we no longer need personal information, we will delete it, de-identify it, or
          retain it only as permitted or required by law.
        </p>

        <h2 className="mt-6 text-xl font-semibold">8. Your Privacy Choices and Rights</h2>
        <p>
          We believe people should be able to understand, access, and request deletion of
          their personal information regardless of where they live. Subject to verification and
          limited exceptions, you may request that we:
        </p>
        <ul className="list-disc space-y-1 pl-6">
          <li><strong>Access:</strong> provide a copy of the personal information we hold about you</li>
          <li><strong>Correction:</strong> correct inaccurate or incomplete personal information</li>
          <li><strong>Deletion:</strong> delete personal information we hold about you</li>
          <li><strong>Portability:</strong> provide a portable copy of certain information where reasonably feasible</li>
          <li><strong>Withdraw consent:</strong> withdraw consent where processing is based on consent</li>
          <li><strong>Manage communications:</strong> change newsletter, alert, and notification settings</li>
        </ul>

        <p>
          To exercise any of these rights, contact us at{" "}
          <a href="mailto:hello@spokane.markets" className="text-primary hover:underline">
            hello@spokane.markets
          </a>
          . To protect your privacy and security, we may need to verify your identity before
          processing certain requests. In some cases, we may deny or limit a request where
          permitted or required by law, or where the information is necessary for security,
          fraud prevention, legal compliance, dispute resolution, moderation history, or other
          legitimate operational needs.
        </p>

        <p>
          We will not discriminate against you for making a privacy request. If you believe we
          have not handled your request appropriately, you may contact us again using the email
          above.
        </p>

        <h2 className="mt-6 text-xl font-semibold">9. Browser Privacy Signals</h2>
        <p>
          We honor the Global Privacy Control (GPC) signal. When your browser sends a GPC
          signal, we treat it as a request to limit non-essential data collection for that
          session. If you have questions about how GPC works or how we respond to it, contact
          us at the address below.
        </p>

        <h2 className="mt-6 text-xl font-semibold">10. Regional Disclosures</h2>
        <p>
          Some privacy laws provide additional rights depending on where you live. Even so, our
          general practice is to provide meaningful access and deletion rights to all users as
          described above. If specific regional disclosures, request methods, or appeal rights
          apply to you, you may contact us and we will handle your request in accordance with
          applicable law.
        </p>

        <h2 className="mt-6 text-xl font-semibold">11. Security</h2>
        <p>
          We implement reasonable administrative, technical, and organizational safeguards
          designed to protect personal information. These measures may include access controls,
          authentication protections, logging, infrastructure safeguards, and other security
          practices appropriate to the nature of the Service.
        </p>
        <p>
          No method of transmission over the Internet or electronic storage is completely
          secure, and we cannot guarantee absolute security. You are responsible for keeping
          your account credentials confidential and for notifying us promptly of any suspected
          unauthorized access to your account.
        </p>

        <h2 className="mt-6 text-xl font-semibold">12. Children</h2>
        <p>
          The Service is intended for a general audience and is not directed to children under
          13. We do not knowingly collect personal information from children under 13. If you
          believe a child under 13 has provided personal information to us, please contact us
          and we will take appropriate steps to investigate and address the issue.
        </p>

        <h2 className="mt-6 text-xl font-semibold">13. International Use</h2>
        <p>
          The Service is operated in the United States. If you access the Service from outside
          the United States, you understand that your information may be transferred to,
          processed in, and stored in the United States and other jurisdictions where our
          service providers operate, subject to appropriate safeguards where required.
        </p>

        <h2 className="mt-6 text-xl font-semibold">14. Changes to this Privacy Policy</h2>
        <p>
          We may update this Privacy Policy from time to time to reflect changes in the
          Service, our practices, legal requirements, or other operational needs. If we make
          material changes, we will update the &quot;Last updated&quot; date on this page and may provide
          additional notice where appropriate.
        </p>

        <h2 className="mt-6 text-xl font-semibold">15. Contact</h2>
        <p>
          If you have questions about this Privacy Policy or would like to make a privacy
          request, contact us at{" "}
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