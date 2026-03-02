import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";

export async function requireAuth(callbackPath?: string) {
  const session = await auth();
  if (!session?.user) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(callbackPath || "/")}`);
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
