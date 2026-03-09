import { Resend } from "resend";
import { SITE_NAME } from "@/lib/constants";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const AUTH_URL = process.env.AUTH_URL ?? APP_URL;

export async function sendVerificationEmail(email: string, token: string) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.warn("RESEND_API_KEY not set — skipping verification email");
    return;
  }

  const resend = new Resend(resendKey);
  const verifyUrl = `${APP_URL}/auth/verify?token=${token}&email=${encodeURIComponent(email)}`;

  await resend.emails.send({
    from: `${SITE_NAME} <noreply@spokane.market>`,
    to: email,
    subject: `Verify your email — ${SITE_NAME}`,
    html: `
      <h2>Welcome to ${SITE_NAME}!</h2>
      <p>Please verify your email address by clicking the link below:</p>
      <p><a href="${verifyUrl}" style="display:inline-block;background:#006838;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;">Verify Email</a></p>
      <p>Or copy this link: ${verifyUrl}</p>
      <p>This link expires in 24 hours.</p>
      <p>If you didn't create an account, you can ignore this email.</p>
    `,
  });
}

/**
 * Send magic link for sign-up (Auth.js Resend callback). Link goes to Auth.js
 * callback so user is signed in when they click.
 */
export async function sendMagicLinkEmail(
  email: string,
  token: string,
  callbackUrl: string
) {
  const resendKey = process.env.RESEND_API_KEY ?? process.env.AUTH_RESEND_KEY;
  if (!resendKey) {
    throw new Error("RESEND_API_KEY or AUTH_RESEND_KEY required for magic link");
  }

  const resend = new Resend(resendKey);
  const magicLinkUrl = `${AUTH_URL.replace(/\/$/, "")}/api/auth/callback/resend?token=${token}&callbackUrl=${encodeURIComponent(callbackUrl)}`;

  await resend.emails.send({
    from: `${SITE_NAME} <noreply@spokane.market>`,
    to: email,
    subject: `Sign in to ${SITE_NAME}`,
    html: `
      <h2>Welcome to ${SITE_NAME}!</h2>
      <p>Click the link below to sign in to your account:</p>
      <p><a href="${magicLinkUrl}" style="display:inline-block;background:#006838;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;">Sign in</a></p>
      <p>Or copy this link: ${magicLinkUrl}</p>
      <p>This link expires in 24 hours.</p>
      <p>If you didn't request this email, you can safely ignore it.</p>
    `,
  });
}
