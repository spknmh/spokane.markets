/**
 * Returns a user-friendly error message for sign-in failures.
 * Distinguishes email-not-verified from generic credential errors.
 * Auth.js may return error (e.g. "CredentialsSignin") and code (e.g. "EmailNotVerified") separately.
 */
export function getSignInErrorMessage(
  error: string | undefined,
  code?: string | undefined,
): string {
  const isEmailNotVerified =
    code === "EmailNotVerified" ||
    error === "EmailNotVerified" ||
    String(error).toLowerCase().includes("emailnotverified");
  return isEmailNotVerified
    ? "Please verify your email before signing in. Check your inbox for the verification link."
    : "Invalid email or password. Please try again.";
}
