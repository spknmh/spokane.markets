import Link from "next/link";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle } from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ token?: string; email?: string }>;
}

export default async function VerifyEmailPage({ searchParams }: PageProps) {
  const { token, email } = await searchParams;

  if (!token || !email) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <XCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
        <h1 className="text-2xl font-bold tracking-tight">Invalid Link</h1>
        <p className="mt-2 text-muted-foreground">
          This verification link is invalid or expired.
        </p>
        <Button asChild className="mt-6">
          <Link href="/auth/signin">Sign In</Link>
        </Button>
      </div>
    );
  }

  const verification = await db.verification.findFirst({
    where: {
      identifier: email,
      value: token,
    },
  });

  if (!verification || verification.expiresAt < new Date()) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <XCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
        <h1 className="text-2xl font-bold tracking-tight">Link Expired</h1>
        <p className="mt-2 text-muted-foreground">
          This verification link has expired. Please sign in and request a new one.
        </p>
        <Button asChild className="mt-6">
          <Link href="/auth/signin">Sign In</Link>
        </Button>
      </div>
    );
  }

  await db.$transaction([
    db.user.update({
      where: { email },
      data: { emailVerified: true },
    }),
    db.verification.delete({
      where: { id: verification.id },
    }),
  ]);

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-primary" />
      <h1 className="text-2xl font-bold tracking-tight">Email Verified</h1>
      <p className="mt-2 text-muted-foreground">
        Your email has been verified. You can now sign in to your account.
      </p>
      <Button asChild className="mt-6">
        <Link href="/auth/signin">Sign In</Link>
      </Button>
    </div>
  );
}
