"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

export default function CheckoutError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const params = useParams();
  const slug = params?.slug as string | undefined;

  return (
    <div
      className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center font-cairo"
      dir="rtl"
    >
      <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-xl mb-5">
        🛒
      </div>
      <h2 className="text-lg font-black text-foreground mb-2">خطأ في صفحة الدفع</h2>
      <p className="text-sm text-muted-foreground mb-1 max-w-sm leading-relaxed">
        تعذّر إتمام عملية الدفع. لم يتم خصم أي مبلغ. يرجى المحاولة مرة أخرى.
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
        {slug && (
          <Link
            href={`/store/${slug}`}
            className="px-4 py-2 bg-muted border border-border text-foreground text-sm font-bold rounded-xl hover:bg-muted/70 transition-colors"
          >
            العودة للمتجر
          </Link>
        )}
      </div>
    </div>
  );
}
