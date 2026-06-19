import Link from "next/link";

export default function NotFound() {
  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center p-8 text-center font-cairo bg-background text-foreground"
      dir="rtl"
    >
      <p className="text-7xl font-black text-primary/20 mb-6 select-none">٤٠٤</p>
      <h1 className="text-2xl font-black text-foreground mb-2">الصفحة غير موجودة</h1>
      <p className="text-sm text-muted-foreground mb-8 max-w-xs leading-relaxed">
        الرابط الذي أدخلته غير موجود أو تم نقله. تحقق من الرابط أو عد للصفحة الرئيسية.
      </p>
      <div className="flex gap-3 flex-wrap justify-center">
        <Link
          href="/"
          className="px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors"
        >
          الصفحة الرئيسية
        </Link>
        <Link
          href="/dashboard"
          className="px-5 py-2.5 bg-muted border border-border text-foreground text-sm font-bold rounded-xl hover:bg-muted/70 transition-colors"
        >
          لوحة التحكم
        </Link>
      </div>
    </div>
  );
}
