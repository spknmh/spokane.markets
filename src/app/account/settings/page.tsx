import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { ProfileForm } from "@/components/profile-form";
import { AccountSettingsClient } from "./account-settings-client";

export const metadata: Metadata = {
  title: "Account Settings — Spokane Markets",
  description: "Manage your account settings.",
};

export default async function AccountSettingsPage() {
  const session = await requireAuth();

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      image: true,
      role: true,
      hashedPassword: true,
    },
  });

  const prefs = await db.notificationPreference.findUnique({
    where: { userId: session.user.id },
  });

  const emailsPaused = !!prefs?.emailsPausedAt;

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
      <p className="text-muted-foreground">
        Manage your email, password, and account preferences.
      </p>

      <section>
        <h2 className="text-xl font-semibold">Profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your display name and email. Email change requires verification (coming soon).
        </p>
        <div className="mt-4">
          <ProfileForm
            initialName={user.name}
            email={user.email}
            image={user.image}
            role={user.role}
          />
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Password</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {user.hashedPassword
            ? "Change your password. Required for account deletion."
            : "You signed in with a social account. Password change is not available."}
        </p>
        {user.hashedPassword && (
          <div className="mt-4">
            <AccountSettingsClient
              emailsPaused={emailsPaused}
              hasPassword={true}
              section="password"
            />
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold">Email preferences</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pause all marketing emails temporarily. You will still receive transactional emails (password reset, verification).
        </p>
        <div className="mt-4">
          <AccountSettingsClient
            emailsPaused={emailsPaused}
            hasPassword={!!user.hashedPassword}
            section="pause"
          />
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Export data</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Download a copy of your data (profile, RSVPs, saved filters, favorites, reviews).
        </p>
        <div className="mt-4">
          <a
            href="/api/account/export"
            download
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Export my data
          </a>
        </div>
      </section>

      <section className="border-t border-border pt-8">
        <h2 className="text-xl font-semibold text-destructive">Delete account</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Permanently delete your account and all associated data. This cannot be undone.
        </p>
        <div className="mt-4">
          <AccountSettingsClient
            emailsPaused={emailsPaused}
            hasPassword={!!user.hashedPassword}
            section="delete"
          />
        </div>
      </section>

      <p className="text-sm text-muted-foreground">
        <Link href="/account/notifications" className="text-primary hover:underline">
          Manage notification preferences
        </Link>
      </p>
    </div>
  );
}
