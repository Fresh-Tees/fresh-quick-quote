import { NextResponse } from "next/server";

/** Static PDF: add public/FRESH-Onboarding.pdf (e.g. copy from Desktop) for the redirect to work. */
const ONBOARDING_PDF_PATH = "/FRESH-Onboarding.pdf";

/**
 * GET /api/download-onboarding
 * Logs the download event (for tracking) then redirects to the static PDF.
 */
export async function GET(request: Request) {
  const timestamp = new Date().toISOString();
  const userAgent = request.headers.get("user-agent") ?? "";
  const referer = request.headers.get("referer") ?? "";

  console.log("[Onboarding download]", {
    timestamp,
    userAgent: userAgent.slice(0, 100),
    referer: referer.slice(0, 200),
  });

  return NextResponse.redirect(new URL(ONBOARDING_PDF_PATH, request.url), 302);
}
