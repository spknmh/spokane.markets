"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, LayoutDashboard, Store, Shield, LogOut, Bell, Home, Settings } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Session } from "@/lib/auth";

interface UserMenuProps {
  session: NonNullable<Session>;
}

export function UserMenu({ session }: UserMenuProps) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const role = session.user?.role;
  const isAdmin = role === "ADMIN";
  const isVendor = role === "VENDOR" || role === "ORGANIZER";
  const isOrganizer = role === "ORGANIZER";

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="outline"
        size="default"
        onClick={() => setOpen(!open)}
        className="gap-2 text-base"
      >
        <span className="max-w-[120px] truncate">
          {session.user?.name ?? session.user?.email}
        </span>
        {role && (
          <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium">
            {role}
          </span>
        )}
        <ChevronDown
          className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
        />
      </Button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[200px] rounded-md border border-border bg-background py-1 shadow-lg">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
          >
            <Home className="h-4 w-4" />
            My Account
          </Link>
          <Link
            href="/account/settings"
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
          >
            <Settings className="h-4 w-4" />
            Account Settings
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
            >
              <Shield className="h-4 w-4" />
              Admin
            </Link>
          )}
          {isOrganizer && (
            <Link
              href="/organizer/dashboard"
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
            >
              <LayoutDashboard className="h-4 w-4" />
              Organizer Dashboard
            </Link>
          )}
          {isVendor && (
            <Link
              href="/vendor/dashboard"
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
            >
              <Store className="h-4 w-4" />
              Vendor Dashboard
            </Link>
          )}
          <Link
            href="/notifications"
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
          >
            <Bell className="h-4 w-4" />
            Notifications
          </Link>
          <button
            type="button"
            onClick={async () => {
              await authClient.signOut();
              window.location.href = "/";
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
