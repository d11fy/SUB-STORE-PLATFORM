// ============================================================
// Saba Store — Categories Client Component
// ============================================================
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Tag,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Loader2,
  FolderOpen,
  ArrowUpDown,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { createCategory, updateCategory, deleteCategory } from "@/actions/categories";
import { categorySchema, type CategoryInput } from "@/lib/validations/category";
import { cn } from "@/lib/utils";

interface CategoryWithCount {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  products?: { count: number }[] | { count: number } | null;
}

interface CategoriesClientProps {
  initialCategories: CategoryWithCount[];
  initialError: string | null;
}

export function CategoriesClient({
  initialCategories,
  initialError,
}: CategoriesClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "hidden">("all");

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryWithCount | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<CategoryWithCount | null>(null);

  // Form setup
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState,
  } = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema) as any,
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      sort_order: 0,
      is_active: true,
    },
  });

  const { errors, isSubmitting } = formState as any;

  const categoryName = watch("name");

  // Auto-generate slug from name (English characters only)
  // If the name is Arabic and produces an empty slug, leave the field untouched
  const handleNameChange = (val: string) => {
    if (!editingCategory) {
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

  // Open modal for add
  const handleOpenAdd = () => {
    reset({
      name: "",
      slug: "",
      description: "",
      sort_order: 0,
      is_active: true,
    });
    setEditingCategory(null);
    setModalOpen(true);
  };

  // Open modal for edit
  const handleOpenEdit = (category: CategoryWithCount) => {
    reset({
      name: category.name,
      slug: category.slug,
      description: category.description ?? "",
      sort_order: category.sort_order,
      is_active: category.is_active,
    });
    setEditingCategory(category);
    setModalOpen(true);
  };

  // Form submit
  const onSubmit = async (data: CategoryInput) => {
    try {
      let res;
      if (editingCategory) {
        res = await updateCategory(editingCategory.id, data);
      } else {
        res = await createCategory(data);
      }

      if (res.error) {
        toast.error(res.error);
        return;
      }

      toast.success(editingCategory ? "تم تعديل التصنيف بنجاح" : "تم إضافة التصنيف بنجاح");
      setModalOpen(false);
      reset();
      router.refresh();
    } catch {
      toast.error("حدث خطأ غير متوقع");
    }
  };

  // Handle delete
  const handleDeleteClick = (category: CategoryWithCount) => {
    setDeletingCategory(category);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingCategory) return;
    try {
      const res = await deleteCategory(deletingCategory.id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("تم حذف التصنيف بنجاح");
        router.refresh();
      }
    } catch {
      toast.error("فشل حذف التصنيف");
    } finally {
      setDeleteConfirmOpen(false);
      setDeletingCategory(null);
    }
  };

  // Filter categories
  const filteredCategories = initialCategories.filter((category) => {
    const matchesSearch =
      category.name.toLowerCase().includes(search.toLowerCase()) ||
      (category.description && category.description.toLowerCase().includes(search.toLowerCase())) ||
      category.slug.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && category.is_active) ||
      (statusFilter === "hidden" && !category.is_active);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass p-4 rounded-2xl">
        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="ابحث عن تصنيف..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-4 pr-10 py-2 rounded-xl bg-input border border-border focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-input border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">كل الحالات</option>
            <option value="active">نشط</option>
            <option value="hidden">مخفي</option>
          </select>
        </div>

        {/* Add Button */}
        <button
          onClick={handleOpenAdd}
          className="btn-brand text-sm px-4 py-2 flex items-center gap-2 w-full sm:w-auto justify-center cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          إضافة تصنيف جديد
        </button>
      </div>

      {initialError && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
          {initialError}
        </div>
      )}

      {/* Categories Content */}
      {filteredCategories.length === 0 ? (
        <div className="glass-card py-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto text-primary">
            <FolderOpen className="h-8 w-8" />
          </div>
          <div>
            <p className="text-base font-cairo font-semibold text-foreground">
              لا توجد تصنيفات بعد
            </p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
              {search || statusFilter !== "all"
                ? "لا توجد نتائج تطابق بحثك الحالي، جرب إدخال كلمات أخرى."
                : "ابدأ بإضافة أول تصنيف لمتجرك لتنظيم منتجاتك وتسهيل التصفح."}
            </p>
          </div>
          {!search && statusFilter === "all" && (
            <button onClick={handleOpenAdd} className="btn-secondary text-xs px-4 py-2 cursor-pointer">
              إضافة أول تصنيف
            </button>
          )}
        </div>
      ) : (
        <div className="glass overflow-hidden rounded-2xl border border-border">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-border bg-sidebar/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="px-6 py-4">اسم التصنيف</th>
                  <th className="px-6 py-4">الرابط (Slug)</th>
                  <th className="px-6 py-4">الترتيب</th>
                  <th className="px-6 py-4">المنتجات</th>
                  <th className="px-6 py-4">الحالة</th>
                  <th className="px-6 py-4 text-left">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {filteredCategories.map((category) => {
                  const prodCount = Array.isArray(category.products)
                    ? category.products[0]?.count ?? 0
                    : (category.products as any)?.count ?? 0;

                  return (
                    <tr
                      key={category.id}
                      className="hover:bg-sidebar-accent/30 transition-colors group"
                    >
                      <td className="px-6 py-4 font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-primary shrink-0" />
                          <div>
                            <p className="font-semibold">{category.name}</p>
                            {category.description && (
                              <p className="text-xs text-muted-foreground truncate max-w-xs mt-0.5">
                                {category.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground font-mono text-xs">
                        {category.slug}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-foreground">
                        {category.sort_order}
                      </td>
                      <td className="px-6 py-4">
                        <span className="badge-info text-xs font-numbers">
                          {prodCount} {prodCount === 1 ? "منتج" : "منتجات"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {category.is_active ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-medium">
                            <Eye className="h-3 w-3" />
                            نشط
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 px-2.5 py-1 rounded-full font-medium">
                            <EyeOff className="h-3 w-3" />
                            مخفي
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-left">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(category)}
                            className="p-2 rounded-lg hover:bg-sidebar-accent hover:text-foreground text-muted-foreground transition-colors cursor-pointer"
                            title="تعديل"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(category)}
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
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setModalOpen(false)}
          />
          {/* Content */}
          <div className="relative w-full max-w-lg bg-card border border-border p-6 rounded-2xl shadow-brand-lg animate-scale-in text-right">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute left-4 top-4 p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="text-lg font-cairo font-bold text-foreground mb-4">
              {editingCategory ? "تعديل تصنيف" : "إضافة تصنيف جديد"}
            </h3>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">
                  اسم التصنيف <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  placeholder="مثال: ملابس صيفية"
                  className={cn(
                    "w-full px-4 py-2.5 rounded-xl bg-input border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all",
                    errors.name ? "border-destructive" : "border-border"
                  )}
                  {...register("name", {
                    onChange: (e) => handleNameChange(e.target.value),
                  })}
                />
                {errors.name && (
                  <p className="text-destructive text-xs mt-0.5">{errors.name.message}</p>
                )}
              </div>

              {/* Slug */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">
                  رابط التصنيف (Slug) <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  placeholder="مثال: summer-clothes"
                  className={cn(
                    "w-full px-4 py-2.5 rounded-xl bg-input border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all font-mono",
                    errors.slug ? "border-destructive" : "border-border"
                  )}
                  {...register("slug")}
                />
                <p className="text-xs text-muted-foreground/70">
                  سيتم استخدام هذا الرابط لتصفح التصنيف في متجرك (يجب أن يحتوي على حروف إنجليزية صغيرة وأرقام وشرطات فقط).
                </p>
                {errors.slug && (
                  <p className="text-destructive text-xs mt-0.5">{errors.slug.message}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">الوصف</label>
                <textarea
                  rows={3}
                  placeholder="وصف مختصر للتصنيف..."
                  className={cn(
                    "w-full px-4 py-2.5 rounded-xl bg-input border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all resize-none",
                    errors.description ? "border-destructive" : "border-border"
                  )}
                  {...register("description")}
                />
                {errors.description && (
                  <p className="text-destructive text-xs mt-0.5">{errors.description.message}</p>
                )}
              </div>

              {/* Sort Order & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">ترتيب العرض</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2.5 rounded-xl bg-input border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all font-mono"
                    {...register("sort_order")}
                  />
                  {errors.sort_order && (
                    <p className="text-destructive text-xs mt-0.5">{errors.sort_order.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">الحالة في المتجر</label>
                  <select
                    className="w-full px-4 py-2.5 rounded-xl bg-input border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                    {...register("is_active")}
                    onChange={(e) => setValue("is_active", e.target.value === "true")}
                  >
                    <option value="true">نشط (يظهر للعملاء)</option>
                    <option value="false">مخفي</option>
                  </select>
                </div>
              </div>

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
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRMATION DIALOG ── */}
      {deleteConfirmOpen && deletingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDeleteConfirmOpen(false)}
          />
          <div className="relative w-full max-w-md bg-card border border-border p-6 rounded-2xl shadow-brand-lg animate-scale-in text-right">
            <h3 className="text-lg font-cairo font-bold text-foreground mb-2">
              تأكيد حذف التصنيف
            </h3>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              هل أنت متأكد من حذف التصنيف{" "}
              <span className="text-foreground font-semibold">"{deletingCategory.name}"</span>؟
              <br />
              هذا الإجراء نهائي ولا يمكن التراجع عنه.
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
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground text-sm font-semibold px-5 py-2 rounded-xl transition-colors cursor-pointer"
              >
                حذف التصنيف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
