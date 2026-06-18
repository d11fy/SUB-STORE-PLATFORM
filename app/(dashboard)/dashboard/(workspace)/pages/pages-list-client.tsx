"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import {
  Plus,
  FileText,
  Eye,
  Pencil,
  Copy,
  Trash2,
  Globe,
  EyeOff,
} from "lucide-react";
import {
  deleteStorePageAction,
  duplicateStorePageAction,
  publishStorePageAction,
  unpublishStorePageAction,
} from "@/actions/store-pages";
import type { StorePage } from "@/lib/types/database";

interface PagesListClientProps {
  pages: StorePage[];
  storeSlug: string;
  fetchError: string | null;
}

export function PagesListClient({
  pages,
  storeSlug,
  fetchError,
}: PagesListClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = (page: StorePage) => {
    if (!window.confirm(`حذف صفحة "${page.title}"؟ هذا الإجراء لا يمكن التراجع عنه.`)) return;
    startTransition(async () => {
      const res = await deleteStorePageAction(page.id);
      if (res.success) {
        toast.success("تم حذف الصفحة");
        router.refresh();
      } else {
        toast.error(res.error ?? "فشل الحذف");
      }
    });
  };

  const handleDuplicate = (page: StorePage) => {
    startTransition(async () => {
      const res = await duplicateStorePageAction(page.id);
      if (res.id) {
        toast.success("تم تكرار الصفحة كمسودة");
        router.push(`/dashboard/pages/${res.id}/edit`);
      } else {
        toast.error(res.error ?? "فشل التكرار");
      }
    });
  };

  const handlePublish = (page: StorePage) => {
    startTransition(async () => {
      const res = await publishStorePageAction(page.id);
      if (res.success) {
        toast.success("تم نشر الصفحة");
        router.refresh();
      } else {
        toast.error(res.error ?? "فشل النشر");
      }
    });
  };

  const handleUnpublish = (page: StorePage) => {
    startTransition(async () => {
      const res = await unpublishStorePageAction(page.id);
      if (res.success) {
        toast.success("تم إلغاء نشر الصفحة");
        router.refresh();
      } else {
        toast.error(res.error ?? "فشل إلغاء النشر");
      }
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-cairo text-foreground">
            الصفحات
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            أنشئ صفحات مخصصة كـ &quot;من نحن&quot; والأسئلة الشائعة وسياسة الاستبدال
          </p>
        </div>
        <Link
          href="/dashboard/pages/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:bg-primary/90 transition-all shadow-md font-cairo"
        >
          <Plus className="h-4 w-4" />
          إنشاء صفحة
        </Link>
      </div>

      {/* Error */}
      {fetchError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {fetchError}
        </div>
      )}

      {/* Empty State */}
      {!fetchError && pages.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 space-y-4 bg-card border border-border rounded-2xl">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="text-center space-y-1">
            <p className="font-bold text-foreground font-cairo">
              لا توجد صفحات بعد
            </p>
            <p className="text-sm text-muted-foreground">
              أنشئ صفحة &quot;من نحن&quot; أو &quot;تواصل معنا&quot; لمتجرك
            </p>
          </div>
          <Link
            href="/dashboard/pages/new"
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:bg-primary/90 transition-all font-cairo"
          >
            <Plus className="h-4 w-4" />
            إنشاء أول صفحة
          </Link>
        </div>
      )}

      {/* Pages List */}
      {pages.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="divide-y divide-border">
            {pages.map((page) => (
              <div
                key={page.id}
                className="flex items-center gap-4 p-5 hover:bg-muted/30 transition-colors"
              >
                {/* Icon */}
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-primary" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 text-right">
                  <p className="font-bold text-sm text-foreground font-cairo truncate">
                    {page.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate" dir="ltr">
                    /{page.slug}
                  </p>
                </div>

                {/* Status badge */}
                <span
                  className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                    page.status === "published"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  {page.status === "published" ? "منشور" : "مسودة"}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Preview (only when published) */}
                  {page.status === "published" && (
                    <a
                      href={`/store/${storeSlug}/${page.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="معاينة"
                    >
                      <Eye className="h-4 w-4" />
                    </a>
                  )}

                  {/* Edit */}
                  <Link
                    href={`/dashboard/pages/${page.id}/edit`}
                    className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    title="تعديل"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>

                  {/* Publish / Unpublish */}
                  {page.status === "draft" ? (
                    <button
                      onClick={() => handlePublish(page)}
                      disabled={isPending}
                      className="p-2 rounded-lg hover:bg-emerald-50 text-muted-foreground hover:text-emerald-700 transition-colors disabled:opacity-50"
                      title="نشر"
                    >
                      <Globe className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUnpublish(page)}
                      disabled={isPending}
                      className="p-2 rounded-lg hover:bg-amber-50 text-muted-foreground hover:text-amber-700 transition-colors disabled:opacity-50"
                      title="إلغاء النشر"
                    >
                      <EyeOff className="h-4 w-4" />
                    </button>
                  )}

                  {/* Duplicate */}
                  <button
                    onClick={() => handleDuplicate(page)}
                    disabled={isPending}
                    className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                    title="تكرار"
                  >
                    <Copy className="h-4 w-4" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(page)}
                    disabled={isPending}
                    className="p-2 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors disabled:opacity-50"
                    title="حذف"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isPending && (
        <div className="text-center text-sm text-muted-foreground py-2">
          جاري التنفيذ...
        </div>
      )}
    </div>
  );
}
