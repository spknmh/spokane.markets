"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SITE_NAME } from "@/lib/constants";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Menu,
  X,
  LayoutDashboard,
  Filter,
  CheckCircle2,
  Heart,
  User,
  Calendar,
  Award,
  Settings,
  Shield,
  Eye,
  Bell,
  Bookmark,
  Link2,
  ExternalLink,
  Store,
  PlusCircle,
  MapPin,
} from "lucide-react";

const ICON_MAP = {
  LayoutDashboard,
  Filter,
  CheckCircle2,
  Heart,
  User,
  Calendar,
  Award,
  Settings,
  Shield,
  Eye,
  Bell,
  Bookmark,
  Link2,
  ExternalLink,
  Store,
  PlusCircle,
  MapPin,
} as const;

export type DashboardNavItem = {
  label: string;
  href: string;
  icon: keyof typeof ICON_MAP;
};

export type DashboardSidebarProps = {
  title: string;
  subtitle?: string;
  items: DashboardNavItem[];
  backHref?: string;
  backLabel?: string;
};

export function DashboardSidebar({
  title,
  subtitle,
  items,
  backHref = "/",
  backLabel = "Back to site",
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => {
    const base = href.split("?")[0].split("#")[0];
    if (base === "/dashboard") return pathname === "/dashboard";
    if (base.startsWith("/account")) return pathname.startsWith(base);
    return pathname.startsWith(base);
  };

  return (
    <>
      <button
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-md bg-background border border-border"
        onClick={() => setOpen(!open)}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border flex flex-col transition-transform lg:translate-x-0 lg:static lg:z-auto",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-6 border-b border-border">
          <Link href="/dashboard" className="text-lg font-bold">
            {SITE_NAME}
          </Link>
          <p className="text-xs text-muted-foreground">{subtitle ?? title}</p>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-0.5">
          {items.map((item) => {
            const Icon = ICON_MAP[item.icon] ?? Menu;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href + item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border space-y-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            My Dashboard
          </Link>
          <Link
            href={backHref}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-muted hover:text-primary transition-colors"
          >
            &larr; {backLabel}
          </Link>
        </div>
      </aside>
    </>
  );
}
