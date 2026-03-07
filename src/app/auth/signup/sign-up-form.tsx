"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUpSchema, SIGNUP_ROLES, type SignUpInput } from "@/lib/validations";
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

export function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawCallbackUrl = searchParams.get("callbackUrl") ?? "/";
  const callbackUrl = isValidCallbackUrl(rawCallbackUrl) ? rawCallbackUrl : "/";
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "USER",
      website: "",
    },
  });

  async function onSubmit(data: SignUpInput) {
    setError(null);
    trackEvent("signup_start", { role: data.role });
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
        role: data.role,
        website: data.website,
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      trackEvent("api_error", { endpoint: "/api/auth/register", status: res.status });
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

    trackEvent("signup_success", { role: data.role });

    const vendorRedirect =
      data.role === "VENDOR" ? "/vendor/dashboard" : "/dashboard";
    const signInResult = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
      callbackUrl: vendorRedirect,
    });

    if (signInResult?.ok) {
      if (data.role === "VENDOR") {
        router.push("/vendor/dashboard");
      } else {
        router.push("/dashboard?pendingVerification=1");
      }
      router.refresh();
    } else {
      const signinCallback =
        data.role === "VENDOR"
          ? encodeURIComponent("/vendor/dashboard")
          : encodeURIComponent(callbackUrl);
      router.push(`/auth/signin?verified=0&callbackUrl=${signinCallback}`);
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
        <form
          onSubmit={handleSubmit(onSubmit, () =>
            trackEvent("form_error", { form_id: "signup", reason: "validation" })
          )}
        >
          <CardContent className="space-y-4">
            {error && (
              <div
                role="alert"
                className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your name"
                autoComplete="name"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>
            {/* Honeypot — hidden from users, bots fill it */}
            <div className="absolute -left-[9999px] opacity-0" aria-hidden>
              <Label htmlFor="website">Website</Label>
              <input
                id="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                {...register("website")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>What brings you here?</Label>
              <p className="text-xs text-muted-foreground">
                This helps us show you the right features.
              </p>
              <div className="space-y-2">
                {SIGNUP_ROLES.map((r) => (
                  <label
                    key={r.value}
                    className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                  >
                    <input
                      type="radio"
                      value={r.value}
                      {...register("role")}
                      className="mt-1"
                    />
                    <div>
                      <span className="font-medium">{r.label}</span>
                      <p className="text-xs text-muted-foreground">{r.description}</p>
                    </div>
                  </label>
                ))}
              </div>
              {errors.role && (
                <p className="text-sm text-destructive">{errors.role.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creating account…" : "Sign up"}
            </Button>
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
        </form>
      </Card>
    </div>
  );
}
