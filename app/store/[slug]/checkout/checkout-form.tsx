"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShoppingBag, Loader2, CreditCard, ShieldCheck, Paperclip, X } from "lucide-react";
import { useCartStore } from "@/lib/store/cart-store";
import { checkoutSchema, type CheckoutInput } from "@/lib/validations/checkout";
import { createCustomerOrder, validateAndCalculateOrder, submitPaymentProof } from "@/actions/checkout";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CheckoutFormProps {
  storeSlug: string;
  shippingMethods: any[];
  paymentMethods: any[];
  currency: string;
  requiresShipping: boolean;
}

const PALESTINE_CITIES = [
  "القدس",
  "رام الله والبيرة",
  "نابلس",
  "الخليل",
  "بيت لحم",
  "جنين",
  "طولكرم",
  "قلقيلية",
  "سلفيت",
  "طوباس",
  "أريحا",
  "غزة",
];

const JORDAN_CITIES = [
  "عمان",
  "إربد",
  "الزرقاء",
  "العقبة",
  "السلط",
  "مأدبا",
  "الكرك",
  "معان",
  "جرش",
  "عجلون",
  "المفرق",
  "الطفيلة",
];

export function CheckoutForm({
  storeSlug,
  shippingMethods,
  paymentMethods,
  currency,
  requiresShipping,
}: CheckoutFormProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shippingCost, setShippingCost] = useState<number | null>(null);
  const [calcLoading, setCalcLoading] = useState(false);

  // Payment proof file state (for bank_transfer / local_wallet methods)
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofBase64, setProofBase64] = useState<string | null>(null);
  const proofInputRef = useRef<HTMLInputElement>(null);

  const { items, getCartTotal, clearCart } = useCartStore();
  const subtotal = getCartTotal();

  // Pick first active method as default
  const defaultShipping = requiresShipping ? (shippingMethods[0]?.id ?? "") : "";
  const defaultPayment = paymentMethods[0]?.id ?? "";

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      // Delivery fields populated only for physical stores
      country: requiresShipping ? "PS" : "",
      city: requiresShipping ? "القدس" : "",
      address: "",
      shipping_method_id: defaultShipping,
      payment_method_id: defaultPayment,
    },
  });

  const selectedCountry = watch("country");
  const selectedCity = watch("city");
  const selectedShipping = watch("shipping_method_id");
  const selectedPayment = watch("payment_method_id");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Set default city when country changes — physical stores only
  useEffect(() => {
    if (!requiresShipping) return;
    if (selectedCountry === "PS") {
      setValue("city", PALESTINE_CITIES[0]);
    } else {
      setValue("city", JORDAN_CITIES[0]);
    }
  }, [selectedCountry, setValue, requiresShipping]);

  // Recalculate shipping cost when shipping method, country, or city changes
  useEffect(() => {
    if (!requiresShipping || !mounted || items.length === 0 || !selectedShipping) return;

    async function updateCalculations() {
      setCalcLoading(true);
      try {
        const res = await validateAndCalculateOrder(
          storeSlug,
          items.map((i) => ({
            product_id: i.product_id,
            name: i.name,
            slug: i.slug,
            price: i.price,
            sale_price: i.sale_price,
            quantity: i.quantity,
          })),
          selectedCity ?? "",
          selectedShipping ?? ""
        );

        if (res.error) {
          toast.error(res.error);
        } else {
          setShippingCost(res.shippingCost);
        }
      } catch (err) {
        console.error("Shipping calc error:", err);
      } finally {
        setCalcLoading(false);
      }
    }

    updateCalculations();
  }, [selectedCity, selectedShipping, storeSlug, items, mounted, requiresShipping]);

  if (!mounted) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect if cart is empty
  if (items.length === 0) {
    router.replace(`/store/${storeSlug}/cart`);
    return null;
  }

  const citiesList = selectedCountry === "PS" ? PALESTINE_CITIES : JORDAN_CITIES;
  const currentShippingMethod = shippingMethods.find((m) => m.id === selectedShipping);
  const currentPaymentMethod = paymentMethods.find((m) => m.id === selectedPayment);
  const finalShippingCost = requiresShipping ? (shippingCost !== null ? shippingCost : currentShippingMethod?.base_price ?? 0) : 0;
  const grandTotal = subtotal + finalShippingCost;

  // Check if selected payment method requires a proof upload
  const proofRequired =
    currentPaymentMethod?.type === "bank_transfer" ||
    currentPaymentMethod?.type === "local_wallet";

  const handleProofFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("صيغة الملف غير مدعومة (JPG, PNG, WEBP, PDF فقط)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم الملف كبير جداً (الحد الأقصى 5 ميجابايت)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setProofBase64(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
    setProofFile(file);
    e.target.value = "";
  };

  const onSubmit = async (data: CheckoutInput) => {
    // Block if proof is required but not uploaded
    if (proofRequired && !proofBase64) {
      toast.error("يرجى رفع إثبات الدفع (وصل التحويل) قبل تأكيد الطلب");
      return;
    }

    setIsSubmitting(true);
    try {
      const checkoutItems = items.map((i) => ({
        product_id: i.product_id,
        name: i.name,
        slug: i.slug,
        price: i.price,
        sale_price: i.sale_price,
        quantity: i.quantity,
      }));

      const res = await createCustomerOrder(storeSlug, data, checkoutItems);

      if (res.success && res.orderId) {
        // Upload payment proof immediately after order creation
        if (proofRequired && proofBase64 && proofFile) {
          const proofRes = await submitPaymentProof(
            res.orderId,
            data.full_name,
            null,
            proofBase64,
            proofFile.name,
            proofFile.type
          );
          if (!proofRes.success) {
            // Proof upload failed — order still created, warn the user
            toast.warning("تم إنشاء طلبك، لكن فشل رفع وصل الدفع. يرجى التواصل مع المتجر.");
          }
        }

        toast.success("تم إرسال طلبك بنجاح! 🎉");
        clearCart();
        router.push(`/store/${storeSlug}/orders/${res.orderId}`);
      } else {
        toast.error(res.error || "فشل إتمام الطلب، يرجى مراجعة البيانات");
      }
    } catch (err) {
      toast.error("حدث خطأ غير متوقع أثناء معالجة الطلب");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start font-cairo text-right">
      {/* Checkout details Form (2/3 width) */}
      <div className="lg:col-span-2 space-y-6">
        {/* Customer Information Card */}
        <div className="bg-card border border-border p-6 rounded-2xl space-y-5">
          <h2 className="text-base font-bold text-foreground border-b border-border pb-3">معلومات المشتري والتسليم</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="form-group space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">الاسم الكامل <span className="text-destructive">*</span></label>
              <input
                type="text"
                placeholder="أحمد محمد"
                className={cn(
                  "w-full px-4 py-3 rounded-xl bg-input border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 text-right",
                  errors.full_name ? "border-destructive" : "border-border hover:border-primary/30"
                )}
                {...register("full_name")}
              />
              {errors.full_name && <p className="text-destructive text-[10px]">{errors.full_name.message}</p>}
            </div>

            {/* Phone */}
            <div className="form-group space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">رقم الهاتف الجوال <span className="text-destructive">*</span></label>
              <input
                type="text"
                placeholder="0599000000"
                dir="ltr"
                className={cn(
                  "w-full px-4 py-3 rounded-xl bg-input border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 text-left",
                  errors.phone ? "border-destructive" : "border-border hover:border-primary/30"
                )}
                {...register("phone")}
              />
              {errors.phone && <p className="text-destructive text-[10px] text-right">{errors.phone.message}</p>}
            </div>
          </div>

          {/* Delivery location — physical stores only */}
          {requiresShipping && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Country */}
                <div className="form-group space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">الدولة <span className="text-destructive">*</span></label>
                  <select
                    className="w-full px-4 py-3 rounded-xl bg-input border border-border hover:border-primary/30 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 text-right cursor-pointer"
                    {...register("country")}
                  >
                    <option value="PS">فلسطين 🇵🇸</option>
                    <option value="JO">الأردن 🇯🇴</option>
                  </select>
                </div>

                {/* City */}
                <div className="form-group space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">المدينة / المحافظة <span className="text-destructive">*</span></label>
                  <select
                    className="w-full px-4 py-3 rounded-xl bg-input border border-border hover:border-primary/30 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 text-right cursor-pointer"
                    {...register("city")}
                  >
                    {citiesList.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Email */}
                <div className="form-group space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">البريد الإلكتروني <span className="text-muted-foreground/60">(اختياري)</span></label>
                  <input
                    type="email"
                    placeholder="example@mail.com"
                    dir="ltr"
                    className={cn(
                      "w-full px-4 py-3 rounded-xl bg-input border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 text-left",
                      errors.email ? "border-destructive" : "border-border hover:border-primary/30"
                    )}
                    {...register("email")}
                  />
                  {errors.email && <p className="text-destructive text-[10px] text-right">{errors.email.message}</p>}
                </div>
              </div>

              {/* Address */}
              <div className="form-group space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">العنوان التفصيلي <span className="text-destructive">*</span></label>
                <input
                  type="text"
                  placeholder="مثال: الشارع الرئيسي، بجانب البنك الوطني، الطابق الثاني"
                  className={cn(
                    "w-full px-4 py-3 rounded-xl bg-input border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 text-right",
                    errors.address ? "border-destructive" : "border-border hover:border-primary/30"
                  )}
                  {...register("address")}
                />
                {errors.address && <p className="text-destructive text-[10px]">{errors.address.message}</p>}
              </div>
            </>
          )}

          {/* Email — shown for digital stores outside the delivery block */}
          {!requiresShipping && (
            <div className="form-group space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">البريد الإلكتروني <span className="text-muted-foreground/60">(اختياري)</span></label>
              <input
                type="email"
                placeholder="example@mail.com"
                dir="ltr"
                className={cn(
                  "w-full px-4 py-3 rounded-xl bg-input border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 text-left",
                  errors.email ? "border-destructive" : "border-border hover:border-primary/30"
                )}
                {...register("email")}
              />
              {errors.email && <p className="text-destructive text-[10px] text-right">{errors.email.message}</p>}
            </div>
          )}

          {/* Notes */}
          <div className="form-group space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">ملاحظات إضافية للطلب <span className="text-muted-foreground/60">(اختياري)</span></label>
            <textarea
              placeholder="مثال: يرجى الاتصال قبل التسليم بنصف ساعة"
              rows={2}
              className={cn(
                "w-full px-4 py-3 rounded-xl bg-input border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 text-right resize-none",
                errors.notes ? "border-destructive" : "border-border hover:border-primary/30"
              )}
              {...register("notes")}
            />
            {errors.notes && <p className="text-destructive text-[10px]">{errors.notes.message}</p>}
          </div>
        </div>

        {/* Shipping Method Card — shown only when store requires shipping */}
        {requiresShipping && (
          <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
            <h2 className="text-base font-bold text-foreground border-b border-border pb-3">طريقة الشحن والتوصيل</h2>
            {shippingMethods.length > 0 ? (
              <div className="space-y-3">
                {shippingMethods.map((method) => {
                  const isSelected = selectedShipping === method.id;
                  return (
                    <label
                      key={method.id}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer",
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border bg-muted/20 hover:border-primary/30"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          value={method.id}
                          className="accent-primary h-4 w-4 cursor-pointer"
                          {...register("shipping_method_id")}
                        />
                        <div className="text-right">
                          <span className="font-bold text-xs text-foreground block">{method.name}</span>
                          {method.estimated_days_min && (
                            <span className="text-[10px] text-muted-foreground">
                              الوقت المتوقع: {method.estimated_days_min} - {method.estimated_days_max} أيام
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs font-black text-emerald-600 font-numbers">
                        {method.type === "free" ? "مخفّض / مجاني" : `${method.base_price} ${currency}`}
                      </span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-xl">
                ⚠️ لا تتوفر خيارات شحن مفعلة حالياً لهذا المتجر.
              </div>
            )}
            {errors.shipping_method_id && (
              <p className="text-destructive text-[10px]">{errors.shipping_method_id.message}</p>
            )}
          </div>
        )}

        {/* Payment Method Card */}
        <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
          <h2 className="text-base font-bold text-foreground border-b border-border pb-3">طريقة الدفع المناسبة</h2>
          {paymentMethods.length > 0 ? (
            <div className="space-y-3">
              {paymentMethods.map((method) => {
                const isSelected = selectedPayment === method.id;
                return (
                  <div key={method.id} className="space-y-2">
                    <label
                      className={cn(
                        "flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer",
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border bg-muted/20 hover:border-primary/30"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          value={method.id}
                          className="accent-primary h-4 w-4 cursor-pointer"
                          {...register("payment_method_id")}
                        />
                        <div className="text-right">
                          <span className="font-bold text-xs text-foreground block">{method.name}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {method.type === "cash_on_delivery" ? "الدفع اليدوي عند الاستلام" :
                             method.type === "local_wallet" ? "الدفع عبر محفظة إلكترونية محلية" :
                             method.type === "bank_transfer" ? "الدفع بتحويل بنكي مباشر" : "تحويل فوري"}
                          </span>
                        </div>
                      </div>
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </label>

                    {/* Display Transfer Details if selected */}
                    {isSelected && (method.type === "bank_transfer" || method.type === "local_wallet") && (
                      <div className="bg-muted border border-border p-4 rounded-xl text-xs space-y-3 leading-relaxed text-muted-foreground select-none">
                        <p className="font-bold text-foreground">ℹ️ تعليمات تسديد الدفعة:</p>
                        {method.bank_name && (
                          <p>اسم الجهة/البنك: <span className="text-foreground font-semibold">{method.bank_name}</span></p>
                        )}
                        {method.account_holder_name && (
                          <p>اسم صاحب الحساب: <span className="text-foreground font-semibold">{method.account_holder_name}</span></p>
                        )}
                        {method.account_number && (
                          <p>رقم الحساب/المحفظة: <span className="text-foreground font-bold font-numbers">{method.account_number}</span></p>
                        )}
                        {method.iban && (
                          <p>الآيبان IBAN: <span className="text-foreground font-bold font-numbers select-all">{method.iban}</span></p>
                        )}
                        {method.instructions && (
                          <p className="whitespace-pre-line text-[11px] border-t border-border pt-2 mt-2">{method.instructions}</p>
                        )}
                        <p className="text-[11px] font-bold text-amber-600 border-t border-border pt-2 mt-2">
                          * يرجى حفظ لقطة شاشة للتحويل (وصل التحويل) لإرفاقه في الصفحة القادمة لتأكيد طلبك.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-xl">
              ⚠️ لا تتوفر طرق دفع مفعلة حالياً لهذا المتجر.
            </div>
          )}
          {errors.payment_method_id && (
            <p className="text-destructive text-[10px]">{errors.payment_method_id.message}</p>
          )}
        </div>

        {/* Payment Proof Upload — required for bank_transfer / local_wallet */}
        {proofRequired && (
          <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl space-y-3">
            <h2 className="text-sm font-bold text-amber-800 flex items-center gap-2">
              <Paperclip className="h-4 w-4" />
              رفع إثبات الدفع (مطلوب)
            </h2>
            <p className="text-xs text-amber-700 leading-relaxed">
              بعد تسديد المبلغ، يرجى رفع صورة أو ملف وصل التحويل لتتمكن من تأكيد طلبك.
            </p>

            {proofFile ? (
              <div className="flex items-center justify-between p-3 bg-white border border-amber-200 rounded-xl">
                <div className="flex items-center gap-2 text-xs text-foreground min-w-0">
                  <Paperclip className="h-4 w-4 shrink-0 text-amber-600" />
                  <span className="truncate font-medium">{proofFile.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => { setProofFile(null); setProofBase64(null); }}
                  className="shrink-0 p-1 rounded-lg hover:bg-amber-100 text-amber-600 transition-colors cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => proofInputRef.current?.click()}
                className="w-full py-3 border-2 border-dashed border-amber-300 rounded-xl text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Paperclip className="h-4 w-4" />
                اختر ملف إثبات الدفع
              </button>
            )}

            <input
              ref={proofInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
              onChange={handleProofFileChange}
            />
            <p className="text-[10px] text-amber-600">يُسمح بصور JPG, PNG, WEBP وملفات PDF — الحد الأقصى 5 ميجابايت</p>
          </div>
        )}
      </div>

      {/* Bill summary column (1/3 width) */}
      <div className="space-y-4">
        <div className="bg-card border border-border p-6 rounded-2xl space-y-6 shadow-card">
          <h3 className="font-bold text-foreground text-base border-b border-border pb-3">ملخص الفاتورة</h3>

          {/* Items Preview */}
          <div className="space-y-3 max-h-36 overflow-y-auto divide-y divide-border pr-1 font-sans">
            {items.map((item) => {
              const price = item.sale_price !== null ? item.sale_price : item.price;
              return (
                <div key={item.product_id} className="flex justify-between items-center text-xs py-2 first:pt-0">
                  <span className="text-muted-foreground font-numbers">x{item.quantity}</span>
                  <span className="text-foreground font-cairo text-right line-clamp-1 flex-1 px-3">{item.name}</span>
                  <span className="font-bold text-foreground font-numbers">{formatCurrency(price * item.quantity, currency)}</span>
                </div>
              );
            })}
          </div>

          <div className="border-t border-border pt-4 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">تكلفة المنتجات</span>
              <span className="font-bold text-foreground font-numbers">{formatCurrency(subtotal, currency)}</span>
            </div>
            {requiresShipping && (
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">رسوم التوصيل</span>
                {calcLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                ) : (
                  <span className="font-bold text-foreground font-numbers">
                    {formatCurrency(finalShippingCost, currency)}
                  </span>
                )}
              </div>
            )}

            <div className="border-t border-border pt-4 flex justify-between items-center">
              <span className="font-bold text-foreground text-sm">المجموع الكلي</span>
              <span className="font-black text-emerald-600 text-base font-numbers">
                {formatCurrency(grandTotal, currency)}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={
              isSubmitting ||
              (requiresShipping && calcLoading) ||
              (requiresShipping && shippingMethods.length === 0) ||
              paymentMethods.length === 0 ||
              (proofRequired && !proofBase64)
            }
            className="w-full py-4 bg-primary text-white font-bold text-sm rounded-xl hover:bg-primary/95 transition-all shadow-[0_4px_20px_rgba(27,79,216,0.3)] flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                جارٍ إرسال طلبك...
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                تأكيد وإتمام الشراء 🚀
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
