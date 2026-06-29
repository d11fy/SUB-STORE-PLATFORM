// ============================================================
// Saba Store — Production Error Tracker
//
// Captures structured error events with full context.
// Zero caller-blocking: stdout write is synchronous (<1ms),
// all external I/O (Sentry, webhook) runs as a microtask after
// the caller has already returned.
//
// Env vars:
//   SENTRY_DSN        — activates Sentry integration (optional)
//   ERROR_WEBHOOK_URL — POST target for custom alerting (optional)
//
// Usage:
//   import { capture, withCapture } from "@/lib/monitoring/error-tracker";
//
//   // Wrap a server action:
//   export const createOrder = withCapture("createOrder", async (data) => {
//     ...
//   });
//
//   // Manual capture:
//   try { ... } catch (err) {
//     capture(err, { action: "placeOrder", userId, storeId, route });
//     return { success: false };
//   }
// ============================================================

// ── Types ──────────────────────────────────────────────────────────────────────

export type ErrorLevel = "debug" | "info" | "warn" | "error" | "fatal";

export interface CaptureContext {
  /** Identifies which server action or subsystem threw. e.g. "createOrder" */
  action: string;
  userId?: string | null;
  storeId?: string | null;
  /** Next.js route path. e.g. "/store/[slug]/checkout" */
  route?: string | null;
  /** Next.js error digest (from onRequestError / error boundaries) */
  digest?: string | null;
  platform?: "server" | "edge" | "client";
  metadata?: Record<string, unknown>;
}

export interface ErrorEvent {
  eventId:     string;
  level:       ErrorLevel;
  action:      string;
  message:     string;
  stack:       string | null;
  fingerprint: string;
  userId:      string | null;
  storeId:     string | null;
  route:       string | null;
  digest:      string | null;
  environment: string;
  platform:    "server" | "edge" | "client";
  timestamp:   string;
  metadata:    Record<string, unknown>;
}

// ── Fast non-crypto hash (djb2) ────────────────────────────────────────────────
// Runs in both Node.js and Edge runtime. Used only for deduplication —
// not security. No crypto module dependency.
function djb2(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = (h * 33 + s.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(36);
}

function buildFingerprint(action: string, stack: string | null): string {
  // First "at …" frame gives a stable call-site location.
  const frame = stack?.split("\n").find((l) => l.includes(" at ")) ?? "no-frame";
  return djb2(`${action}:${frame}`);
}

// ── In-memory rate limiter ─────────────────────────────────────────────────────
// Suppresses duplicate events after RATE_MAX identical errors per RATE_WINDOW_MS.
// Prevents log floods from a tight error loop (e.g. a failing DB query in a
// render cycle). State is per-process-instance (each Vercel worker has its own).
const _rate = new Map<string, { count: number; windowStart: number }>();
const RATE_WINDOW_MS = 60_000; // 1-minute sliding window
const RATE_MAX       = 10;     // max same-fingerprint events per window

function shouldSuppress(fp: string): boolean {
  const now = Date.now();
  const b = _rate.get(fp);
  if (!b || now - b.windowStart > RATE_WINDOW_MS) {
    _rate.set(fp, { count: 1, windowStart: now });
    // Prune stale entries to bound memory usage
    if (_rate.size > 2000) {
      for (const [k, v] of _rate) {
        if (now - v.windowStart > RATE_WINDOW_MS) _rate.delete(k);
      }
    }
    return false;
  }
  b.count++;
  return b.count > RATE_MAX;
}

// ── Stack normalizer ───────────────────────────────────────────────────────────
// Keeps the first 8 lines and strips noisy prefixes while preserving file:line.
function normalizeStack(err: Error): string | null {
  if (!err.stack) return null;
  return err.stack
    .split("\n")
    .slice(0, 8)
    .map((line) =>
      // Collapse long absolute filesystem paths to just the filename:line:col.
      // Before: at Module (/var/task/.next/server/chunks/actions.js:42:10)
      // After:  at Module (actions.js:42:10)
      line.replace(/\(([^)]*[/\\])([^/\\)]+:\d+:\d+)\)/g, "($2)")
    )
    .join("\n");
}

// ── Event factory ──────────────────────────────────────────────────────────────
function buildEvent(err: Error, level: ErrorLevel, ctx: CaptureContext): ErrorEvent {
  const stack = normalizeStack(err);
  const fp    = buildFingerprint(ctx.action, stack);
  const id    =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

  return {
    eventId:     id,
    level,
    action:      ctx.action,
    message:     err.message,
    stack,
    fingerprint: fp,
    userId:      ctx.userId  ?? null,
    storeId:     ctx.storeId ?? null,
    route:       ctx.route   ?? null,
    digest:      ctx.digest  ?? null,
    environment: process.env.NODE_ENV ?? "production",
    platform:    ctx.platform ?? "server",
    timestamp:   new Date().toISOString(),
    metadata:    ctx.metadata ?? {},
  };
}

