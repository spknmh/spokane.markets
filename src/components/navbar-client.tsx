"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X, Store, Home, Bell } from "lucide-react";
import { SITE_NAME } from "@/lib/constants";
import { NotificationBell } from "@/components/notification-bell";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthGate } from "@/components/auth-gate";
import type { Session } from "next-auth";

function getNavLinks(session: Session | null) {
  const base = [
    { href: "/", label: "Home", icon: Home },
    { href: "/events", label: "Events" },
    { href: "/markets", label: "Markets" },
    { href: "/vendors", label: "Vendors" },
    { href: "/submit", label: "Submit Event" },
  ];
  if (session?.user?.role === "VENDOR") {
    base.push({ href: "/vendor-survey", label: "Vendor Survey" });
  }
  return base;
}

interface NavbarClientProps {
  session: Session | null;
  unreadCount?: number;
}

export function NavbarClient({ session, unreadCount = 0 }: NavbarClientProps) {
  const navLinks = React.useMemo(
    () => getNavLinks(session),
    [session?.user?.role, session?.user]
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-nav/95 backdrop-blur supports-[backdrop-filter]:bg-nav/95">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-foreground transition-colors hover:text-link hover:underline"
        >
          <Store className="h-5 w-5 text-primary" aria-hidden />
          {SITE_NAME}
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex md:items-center md:gap-8">
          {navLinks.map((link) => {
            const Icon = "icon" in link ? link.icon : null;
            const linkEl = (
              <Link
                href={link.href}
                className="flex items-center gap-1.5 text-sm font-medium text-link transition-colors hover:text-link/90 hover:underline"
              >
                {Icon && <Icon className="h-4 w-4" aria-hidden />}
                {link.label}
              </Link>
            );
            return link.href === "/submit" ? (
              <AuthGate key={link.href} session={session} callbackUrl="/submit">
                {linkEl}
              </AuthGate>
            ) : (
              <React.Fragment key={link.href}>{linkEl}</React.Fragment>
            );
          })}
        </div>

        {/* Desktop auth */}
        <div className="hidden md:flex md:items-center md:gap-2">
          <ThemeToggle />
          {session && (
            <NotificationBell unreadCount={unreadCount} />
          )}
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
        <MobileNav session={session} navLinks={navLinks} unreadCount={unreadCount} />
      </nav>
    </header>
  );
}

function MobileNav({
  session,
  navLinks,
  unreadCount = 0,
}: {
  session: Session | null;
  navLinks: Array<{ href: string; label: string; icon?: React.ComponentType<{ className?: string }> }>;
  unreadCount?: number;
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
          <div className="fixed right-0 top-16 z-50 flex h-[calc(100vh-4rem)] w-64 flex-col gap-4 border-l border-border bg-nav p-4 shadow-lg">
            {navLinks.map((link) => {
              const Icon = "icon" in link ? link.icon : null;
              const linkEl = (
                <Link
                  href={link.href}
                  className="flex items-center gap-2 text-sm font-medium text-link transition-colors hover:text-link/90 hover:underline"
                  onClick={() => setOpen(false)}
                >
                  {Icon && <Icon className="h-4 w-4" aria-hidden />}
                  {link.label}
                </Link>
              );
              return link.href === "/submit" ? (
                <AuthGate key={link.href} session={session} callbackUrl="/submit">
                  {linkEl}
                </AuthGate>
              ) : (
                <React.Fragment key={link.href}>{linkEl}</React.Fragment>
              );
            })}
            <div className="mt-auto flex flex-col gap-2 border-t border-border pt-4">
              {session && (
                <Link
                  href="/notifications"
                  className="flex items-center gap-2 text-sm font-medium text-link transition-colors hover:text-link/90 hover:underline"
                  onClick={() => setOpen(false)}
                >
                  <Bell className="h-4 w-4" />
                  Notifications
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Link>
              )}
              <ThemeToggle />
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
