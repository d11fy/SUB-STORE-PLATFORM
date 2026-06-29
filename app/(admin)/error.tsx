"use client";

import { useEffect } from "react";
import Link from "next/link";

function reportToServer(error: Error & { digest?: string }) {
  const payload = JSON.stringify({
    message: error.message,
    stack:   error.stack?.slice(0, 2000),
    digest:  error.digest ?? null,
    route:   typeof window !== "undefined" ? window.location.pathname : "/admin",
  });
  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    navigator.sendBeacon("/api/monitoring/report", new Blob([payload], { type: "application/json" }));
  } else {
    fetch("/api/monitoring/report", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, keepalive: true }).catch(() => {});
  }
}

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportToServer(error);
  }, [error]);

  return (
    <div
      className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center font-cairo"
      dir="rtl"
    >
      <div className="w-14 h-14 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-xl mb-5">
        🛡️
      </div>
      <h2 className="text-lg font-black text-foreground mb-2">خطأ في لوحة الإدارة</h2>
      <p className="text-sm text-muted-foreground mb-1 max-w-sm leading-relaxed">
        تعذّر تحميل هذه الصفحة. يرجى مراجعة السجلات أو التواصل مع الفريق التقني.
      </p>
      {error.digest && (
        <p className="text-xs text-muted-foreground/60 font-mono mb-6">ref: {error.digest}</p>
      )}
      <div className="flex gap-3 flex-wrap justify-center mt-4">
        <button
          onClick={reset}
          className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors"
        >
          إعادة المحاولة
        </button>
        <Link
          href="/admin"
          className="px-4 py-2 bg-muted border border-border text-foreground text-sm font-bold rounded-xl hover:bg-muted/70 transition-colors"
        >
          الإدارة الرئيسية
        </Link>
      </div>
    </div>
  );
}
