"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/user-menu";
import type { Session } from "next-auth";

function getNavLinks(session: Session | null) {
  const base = [
    { href: "/events", label: "Events" },
    { href: "/markets", label: "Markets" },
    { href: "/vendors", label: "Vendors" },
  ];
  if (session?.user) {
    base.push({ href: "/submit", label: "Submit Event" });
  }
  if (session?.user?.role === "VENDOR") {
    base.push({ href: "/vendor-survey", label: "Vendor Survey" });
  }
  return base;
}

interface NavbarClientProps {
  session: Session | null;
}

export function NavbarClient({ session }: NavbarClientProps) {
  const navLinks = React.useMemo(
    () => getNavLinks(session),
    [session?.user?.role, session?.user]
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-foreground transition-colors hover:text-primary"
        >
          <Store className="h-5 w-5 text-primary" aria-hidden />
          Spokane Markets
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex md:items-center md:gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop auth */}
        <div className="hidden md:flex md:items-center md:gap-3">
          {session ? (
            <UserMenu session={session} />
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/auth/signin">Sign In</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/auth/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <MobileNav session={session} navLinks={navLinks} />
      </nav>
    </header>
  );
}

function MobileNav({
  session,
  navLinks,
}: {
  session: Session | null;
  navLinks: Array<{ href: string; label: string }>;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="flex md:hidden">
      <Button
        variant="ghost"
        size="icon"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen(!open)}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <div className="fixed right-0 top-16 z-50 flex h-[calc(100vh-4rem)] w-64 flex-col gap-4 border-l border-border bg-background p-4 shadow-lg">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-auto flex flex-col gap-2 border-t border-border pt-4">
              {session ? (
                <>
                  <UserMenu session={session} />
                </>
              ) : (
                <>
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href="/auth/signin" onClick={() => setOpen(false)}>
                      Sign In
                    </Link>
                  </Button>
                  <Button asChild size="sm" className="w-full">
                    <Link href="/auth/signup" onClick={() => setOpen(false)}>
                      Sign Up
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
