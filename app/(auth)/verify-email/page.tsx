import Link from "next/link";
import { Mail, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "تأكيد الحساب | سبأ ستور",
  description: "يرجى تأكيد حسابك لتفعيل متجرك على سبأ ستور",
};

export default function VerifyEmailPage() {
  return (
    <div className="w-full max-w-md animate-fade-in">
      {/* Card */}
      <div className="glass-card p-8 space-y-6 text-center">
        {/* Header */}
        <div className="space-y-2 flex flex-col items-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mb-2">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-cairo font-bold text-foreground">
            تفعيل الحساب مطلوب
          </h1>
          <p className="text-muted-foreground text-sm font-cairo">
            تفقد بريدك الإلكتروني لتفعيل حسابك
          </p>
        </div>

        {/* Message */}
        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed font-cairo">
          <p>
            لقد أرسلنا رابط تفعيل الحساب إلى بريدك الإلكتروني.
          </p>
          <p>
            يرجى التحقق من صندوق الوارد (أو مجلد الرسائل غير المرغوب فيها Spam) والضغط على الرابط لتفعيل حسابك والبدء في إعداد متجرك الإلكتروني.
          </p>
        </div>

        {/* Action Link */}
        <Link
          href="/login"
          className={cn(
            "w-full py-3 px-6 rounded-xl font-cairo font-semibold text-sm",
            "bg-primary text-primary-foreground",
            "hover:bg-primary/90 active:scale-[0.98]",
            "transition-all duration-200 shadow-brand hover:shadow-brand-lg",
            "flex items-center justify-center gap-2"
          )}
        >
          العودة لتسجيل الدخول
          <ArrowLeft className="h-4 w-4 rtl-flip" />
        </Link>
      </div>

      {/* Helper Note */}
      <p className="text-center text-xs text-muted-foreground mt-4 font-cairo">
        لم تستلم الرسالة؟ تحقق من العنوان المدخل أو حاول التسجيل مجدداً.
      </p>
    </div>
  );
}
