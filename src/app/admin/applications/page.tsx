import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { ApplicationsClient } from "./applications-client";

export default async function AdminApplicationsPage() {
  await requireAdmin();

  const applications = await db.application.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      form: {
        select: {
          type: true,
          title: true,
          fields: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  // Serialize for client (dates become strings)
  const serialized = applications.map((app) => ({
    ...app,
    answers: (app.answers ?? {}) as Record<string, unknown>,
    form: {
      ...app.form,
      fields: app.form.fields as Array<{ id: string; label: string; type?: string; required?: boolean }>,
    },
    createdAt: app.createdAt.toISOString(),
    updatedAt: app.updatedAt.toISOString(),
    reviewedAt: app.reviewedAt?.toISOString() ?? null,
  }));

  return <ApplicationsClient applications={serialized} />;
}
