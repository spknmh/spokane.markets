"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";

const navItems = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Content", href: "/admin/content", icon: LayoutTemplate },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Events", href: "/admin/events", icon: Calendar },
  { label: "Markets", href: "/admin/markets", icon: Store },
  { label: "Venues", href: "/admin/venues", icon: MapPin },
  { label: "Vendors", href: "/admin/vendors", icon: ShoppingBag },
  { label: "Submissions", href: "/admin/submissions", icon: Inbox },
  { label: "Reviews", href: "/admin/reviews", icon: MessageSquare },
  { label: "Photos", href: "/admin/photos", icon: ImageIcon },
  { label: "Claims", href: "/admin/claims", icon: Shield },
  { label: "Reports", href: "/admin/reports", icon: Flag },
  { label: "Subscribers", href: "/admin/subscribers", icon: Mail },
  { label: "Audit Log", href: "/admin/audit-log", icon: FileText },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
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
            Spokane Markets
          </Link>
          <p className="text-xs text-muted-foreground">Admin Dashboard</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive(item.href)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-primary"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
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
