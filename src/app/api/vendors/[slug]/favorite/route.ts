import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { evaluateAndGrantBadges } from "@/lib/badges";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ favorited: false, emailAlerts: false });
  }

  const { slug } = await params;
  const vendor = await db.vendorProfile.findUnique({ where: { slug } });
  if (!vendor) {
    return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  }

  const fav = await db.favoriteVendor.findUnique({
    where: {
      userId_vendorProfileId: {
        userId: session.user.id!,
        vendorProfileId: vendor.id,
      },
    },
  });
  return NextResponse.json({
    favorited: !!fav,
    emailAlerts: fav?.emailAlerts ?? false,
  });
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const vendor = await db.vendorProfile.findUnique({ where: { slug } });
  if (!vendor) {
    return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  }

  const userId = session.user.id!;

  const existing = await db.favoriteVendor.findUnique({
    where: {
      userId_vendorProfileId: { userId, vendorProfileId: vendor.id },
    },
  });

  if (existing) {
    await db.favoriteVendor.delete({ where: { id: existing.id } });
    return NextResponse.json({ favorited: false });
  }

  await db.favoriteVendor.create({
    data: {
      userId,
      vendorProfileId: vendor.id,
      emailAlerts: true,
    },
  });
  evaluateAndGrantBadges(userId).catch(() => {});
  return NextResponse.json({ favorited: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const vendor = await db.vendorProfile.findUnique({ where: { slug } });
  if (!vendor) {
    return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  }

  await db.favoriteVendor.deleteMany({
    where: {
      userId: session.user.id!,
      vendorProfileId: vendor.id,
    },
  });
  return NextResponse.json({ favorited: false });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const vendor = await db.vendorProfile.findUnique({ where: { slug } });
  if (!vendor) {
    return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  }

  const body = await request.json();
  const emailAlerts = body?.emailAlerts;
  if (typeof emailAlerts !== "boolean") {
    return NextResponse.json(
      { error: "emailAlerts must be a boolean" },
      { status: 400 }
    );
  }

  const updated = await db.favoriteVendor.updateMany({
    where: {
      userId: session.user.id!,
      vendorProfileId: vendor.id,
    },
    data: { emailAlerts },
  });

  if (updated.count === 0) {
    return NextResponse.json({ error: "Favorite not found" }, { status: 404 });
  }
  return NextResponse.json({ emailAlerts });
}
