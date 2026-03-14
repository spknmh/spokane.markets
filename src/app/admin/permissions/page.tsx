import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import {
  DEFAULT_ADMIN_PERMISSION_MATRIX,
  normalizePermissionMatrix,
} from "@/lib/admin/permissions";
import { PermissionsMatrix } from "@/components/admin/permissions-matrix";

export const dynamic = "force-dynamic";

export default async function AdminPermissionsPage() {
  await requireAdmin();
  const row = await db.siteConfig.findUnique({
    where: { key: "admin_permissions_matrix" },
  });
  const initialMatrix = row?.value
    ? normalizePermissionMatrix(JSON.parse(row.value))
    : DEFAULT_ADMIN_PERMISSION_MATRIX;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Permissions</h1>
        <p className="mt-1 text-muted-foreground">
          Configure granular permissions per role for the admin surface.
        </p>
      </div>
      <PermissionsMatrix initialMatrix={initialMatrix} />
    </div>
  );
}

