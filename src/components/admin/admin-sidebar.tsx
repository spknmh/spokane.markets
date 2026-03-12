"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SITE_NAME } from "@/lib/constants";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Calendar,
  Store,
  MapPin,
  Inbox,
  MessageSquare,
  Shield,
  Mail,
  Users,
  Menu,
  X,
  ImageIcon,
  LayoutTemplate,
  Flag,
  ShoppingBag,
  FileText,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Database,
  Megaphone,
  Tag,
} from "lucide-react";

type NavItem = { label: string; href: string; icon: React.ComponentType<{ className?: string }> };

type NavGroup = {
  label: string;
  defaultOpen?: boolean;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    label: "Operations",
    defaultOpen: true,
    items: [
      { label: "Overview", href: "/admin", icon: LayoutDashboard },
      { label: "Queues", href: "/admin/queues", icon: ClipboardList },
      { label: "Promotions", href: "/admin/promotions", icon: Megaphone },
    ],
  },
  {
    label: "Directory",
    defaultOpen: true,
    items: [
      { label: "Events", href: "/admin/events", icon: Calendar },
      { label: "Vendors", href: "/admin/vendors", icon: ShoppingBag },
      { label: "Markets", href: "/admin/markets", icon: Store },
      { label: "Venues", href: "/admin/venues", icon: MapPin },
      { label: "Neighborhoods", href: "/admin/neighborhoods", icon: MapPin },
      { label: "Event Types & Features", href: "/admin/categories", icon: Tag },
    ],
  },
  {
    label: "Users",
    defaultOpen: true,
    items: [
      { label: "Users", href: "/admin/users", icon: Users },
      { label: "Subscribers", href: "/admin/subscribers", icon: Mail },
    ],
  },
  {
    label: "Moderation",
    defaultOpen: true,
    items: [
      { label: "Applications", href: "/admin/applications", icon: FileText },
      { label: "Submissions", href: "/admin/submissions", icon: Inbox },
      { label: "Reviews", href: "/admin/reviews", icon: MessageSquare },
      { label: "Photos", href: "/admin/photos", icon: ImageIcon },
      { label: "Reports", href: "/admin/reports", icon: Flag },
      { label: "Claims", href: "/admin/claims", icon: Shield },
    ],
  },
  {
    label: "System",
    defaultOpen: true,
    items: [
      { label: "Site Settings", href: "/admin/settings", icon: LayoutTemplate },
      { label: "Data", href: "/admin/data", icon: Database },
      { label: "Audit Log", href: "/admin/audit-log", icon: FileText },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      navGroups.map((g) => [g.label, g.defaultOpen ?? false])
    )
  );

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    if (href === "/admin/settings") {
      return pathname === "/admin/settings";
    }
    return pathname.startsWith(href);
  };

  const toggleGroup = (label: string) => {
    setExpanded((prev) => ({ ...prev, [label]: !prev[label] }));
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
          <Link href="/admin" className="text-lg font-bold">
            {SITE_NAME}
          </Link>
          <p className="text-xs text-muted-foreground">Admin Dashboard</p>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {navGroups.map((group) => {
            const isExpanded = expanded[group.label];
            const hasActive = group.items.some((item) => isActive(item.href));
            return (
              <div key={group.label} className="space-y-1">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.label)}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    hasActive
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0" />
                  )}
                  {group.label}
                </button>
                {isExpanded && (
                  <div className="ml-4 space-y-0.5 border-l border-border pl-2">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href + item.label}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                            isActive(item.href)
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:bg-muted hover:text-primary"
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
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            &larr; Back to site
          </Link>
        </div>
      </aside>
    </>
  );
}
