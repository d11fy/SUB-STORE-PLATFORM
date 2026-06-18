// ============================================================
// Saba Store — Categories Server Actions
// ============================================================
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getMerchantStoreId } from "./store-utils";
import { categorySchema, type CategoryInput } from "@/lib/validations/category";
import type { Category } from "@/lib/types/database";

// ============================================================
// GET ALL CATEGORIES
// ============================================================
export async function getCategories(): Promise<{ data: Category[] | null; error: string | null }> {
  const storeId = await getMerchantStoreId();

  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("store_id", storeId)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) throw error;

    return { data: data as Category[], error: null };
  } catch (err: any) {
    console.error("Error fetching categories:", err);
    return { data: null, error: "فشل جلب التصنيفات" };
  }
}

// ============================================================
// CREATE CATEGORY
// ============================================================
export async function createCategory(
  formData: CategoryInput
): Promise<{ data: Category | null; error: string | null }> {
  try {
    const validated = categorySchema.safeParse(formData);
    if (!validated.success) {
      return { data: null, error: validated.error.issues[0]?.message ?? "بيانات غير صالحة" };
    }

    const storeId = await getMerchantStoreId();
    const supabase = await createClient();

    // Verify slug unique per store_id
    const { data: existingSlug } = await supabase
      .from("categories")
      .select("id")
      .eq("store_id", storeId)
      .eq("slug", validated.data.slug)
      .maybeSingle();

    if (existingSlug) {
      return {
        data: null,
        error: "رابط التصنيف (slug) مستخدم بالفعل في متجرك، يرجى اختيار رابط آخر.",
      };
    }

    // Insert category
    const { data: category, error: insertError } = await supabase
      .from("categories")
      .insert({
        store_id: storeId,
        name: validated.data.name,
        slug: validated.data.slug,
        description: validated.data.description ?? null,
        sort_order: validated.data.sort_order,
        is_active: validated.data.is_active,
        parent_id: null,
        image_url: null,
      })
      .select()
      .single();

    if (insertError || !category) throw insertError;

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/categories");
    revalidatePath("/dashboard/products");
    return { data: category as Category, error: null };
  } catch (err: any) {
    console.error("Error creating category:", err);
    return { data: null, error: "فشل إضافة التصنيف، يرجى المحاولة لاحقاً" };
  }
}

// ============================================================
// UPDATE CATEGORY
// ============================================================
export async function updateCategory(
  categoryId: string,
  formData: CategoryInput
): Promise<{ data: Category | null; error: string | null }> {
  try {
    const validated = categorySchema.safeParse(formData);
    if (!validated.success) {
      return { data: null, error: validated.error.issues[0]?.message ?? "بيانات غير صالحة" };
    }

    const storeId = await getMerchantStoreId();
    const supabase = await createClient();

    // Verify category ownership
    const { data: existingCategory, error: fetchError } = await supabase
      .from("categories")
      .select("id")
      .eq("store_id", storeId)
      .eq("id", categoryId)
      .maybeSingle();

    if (fetchError || !existingCategory) {
      return { data: null, error: "التصنيف غير موجود أو لا تملك صلاحية تعديله" };
    }

    // Verify slug unique if changed
    const { data: existingSlug } = await supabase
      .from("categories")
      .select("id")
      .eq("store_id", storeId)
      .eq("slug", validated.data.slug)
      .neq("id", categoryId)
      .maybeSingle();

    if (existingSlug) {
      return {
        data: null,
        error: "رابط التصنيف (slug) مستخدم بالفعل في متجرك، يرجى اختيار رابط آخر.",
      };
    }

    // Update category
    const { data: category, error: updateError } = await supabase
      .from("categories")
      .update({
        name: validated.data.name,
        slug: validated.data.slug,
        description: validated.data.description ?? null,
        sort_order: validated.data.sort_order,
        is_active: validated.data.is_active,
      })
      .eq("id", categoryId)
      .eq("store_id", storeId)
      .select()
      .single();

    if (updateError || !category) throw updateError;

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/categories");
    revalidatePath("/dashboard/products");
    return { data: category as Category, error: null };
  } catch (err: any) {
    console.error("Error updating category:", err);
    return { data: null, error: "فشل تعديل التصنيف، يرجى المحاولة لاحقاً" };
  }
}

// ============================================================
// DELETE CATEGORY
// ============================================================
export async function deleteCategory(
  categoryId: string
): Promise<{ success: boolean; error: string | null }> {
  const storeId = await getMerchantStoreId();

  try {
    const supabase = await createClient();

    // Check if category contains products
    const { count, error: countError } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("store_id", storeId)
      .eq("category_id", categoryId);

    if (countError) throw countError;

    const productsCount = count ?? 0;
    if (productsCount > 0) {
      return {
        success: false,
        error: `لا يمكن حذف هذا التصنيف لأنه مرتبط بعدد (${productsCount}) من المنتجات. يرجى إزالة الارتباط بالمنتجات أولاً قبل محاولة الحذف.`,
      };
    }

    // Delete category
    const { error: deleteError } = await supabase
      .from("categories")
      .delete()
      .eq("id", categoryId)
      .eq("store_id", storeId);

    if (deleteError) throw deleteError;

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/categories");
    revalidatePath("/dashboard/products");
    return { success: true, error: null };
  } catch (err: any) {
    console.error("Error deleting category:", err);
    return { success: false, error: "فشل حذف التصنيف، يرجى المحاولة لاحقاً" };
  }
}
