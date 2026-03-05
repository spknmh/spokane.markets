import { auth } from "@/auth";
import { db } from "@/lib/db";
import { notificationPreferenceSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
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
  const session = await auth();
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
  if (data.emailEnabled !== undefined) updateData.emailEnabled = data.emailEnabled;
  if (data.inAppEnabled !== undefined) updateData.inAppEnabled = data.inAppEnabled;
  if (data.weeklyDigestEnabled !== undefined)
    updateData.weeklyDigestEnabled = data.weeklyDigestEnabled;
  if (data.eventMatchEnabled !== undefined)
    updateData.eventMatchEnabled = data.eventMatchEnabled;
  if (data.favoriteVendorEnabled !== undefined)
    updateData.favoriteVendorEnabled = data.favoriteVendorEnabled;
  if (data.organizerAlertsEnabled !== undefined)
    updateData.organizerAlertsEnabled = data.organizerAlertsEnabled;
  if (data.vendorRequestAlertsEnabled !== undefined)
    updateData.vendorRequestAlertsEnabled = data.vendorRequestAlertsEnabled;
  if (data.reviewAlertsEnabled !== undefined)
    updateData.reviewAlertsEnabled = data.reviewAlertsEnabled;
  if (data.frequency !== undefined) updateData.frequency = data.frequency;
  if (data.quietHoursStart !== undefined)
    updateData.quietHoursStart = data.quietHoursStart;
  if (data.quietHoursEnd !== undefined)
    updateData.quietHoursEnd = data.quietHoursEnd;

  const prefs = await db.notificationPreference.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      emailEnabled: data.emailEnabled ?? true,
      inAppEnabled: data.inAppEnabled ?? true,
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
