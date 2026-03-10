import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { notificationPreferenceSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let prefs = await db.notificationPreference.findUnique({
    where: { userId: session.user.id },
  });

  if (!prefs) {
    prefs = await db.notificationPreference.create({
      data: {
        userId: session.user.id,
      },
    });
  }

  return NextResponse.json(prefs);
}

export async function PUT(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = notificationPreferenceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: "Validation failed", details: parsed.error.flatten() } },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const updateData: Record<string, unknown> = {};
  const fields = [
    "emailEnabled", "inAppEnabled",
    "inAppOperationalEnabled", "inAppDiscoveryEnabled",
    "inAppTrustSafetyEnabled", "inAppGrowthEnabled", "inAppSystemEnabled",
    "weeklyDigestEnabled", "eventMatchEnabled", "favoriteVendorEnabled",
    "organizerAlertsEnabled", "vendorRequestAlertsEnabled", "reviewAlertsEnabled",
    "frequency", "quietHoursStart", "quietHoursEnd",
  ] as const;
  for (const field of fields) {
    if (data[field] !== undefined) updateData[field] = data[field];
  }

  const prefs = await db.notificationPreference.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      emailEnabled: data.emailEnabled ?? true,
      inAppEnabled: data.inAppEnabled ?? true,
      inAppOperationalEnabled: data.inAppOperationalEnabled ?? true,
      inAppDiscoveryEnabled: data.inAppDiscoveryEnabled ?? true,
      inAppTrustSafetyEnabled: data.inAppTrustSafetyEnabled ?? true,
      inAppGrowthEnabled: data.inAppGrowthEnabled ?? true,
      inAppSystemEnabled: data.inAppSystemEnabled ?? true,
      weeklyDigestEnabled: data.weeklyDigestEnabled ?? true,
      eventMatchEnabled: data.eventMatchEnabled ?? true,
      favoriteVendorEnabled: data.favoriteVendorEnabled ?? true,
      organizerAlertsEnabled: data.organizerAlertsEnabled ?? true,
      vendorRequestAlertsEnabled: data.vendorRequestAlertsEnabled ?? true,
      reviewAlertsEnabled: data.reviewAlertsEnabled ?? true,
      frequency: data.frequency ?? "immediate",
      quietHoursStart: data.quietHoursStart ?? null,
      quietHoursEnd: data.quietHoursEnd ?? null,
    },
    update: updateData,
  });

  return NextResponse.json(prefs);
}
