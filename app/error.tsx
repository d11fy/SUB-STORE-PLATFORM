"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
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
