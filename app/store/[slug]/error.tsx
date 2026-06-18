"use client";

import Link from "next/link";

interface StorefrontErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function StorefrontError({ reset }: StorefrontErrorProps) {
  return (
    <div
      className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center font-cairo"
      dir="rtl"
    >
      <div className="w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-2xl mb-6">
        ⚠️
      </div>
      <h2 className="text-xl font-black text-foreground mb-2">
        حدث خطأ غير متوقع
      </h2>
      <p className="text-muted-foreground text-sm mb-8 max-w-sm leading-relaxed">
        تعذّر تحميل هذه الصفحة. يرجى المحاولة مرة أخرى أو العودة للصفحة الرئيسية.
      </p>
      <div className="flex gap-3 flex-wrap justify-center">
        <button
          onClick={reset}
          className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 transition-all font-cairo"
        >
          إعادة المحاولة
        </button>
        <Link
          href="/"
          className="px-5 py-2.5 bg-muted border border-border text-foreground text-xs font-bold rounded-xl hover:bg-muted/70 transition-all font-cairo"
        >
          العودة للمنصة
        </Link>
      </div>
    </div>
  );
}
