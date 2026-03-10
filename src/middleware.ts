import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Set frame-ancestors at runtime so FRAME_ANCESTORS_URLS from Vercel env
 * is applied on every request (avoids build-time caching issues).
 */
export function middleware(request: NextRequest) {
  const extra =
    process.env.FRAME_ANCESTORS_URLS?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) ?? [];
  const ancestors = ["'self'", ...extra].join(" ");
  const csp = `frame-ancestors ${ancestors}`;

  const response = NextResponse.next();
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: "/:path*",
};
