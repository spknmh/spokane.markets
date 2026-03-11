import Link from "next/link";
import { Store } from "lucide-react";
import { headers } from "next/headers";
import { SITE_NAME, LEGAL_ENTITY } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AuthGate } from "@/components/auth-gate";

export async function Footer() {
  const [session, applicationForms] = await Promise.all([
    auth.api.getSession({ headers: await headers() }),
    db.applicationForm.findMany({
      where: { type: { in: ["VENDOR", "MARKET"] } },
      select: { type: true, active: true },
    }),
  ]);
  const isAdmin = session?.user?.role === "ADMIN";
  const vendorApplicationsOpen = applicationForms.some(
    (form) => form.type === "VENDOR" && form.active
  );
  const marketApplicationsOpen = applicationForms.some(
    (form) => form.type === "MARKET" && form.active
  );

  return (
    <footer className="border-t border-primary/30 bg-primary">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Branding */}
          <div className="flex flex-col gap-3">
            <Link
              href="/"
              prefetch={false}
              className="flex items-center gap-2 font-semibold text-primary-foreground transition-colors hover:text-primary-foreground/90"
            >
              <Store className="h-5 w-5 text-primary-foreground" aria-hidden />
              {SITE_NAME}
            </Link>
            <p className="text-sm text-primary-foreground/90">
              Your community hub for local markets, craft fairs, and vendor events in the Spokane area.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-primary-foreground">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/about"
                  className="text-sm text-primary-foreground/90 transition-colors hover:text-primary-foreground"
                >
                  About & Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/about/backstory"
                  className="text-sm text-primary-foreground/90 transition-colors hover:text-primary-foreground"
                >
                  Backstory
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-primary-foreground/90 transition-colors hover:text-primary-foreground"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-primary-foreground/90 transition-colors hover:text-primary-foreground"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <AuthGate session={session} callbackUrl="/submit">
                  <Link
                    href="/submit"
                    className="text-sm text-primary-foreground/90 transition-colors hover:text-primary-foreground"
                  >
                    Submit Event
                  </Link>
                </AuthGate>
              </li>
              {vendorApplicationsOpen && (
                <li>
                  <Link
                    href="/apply/vendor"
                    className="text-sm text-primary-foreground/90 transition-colors hover:text-primary-foreground"
                  >
                    Apply as a Vendor
                  </Link>
                </li>
              )}
              {marketApplicationsOpen && (
                <li>
                  <Link
                    href="/apply/market"
                    className="text-sm text-primary-foreground/90 transition-colors hover:text-primary-foreground"
                  >
                    List Your Market
                  </Link>
                </li>
              )}
              <li>
                <Link
                  href="/vendor-survey"
                  className="text-sm text-primary-foreground/90 transition-colors hover:text-primary-foreground"
                >
                  Vendor Survey
                </Link>
              </li>
              {isAdmin && (
                <li>
                  <Link
                    href="/admin"
                    className="text-sm text-primary-foreground/90 transition-colors hover:text-primary-foreground"
                  >
                    Admin
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="lg:col-span-2">
            <h3 className="mb-3 text-sm font-semibold text-primary-foreground">Newsletter</h3>
            <p className="mb-3 text-sm text-primary-foreground/90">
              Get updates on new markets and events in your inbox.{" "}
              <Link href="/privacy" className="underline hover:text-primary-foreground">
                Privacy Policy
              </Link>
            </p>
            <form
              action="/api/subscribe"
              method="POST"
              className="flex flex-col gap-2 sm:flex-row sm:max-w-md"
            >
              <label htmlFor="footer-email" className="sr-only">Email address</label>
              <input
                id="footer-email"
                type="email"
                name="email"
                aria-label="Email address"
                placeholder="you@example.com"
                required
                className="h-10 flex-1 rounded-md border border-primary-foreground/30 bg-primary-foreground/10 px-3 text-sm text-primary-foreground placeholder:text-primary-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary-foreground"
              />
              <Button type="submit" size="default" variant="secondary" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                Subscribe
              </Button>
            </form>
          </div>
        </div>

        <div className="mt-10 border-t border-primary-foreground/20 pt-8">
          <p className="text-center text-sm text-primary-foreground/90">
            © {new Date().getFullYear()} {LEGAL_ENTITY}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
