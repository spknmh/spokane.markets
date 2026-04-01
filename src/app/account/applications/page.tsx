import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { SITE_NAME } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getApplicationStatusForUser } from "@/lib/account-applications";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `My applications — ${SITE_NAME}`,
  description: "Status of your submissions to Spokane Markets.",
};

export default async function AccountApplicationsPage() {
  const session = await requireAuth("/account/applications");

  const applications = await db.application.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      form: { select: { title: true, type: true } },
    },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My applications</h1>
        <p className="mt-1 text-muted-foreground">
          Submissions tied to your account. For vendor or organizer tools, use your dashboards.
        </p>
      </div>

      {applications.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          You don&apos;t have any applications yet. When you apply to become a vendor or submit a
          listing request, status will appear here.{" "}
          <Link href="/dashboard" className="font-medium text-primary hover:underline">
            Back to account overview
          </Link>
        </p>
      ) : (
        <ul className="space-y-4">
          {applications.map((app) => {
            const { label, description } = getApplicationStatusForUser(app.status);
            return (
              <li key={app.id}>
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base">{app.form.title}</CardTitle>
                        <CardDescription>{app.name}</CardDescription>
                      </div>
                      <Badge variant="secondary">{label}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p className="text-muted-foreground">{description}</p>
                    <p className="text-xs text-muted-foreground">
                      Submitted {formatDate(app.createdAt)}
                      {app.updatedAt.getTime() !== app.createdAt.getTime()
                        ? ` · Updated ${formatDate(app.updatedAt)}`
                        : ""}
                    </p>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
