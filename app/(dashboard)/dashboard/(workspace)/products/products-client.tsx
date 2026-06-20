// ============================================================
// Saba Store — Products Client Component
// ============================================================
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Loader2,
  Eye,
  EyeOff,
  AlertTriangle,
  Image as ImageIcon,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { createProduct, updateProduct, deleteProduct, uploadProductImage, deleteProductImage, getProductImages } from "@/actions/products";
import { generateAiContent } from "@/actions/ai";
import { productSchema, type ProductInput } from "@/lib/validations/product";
import { cn, formatCurrency } from "@/lib/utils";

interface ProductsClientProps {
  initialProducts: any[];
  categories: any[];
  store: any;
  initialError: string | null;
}

export function ProductsClient({
  initialProducts,
  categories,
  store,
  initialError,
}: ProductsClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<any | null>(null);
  const [upgradeAlertOpen, setUpgradeAlertOpen] = useState(false);

  // Product image states (edit mode)
  const [productImages, setProductImages] = useState<{ id: string; url: string; alt_text: string | null; is_primary: boolean }[]>([]);
  const [imageUploading, setImageUploading] = useState(false);

  // AI generation states
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiToolType, setAiToolType] = useState<string>("");
  const [aiTargetField, setAiTargetField] = useState<string>("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiResult, setAiResult] = useState("");

  // Form setup
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState,
  } = useForm<ProductInput>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      short_description: "",
      price: 0,
      compare_price: null,
      sku: "",
      stock_quantity: 1,
      category_id: "",
      is_active: true,
      is_featured: false,
      meta_title: "",
      meta_description: "",
    },
  });

  const { errors, isSubmitting } = formState as any;
  const selectedProductType = watch("product_type" as any) as string;

  const pkg = store?.packages;
  const maxProducts = pkg?.max_products ?? null;
  const productCount = initialProducts.length;
  const isLimitReached = maxProducts !== null && productCount >= maxProducts;

  // Auto-generate slug from name (English characters only)
  // If the name is Arabic and produces an empty slug, leave the field untouched
  const handleNameChange = (val: string) => {
    if (!editingProduct) {
      const base = val
        .toLowerCase()
        .replace(/[^a-zA-Z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
      if (base) {
        setValue("slug", base, { shouldValidate: true });
      }
    }
  };

  // Open add modal
  const handleOpenAdd = () => {
    if (isLimitReached) {
      setUpgradeAlertOpen(true);
      return;
    }
    reset({
      name: "",
      slug: "",
      description: "",
      short_description: "",
      price: 0,
      compare_price: null,
      sku: "",
      stock_quantity: 1,
      category_id: "",
      is_active: true,
      is_featured: false,
      product_type: "physical",
      subscription_duration_value: null,
      subscription_duration_unit: null,
      meta_title: "",
      meta_description: "",
    });
    setProductImages([]);
    setEditingProduct(null);
    setModalOpen(true);
  };

  // Open edit modal
  const handleOpenEdit = (product: any) => {
    reset({
      name: product.name,
      slug: product.slug,
      description: product.description ?? "",
      short_description: product.short_description ?? "",
      price: product.price,
      compare_price: product.compare_price ?? null,
      sku: product.sku ?? "",
      stock_quantity: product.stock_quantity,
      category_id: product.category_id ?? "",
      is_active: product.is_active,
      is_featured: product.is_featured,
      product_type: product.product_type ?? "physical",
      subscription_duration_value: product.subscription_duration_value ?? null,
      subscription_duration_unit: product.subscription_duration_unit ?? null,
      meta_title: product.meta_title ?? "",
      meta_description: product.meta_description ?? "",
    });
    setEditingProduct(product);
    setModalOpen(true);
    // Load images for this product
    getProductImages(product.id).then(({ data }) => {
      setProductImages(data ?? []);
    });
  };

  // Form submit
  const onSubmit = async (data: ProductInput) => {
    try {
      // Map category empty string back to null
      const formattedData = {
        ...data,
        category_id: data.category_id || null,
        compare_price: data.compare_price || null,
      };

      console.log("[ProductForm] Submitting payload:", formattedData);

      let res;
      if (editingProduct) {
        res = await updateProduct(editingProduct.id, formattedData as any);
      } else {
        res = await createProduct(formattedData as any);
      }

      if (res.error) {
        console.error("[ProductForm] Server returned error:", res.error);
        toast.error(res.error, { duration: 8000 });
        return;
      }

      toast.success(editingProduct ? "تم تعديل المنتج بنجاح" : "تم إضافة المنتج بنجاح");
      setModalOpen(false);
      reset();
      router.refresh();
    } catch (err) {
      console.error("[ProductForm] Unexpected submit error:", err);
      toast.error(`حدث خطأ غير متوقع: ${err instanceof Error ? err.message : String(err)}`, { duration: 8000 });
    }
  };

  // Handle delete
  const handleDeleteClick = (product: any) => {
    setDeletingProduct(product);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingProduct) return;
    try {
      const res = await deleteProduct(deletingProduct.id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("تم حذف المنتج بنجاح");
        router.refresh();
      }
    } catch {
      toast.error("فشل حذف المنتج");
    } finally {
      setDeleteConfirmOpen(false);
      setDeletingProduct(null);
    }
  };

  // Product image upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingProduct) return;
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("حجم الصورة كبير جداً (الحد الأقصى 5 ميجابايت)"); return; }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { toast.error("صيغة غير مدعومة — JPG, PNG, WebP فقط"); return; }

    setImageUploading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      const res = await uploadProductImage(editingProduct.id, base64, file.name, file.type);
      if (res.error) { toast.error(res.error); return; }
      setProductImages((prev) => [...prev, { id: res.data!.id, url: res.data!.url, alt_text: null, is_primary: prev.length === 0 }]);
      toast.success("تم رفع الصورة بنجاح");
    } catch { toast.error("فشل رفع الصورة"); }
    finally { setImageUploading(false); e.target.value = ""; }
  };

  // Product image delete handler
  const handleImageDelete = async (imageId: string) => {
    const res = await deleteProductImage(imageId);
    if (res.error) { toast.error(res.error); return; }
    setProductImages((prev) => prev.filter((img) => img.id !== imageId));
    toast.success("تم حذف الصورة");
  };

  // Filters
  const filteredProducts = initialProducts.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.slug.toLowerCase().includes(search.toLowerCase()) ||
      (product.sku && product.sku.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory = categoryFilter === "all" || product.category_id === categoryFilter;

    let matchesStatus = true;
    if (statusFilter === "active") {
      matchesStatus = product.is_active && product.stock_quantity > 0;
    } else if (statusFilter === "hidden") {
      matchesStatus = !product.is_active;
    } else if (statusFilter === "out_of_stock") {
      matchesStatus = product.is_active && product.stock_quantity === 0;
    }

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Product Limit Warning */}
      {maxProducts !== null && (
        <div
          className={cn(
            "p-4 rounded-2xl flex items-center justify-between gap-4 border text-sm",
            isLimitReached
              ? "bg-red-50 border-red-200 text-red-700"
              : productCount / maxProducts > 0.8
              ? "bg-amber-50 border-amber-200 text-amber-700"
              : "bg-primary/10 border-primary/20 text-primary"
          )}
        >
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-cairo font-semibold">
                حدود المنتجات في باقة {pkg?.name}:{" "}
                <span className="font-bold font-numbers">{productCount}</span> من{" "}
                <span className="font-bold font-numbers">{maxProducts}</span> منتج مستخدم.
              </p>
              {isLimitReached && (
                <p className="text-xs text-red-600/80 mt-0.5">
                  لقد وصلت للحد الأقصى، يرجى ترقية باقتك لإضافة المزيد من المنتجات.
                </p>
              )}
            </div>
          </div>
          {isLimitReached && (
            <button
              onClick={() => setUpgradeAlertOpen(true)}
              className="bg-red-500 hover:bg-red-600 text-white font-cairo font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all cursor-pointer shrink-0"
            >
              ترقية الباقة
            </button>
          )}
        </div>
      )}

      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 glass p-3 sm:p-4 rounded-2xl">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:flex-1">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="ابحث عن منتج بالاسم أو SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-4 pr-10 py-2 rounded-xl bg-input border border-border focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm transition-all"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-input border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">كل التصنيفات</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-input border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">كل الحالات</option>
              <option value="active">نشط</option>
              <option value="hidden">مخفي</option>
              <option value="out_of_stock">نفد المخزون</option>
            </select>
          </div>
        </div>

        {/* Add Button */}
        <button
          onClick={handleOpenAdd}
          data-testid="add-product-btn"
          className="btn-brand text-sm px-4 py-2 flex items-center gap-2 w-full md:w-auto justify-center cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          إضافة منتج جديد
        </button>
      </div>

      {initialError && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
          {initialError}
        </div>
      )}

      {/* Products Table */}
      {filteredProducts.length === 0 ? (
        <div className="glass-card py-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto text-primary">
            <Package className="h-8 w-8" />
          </div>
          <div>
            <p className="text-base font-cairo font-semibold text-foreground">
              لا توجد منتجات تطابق البحث
            </p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
              جرب تغيير خيارات الفلترة أو ابحث بكلمات أخرى.
            </p>
          </div>
        </div>
      ) : (
        <div className="glass overflow-hidden rounded-2xl border border-border">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-border bg-sidebar/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="px-6 py-4">المنتج</th>
                  <th className="px-6 py-4">التصنيف</th>
                  <th className="px-6 py-4">السعر</th>
                  <th className="px-6 py-4">المخزون</th>
                  <th className="px-6 py-4">الحالة</th>
                  <th className="px-6 py-4 text-left">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {filteredProducts.map((product) => {
                  // Determine status display
                  let statusText = "نشط";
                  let statusClass = "text-emerald-700 bg-emerald-50";
                  if (!product.is_active) {
                    statusText = "مخفي";
                    statusClass = "text-muted-foreground bg-muted/40";
                  } else if (product.stock_quantity === 0) {
                    statusText = "نفد المخزون";
                    statusClass = "text-red-700 bg-red-50";
                  }

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-sidebar-accent/30 transition-colors group"
                    >
                      <td className="px-6 py-4 font-medium text-foreground">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0 border border-border">
                            <ImageIcon className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground flex items-center gap-1.5">
                              {product.name}
                              {product.is_featured && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  مميز
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono mt-0.5">
                              SKU: {product.sku || "—"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {product.categories?.name ?? "—"}
                      </td>
                      <td className="px-6 py-4 font-mono font-semibold text-foreground text-sm">
                        {formatCurrency(product.price, store?.currency ?? "ILS")}
                        {product.compare_price && (
                          <span className="text-xs text-muted-foreground line-through mr-2 font-normal">
                            {formatCurrency(product.compare_price, store?.currency ?? "ILS")}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            "font-mono font-semibold text-xs px-2 py-1 rounded-md",
                            product.stock_quantity === 0
                              ? "bg-red-50 text-red-700"
                              : product.stock_quantity < 5
                              ? "bg-amber-50 text-amber-700"
                              : "bg-primary/10 text-primary"
                          )}
                        >
                          {product.stock_quantity === 0 ? "0 (نفد)" : `${product.stock_quantity} وحدات`}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn("inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium", statusClass)}>
                          {statusText}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-left">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(product)}
                            className="p-2 rounded-lg hover:bg-sidebar-accent hover:text-foreground text-muted-foreground transition-colors cursor-pointer"
                            title="تعديل"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(product)}
                            className="p-2 rounded-lg hover:bg-destructive/20 hover:text-destructive text-muted-foreground transition-colors cursor-pointer"
                            title="حذف"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── CREATE / EDIT DIALOG ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          />
          <div className="relative w-full max-w-2xl bg-card border border-border p-6 rounded-2xl shadow-brand-lg animate-scale-in text-right max-h-[90vh] overflow-y-auto no-scrollbar">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute left-4 top-4 p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="text-lg font-cairo font-bold text-foreground mb-4">
              {editingProduct ? "تعديل منتج" : "إضافة منتج جديد"}
            </h3>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Product Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    اسم المنتج <span className="text-destructive">*</span>
                  </label>
                  <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="مثال: قميص قطني فاخر"
                    className={cn(
                      "flex-1 px-4 py-2.5 rounded-xl bg-input border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all",
                      errors.name ? "border-destructive" : "border-border"
                    )}
                    {...register("name", {
                      onChange: (e) => handleNameChange(e.target.value),
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setAiToolType("product_name");
                      setAiTargetField("name");
                      setAiResult("");
                      setAiModalOpen(true);
                    }}
                    className="shrink-0 w-9 h-9 rounded-xl bg-violet-50 text-violet-600 hover:bg-violet-100 border border-violet-200 flex items-center justify-center transition-colors cursor-pointer self-start mt-0.5"
                    title="توليد بالذكاء الاصطناعي"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                  </button>
                  </div>
                  {errors.name && <p className="text-destructive text-xs mt-0.5">{errors.name.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    رابط المنتج (Slug) <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: cotton-shirt"
                    className={cn(
                      "w-full px-4 py-2.5 rounded-xl bg-input border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all font-mono",
                      errors.slug ? "border-destructive" : "border-border"
                    )}
                    {...register("slug")}
                  />
                  {errors.slug && <p className="text-destructive text-xs mt-0.5">{errors.slug.message}</p>}
                </div>
              </div>

              {/* Price & Quantities */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    السعر الحالي ({store?.currency}) <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 rounded-xl bg-input border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all font-mono"
                    {...register("price")}
                  />
                  {errors.price && <p className="text-destructive text-xs mt-0.5">{errors.price.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">السعر القديم (للتخفيضات)</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 rounded-xl bg-input border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all font-mono"
                    {...register("compare_price")}
                  />
                  {errors.compare_price && <p className="text-destructive text-xs mt-0.5">{errors.compare_price.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    المخزون المتوفر <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="number"
                    className="w-full px-4 py-2.5 rounded-xl bg-input border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all font-mono"
                    {...register("stock_quantity")}
                  />
                  {errors.stock_quantity && <p className="text-destructive text-xs mt-0.5">{errors.stock_quantity.message}</p>}
                </div>
              </div>

              {/* Category & SKU */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">التصنيف</label>
                  <select
                    className="w-full px-4 py-2.5 rounded-xl bg-input border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                    {...register("category_id")}
                  >
                    <option value="">لا يوجد تصنيف</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {errors.category_id && <p className="text-destructive text-xs mt-0.5">{errors.category_id.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">رمز الـ SKU (رمز المنتج)</label>
                  <input
                    type="text"
                    placeholder="مثال: SHRT-COT-BLU"
                    className="w-full px-4 py-2.5 rounded-xl bg-input border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all font-mono"
                    {...register("sku")}
                  />
                  {errors.sku && <p className="text-destructive text-xs mt-0.5">{errors.sku.message}</p>}
                </div>
              </div>

              {/* Descriptions */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">الوصف القصير</label>
                <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="وصف سريع يظهر تحت اسم المنتج..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-input border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                  {...register("short_description")}
                />
                <button
                  type="button"
                  onClick={() => {
                    setAiToolType("product_description");
                    setAiTargetField("short_description");
                    setAiResult("");
                    setAiModalOpen(true);
                  }}
                  className="shrink-0 w-9 h-9 rounded-xl bg-violet-50 text-violet-600 hover:bg-violet-100 border border-violet-200 flex items-center justify-center transition-colors cursor-pointer self-start mt-0.5"
                  title="توليد بالذكاء الاصطناعي"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                </button>
                </div>
                {errors.short_description && <p className="text-destructive text-xs mt-0.5">{errors.short_description.message}</p>}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-muted-foreground">الوصف الكامل للمنتج</label>
                <button
                  type="button"
                  onClick={() => {
                    setAiToolType("product_description");
                    setAiTargetField("description");
                    setAiResult("");
                    setAiModalOpen(true);
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-violet-50 text-violet-600 hover:bg-violet-100 border border-violet-200 transition-colors cursor-pointer text-[10px] font-medium"
                >
                  <Sparkles className="h-3 w-3" />
                  توليد AI
                </button>
                </div>
                <textarea
                  rows={4}
                  placeholder="اكتب مواصفات وتفاصيل منتجك هنا..."
                  className="w-full px-4 py-2.5 rounded-xl bg-input border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all resize-none"
                  {...register("description")}
                />
                {errors.description && <p className="text-destructive text-xs mt-0.5">{errors.description.message}</p>}
              </div>

              {/* Product Type Selector */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">نوع المنتج</label>
                  <select
                    className="w-full px-4 py-2.5 rounded-xl bg-input border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                    {...register("product_type" as any)}
                  >
                    <option value="physical">منتج مادي (يُشحن)</option>
                    <option value="digital">منتج رقمي (تحميل)</option>
                    <option value="subscription">اشتراك دوري</option>
                    <option value="service">خدمة</option>
                  </select>
                </div>

                {/* Subscription Duration — visible only for subscription type */}
                {selectedProductType === "subscription" && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">مدة الاشتراك</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min={1}
                        placeholder="مثال: 1"
                        className="w-20 px-3 py-2.5 rounded-xl bg-input border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring font-mono"
                        {...register("subscription_duration_value" as any)}
                      />
                      <select
                        className="flex-1 px-3 py-2.5 rounded-xl bg-input border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        {...register("subscription_duration_unit" as any)}
                      >
                        <option value="day">يوم</option>
                        <option value="week">أسبوع</option>
                        <option value="month">شهر</option>
                        <option value="year">سنة</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Product Images */}
              <div className="space-y-2 border border-dashed border-border rounded-xl p-4 bg-sidebar/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                    <ImageIcon className="h-4 w-4" />
                    صور المنتج
                  </div>
                  {editingProduct && (
                    <label
                      htmlFor="product-image-input"
                      className={cn(
                        "flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer",
                        imageUploading && "opacity-50 pointer-events-none"
                      )}
                    >
                      {imageUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                      رفع صورة
                    </label>
                  )}
                  <input
                    id="product-image-input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={imageUploading}
                  />
                </div>

                {editingProduct ? (
                  productImages.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {productImages.map((img) => (
                        <div key={img.id} className="relative group aspect-square rounded-lg overflow-hidden border border-border bg-muted">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img.url} alt={img.alt_text ?? "صورة المنتج"} className="w-full h-full object-cover" />
                          {img.is_primary && (
                            <span className="absolute top-1 right-1 text-[8px] bg-primary text-white px-1 py-0.5 rounded font-bold">رئيسية</span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleImageDelete(img.id)}
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      {productImages.length < 8 && (
                        <label htmlFor="product-image-input" className="aspect-square rounded-lg border border-dashed border-border bg-muted/30 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                          <Plus className="h-4 w-4 text-muted-foreground" />
                        </label>
                      )}
                    </div>
                  ) : (
                    <div className="py-6 text-center">
                      <p className="text-xs text-muted-foreground">لا توجد صور بعد — ارفع صورة أعلاه</p>
                    </div>
                  )
                ) : (
                  <p className="text-[10px] text-muted-foreground/60 py-2 text-center">
                    احفظ المنتج أولاً ثم عُد لتعديله لرفع الصور
                  </p>
                )}
              </div>

              {/* Status and Flags */}
              <div className="flex flex-wrap items-center gap-6 p-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded text-primary focus:ring-primary bg-input border-border"
                    {...register("is_active")}
                  />
                  <span className="text-xs font-semibold text-foreground">عرض المنتج في المتجر (نشط)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded text-primary focus:ring-primary bg-input border-border"
                    {...register("is_featured")}
                  />
                  <span className="text-xs font-semibold text-foreground">تثبيت في الواجهة (منتج مميز)</span>
                </label>
              </div>

              {/* SEO Dropdown structure */}
              <details className="group border border-border rounded-xl">
                <summary className="flex items-center justify-between p-3 text-xs font-semibold text-muted-foreground cursor-pointer select-none">
                  <span>إعدادات تحسين محركات البحث (SEO) اختياري</span>
                  <HelpCircle className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" />
                </summary>
                <div className="p-3 border-t border-border space-y-3 bg-sidebar/10">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-muted-foreground">عنوان SEO (Meta Title)</label>
                    <button
                      type="button"
                      onClick={() => {
                        setAiToolType("product_seo_title");
                        setAiTargetField("meta_title");
                        setAiResult("");
                        setAiModalOpen(true);
                      }}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-violet-50 text-violet-600 hover:bg-violet-100 border border-violet-200 transition-colors cursor-pointer text-[10px] font-medium"
                    >
                      <Sparkles className="h-2.5 w-2.5" />
                      AI
                    </button>
                    </div>
                    <input
                      type="text"
                      placeholder="عنوان مخصص لنتائج البحث..."
                      className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                      {...register("meta_title")}
                    />
                    {errors.meta_title && <p className="text-destructive text-xs mt-0.5">{errors.meta_title.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-muted-foreground">وصف SEO (Meta Description)</label>
                    <button
                      type="button"
                      onClick={() => {
                        setAiToolType("product_seo_description");
                        setAiTargetField("meta_description");
                        setAiResult("");
                        setAiModalOpen(true);
                      }}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-violet-50 text-violet-600 hover:bg-violet-100 border border-violet-200 transition-colors cursor-pointer text-[10px] font-medium"
                    >
                      <Sparkles className="h-2.5 w-2.5" />
                      AI
                    </button>
                    </div>
                    <textarea
                      rows={2}
                      placeholder="وصف مختصر يظهر في جوجل..."
                      className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all resize-none"
                      {...register("meta_description")}
                    />
                    {errors.meta_description && <p className="text-destructive text-xs mt-0.5">{errors.meta_description.message}</p>}
                  </div>
                </div>
              </details>

              {/* Footer buttons */}
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
                  حفظ المنتج
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── UPGRADE NOTIFICATION DIALOG ── */}
      {upgradeAlertOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setUpgradeAlertOpen(false)}
          />
          <div className="relative w-full max-w-md bg-card border border-border p-6 rounded-2xl shadow-brand-lg animate-scale-in text-right">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto text-red-500 mb-4">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-cairo font-bold text-foreground mb-2 text-center">
              تجاوزت الحد المسموح به للمنتجات
            </h3>
            <p className="text-sm text-muted-foreground mb-6 text-center leading-relaxed">
              باقتك الحالية <span className="text-primary font-bold">"{pkg?.name}"</span> تسمح لك بإضافة ما يصل إلى{" "}
              <span className="font-bold font-numbers">{maxProducts}</span> منتج فقط.
              <br />
              يرجى الترقية إلى باقة أعلى للاستمرار في إضافة المنتجات والوصول لميزات حصرية.
            </p>

            <div className="flex items-center justify-center gap-3 pt-4 border-t border-border">
              <button
                onClick={() => setUpgradeAlertOpen(false)}
                className="btn-secondary text-sm px-4 py-2 cursor-pointer"
              >
                إغلاق التنبيه
              </button>
              <button
                onClick={() => {
                  setUpgradeAlertOpen(false);
                  router.push("/dashboard/subscription");
                }}
                className="btn-brand text-sm px-5 py-2 cursor-pointer"
              >
                ترقية الآن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRMATION DIALOG ── */}
      {deleteConfirmOpen && deletingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDeleteConfirmOpen(false)}
          />
          <div className="relative w-full max-w-md bg-card border border-border p-6 rounded-2xl shadow-brand-lg animate-scale-in text-right">
            <h3 className="text-lg font-cairo font-bold text-foreground mb-2">
              تأكيد حذف المنتج
            </h3>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              هل أنت متأكد من حذف المنتج{" "}
              <span className="text-foreground font-semibold">"{deletingProduct.name}"</span>؟
              <br />
              سيؤدي هذا الإجراء لحذف جميع سجلات هذا المنتج نهائياً من متجرك.
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
                حذف المنتج
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── AI GENERATION MODAL (Product Fields) ── */}
      {aiModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setAiModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-card border border-border p-6 rounded-2xl shadow-brand-lg animate-scale-in text-right">
            <button
              onClick={() => setAiModalOpen(false)}
              className="absolute left-4 top-4 p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-violet-600" />
              </div>
              <div>
                <h3 className="text-sm font-cairo font-bold text-foreground">توليد بالذكاء الاصطناعي</h3>
                <p className="text-[10px] text-muted-foreground">سيتم توليد محتوى مقترح — يمكنك اعتماده أو تجاهله</p>
              </div>
            </div>

            {!aiResult ? (
              <button
                onClick={async () => {
                  setAiGenerating(true);
                  try {
                    const productName = watch("name") || "منتج";
                    const input: Record<string, string> = {
                      product_name: productName,
                      store_name: store?.name || "",
                    };
                    if (aiToolType === "product_name") {
                      input.category = "";
                    }
                    const res = await generateAiContent(aiToolType, input);
                    if (res.error) {
                      toast.error(res.error);
                    } else if (res.data) {
                      setAiResult(res.data.text);
                    }
                  } catch {
                    toast.error("فشل التوليد");
                  } finally {
                    setAiGenerating(false);
                  }
                }}
                disabled={aiGenerating}
                className={cn(
                  "w-full py-3 rounded-xl font-cairo font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer",
                  aiGenerating
                    ? "bg-violet-50 text-violet-500 cursor-wait"
                    : "bg-gradient-to-l from-violet-600 to-primary text-white shadow-brand hover:shadow-brand-lg"
                )}
              >
                {aiGenerating ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> جارٍ التوليد...</>
                ) : (
                  <><Sparkles className="h-4 w-4" /> توليد المحتوى</>
                )}
              </button>
            ) : (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1.5">المحتوى المقترح:</p>
                  <div className="p-3 rounded-xl bg-sidebar/50 border border-primary/20 text-sm text-foreground leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto no-scrollbar">
                    {aiResult}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const currentVal = watch(aiTargetField as any);
                      if (currentVal && currentVal.toString().trim()) {
                        if (!confirm("سيتم استبدال النص الحالي. هل تريد المتابعة؟")) return;
                      }
                      setValue(aiTargetField as any, aiResult, { shouldValidate: true });
                      toast.success("تم اعتماد النص المولّد");
                      setAiModalOpen(false);
                      setAiResult("");
                    }}
                    className="flex-1 btn-brand text-xs py-2 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    اعتمد النص
                  </button>
                  <button
                    type="button"
                    onClick={() => setAiResult("")}
                    className="flex-1 glass text-xs py-2 rounded-xl text-center hover:bg-sidebar-accent transition-colors cursor-pointer font-medium text-muted-foreground"
                  >
                    إعادة التوليد
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
