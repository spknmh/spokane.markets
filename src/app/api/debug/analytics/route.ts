/**
 * Debug endpoint: verify analytics env vars are available at runtime.
 * Returns status only — no secrets. Remove or restrict in production.
 */
export async function GET() {
  const umami = !!process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  const gtm = !!process.env.NEXT_PUBLIC_GTM_ID;
  return Response.json({
    umami: { enabled: umami, scriptUrl: umami ? (process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL || "default") : null },
    gtm: { enabled: gtm },
  });
}
