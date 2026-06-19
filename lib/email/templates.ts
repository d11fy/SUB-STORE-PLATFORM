const BASE_STYLE = `
  font-family: 'Segoe UI', Tahoma, sans-serif;
  direction: rtl;
  text-align: right;
  background: #f8fafc;
  margin: 0;
  padding: 0;
`;

const CARD_STYLE = `
  max-width: 580px;
  margin: 32px auto;
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
`;

const HEADER_STYLE = `
  background: #1a1a2e;
  padding: 28px 32px;
`;

const BODY_STYLE = `
  padding: 32px;
`;

const FOOTER_STYLE = `
  padding: 20px 32px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  text-align: center;
  color: #94a3b8;
  font-size: 12px;
`;

function wrap(content: string): string {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="${BASE_STYLE}">
  <div style="${CARD_STYLE}">
    <div style="${HEADER_STYLE}">
      <p style="color:#ffffff;font-size:22px;font-weight:700;margin:0;">سبأ ستور</p>
      <p style="color:#94a3b8;font-size:13px;margin:4px 0 0;">منصة التجارة الإلكترونية</p>
    </div>
    <div style="${BODY_STYLE}">${content}</div>
    <div style="${FOOTER_STYLE}">
      <p style="margin:0;">© 2025 سبأ ستور — جميع الحقوق محفوظة</p>
      <p style="margin:4px 0 0;">للدعم: support@sabastore.com</p>
    </div>
  </div>
</body>
</html>`;
}

function btn(label: string, url: string, color = "#2563eb"): string {
  return `<a href="${url}" style="display:inline-block;background:${color};color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:600;font-size:14px;margin-top:20px;">${label}</a>`;
}

function badge(label: string, color: string): string {
  return `<span style="display:inline-block;background:${color}22;color:${color};border:1px solid ${color}44;padding:4px 14px;border-radius:20px;font-size:12px;font-weight:600;">${label}</span>`;
}

// ============================================================
// TEMPLATE 1: Trial ending soon
// ============================================================
export function trialEndingSoon(storeName: string, plan: string, trialEndsAt: string): string {
  const date = new Date(trialEndsAt).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
  return wrap(`
    <p style="margin:0 0 8px;font-size:13px;color:#64748b;">تنبيه مهم</p>
    <h1 style="margin:0 0 20px;font-size:22px;color:#1e293b;">فترة التجربة المجانية على وشك الانتهاء</h1>
    ${badge("تجريبي", "#f59e0b")}
    <div style="margin:24px 0;padding:20px;background:#fff7ed;border-radius:12px;border:1px solid #fed7aa;">
      <p style="margin:0;font-size:14px;color:#7c3aed;">
        مرحباً، متجرك <strong>${storeName}</strong> على باقة <strong>${plan}</strong>.
        فترة التجربة تنتهي في <strong>${date}</strong>.
      </p>
    </div>
    <p style="color:#475569;font-size:14px;line-height:1.7;">
      لمواصلة استخدام جميع ميزات المنصة بدون انقطاع، يرجى تجديد الاشتراك قبل انتهاء الفترة التجريبية.
    </p>
    ${btn("تجديد الاشتراك الآن", `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`)}
  `);
}

// ============================================================
// TEMPLATE 2: Subscription expired
// ============================================================
export function subscriptionExpired(storeName: string, plan: string): string {
  return wrap(`
    <p style="margin:0 0 8px;font-size:13px;color:#64748b;">تنبيه عاجل</p>
    <h1 style="margin:0 0 20px;font-size:22px;color:#1e293b;">تم إيقاف متجرك مؤقتاً</h1>
    ${badge("منتهي", "#ef4444")}
    <div style="margin:24px 0;padding:20px;background:#fef2f2;border-radius:12px;border:1px solid #fecaca;">
      <p style="margin:0;font-size:14px;color:#991b1b;">
        انتهت فترة الاشتراك لمتجر <strong>${storeName}</strong> على باقة <strong>${plan}</strong>.
        تم إيقاف متجرك مؤقتاً حتى يتم تجديد الاشتراك.
      </p>
    </div>
    <p style="color:#475569;font-size:14px;line-height:1.7;">
      قم بتجديد اشتراكك الآن لاستعادة الوصول الكامل إلى متجرك وجميع الميزات.
    </p>
    ${btn("تجديد الاشتراك", `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`, "#ef4444")}
  `);
}

// ============================================================
// TEMPLATE 3: Payment approved
// ============================================================
export function paymentApproved(storeName: string, plan: string, endsAt: string): string {
  const date = new Date(endsAt).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
  return wrap(`
    <p style="margin:0 0 8px;font-size:13px;color:#64748b;">تهانينا 🎉</p>
    <h1 style="margin:0 0 20px;font-size:22px;color:#1e293b;">تم تفعيل اشتراكك بنجاح</h1>
    ${badge("نشط", "#22c55e")}
    <div style="margin:24px 0;padding:20px;background:#f0fdf4;border-radius:12px;border:1px solid #bbf7d0;">
      <p style="margin:0;font-size:14px;color:#166534;">
        تم قبول دفعتك وتفعيل اشتراك <strong>${storeName}</strong> على باقة <strong>${plan}</strong>.
        الاشتراك ساري حتى <strong>${date}</strong>.
      </p>
    </div>
    <p style="color:#475569;font-size:14px;line-height:1.7;">
      يمكنك الآن الاستمتاع بجميع ميزات المنصة. شكراً لاستخدامك سبأ ستور.
    </p>
    ${btn("الذهاب للوحة التحكم", `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`, "#22c55e")}
  `);
}

// ============================================================
// TEMPLATE 4: Payment rejected
// ============================================================
export function paymentRejected(storeName: string, reason: string): string {
  return wrap(`
    <p style="margin:0 0 8px;font-size:13px;color:#64748b;">إشعار مهم</p>
    <h1 style="margin:0 0 20px;font-size:22px;color:#1e293b;">تم رفض طلب الدفع</h1>
    ${badge("مرفوض", "#ef4444")}
    <div style="margin:24px 0;padding:20px;background:#fef2f2;border-radius:12px;border:1px solid #fecaca;">
      <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#991b1b;">سبب الرفض:</p>
      <p style="margin:0;font-size:14px;color:#7f1d1d;">${reason}</p>
    </div>
    <p style="color:#475569;font-size:14px;line-height:1.7;">
      يرجى مراجعة سبب الرفض وإعادة إرسال إثبات الدفع الصحيح عبر لوحة التحكم.
    </p>
    ${btn("إعادة إرسال إثبات الدفع", `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`, "#ef4444")}
  `);
}

// ============================================================
// TEMPLATE 5: Subscription reactivated
// ============================================================
export function subscriptionReactivated(storeName: string, plan: string): string {
  return wrap(`
    <p style="margin:0 0 8px;font-size:13px;color:#64748b;">خبر سار 🎉</p>
    <h1 style="margin:0 0 20px;font-size:22px;color:#1e293b;">تم إعادة تفعيل متجرك</h1>
    ${badge("نشط", "#22c55e")}
    <div style="margin:24px 0;padding:20px;background:#f0fdf4;border-radius:12px;border:1px solid #bbf7d0;">
      <p style="margin:0;font-size:14px;color:#166534;">
        تمت إعادة تفعيل متجر <strong>${storeName}</strong> على باقة <strong>${plan}</strong> بنجاح.
      </p>
    </div>
    <p style="color:#475569;font-size:14px;line-height:1.7;">
      متجرك يعمل الآن بشكل كامل. شكراً لاستخدامك سبأ ستور.
    </p>
    ${btn("الذهاب للوحة التحكم", `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`, "#22c55e")}
  `);
}
