import Link from "next/link";
import { Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { auth } from "@/auth";

export async function Footer() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <footer className="border-t border-border bg-muted/50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Branding */}
          <div className="flex flex-col gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 font-semibold text-foreground transition-colors hover:text-primary"
            >
              <Store className="h-5 w-5 text-primary" aria-hidden />
              Spokane Markets
            </Link>
            <p className="text-sm text-muted-foreground">
              Your community hub for local markets, craft fairs, and vendor events in the Spokane area.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/about"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  About & Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/submit"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  Submit Event
                </Link>
              </li>
              <li>
                <Link
                  href="/vendor-survey"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  Vendor Survey
                </Link>
              </li>
              {isAdmin && (
                <li>
                <Link
                  href="/admin"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                    Admin
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="lg:col-span-2">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Newsletter</h3>
            <p className="mb-3 text-sm text-muted-foreground">
              Get updates on new markets and events in your inbox.
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
                className="h-10 flex-1 rounded-md border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <Button type="submit" size="default">
                Subscribe
              </Button>
            </form>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-8">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Spokane Markets. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
