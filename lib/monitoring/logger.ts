// ============================================================
// Saba Store — Structured Logger
//
// Convenience wrapper around the error tracker.
// All .error() calls are routed through capture() which gives
// full stack traces, fingerprinting, and Sentry/webhook delivery.
// .info() and .warn() emit lightweight structured events without
// the overhead of stack capture.
//
// Existing call sites require no changes — the API is identical.
// ============================================================

import { capture, captureMessage } from "./error-tracker";

export const logger = {
  info(
    action: string,
    message: string,
    ctx?: { userId?: string | null; storeId?: string | null; route?: string | null; metadata?: Record<string, unknown> }
  ) {
    captureMessage(message, "info", { action, ...ctx });
  },

  warn(
    action: string,
    message: string,
    ctx?: { userId?: string | null; storeId?: string | null; route?: string | null; metadata?: Record<string, unknown> }
  ) {
    captureMessage(message, "warn", { action, ...ctx });
  },

  error(
    action: string,
    error: unknown,
    ctx?: { userId?: string | null; storeId?: string | null; route?: string | null; metadata?: Record<string, unknown> }
  ) {
    capture(error instanceof Error ? error : new Error(String(error)), {
      action,
      ...ctx,
    });
  },

  // Convenience: log a server action error with structured context
  actionError(
    action: string,
    error: unknown,
    ctx: { userId?: string | null; storeId?: string | null; route?: string }
  ) {
    capture(error instanceof Error ? error : new Error(String(error)), {
      action,
      ...ctx,
    });
  },

  // Auth-specific events — warn level, no stack needed
  authFailure(route: string, reason: string, userId?: string | null) {
    captureMessage(reason, "warn", {
      action: "auth_failure",
      userId,
      route,
    });
  },

  // RLS / security events — error level with stack
  rlsViolation(action: string, storeId: string | null, userId: string | null) {
    capture(
      new Error(`RLS policy blocked access in ${action}`),
      {
        action: "rls_violation",
        userId,
        storeId,
        metadata: { blockedAction: action },
      },
      "error"
    );
  },
};
