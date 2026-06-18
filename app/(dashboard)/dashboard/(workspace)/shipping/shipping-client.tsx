// ============================================================
// Saba Store — Shipping Client Component
// ============================================================
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Truck,
  Plus,
  Edit2,
  Trash2,
  X,
  Loader2,
  MapPin,
  Clock,
  DollarSign,
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  createShippingMethod,
  updateShippingMethod,
  deleteShippingMethod,
  toggleShippingMethodActive,
} from "@/actions/shipping";
import { shippingMethodSchema, type ShippingMethodInput } from "@/lib/validations/shipping";
import { cn, formatCurrency } from "@/lib/utils";

interface ShippingClientProps {
  initialMethods: any[];
  store: any;
  initialError: string | null;
}

export function ShippingClient({ initialMethods, store, initialError }: ShippingClientProps) {
  const router = useRouter();

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<any | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingMethod, setDeletingMethod] = useState<any | null>(null);

  // Form setup
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    reset,
    formState,
  } = useForm<ShippingMethodInput>({
    resolver: zodResolver(shippingMethodSchema) as any,
    defaultValues: {
      name: "",
      type: "fixed",
      base_price: 0,
      free_shipping_threshold: null,
      pickup_address: "",
      estimated_days_min: null,
      estimated_days_max: null,
      notes: "",
      is_active: true,
      zones: [],
    },
  });

  const { errors, isSubmitting } = formState as any;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "zones",
  });

  const selectedType = watch("type");

  const handleOpenAdd = () => {
    reset({
      name: "",
      type: "fixed",
      base_price: 0,
      free_shipping_threshold: null,
      pickup_address: "",
      estimated_days_min: null,
      estimated_days_max: null,
      notes: "",
      is_active: true,
      zones: [],
    });
    setEditingMethod(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (method: any) => {
    // Map zones if available
    const mappedZones = (method.shipping_zones ?? []).map((zone: any) => ({
      city_name: zone.city_name,
      price: zone.price,
      estimated_days_min: zone.estimated_days_min ?? "",
      estimated_days_max: zone.estimated_days_max ?? "",
    }));

    reset({
      name: method.name,
      type: method.type,
      base_price: method.base_price,
      free_shipping_threshold: method.free_shipping_threshold ?? null,
      pickup_address: method.pickup_address ?? "",
      estimated_days_min: method.estimated_days_min ?? null,
      estimated_days_max: method.estimated_days_max ?? null,
      notes: method.notes ?? "",
      is_active: method.is_active,
      zones: mappedZones,
    });
    setEditingMethod(method);
    setModalOpen(true);
  };

  const onSubmit = async (data: ShippingMethodInput) => {
    try {
      const formattedData = {
        ...data,
        free_shipping_threshold: data.free_shipping_threshold || null,
        estimated_days_min: data.estimated_days_min || null,
        estimated_days_max: data.estimated_days_max || null,
      };

      let res;
      if (editingMethod) {
        res = await updateShippingMethod(editingMethod.id, formattedData as any);
      } else {
        res = await createShippingMethod(formattedData as any);
      }

      if (res.error) {
        toast.error(res.error);
        return;
      }

      toast.success(editingMethod ? "تم تعديل خيار الشحن" : "تم إضافة خيار الشحن بنجاح");
      setModalOpen(false);
      router.refresh();
    } catch {
      toast.error("حدث خطأ غير متوقع");
    }
  };

  const handleToggleActive = async (method: any) => {
    try {
      const res = await toggleShippingMethodActive(method.id, !method.is_active);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(method.is_active ? "تم تعطيل خيار الشحن" : "تم تفعيل خيار الشحن");
        router.refresh();
      }
    } catch {
      toast.error("فشل تعديل حالة طريقة الشحن");
    }
  };

  const handleDeleteClick = (method: any) => {
    setDeletingMethod(method);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingMethod) return;
    try {
      const res = await deleteShippingMethod(deletingMethod.id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("تم إزالة خيار الشحن");
        router.refresh();
      }
    } catch {
      toast.error("فشل حذف خيار الشحن");
    } finally {
      setDeleteConfirmOpen(false);
      setDeletingMethod(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass p-4 rounded-2xl">
        <div className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-primary shrink-0" />
          <p className="text-xs text-muted-foreground">
            توصية: يفضل دمج الدفع عند الاستلام كطريقة دفع إضافية إذا قمت بتفعيل الشحن اليدوي.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="btn-brand text-sm px-4 py-2 flex items-center gap-2 w-full sm:w-auto justify-center cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
          إضافة خيار شحن
        </button>
      </div>

      {initialError && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
          {initialError}
        </div>
      )}

      {/* Shipping Methods List */}
      {initialMethods.length === 0 ? (
        <div className="glass-card py-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto text-primary">
            <Truck className="h-8 w-8" />
          </div>
          <div>
            <p className="text-base font-cairo font-semibold text-foreground">
              لم تقم بتهيئة خيارات شحن وتوصيل
            </p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
              قم بإعداد خيارات التوصيل والأسعار ليتمكن العملاء من اختيار طريقة التوصيل المفضلة لديهم عند صفحة الدفع.
            </p>
          </div>
          <button onClick={handleOpenAdd} className="btn-secondary text-xs px-4 py-2 cursor-pointer">
            إضافة أول طريقة شحن
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {initialMethods.map((method) => {
            const isCityBased = method.type === "city_based";
            const isPickup = method.type === "pickup";
            const isFree = method.type === "free";

            return (
              <div
                key={method.id}
                className={cn(
                  "glass-card p-5 space-y-4 border transition-all duration-300",
                  method.is_active ? "border-primary/20" : "opacity-60 border-border"
                )}
              >
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <Truck className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-cairo font-bold text-foreground text-sm">{method.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {method.type === "fixed"
                          ? "سعر ثابت"
                          : method.type === "city_based"
                          ? "حسب المدينة"
                          : method.type === "free"
                          ? "شحن مجاني"
                          : method.type === "pickup"
                          ? "استلام من المتجر"
                          : "مخصص"}
                      </p>
                    </div>
                  </div>

                  {/* Toggle Active status */}
                  <button
                    onClick={() => handleToggleActive(method)}
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    title={method.is_active ? "تعطيل" : "تفعيل"}
                  >
                    {method.is_active ? (
                      <ToggleRight className="h-7 w-7 text-primary" />
                    ) : (
                      <ToggleLeft className="h-7 w-7 text-muted-foreground" />
                    )}
                  </button>
                </div>

                {/* Details view */}
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  {!isCityBased && !isFree && (
                    <p>
                      <span className="font-semibold text-foreground">سعر الشحن:</span>{" "}
                      {formatCurrency(method.base_price, store?.currency ?? "ILS")}
                    </p>
                  )}
                  {isFree && (
                    <p>
                      <span className="font-semibold text-emerald-600">توصيل مجاني بالكامل</span>
                    </p>
                  )}
                  {method.free_shipping_threshold && (
                    <p>
                      <span className="font-semibold text-emerald-600">توصيل مجاني للطلبات فوق:</span>{" "}
                      {formatCurrency(method.free_shipping_threshold, store?.currency ?? "ILS")}
                    </p>
                  )}
                  {isPickup && method.pickup_address && (
                    <p>
                      <span className="font-semibold text-foreground">عنوان الاستلام:</span> {method.pickup_address}
                    </p>
                  )}
                  {method.estimated_days_min && (
                    <p>
                      <span className="font-semibold text-foreground">مدة التوصيل المتوقعة:</span>{" "}
                      {method.estimated_days_min} - {method.estimated_days_max} أيام
                    </p>
                  )}

                  {/* Custom city prices view */}
                  {isCityBased && method.shipping_zones && method.shipping_zones.length > 0 && (
                    <div className="border-t border-border/50 pt-2 space-y-1">
                      <p className="font-semibold text-foreground text-[11px] mb-1">الأسعار حسب المدينة:</p>
                      <div className="grid grid-cols-2 gap-2 max-h-24 overflow-y-auto pr-1 no-scrollbar">
                        {method.shipping_zones.map((zone: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center bg-sidebar/40 p-1.5 rounded-lg border border-border/40 text-[10px]">
                            <span>{zone.city_name}</span>
                            <span className="font-mono text-foreground font-semibold">
                              {formatCurrency(zone.price, store?.currency ?? "ILS")}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
                  <button
                    onClick={() => handleOpenEdit(method)}
                    className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="h-3 w-3" />
                    تعديل
                  </button>
                  <button
                    onClick={() => handleDeleteClick(method)}
                    className="p-2 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                    title="حذف"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── ADD / EDIT DIALOG ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          />
          <div className="relative w-full max-w-xl bg-card border border-border p-6 rounded-2xl shadow-brand-lg animate-scale-in text-right max-h-[90vh] overflow-y-auto no-scrollbar">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute left-4 top-4 p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="text-lg font-cairo font-bold text-foreground mb-4">
              {editingMethod ? "تعديل خيار الشحن" : "إضافة خيار شحن جديد"}
            </h3>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">نوع الشحن</label>
                <select
                  className="w-full px-4 py-2.5 rounded-xl bg-input border border-border text-foreground text-sm focus:outline-none"
                  {...register("type")}
                >
                  <option value="fixed">سعر ثابت لكافة المناطق</option>
                  <option value="city_based">تسعير مخصص حسب المدينة</option>
                  <option value="free">شحن مجاني بالكامل</option>
                  <option value="pickup">استلام من مقر المتجر</option>
                  <option value="custom">طريقة شحن مخصصة</option>
                </select>
              </div>

              {/* Display Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">
                  اسم خيار الشحن <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  placeholder="مثال: توصيل سريع للمحافظات الشمالية"
                  className={cn(
                    "w-full px-4 py-2.5 rounded-xl bg-input border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none",
                    errors.name ? "border-destructive" : "border-border"
                  )}
                  {...register("name")}
                />
                {errors.name && <p className="text-destructive text-xs mt-0.5">{errors.name.message}</p>}
              </div>

              {/* Base Price & Free Limit (Show except free/pickup/city_based list) */}
              {selectedType !== "free" && selectedType !== "pickup" && selectedType !== "city_based" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">
                      سعر التوصيل ({store?.currency}) <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 rounded-xl bg-input border border-border text-foreground text-sm focus:outline-none font-mono"
                      {...register("base_price")}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">حد الشحن المجاني (اختياري)</label>
                    <input
                      type="text"
                      placeholder="مثال: مجاني للطلبات فوق 200 شيكل"
                      className="w-full px-4 py-2.5 rounded-xl bg-input border border-border text-foreground text-sm focus:outline-none font-mono"
                      {...register("free_shipping_threshold")}
                    />
                  </div>
                </div>
              )}

              {/* Estimated Delivery Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">أقل مدة للتوصيل (أيام)</label>
                  <input
                    type="number"
                    placeholder="1"
                    className="w-full px-4 py-2.5 rounded-xl bg-input border border-border text-foreground text-sm focus:outline-none font-mono"
                    {...register("estimated_days_min")}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">أقصى مدة للتوصيل (أيام)</label>
                  <input
                    type="number"
                    placeholder="3"
                    className="w-full px-4 py-2.5 rounded-xl bg-input border border-border text-foreground text-sm focus:outline-none font-mono"
                    {...register("estimated_days_max")}
                  />
                </div>
              </div>

              {/* Pickup Address (Only when pickup) */}
              {selectedType === "pickup" && (
                <div className="space-y-1.5 animate-fade-in">
                  <label className="text-xs font-semibold text-muted-foreground">
                    عنوان الاستلام من المتجر <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: رام الله - شارع الإرسال - عمارة الياسمين الطابق 2"
                    className="w-full px-4 py-2.5 rounded-xl bg-input border border-border text-foreground text-sm focus:outline-none"
                    {...register("pickup_address")}
                  />
                </div>
              )}

              {/* City Prices (Only when city_based) */}
              {selectedType === "city_based" && (
                <div className="space-y-2 border border-dashed border-border rounded-xl p-4 bg-sidebar/20 animate-fade-in">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-foreground">أسعار الشحن المخصصة للمدن</span>
                    <button
                      type="button"
                      onClick={() => append({ city_name: "", price: 0, estimated_days_min: "", estimated_days_max: "" })}
                      className="text-xs text-primary hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="h-3 w-3" />
                      إضافة تسعيرة مدينة
                    </button>
                  </div>

                  {fields.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      لم تضف تسعيرات للمدن بعد. سيتم استخدام السعر الافتراضي لباقي المدن.
                    </p>
                  ) : (
                    <div className="space-y-2.5 max-h-44 overflow-y-auto pr-1 no-scrollbar">
                      {fields.map((item, idx) => (
                        <div key={item.id} className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="اسم المدينة (مثال: نابلس)"
                            className="flex-1 px-3 py-1.5 rounded-lg bg-input border border-border text-foreground text-xs focus:outline-none"
                            {...register(`zones.${idx}.city_name`)}
                          />
                          <input
                            type="text"
                            placeholder="سعر الشحن"
                            className="w-20 px-3 py-1.5 rounded-lg bg-input border border-border text-foreground text-xs focus:outline-none font-mono"
                            {...register(`zones.${idx}.price`)}
                          />
                          <button
                            type="button"
                            onClick={() => remove(idx)}
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Default Base Price for unspecified cities */}
                  <div className="space-y-1.5 border-t border-border/50 pt-3 mt-2">
                    <label className="text-xs font-semibold text-muted-foreground">
                      سعر الشحن الافتراضي للمدن الأخرى ({store?.currency})
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 rounded-xl bg-input border border-border text-foreground text-xs focus:outline-none font-mono"
                      {...register("base_price")}
                    />
                  </div>
                </div>
              )}

              {/* Instructions / Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">ملاحظات أو تعليمات الشحن</label>
                <textarea
                  rows={2}
                  placeholder="ملاحظات تظهر للعميل عند اختيار طريقة الشحن..."
                  className="w-full px-4 py-2.5 rounded-xl bg-input border border-border text-foreground text-sm focus:outline-none resize-none"
                  {...register("notes")}
                />
              </div>

              {/* Status */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded text-primary focus:ring-primary bg-input border-border"
                  {...register("is_active")}
                />
                <span className="text-xs font-semibold text-foreground">تفعيل خيار الشحن وتوفيره مباشرة في المتجر</span>
              </label>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-secondary text-sm px-4 py-2 cursor-pointer"
                  disabled={isSubmitting}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="btn-brand text-sm px-5 py-2 flex items-center gap-1.5 cursor-pointer"
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  حفظ خيار الشحن
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRMATION ── */}
      {deleteConfirmOpen && deletingMethod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDeleteConfirmOpen(false)}
          />
          <div className="relative w-full max-w-md bg-card border border-border p-6 rounded-2xl shadow-brand-lg animate-scale-in text-right">
            <h3 className="text-lg font-cairo font-bold text-foreground mb-2">
              تأكيد حذف خيار الشحن
            </h3>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              هل أنت متأكد من حذف خيار الشحن{" "}
              <span className="text-foreground font-semibold">"{deletingMethod.name}"</span>؟
              <br />
              لن يتمكن العملاء من اختيار طريقة التوصيل هذه بعد الآن.
            </p>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                className="btn-secondary text-sm px-4 py-2 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={confirmDelete}
                className="bg-destructive hover:bg-destructive/90 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors cursor-pointer font-cairo"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
