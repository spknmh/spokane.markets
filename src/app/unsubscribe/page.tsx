import { UnsubscribeForm } from "./unsubscribe-form";

export const metadata = {
  title: "Unsubscribe — Spokane Markets",
  description: "Unsubscribe from Spokane Markets emails",
};

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; source?: string }>;
}) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email : "";
  const source = typeof params.source === "string" ? params.source : "digest";

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold tracking-tight">Unsubscribe</h1>
      <p className="mt-2 text-muted-foreground">
        You will no longer receive emails from Spokane Markets for the selected subscription.
      </p>
      <UnsubscribeForm defaultEmail={email} defaultSource={source} />
    </div>
  );
}
