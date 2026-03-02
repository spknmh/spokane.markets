import { Suspense } from "react";
import { SignInForm } from "./sign-in-form";

export default function SignInPage() {
  const oauthProviders: ("google" | "facebook")[] = [];
  if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
    oauthProviders.push("google");
  }
  if (process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET) {
    oauthProviders.push("facebook");
  }

  return (
    <Suspense>
      <SignInForm oauthProviders={oauthProviders} />
    </Suspense>
  );
}
