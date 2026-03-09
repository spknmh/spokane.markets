"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { signInSchema, type SignInInput } from "@/lib/validations";
import { getSignInErrorMessage } from "@/lib/auth-errors";
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
  const redirectUrl = `/auth/redirect?next=${encodeURIComponent(callbackUrl)}`;
  const needsVerification = searchParams.get("verified") === "0";
  const [error, setError] = useState<string | null>(null);
  const [showMagicLink, setShowMagicLink] = useState(magicLinkEnabled);
  const [showCredentials, setShowCredentials] = useState(!magicLinkEnabled);

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
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
      callbackUrl,
    });

    if (result?.error) {
      trackEvent("api_error", { endpoint: "/api/auth/signin", status: 401 });
      setError(getSignInErrorMessage(result.error, result.code));
      return;
    }

    if (result?.ok) {
      trackEvent("login_success", { method: "credentials" });
      router.push(callbackUrl);
      router.refresh();
    }
  }

  async function onMagicLinkSubmit(data: z.infer<typeof magicLinkSchema>) {
    setError(null);
    trackEvent("login_magic_link_request", { method: "resend" });
    await signIn("resend", {
      email: data.email,
      callbackUrl: redirectUrl,
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
          {error && (
            <div
              role="alert"
              className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </div>
          )}

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
                          onClick={() => {
                            if (typeof window !== "undefined") {
                              sessionStorage.setItem("login_method", "oauth");
                            }
                            signIn("google", { callbackUrl: redirectUrl });
                          }}
                          disabled={magicLinkForm.formState.isSubmitting}
                        >
                          Google
                        </Button>
                      )}
                      {oauthProviders.includes("facebook") && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            if (typeof window !== "undefined") {
                              sessionStorage.setItem("login_method", "oauth");
                            }
                            signIn("facebook", { callbackUrl: redirectUrl });
                          }}
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
                            onClick={() => {
                              if (typeof window !== "undefined") {
                                sessionStorage.setItem("login_method", "oauth");
                              }
                              signIn("google", { callbackUrl: redirectUrl });
                            }}
                            disabled={credentialsForm.formState.isSubmitting}
                          >
                            Google
                          </Button>
                        )}
                        {oauthProviders.includes("facebook") && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              if (typeof window !== "undefined") {
                                sessionStorage.setItem("login_method", "oauth");
                              }
                              signIn("facebook", { callbackUrl: redirectUrl });
                            }}
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
        <CardFooter className="flex justify-center">
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
        </CardFooter>
      </Card>
    </div>
  );
}
