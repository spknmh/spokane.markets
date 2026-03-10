"use client";

import { useState } from "react";
import {
  trackApiError,
  trackEvent,
  trackFormError,
  trackMilestoneEvent,
} from "@/lib/analytics";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  signUpSchema,
  signUpSchemaMagicLink,
  type SignUpInput,
  type SignUpInputMagicLink,
} from "@/lib/validations";
import { authClient } from "@/lib/auth-client";
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
import { useAbandonTracking } from "@/hooks/use-abandon-tracking";

type SignUpFormProps = {
  magicLinkEnabled?: boolean;
};

export function SignUpForm({ magicLinkEnabled = false }: SignUpFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawCallbackUrl = searchParams.get("callbackUrl") ?? "/";
  const callbackUrl = isValidCallbackUrl(rawCallbackUrl) ? rawCallbackUrl : "/";
  const [error, setError] = useState<string | null>(null);
  const [useMagicLink, setUseMagicLink] = useState(magicLinkEnabled);
  const [submitted, setSubmitted] = useState(false);

  const magicLinkForm = useForm<SignUpInputMagicLink>({
    resolver: zodResolver(signUpSchemaMagicLink),
    defaultValues: {
      name: "",
      email: "",
      role: "USER",
      website: "",
    },
  });

  const credentialsForm = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      website: "",
    },
  });

  useAbandonTracking({
    eventName: "signup_abandon",
    isDirty: useMagicLink
      ? magicLinkForm.formState.isDirty
      : credentialsForm.formState.isDirty,
    isComplete: submitted,
    params: {
      form_id: "signup",
      method: useMagicLink ? "magic_link" : "credentials",
    },
  });

  async function onSubmitMagicLink(data: SignUpInputMagicLink) {
    setError(null);
    setSubmitted(false);
    trackEvent("signup_start", { role: "USER" });
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        role: "USER",
        website: data.website,
        callbackUrl: `/auth/redirect?next=${encodeURIComponent(callbackUrl)}`,
        magicLink: true,
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      trackApiError("auth", res.status, { reason: "server" });
      if (typeof json.error === "string") {
        setError(json.error);
      } else if (json.error && typeof json.error === "object") {
        const firstField = Object.values(json.error)[0];
        const msg = Array.isArray(firstField) ? firstField[0] : String(firstField);
        setError(msg ?? "Registration failed");
      } else {
        setError("Registration failed. Please try again.");
      }
      return;
    }

    setSubmitted(true);
    trackMilestoneEvent("signup_success", { role: "USER" });
    router.push(
      `/auth/verify-request?callbackUrl=${encodeURIComponent(callbackUrl)}`
    );
    router.refresh();
  }

  async function onSubmitCredentials(data: SignUpInput) {
    setError(null);
    setSubmitted(false);
    trackEvent("signup_start", { role: "USER" });
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
        role: "USER",
        website: data.website,
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      trackApiError("auth", res.status, { reason: "server" });
      if (typeof json.error === "string") {
        setError(json.error);
      } else if (json.error && typeof json.error === "object") {
        const firstField = Object.values(json.error)[0];
        const msg = Array.isArray(firstField) ? firstField[0] : String(firstField);
        setError(msg ?? "Registration failed");
      } else {
        setError("Registration failed. Please try again.");
      }
      return;
    }

    setSubmitted(true);
    trackMilestoneEvent("signup_success", { role: "USER" });

    const signInResult = await authClient.signIn.email({
      email: data.email,
      password: data.password,
    });

    if (!signInResult.error) {
      router.push("/dashboard?pendingVerification=1");
      router.refresh();
    } else {
      router.push(`/auth/signin?verified=0&callbackUrl=${encodeURIComponent(callbackUrl)}`);
      router.refresh();
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">Sign up</CardTitle>
          <CardDescription>
            Create an account to get started
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormErrorBanner message={error} />

          {magicLinkEnabled && useMagicLink ? (
            <form
              onSubmit={magicLinkForm.handleSubmit(onSubmitMagicLink, () =>
                trackFormError("signup", "validation", { method: "magic_link" })
              )}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  autoComplete="name"
                  {...magicLinkForm.register("name")}
                />
                {magicLinkForm.formState.errors.name && (
                  <p className="text-sm text-destructive">
                    {magicLinkForm.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
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
              <div className="absolute -left-[9999px] opacity-0" aria-hidden>
                <Label htmlFor="website-magic">Website</Label>
                <input
                  id="website-magic"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  {...magicLinkForm.register("website")}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={magicLinkForm.formState.isSubmitting}
              >
                {magicLinkForm.formState.isSubmitting
                  ? "Creating account…"
                  : "Sign up"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setUseMagicLink(false)}
              >
                Sign up with password instead
              </Button>
            </form>
          ) : (
            <form
              onSubmit={credentialsForm.handleSubmit(onSubmitCredentials, () =>
                trackFormError("signup", "validation", {
                  method: "credentials",
                })
              )}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  autoComplete="name"
                  {...credentialsForm.register("name")}
                />
                {credentialsForm.formState.errors.name && (
                  <p className="text-sm text-destructive">
                    {credentialsForm.formState.errors.name.message}
                  </p>
                )}
              </div>
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
                  autoComplete="new-password"
                  {...credentialsForm.register("password")}
                />
                {credentialsForm.formState.errors.password && (
                  <p className="text-sm text-destructive">
                    {credentialsForm.formState.errors.password.message}
                  </p>
                )}
              </div>
              <div className="absolute -left-[9999px] opacity-0" aria-hidden>
                <Label htmlFor="website">Website</Label>
                <input
                  id="website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  {...credentialsForm.register("website")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  {...credentialsForm.register("confirmPassword")}
                />
                {credentialsForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-destructive">
                    {
                      credentialsForm.formState.errors.confirmPassword.message
                    }
                  </p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={credentialsForm.formState.isSubmitting}
              >
                {credentialsForm.formState.isSubmitting
                  ? "Creating account…"
                  : "Sign up"}
              </Button>
              {magicLinkEnabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setUseMagicLink(true)}
                >
                  Sign up with email link instead
                </Button>
              )}
            </form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href={
                callbackUrl
                  ? `/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`
                  : "/auth/signin"
              }
              className="text-primary hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
