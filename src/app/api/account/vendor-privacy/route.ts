import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

const vendorPrivacySchema = z.object({
  contactVisible: z.boolean().optional(),
  socialLinksVisible: z.boolean().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await db.vendorProfile.findUnique({
    where: { userId: session.user.id },
    select: { contactVisible: true, socialLinksVisible: true },
  });

  if (!profile) {
    return NextResponse.json(
      { error: "No vendor profile found" },
      { status: 404 }
    );
  }

  return NextResponse.json(profile);
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await db.vendorProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json(
      { error: "No vendor profile found" },
      { status: 404 }
    );
  }

  const body = await request.json();
  const parsed = vendorPrivacySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input" },
      { status: 400 }
    );
  }

  const data: { contactVisible?: boolean; socialLinksVisible?: boolean } = {};
  if (parsed.data.contactVisible !== undefined) {
    data.contactVisible = parsed.data.contactVisible;
  }
  if (parsed.data.socialLinksVisible !== undefined) {
    data.socialLinksVisible = parsed.data.socialLinksVisible;
  }

  const profile = await db.vendorProfile.update({
    where: { userId: session.user.id },
    data,
  });

  return NextResponse.json(profile);
}