// ── Emitter: stdout ────────────────────────────────────────────────────────────
// Synchronous, zero I/O — just a JSON stringify + console call.
// Vercel, AWS CloudWatch, and most hosted platforms ingest this automatically.
function emitToStdout(event: ErrorEvent): void {
  const line = JSON.stringify(event);
  if (event.level === "error" || event.level === "fatal") {
    console.error(line);
  } else if (event.level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

// ── Emitter: Sentry (optional) ─────────────────────────────────────────────────
// Uses /* webpackIgnore: true */ so webpack skips static analysis of the import.
// At runtime: if @sentry/nextjs is not installed, the dynamic import rejects and
// .catch() returns null — no build error, no crash.
async function emitToSentry(event: ErrorEvent, original: Error): Promise<void> {
  if (!process.env.SENTRY_DSN) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Sentry = await (import(/* webpackIgnore: true */ "@sentry/nextjs") as Promise<any>)
      .catch(() => null);
    if (!Sentry) return;

    Sentry.withScope((scope: any) => {
      scope.setTag("action",       event.action);
      scope.setTag("platform",     event.platform);
      scope.setTag("fingerprint",  event.fingerprint);
      scope.setFingerprint([event.fingerprint]);
      if (event.userId)  scope.setUser({ id: event.userId });
      if (event.storeId) scope.setTag("storeId", event.storeId);
      if (event.route)   scope.setTag("route",   event.route);
      scope.setExtras(event.metadata);
      const sentryLevel = event.level === "fatal" ? "fatal"
        : event.level === "warn" ? "warning" : "error";
      Sentry.captureException(original, { level: sentryLevel });
    });
  } catch {
    // Sentry errors must never reach the caller
  }
}

// ── Emitter: webhook (optional) ───────────────────────────────────────────────
// Useful for Slack, custom alerting, or any HTTP endpoint.
// Fails silently if the endpoint is unreachable or slow (5 s timeout).
async function emitToWebhook(event: ErrorEvent): Promise<void> {
  const url = process.env.ERROR_WEBHOOK_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
      signal: AbortSignal.timeout(5_000),
    });
  } catch {
    // Webhook errors must never reach the caller
  }
}

// ── Dispatch ───────────────────────────────────────────────────────────────────
// Stdout is written synchronously (it's essentially free).
// External I/O is enqueued as a Promise microtask so the caller returns first.
function dispatch(event: ErrorEvent, original: Error): void {
  emitToStdout(event);

  // Fire-and-forget: does not block the calling server action or route handler
  Promise.resolve().then(() =>
    Promise.allSettled([
      emitToSentry(event, original),
      emitToWebhook(event),
    ])
  );
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Capture an error with structured context.
 *
 * This function NEVER throws and NEVER blocks its caller.
 * It is safe to call in middleware, Server Actions, Route Handlers, and
 * Next.js `instrumentation.ts` hooks.
 */
export function capture(
  err: unknown,
  ctx: CaptureContext,
  level: ErrorLevel = "error"
): void {
  try {
    const error = err instanceof Error ? err : new Error(String(err));
    const event = buildEvent(error, level, ctx);
    if (shouldSuppress(event.fingerprint)) return;
    dispatch(event, error);
  } catch {
    // The tracker itself must never throw
  }
}

/**
 * Capture a plain message (non-Error).
 * Useful for warn/info events that do not have an exception object.
 */
export function captureMessage(
  message: string,
  level: ErrorLevel = "info",
  ctx: Omit<CaptureContext, "action"> & { action?: string }
): void {
  capture(new Error(message), { action: "message", ...ctx }, level);
}

/**
 * Wraps a server action (or any async function) with automatic error capture.
 *
 * Behavior:
 *  - On success: returns the result unchanged.
 *  - On error: captures the error (non-blocking), then re-throws so the caller
 *    can still handle it (show UI error, return { error: "..." }, etc.).
 *
 * @example
 * export const submitOrder = withCapture(
 *   "submitOrder",
 *   async (formData: FormData) => { ... },
 *   (formData) => ({ route: "/store/[slug]/checkout" })
 * );
 */
export function withCapture<TArgs extends unknown[], TReturn>(
  action: string,
  fn: (...args: TArgs) => Promise<TReturn>,
  getCtx?: (...args: TArgs) => Partial<CaptureContext>
): (...args: TArgs) => Promise<TReturn> {
  return async (...args: TArgs): Promise<TReturn> => {
    try {
      return await fn(...args);
    } catch (err) {
      const extraCtx = getCtx ? getCtx(...args) : {};
      capture(err, { action, ...extraCtx });
      throw err;
    }
  };
}

/**
 * Called from instrumentation.ts to install global process-level handlers.
 * Only safe to call in the Node.js runtime (not Edge).
 */
export function setupGlobalHandlers(): void {
  // Guard: only install once, only in Node.js runtime
  if (
    typeof process === "undefined" ||
    typeof process.on !== "function" ||
    (process as NodeJS.Process & { __sabaErrorHandlersInstalled?: boolean }).__sabaErrorHandlersInstalled
  ) {
    return;
  }
  (process as NodeJS.Process & { __sabaErrorHandlersInstalled?: boolean }).__sabaErrorHandlersInstalled = true;

  process.on("unhandledRejection", (reason) => {
    capture(
      reason instanceof Error ? reason : new Error(`Unhandled rejection: ${String(reason)}`),
      { action: "unhandled_rejection", route: "process" },
      "fatal"
    );
  });

  process.on("uncaughtException", (err) => {
    capture(err, { action: "uncaught_exception", route: "process" }, "fatal");
    // Do NOT call process.exit() — let Next.js manage the process lifecycle
  });
}
