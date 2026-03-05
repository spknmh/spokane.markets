import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/lib/auth-utils";
import { SITE_NAME } from "@/lib/constants";
import { db } from "@/lib/db";
import { NotificationPreferencesForm } from "./notification-preferences-form";

export const metadata: Metadata = {
  title: `Notification Preferences — ${SITE_NAME}`,
  description: "Manage your notification preferences.",
};

export default async function AccountNotificationsPage() {
  const session = await requireAuth();

  let prefs = await db.notificationPreference.findUnique({
    where: { userId: session.user.id },
  });

  if (!prefs) {
    prefs = await db.notificationPreference.create({
      data: { userId: session.user.id },
    });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-bold tracking-tight">
        Notification Preferences
      </h1>
      <p className="mt-1 text-muted-foreground">
        Choose what emails and in-app notifications you receive.
      </p>

      <NotificationPreferencesForm initialPrefs={prefs} />

      <p className="mt-6 text-sm text-muted-foreground">
        You can also{" "}
        <Link href="/unsubscribe" className="text-primary hover:underline">
          unsubscribe from marketing emails
        </Link>{" "}
        at any time.
      </p>
    </div>
  );
}
