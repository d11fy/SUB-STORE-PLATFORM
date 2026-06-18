// ============================================================
// Saba Store — D2 Store Pages Server Actions
// CRUD for custom store pages (About, FAQ, Contact, etc.)
// ============================================================
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getMerchantStoreId } from "./store-utils";
import {
  createPageSchema,
  updatePageSchema,
  RESERVED_SLUGS,
  type CreatePageInput,
  type UpdatePageInput,
} from "@/lib/validations/pages";
import type { Json, Database, StorePage } from "@/lib/types/database";

type StorePageUpdate = Database["public"]["Tables"]["store_pages"]["Update"];

// ── Helper: verify the merchant owns this page ────────────────
async function verifyOwnership(
  pageId: string,
  storeId: string
): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("store_pages")
    .select("id")
    .eq("id", pageId)
    .eq("store_id", storeId)
    .maybeSingle();
  return !!data;
}

// ── Helper: revalidate paths after any change ─────────────────
async function revalidatePagePaths(storeId: string, slug?: string) {
  revalidatePath("/dashboard/pages");
  if (slug) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("stores")
      .select("slug")
      .eq("id", storeId)
      .single();
    if (data?.slug) {
      revalidatePath(`/store/${data.slug}/${slug}`);
    }
  }
}

// ── 1. List pages ─────────────────────────────────────────────
export async function getStorePagesAction(): Promise<{
  pages: StorePage[];
  error: string | null;
}> {
  try {
    const storeId = await getMerchantStoreId();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("store_pages")
      .select("*")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });

    if (error) return { pages: [], error: error.message };
    return { pages: (data as StorePage[]) ?? [], error: null };
  } catch {
    return { pages: [], error: "حدث خطأ أثناء جلب الصفحات" };
  }
}

// ── 2. Get single page ────────────────────────────────────────
export async function getStorePageAction(pageId: string): Promise<{
  page: StorePage | null;
  error: string | null;
}> {
  try {
    if (!pageId) return { page: null, error: "معرّف الصفحة مطلوب" };
    const storeId = await getMerchantStoreId();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("store_pages")
      .select("*")
      .eq("id", pageId)
      .eq("store_id", storeId)
      .maybeSingle();

    if (error) return { page: null, error: error.message };
    if (!data) return { page: null, error: "الصفحة غير موجودة" };
    return { page: data as StorePage, error: null };
  } catch {
    return { page: null, error: "حدث خطأ أثناء جلب الصفحة" };
  }
}

// ── 3. Create page ────────────────────────────────────────────
export async function createStorePageAction(data: CreatePageInput): Promise<{
  id: string | null;
  error: string | null;
}> {
  try {
    const validated = createPageSchema.safeParse(data);
    if (!validated.success) {
      return {
        id: null,
        error: validated.error.issues[0]?.message ?? "بيانات غير صالحة",
      };
    }

    const slug = validated.data.slug;
    if (RESERVED_SLUGS.has(slug)) {
      return { id: null, error: "هذا الـ slug محجوز للنظام" };
    }

    const storeId = await getMerchantStoreId();
    const supabase = await createClient();

    const { data: created, error } = await supabase
      .from("store_pages")
      .insert({
        store_id: storeId,
        title: validated.data.title,
        slug,
        status: "draft",
        sections_config: validated.data.sections_config as unknown as Json,
        meta_title: validated.data.meta_title || null,
        meta_description: validated.data.meta_description || null,
        show_in_header: validated.data.show_in_header ?? false,
        show_in_footer: validated.data.show_in_footer ?? true,
      })
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") {
        return { id: null, error: "هذا الـ slug مستخدم بالفعل في متجرك" };
      }
      return { id: null, error: "فشل إنشاء الصفحة: " + error.message };
    }

    await revalidatePagePaths(storeId);
    return { id: created.id, error: null };
  } catch (err) {
    console.error("createStorePageAction error:", err);
    return { id: null, error: "حدث خطأ غير متوقع" };
  }
}

