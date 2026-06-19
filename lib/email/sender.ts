import nodemailer from "nodemailer";

// Singleton transporter — created once per cold start
let _transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (_transporter) return _transporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error("SMTP credentials missing: set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS");
  }

  _transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
  });

  return _transporter;
}

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(payload: EmailPayload): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = getTransporter();
    const from = process.env.SMTP_FROM ?? `"سبأ ستور" <noreply@sabastore.com>`;

    await transporter.sendMail({
      from,
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
