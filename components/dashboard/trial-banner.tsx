"use client";

import Link from "next/link";
import { AlertTriangle, Clock, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SubscriptionStateStatus } from "@/lib/subscription-utils";

interface TrialBannerProps {
  status: SubscriptionStateStatus;
  daysRemaining: number;
  adminNote: string | null;
}

export function TrialBanner({ status, daysRemaining, adminNote }: TrialBannerProps) {
  if (status === "active") return null;

  if (status === "trialing" && daysRemaining > 3) return null;

  if (status === "trialing") {
    const urgent = daysRemaining <= 1;
    return (
      <div
        className={cn(
          "flex items-center justify-between gap-3 px-4 py-2.5 text-sm font-medium border-b",
          urgent
            ? "bg-red-50 border-red-200 text-red-800"
            : "bg-amber-50 border-amber-200 text-amber-800"
        )}
      >
        <div className="flex items-center gap-2">
          {urgent ? (
            <AlertTriangle className="h-4 w-4 shrink-0" />
          ) : (
            <Clock className="h-4 w-4 shrink-0" />
          )}
          <span>
            {daysRemaining === 0
              ? "تنتهي فترتك التجريبية اليوم!"
              : `متبقٍ ${daysRemaining} ${daysRemaining === 1 ? "يوم" : "أيام"} من التجربة المجانية`}
          </span>
        </div>
        <Link
          href="/dashboard/billing"
          className={cn(
            "shrink-0 text-xs px-3 py-1 rounded-full font-semibold transition-colors",
            urgent
              ? "bg-red-600 text-white hover:bg-red-700"
              : "bg-amber-600 text-white hover:bg-amber-700"
          )}
        >
          اشترك الآن
        </Link>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b bg-blue-50 border-blue-200 text-blue-800">
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
        <span>طلب الاشتراك قيد المراجعة — سيتم التفعيل خلال 24 ساعة</span>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm font-medium border-b bg-red-50 border-red-200 text-red-800">
        <div className="flex items-center gap-2">
          <XCircle className="h-4 w-4 shrink-0" />
          <span>
            تم رفض طلب الدفع
            {adminNote ? `: ${adminNote}` : ""}
          </span>
        </div>
        <Link
          href="/dashboard/billing"
          className="shrink-0 text-xs px-3 py-1 rounded-full font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors"
        >
          إعادة الإرسال
        </Link>
      </div>
    );
  }

  // locked / no_sub
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm font-medium border-b bg-red-50 border-red-200 text-red-800">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span>انتهت فترتك التجريبية — متجرك موقوف مؤقتاً</span>
      </div>
      <Link
        href="/dashboard/billing"
        className="shrink-0 text-xs px-3 py-1 rounded-full font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors"
      >
        فعّل الاشتراك
      </Link>
    </div>
  );
}
