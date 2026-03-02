import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const BYPASS_PATHS = ["/admin", "/api", "/auth", "/landing"];

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.).*)"],
};

function shouldBypass(pathname: string): boolean {
  return BYPASS_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(request: NextRequest) {
  if (shouldBypass(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  try {
    const url = new URL("/api/site-config/landing", request.nextUrl.origin);
    const res = await fetch(url.toString(), {
      headers: request.headers,
      next: { revalidate: 10 },
    });
    if (!res.ok) return NextResponse.next();
    const { enabled } = await res.json();
    if (enabled) {
      return NextResponse.rewrite(new URL("/landing", request.url));
    }
  } catch {
    // On error, allow request through
  }
  return NextResponse.next();
}
