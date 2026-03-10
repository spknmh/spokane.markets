import { requireApiAdmin } from "@/lib/api-auth";

/**
 * Debug endpoint: verify analytics env vars are available at runtime.
 * Returns status only — no secrets. Gated behind admin auth.
 */
export async function GET() {
  const { error } = await requireApiAdmin();
  if (error) return error;

  const umami = !!process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  const gtm = !!process.env.NEXT_PUBLIC_GTM_ID;
  return Response.json({
    umami: { enabled: umami, scriptUrl: umami ? (process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL || "default") : null },
    gtm: { enabled: gtm },
  });
}
