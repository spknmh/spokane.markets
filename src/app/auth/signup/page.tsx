import { Suspense } from "react";
import { SignUpForm } from "./sign-up-form";

export default function SignUpPage() {
  const magicLinkEnabled = !!(
    process.env.RESEND_API_KEY || process.env.AUTH_RESEND_KEY
  );

  return (
    <Suspense>
      <SignUpForm magicLinkEnabled={magicLinkEnabled} />
    </Suspense>
  );
}
