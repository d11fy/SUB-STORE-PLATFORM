"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Store,
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Sparkles,
  Package,
  Zap,
  Crown,
} from "lucide-react";
import { toast } from "sonner";
import { createStore, checkSlugAvailability } from "@/actions/store";
import { createStoreSchema, type CreateStoreInput } from "@/lib/validations/store";
import { generateSlug, cn, formatCurrency } from "@/lib/utils";
import type { Package as PackageType } from "@/lib/types/database";

// ============================================================
// TYPES
// ============================================================
interface OnboardingWizardProps {
  packages: PackageType[];
}

type Step = "store_info" | "package" | "review";

const STEPS: { id: Step; label: string; icon: React.ReactNode }[] = [
  { id: "store_info", label: "معلومات المتجر", icon: <Store className="h-4 w-4" /> },
  { id: "package", label: "اختر الباقة", icon: <Package className="h-4 w-4" /> },
  { id: "review", label: "مراجعة وإطلاق", icon: <Sparkles className="h-4 w-4" /> },
];

const CATEGORIES = [
  { value: "fashion", label: "أزياء وملابس", emoji: "👗" },
  { value: "accessories", label: "إكسسوارات وهدايا", emoji: "💍" },
  { value: "beauty", label: "تجميل وعناية", emoji: "💄" },
  { value: "digital", label: "منتجات رقمية", emoji: "💻" },
  { value: "electronics", label: "إلكترونيات", emoji: "📱" },
  { value: "food", label: "مطاعم وحلويات", emoji: "🍰" },
  { value: "home", label: "أثاث وديكور", emoji: "🏠" },
  { value: "general", label: "متجر عام", emoji: "🛒" },
];