// ── 4. Update page ────────────────────────────────────────────
export async function updateStorePageAction(
  pageId: string,
  data: UpdatePageInput
): Promise<{ success: boolean; error: string | null }> {
  try {
    if (!pageId) return { success: false, error: "معرّف الصفحة مطلوب" };

    const validated = updatePageSchema.safeParse(data);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message ?? "بيانات غير صالحة",
      };
    }

    const storeId = await getMerchantStoreId();
    const owned = await verifyOwnership(pageId, storeId);
    if (!owned) {
      return { success: false, error: "الصفحة غير موجودة أو غير مصرح بالوصول" };
    }

    if (validated.data.slug && RESERVED_SLUGS.has(validated.data.slug)) {
      return { success: false, error: "هذا الـ slug محجوز للنظام" };
    }

    const payload: Record<string, unknown> = {};
    const v = validated.data;
    if (v.title !== undefined) payload.title = v.title;
    if (v.slug !== undefined) payload.slug = v.slug;
    if (v.status !== undefined) payload.status = v.status;
    if (v.sections_config !== undefined)
      payload.sections_config = v.sections_config as unknown as Json;
    if (v.meta_title !== undefined) payload.meta_title = v.meta_title || null;
    if (v.meta_description !== undefined)
      payload.meta_description = v.meta_description || null;
    if (v.show_in_header !== undefined) payload.show_in_header = v.show_in_header;
    if (v.show_in_footer !== undefined) payload.show_in_footer = v.show_in_footer;

    const supabase = await createClient();
    const { error } = await supabase
      .from("store_pages")
      // payload is built from validated D2 fields only — cast is safe
      .update(payload as unknown as StorePageUpdate)
      .eq("id", pageId)
      .eq("store_id", storeId);

    if (error) {
      if (error.code === "23505") {
        return { success: false, error: "هذا الـ slug مستخدم بالفعل في متجرك" };
      }
      return { success: false, error: "فشل تحديث الصفحة: " + error.message };
    }

    revalidatePath(`/dashboard/pages/${pageId}/edit`);
    await revalidatePagePaths(storeId, v.slug);
    return { success: true, error: null };
  } catch (err) {
    console.error("updateStorePageAction error:", err);
    return { success: false, error: "حدث خطأ غير متوقع" };
  }
}

// ── 5. Delete page ────────────────────────────────────────────
export async function deleteStorePageAction(pageId: string): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    if (!pageId) return { success: false, error: "معرّف الصفحة مطلوب" };

    const storeId = await getMerchantStoreId();
    const owned = await verifyOwnership(pageId, storeId);
    if (!owned) {
      return { success: false, error: "الصفحة غير موجودة أو غير مصرح بالوصول" };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("store_pages")
      .delete()
      .eq("id", pageId)
      .eq("store_id", storeId);

    if (error) return { success: false, error: "فشل حذف الصفحة: " + error.message };

    await revalidatePagePaths(storeId);
    return { success: true, error: null };
  } catch (err) {
    console.error("deleteStorePageAction error:", err);
    return { success: false, error: "حدث خطأ غير متوقع" };
  }
}

// ── 6. Publish page ───────────────────────────────────────────
export async function publishStorePageAction(pageId: string): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    if (!pageId) return { success: false, error: "معرّف الصفحة مطلوب" };

    const storeId = await getMerchantStoreId();
    const owned = await verifyOwnership(pageId, storeId);
    if (!owned) {
      return { success: false, error: "الصفحة غير موجودة أو غير مصرح بالوصول" };
    }

    const supabase = await createClient();

    // Fetch slug BEFORE update so we can revalidate the storefront path
    const { data: pageData } = await supabase
      .from("store_pages")
      .select("slug")
      .eq("id", pageId)
      .eq("store_id", storeId)
      .single();

    const { error } = await supabase
      .from("store_pages")
      .update({ status: "published" })
      .eq("id", pageId)
      .eq("store_id", storeId);

    if (error) return { success: false, error: "فشل نشر الصفحة: " + error.message };

    revalidatePath(`/dashboard/pages/${pageId}/edit`);
    await revalidatePagePaths(storeId, pageData?.slug ?? undefined);
    return { success: true, error: null };
  } catch (err) {
    console.error("publishStorePageAction error:", err);
    return { success: false, error: "حدث خطأ غير متوقع" };
  }
}

