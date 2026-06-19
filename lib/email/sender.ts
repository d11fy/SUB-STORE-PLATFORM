import nodemailer from "nodemailer";
import { createAdminClient } from "@/lib/supabase/admin";

// ============================================================
// SMTP CONFIG — reads from platform_settings table, falls back to env vars
// In-memory cache: 5-min TTL so serverless restarts don't hit DB every email
// ============================================================
interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
}

let _cache: { config: SmtpConfig; expires: number } | null = null;

async function getSmtpConfig(): Promise<SmtpConfig | null> {
  if (_cache && Date.now() < _cache.expires) return _cache.config;

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("platform_settings")
    .select("key, value")
    .in("key", ["smtp_host", "smtp_port", "smtp_user", "smtp_pass", "smtp_from"]);

  const kv: Record<string, string> = {};
  data?.forEach(({ key, value }: { key: string; value: string | null }) => {
    if (value) kv[key] = value;
  });

  // Fall back to env vars if DB not configured
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

  _cache = { config, expires: Date.now() + 5 * 60 * 1000 };
  return config;
}

// ============================================================
// SEND
// ============================================================
export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(payload: EmailPayload): Promise<{ success: boolean; error?: string }> {
  try {
    const config = await getSmtpConfig();
    if (!config) {
      return { success: false, error: "إعدادات البريد غير مكتملة — قم بضبطها من إعدادات المنصة" };
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
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    });

    return { success: true };
  } catch (err: any) {
    console.error("[email] send failed:", err?.message);
    return { success: false, error: err?.message };
  }
}

// Invalidate cache (call after saving new SMTP settings)
export function invalidateSmtpCache() {
  _cache = null;
}
