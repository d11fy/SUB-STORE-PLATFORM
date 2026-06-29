// ============================================================
// Email sender — dual-driver abstraction
//
// Driver priority:
//   1. Resend  — when RESEND_API_KEY is set (install: npm i resend)
//   2. SMTP    — when SMTP_HOST / platform_settings are configured
//
// Both drivers share the same EmailPayload interface so callers
// never need to know which transport is active.
// ============================================================
import nodemailer from "nodemailer";
import { createAdminClient } from "@/lib/supabase/admin";

export interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export interface SendResult {
  success: boolean;
  error?: string;
}

// ── Resend driver ─────────────────────────────────────────────────────────────

async function sendViaResend(payload: EmailPayload): Promise<SendResult> {
  // Dynamic import so the package is truly optional at startup.
  // If not installed: `npm install resend`
  const mod = await import("resend").catch(() => null);
  if (!mod) {
    return { success: false, error: "resend package is not installed — run: npm install resend" };
  }

  const { Resend } = mod as typeof import("resend");
  const client = new Resend(process.env.RESEND_API_KEY!);
  const from = process.env.RESEND_FROM ?? `سبأ ستور <noreply@sabastore.com>`;

  const { error } = await client.emails.send({
    from,
    to: Array.isArray(payload.to) ? payload.to : [payload.to],
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
    reply_to: payload.replyTo,
  });

  if (error) {
    console.error("[email/resend]", error.message);
    return { success: false, error: error.message };
  }
  return { success: true };
}

// ── SMTP driver ───────────────────────────────────────────────────────────────

interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
}

let _smtpCache: { config: SmtpConfig; expires: number } | null = null;

async function getSmtpConfig(): Promise<SmtpConfig | null> {
  if (_smtpCache && Date.now() < _smtpCache.expires) return _smtpCache.config;

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("platform_settings")
    .select("key, value")
    .in("key", ["smtp_host", "smtp_port", "smtp_user", "smtp_pass", "smtp_from"]);

  const kv: Record<string, string> = {};
  data?.forEach(({ key, value }: { key: string; value: string | null }) => {
    if (value) kv[key] = value;
  });

  const host = kv.smtp_host || process.env.SMTP_HOST;
  const user = kv.smtp_user || process.env.SMTP_USER;
  const pass = kv.smtp_pass || process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  const config: SmtpConfig = {
    host,
    port: parseInt(kv.smtp_port || process.env.SMTP_PORT || "587"),
    user,
    pass,
    from: kv.smtp_from || process.env.SMTP_FROM || `"سبأ ستور" <noreply@sabastore.com>`,
  };

  _smtpCache = { config, expires: Date.now() + 5 * 60 * 1000 };
  return config;
}

async function sendViaSmtp(payload: EmailPayload): Promise<SendResult> {
  const config = await getSmtpConfig();
  if (!config) {
    return {
      success: false,
      error: "لم يتم إعداد البريد — أضف RESEND_API_KEY أو بيانات SMTP في إعدادات المنصة",
    };
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: { user: config.user, pass: config.pass },
    tls: { rejectUnauthorized: false },
  });

  await transporter.sendMail({
    from: config.from,
    to: Array.isArray(payload.to) ? payload.to.join(", ") : payload.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
    replyTo: payload.replyTo,
  });

  return { success: true };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Send an email using the configured driver.
 * Resend is used when RESEND_API_KEY is set; SMTP otherwise.
 */
export async function sendEmail(payload: EmailPayload): Promise<SendResult> {
  try {
    if (process.env.RESEND_API_KEY) {
      return await sendViaResend(payload);
    }
    return await sendViaSmtp(payload);
  } catch (err: any) {
    console.error("[email] unexpected error:", err?.message);
    return { success: false, error: err?.message };
  }
}

/** Invalidate SMTP config cache — call after updating SMTP settings. */
export function invalidateSmtpCache() {
  _smtpCache = null;
}
