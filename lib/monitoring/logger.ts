// ============================================================
// Saba Store — Structured Server Logger
// Dual-channel: structured console (Vercel captures) + optional DB
// ============================================================

type LogLevel = "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  action: string;
  message: string;
  userId?: string | null;
  storeId?: string | null;
  route?: string | null;
  errorCode?: string | null;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

function emit(entry: LogEntry) {
  const line = JSON.stringify(entry);
  if (entry.level === "error") {
    console.error(line);
  } else if (entry.level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

// ── Public API ──────────────────────────────────────────────

export const logger = {
  info(
    action: string,
    message: string,
    ctx?: Omit<LogEntry, "level" | "action" | "message" | "timestamp">
  ) {
    emit({ level: "info", action, message, timestamp: new Date().toISOString(), ...ctx });
  },

  warn(
    action: string,
    message: string,
    ctx?: Omit<LogEntry, "level" | "action" | "message" | "timestamp">
  ) {
    emit({ level: "warn", action, message, timestamp: new Date().toISOString(), ...ctx });
  },

  error(
    action: string,
    error: unknown,
    ctx?: Omit<LogEntry, "level" | "action" | "message" | "timestamp">
  ) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "object" && error !== null
        ? JSON.stringify(error)
        : String(error);

    const errorCode =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code: unknown }).code)
        : null;

    emit({
      level: "error",
      action,
      message,
      errorCode,
      timestamp: new Date().toISOString(),
      ...ctx,
    });
  },

  // Convenience: log a server action error with structured context
  actionError(
    action: string,
    error: unknown,
    ctx: { userId?: string | null; storeId?: string | null; route?: string }
  ) {
    logger.error(action, error, ctx);
  },

  // Auth-specific events
  authFailure(route: string, reason: string, userId?: string | null) {
    emit({
      level: "warn",
      action: "auth_failure",
      message: reason,
      userId,
      route,
      timestamp: new Date().toISOString(),
    });
  },

  // RLS / security events
  rlsViolation(action: string, storeId: string | null, userId: string | null) {
    emit({
      level: "error",
      action: "rls_violation",
      message: `RLS policy blocked access in ${action}`,
      userId,
      storeId,
      timestamp: new Date().toISOString(),
    });
  },
};
