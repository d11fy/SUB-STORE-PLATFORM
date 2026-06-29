// ============================================================
// Next.js Instrumentation Hook
// https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
//
// This file is loaded ONCE per server cold start, before any
// request is handled.  It is the single place to:
//   1. Install global process error handlers (Node.js runtime only)
//   2. Initialize Sentry (if SENTRY_DSN is set)
//   3. Export onRequestError — Next.js calls this for every
//      unhandled server-side error (RSC render, Server Actions,
//      Route Handlers) with full request context
//
// Adding @sentry/nextjs:
//   npm install @sentry/nextjs
//   Then set SENTRY_DSN in your .env (or Vercel environment).
//   The dynamic import below handles the "not installed" case
//   gracefully — no build error, no runtime crash.
// ============================================================

export async function register() {
  // Only run in the Node.js server runtime.
  // The Edge runtime has a separate worker per request and different
  // process semantics — global handlers don't apply there.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // Install global unhandledRejection + uncaughtException handlers.
  // These catch errors that escape all try-catch boundaries.
  const { setupGlobalHandlers } = await import("./lib/monitoring/error-tracker");
  setupGlobalHandlers();

  // Optional: initialize Sentry.
  // This block is a no-op if SENTRY_DSN is not set or if the
  // @sentry/nextjs package is not installed.
  if (process.env.SENTRY_DSN) {
    try {
      // webpackIgnore prevents build-time resolution — import is runtime-only.
      // If @sentry/nextjs is not in node_modules, this .catch() returns null.
      const Sentry = await (
        import(/* webpackIgnore: true */ "@sentry/nextjs") as Promise<typeof import("@sentry/nextjs")>
      ).catch(() => null);

      Sentry?.init({
        dsn: process.env.SENTRY_DSN,
        // Sample 10% of traces in production to reduce Sentry quota usage.
        // Set to 1.0 during debugging.
        tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
        // Disable Sentry's own console instrumentation — our logger handles it.
        integrations: (defaults: any[]) =>
          defaults.filter((i: any) => i.name !== "Console"),
      });
    } catch {
      // Sentry init failed — continue without it
    }
  }
}

// ── onRequestError ─────────────────────────────────────────────────────────────
// Next.js 15+ calls this for every unhandled server error with full
// request context: route path, render source, method, etc.
// This is the most comprehensive error capture point — it catches errors
// that bypass all try-catch blocks (e.g. RSC render panics).
//
// Note: if you are using @sentry/nextjs >=8, Sentry also exports
// onRequestError from its own instrumentation file.  To avoid conflicts,
// call Sentry.captureRequestError() from here instead of letting Sentry
// export its own hook.
export async function onRequestError(
  err: Error & { digest?: string },
  request: {
    path: string;
    method: string;
    headers: Record<string, string>;
  },
  context: {
    routeType: "app" | "pages";
    renderSource?: string;
    routerKind?: "App Router" | "Pages Router";
    revalidateReason?: string;
  }
): Promise<void> {
  const { capture } = await import("./lib/monitoring/error-tracker");

  capture(
    err,
    {
      action:   "request_error",
      route:    request.path,
      digest:   err.digest ?? null,
      platform: "server",
      metadata: {
        method:       request.method,
        routeType:    context.routeType,
        renderSource: context.renderSource,
        routerKind:   context.routerKind,
      },
    },
    "error"
  );

  // Forward to Sentry's request error handler if the SDK is initialized.
  // This ensures the error appears in Sentry with full request context.
  if (process.env.SENTRY_DSN) {
    try {
      const Sentry = await (
        import(/* webpackIgnore: true */ "@sentry/nextjs") as Promise<typeof import("@sentry/nextjs")>
      ).catch(() => null);
      // @ts-ignore — captureRequestError is available in @sentry/nextjs ≥8
      await Sentry?.captureRequestError?.(err, request, context);
    } catch {
      // Sentry forwarding failing must not affect the response
    }
  }
}
