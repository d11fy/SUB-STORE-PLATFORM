"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Mail, Lock, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { signIn } from "@/actions/auth";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    try {
      const result = await signIn(data);
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
            مرحباً بعودتك
          </h1>
          <p className="text-muted-foreground text-sm">
            سجّل دخولك لإدارة متجرك
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email */}
          <div className="form-group">
            <label
              htmlFor="email"
              className="text-sm font-medium text-foreground"
            >
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
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
                  "transition-all duration-200 text-left",
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
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-sm font-medium text-foreground"
              >
                كلمة المرور
              </label>
              <span className="text-xs text-muted-foreground">
                نسيت كلمة المرور؟ تواصل مع الدعم
              </span>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                dir="ltr"
                className={cn(
                  "w-full px-4 py-3 pr-10 rounded-xl bg-input border text-foreground placeholder:text-muted-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
                  "transition-all duration-200 text-left",
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
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-destructive text-xs mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

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
                جارٍ تسجيل الدخول...
              </>
            ) : (
              <>
                تسجيل الدخول
                <ArrowLeft className="h-4 w-4 rtl-flip" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="divider-text">
          <span>ليس لديك حساب؟</span>
        </div>

        {/* Register Link */}
        <Link
          href="/register"
          className={cn(
            "w-full py-3 px-6 rounded-xl font-cairo font-medium text-sm",
            "border border-border text-foreground",
            "hover:bg-card hover:border-primary/50",
            "transition-all duration-200",
            "flex items-center justify-center gap-2"
          )}
        >
          إنشاء حساب جديد مجاناً
        </Link>
      </div>

      {/* Trial note */}
      <p className="text-center text-xs text-muted-foreground mt-4">
        🎉 ابدأ مع تجربة مجانية 3 أيام — لا يتطلب بطاقة ائتمان
      </p>
    </div>
  );
}