// ── 7. Unpublish page ─────────────────────────────────────────
export async function unpublishStorePageAction(pageId: string): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    if (!pageId) return { success: false, error: "معرّف الصفحة مطلوب" };

    const storeId = await getMerchantStoreId();
    const owned = await verifyOwnership(pageId, storeId);
    if (!owned) {
      return { success: false, error: "الصفحة غير موجودة أو غير مصرح بالوصول" };
    }

    const supabase = await createClient();

    // Fetch slug BEFORE update to revalidate the storefront path
    const { data: pageData } = await supabase
      .from("store_pages")
      .select("slug")
      .eq("id", pageId)
      .eq("store_id", storeId)
      .single();

    const { error } = await supabase
      .from("store_pages")
      .update({ status: "draft" })
      .eq("id", pageId)
      .eq("store_id", storeId);

    if (error) return { success: false, error: "فشل إلغاء نشر الصفحة: " + error.message };

    revalidatePath(`/dashboard/pages/${pageId}/edit`);
    await revalidatePagePaths(storeId, pageData?.slug ?? undefined);
    return { success: true, error: null };
  } catch (err) {
    console.error("unpublishStorePageAction error:", err);
    return { success: false, error: "حدث خطأ غير متوقع" };
  }
}

// ── 8. Duplicate page ─────────────────────────────────────────
export async function duplicateStorePageAction(pageId: string): Promise<{
  id: string | null;
  error: string | null;
}> {
  try {
    if (!pageId) return { id: null, error: "معرّف الصفحة مطلوب" };

    const storeId = await getMerchantStoreId();
    const supabase = await createClient();

    const { data: original, error: fetchErr } = await supabase
      .from("store_pages")
      .select("*")
      .eq("id", pageId)
      .eq("store_id", storeId)
      .single();

    if (fetchErr || !original) return { id: null, error: "الصفحة غير موجودة" };

    // Find unique slug — truncate to ensure the total stays within 60 chars
    const maxBase = 52; // leaves room for "-copy" (5) + optional "-N" (2)
    const trimmedSlug =
      original.slug.length > maxBase
        ? original.slug.slice(0, maxBase)
        : original.slug;
    const baseSlug = trimmedSlug + "-copy";
    let newSlug = baseSlug;
    for (let i = 1; i < 10; i++) {
      const { data: existing } = await supabase
        .from("store_pages")
        .select("id")
        .eq("store_id", storeId)
        .eq("slug", newSlug)
        .maybeSingle();
      if (!existing) break;
      newSlug = `${baseSlug}-${i}`;
    }

    const { data: created, error: insertErr } = await supabase
      .from("store_pages")
      .insert({
        store_id: storeId,
        title: original.title + " (نسخة)",
        slug: newSlug,
        status: "draft",
        sections_config: original.sections_config,
        meta_title: original.meta_title,
        meta_description: original.meta_description,
        show_in_header: original.show_in_header,
        show_in_footer: original.show_in_footer,
      })
      .select("id")
      .single();

    if (insertErr) return { id: null, error: "فشل تكرار الصفحة: " + insertErr.message };

    await revalidatePagePaths(storeId);
    return { id: created.id, error: null };
  } catch (err) {
    console.error("duplicateStorePageAction error:", err);
    return { id: null, error: "حدث خطأ غير متوقع" };
  }
}
