"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";
import { signInSchema, type SignInInput } from "@/lib/validations";
import { isValidCallbackUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { FormErrorBanner } from "@/components/ui/form-error-banner";

const magicLinkSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email"),
});

type SignInFormProps = {
  oauthProviders?: ("google" | "facebook")[];
  magicLinkEnabled?: boolean;
};

export function SignInForm({
  oauthProviders = [],
  magicLinkEnabled = false,
}: SignInFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawCallbackUrl = searchParams.get("callbackUrl") ?? "/";
  const callbackUrl = isValidCallbackUrl(rawCallbackUrl) ? rawCallbackUrl : "/";
  const needsVerification = searchParams.get("verified") === "0";
  const [error, setError] = useState<string | null>(null);
  const [showMagicLink, setShowMagicLink] = useState(magicLinkEnabled);
  const [, setShowCredentials] = useState(!magicLinkEnabled);

  const credentialsForm = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const magicLinkForm = useForm<z.infer<typeof magicLinkSchema>>({
    resolver: zodResolver(magicLinkSchema),
    defaultValues: { email: "" },
  });

  async function onSubmitCredentials(data: SignInInput) {
    setError(null);
    const result = await authClient.signIn.email({
      email: data.email,
      password: data.password,
    });

    if (result.error) {
      trackEvent("api_error", { endpoint: "/api/auth/signin", status: 401 });
      setError(result.error.message ?? "Sign in failed. Please check your credentials.");
      return;
    }

    trackEvent("login_success", { method: "credentials" });
    router.push(callbackUrl);
    router.refresh();
  }

  async function onMagicLinkSubmit(data: z.infer<typeof magicLinkSchema>) {
    setError(null);
    trackEvent("login_magic_link_request", { method: "magic-link" });
    const result = await authClient.signIn.magicLink({
      email: data.email,
      callbackURL: callbackUrl,
    });

    if (result.error) {
      setError(result.error.message ?? "Failed to send magic link.");
      return;
    }

    router.push("/auth/verify-request");
  }

  function handleOAuthSignIn(provider: "google" | "facebook") {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("login_method", "oauth");
    }
    authClient.signIn.social({
      provider,
      callbackURL: `/auth/redirect?next=${encodeURIComponent(callbackUrl)}`,
    });
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">Sign in</CardTitle>
          <CardDescription>
            {magicLinkEnabled && showMagicLink
              ? "Enter your email to receive a sign-in link"
              : "Enter your credentials to access your account"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {needsVerification && (
            <div className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-foreground">
              Check your email to verify your account. The link expires in 24
              hours.
            </div>
          )}
          <FormErrorBanner message={error} />

          {magicLinkEnabled && showMagicLink ? (
            <form
              onSubmit={magicLinkForm.handleSubmit(onMagicLinkSubmit)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="magic-email">Email</Label>
                <Input
                  id="magic-email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  {...magicLinkForm.register("email")}
                />
                {magicLinkForm.formState.errors.email && (
                  <p className="text-sm text-destructive">
                    {magicLinkForm.formState.errors.email.message}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={magicLinkForm.formState.isSubmitting}
              >
                {magicLinkForm.formState.isSubmitting
                  ? "Sending…"
                  : "Send sign-in link"}
              </Button>
              <div className="space-y-3">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {oauthProviders.length > 0 && (
                    <div
                      className={
                        oauthProviders.length === 1
                          ? "grid grid-cols-1 gap-3"
                          : "grid grid-cols-2 gap-3"
                      }
                    >
                      {oauthProviders.includes("google") && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleOAuthSignIn("google")}
                          disabled={magicLinkForm.formState.isSubmitting}
                        >
                          Google
                        </Button>
                      )}
                      {oauthProviders.includes("facebook") && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleOAuthSignIn("facebook")}
                          disabled={magicLinkForm.formState.isSubmitting}
                        >
                          Facebook
                        </Button>
                      )}
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowMagicLink(false);
                      setShowCredentials(true);
                    }}
                  >
                    Sign in with password
                  </Button>
                </div>
              </div>
            </form>
          ) : (
            <form
              onSubmit={credentialsForm.handleSubmit(onSubmitCredentials, () =>
                trackEvent("form_error", {
                  form_id: "signin",
                  reason: "validation",
                })
              )}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  {...credentialsForm.register("email")}
                />
                {credentialsForm.formState.errors.email && (
                  <p className="text-sm text-destructive">
                    {credentialsForm.formState.errors.email.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  {...credentialsForm.register("password")}
                />
                {credentialsForm.formState.errors.password && (
                  <p className="text-sm text-destructive">
                    {credentialsForm.formState.errors.password.message}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={credentialsForm.formState.isSubmitting}
              >
                {credentialsForm.formState.isSubmitting
                  ? "Signing in…"
                  : "Sign in"}
              </Button>
              {(oauthProviders.length > 0 || magicLinkEnabled) && (
                <div className="space-y-3">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">
                        Or continue with
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {oauthProviders.length > 0 && (
                      <div
                        className={
                          oauthProviders.length === 1
                            ? "grid grid-cols-1 gap-3"
                            : "grid grid-cols-2 gap-3"
                        }
                      >
                        {oauthProviders.includes("google") && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleOAuthSignIn("google")}
                            disabled={credentialsForm.formState.isSubmitting}
                          >
                            Google
                          </Button>
                        )}
                        {oauthProviders.includes("facebook") && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleOAuthSignIn("facebook")}
                            disabled={credentialsForm.formState.isSubmitting}
                          >
                            Facebook
                          </Button>
                        )}
                      </div>
                    )}
                    {magicLinkEnabled && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowCredentials(false);
                          setShowMagicLink(true);
                        }}
                      >
                        Sign in with email link
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </form>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href={
                callbackUrl
                  ? `/auth/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`
                  : "/auth/signup"
              }
              className="text-primary hover:underline"
            >
              Sign up
            </Link>
          </p>

          <div className="w-full space-y-2 rounded-lg border border-border bg-muted/30 p-3 text-center text-sm">
            <p className="font-medium text-foreground">Are you a vendor or market organizer?</p>
            <p className="text-muted-foreground">
              <Link href="/apply/vendor" className="text-primary hover:underline">
                Apply for a vendor profile
              </Link>
              {" "}to share where you&apos;ll be next and get discovered by shoppers.
            </p>
            <p className="text-muted-foreground">
              <Link href="/apply/market" className="text-primary hover:underline">
                List your market or event
              </Link>
              {" "}to reach visitors planning their weekend.
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
