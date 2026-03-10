import { requireAdmin } from "@/lib/auth-utils";
import { UserForm } from "@/components/admin/user-form";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function NewUserPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/users"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Users
        </Link>
      </div>
      <h1 className="text-3xl font-bold tracking-tight">Create User</h1>
      <p className="text-muted-foreground">
        Add a new user account. They can sign in with the email and password you set.
      </p>
      <UserForm />
    </div>
  );
}
