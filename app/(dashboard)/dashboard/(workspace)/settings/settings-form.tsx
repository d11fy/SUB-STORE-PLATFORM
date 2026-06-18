// ============================================================
// Saba Store — Settings Form Component
// ============================================================
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Store,
  Upload,
  Globe,
  Settings,
  Mail,
  Phone,
  Loader2,
  CheckCircle,
  Truck,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { updateStoreSettings } from "@/actions/store";
import { storeSettingsSchema, type StoreSettingsInput } from "@/lib/validations/store";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface SettingsFormProps {
  store: any;
}

export function SettingsForm({ store }: SettingsFormProps) {
  const router = useRouter();
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(store.logo_url);
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(store.cover_url);

  // Initialize form
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState,
  } = useForm<StoreSettingsInput>({
    resolver: zodResolver(storeSettingsSchema) as any,
    defaultValues: {
      name: store.name,
      description: store.description ?? "",
      email: store.email ?? "",
      phone: store.phone ?? "",
      whatsapp: store.whatsapp ?? "",
      address: store.address ?? "",
      city: store.city ?? "",
      country: store.country || "PS",
      currency: store.currency || "ILS",
      meta_title: store.meta_title ?? "",
      meta_description: store.meta_description ?? "",
      social_links: {
        instagram: store.social_links?.instagram ?? "",
        facebook: store.social_links?.facebook ?? "",
        tiktok: store.social_links?.tiktok ?? "",
        twitter: store.social_links?.twitter ?? "",
        whatsapp: store.whatsapp ?? "",
      },
      logo_url: store.logo_url ?? "",
      cover_url: store.cover_url ?? "",
      requires_shipping: store.requires_shipping !== false,
      is_maintenance: store.settings?.maintenance_mode ?? false,
    },
  });

  const { errors, isSubmitting } = formState as any;

  const logoUrl = watch("logo_url");
  const isMaintenance = watch("is_maintenance");

  // Logo file upload handler
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم الملف كبير جداً، الحد الأقصى المسموح به هو 5 ميغابايت");
      return;
    }

    // Validate mime
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("نوع الملف غير مدعوم، يرجى رفع صورة بصيغة JPG, PNG أو WebP");
      return;
    }

    setLogoUploading(true);
    try {
      const supabase = createClient();
      const fileExt = file.name.split(".").pop();
      const filePath = `${store.id}/logo-${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from("store-assets")
        .upload(filePath, file, { upsert: true });

      if (error) throw error;

      // Fetch public Url
      const { data: { publicUrl } } = supabase.storage
        .from("store-assets")
        .getPublicUrl(filePath);

      setValue("logo_url", publicUrl);
      setLogoPreview(publicUrl);
      toast.success("تم رفع الشعار بنجاح");
    } catch (err) {
      console.error("Error uploading logo:", err);
      toast.error("فشل رفع الصورة، يرجى المحاولة مرة أخرى");
    } finally {
      setLogoUploading(false);
    }
  };

  // Cover image upload handler
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم الملف كبير جداً، الحد الأقصى المسموح به هو 5 ميغابايت");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("نوع الملف غير مدعوم، يرجى رفع صورة بصيغة JPG, PNG أو WebP");
      return;
    }

    setCoverUploading(true);
    try {
      const supabase = createClient();
      const fileExt = file.name.split(".").pop();
      const filePath = `${store.id}/cover-${Date.now()}.${fileExt}`;

      const { error } = await supabase.storage
        .from("store-assets")
        .upload(filePath, file, { upsert: true });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage.from("store-assets").getPublicUrl(filePath);
      setValue("cover_url", publicUrl);
      setCoverPreview(publicUrl);
      toast.success("تم رفع صورة الغلاف بنجاح");
    } catch (err) {
      console.error("Error uploading cover:", err);
      toast.error("فشل رفع الصورة، يرجى المحاولة مرة أخرى");
    } finally {
      setCoverUploading(false);
    }
  };

  // Submit form
  const onSubmit = async (data: StoreSettingsInput) => {
    try {
      const res = await updateStoreSettings(data);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("تم حفظ إعدادات المتجر بنجاح");
      router.refresh();
    } catch {
      toast.error("حدث خطأ غير متوقع");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Right Side: Primary configurations & Logo */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* General Config */}
          <div className="glass-card p-6 space-y-4">
            <h2 className="text-base font-cairo font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
              <Store className="h-4 w-4 text-primary" />
              البيانات الأساسية للمتجر
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Store Name */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-muted-foreground">
                  اسم المتجر <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  className={cn(
                    "w-full px-4 py-2.5 rounded-xl bg-input border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all",
                    errors.name ? "border-destructive" : "border-border"
                  )}
                  {...register("name")}
                />
                {errors.name && <p className="text-destructive text-xs mt-0.5">{errors.name.message}</p>}
              </div>

              {/* Description */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-muted-foreground">وصف المتجر</label>
                <textarea
                  rows={4}
                  className={cn(
                    "w-full px-4 py-2.5 rounded-xl bg-input border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all resize-none",
                    errors.description ? "border-destructive" : "border-border"
                  )}
                  {...register("description")}
                />
                {errors.description && <p className="text-destructive text-xs mt-0.5">{errors.description.message}</p>}
              </div>

              {/* Country & Currency */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">الدولة</label>
                <select
                  className="w-full px-4 py-2.5 rounded-xl bg-input border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  {...register("country")}
                >
                  <option value="PS">فلسطين (PS)</option>
                  <option value="JO">الأردن (JO)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">العملة الافتراضية</label>
                <select
                  className="w-full px-4 py-2.5 rounded-xl bg-input border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  {...register("currency")}
                >
                  <option value="ILS">شيكل إسرائيلي (ILS)</option>
                  <option value="JOD">دينار أردني (JOD)</option>
                  <option value="USD">دولار أمريكي (USD)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="glass-card p-6 space-y-4">
            <h2 className="text-base font-cairo font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
              <Phone className="h-4 w-4 text-primary" />
              تفاصيل الاتصال بالمتجر
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">البريد الإلكتروني العام للمتجر</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="email"
                    placeholder="store@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-input border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring font-mono text-left"
                    {...register("email")}
                  />
                </div>
                {errors.email && <p className="text-destructive text-xs mt-0.5">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">رقم الهاتف للعملاء</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="tel"
                    placeholder="+970 599 000 000"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-input border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring font-mono text-left"
                    {...register("phone")}
                  />
                </div>
                {errors.phone && <p className="text-destructive text-xs mt-0.5">{errors.phone.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">المدينة</label>
                <input
                  type="text"
                  placeholder="مثال: غزة، نابلس، رام الله"
                  className="w-full px-4 py-2.5 rounded-xl bg-input border border-border text-foreground text-sm focus:outline-none"
                  {...register("city")}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">العنوان التفصيلي</label>
                <input
                  type="text"
                  placeholder="الشارع، البناية..."
                  className="w-full px-4 py-2.5 rounded-xl bg-input border border-border text-foreground text-sm focus:outline-none"
                  {...register("address")}
                />
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="glass-card p-6 space-y-4">
            <h2 className="text-base font-cairo font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
              <Globe className="h-4 w-4 text-primary" />
              روابط شبكات التواصل الاجتماعي
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">رابط إنستغرام</label>
                <div className="relative">
                  <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="https://instagram.com/yourstore"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-input border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring font-mono text-left"
                    {...register("social_links.instagram")}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">رابط فيسبوك</label>
                <div className="relative">
                  <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="https://facebook.com/yourstore"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-input border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring font-mono text-left"
                    {...register("social_links.facebook")}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">رقم واتساب للتواصل السريع</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600" />
                  <input
                    type="text"
                    placeholder="970599000000"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-input border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring font-mono text-left"
                    {...register("whatsapp")}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">رابط تيك توك</label>
                <input
                  type="text"
                  placeholder="https://tiktok.com/@yourstore"
                  className="w-full px-4 py-2.5 rounded-xl bg-input border border-border text-foreground text-sm focus:outline-none font-mono text-left"
                  {...register("social_links.tiktok")}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Left Side: Logo Upload & Maintenance Mode */}
        <div className="space-y-6">
          
          {/* Logo Card */}
          <div className="glass-card p-6 space-y-4 text-center">
            <h3 className="text-sm font-cairo font-bold text-foreground border-b border-border pb-3 text-right">
              شعار المتجر
            </h3>

            <div className="relative w-32 h-32 mx-auto rounded-2xl bg-sidebar/50 border border-border overflow-hidden flex items-center justify-center">
              {logoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoPreview}
                  alt="شعار المتجر"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Store className="h-10 w-10 text-muted-foreground/50" />
              )}

              {logoUploading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              )}
            </div>

            <div className="relative">
              <input
                type="file"
                id="logo-upload-input"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
                disabled={logoUploading}
              />
              <label
                htmlFor="logo-upload-input"
                className="btn-secondary text-xs px-4 py-2 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Upload className="h-3.5 w-3.5" />
                تغيير الشعار
              </label>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
              JPG, PNG, WebP بحد أقصى 5 ميغابايت
            </p>
          </div>

          {/* Cover Image Card */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-sm font-cairo font-bold text-foreground border-b border-border pb-3 text-right flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-primary" />
              صورة غلاف المتجر
            </h3>

            <div className="relative w-full h-28 rounded-xl bg-sidebar/50 border border-border overflow-hidden flex items-center justify-center">
              {coverPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={coverPreview}
                  alt="غلاف المتجر"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center space-y-1">
                  <ImageIcon className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                  <p className="text-[10px] text-muted-foreground">لا توجد صورة غلاف</p>
                </div>
              )}

              {coverUploading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              )}
            </div>

            <div className="relative">
              <input
                type="file"
                id="cover-upload-input"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleCoverUpload}
                className="hidden"
                disabled={coverUploading}
              />
              <label
                htmlFor="cover-upload-input"
                className="btn-secondary text-xs px-4 py-2 flex items-center justify-center gap-1.5 cursor-pointer w-full"
              >
                <Upload className="h-3.5 w-3.5" />
                {coverPreview ? "تغيير صورة الغلاف" : "رفع صورة الغلاف"}
              </label>
            </div>
            <p className="text-[10px] text-muted-foreground">
              JPG, PNG, WebP — مقاس مقترح: 1200×400 بكسل، بحد أقصى 5 ميغابايت
            </p>
          </div>

          {/* Shipping Configuration */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-sm font-cairo font-bold text-foreground border-b border-border pb-3 flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" />
              إعداد الشحن
            </h3>

            <div className="flex items-center justify-between p-3 rounded-xl bg-sidebar/30 border border-border">
              <div className="text-right">
                <p className="text-xs font-semibold text-foreground">المتجر يشحن منتجاته</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {watch("requires_shipping") ? "يُطلب من العميل اختيار طريقة شحن عند الطلب" : "لا يوجد شحن — مناسب للمنتجات الرقمية أو الخدمات"}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none ms-4">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={watch("requires_shipping")}
                  onChange={(e) => setValue("requires_shipping", e.target.checked)}
                />
                <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
              </label>
            </div>
          </div>

          {/* Maintenance Mode Card */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-sm font-cairo font-bold text-foreground border-b border-border pb-3">
              حالة تشغيل المتجر
            </h3>

            <div className="flex items-center justify-between p-3 rounded-xl bg-sidebar/30 border border-border">
              <div>
                <p className="text-xs font-semibold text-foreground">نمط الصيانة</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  إخفاء واجهة المتجر عن الزوار مؤقتاً
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={isMaintenance}
                  onChange={(e) => setValue("is_maintenance", e.target.checked)}
                />
                <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
              </label>
            </div>

            {isMaintenance ? (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs flex gap-2">
                <Settings className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  المتجر تحت الصيانة حالياً. سيرى العملاء صفحة اعتذار عند محاولة تصفح متجرك.
                </span>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex gap-2">
                <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>المتجر نشط ويستقبل الزوار والطلبات بشكل طبيعي.</span>
              </div>
            )}
          </div>

          {/* SEO Metadata Config */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-sm font-cairo font-bold text-foreground border-b border-border pb-3">
              محركات البحث (SEO)
            </h3>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground">عنوان الصفحة الرئيسية (SEO Title)</label>
                <input
                  type="text"
                  placeholder="عنوان مخصص للظهور في محركات البحث"
                  className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground text-xs focus:outline-none"
                  {...register("meta_title")}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground">وصف الصفحة (SEO Description)</label>
                <textarea
                  rows={3}
                  placeholder="وصف مختصر للمتجر للظهور في محركات البحث"
                  className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground text-xs focus:outline-none resize-none"
                  {...register("meta_description")}
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            className="w-full btn-brand py-3 rounded-xl flex items-center justify-center gap-2 font-cairo text-sm cursor-pointer"
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            حفظ إعدادات المتجر
          </button>

        </div>
      </div>
    </form>
  );
}
