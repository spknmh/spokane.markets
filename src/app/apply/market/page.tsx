import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { ApplicationForm } from "../components/application-form";

export const metadata: Metadata = {
  title: `Apply as a Market — ${SITE_NAME}`,
  description: `Apply to list your market on ${SITE_NAME}. Reach vendors and visitors across the Spokane area.`,
};

export default async function MarketApplyPage() {
  const form = await db.applicationForm.findUnique({
    where: { type: "MARKET" },
  });

  if (!form || !form.active) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <h1 className="text-2xl font-bold">Market Applications</h1>
          <p className="mt-4 text-muted-foreground">
            We&apos;re not currently accepting market applications. Please check back later.
          </p>
          <Button asChild variant="outline" className="mt-6">
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <ApplicationForm
        form={{
          id: form.id,
          type: form.type,
          title: form.title,
          description: form.description,
          fields: form.fields as unknown,
        }}
        formType="MARKET"
      />
    </div>
  );
}
