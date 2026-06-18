"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ArrowLeft,
  Loader2,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { signUp } from "@/actions/auth";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { terms: false },
  });

  const password = watch("password", "");
  const termsChecked = watch("terms");

  const passwordStrength = (() => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  })();

  const strengthColors = ["", "bg-red-500", "bg-amber-500", "bg-yellow-400", "bg-emerald-500"];
  const strengthLabels = ["", "ضعيفة", "مقبولة", "جيدة", "قوية"];

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true);
    try {
      const result = await signUp(data);
      if (result?.error) {
        toast.error(result.error);
      }
    } catch (error) {
      // NEXT_REDIRECT is thrown by redirect() — let it propagate normally
      if ((error as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) {
        throw error;
      }
      toast.error("حدث خطأ غير متوقع");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md animate-fade-in">
      {/* Card */}
      <div className="glass-card p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mb-2">
            <span className="text-2xl font-cairo font-bold text-primary">س</span>
          </div>
          <h1 className="text-2xl font-cairo font-bold text-foreground">
            أنشئ متجرك الآن
          </h1>
          <p className="text-muted-foreground text-sm">
            ابدأ تجربتك المجانية 3 أيام — بدون بطاقة ائتمان
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Full Name */}
          <div className="form-group">
            <label htmlFor="full_name" className="text-sm font-medium text-foreground">
              الاسم الكامل
            </label>
            <div className="relative">
              <input
                id="full_name"
                type="text"
                autoComplete="name"
                placeholder="محمد أحمد"
                className={cn(
                  "w-full px-4 py-3 pr-10 rounded-xl bg-input border text-foreground placeholder:text-muted-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200",
                  errors.full_name
                    ? "border-destructive focus:ring-destructive/50"
                    : "border-border hover:border-muted-foreground"
                )}
                {...register("full_name")}
              />
              <User className="absolute top-1/2 -translate-y-1/2 right-3 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
            {errors.full_name && (
              <p className="text-destructive text-xs mt-1">{errors.full_name.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              البريد الإلكتروني
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="example@email.com"
                dir="ltr"
                className={cn(
                  "w-full px-4 py-3 pr-10 rounded-xl bg-input border text-foreground placeholder:text-muted-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 text-left",
                  errors.email
                    ? "border-destructive focus:ring-destructive/50"
                    : "border-border hover:border-muted-foreground"
                )}
                {...register("email")}
              />
              <Mail className="absolute top-1/2 -translate-y-1/2 right-3 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
            {errors.email && (
              <p className="text-destructive text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              كلمة المرور
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="8 أحرف على الأقل"
                dir="ltr"
                className={cn(
                  "w-full px-4 py-3 pr-10 rounded-xl bg-input border text-foreground placeholder:text-muted-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 text-left",
                  errors.password
                    ? "border-destructive focus:ring-destructive/50"
                    : "border-border hover:border-muted-foreground"
                )}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 -translate-y-1/2 right-3 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {/* Password strength indicator */}
            {password && (
              <div className="mt-2 space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={cn(
                        "h-1 flex-1 rounded-full transition-all duration-300",
                        passwordStrength >= level
                          ? strengthColors[passwordStrength]
                          : "bg-muted"
                      )}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  قوة كلمة المرور:{" "}
                  <span className={cn(
                    "font-medium",
                    passwordStrength <= 1 ? "text-red-400" :
                    passwordStrength === 2 ? "text-amber-400" :
                    passwordStrength === 3 ? "text-yellow-400" : "text-emerald-400"
                  )}>
                    {strengthLabels[passwordStrength]}
                  </span>
                </p>
              </div>
            )}
            {errors.password && (
              <p className="text-destructive text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label htmlFor="confirm_password" className="text-sm font-medium text-foreground">
              تأكيد كلمة المرور
            </label>
            <div className="relative">
              <input
                id="confirm_password"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                placeholder="••••••••"
                dir="ltr"
                className={cn(
                  "w-full px-4 py-3 pr-10 rounded-xl bg-input border text-foreground placeholder:text-muted-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 text-left",
                  errors.confirm_password
                    ? "border-destructive focus:ring-destructive/50"
                    : "border-border hover:border-muted-foreground"
                )}
                {...register("confirm_password")}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute top-1/2 -translate-y-1/2 right-3 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirm_password && (
              <p className="text-destructive text-xs mt-1">
                {errors.confirm_password.message}
              </p>
            )}
          </div>

          {/* Terms */}
          <div className="flex items-start gap-3">
            <div className="relative mt-0.5">
              <input
                id="terms"
                type="checkbox"
                className="sr-only"
                {...register("terms")}
              />
              <label
                htmlFor="terms"
                className={cn(
                  "flex items-center justify-center w-5 h-5 rounded border-2 cursor-pointer transition-all duration-200",
                  termsChecked
                    ? "border-primary bg-primary"
                    : errors.terms
                    ? "border-destructive hover:border-destructive"
                    : "border-border hover:border-primary"
                )}
              >
                {termsChecked && <Check className="h-3 w-3 text-white" />}
              </label>
            </div>
            <label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer leading-relaxed">
              أوافق على{" "}
              <Link href="/terms" className="text-primary hover:underline">
                الشروط والأحكام
              </Link>{" "}
              و{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                سياسة الخصوصية
              </Link>
            </label>
          </div>
          {errors.terms && (
            <p className="text-destructive text-xs -mt-2">{errors.terms.message}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              "w-full py-3 px-6 rounded-xl font-cairo font-semibold text-sm",
              "bg-primary text-primary-foreground",
              "hover:bg-primary/90 active:scale-[0.98]",
              "transition-all duration-200 shadow-brand hover:shadow-brand-lg",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100",
              "flex items-center justify-center gap-2"
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                جارٍ إنشاء الحساب...
              </>
            ) : (
              <>
                ابدأ تجربتك المجانية
                <ArrowLeft className="h-4 w-4 rtl-flip" />
              </>
            )}
          </button>
        </form>

        {/* Login link */}
        <p className="text-center text-sm text-muted-foreground">
          لديك حساب بالفعل؟{" "}
          <Link href="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
            تسجيل الدخول
          </Link>
        </p>
      </div>

      {/* Features highlight */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        {[
          { icon: "🚀", text: "إطلاق سريع" },
          { icon: "🔒", text: "آمن 100%" },
          { icon: "📱", text: "متجاوب كلياً" },
        ].map((item) => (
          <div
            key={item.text}
            className="glass text-center py-2.5 px-3 rounded-xl text-xs text-muted-foreground"
          >
            <span className="text-base">{item.icon}</span>
            <p className="mt-1">{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
