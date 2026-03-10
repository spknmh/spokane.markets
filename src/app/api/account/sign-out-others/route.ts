import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cookieStore = await cookies();
  const sessionToken =
    cookieStore.get("better-auth.session_token")?.value ??
    cookieStore.get("__Secure-better-auth.session_token")?.value;

  await db.session.deleteMany({
    where: {
      userId: session.user.id,
      ...(sessionToken ? { token: { not: sessionToken } } : {}),
    },
  });

  return NextResponse.json({ success: true });
}
