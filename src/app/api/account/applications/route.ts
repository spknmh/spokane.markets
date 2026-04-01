import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getApplicationStatusForUser } from "@/lib/account-applications";

/** Current user's applications (no admin notes or internal fields). */
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db.application.findMany({
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

  const applications = rows.map((row) => {
    const { label, description } = getApplicationStatusForUser(row.status);
    return {
      id: row.id,
      name: row.name,
      status: row.status,
      statusLabel: label,
      statusDescription: description,
      formTitle: row.form.title,
      formType: row.form.type,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  });

  return NextResponse.json({ applications });
}
