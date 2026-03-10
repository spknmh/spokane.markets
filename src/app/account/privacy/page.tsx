import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/lib/auth-utils";
import { SITE_NAME } from "@/lib/constants";
import { db } from "@/lib/db";
import { PrivacyForm } from "./privacy-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Privacy — ${SITE_NAME}`,
  description: "Manage your privacy preferences.",
};

export default async function AccountPrivacyPage() {
  const session = await requireAuth("/account/privacy");

  const vendorProfile = await db.vendorProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      contactVisible: true,
      socialLinksVisible: true,
    },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Privacy</h1>
      <p className="text-muted-foreground">
        Control your profile visibility and data preferences.
      </p>

      {vendorProfile ? (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Vendor profile visibility</h2>
          <p className="text-sm text-muted-foreground">
            Control what visitors see on your public vendor profile.
          </p>
          <PrivacyForm
            contactVisible={vendorProfile.contactVisible ?? true}
            socialLinksVisible={vendorProfile.socialLinksVisible ?? true}
          />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          You don&apos;t have a vendor profile. Privacy settings are available when you{" "}
          <Link href="/vendor/profile/edit" className="text-primary hover:underline">
            create a vendor profile
          </Link>
          .
        </p>
      )}

      <p className="text-sm text-muted-foreground">
        <Link href="/account/notifications" className="text-primary hover:underline">
          Manage notification preferences
        </Link>
      </p>
    </div>
  );
}
