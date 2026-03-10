import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/lib/auth-utils";
import { SITE_NAME } from "@/lib/constants";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SecuritySessionsClient } from "./security-sessions-client";

export const metadata: Metadata = {
  title: `Security — ${SITE_NAME}`,
  description: "Manage your account security.",
};

export default async function AccountSecurityPage() {
  const session = await requireAuth("/account/security");

  const sessions = await db.session.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Security</h1>
      <p className="text-muted-foreground">
        Manage two-factor authentication and sessions.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Active sessions</CardTitle>
          <CardDescription>
            Devices where you are currently signed in. Sign out from other devices if you don&apos;t recognize them.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No active sessions found.
            </p>
          ) : (
            <ul className="space-y-3">
              {sessions.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      Session {sessions.indexOf(s) === 0 ? "(current)" : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Created {new Date(s.createdAt).toLocaleString()} · Expires{" "}
                      {new Date(s.expiresAt).toLocaleString()}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {sessions.length > 1 && (
            <SecuritySessionsClient sessionCount={sessions.length} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Two-factor authentication</CardTitle>
          <CardDescription>
            Add an extra layer of security with TOTP (authenticator app). Coming in a future release.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            2FA will allow you to use an authenticator app (e.g. Google Authenticator) to verify your identity when signing in.
          </p>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        <Link href="/account/settings" className="text-primary hover:underline">
          Change password
        </Link>
      </p>
    </div>
  );
}
