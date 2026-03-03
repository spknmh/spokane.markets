import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { getMaintenanceState } from "@/lib/maintenance";
import { isPrivilegedForMaintenance } from "@/lib/maintenance";
import { isValidCallbackUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MaintenanceMarkdown } from "@/components/maintenance-markdown";

interface PageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function MaintenancePage({ searchParams }: PageProps) {
  const session = await auth();
  const state = await getMaintenanceState();

  if (isPrivilegedForMaintenance(session?.user?.role, state.mode)) {
    const params = await searchParams;
    const nextVal = params.next;
    const nextStr = Array.isArray(nextVal) ? nextVal[0] : nextVal;
    const dest = isValidCallbackUrl(nextStr) && nextStr ? nextStr : "/";
    redirect(dest);
  }

  const etaStr = state.eta
    ? new Date(state.eta).toLocaleString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  const hasLinks = state.links.length > 0;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
        {state.messageTitle}
      </h1>
      <div className="mt-6 max-w-xl text-left">
        <MaintenanceMarkdown
          content={state.messageBody}
          className="text-lg text-muted-foreground"
        />
      </div>
      {etaStr && (
        <p className="mt-4 text-sm text-muted-foreground">
          Estimated return: {etaStr}
        </p>
      )}
      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        {hasLinks ? (
          state.links.map((link) => (
            <Button key={link.url} asChild variant="outline" size="lg">
              <Link href={link.url} target="_blank" rel="noopener noreferrer">
                {link.label}
              </Link>
            </Button>
          ))
        ) : (
          <Button asChild variant="outline" size="lg">
            <Link href="/auth/signin">Admin login</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
