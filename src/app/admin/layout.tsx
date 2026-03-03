import { requireAdmin } from "@/lib/auth-utils";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import Link from "next/link";

export const metadata = {
  title: "Admin Dashboard - Spokane Markets",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div data-theme="admin" className="flex min-h-screen bg-background">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="shrink-0 border-b border-border px-6 py-3 flex items-center justify-end">
          <Link
            href="/"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            View site →
          </Link>
        </header>
        <main className="flex-1 p-6 lg:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
