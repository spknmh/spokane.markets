import Link from "next/link";
import { getLandingConfig } from "@/lib/landing-config";
import { Button } from "@/components/ui/button";

export default async function LandingPage() {
  const config = await getLandingConfig();

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
        {config.header}
      </h1>
      <p className="mt-6 max-w-xl text-lg text-muted-foreground whitespace-pre-line">
        {config.text}
      </p>
      <div className="mt-10">
        <Button asChild variant="outline" size="lg">
          <Link href="/auth/signin">Admin login</Link>
        </Button>
      </div>
    </div>
  );
}
