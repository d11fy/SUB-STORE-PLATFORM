"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

export default function ProductError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const params = useParams();
  const slug = params?.slug as string | undefined;

  return (
    <div
      className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center font-cairo"
      dir="rtl"
    >
      <div className="w-14 h-14 rounded-2xl bg-muted border border-border flex items-center justify-center text-xl mb-5">
        📦
      </div>
      <h2 className="text-base font-black text-foreground mb-2">تعذّر تحميل المنتج</h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs leading-relaxed">
        حدث خطأ أثناء عرض تفاصيل المنتج. يرجى المحاولة مرة أخرى.
      </p>
      <div className="flex gap-3 flex-wrap justify-center">
        <button
          onClick={reset}
          className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors"
        >
          إعادة المحاولة
        </button>
        {slug && (
          <Link
            href={`/store/${slug}/products`}
            className="px-4 py-2 bg-muted border border-border text-foreground text-sm font-bold rounded-xl hover:bg-muted/70 transition-colors"
          >
            جميع المنتجات
          </Link>
        )}
      </div>
    </div>
  );
}
