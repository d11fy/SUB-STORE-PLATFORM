// ============================================================
// Saba Store — Products Server Actions
// ============================================================
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getMerchantStoreId, getMerchantStoreWithPackage } from "./store-utils";
import { productSchema, type ProductInput } from "@/lib/validations/product";
import type { Product } from "@/lib/types/database";

// ============================================================
// GET ALL PRODUCTS
// ============================================================
export async function getProducts(options?: {
  search?: string;
  categoryId?: string;
  status?: string;
}): Promise<{ data: Product[] | null; error: string | null }> {
  const storeId = await getMerchantStoreId();

  try {
    const supabase = await createClient();

    let query = supabase
      .from("products")
      .select(`*, categories:category_id (*)`)
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });

    if (options?.search) {
      query = query.ilike("name", `%${options.search}%`);
    }

    if (options?.categoryId && options.categoryId !== "all") {
      query = query.eq("category_id", options.categoryId);
    }

    if (options?.status && options.status !== "all") {
      if (options.status === "active") {
        query = query.eq("is_active", true).gt("stock_quantity", 0);
      } else if (options.status === "hidden") {
        query = query.eq("is_active", false);
      } else if (options.status === "out_of_stock") {
        query = query.eq("is_active", true).eq("stock_quantity", 0);
      }
    }

    const { data, error } = await query;
    if (error) throw error;

    return { data: data as any[], error: null };
  } catch (err: any) {
    console.error("Error fetching products:", err);
    return { data: null, error: "فشل جلب المنتجات" };
  }
}

