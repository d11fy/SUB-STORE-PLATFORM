"use client";

import { useState, useTransition } from "react";
import { savePlatformSettings, saveSmtpSettings, testSmtpSettings } from "@/actions/admin";
import { toast } from "sonner";
import {
  Save, Loader2, Mail, Eye, EyeOff, CheckCircle2,
  AlertTriangle, Send, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================
// TYPES
// ============================================================
interface SmtpSettings {
  smtp_host: string;
  smtp_port: string;
  smtp_user: string;
  smtp_pass: string;
  smtp_from: string;
  configured: boolean;
}

interface SettingsFormProps {
  initial: Record<string, unknown>;
  smtp: SmtpSettings;
}

// ============================================================
// COMPONENT
// ============================================================
export function SettingsForm({ initial, smtp }: SettingsFormProps) {
  // General settings
  const [isPendingGeneral, startGeneral] = useTransition();
  const [maintenanceMode, setMaintenanceMode] = useState(!!initial.maintenance_mode);
  const [freezeRegistrations, setFreezeRegistrations] = useState(!!initial.freeze_registrations);
  const [aiEnabled, setAiEnabled] = useState(initial.ai_features_enabled !== false);
  const [announcement, setAnnouncement] = useState((initial.announcement as string) ?? "");

  // SMTP settings
  const [isPendingSmtp, startSmtp] = useTransition();
  const [isPendingTest, startTest] = useTransition();
  const [smtpHost, setSmtpHost] = useState(smtp.smtp_host);
  const [smtpPort, setSmtpPort] = useState(smtp.smtp_port || "587");
  const [smtpUser, setSmtpUser] = useState(smtp.smtp_user);
  const [smtpPass, setSmtpPass] = useState(smtp.smtp_pass);
  const [smtpFrom, setSmtpFrom] = useState(smtp.smtp_from);
  const [showPass, setShowPass] = useState(false);
  const [testEmail, setTestEmail] = useState(smtp.smtp_user);

  // ============================================================
  // HANDLERS
  // ============================================================
  function handleSaveGeneral() {
    startGeneral(async () => {
      try {
        await savePlatformSettings({
          maintenance_mode: maintenanceMode,
          freeze_registrations: freezeRegistrations,
          ai_features_enabled: aiEnabled,
          announcement,
        });
        toast.success("تم حفظ الإعدادات");
      } catch {
        toast.error("فشل حفظ الإعدادات");
      }
    });
  }

  function handleSaveSmtp() {
    if (!smtpHost || !smtpUser) {
      toast.error("SMTP Host و Email مطلوبان");
      return;
    }
    startSmtp(async () => {
      const result = await saveSmtpSettings({
        smtp_host: smtpHost,
        smtp_port: smtpPort,
        smtp_user: smtpUser,
        smtp_pass: smtpPass,
        smtp_from: smtpFrom,
      });
      if (result.success) toast.success("تم حفظ إعدادات البريد");
      else toast.error(result.error ?? "فشل الحفظ");
    });
  }

  function handleTestSmtp() {
    if (!testEmail) { toast.error("أدخل إيميل الاختبار"); return; }
    startTest(async () => {
      const result = await testSmtpSettings(testEmail);
      if (result.success) toast.success(`تم إرسال إيميل اختباري إلى ${testEmail}`);
      else toast.error(`فشل الإرسال: ${result.error}`);
    });
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="space-y-8" dir="rtl">

      {/* ── SECTION 1: General toggles ──────────────────────── */}
      <section className="space-y-4">
        <SectionHeader title="إعدادات عامة" />

        <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden">
          {[
            {
              label: "وضع الصيانة",
              description: "تعطيل الواجهة الأمامية لجميع المتاجر مؤقتاً",
              value: maintenanceMode,
              onChange: setMaintenanceMode,
              danger: true,
            },
            {
              label: "تجميد التسجيلات الجديدة",
              description: "منع إنشاء حسابات تجار جديدة",
              value: freezeRegistrations,
              onChange: setFreezeRegistrations,
              danger: true,
            },
            {
              label: "ميزات الذكاء الاصطناعي",
              description: "تفعيل/تعطيل جميع أدوات AI على مستوى المنصة",
              value: aiEnabled,
              onChange: setAiEnabled,
              danger: false,
            },
          ].map((s) => (
            <ToggleRow key={s.label} {...s} />
          ))}
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <div>
            <p className="text-sm font-cairo font-bold text-foreground">رسالة الإعلان</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              تُعرض كشريط في أعلى لوحات التحكم (اتركها فارغة للإخفاء)
            </p>
          </div>
          <textarea
            value={announcement}
            onChange={(e) => setAnnouncement(e.target.value)}
            rows={3}
            placeholder="مثال: سيتم إجراء صيانة يوم الجمعة من 2 - 4 صباحاً..."
            className="w-full px-4 py-3 rounded-xl border border-border bg-muted/30 text-sm placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all font-cairo"
          />
        </div>

        <div className="flex justify-end">
          <SaveBtn loading={isPendingGeneral} onClick={handleSaveGeneral} />
        </div>
      </section>

      {/* ── SECTION 2: SMTP ─────────────────────────────────── */}
      <section className="space-y-4">
        <SectionHeader
          title="إعدادات البريد الإلكتروني (SMTP)"
          badge={smtp.configured ? "مُفعَّل" : "غير مُفعَّل"}
          badgeOk={smtp.configured}
        />

        <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-blue-500/5 border border-blue-500/15 text-blue-700 text-xs">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            تُستخدم هذه الإعدادات لإرسال إشعارات الاشتراك للتجار. يمكنك استخدام Gmail أو أي مزود SMTP آخر.
            كلمة المرور تُخزَّن في قاعدة البيانات المشفّرة ولا تظهر في السجلات.
          </span>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="SMTP Host"
              placeholder="smtp.gmail.com"
              value={smtpHost}
              onChange={setSmtpHost}
              hint="مثال: smtp.gmail.com أو smtp.zoho.com"
            />
            <FormField
              label="SMTP Port"
              placeholder="587"
              value={smtpPort}
              onChange={setSmtpPort}
              hint="587 للـ TLS أو 465 للـ SSL"
              type="number"
            />
            <FormField
              label="إيميل الإرسال (Username)"
              placeholder="store@gmail.com"
              value={smtpUser}
              onChange={setSmtpUser}
              type="email"
            />
            {/* Password field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">كلمة مرور التطبيق</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={smtpPass}
                  onChange={(e) => setSmtpPass(e.target.value)}
                  placeholder={smtp.configured ? "محفوظة — اكتب لتغييرها" : "أدخل كلمة المرور"}
                  className="w-full text-sm border border-border rounded-lg px-3 py-2.5 pl-10 focus:outline-none focus:ring-1 focus:ring-ring bg-background"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                لـ Gmail: استخدم{" "}
                <a
                  href="https://myaccount.google.com/apppasswords"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  App Password
                </a>{" "}
                وليس كلمة مرور حسابك
              </p>
            </div>
            <div className="sm:col-span-2">
              <FormField
                label="اسم المُرسِل وإيميله (From)"
                placeholder={`"سبأ ستور" <noreply@sabastore.com>`}
                value={smtpFrom}
                onChange={setSmtpFrom}
                hint={`مثال: "سبأ ستور" <store@gmail.com>`}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
            <SaveBtn loading={isPendingSmtp} onClick={handleSaveSmtp} label="حفظ إعدادات البريد" />
          </div>
        </div>

        {/* Test email */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <div>
            <p className="text-sm font-cairo font-bold text-foreground flex items-center gap-2">
              <Send className="h-4 w-4 text-muted-foreground" />
              اختبار الإرسال
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              أرسل إيميل تجريبي للتحقق من صحة الإعدادات
            </p>
          </div>
          <div className="flex gap-3">
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="test@example.com"
              className="flex-1 text-sm border border-border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-ring bg-background"
            />
            <button
              onClick={handleTestSmtp}
              disabled={isPendingTest || !smtp.configured}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
            >
              {isPendingTest ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              إرسال اختبار
            </button>
          </div>
          {!smtp.configured && (
            <p className="text-xs text-amber-600 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              احفظ إعدادات SMTP أولاً ثم يمكنك الاختبار
            </p>
          )}
        </div>
      </section>

    </div>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================
function SectionHeader({
  title,
  badge,
  badgeOk,
}: {
  title: string;
  badge?: string;
  badgeOk?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-base font-cairo font-bold text-foreground">{title}</h2>
      {badge && (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border",
            badgeOk
              ? "text-emerald-700 bg-emerald-50 border-emerald-200"
              : "text-amber-700 bg-amber-50 border-amber-200"
          )}
        >
          {badgeOk ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
          {badge}
        </span>
      )}
    </div>
  );
}

function ToggleRow({
  label,
  description,
  value,
  onChange,
  danger,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
  danger: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <div>
        <p className="text-sm font-cairo font-bold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <button
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shrink-0",
          value ? (danger ? "bg-rose-500" : "bg-primary") : "bg-muted"
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform",
            value ? "translate-x-6 rtl:-translate-x-6" : "translate-x-1 rtl:-translate-x-1"
          )}
        />
      </button>
    </div>
  );
}

function FormField({
  label,
  placeholder,
  value,
  onChange,
  hint,
  type = "text",
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-foreground">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-sm border border-border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-ring bg-background"
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function SaveBtn({
  loading,
  onClick,
  label = "حفظ الإعدادات",
}: {
  loading: boolean;
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center gap-2 h-10 px-6 rounded-xl bg-primary text-primary-foreground text-sm font-cairo font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      {loading ? "جاري الحفظ..." : label}
    </button>
  );
}
