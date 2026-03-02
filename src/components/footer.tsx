import Link from "next/link";
import { Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { auth } from "@/auth";
import { AuthGate } from "@/components/auth-gate";

export async function Footer() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <footer className="border-t border-primary/30 bg-primary">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Branding */}
          <div className="flex flex-col gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 font-semibold text-primary-foreground transition-colors hover:text-primary-foreground/90"
            >
              <Store className="h-5 w-5 text-primary-foreground" aria-hidden />
              Spokane Markets
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
              action="/api/newsletter"
              method="POST"
              className="flex flex-col gap-2 sm:flex-row sm:max-w-md"
            >
              <input
                type="email"
                name="email"
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
            © {new Date().getFullYear()} Spokane Markets. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
