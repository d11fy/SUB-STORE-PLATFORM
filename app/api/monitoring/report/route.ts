// ============================================================
// Client-side error reporting endpoint
//
// Error boundaries call this via navigator.sendBeacon() to report
// client-rendered errors back to the server for structured logging.
//
// Design constraints:
//   - No auth required (errors happen before auth sometimes)
//   - Strict input validation to prevent abuse
//   - Returns 204 always (reporter does not need a response body)
//   - Rate limiting is handled by the tracker's fingerprint dedup
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { capture } from "@/lib/monitoring/error-tracker";
import { errorReportRateLimit } from "@/lib/rate-limit";

// Run in Node.js runtime so we get full process context
export const runtime = "nodejs";

// Maximum accepted body size — 8 KB is enough for an error report
const MAX_BODY_BYTES = 8 * 1024;

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Rate limit: 30 error reports per minute per IP.
  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  if (!errorReportRateLimit(clientIp).allowed) {
    return new NextResponse(null, { status: 429 });
  }

  try {
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
      return new NextResponse(null, { status: 413 });
    }

    const raw = await req.text();
    if (raw.length > MAX_BODY_BYTES) {
      return new NextResponse(null, { status: 413 });
    }

    let body: unknown;
    try {
      body = JSON.parse(raw);
    } catch {
      return new NextResponse(null, { status: 400 });
    }

    if (typeof body !== "object" || body === null) {
      return new NextResponse(null, { status: 400 });
    }

    const {
      message,
      digest,
      route,
      stack,
      page,
    } = body as Record<string, unknown>;

    // Require at minimum a message string
    if (typeof message !== "string" || !message.trim()) {
      return new NextResponse(null, { status: 400 });
    }

    // Reconstruct an Error-like object so the tracker can normalize it
    const clientError = new Error(String(message).slice(0, 500));
    if (typeof stack === "string") {
      clientError.stack = stack.slice(0, 2000);
    }

    capture(clientError, {
      action:   "client_error_boundary",
      route:    typeof route === "string" ? route : typeof page === "string" ? page : null,
      digest:   typeof digest === "string" ? digest : null,
      platform: "client",
    });
  } catch {
    // The endpoint itself must never return 5xx — that would cause
    // browsers to retry, amplifying load during an already-bad incident.
  }

  // Always 204 — the client does not need a response body
  return new NextResponse(null, { status: 204 });
}
