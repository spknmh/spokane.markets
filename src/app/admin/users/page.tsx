import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { UserRoleSelect } from "@/components/admin/user-role-select";
import Link from "next/link";

export default async function AdminUsersPage() {
  await requireAdmin();

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { ownedMarkets: true, claimRequests: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Users</h1>
      <p className="text-muted-foreground">
        Manage user accounts and roles. Changing a role affects what dashboards and features the user can access.
      </p>

      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium">Name</th>
              <th className="text-left p-3 font-medium">Email</th>
              <th className="text-left p-3 font-medium">Role</th>
              <th className="text-left p-3 font-medium">Markets</th>
              <th className="text-left p-3 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted-foreground">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-muted/30">
                  <td className="p-3 font-medium">{user.name ?? "—"}</td>
                  <td className="p-3 text-muted-foreground">{user.email}</td>
                  <td className="p-3">
                    <UserRoleSelect
                      userId={user.id}
                      currentRole={user.role}
                    />
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {user._count.ownedMarkets > 0 ? (
                      <Link
                        href="/admin/markets"
                        className="text-primary hover:underline"
                      >
                        {user._count.ownedMarkets}
                      </Link>
                    ) : (
                      "0"
                    )}
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
