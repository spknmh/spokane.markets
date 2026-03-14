import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { SITE_NAME } from "@/lib/constants";
import { getNeighborhoodOptions } from "@/lib/neighborhoods";
import { OrganizerMarketCreateForm } from "@/components/organizer-market-create-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Create Market — ${SITE_NAME}`,
};

export default async function OrganizerCreateMarketPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const [venues, neighborhoods] = await Promise.all([
    db.venue.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    getNeighborhoodOptions(),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground hover:text-primary"
        >
          ← Back to Dashboard
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Create Market</h1>
        <p className="mt-1 text-muted-foreground">
          Your market will appear as pending until an admin reviews it.
        </p>
      </div>

      <OrganizerMarketCreateForm venues={venues} neighborhoods={neighborhoods} />
    </div>
  );
}
