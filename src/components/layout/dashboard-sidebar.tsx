"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SITE_NAME } from "@/lib/constants";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { DashboardNavSection } from "@/lib/dashboard-nav";
import {
  Menu,
  X,
  ChevronDown,
  LayoutDashboard,
  Heart,
  User,
  Shield,
  Bell,
  Link2,
  ExternalLink,
  Store,
  PlusCircle,
  MapPin,
} from "lucide-react";

const ICON_MAP = {
  LayoutDashboard,
  Heart,
  User,
  Shield,
  Bell,
  Link2,
  ExternalLink,
  Store,
  PlusCircle,
  MapPin,
} as const;

export type DashboardSidebarProps = {
  title: string;
  subtitle?: string;
  sections: DashboardNavSection[];
  backHref?: string;
  backLabel?: string;
};

export function DashboardSidebar({
  title,
  subtitle,
  sections,
  backHref = "/",
  backLabel = "Back to site",
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const storageKey = "dashboard_sidebar_collapsed_sections_v1";
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") {
      return {};
    }
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return {};
      const ids = JSON.parse(raw) as string[];
      const next: Record<string, boolean> = {};
      for (const id of ids) next[id] = true;
      return next;
    } catch {
      // Ignore bad storage state and fall back to defaults.
      return {};
    }
  });

  const toggleSection = (id: string) => {
    setCollapsedSections((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      const collapsedIds = Object.keys(next).filter((key) => next[key]);
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(collapsedIds));
      } catch {
        // Ignore storage write failures.
      }
      return next;
    });
  };

  const isActive = (href: string) => {
    const base = href.split("?")[0].split("#")[0];
    if (base === "/dashboard") return pathname === "/dashboard";
    if (base.startsWith("/account")) return pathname.startsWith(base);
    return pathname.startsWith(base);
  };

  const normalizedSections = useMemo(
    () =>
      sections.map((section) => ({
        ...section,
        isOpen:
          collapsedSections[section.id] === undefined
            ? section.defaultOpen !== false
            : !collapsedSections[section.id],
      })),
    [sections, collapsedSections]
  );

  return (
    <>
      <button
        aria-label={open ? "Close sidebar" : "Open sidebar"}
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

        <nav className="flex-1 overflow-y-auto p-4 space-y-3">
          {normalizedSections.map((section) => (
            <div key={section.id} className="space-y-1">
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                className="flex w-full items-center justify-between rounded-md px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:bg-muted"
              >
                <span>{section.label}</span>
                <ChevronDown
                  className={cn("h-4 w-4 transition-transform", section.isOpen ? "rotate-0" : "-rotate-90")}
                />
              </button>
              {section.isOpen && (
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const Icon = ICON_MAP[item.icon] ?? Menu;
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href + item.label}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
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
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-border space-y-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            My Account
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
