import { auth } from "@/auth";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cookieStore = await cookies();
  const sessionToken =
    cookieStore.get("__Secure-authjs.session-token")?.value ??
    cookieStore.get("authjs.session-token")?.value;

  await db.session.deleteMany({
    where: {
      userId: session.user.id,
      ...(sessionToken ? { sessionToken: { not: sessionToken } } : {}),
    },
  });

  return NextResponse.json({ success: true });
}