// ============================================================
// PACKAGE CARD
// ============================================================
function PackageCard({
  pkg,
  selected,
  onSelect,
}: {
  pkg: PackageType;
  selected: boolean;
  onSelect: () => void;
}) {
  const icons = {
    starter: Zap,
    growth: Package,
    pro: Crown,
  };
  const Icon = icons[pkg.slug as keyof typeof icons] ?? Package;

  const features = [
    pkg.max_products === null
      ? "منتجات غير محدودة"
      : `حتى ${pkg.max_products} منتج`,
    `${pkg.max_ai_credits} رصيد ذكاء اصطناعي شهرياً`,
    `${pkg.max_themes} ثيم احترافي`,
    pkg.has_custom_domain ? "نطاق مخصص" : null,
    pkg.has_email_notif ? "إشعارات بريدية" : null,
    pkg.has_reports ? "تقارير متقدمة" : null,
    pkg.has_priority_support ? "دعم أولوية" : null,
  ].filter(Boolean) as string[];

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "pricing-card flex flex-col h-full text-right transition-all duration-300 relative",
        "p-6 rounded-2xl border",
        "hover:border-primary/50 hover:scale-[1.02]",
        selected ? "border-primary shadow-brand scale-[1.02] bg-primary/5" : "border-border bg-card/50 hover:bg-card"
      )}
    >
      {selected && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full shadow-sm">مختار</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
          selected ? "bg-primary/20" : "bg-muted"
        )}>
          <Icon className={cn("h-6 w-6", selected ? "text-primary" : "text-muted-foreground")} />
        </div>
        <div>
          <h3 className="font-cairo font-bold text-lg text-foreground">{pkg.name}</h3>
          <p className="text-xs text-muted-foreground line-clamp-2">{pkg.description}</p>
        </div>
      </div>

      {/* Price */}
      <div className="flex items-end gap-1 mb-6">
        <span className="text-4xl font-cairo font-bold text-foreground">
          {pkg.price_monthly}
        </span>
        <span className="text-muted-foreground text-sm mb-1 font-medium">₪ / شهر</span>
      </div>

      {/* Features */}
      <ul className="space-y-3 text-sm flex-1 mb-6">
        {features.slice(0, 5).map((f) => (
          <li key={f} className="flex items-start gap-2 text-muted-foreground">
            <Check className={cn("h-4 w-4 shrink-0 mt-0.5", selected ? "text-primary" : "text-emerald-400")} />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      {/* CTA Button */}
      <div className={cn(
        "w-full py-3 mt-auto rounded-xl text-sm font-bold font-cairo transition-all text-center",
        selected
          ? "bg-primary text-primary-foreground"
          : "border border-border text-muted-foreground hover:bg-primary/10 hover:border-primary/30 hover:text-primary"
      )}>
        {selected ? "✓ تم الاختيار" : "اختر هذه الباقة"}
      </div>
    </button>
  );
}

// ============================================================
// MAIN WIZARD
// ============================================================
export function OnboardingWizard({ packages }: OnboardingWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>("store_info");
  const [isLoading, setIsLoading] = useState(false);
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [selectedPackageId, setSelectedPackageId] = useState<string>(
    packages[0]?.id ?? ""
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    trigger,
  } = useForm<CreateStoreInput>({
    resolver: zodResolver(createStoreSchema),
    defaultValues: {
      package_id: packages[0]?.id ?? "",
      country: "PS",
      currency: "ILS",
    },
  });

  const storeName = watch("name");
  const storeSlug = watch("slug");

  // Auto-generate slug from store name
  const handleNameChange = useCallback(
    (name: string) => {
      const slug = generateSlug(name);
      setValue("slug", slug);
      setSlugStatus("idle");
    },
    [setValue]
  );

  // Check slug availability
  const handleCheckSlug = async () => {
    if (!storeSlug || storeSlug.length < 3) return;
    setSlugStatus("checking");
    const result = await checkSlugAvailability(storeSlug);
    setSlugStatus(result.available ? "available" : "taken");
  };

  // Step navigation
  const goNext = async () => {
    if (currentStep === "store_info") {
      const valid = await trigger(["name", "slug", "category"]);
      if (!valid) return;
      if (slugStatus === "taken") {
        toast.error("هذا الرابط محجوز، يرجى اختيار رابط آخر");
        return;
      }
      setCurrentStep("package");
    } else if (currentStep === "package") {
      if (!selectedPackageId) {
        toast.error("يرجى اختيار باقة");
        return;
      }
      setValue("package_id", selectedPackageId);
      setCurrentStep("review");
    }
  };

  const goBack = () => {
    if (currentStep === "package") setCurrentStep("store_info");
    if (currentStep === "review") setCurrentStep("package");
  };

  // Final submit
  const onSubmit = async (data: CreateStoreInput) => {
    setIsLoading(true);
    try {
      const result = await createStore({ ...data, package_id: selectedPackageId });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("تم إنشاء متجرك بنجاح! 🎉");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("حدث خطأ غير متوقع");
    } finally {
      setIsLoading(false);
    }
  };

  const stepIndex = STEPS.findIndex((s) => s.id === currentStep);
  const selectedPackage = packages.find((p) => p.id === selectedPackageId);

  return (
    <div className="min-h-dvh bg-mesh-gradient flex flex-col items-center justify-center p-4">
      <div className={cn("w-full animate-fade-in transition-all duration-500", currentStep === "package" ? "max-w-5xl" : "max-w-2xl")}>
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
            <span className="text-2xl font-cairo font-bold text-primary">س</span>
          </div>
          <h1 className="text-3xl font-cairo font-bold text-foreground">
            أهلاً! لنبني متجرك
          </h1>
          <p className="text-muted-foreground mt-2">
            3 خطوات بسيطة لإطلاق متجرك الاحترافي
          </p>
        </div>

        {/* Steps Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((step, idx) => (
            <div key={step.id} className="flex items-center">
              <div
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
                  idx <= stepIndex
                    ? "bg-primary text-primary-foreground shadow-brand"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {idx < stepIndex ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  step.icon
                )}
                <span className="hidden sm:block">{step.label}</span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    "w-8 h-px mx-1 transition-all duration-300",
                    idx < stepIndex ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="glass-card p-8">
          <form onSubmit={handleSubmit(onSubmit)}>

            {/* ── STEP 1: Store Info ── */}
            {currentStep === "store_info" && (
              <div className="space-y-5 animate-fade-in">
                <h2 className="text-xl font-cairo font-bold text-foreground">
                  معلومات متجرك
                </h2>

                {/* Store Name */}
                <div className="form-group">
                  <label className="text-sm font-medium text-foreground">
                    اسم المتجر <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: متجر الأناقة"
                    className={cn(
                      "w-full px-4 py-3 rounded-xl bg-input border text-foreground placeholder:text-muted-foreground",
                      "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all",
                      errors.name ? "border-destructive" : "border-border hover:border-muted-foreground"
                    )}
                    {...register("name", {
                      onChange: (e) => handleNameChange(e.target.value),
                    })}
                  />
                  {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
                </div>

                {/* Slug */}
                <div className="form-group">
                  <label className="text-sm font-medium text-foreground">
                    رابط المتجر <span className="text-destructive">*</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="my-store"
                        dir="ltr"
                        className={cn(
                          "w-full px-4 py-3 rounded-xl bg-input border text-foreground placeholder:text-muted-foreground text-left",
                          "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all",
                          errors.slug ? "border-destructive" :
                          slugStatus === "available" ? "border-emerald-500" :
                          slugStatus === "taken" ? "border-destructive" :
                          "border-border hover:border-muted-foreground"
                        )}
                        {...register("slug", {
                          onChange: () => setSlugStatus("idle"),
                        })}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleCheckSlug}
                      disabled={slugStatus === "checking"}
                      className="px-4 py-3 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all disabled:opacity-50"
                    >
                      {slugStatus === "checking" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : "تحقق"}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    رابط متجرك:{" "}
                    <span dir="ltr" className="text-primary">
                      sabastore.com/store/{storeSlug || "my-store"}
                    </span>
                  </p>
                  {slugStatus === "available" && (
                    <p className="text-emerald-400 text-xs flex items-center gap-1">
                      <Check className="h-3 w-3" /> الرابط متاح ✓
                    </p>
                  )}
                  {slugStatus === "taken" && (
                    <p className="text-destructive text-xs">
                      ❌ هذا الرابط محجوز، جرّب رابطاً آخر
                    </p>
                  )}
                  {errors.slug && <p className="text-destructive text-xs">{errors.slug.message}</p>}
                </div>

                {/* Category */}
                <div className="form-group">
                  <label className="text-sm font-medium text-foreground">
                    نوع المتجر <span className="text-destructive">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {CATEGORIES.map((cat) => {
                      const isSelected = watch("category") === cat.value;
                      return (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => setValue("category", cat.value)}
                          className={cn(
                            "flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all duration-200",
                            isSelected
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                          )}
                        >
                          <span className="text-2xl">{cat.emoji}</span>
                          {cat.label}
                        </button>
                      );
                    })}
                  </div>
                  {errors.category && <p className="text-destructive text-xs">{errors.category.message}</p>}
                </div>
              </div>
            )}

            {/* ── STEP 2: Package Selection ── */}
            {currentStep === "package" && (
              <div className="space-y-5 animate-fade-in">
                <div>
                  <h2 className="text-xl font-cairo font-bold text-foreground">
                    اختر الباقة المناسبة
                  </h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    يمكنك التغيير لاحقاً في أي وقت
                  </p>
                </div>

                {packages.length === 0 ? (
                  <div className="text-center py-10 bg-muted/50 rounded-xl border border-dashed border-border">
                    <p className="text-muted-foreground font-medium">لا توجد باقات متاحة حاليًا</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {packages.map((pkg) => (
                      <PackageCard
                        key={pkg.id}
                        pkg={pkg}
                        selected={selectedPackageId === pkg.id}
                        onSelect={() => setSelectedPackageId(pkg.id)}
                      />
                    ))}
                  </div>
                )}

                <p className="text-center text-xs text-muted-foreground">
                  🎉 تجربة مجانية 3 أيام على جميع الباقات — بدون بطاقة ائتمان
                </p>
              </div>
            )}

            {/* ── STEP 3: Review ── */}
            {currentStep === "review" && (
              <div className="space-y-5 animate-fade-in">
                <h2 className="text-xl font-cairo font-bold text-foreground">
                  راجع وأطلق متجرك 🚀
                </h2>

                <div className="space-y-3">
                  {/* Store Summary */}
                  <div className="p-4 rounded-xl bg-sidebar-accent space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      معلومات المتجر
                    </p>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">الاسم</span>
                        <span className="font-medium text-foreground">{watch("name")}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">الرابط</span>
                        <span className="font-medium text-primary" dir="ltr">
                          /store/{watch("slug")}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">النوع</span>
                        <span className="font-medium text-foreground">
                          {CATEGORIES.find((c) => c.value === watch("category"))?.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Package Summary */}
                  {selectedPackage && (
                    <div className="p-4 rounded-xl bg-sidebar-accent space-y-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        الباقة المختارة
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="font-cairo font-bold text-foreground">
                          {selectedPackage.name}
                        </span>
                        <span className="badge-info">
                          3 أيام مجاناً
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        ثم {selectedPackage.price_monthly} ₪ / شهر
                      </p>
                    </div>
                  )}
                </div>

                {/* Launch button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className={cn(
                    "w-full py-4 px-6 rounded-xl font-cairo font-bold text-base",
                    "bg-primary text-primary-foreground",
                    "hover:bg-primary/90 active:scale-[0.98]",
                    "transition-all duration-200 shadow-brand hover:shadow-brand-lg",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "flex items-center justify-center gap-2"
                  )}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      جارٍ إنشاء متجرك...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      أطلق متجري الآن 🚀
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Navigation Buttons */}
            {currentStep !== "review" && (
              <div className="flex items-center justify-between mt-6 pt-5 border-t border-border">
                <button
                  type="button"
                  onClick={goBack}
                  disabled={currentStep === "store_info"}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium",
                    "text-muted-foreground border border-border",
                    "hover:text-foreground hover:border-primary/50 transition-all",
                    "disabled:opacity-30 disabled:cursor-not-allowed"
                  )}
                >
                  <ArrowRight className="h-4 w-4" />
                  السابق
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  className={cn(
                    "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-cairo font-semibold",
                    "bg-primary text-primary-foreground",
                    "hover:bg-primary/90 active:scale-[0.98] transition-all shadow-brand"
                  )}
                >
                  التالي
                  <ArrowLeft className="h-4 w-4" />
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
