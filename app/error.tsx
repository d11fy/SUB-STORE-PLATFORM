"use client";

import { useEffect } from "react";

// Sends a fire-and-forget error report to the server-side capture endpoint.
// Uses sendBeacon() when available (survives page unload), falls back to fetch().
function reportToServer(error: Error & { digest?: string }) {
  const payload = JSON.stringify({
    message: error.message,
    stack:   error.stack?.slice(0, 2000),
    digest:  error.digest ?? null,
    route:   typeof window !== "undefined" ? window.location.pathname : null,
  });

  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    navigator.sendBeacon("/api/monitoring/report", new Blob([payload], { type: "application/json" }));
  } else {
    fetch("/api/monitoring/report", {
      method:    "POST",
      headers:   { "Content-Type": "application/json" },
      body:      payload,
      keepalive: true,
    }).catch(() => {});
  }
}

export default function GlobalError({
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
    <html lang="ar" dir="rtl">
      <body className="font-cairo bg-background text-foreground min-h-dvh flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-xl mx-auto mb-5">
            ⚠️
          </div>
          <h1 className="text-lg font-black text-foreground mb-2">خطأ غير متوقع</h1>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            حدث خطأ في تحميل الصفحة. يرجى المحاولة مرة أخرى.
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground/50 font-mono mb-4">ref: {error.digest}</p>
          )}
          <button
            onClick={reset}
            className="px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      </body>
    </html>
  );
}
