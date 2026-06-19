"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Lock, AlertTriangle, Loader2, XCircle } from "lucide-react";

// Pages accessible even when locked
const ALLOWED_WHEN_LOCKED = [
  "/dashboard/billing",
  "/dashboard/subscription",
  "/dashboard/settings",
];

import type { SubscriptionStateStatus as LockState } from "@/lib/subscription-utils";

interface SubscriptionGuardProps {
  children: React.ReactNode;
  isLocked: boolean;
  lockState: LockState;
  adminNote: string | null;
}

export function SubscriptionGuard({ children, isLocked, lockState, adminNote }: SubscriptionGuardProps) {
  const pathname = usePathname();

  const isAllowed = ALLOWED_WHEN_LOCKED.some((p) => pathname.startsWith(p));

  if (!isLocked || isAllowed) {
    return <>{children}</>;
  }

  return <LockGate state={lockState} adminNote={adminNote} />;
}

function LockGate({ state, adminNote }: { state: LockState; adminNote: string | null }) {
  if (state === "pending") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
        <div className="space-y-2 max-w-sm">
          <h2 className="font-cairo font-bold text-xl text-foreground">طلبك قيد المراجعة</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            تم استلام إثبات الدفع بنجاح. سيقوم فريقنا بمراجعة طلبك وتفعيل اشتراكك خلال 24 ساعة.
          </p>
        </div>
        <Link
          href="/dashboard/billing"
          className="text-sm text-primary hover:underline font-medium"
        >
          عرض تفاصيل الطلب
        </Link>
      </div>
    );
  }

  if (state === "rejected") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
          <XCircle className="h-8 w-8 text-red-500" />
        </div>
        <div className="space-y-2 max-w-sm">
          <h2 className="font-cairo font-bold text-xl text-foreground">تم رفض طلب الدفع</h2>
          {adminNote && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {adminNote}
            </p>
          )}
          <p className="text-muted-foreground text-sm">
            يرجى مراجعة سبب الرفض وإعادة إرسال إثبات الدفع.
          </p>
        </div>
        <Link
          href="/dashboard/billing"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          إعادة إرسال إثبات الدفع
        </Link>
      </div>
    );
  }

  // locked / no_sub / trialing-expired
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center">
        <Lock className="h-8 w-8 text-amber-600" />
      </div>
      <div className="space-y-2 max-w-sm">
        <h2 className="font-cairo font-bold text-xl text-foreground">انتهت فترة التجربة المجانية</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          لمواصلة استخدام متجرك وجميع الميزات، يرجى الاشتراك في إحدى الباقات المتاحة.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/dashboard/billing"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          الاشتراك الآن
        </Link>
        <Link
          href="/dashboard/settings"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-background text-sm font-medium hover:bg-muted transition-colors"
        >
          إعدادات المتجر
        </Link>
      </div>
    </div>
  );
}
