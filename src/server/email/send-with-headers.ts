/**
 * Sends email via Resend with List-Unsubscribe headers for CAN-SPAM compliance.
 * RFC 8058: List-Unsubscribe and List-Unsubscribe-Post.
 */
import { Resend } from "resend";

export type UnsubscribeParams =
  | { type: "digest"; email: string }
  | { type: "filters"; email: string }
  | { type: "favorites"; email: string };

function buildUnsubscribeUrl(email: string, type: UnsubscribeParams["type"]): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://spokane.market";
  return `${base}/unsubscribe?email=${encodeURIComponent(email)}&source=${type}`;
}

export interface SendWithHeadersOptions {
  from: string;
  to: string;
  subject: string;
  html: string;
  unsubscribe?: UnsubscribeParams;
}

export async function sendWithUnsubscribeHeaders(
  resend: Resend,
  options: SendWithHeadersOptions
): Promise<{ data?: unknown; error?: unknown }> {
  const { from, to, subject, html, unsubscribe } = options;

  const headers: Record<string, string> = {};

  if (unsubscribe) {
    const url = buildUnsubscribeUrl(unsubscribe.email, unsubscribe.type);
    headers["List-Unsubscribe"] = `<${url}>`;
    headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
  }

  const result = await resend.emails.send({
    from,
    to,
    subject,
    html,
    headers: Object.keys(headers).length > 0 ? headers : undefined,
  });

  if (result.error) {
    throw new Error(result.error.message ?? "Email send failed");
  }

  return result;
}
