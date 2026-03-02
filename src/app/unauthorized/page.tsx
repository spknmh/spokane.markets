import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-4 py-12">
      <h1 className="mb-2 text-2xl font-bold tracking-tight">Access Denied</h1>
      <p className="mb-6 text-muted-foreground">
        You do not have permission to access this page.
      </p>
      <Button asChild>
        <Link href="/">Return home</Link>
      </Button>
    </div>
  );
}
