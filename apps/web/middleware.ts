import { NextResponse, type NextRequest } from "next/server";
import { SHOWCASE } from "@/lib/showcase";

/**
 * 1. Content Security Policy with a fresh nonce per request (no inline script runs without it).
 * 2. Showcase only: cosmetic redirect away from /admin when there is no session cookie. The real
 *    check is on the API (every admin endpoint verifies the role) and in the admin layout.
 */
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (SHOWCASE && (pathname === "/admin" || pathname.startsWith("/admin/")) && !request.cookies.get("ps_session")) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin-login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  const nonce = btoa(crypto.randomUUID());
  const dev = process.env.NODE_ENV !== "production";
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.ingest.sentry.io https://*.ingest.us.sentry.io https://vitals.vercel-insights.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  if (!dev) response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  return response;
}

export const config = {
  matcher: [{ source: "/((?!api|_next/static|_next/image|favicon.ico|icon.svg).*)", missing: [{ type: "header", key: "next-router-prefetch" }] }],
};
