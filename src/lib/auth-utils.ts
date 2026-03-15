import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isValidCallbackUrl } from "@/lib/utils";
import {
  isRole,
  normalizePermissionMatrix,
  type AdminPermissionKey,
} from "@/lib/admin/permissions";

export async function requireAuth(callbackPath?: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[auth] requireAuth: no session, redirecting to signin", {
        callbackPath: callbackPath ?? "(none)",
      });
    }
    const safePath = isValidCallbackUrl(callbackPath) ? callbackPath : "/";
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(safePath || "/")}`);
  }
  if (session.user.accountStatus !== "ACTIVE") {
    redirect("/unauthorized");
  }
  return session;
}

export async function requireRole(role: string) {
  const session = await requireAuth();
  if (session.user.role !== role && session.user.role !== "ADMIN") {
    redirect("/unauthorized");
  }
  return session;
}

export async function requireAdmin() {
  return requireRole("ADMIN");
}

export async function requireAdminPermission(permission: AdminPermissionKey) {
  const session = await requireAdmin();
  const role = session.user.role;
  if (!isRole(role)) {
    redirect("/unauthorized");
  }
  const row = await db.siteConfig.findUnique({
    where: { key: "admin_permissions_matrix" },
    select: { value: true },
  });
  const matrix = normalizePermissionMatrix(
    row?.value ? JSON.parse(row.value) : null
  );
  const allowed = matrix[role]?.includes(permission) ?? false;
  if (!allowed) {
    redirect("/unauthorized");
  }
  return session;
}

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}
