import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  isRole,
  normalizePermissionMatrix,
  type AdminPermissionKey,
} from "@/lib/admin/permissions";

type Session = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

type AuthResult =
  | { session: Session; error: null }
  | { session: null; error: NextResponse };

export async function requireApiAuth(): Promise<AuthResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return {
      session: null,
      error: NextResponse.json(
        { error: { message: "Authentication required" } },
        { status: 401 }
      ),
    };
  }
  if (session.user.accountStatus !== "ACTIVE") {
    return {
      session: null,
      error: NextResponse.json(
        { error: { message: "Account is not active" } },
        { status: 403 }
      ),
    };
  }
  return { session, error: null };
}

export async function requireApiAdmin(): Promise<AuthResult> {
  const result = await requireApiAuth();
  if (result.error) return result;
  if (result.session.user.role !== "ADMIN") {
    return {
      session: null,
      error: NextResponse.json(
        { error: { message: "Forbidden: admin access required" } },
        { status: 403 }
      ),
    };
  }
  return result;
}

export async function requireApiAdminPermission(
  permission: AdminPermissionKey
): Promise<AuthResult> {
  const result = await requireApiAdmin();
  if (result.error) return result;
  const role = result.session.user.role;
  if (!isRole(role)) {
    return {
      session: null,
      error: NextResponse.json(
        { error: { message: "Forbidden: role is required" } },
        { status: 403 }
      ),
    };
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
    return {
      session: null,
      error: NextResponse.json(
        { error: { message: `Forbidden: ${permission} permission required` } },
        { status: 403 }
      ),
    };
  }
  return result;
}

export async function requireApiRole(role: string): Promise<AuthResult> {
  const result = await requireApiAuth();
  if (result.error) return result;
  if (
    result.session.user.role !== role &&
    result.session.user.role !== "ADMIN"
  ) {
    return {
      session: null,
      error: NextResponse.json(
        { error: { message: `Forbidden: ${role} access required` } },
        { status: 403 }
      ),
    };
  }
  return result;
}

export async function requireApiOrganizer(): Promise<AuthResult> {
  return requireApiRole("ORGANIZER");
}

export async function requireApiVendor(): Promise<AuthResult> {
  return requireApiRole("VENDOR");
}