// ============================================================
// CREATE PRODUCT
// ============================================================
export async function createProduct(
  formData: ProductInput
): Promise<{ data: Product | null; error: string | null }> {
  // ── Step 1: Validate with Zod — log ALL issues, not just the first ──
  const validated = productSchema.safeParse(formData);
  if (!validated.success) {
    const issues = validated.error.issues.map((i) => `[${i.path.join(".")}] ${i.message}`);
    console.error("[createProduct] Zod validation failed:", issues);
    return {
      data: null,
      error: issues[0] ?? "بيانات غير صالحة",
    };
  }

  // ── Step 2: Auth + store lookup — outside try so redirect() can propagate ──
  let store: Awaited<ReturnType<typeof getMerchantStoreWithPackage>>;
  try {
    store = await getMerchantStoreWithPackage();
  } catch (err: any) {
    // Rethrow Next.js redirect errors — they must not be swallowed
    if (err?.digest?.startsWith?.("NEXT_REDIRECT")) throw err;
    console.error("[createProduct] getMerchantStoreWithPackage failed:", err?.message ?? err);
    return { data: null, error: "تعذّر التحقق من هوية المتجر — تأكد من تسجيل دخولك" };
  }

  try {
    const supabase = await createClient();

    // ── Step 3: Package product limit check ──
    const maxProducts = store.packages?.max_products ?? null;
    if (maxProducts !== null) {
      const { count, error: countError } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("store_id", store.id);

      if (countError) {
        console.error("[createProduct] Count query error:", countError);
        throw countError;
      }

      const currentCount = count ?? 0;
      if (currentCount >= maxProducts) {
        return {
          data: null,
          error: `لقد وصلت للحد الأقصى لعدد المنتجات المسموح بها في باقتك الحالية (${store.packages?.name}: ${maxProducts} منتج). يرجى ترقية باقتك لإضافة المزيد من المنتجات.`,
        };
      }
    }

    // ── Step 4: Slug uniqueness check ──
    const { data: existingSlug } = await supabase
      .from("products")
      .select("id")
      .eq("store_id", store.id)
      .eq("slug", validated.data.slug)
      .maybeSingle();

    if (existingSlug) {
      return {
        data: null,
        error: "رابط المنتج (slug) مستخدم بالفعل في متجرك، يرجى اختيار رابط آخر.",
      };
    }

    // ── Step 5: Build insert payload + debug log ──
    const insertPayload = {
      store_id: store.id,
      name: validated.data.name,
      slug: validated.data.slug,
      description: validated.data.description ?? null,
      short_description: validated.data.short_description ?? null,
      price: validated.data.price,
      compare_price: typeof validated.data.compare_price === "number" ? validated.data.compare_price : null,
      sku: validated.data.sku ?? null,
      stock_quantity: validated.data.stock_quantity,
      category_id: validated.data.category_id || null,
      is_active: validated.data.is_active,
      is_featured: validated.data.is_featured,
      barcode: null,
      track_inventory: true,
      is_digital: validated.data.product_type === "digital",
      product_type: validated.data.product_type,
      subscription_duration_value: validated.data.subscription_duration_value ?? null,
      subscription_duration_unit: validated.data.subscription_duration_unit ?? null,
      weight: null,
      tags: [] as string[],
      attributes: {} as Record<string, unknown>,
    };

    console.log("[createProduct] INSERT payload:", JSON.stringify(insertPayload, null, 2));

    // ── Step 6: DB insert ──
    const { data: product, error: insertError } = await supabase
      .from("products")
      .insert(insertPayload as any)
      .select()
      .single();

    if (insertError) {
      console.error("[createProduct] DB insert error:", {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
      });
      // Translate common Postgres error codes to Arabic
      if (insertError.code === "23505") {
        return { data: null, error: "رابط المنتج مكرر — يرجى تغيير الـ slug" };
      }
      if (insertError.code === "23503") {
        return { data: null, error: `قيمة مرجعية غير صالحة — تحقق من التصنيف المختار (FK: ${insertError.details})` };
      }
      if (insertError.code === "22P02") {
        return { data: null, error: `قيمة enum غير مقبولة — تحقق من نوع المنتج (${insertError.message})` };
      }
      if (insertError.code === "42501") {
        return { data: null, error: "تم رفض العملية بسبب قواعد الأمان (RLS) — تحقق من سياسات Supabase" };
      }
      return { data: null, error: `خطأ في قاعدة البيانات [${insertError.code ?? "?"}]: ${insertError.message}` };
    }

    if (!product) {
      console.error("[createProduct] Insert returned no data (RLS may be blocking SELECT after INSERT). store_id:", store.id);
      return {
        data: null,
        error: "تم إنشاء المنتج لكن تعذّرت قراءته — تحقق من سياسة RLS على جدول products",
      };
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/products");
    return { data: product as any, error: null };
  } catch (err: any) {
    // Rethrow Next.js redirect errors
    if (err?.digest?.startsWith?.("NEXT_REDIRECT")) throw err;
    const message = err?.message ?? String(err) ?? "خطأ غير معروف";
    console.error("[createProduct] Unexpected error:", { message, code: err?.code, err });
    return { data: null, error: `خطأ غير متوقع أثناء إضافة المنتج: ${message}` };
  }
}

// ============================================================
// UPDATE PRODUCT
// ============================================================
export async function updateProduct(
  productId: string,
  formData: ProductInput
): Promise<{ data: Product | null; error: string | null }> {
  // ── Step 1: Validate ──
  const validated = productSchema.safeParse(formData);
  if (!validated.success) {
    const issues = validated.error.issues.map((i) => `[${i.path.join(".")}] ${i.message}`);
    console.error("[updateProduct] Zod validation failed:", issues);
    return { data: null, error: issues[0] ?? "بيانات غير صالحة" };
  }

  // ── Step 2: Auth outside try so redirect() can propagate ──
  let storeId: string;
  try {
    storeId = await getMerchantStoreId();
  } catch (err: any) {
    if (err?.digest?.startsWith?.("NEXT_REDIRECT")) throw err;
    console.error("[updateProduct] getMerchantStoreId failed:", err?.message ?? err);
    return { data: null, error: "تعذّر التحقق من هوية المتجر" };
  }

  try {
    const supabase = await createClient();

    // Verify product belongs to this store
    const { data: existingProduct, error: fetchError } = await supabase
      .from("products")
      .select("id")
      .eq("store_id", storeId)
      .eq("id", productId)
      .maybeSingle();

    if (fetchError) {
      console.error("[updateProduct] Ownership check error:", fetchError);
      return { data: null, error: `خطأ في التحقق من المنتج: ${fetchError.message}` };
    }
    if (!existingProduct) {
      return { data: null, error: "المنتج غير موجود أو لا تملك صلاحية تعديله" };
    }

    // Slug uniqueness
    const { data: existingSlug } = await supabase
      .from("products")
      .select("id")
      .eq("store_id", storeId)
      .eq("slug", validated.data.slug)
      .neq("id", productId)
      .maybeSingle();

    if (existingSlug) {
      return { data: null, error: "رابط المنتج (slug) مستخدم بالفعل في متجرك، يرجى اختيار رابط آخر." };
    }

    const updatePayload = {
      name: validated.data.name,
      slug: validated.data.slug,
      description: validated.data.description ?? null,
      short_description: validated.data.short_description ?? null,
      price: validated.data.price,
      compare_price: typeof validated.data.compare_price === "number" ? validated.data.compare_price : null,
      sku: validated.data.sku ?? null,
      stock_quantity: validated.data.stock_quantity,
      category_id: validated.data.category_id || null,
      is_active: validated.data.is_active,
      is_featured: validated.data.is_featured,
      is_digital: validated.data.product_type === "digital",
      product_type: validated.data.product_type,
      subscription_duration_value: validated.data.subscription_duration_value ?? null,
      subscription_duration_unit: validated.data.subscription_duration_unit ?? null,
    };

    console.log("[updateProduct] UPDATE payload for", productId, ":", JSON.stringify(updatePayload, null, 2));

    const { data: product, error: updateError } = await supabase
      .from("products")
      .update(updatePayload as any)
      .eq("id", productId)
      .eq("store_id", storeId)
      .select()
      .single();

    if (updateError) {
      console.error("[updateProduct] DB update error:", {
        code: updateError.code,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
      });
      if (updateError.code === "23505") return { data: null, error: "رابط المنتج مكرر — يرجى تغيير الـ slug" };
      if (updateError.code === "42501") return { data: null, error: "تم رفض العملية بسبب قواعد الأمان (RLS)" };
      return { data: null, error: `خطأ في قاعدة البيانات [${updateError.code ?? "?"}]: ${updateError.message}` };
    }

    if (!product) {
      console.error("[updateProduct] Update returned no data. productId:", productId, "storeId:", storeId);
      return { data: null, error: "تم التحديث لكن تعذّرت قراءة المنتج — تحقق من سياسة RLS" };
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/products");
    return { data: product as any, error: null };
  } catch (err: any) {
    if (err?.digest?.startsWith?.("NEXT_REDIRECT")) throw err;
    const message = err?.message ?? String(err) ?? "خطأ غير معروف";
    console.error("[updateProduct] Unexpected error:", { message, err });
    return { data: null, error: `خطأ غير متوقع أثناء تعديل المنتج: ${message}` };
  }
}

// ============================================================
// DELETE PRODUCT
// ============================================================
export async function deleteProduct(
  productId: string
): Promise<{ success: boolean; error: string | null }> {
  const storeId = await getMerchantStoreId();

  try {
    const supabase = await createClient();

    // Verify ownership & delete
    const { error: deleteError } = await supabase
      .from("products")
      .delete()
      .eq("id", productId)
      .eq("store_id", storeId);

    if (deleteError) throw deleteError;

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/products");
    return { success: true, error: null };
  } catch (err: any) {
    console.error("Error deleting product:", err);
    return { success: false, error: "فشل حذف المنتج، يرجى المحاولة لاحقاً" };
  }
}

// ============================================================
// GET PRODUCT IMAGES
// ============================================================
export async function getProductImages(
  productId: string
): Promise<{ data: { id: string; url: string; alt_text: string | null; sort_order: number; is_primary: boolean }[] | null; error: string | null }> {
  const storeId = await getMerchantStoreId();

  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("product_images")
      .select("id, url, alt_text, sort_order, is_primary")
      .eq("product_id", productId)
      .eq("store_id", storeId)
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return { data, error: null };
  } catch (err: any) {
    console.error("Error fetching product images:", err);
    return { data: null, error: "فشل جلب صور المنتج" };
  }
}

// ============================================================
// UPLOAD PRODUCT IMAGE (base64 → store-assets bucket)
// ============================================================
export async function uploadProductImage(
  productId: string,
  fileBase64: string,
  fileName: string,
  fileType: string,
  altText: string = ""
): Promise<{ data: { id: string; url: string } | null; error: string | null }> {
  if (!productId || !fileBase64) {
    return { data: null, error: "بيانات غير مكتملة" };
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(fileType)) {
    return { data: null, error: "صيغة الصورة غير مدعومة (JPG, PNG, WEBP فقط)" };
  }

  const storeId = await getMerchantStoreId();
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("store_id", storeId)
    .single();

  if (!product) return { data: null, error: "المنتج غير موجود أو غير مصرح" };

  const base64Data = fileBase64.split(";base64,").pop();
  if (!base64Data) return { data: null, error: "محتوى الصورة غير صالح" };

  const fileBuffer = Buffer.from(base64Data, "base64");
  if (fileBuffer.length > 5 * 1024 * 1024) {
    return { data: null, error: "حجم الصورة كبير جداً (الحد الأقصى 5 ميجابايت)" };
  }

  const fileExt = fileName.split(".").pop() || "jpg";
  const filePath = `${storeId}/products/${productId}/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("store-assets")
    .upload(filePath, fileBuffer, { contentType: fileType, upsert: false });

  if (uploadError) {
    console.error("Product image upload error:", uploadError);
    return { data: null, error: "فشل رفع الصورة" };
  }

  const { data: { publicUrl } } = supabase.storage.from("store-assets").getPublicUrl(filePath);

  const { data: existingImages } = await supabase
    .from("product_images")
    .select("sort_order, is_primary")
    .eq("product_id", productId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextSortOrder = existingImages && existingImages.length > 0 ? existingImages[0].sort_order + 1 : 0;
  const isPrimary = !existingImages || existingImages.length === 0;

  const { data: imageRecord, error: insertError } = await supabase
    .from("product_images")
    .insert({
      store_id: storeId,
      product_id: productId,
      url: publicUrl,
      alt_text: altText || null,
      sort_order: nextSortOrder,
      is_primary: isPrimary,
    })
    .select("id, url")
    .single();

  if (insertError || !imageRecord) {
    console.error("Product image DB insert error:", insertError);
    return { data: null, error: "فشل حفظ بيانات الصورة" };
  }

  revalidatePath("/dashboard/products");
  return { data: imageRecord, error: null };
}

// ============================================================
// DELETE PRODUCT IMAGE
// ============================================================
export async function deleteProductImage(
  imageId: string
): Promise<{ success: boolean; error: string | null }> {
  const storeId = await getMerchantStoreId();

  try {
    const supabase = await createClient();

    const { error: deleteError } = await supabase
      .from("product_images")
      .delete()
      .eq("id", imageId)
      .eq("store_id", storeId);

    if (deleteError) throw deleteError;

    revalidatePath("/dashboard/products");
    return { success: true, error: null };
  } catch (err: any) {
    console.error("Error deleting product image:", err);
    return { success: false, error: "فشل حذف الصورة" };
  }
}
