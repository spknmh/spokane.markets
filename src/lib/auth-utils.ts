import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { isValidCallbackUrl } from "@/lib/utils";

export async function requireAuth(callbackPath?: string) {
  const session = await auth();
  if (!session?.user) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[auth] requireAuth: no session, redirecting to signin", {
        callbackPath: callbackPath ?? "(none)",
      });
    }
    const safePath = isValidCallbackUrl(callbackPath) ? callbackPath : "/";
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(safePath || "/")}`);
  }
  return session;
}

export async function requireRole(role: Role) {
  const session = await requireAuth();
  if (session.user.role !== role && session.user.role !== "ADMIN") {
    redirect("/unauthorized");
  }
  return session;
}

export async function requireAdmin() {
  return requireRole("ADMIN");
}

export async function getSession() {
  return auth();
}
