/**
 * Returns a user-friendly error message for sign-in failures.
 * Distinguishes email-not-verified from generic credential errors.
 */
export function getSignInErrorMessage(error: string | undefined): string {
  if (!error) return "Invalid email or password. Please try again.";
  const isEmailNotVerified =
    error === "EmailNotVerified" ||
    String(error).toLowerCase().includes("emailnotverified");
  return isEmailNotVerified
    ? "Please verify your email before signing in. Check your inbox for the verification link."
    : "Invalid email or password. Please try again.";
}
