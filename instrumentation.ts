// ============================================================
// Next.js Instrumentation Hook
// https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
//
// Loaded ONCE per server cold start. Installs global error handlers
// and optionally initializes Sentry (if SENTRY_DSN is set).
//
// @sentry/nextjs is optional — install it and set SENTRY_DSN to enable.
// The dynamic imports below handle the "not installed" case gracefully.
// ============================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySentry = any;

// Variable prevents TypeScript from statically resolving this optional package.
// webpack/Turbopack cannot statically bundle a non-literal specifier either.
const _sentryPkg = "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { setupGlobalHandlers } = await import("./lib/monitoring/error-tracker");
  setupGlobalHandlers();

  if (process.env.SENTRY_DSN) {
    try {
      const Sentry: AnySentry = await (
        import(_sentryPkg) as Promise<AnySentry>
      ).catch(() => null);

      Sentry?.init({
        dsn: process.env.SENTRY_DSN,
        tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
        integrations: (defaults: AnySentry[]) =>
          defaults.filter((i: AnySentry) => i.name !== "Console"),
      });
    } catch {
      // Sentry init failed — continue without it
    }
  }
}

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

  if (process.env.SENTRY_DSN) {
    try {
      const Sentry: AnySentry = await (
        import(_sentryPkg) as Promise<AnySentry>
      ).catch(() => null);
      await Sentry?.captureRequestError?.(err, request, context);
    } catch {
      // Sentry forwarding must not affect the response
    }
  }
}
