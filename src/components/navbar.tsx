import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NavbarClient } from "@/components/navbar-client";

export async function Navbar() {
  const session = await auth.api.getSession({ headers: await headers() });
  const unreadCount = session?.user?.id
    ? await db.notification.count({
        where: { userId: session.user.id, readAt: null },
      })
    : 0;
  return <NavbarClient session={session} unreadCount={unreadCount} />;
}
